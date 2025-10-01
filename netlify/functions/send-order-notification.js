// ফাইল: netlify/functions/send-order-notification.js

const admin = require('firebase-admin');
const fetch = require('node-fetch');

// --- CORS হেডার (এই অংশটি গুরুত্বপূর্ণ) ---
const headers = {
  'Access-Control-Allow-Origin': '*', // যেকোনো অরিজিনকে অনুমতি দেওয়া হচ্ছে
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Firebase Admin SDK সেটআপ
const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('ascii'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: "https://nahid-6T14-default-rtdb.asia-southeast1.firebasedatabase.app"
    });
  } catch (e) {
    console.error('Firebase admin initialization error', e);
  }
}
const db = admin.database();

// OneSignal API তথ্য
const ONE_SIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONE_SIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

// স্ট্যাটাস অনুযায়ী মেসেজ
function getStatusMessage(status, orderId) { /* ... আপনার আগের কোড ... */ }

exports.handler = async (event) => {
    // ব্রাউজার প্রথমে একটি OPTIONS রিকোয়েস্ট পাঠাতে পারে CORS চেক করার জন্য
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers,
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    let orderId;
    try {
        const body = JSON.parse(event.body);
        orderId = body.orderId;
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

        // ... নোটিফিকেশন পাঠানোর বাকি লজিক এখানে অপরিবর্তিত থাকবে ...
        const notificationPayload = {
            app_id: ONE_SIGNAL_APP_ID,
            include_player_ids: [playerID],
            headings: { "en": "Any's Beauty Corner" },
            contents: { "en": getStatusMessage(status, orderId) },
            data: { "orderId": orderId }
        };

        await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Basic ${ONE_SIGNAL_REST_API_KEY}`
            },
            body: JSON.stringify(notificationPayload)
        });

        return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Notification sent successfully.' }) };

    } catch (error) {
        console.error('Error processing notification:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'An internal error occurred.' }) };
    }
};