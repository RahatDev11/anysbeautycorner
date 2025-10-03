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

// --- নোটিফিকেশন পাঠানোর ফাংশন (সরলীকৃত) ---
async function sendNotification(playerID, orderId, status, productImage = null) {
    console.log('🔍 Debug: Starting sendNotification');
    console.log('🔍 Debug: Player ID:', playerID);
    console.log('🔍 Debug: Order ID:', orderId);
    console.log('🔍 Debug: Status:', status);
    console.log('🔍 Debug: OneSignal App ID exists:', !!ONE_SIGNAL_APP_ID);
    console.log('🔍 Debug: OneSignal API Key exists:', !!ONE_SIGNAL_REST_API_KEY);

    const targetUrl = `https://anysbeautycorner.netlify.app/order-track.html?orderId=${orderId}`;
    
    const notificationPayload = {
        app_id: ONE_SIGNAL_APP_ID,
        include_player_ids: [playerID],
        headings: { "en": "Any's Beauty Corner" },
        contents: { "en": getStatusMessage(status, orderId) },
        web_url: targetUrl,
        data: { "orderId": orderId }
    };

    // ইমেজ থাকলে শুধুমাত্র যোগ করা
    if (productImage) {
        notificationPayload.big_picture = productImage;
        notificationPayload.chrome_web_image = productImage;
    }

    console.log('🔍 Debug: Notification Payload:', JSON.stringify(notificationPayload, null, 2));

    try {
        console.log('🔍 Debug: Making API call to OneSignal...');
        
        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Basic ${ONE_SIGNAL_REST_API_KEY}`
            },
            body: JSON.stringify(notificationPayload)
        });
        
        console.log('🔍 Debug: Response Status:', response.status);
        console.log('🔍 Debug: Response OK:', response.ok);
        
        // রেসপন্স টেক্সট আগে পড়া
        const responseText = await response.text();
        console.log('🔍 Debug: Raw Response Text:', responseText);
        
        // রেসপন্স টেক্সট চেক করা
        if (!responseText || responseText.trim() === '') {
            console.log('🔍 Debug: Empty response from OneSignal');
            return {
                success: false,
                error: 'Empty response from OneSignal API',
                status: response.status
            };
        }

        // JSON পার্স করার চেষ্টা করা
        let responseData;
        try {
            responseData = JSON.parse(responseText);
            console.log('🔍 Debug: Parsed Response Data:', responseData);
        } catch (parseError) {
            console.error('❌ JSON Parse Error:', parseError);
            console.error('❌ Response that failed to parse:', responseText);
            
            // যদি JSON পার্স না হয়, তাহলে আমরা raw error return করব
            return {
                success: false,
                error: `OneSignal API returned non-JSON response: ${responseText}`,
                status: response.status,
                rawResponse: responseText
            };
        }
        
        return {
            success: response.ok,
            data: responseData,
            status: response.status
        };
        
    } catch (error) {
        console.error('❌ Fetch Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// --- মূল Netlify Function হ্যান্ডলার ---
exports.handler = async (event) => {
    console.log('🔍 Debug: Function started');
    console.log('🔍 Debug: HTTP Method:', event.httpMethod);
    
    // CORS এবং রিকোয়েস্ট মেথড চেক করা
    if (event.httpMethod === 'OPTIONS') {
        console.log('🔍 Debug: Handling OPTIONS request');
        return { statusCode: 204, headers, body: '' };
    }
    
    if (event.httpMethod !== 'POST') {
        console.log('🔍 Debug: Method not allowed');
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    console.log('🔍 Debug: Request Body:', event.body);

    let orderId;
    try {
        const body = JSON.parse(event.body);
        orderId = body.orderId;
        if (!orderId) throw new Error('Order ID is required.');
        console.log('🔍 Debug: Order ID parsed:', orderId);
    } catch (error) {
        console.error('❌ Error parsing request:', error);
        return { 
            statusCode: 400, 
            headers, 
            body: JSON.stringify({ 
                success: false, 
                message: 'Invalid JSON or missing orderId.' 
            }) 
        };
    }

    try {
        console.log('🔍 Debug: Fetching order from Firebase...');
        const orderRef = db.ref(`orders/${orderId}`);
        const snapshot = await orderRef.once('value');
        const orderData = snapshot.val();

        if (!orderData) {
            console.log('❌ Order not found:', orderId);
            return { 
                statusCode: 404, 
                headers, 
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Order not found.' 
                }) 
            };
        }

        console.log('🔍 Debug: Order data found:', orderData);

        const playerID = orderData.oneSignalPlayerId;
        const status = orderData.status;

        console.log('🔍 Debug: Player ID from order:', playerID);
        console.log('🔍 Debug: Status from order:', status);

        if (!playerID) {
            console.log('⚠️ No Player ID found, skipping notification');
            return { 
                statusCode: 200, 
                headers, 
                body: JSON.stringify({ 
                    success: true, 
                    message: 'No Player ID found, notification skipped.' 
                }) 
            };
        }

        let productImage = null;
        if (orderData.cartItems && orderData.cartItems.length > 0) {
            const firstItem = orderData.cartItems[0];
            if (firstItem.image) {
                productImage = firstItem.image;
            }
        }

        console.log('🔍 Debug: Calling sendNotification...');
        const notificationResult = await sendNotification(playerID, orderId, status, productImage);
        
        console.log('🔍 Debug: Notification result:', notificationResult);

        if (!notificationResult.success) {
            console.error("❌ OneSignal API Error:", notificationResult.error);
            return { 
                statusCode: 500, 
                headers, 
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Failed to send notification.',
                    error: notificationResult.error,
                    rawResponse: notificationResult.rawResponse
                }) 
            };
        }

        if (notificationResult.data && notificationResult.data.errors) {
            console.error("❌ OneSignal returned errors:", notificationResult.data.errors);
            return { 
                statusCode: 500, 
                headers, 
                body: JSON.stringify({ 
                    success: false, 
                    message: 'OneSignal API error.',
                    errors: notificationResult.data.errors
                }) 
            };
        }

        console.log('✅ Notification sent successfully');
        return { 
            statusCode: 200, 
            headers, 
            body: JSON.stringify({ 
                success: true, 
                message: 'Notification sent successfully.',
                notificationId: notificationResult.data ? notificationResult.data.id : 'unknown'
            }) 
        };

    } catch (error) {
        console.error('❌ Error processing notification:', error);
        return { 
            statusCode: 500, 
            headers, 
            body: JSON.stringify({ 
                success: false, 
                message: 'An internal error occurred.',
                error: error.message
            }) 
        };
    }
};