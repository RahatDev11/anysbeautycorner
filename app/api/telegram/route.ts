import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const orderData = await req.json();

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      console.warn("Telegram BOT_TOKEN or CHAT_ID is missing.");
      return NextResponse.json({ success: true, message: "Skipped notification (credentials missing)" });
    }

    const {
      customerName = 'N/A',
      phoneNumber = 'N/A',
      address = 'N/A',
      orderId = 'N/A',
      deliveryLocation = 'N/A',
      paymentMethod = 'N/A',
      subTotal = '0',
      deliveryFee = '0',
      totalAmount = '0',
      cartItems = []
    } = orderData;

    let productDetails = "";
    cartItems.forEach((item: any, i: number) => {
      productDetails += `${i + 1}. ${item.name || 'N/A'} (x${item.quantity || 1}) - ${(item.price * item.quantity).toFixed(2)} টাকা\n`;
    });

    const messageText = `
🚨 <b>নতুন অর্ডার এসেছে!</b> (ID: ${orderId}) 🚨
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

    const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
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
    return NextResponse.json({ success: response.ok, data });

  } catch (error: any) {
    console.error("Telegram error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
