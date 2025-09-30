
const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Firebase Admin SDK ইনিশিয়ালাইজ করুন
// Netlify environment variables থেকে আপনার service account key নিন
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
      databaseURL: "https://nahid-6714-default-rtdb.asia-southeast1.firebasedatabase.app"
    });
  } catch (e) {
    console.error('Firebase admin initialization error', e.stack);
  }
}

const db = admin.database();

// OneSignal API credentials
const ONE_SIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONE_SIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

// স্ট্যাটাস অনুযায়ী মেসেজ তৈরি করার ফাংশন
function getNotificationMessage(status) {
    const messages = {
        processing: 'আপনার অর্ডারটি প্রসেসিং চলছে।',
        confirmed: 'আপনার অর্ডারটি কনফার্ম করা হয়েছে।',
        packaging: 'আপনার অর্ডারটি প্যাকেজিং করা হচ্ছে।',
        shipped: 'আপনার অর্ডারটি ডেলিভারির জন্য পাঠানো হয়েছে।',
        delivered: 'আপনার অর্ডারটি সফলভাবে ডেলিভারি করা হয়েছে।',
        cancelled: 'আপনার অর্ডারটি বাতিল করা হয়েছে।',
        failed: 'আপনার অর্ডারটি ব্যর্থ হয়েছে।'
    };
    return messages[status] || `আপনার অর্ডারের স্ট্যাটাস আপডেট হয়েছে: ${status}`;
}

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    let orderId;
    try {
        const body = JSON.parse(event.body);
        orderId = body.orderId;
        if (!orderId) {
            throw new Error('Order ID is required.');
        }
    } catch (error) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Bad Request: Invalid JSON or missing orderId.' }) };
    }

    try {
        // Firebase থেকে অর্ডার ডেটা পান
        const orderRef = db.ref(`orders/${orderId}`);
        const snapshot = await orderRef.once('value');
        const orderData = snapshot.val();

        if (!orderData) {
            return { statusCode: 404, body: JSON.stringify({ error: 'Order not found.' }) };
        }

        const oneSignalPlayerId = orderData.oneSignalPlayerId;
        const orderStatus = orderData.orderStatus;

        // যদি Player ID না থাকে, তাহলে নোটিফিকেশন পাঠানো সম্ভব নয়
        if (!oneSignalPlayerId) {
            console.log(`No OneSignal Player ID found for order ${orderId}. Skipping notification.`);
            return { statusCode: 200, body: JSON.stringify({ message: 'No Player ID found, notification skipped.' }) };
        }

        const notification = {
            app_id: ONE_SIGNAL_APP_ID,
            include_player_ids: [oneSignalPlayerId],
            headings: { en: `আপনার অর্ডার আপডেট` },
            contents: { en: getNotificationMessage(orderStatus) },
            data: { orderId: orderId } // নোটিফিকেশনে অতিরিক্ত ডেটা (যেমন অর্ডার আইডি) পাঠানো
        };

        // OneSignal API তে নোটিফিকেশন পাঠান
        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Basic ${ONE_SIGNAL_REST_API_KEY}`
            },
            body: JSON.stringify(notification)
        });

        const responseData = await response.json();

        if (responseData.errors) {
            console.error('OneSignal Error:', responseData.errors);
            // REST API কী ভুল হলে এখানে এরর দেখাবে
            if (responseData.errors.includes('The REST API Key is invalid.')) {
                 return { statusCode: 401, body: JSON.stringify({ error: 'OneSignal REST API Key is invalid.' }) };
            }
            return { statusCode: 500, body: JSON.stringify({ error: 'Failed to send notification.', details: responseData.errors }) };
        }

        console.log('Notification sent successfully:', responseData);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Notification sent successfully.', result: responseData })
        };

    } catch (error) {
        console.error('Error processing notification request:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'An internal error occurred.', details: error.message })
        };
    }
};
