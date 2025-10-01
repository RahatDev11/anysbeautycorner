const admin = require('firebase-admin');
const fetch = require('node-fetch'); // Ensure node-fetch is still included for OneSignal API calls

// Firebase Admin SDK Initialization
// Service Account Key environment variable থেকে নেওয়া হচ্ছে
try {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
    databaseURL: "https://nahid-6714-default-rtdb.asia-southeast1.firebasedatabase.app" // আপনার ডেটাবেস URL দিন
  });
} catch (error) {
  console.error("Firebase Admin initialization failed:", error);
  // যদি আপনার ডেটাবেস URL বা Service Account Key ভুল থাকে, তবে এখানে ত্রুটি আসবে।
}

const db = admin.database();

// Environment Variables (already present in original file, keep them)
// const RTDB_URL = process.env.RTDB_URL; // No longer needed if using Admin SDK
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { orderId, newStatus, oneSignalPlayerId } = JSON.parse(event.body);
        if (!orderId || !newStatus) {
            return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Missing orderId or newStatus' }) };
        }

        // 1. Firebase Realtime Database Update
        const orderRef = db.ref(`orders/${orderId}`);
        await orderRef.update({ orderStatus: newStatus });

        // 2. OneSignal Notification Sending
        let notificationSent = false;
        
        // oneSignalPlayerId যাচাই
        if (oneSignalPlayerId && oneSignalPlayerId !== 'null' && oneSignalPlayerId !== 'NO_ID') {
            
            // Notification Content
            const message = `আপনার অর্ডার নং: ${orderId} এর স্ট্যাটাস এখন ${newStatus}. বিস্তারিত জানতে ক্লিক করুন।`;
            const heading = `অর্ডার স্ট্যাটাস আপডেট`;

            const notificationData = {
                app_id: ONESIGNAL_APP_ID, // Use environment variable
                contents: { "en": message, "bn": message },
                headings: { "en": heading, "bn": heading },
                include_player_ids: [oneSignalPlayerId],
                // ইউজার ক্লিক করলে ট্র্যাকিং পেজে নিয়ে যাবে
                url: `https://yourdomain.com/order-track.html?orderId=${orderId}`, // <<< আপনার ডোমেইন বসান
            };
            
            const onesignalResponse = await fetch('https://onesignal.com/api/v1/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Authorization': `Basic ${REST_API_KEY}` // Use environment variable
                },
                body: JSON.stringify(notificationData),
            });
            
            const onesignalResult = await onesignalResponse.json();
            
            if (onesignalResponse.ok && onesignalResult.id) {
                notificationSent = true;
            } else {
                console.error("OneSignal API Error:", onesignalResult);
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                message: `Status updated to ${newStatus}.`,
                notificationSent: notificationSent,
                notificationPlayerId: oneSignalPlayerId 
            })
        };

    } catch (error) {
        console.error('Lambda Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: error.message })
        };
    }
};