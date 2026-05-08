'use client';

import { useStore } from '@/lib/store';
import { X, Trash2, Plus, Minus } from 'lucide-react';
import Link from 'next/link';

export default function CartSidebar() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity } = useStore();

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex justify-end" onClick={() => setIsCartOpen(false)}>
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            কার্ট <span className="ml-2 bg-gray-100 text-sm py-1 px-2 rounded-full">{itemCount}</span>
          </h2>
          <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <ShoppingBagIcon className="w-16 h-16 mb-4 text-gray-300" />
              <p>আপনার কার্ট খালি।</p>
            </div>
          ) : (
            cart.map((item) => {
              const displayImage = item.image ? item.image.split(',')[0].trim() : 'https://via.placeholder.com/100';
              return (
                <div key={item.id} className="flex gap-4 p-3 bg-white border rounded-xl shadow-sm">
                  <img 
                    src={displayImage} 
                    alt={item.name} 
                    className="w-20 h-20 object-cover rounded-lg border border-gray-100"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-gray-800 text-sm line-clamp-2">{item.name}</h3>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="font-bold text-lipstick-dark">{item.price} ৳</p>
                      <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="px-2 py-1 text-gray-600 hover:bg-gray-200 rounded-l-lg transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="px-2 py-1 text-gray-600 hover:bg-gray-200 rounded-r-lg transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600 font-medium">সাবটোটাল</span>
              <span className="text-xl font-bold text-gray-900">{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ৳</span>
            </div>
            <Link 
              href="/order-form" 
              onClick={() => setIsCartOpen(false)}
              className="w-full bg-lipstick hover:bg-lipstick-dark text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center transition-colors shadow-md"
            >
              চেকআউট করুন
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// Just a simple placeholder for empty state
function ShoppingBagIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
      <line x1="3" x2="21" y1="6" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}
