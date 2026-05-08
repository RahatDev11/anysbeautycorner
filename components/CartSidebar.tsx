'use client';

import { useStore } from '@/lib/store';
import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect } from 'react';

export default function CartSidebar() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity } = useStore();

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Scroll lock for cart sidebar
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen]);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm" 
            onClick={() => setIsCartOpen(false)}
          />
          
          {/* Sidebar */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-[90%] max-w-sm bg-white z-[130] shadow-2xl flex flex-col rounded-l-[1.5rem] md:rounded-l-[2rem] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex flex-col">
                <h2 className="text-xl font-serif italic text-gray-900 flex items-center">
                  আপনার ব্যাগ
                  <span className="ml-2 bg-lipstick text-white text-[10px] font-bold py-1 px-2.5 rounded-full">{itemCount}</span>
                </h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Shopping Cart</p>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)} 
                className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-400 hover:text-gray-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
    
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-20 h-20 bg-lipstick/5 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="w-10 h-10 text-lipstick/30" />
                  </div>
                  <h3 className="text-lg font-serif italic text-gray-900 mb-2">ব্যাগ একদম খালি</h3>
                  <p className="text-sm text-gray-400 max-w-[200px]">নতুন কিছু যোগ করুন এবং আপনার সৌন্দর্য যাত্রা শুরু করুন!</p>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="mt-8 text-xs font-bold uppercase tracking-widest text-lipstick border-b border-lipstick/30 pb-1 hover:border-lipstick transition-all"
                  >
                    শপিং শুরু করুন
                  </button>
                </div>
              ) : (
                cart.map((item) => {
                  const displayImage = item.image ? item.image.split(',')[0].trim() : 'https://via.placeholder.com/100';
                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={item.id} 
                      className="flex gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow group"
                    >
                      <div className="relative w-20 h-20 flex-shrink-0">
                        <img 
                          src={displayImage} 
                          alt={item.name} 
                          className="w-full h-full object-cover rounded-xl border border-gray-50"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-0.5">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-medium text-gray-900 text-sm line-clamp-1 group-hover:text-lipstick transition-colors">{item.name}</h3>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <p className="font-bold text-lipstick-dark text-sm">{item.price} ৳</p>
                          <div className="flex items-center bg-gray-50 rounded-lg border border-gray-100 p-0.5">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-white rounded-md transition-all active:scale-90"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-gray-700">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-white rounded-md transition-all active:scale-90"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
    
            {cart.length > 0 && (
              <div className="p-6 border-t border-gray-100 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">সমুদয় মূল্য</span>
                    <span className="text-2xl font-serif text-gray-900">{totalAmount.toLocaleString('en-US')} ৳</span>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] items-center text-emerald-500 font-bold flex gap-1 justify-end uppercase">
                       <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
                       Secure Checkout
                     </p>
                  </div>
                </div>
                <Link 
                  href="/order-form" 
                  onClick={() => setIsCartOpen(false)}
                  className="w-full bg-lipstick hover:bg-lipstick-dark text-white font-bold py-4 px-6 rounded-full flex items-center justify-center transition-all shadow-xl shadow-lipstick/10 active:scale-[0.98] uppercase tracking-widest text-xs"
                >
                  চেকআউট করুন
                </Link>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="w-full text-center mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-lipstick transition-colors"
                >
                  শপিং চালিয়ে যান
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
