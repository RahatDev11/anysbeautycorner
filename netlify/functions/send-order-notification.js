// ফাইল: netlify/functions/send-order-notification.js

const admin = require('firebase-admin');
const fetch = require('node-fetch');

// --- CORS হেডার (যেকোনো ডোমেইন থেকে রিকোয়েস্ট গ্রহণের জন্য) ---
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// --- Firebase Admin SDK সেটআপ ---
// নিশ্চিত করুন Netlify এনভায়রনমেন্ট ভেরিয়েবল সঠিকভাবে সেট করা আছে
const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('ascii'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://nahid-6714-default-rtdb.asia-southeast1.firebasedatabase.app"
    });
  } catch (e) {
    console.error('Firebase admin initialization error:', e);
  }
}
const db = admin.database();

// --- OneSignal API তথ্য ---
const ONE_SIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONE_SIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

// --- স্ট্যাটাস অনুযায়ী মেসেজ তৈরি করার ফাংশন ---
function getStatusMessage(status, orderId) {
    const messages = {
        processing: `আপনার অর্ডার (#${orderId.slice(-4)}) টি প্রসেসিং চলছে।`,
        confirmed: `আপনার অর্ডার (#${orderId.slice(-4)}) টি কনফার্ম করা হয়েছে।`,
        packaging: `আপনার অর্ডার (#${orderId.slice(-4)}) টি প্যাকেজিং করা হচ্ছে।`,
        shipped: `আপনার অর্ডারটি (#${orderId.slice(-4)}) ডেলিভারির জন্য পাঠানো হয়েছে।`,
        delivered: `আপনার অর্ডার (#${orderId.slice(-4)}) টি সফলভাবে ডেলিভারি করা হয়েছে।`,
        cancelled: `আপনার অর্ডার (#${orderId.slice(-4)}) টি বাতিল করা হয়েছে।`,
    };
    return messages[status] || `আপনার অর্ডারের স্ট্যাটাস এখন: ${status}`;
}

// --- মূল Netlify Function হ্যান্ডলার ---
exports.handler = async (event) => {
    // ব্রাউজার প্রথমে একটি OPTIONS রিকোয়েস্ট পাঠাতে পারে CORS চেক করার জন্য, সেটিকে হ্যান্ডেল করা হচ্ছে
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204, // No Content
            headers
        };
    }

    // শুধুমাত্র POST রিকোয়েস্ট গ্রহণ করা হবে
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    let orderId;
    try {
        orderId = JSON.parse(event.body).orderId;
        if (!orderId) throw new Error('Order ID is required.');
    } catch (error) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Invalid JSON or missing orderId.' }) };
    }

    try {
        const orderRef = db.ref(`orders/${orderId}`);
        const snapshot = await orderRef.once('value');
        const orderData = snapshot.val();

        if (!orderData || !orderData.userId) {
            return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: 'Order or UserID not found.' }) };
        }

        const playerID = orderData.oneSignalPlayerId;
        const status = orderData.status;
        const userId = orderData.userId;
        const message = getStatusMessage(status, orderId);

        // ধাপ ১: নোটিফিকেশনটি Firebase ডাটাবেজে সেভ করা
        const notificationData = {
            message: message,
            orderId: orderId,
            timestamp: Date.now(),
            isRead: false
        };
        await db.ref(`notifications/${userId}`).push(notificationData);
        
        // যদি Player ID না থাকে, তাহলে পুশ না পাঠিয়েই সফলভাবে শেষ করা
        if (!playerID) {
            return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Notification saved to DB, but push skipped (no Player ID).' }) };
        }
        
        // ধাপ ২: OneSignal-কে পুশ নোটিফিকেশন পাঠানোর জন্য রিকোয়েস্ট তৈরি করা
        const targetUrl = `https://anysbeautycorner.netlify.app/order-track.html?orderId=${orderId}`;
        let productImage = (orderData.cartItems && orderData.cartItems.length > 0) ? orderData.cartItems[0].image : null;
        
        const notificationPayload = {
            app_id: ONE_SIGNAL_APP_ID,
            include_player_ids: [playerID],
            headings: { "en": "Any's Beauty Corner" },
            contents: { "en": message },
            web_url: targetUrl,
            data: { "orderId": orderId },
            big_picture: productImage,
            chrome_web_image: productImage
        };

        if (!productImage) {
            delete notificationPayload.big_picture;
            delete notificationPayload.chrome_web_image;
        }

        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=utf-8', 'Authorization': `Basic ${ONE_SIGNAL_REST_API_KEY}` },
            body: JSON.stringify(notificationPayload)
        });
        
        const responseData = await response.json();
        if (responseData.errors) {
            console.error("OneSignal returned an error:", responseData.errors);
        }

        return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Notification sent and saved successfully.' }) };

    } catch (error) {
        console.error('Error processing notification request:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'An internal error occurred.' }) };
    }
};