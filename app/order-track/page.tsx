'use client';

import { useEffect, useState, Suspense } from 'react';
import { database, auth, googleProvider } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { useStore } from '@/lib/store';
import { X, Check } from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { useSearchParams } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';

function OrderTrackContent() {
  const { user, setUser } = useStore();
  const searchParams = useSearchParams();
  const urlOrderId = searchParams.get('orderId');

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const ordersRef = ref(database, 'orders');
      const snapshot = await get(ordersRef);
      if (snapshot.exists()) {
        const allOrders = snapshot.val();
        let myOrderList: any[] = [];
        
        if (user) {
          // Find orders by user ID or Email
          Object.keys(allOrders).forEach(key => {
            const o = allOrders[key];
            if (o.userId === user.uid || o.customerEmail === user.email || o.userEmail === user.email) {
              myOrderList.push({ id: key, ...o });
            }
          });
        } else {
          // Find local guest orders
          const localOrderKeys = JSON.parse(localStorage.getItem('myOrders') || '[]');
          Object.keys(allOrders).forEach(key => {
            if (localOrderKeys.includes(key)) {
              myOrderList.push({ id: key, ...allOrders[key] });
            }
          });
        }

        myOrderList.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        setOrders(myOrderList);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(fetchOrders, 0);
  }, [user]);

  useEffect(() => {
    if (urlOrderId && !loading && orders.length > 0) {
      const order = orders.find(o => o.orderId === urlOrderId || o.id === urlOrderId);
      if (order && order.id !== selectedOrder?.id) {
        setTimeout(() => setSelectedOrder(order), 0);
      }
    }
  }, [urlOrderId, loading, orders, selectedOrder]);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      });
    } catch (error) {
      alert('লগইন ব্যর্থ হয়েছে।');
    }
  };

  const getStatusText = (status: string) => {
    const s: Record<string, string> = { processing: 'প্রসেসিং', confirmed: 'কনফার্মড', packaging: 'প্যাকেজিং', shipped: 'ডেলিভারি হয়েছে', delivered: 'সম্পন্ন হয়েছে' };
    return s[status] || 'প্রসেসিং';
  };

  const getStatusColor = (status: string) => {
    const c: Record<string, string> = { 
      processing: 'bg-yellow-100 text-yellow-800', 
      confirmed: 'bg-blue-100 text-blue-800', 
      packaging: 'bg-purple-100 text-purple-800', 
      shipped: 'bg-cyan-100 text-cyan-800', 
      delivered: 'bg-green-100 text-green-800' 
    };
    return c[status] || c.processing;
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl pb-24">
      <LoadingScreen isLoading={loading} />
      <h1 className="text-3xl font-bold text-center mb-8 text-lipstick">আপনার অর্ডারসমূহ</h1>
      
      {!user && orders.length === 0 && !loading && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md mx-auto text-center">
          <p className="text-gray-600 mb-6">আপনার অতীত অর্ডারগুলো দেখতে এবং ট্র্যাক করতে অনুগ্রহ করে লগইন করুন।</p>
          <button onClick={handleLogin} className="bg-lipstick text-white px-6 py-3 rounded-lg font-bold w-full hover:bg-lipstick-dark transition shadow-md">
            লগইন করুন
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"></div>
      ) : orders.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="hidden md:grid grid-cols-4 gap-4 p-5 bg-gray-50/50 border-b border-gray-100 font-semibold text-gray-600">
            <div>অর্ডার আইডি</div>
            <div>অর্ডারের তারিখ</div>
            <div>মোট মূল্য</div>
            <div>স্ট্যাটাস</div>
          </div>
          <div className="divide-y divide-gray-100">
            {orders.map((order: any) => (
              <div 
                key={order.id} 
                onClick={() => setSelectedOrder(order)}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 cursor-pointer hover:bg-gray-50 transition items-center"
              >
                <div>
                  <span className="md:hidden text-xs text-gray-500 block mb-1">অর্ডার আইডি</span>
                  <span className="font-semibold text-gray-800 break-all">{order.orderId || order.id}</span>
                </div>
                <div>
                  <span className="md:hidden text-xs text-gray-500 block mb-1">তারিখ</span>
                  <span className="text-gray-700">{new Date(order.orderDate).toLocaleString('bn-BD')}</span>
                </div>
                <div>
                  <span className="md:hidden text-xs text-gray-500 block mb-1">মূল্য</span>
                  <span className="text-lipstick-dark font-bold">{order.totalAmount} ৳</span>
                </div>
                <div className="text-right md:text-left">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        user && <p className="text-center text-gray-500 mt-10">আপনার কোনো অর্ডার খুঁজে পাওয়া যায়নি।</p>
      )}

      {/* Modal matching original logic */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div 
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" 
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-gray-800">অর্ডারের বিস্তারিত</h2>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Tracker */}
              <div className="flex justify-between items-center mb-8 relative">
                {(() => {
                  const statuses = ['processing', 'confirmed', 'packaging', 'shipped', 'delivered'];
                  const currentIndex = statuses.indexOf(selectedOrder.status || 'processing');
                  return statuses.map((status, index) => {
                    const isActive = index <= currentIndex;
                    const isCompleted = index < currentIndex;
                    return (
                      <div key={status} className="flex flex-col items-center relative z-10 flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-colors ${isActive ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                          {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                        </div>
                        <span className={`text-[10px] sm:text-xs font-semibold text-center ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
                          {getStatusText(status)}
                        </span>
                      </div>
                    );
                  })
                })()}
                {/* Progress bar background */}
                <div className="absolute top-4 left-[10%] right-[10%] h-1 bg-gray-200 -z-0">
                  <div 
                    className="h-full bg-green-500 transition-all" 
                    style={{ 
                      width: `${(['processing', 'confirmed', 'packaging', 'shipped', 'delivered'].indexOf(selectedOrder.status || 'processing') / 4) * 100}%` 
                    }}
                  />
                </div>
              </div>

              {/* Order Info */}
              <div className="bg-gray-50 rounded-xl p-5 mb-6 space-y-2 text-sm text-gray-700">
                <p><strong className="text-gray-900">অর্ডার আইডি:</strong> {selectedOrder.orderId || selectedOrder.id}</p>
                <p><strong className="text-gray-900">তারিখ:</strong> {new Date(selectedOrder.orderDate).toLocaleString('bn-BD')}</p>
                <p><strong className="text-gray-900">নাম:</strong> {selectedOrder.customerName}</p>
                <p><strong className="text-gray-900">ফোন:</strong> {selectedOrder.phoneNumber}</p>
                <p><strong className="text-gray-900">ঠিকানা:</strong> {selectedOrder.address}</p>
              </div>

              {/* Items */}
              <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">প্রোডাক্টস</h3>
              <div className="space-y-3 mb-6">
                {(selectedOrder.cartItems || []).map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <img src={item.image ? item.image.split(',')[0].trim() : 'https://via.placeholder.com/60'} alt={item.name} className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
                    <div className="flex-1 text-sm">
                      <p className="font-bold text-gray-800 line-clamp-1">{item.name}</p>
                      <p className="text-gray-500 mt-1">{item.quantity} x {item.price} ৳</p>
                    </div>
                    <div className="font-bold text-gray-900">
                      {(item.quantity * item.price).toFixed(2)} ৳
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="bg-lipstick/5 p-5 rounded-xl text-sm flex flex-col gap-2 text-right">
                <p className="text-gray-600">ডেলিভারি ফি: <span className="font-semibold text-gray-800 ml-4">{selectedOrder.deliveryFee} ৳</span></p>
                <p className="text-lg font-bold text-lipstick-dark mt-2 border-t border-lipstick/20 pt-2">মোট মূল্য: <span className="ml-4">{selectedOrder.totalAmount} ৳</span></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderTrack() {
  return (
    <Suspense fallback={<LoadingScreen isLoading={true} />}>
      <OrderTrackContent />
    </Suspense>
  );
}
