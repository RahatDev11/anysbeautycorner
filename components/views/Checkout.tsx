'use client';

import { useState } from 'react';
import { dbService } from '@/lib/services/dbService';
import { useStore } from '@/lib/store';

export default function CheckoutView() {
  const { cart, clearCart } = useStore();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    // Basic checkout logic
    alert("Order placed successfully!");
    clearCart();
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-serif mb-8">Checkout</h1>
      <form onSubmit={handleCheckout} className="space-y-4">
        <input type="text" placeholder="Full Name" className="w-full p-3 border rounded-xl" required />
        <input type="text" placeholder="Phone Number" className="w-full p-3 border rounded-xl" required />
        <textarea placeholder="Address" className="w-full p-3 border rounded-xl" required />
        <button 
          disabled={loading}
          className="w-full bg-lipstick text-white p-4 rounded-xl font-bold"
        >
          {loading ? 'Processing...' : 'Place Order'}
        </button>
      </form>
    </div>
  );
}
