const fetch = require('node-fetch');

// Environment Variables
const RTDB_URL = process.env.RTDB_URL;
const FIREBASE_SECRET = process.env.FIREBASE_SECRET;
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY; // Using ONESIGNAL_REST_API_KEY for consistency

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const { orderId, newStatus, oneSignalPlayerId } = JSON.parse(event.body);

        if (!orderId || !newStatus || !oneSignalPlayerId) {
            return { statusCode: 400, body: 'Missing required fields' };
        }

        // --- A. Realtime Database এ স্ট্যাটাস আপডেট ---
        
        const updateUrl = `${RTDB_URL}/orders/${orderId}.json?auth=${FIREBASE_SECRET}`;
        
        const rtdbUpdate = {
            orderStatus: newStatus,
            lastUpdated: Date.now()
        };

        // Firebase Realtime Database এ স্ট্যাটাস আপডেট করা
        await fetch(updateUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rtdbUpdate)
        });

        // --- B. OneSignal নোটিফিকেশন পাঠানো ---

        const statusMap = {
            'Confirmed': '✅ আপনার অর্ডার কনফার্ম করা হয়েছে। আমরা দ্রুত এটি প্রস্তুত করব।',
            'Packaging': '📦 আপনার অর্ডার প্যাকেজিং-এ আছে। এটি পাঠানোর জন্য প্রস্তুত হচ্ছে।',
            'Shipped': '🚚 আপনার অর্ডার পাঠানো হয়েছে! এটি শীঘ্রই আপনার কাছে পৌঁছাবে।',
            'Delivered': '🎉 আপনার অর্ডার সফলভাবে ডেলিভারি হয়েছে।',
            'Canceled': '❌ দুঃখিত, আপনার অর্ডার বাতিল করা হয়েছে।',
            // আপনি আপনার প্রয়োজন মতো 'processing' বা অন্য স্ট্যাটাস যোগ করতে পারেন।
        };

        const message = statusMap[newStatus] || `আপনার অর্ডারের নতুন স্ট্যাটাস: ${newStatus}`;
        
        const oneSignalPayload = {
            app_id: ONESIGNAL_APP_ID,
            contents: { "en": message }, // English is often required, but you can use "bn" for Bengali if configured
            include_player_ids: [oneSignalPlayerId],
            data: { "orderId": orderId, "status": newStatus }
        };

        // OneSignal API কে নোটিফিকেশন পাঠানোর অনুরোধ
        const oneSignalResponse = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${REST_API_KEY}`
            },
            body: JSON.stringify(oneSignalPayload)
        });

        const result = await oneSignalResponse.json();
        
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: "Status updated and notification sent." })
        };

    } catch (error) {
        console.error("Function Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: error.message }) 
        };
    }
};