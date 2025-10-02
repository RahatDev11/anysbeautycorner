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
    // --- ধাপ ১: এনভায়রনমেন্ট ভেরিয়েবল এবং রিকোয়েস্ট ডেটা লগ করা ---
    console.log("--- STARTING FUNCTION EXECUTION ---");
    try {
        console.log("Received Order ID:", JSON.parse(event.body).orderId);
    } catch (e) { console.log("Could not parse orderId from body"); }
    console.log("OneSignal App ID from env:", process.env.ONESIGNAL_APP_ID ? "FOUND" : "NOT FOUND");
    console.log("OneSignal REST API Key from env (first 5 chars):", process.env.ONESIGNAL_REST_API_KEY ? process.env.ONESIGNAL_REST_API_KEY.substring(0, 5) + "..." : "NOT FOUND");
    console.log("Firebase Service Account from env:", process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ? "FOUND" : "NOT FOUND");
    // --------------------------------------------------------

    // CORS প্রি-ফ্লাইট রিকোয়েস্ট হ্যান্ডেল করা
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }
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

        if (!orderData) {
            console.error(`Order with ID ${orderId} not found in Firebase.`);
            return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: 'Order not found.' }) };
        }

        const playerID = orderData.oneSignalPlayerId;
        const status = orderData.status;

        if (!playerID) {
            console.log(`No Player ID found for order ${orderId}. Skipping notification.`);
            return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'No Player ID found, notification skipped.' }) };
        }

        const notificationPayload = {
            app_id: ONE_SIGNAL_APP_ID,
            include_player_ids: [playerID],
            headings: { "en": "Any's Beauty Corner" },
            contents: { "en": getStatusMessage(status, orderId) },
            data: { "orderId": orderId }
        };

        // --- ধাপ ২: OneSignal-কে কী ডেটা পাঠানো হচ্ছে তা লগ করা ---
        console.log("Sending payload to OneSignal:", JSON.stringify(notificationPayload, null, 2));
        // ----------------------------------------------------

        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Basic ${ONE_SIGNAL_REST_API_KEY}`
            },
            body: JSON.stringify(notificationPayload)
        });

        const responseData = await response.json();

        // --- ধাপ ৩: OneSignal থেকে কী উত্তর আসছে তা লগ করা ---
        console.log("Received response from OneSignal:", responseData);
        // --------------------------------------------------
        
        if (responseData.errors) {
            console.error("OneSignal returned an error:", responseData.errors);
            return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'OneSignal returned an error.', details: responseData.errors }) };
        }

        console.log("--- FUNCTION EXECUTION SUCCESSFUL ---");
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Notification sent successfully.', oneSignalResponse: responseData }) };

    } catch (error) {
        console.error('Error processing notification request:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'An internal error occurred.' }) };
    }
};