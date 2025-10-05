// =================================================================
// SECTION: NOTIFICATION MANAGEMENT
// =================================================================

// === START: TELEGRAM NOTIFICATION FUNCTION ===
/**
 * Netlify Function কে কল করে Telegram এ নোটিফিকেশন পাঠায়।
 * @param {object} orderData - অর্ডারের সমস্ত তথ্য
 */
async function sendTelegramNotification(orderData) {
    const url = '/.netlify/functions/telegram_notifier'; 
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            // যদি error আসে, শুধু warning দেবে, কিন্তু অর্ডার সেভ হওয়া বন্ধ করবে না।
        } else {
        }
        
    } catch (error) {
        // Network error হলেও, error throw করবে না।
    }
}
// === END: TELEGRAM NOTIFICATION FUNCTION ===

// === START: ONESIGNAL NOTIFICATION FUNCTION ===
async function sendNotificationForOrder(orderId) {
    try {
        const response = await fetch('/.netlify/functions/send-order-notification', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ orderId: orderId })
        });

        const result = await response.json();

        if (result.success) {
            // এখানে অ্যাডমিনকে একটি সফল বার্তা দেখাতে পারেন
        } else {
            // এখানে অ্যাডমিনকে একটি এরর বার্তা দেখাতে পারেন
        }

    } catch (error) {
    }
}
// === END: ONESIGNAL NOTIFICATION FUNCTION ===

export {
    sendTelegramNotification,
    sendNotificationForOrder
};