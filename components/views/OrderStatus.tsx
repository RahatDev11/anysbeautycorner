'use client';

import { useState } from 'react';
import { dbService } from '@/lib/services/dbService';

export default function OrderStatusView() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<any>(null);

  const handleTrack = async () => {
    const data = await dbService.getOrder(orderId);
    setOrder(data);
  };

  return (
    <div className="container mx-auto p-4 max-w-xl">
      <h1 className="text-3xl font-serif mb-8">Track Your Order</h1>
      <div className="flex gap-2 mb-8">
        <input 
          type="text" 
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="Enter Order ID" 
          className="flex-1 p-3 border rounded-xl" 
        />
        <button onClick={handleTrack} className="bg-lipstick text-white px-6 rounded-xl font-bold">Track</button>
      </div>
      
      {order && (
        <div className="p-6 border rounded-2xl bg-white shadow-sm">
          <h2 className="text-xl font-bold mb-4">Order Details</h2>
          <p>Status: <span className="capitalize font-bold text-lipstick">{order.status}</span></p>
          <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
}
