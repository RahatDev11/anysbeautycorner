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
    const { setIsCartOpen } = useStore.getState();
    setIsCartOpen(true);
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
      whileHover={{ y: -4 }}
      className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-all duration-500 hover:shadow-xl hover:shadow-lipstick/5 group h-full relative"
    >
      <Link href={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-gray-50">
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

      <div className="p-3 md:p-4 flex flex-col flex-grow">
        <div className="mb-1">
          <Link href={`/product/${product.id}`} className="block">
            <h3 className="font-serif font-semibold text-gray-900 text-sm md:text-base mb-1 line-clamp-2 leading-tight group-hover:text-lipstick transition-colors tracking-tight">{product.name}</h3>
          </Link>
          <div className="flex items-center gap-2">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">{product.category || 'পণ্য'}</p>
            <div className="h-0.5 w-3 bg-gray-100 rounded-full"></div>
          </div>
        </div>

        <div className="mt-auto pt-2 space-y-2">
          <div className="flex justify-between items-baseline">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-lipstick-dark leading-none">{product.price} ৳</span>
              {product.oldPrice && (
                <span className="text-[10px] text-gray-300 line-through font-medium mb-0.5">{product.oldPrice} ৳</span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <AnimatePresence mode="wait">
              {cartItem ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  key="quantity"
                  className="w-full bg-lipstick/5 rounded-xl font-black flex items-center h-9 justify-between px-1 border border-lipstick/10"
                >
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(product.id, -1); }} 
                    className="w-7 h-7 flex items-center justify-center text-lipstick bg-white rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-sm text-lipstick-dark">{cartItem.quantity}</span>
                  <button 
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); updateQuantity(product.id, 1); }} 
                    className="w-7 h-7 flex items-center justify-center text-lipstick bg-white rounded-lg shadow-sm hover:scale-105 active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
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
                  className={`w-full h-9 rounded-xl font-bold flex items-center justify-center transition-all shadow-sm ${isOutOfStock ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-lipstick-dark border border-lipstick/30 hover:bg-lipstick hover:text-white hover:border-lipstick'}`}
                >
                  <ShoppingCart className="w-3 h-3 mr-1.5" />
                  <span className="text-[9px] uppercase tracking-widest">কার্টে যোগ করুন</span>
                </motion.button>
              )}
            </AnimatePresence>

            <button 
              disabled={isOutOfStock}
              onClick={handleBuyNow} 
              className={`w-full h-9 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-md ${isOutOfStock ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : 'bg-lipstick-dark text-white hover:bg-gray-900 active:scale-[0.98] shadow-lipstick-dark/10'}`}
            >
              কিনুন
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
