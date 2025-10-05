// ফাইল: netlify/functions/bulk-send-notifications.js

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
  }
}
const db = admin.database();

// --- OneSignal API তথ্য ---
const ONE_SIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONE_SIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

// --- বাল্ক মেসেজ টেমপ্লেট ---
const BULK_MESSAGES = {
    promotion: {
        title: "Any's Beauty Corner",
        message: "নতুন অফার! এক্সক্লুসিভ ডিসকাউন্ট পেতে এখনই শপিং করুন।"
    },
    new_arrival: {
        title: "Any's Beauty Corner - নতুন প্রোডাক্ট",
        message: "আমাদের কালেকশনে যোগ হয়েছে নতুন প্রোডাক্ট! দেখে নিন এখনই।"
    },
    discount: {
        title: "Any's Beauty Corner - বিশেষ অফার",
        message: "বিশেষ ডিসকাউন্ট! সীমিত সময়ের জন্য ২০% পর্যন্ত ছাড়।"
    },
    custom: {
        title: "Any's Beauty Corner",
        message: "" // কাস্টম মেসেজের জন্য
    }
};

// --- OneSignal API কল হ্যান্ডলার ---
async function callOneSignalAPI(notificationPayload) {
    try {
        const response = await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Basic ${ONE_SIGNAL_REST_API_KEY}`
            },
            body: JSON.stringify(notificationPayload)
        });
        
        const responseText = await response.text();
        
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (parseError) {
            return {
                success: false,
                error: `OneSignal API Error: ${responseText}`,
                status: response.status
            };
        }
        
        return {
            success: response.ok,
            data: responseData,
            status: response.status
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// --- বাল্ক নোটিফিকেশন পাঠানোর ফাংশন ---
async function sendBulkNotification(messageType, customMessage = null, targetSegment = "all") {
    let notificationPayload = {
        app_id: ONE_SIGNAL_APP_ID,
        headings: { "en": BULK_MESSAGES[messageType].title },
        contents: { "en": customMessage || BULK_MESSAGES[messageType].message },
        url: "https://anysbeautycorner.netlify.app",
        chrome_web_icon: "https://anysbeautycorner.netlify.app/images/logo.png"
    };

    // টার্গেট সেগমেন্ট সেট করা
    if (targetSegment === "all") {
        notificationPayload.included_segments = ["Subscribed Users"];
    } else if (targetSegment === "active") {
        notificationPayload.filters = [
            { "field": "last_session", "relation": ">", "value": "30" }
        ];
    } else if (targetSegment === "inactive") {
        notificationPayload.filters = [
            { "field": "last_session", "relation": "<", "value": "30" }
        ];
    }

    return await callOneSignalAPI(notificationPayload);
}

// --- Firebase থেকে সব Player IDs পাওয়ার ফাংশন ---
async function getAllPlayerIds() {
    try {
        const usersRef = db.ref('users');
        const snapshot = await usersRef.once('value');
        const usersData = snapshot.val();
        
        const playerIds = [];
        
        if (usersData) {
            Object.keys(usersData).forEach(userId => {
                const user = usersData[userId];
                if (user.oneSignalPlayerId) {
                    playerIds.push(user.oneSignalPlayerId);
                }
            });
        }
        
        return playerIds;
    } catch (error) {
        return [];
    }
}

// --- স্পেসিফিক ইউজারদের নোটিফিকেশন পাঠানোর ফাংশন ---
async function sendToSpecificUsers(playerIds, messageType, customMessage = null) {
    if (!playerIds || playerIds.length === 0) {
        return { success: false, message: "No player IDs provided" };
    }

    const notificationPayload = {
        app_id: ONE_SIGNAL_APP_ID,
        include_player_ids: playerIds,
        headings: { "en": BULK_MESSAGES[messageType].title },
        contents: { "en": customMessage || BULK_MESSAGES[messageType].message },
        url: "https://anysbeautycorner.netlify.app",
        chrome_web_icon: "https://anysbeautycorner.netlify.app/images/logo.png"
    };

    return await callOneSignalAPI(notificationPayload);
}

// --- মূল Netlify Function হ্যান্ডলার ---
exports.handler = async (event) => {
    // CORS এবং রিকোয়েস্ট মেথড চেক করা
    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

    try {
        const body = JSON.parse(event.body);
        const { action, messageType, customMessage, targetSegment, specificUsers } = body;

        if (!action) {
            return { 
                statusCode: 400, 
                headers, 
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Action is required.' 
                }) 
            };
        }

        let result;

        if (action === 'bulk_send') {
            // বাল্ক নোটিফিকেশন পাঠানো
            if (!messageType) {
                return { 
                    statusCode: 400, 
                    headers, 
                    body: JSON.stringify({ 
                        success: false, 
                        message: 'Message type is required for bulk send.' 
                    }) 
                };
            }

            if (messageType === 'custom' && !customMessage) {
                return { 
                    statusCode: 400, 
                    headers, 
                    body: JSON.stringify({ 
                        success: false, 
                        message: 'Custom message is required for custom type.' 
                    }) 
                };
            }

            result = await sendBulkNotification(messageType, customMessage, targetSegment);

        } else if (action === 'get_users') {
            // সব ইউজারের Player IDs পাওয়া
            const playerIds = await getAllPlayerIds();
            return { 
                statusCode: 200, 
                headers, 
                body: JSON.stringify({ 
                    success: true, 
                    totalUsers: playerIds.length,
                    playerIds: playerIds 
                }) 
            };

        } else if (action === 'send_to_users') {
            // স্পেসিফিক ইউজারদের নোটিফিকেশন পাঠানো
            if (!specificUsers || !Array.isArray(specificUsers) || specificUsers.length === 0) {
                return { 
                    statusCode: 400, 
                    headers, 
                    body: JSON.stringify({ 
                        success: false, 
                        message: 'Specific users array is required.' 
                    }) 
                };
            }

            if (!messageType) {
                return { 
                    statusCode: 400, 
                    headers, 
                    body: JSON.stringify({ 
                        success: false, 
                        message: 'Message type is required.' 
                    }) 
                };
            }

            result = await sendToSpecificUsers(specificUsers, messageType, customMessage);

        } else {
            return { 
                statusCode: 400, 
                headers, 
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Invalid action.' 
                }) 
            };
        }

        if (!result.success) {
            return { 
                statusCode: 500, 
                headers, 
                body: JSON.stringify({ 
                    success: false, 
                    message: 'Failed to send notification.',
                    error: result.error
                }) 
            };
        }

        if (result.data.errors) {
            return { 
                statusCode: 500, 
                headers, 
                body: JSON.stringify({ 
                    success: false, 
                    message: 'OneSignal API error.',
                    errors: result.data.errors
                }) 
            };
        }

        return { 
            statusCode: 200, 
            headers, 
            body: JSON.stringify({ 
                success: true, 
                message: 'Operation completed successfully.',
                notificationId: result.data.id,
                recipients: result.data.recipients
            }) 
        };

    } catch (error) {
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