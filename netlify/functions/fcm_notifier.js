// ========================================================================
// ফাইল: netlify/functions/fcm_notifier.js
// Firebase Admin SDK ব্যবহার করে পুশ নোটিফিকেশন পাঠানোর জন্য আপডেট করা কোড
// ========================================================================

// firebase-admin লাইব্রেরি ইম্পোর্ট করা হচ্ছে
const admin = require('firebase-admin');

// Netlify এনভায়রনমেন্ট ভ্যারিয়েবল থেকে Base64 এনকোডেড সার্ভিস অ্যাকাউন্ট কী'টি নেওয়া হচ্ছে
const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

// ভ্যারিয়েবলটি সেট করা না থাকলে একটি এরর দেখানো হবে
if (!serviceAccountBase64) {
  console.error('FATAL ERROR: FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set.');
  // লাইভ পরিবেশে ফাংশনটিকে কাজ করা থেকে বিরত রাখা হচ্ছে
  return {
    statusCode: 500,
    body: JSON.stringify({ success: false, message: 'Server configuration error: Firebase service account not found.' })
  };
}

// Base64 স্ট্রিংটিকে ডিকোড করে আসল JSON অবজেক্টে পরিণত করা হচ্ছে
const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('ascii'));

// Firebase Admin অ্যাপটি আগে থেকে ইনিশিয়ালাইজ করা না থাকলে, নতুন করে করা হচ্ছে
// এটি নিশ্চিত করে যে ফাংশনটি একাধিকবার কল হলেও অ্যাপটি শুধু একবারই ইনিশিয়ালাইজ হবে
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
  }
}

// Netlify Function-এর মূল হ্যান্ডলার
exports.handler = async (event) => {
    // শুধুমাত্র POST রিকোয়েস্ট গ্রহণ করা হবে
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    let data;
    try {
        data = JSON.parse(event.body);
    } catch (error) {
        return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Invalid JSON format in request body.' }) };
    }

    // রিকোয়েস্ট থেকে প্রয়োজনীয় তথ্যগুলো নেওয়া হচ্ছে
    const { fcmToken, title, body, click_action } = data;

    // কোনো তথ্য অনুপস্থিত থাকলে এরর পাঠানো হচ্ছে
    if (!fcmToken || !title || !body) {
        return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Missing required fields: fcmToken, title, or body.' }) };
    }

    // নোটিফিকেশনের জন্য মেসেজ অবজেক্ট তৈরি করা হচ্ছে
    const message = {
        token: fcmToken, // কাস্টমারের ডিভাইসের ইউনিক টোকেন
        notification: {
            title: title, // নোটিফিকেশনের শিরোনাম
            body: body,   // নোটিফিকেশনের মূল বার্তা
        },
        webpush: {
            // এই অংশটি বিশেষভাবে ওয়েব পুশ নোটিফিকেশনের জন্য
            // নোটিফিকেশনে ক্লিক করলে কোন লিঙ্কে যাবে তা নির্ধারণ করে
            fcm_options: {
              link: click_action || '/' // ডিফল্টভাবে হোমপেজে যাবে
            }
        }
    };

    try {
        // Firebase Admin SDK ব্যবহার করে মেসেজটি পাঠানো হচ্ছে
        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, message: 'Notification sent successfully!', fcm_response: response })
        };
    } catch (error) {
        console.error('Error sending FCM message:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: 'Failed to send FCM notification.', error: error.message })
        };
    }
};
