'use client';

import { useState, Suspense, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { useRouter, useSearchParams } from 'next/navigation';
import { database } from '@/lib/firebase';
import { ref, set, runTransaction } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { toBengaliNumber } from '@/lib/utils';

function OrderFormContent() {
  const { cart, clearCart } = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    address: '',
    deliveryLocation: 'insideDhaka',
    outsideDhakaLocation: '',
    deliveryNote: '',
    deliveryPaymentMethod: '',
    paymentNumber: '',
    transactionId: '',
  });

  const itemsToOrder = useMemo(() => {
    const urlCartData = searchParams.get('cart');
    if (urlCartData) {
      try {
        return JSON.parse(decodeURIComponent(urlCartData));
      } catch (e) {
        return cart;
      }
    }
    return cart;
  }, [searchParams, cart]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isOutsideDhaka = formData.deliveryLocation === 'outsideDhaka';
  const deliveryFee = isOutsideDhaka ? 160 : 70;
  const subTotal = itemsToOrder.reduce((sum: number, item: any) => sum + (Number(item.price) * item.quantity), 0);
  const totalAmount = subTotal + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (itemsToOrder.length === 0) {
      alert('আপনার কার্ট খালি!');
      return;
    }

    setLoading(true);
    try {
      const today = new Date();
      const year = today.getFullYear().toString().slice(-2);
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const dateString = `${today.getFullYear()}-${month}-${day}`;

      const counterRef = ref(database, `counters/${dateString}`);
      
      const transactionResult = await runTransaction(counterRef, (currentData) => {
        return currentData === null ? 1 : currentData + 1;
      });

      if (transactionResult.committed) {
        const orderNumber = String(transactionResult.snapshot.val()).padStart(3, '0');
        const orderId = `${year}${day}${month}${orderNumber}`;
        
        const auth = getAuth();
        const user = auth.currentUser;
        // eslint-disable-next-line react-hooks/purity
        const now = Date.now();
        const userId = user ? user.uid : `GUEST_${now}`;
        const userEmail = user ? user.email : 'guest@checkout.com';

        const orderData = {
          orderId,
          customerName: formData.customerName,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          deliveryLocation: formData.deliveryLocation === 'insideDhaka' ? 'ঢাকার ভেতরে' : 'ঢাকার বাইরে',
          deliveryFee,
          subTotal: subTotal.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          cartItems: itemsToOrder,
          orderDate: new Date().toISOString(),
          status: 'processing',
          userId,
          customerEmail: userEmail,
          deliveryNote: formData.deliveryNote || 'N/A',
          outsideDhakaLocation: isOutsideDhaka ? formData.outsideDhakaLocation : 'N/A',
          paymentNumber: isOutsideDhaka ? formData.paymentNumber : 'N/A',
          transactionId: isOutsideDhaka ? formData.transactionId : 'N/A',
        };

        const newOrderRef = ref(database, `orders/${orderId}`);
        await set(newOrderRef, orderData);

        // Save for guest tracking
        if (userId.startsWith('GUEST_')) {
          const myOrders = JSON.parse(localStorage.getItem('myOrders') || '[]');
          myOrders.push(orderId);
          localStorage.setItem('myOrders', JSON.stringify(myOrders));
        } else {
          // Save link to user's orders
          await set(ref(database, `users/${userId}/orders/${orderId}`), true);
        }

        // Send Telegram Notification via API Route (we will create this later)
        try {
          await fetch('/api/telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
          });
        } catch (e) {
          console.error("Failed to send telegram msg", e);
        }

        // Clear cart if not buy now
        if (!searchParams.get('cart')) {
          clearCart();
        }

        alert(`অর্ডার সফল হয়েছে! অর্ডার আইডি: ${orderId}`);
        router.push('/order-track');
      }
    } catch (err) {
      console.error(err);
      alert('অর্ডার সাবমিট করতে সমস্যা হয়েছে!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <h1 className="text-3xl font-bold text-center text-lipstick-dark mb-8">চেকআউট</h1>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Billing Details */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-4">ডেলিভারি ঠিকানা</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">আপনার নাম <span className="text-red-500">*</span></label>
              <input required type="text" name="customerName" value={formData.customerName} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lipstick/50 focus:border-lipstick outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">ফোন নম্বর <span className="text-red-500">*</span></label>
              <input required type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} pattern="01[3-9][0-9]{8}" placeholder="01XXXXXXXXX" className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lipstick/50 focus:border-lipstick outline-none transition" />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">সম্পূর্ণ ঠিকানা <span className="text-red-500">*</span></label>
            <textarea required rows={3} name="address" value={formData.address} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lipstick/50 focus:border-lipstick outline-none transition" />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-4">ডেলিভারি এলাকা <span className="text-red-500">*</span></label>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className={`flex-1 flex items-center p-4 border rounded-xl cursor-pointer transition ${!isOutsideDhaka ? 'border-lipstick bg-lipstick/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" name="deliveryLocation" value="insideDhaka" checked={!isOutsideDhaka} onChange={handleInputChange} className="w-5 h-5 text-lipstick accent-lipstick mr-3" />
                <div>
                  <span className="block font-semibold text-gray-800">ঢাকার ভেতরে</span>
                  <span className="text-sm text-gray-500">৭০ ৳ ডেলিভারি চার্জ</span>
                </div>
              </label>
              <label className={`flex-1 flex items-center p-4 border rounded-xl cursor-pointer transition ${isOutsideDhaka ? 'border-lipstick bg-lipstick/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                <input type="radio" name="deliveryLocation" value="outsideDhaka" checked={isOutsideDhaka} onChange={handleInputChange} className="w-5 h-5 text-lipstick accent-lipstick mr-3" />
                <div>
                  <span className="block font-semibold text-gray-800">ঢাকার বাইরে</span>
                  <span className="text-sm text-gray-500">১৬০ ৳ ডেলিভারি চার্জ (অগ্রিম)</span>
                </div>
              </label>
            </div>
          </div>

          {isOutsideDhaka && (
            <div className="bg-orange-50 border border-orange-200 p-5 rounded-xl mb-6 space-y-4">
              <div className="text-orange-800 text-sm font-medium">
                <strong>নোট:</strong> ঢাকার বাইরের অর্ডারের জন্য ডেলিভারি চার্জ <strong>১৬০ টাকা</strong> অগ্রিম প্রদান করতে হবে। <br/>
                অনুগ্রহ করে নিচের যেকোনো একটি পেমেন্ট মেথড ব্যবহার করুন। <br/>
                বিকাশ/নগদ: <strong>01931866636</strong> (Send Money / Personal)
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">जिला ও থানা <span className="text-red-500">*</span></label>
                  <input required type="text" name="outsideDhakaLocation" value={formData.outsideDhakaLocation} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-300 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">পেমেন্ট মাধ্যম <span className="text-red-500">*</span></label>
                  <select required name="deliveryPaymentMethod" value={formData.deliveryPaymentMethod} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-300 outline-none bg-white">
                    <option value="">সিলেক্ট করুন</option>
                    <option value="bkash">বিকাশ</option>
                    <option value="nagad">নগদ</option>
                  </select>
                </div>
              </div>

              {formData.deliveryPaymentMethod && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">যে নম্বর থেকে টাকা পাঠিয়েছেন <span className="text-red-500">*</span></label>
                    <input required type="text" name="paymentNumber" value={formData.paymentNumber} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-300 outline-none" placeholder="01XXXXXXXXX" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ট্রানজেকশন আইডি (TrxID) <span className="text-red-500">*</span></label>
                    <input required type="text" name="transactionId" value={formData.transactionId} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-300 outline-none" placeholder="XXXXXXXXX" />
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">অতিরিক্ত তথ্য (ঐচ্ছিক)</label>
            <textarea rows={2} name="deliveryNote" value={formData.deliveryNote} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-lipstick/50 focus:border-lipstick outline-none transition" placeholder="অর্ডার সংক্রান্ত কোন নোট থাকলে এখানে লিখুন..." />
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-max sticky top-24">
          <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-4">অর্ডারের সারাংশ</h2>
          
          <div className="space-y-4 mb-6 max-h-60 overflow-y-auto no-scrollbar pr-2">
            {itemsToOrder.map((item: any, idx: number) => (
              <div key={idx} className="flex gap-4 border-b border-gray-50 pb-4">
                <img src={item.image ? item.image.split(',')[0].trim() : 'https://via.placeholder.com/60'} alt={item.name} className="w-16 h-16 object-cover rounded-lg border border-gray-100" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">{item.name}</h4>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-500">{toBengaliNumber(item.quantity)} x {toBengaliNumber(item.price)} ৳</span>
                    <span className="text-sm font-bold text-gray-800">{toBengaliNumber((item.quantity * item.price).toFixed(2))} ৳</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 text-gray-600 mb-6 bg-gray-50 p-4 rounded-xl">
            <div className="flex justify-between">
              <span>সাবটোটাল</span>
              <span className="font-semibold text-gray-800">{toBengaliNumber(subTotal.toFixed(2))} ৳</span>
            </div>
            <div className="flex justify-between">
              <span>ডেলিভারি চার্জ</span>
              <span className="font-semibold text-gray-800">{toBengaliNumber(deliveryFee.toFixed(2))} ৳</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3 mt-3 text-lg">
              <span className="font-bold text-gray-900">মোট মূল্য</span>
              <span className="font-extrabold text-lipstick-dark">{toBengaliNumber(totalAmount.toFixed(2))} ৳</span>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || itemsToOrder.length === 0}
            className="w-full bg-lipstick hover:bg-lipstick-dark disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl shadow-md transition-all flex justify-center items-center"
          >
            {loading ? (
              <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> প্রোসেসিং...</>
            ) : "অর্ডার কনফার্ম করুন"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function OrderForm() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-[50vh]"><div className="w-8 h-8 border-4 border-lipstick border-t-transparent rounded-full animate-spin"></div></div>}>
      <OrderFormContent />
    </Suspense>
  );
}
