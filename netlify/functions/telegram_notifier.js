// ফাইল: netlify/functions/telegram_notifier.js
// Netlify Function হিসেবে কাজ করবে

const fetch = require('node-fetch'); 

// ===============================================
// ১. আপনার টেলিগ্রামের তথ্য
// ===============================================
// For local development, you can use a .env file with this variable.
// In Netlify, set this in the build & deploy environment variables.
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7516151873:AAESiHvoSJovELfQ_9HrDv-25BQuBFNYnCs'; 
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '6247184686';

// Helper function to format cart items
function formatCartItems(cartItems) {
    let details = "";
    let index = 1;
    for (const item of cartItems) {
        // এখানে নিশ্চিত করা হয়েছে যে cartItems-এর স্ট্রাকচার ঠিক আছে
        const itemName = item.name || 'N/A';
        const quantity = item.quantity || 1;
        const price = item.price || 0;
        const totalItemPrice = quantity * price;
        details += `${index}. ${itemName} (x${quantity}) - ${totalItemPrice} টাকা\n`;
        index++;
    }
    return details;
}


// ===============================================
// ২. Netlify Function handler
// ===============================================
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    let orderData;
    try {
        orderData = JSON.parse(event.body); 
    } catch (error) {
        return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Invalid JSON format.' }) };
    }

    // ডেটা এক্সট্র্যাক্ট করা (আপনার Firebase এবং অর্ডার ফর্ম থেকে আসা ডেটা)
    const customerName = orderData.customerName || 'N/A';
    const phoneNumber = orderData.phoneNumber || 'N/A';
    const address = orderData.address || 'N/A';
    const orderId = orderData.orderId || 'N/A';
    const deliveryLocation = orderData.deliveryLocation || 'N/A';
    const paymentMethod = orderData.paymentMethod || 'N/A';
    const subTotal = orderData.subTotal || '0';
    const deliveryFee = orderData.deliveryFee || '0';
    const totalAmount = orderData.totalAmount || '0';
    const orderDate = new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' });

    const productDetails = formatCartItems(orderData.cartItems || []);

    // Telegram মেসেজ ফরম্যাট
    const messageText = `
🚨 <b>নতুন অর্ডার এসেছে!</b> (ID: ${orderId}) 🚨
<b>সময়:</b> ${orderDate}
➖➖➖➖➖➖➖➖➖➖
<b>👤 গ্রাহকের তথ্য:</b>
<b>নাম:</b> ${customerName}
<b>ফোন:</b> <a href="tel:${phoneNumber}">${phoneNumber}</a>
<b>ঠিকানা:</b> ${address}
<b>এলাকা:</b> ${deliveryLocation}
➖➖➖➖➖➖➖➖➖➖
<b>🛍️ পণ্যের তালিকা:</b>\n${productDetails}
➖➖➖➖➖➖➖➖➖➖
<b>💰 পেমেন্টের তথ্য:</b>
<b>পেমেন্ট পদ্ধতি:</b> ${paymentMethod}
<b>সাব-টোটাল:</b> ${subTotal} টাকা
<b>ডেলিভারি ফি:</b> ${deliveryFee} টাকা
<b>মোট মূল্য:</b> <b>${totalAmount} টাকা</b>
`;

    // Telegram API কল করা
    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    try {
        const response = await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: messageText,
                parse_mode: 'HTML'
            })
        });

        const data = await response.json();

        if (response.ok && data.ok) {
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'Notification sent successfully!', telegram_response: data })
            };
        } else {
            return {
                statusCode: 500,
                body: JSON.stringify({ success: false, message: 'Failed to send Telegram notification.', error: data.description || 'Unknown Telegram error' })
            };
        }

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: 'Internal server error during API call.', error: error.message })
        };
    }
};
