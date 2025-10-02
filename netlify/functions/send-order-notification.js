// ফাইল: netlify/functions/send-order-notification.js

const admin = require('firebase-admin');
const fetch = require('node-fetch');

// --- CORS হেডার ---
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// --- Firebase Admin SDK সেটআপ ---
const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('ascii'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://nahid-6714-default-rtdb.asia-southeast1.firebasedatabase.app"
    });
  } catch (e) {
    console.error('Firebase admin initialization error', e);
  }
}
const db = admin.database();

// --- OneSignal API তথ্য ---
const ONE_SIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONE_SIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

// --- স্ট্যাটাস অনুযায়ী মেসেজ ---
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
    // CORS এবং রিকোয়েস্ট মেথড চেক করা
    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

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

        if (!orderData) {
            return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: 'Order not found.' }) };
        }

        const playerID = orderData.oneSignalPlayerId;
        const status = orderData.status;

        if (!playerID) {
            return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'No Player ID found, notification skipped.' }) };
        }

        // --- প্রোডাক্টের ছবি বের করার জন্য নতুন কোড ---
        let productImage = null;
        if (orderData.cartItems && orderData.cartItems.length > 0) {
            // প্রথম প্রোডাক্টের ছবিটি নেওয়া হচ্ছে
            const firstItem = orderData.cartItems[0];
            if (firstItem.image) {
                productImage = firstItem.image;
            }
        }
        // ------------------------------------------

        const notificationPayload = {
            app_id: ONE_SIGNAL_APP_ID,
            include_player_ids: [playerID],
            headings: { "en": "Any's Beauty Corner" },
            contents: { "en": getStatusMessage(status, orderId) },
            data: { "orderId": orderId },
            
            // --- নোটিফিকেশনে ছবি যুক্ত করার জন্য নতুন প্যারামিটার ---
            big_picture: productImage, // বড় ছবি হিসেবে দেখানো হবে (Android, Chrome Desktop)
            chrome_web_image: productImage // Chrome ওয়েব পুশের জন্য
            // ----------------------------------------------------
        };

        // যদি কোনো ছবি না থাকে, তাহলে এই প্যারামিটারগুলো না পাঠানোই ভালো
        if (!productImage) {
            delete notificationPayload.big_picture;
            delete notificationPayload.chrome_web_image;
        }

        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Basic ${ONE_SIGNAL_REST_API_KEY}`
            },
            body: JSON.stringify(notificationPayload)
        });
        
        const responseData = await response.json();
        if (responseData.errors) {
            console.error("OneSignal returned an error:", responseData.errors);
        }

        return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Notification sent successfully.' }) };

    } catch (error) {
        console.error('Error processing notification:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'An internal error occurred.' }) };
    }
};