'use client';

import Link from 'next/link';
import { useStore } from '@/lib/store';
import { ShoppingCart, ArrowRight, Minus, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';

interface Product {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  category?: string;
  stockStatus?: string;
}

export default function ProductCard({ product }: { product: Product }) {
  const { cart, updateQuantity, addToCart } = useStore();
  const router = useRouter();
  
  const cartItem = cart.find((item) => item.id === product.id);
  const imageUrl = product.image ? product.image.split(',')[0].trim() : 'https://via.placeholder.com/400';
  const isOutOfStock = product.stockStatus === 'out_of_stock';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: imageUrl,
      quantity: 1,
    });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    const tempCart = [{
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: imageUrl,
      quantity: 1
    }];
    const cartData = encodeURIComponent(JSON.stringify(tempCart));
    router.push(`/order-form?cart=${cartData}`);
  };

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-all duration-500 hover:shadow-2xl hover:shadow-lipstick/10 group h-full relative"
    >
      <Link href={`/product/${product.id}`} className="block relative aspect-[4/5] overflow-hidden bg-gray-50">
        <img 
          src={imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.oldPrice && (
            <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg">
              -{Math.round((1 - product.price / product.oldPrice) * 100)}%
            </span>
          )}
          {isOutOfStock && (
            <span className="bg-gray-900 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg opacity-80">
              সোল্ড আউট
            </span>
          )}
        </div>
        
        {/* Hover Overlay Button */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
           <div className="bg-white/90 backdrop-blur-sm p-4 rounded-3xl shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 flex items-center gap-2">
             <span className="text-lipstick font-black text-xs uppercase tracking-widest">ভিউ ডিটেইলস</span>
             <ArrowRight className="w-4 h-4 text-lipstick" />
           </div>
        </div>
      </Link>

      <div className="p-5 md:p-6 flex flex-col flex-grow">
        <div className="mb-2">
          <Link href={`/product/${product.id}`} className="block">
            <h3 className="font-black text-gray-900 text-base md:text-lg mb-1 line-clamp-2 leading-tight group-hover:text-lipstick transition-colors">{product.name}</h3>
          </Link>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{product.category || 'পণ্য'}</p>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-50 space-y-4">
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black text-lipstick-dark leading-none">{product.price} ৳</span>
            {product.oldPrice && (
              <span className="text-sm text-gray-300 line-through font-bold mb-0.5">{product.oldPrice} ৳</span>
            )}
          </div>

          <div className="space-y-2">
            <AnimatePresence mode="wait">
              {cartItem ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key="quantity"
                  className="w-full bg-lipstick/5 rounded-2xl font-black flex items-center h-12 justify-between px-1 border border-lipstick/10"
                >
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(product.id, -1); }} 
                    className="w-10 h-10 flex items-center justify-center text-lipstick bg-white rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-lg text-lipstick-dark">{cartItem.quantity}</span>
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(product.id, 1); }} 
                    className="w-10 h-10 flex items-center justify-center text-lipstick bg-white rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </motion.div>
              ) : (
                <motion.button 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key="add"
                  disabled={isOutOfStock}
                  onClick={handleAddToCart} 
                  className={`w-full h-12 rounded-2xl font-black flex items-center justify-center transition-all shadow-sm ${isOutOfStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-lipstick-dark border border-lipstick/30 hover:bg-lipstick hover:text-white hover:border-lipstick'}`}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  <span className="text-xs uppercase tracking-widest">কার্টে যোগ করুন</span>
                </motion.button>
              )}
            </AnimatePresence>

            <button 
              disabled={isOutOfStock}
              onClick={handleBuyNow} 
              className={`w-full h-12 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${isOutOfStock ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : 'bg-lipstick-dark text-white hover:bg-gray-900 active:scale-[0.98] shadow-lipstick-dark/20'}`}
            >
              কিনুন
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
