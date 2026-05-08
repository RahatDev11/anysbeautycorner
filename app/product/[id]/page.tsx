'use client';

import { useEffect, useState, use } from 'react';
import { database } from '@/lib/firebase';
import { ref, get, onValue } from 'firebase/database';
import { useStore } from '@/lib/store';
import { ShoppingCart, CreditCard, Minus, Plus, Share2, ShieldCheck, Truck, RefreshCcw, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { cart, addToCart } = useStore();
  const [product, setProduct] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productRef = ref(database, `products/${resolvedParams.id}`);
        const snapshot = await get(productRef);
        if (snapshot.exists()) {
          const data = { id: snapshot.key, ...snapshot.val() };
          setProduct(data);
          if (data.image) {
            setMainImage(data.image.split(',')[0].trim());
          }
        } else {
          setError('প্রোডাক্ট পাওয়া যায়নি!');
        }
      } catch (err: any) {
        setError(err.message || 'প্রোডাক্ট লোড করতে সমস্যা হয়েছে!');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();

    // Fetch all products for related section
    const productsRef = ref(database, 'products/');
    const unsubProducts = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const prods = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setProducts(prods);
      }
    });

    return () => unsubProducts();
  }, [resolvedParams.id]);

  const images = product?.image ? product.image.split(',').map((img: string) => img.trim()).filter(Boolean) : [];

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: images[0] || '',
      quantity,
    });
    setQuantity(1);
    // Standard alert as toast fallback
    alert(`${product.name} কার্টে যোগ করা হয়েছে`);
  };

  const handleBuyNow = () => {
    const tempCart = [{
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: images[0] || '',
      quantity: quantity
    }];
    const cartData = encodeURIComponent(JSON.stringify(tempCart));
    router.push(`/order-form?cart=${cartData}`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('লিঙ্কটি কপি করা হয়েছে!');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="w-12 h-12 border-4 border-lipstick border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto p-4 text-center mt-20">
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{error || 'পণ্য পাওয়া যায়নি'}</h2>
          <button 
            onClick={() => router.push('/')} 
            className="w-full bg-lipstick text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-lipstick/20 hover:bg-lipstick-dark transition-all transform active:scale-95"
          >
            হোম পেজে ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stockStatus === 'out_of_stock';
  const relatedProducts = products
    .filter(p => p.id !== product.id && (product.category ? p.category === product.category : true))
    .slice(0, 4);

  return (
    <div className="container mx-auto p-4 max-w-7xl pb-32">
      {/* Breadcrumb */}
      <motion.nav 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex text-xs md:text-sm text-gray-400 mb-8 px-1 overflow-x-auto no-scrollbar whitespace-nowrap"
      >
        <Link href="/" className="hover:text-lipstick transition-colors">হোম</Link>
        <span className="mx-2 text-gray-300">/</span>
        <Link href={`/?filter=${product.category || ''}`} className="hover:text-lipstick transition-colors capitalize">{product.category || 'পণ্য'}</Link>
        <span className="mx-2 text-gray-300">/</span>
        <span className="text-gray-900 font-medium truncate">{product.name}</span>
      </motion.nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
        {/* Left: Gallery */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 space-y-6"
        >
          <div className="relative group bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl shadow-gray-200/40 aspect-square flex items-center justify-center p-4">
            <AnimatePresence mode="wait">
              <motion.img 
                key={mainImage}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                src={mainImage || 'https://via.placeholder.com/800'} 
                alt={product.name} 
                className="w-full h-full object-contain" 
              />
            </AnimatePresence>
            
            {images.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => {
                    const idx = images.indexOf(mainImage);
                    setMainImage(images[(idx - 1 + images.length) % images.length]);
                  }}
                  className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-lg text-gray-800 hover:bg-lipstick hover:text-white transition-all transform active:scale-90"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => {
                    const idx = images.indexOf(mainImage);
                    setMainImage(images[(idx + 1) % images.length]);
                  }}
                  className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-lg text-gray-800 hover:bg-lipstick hover:text-white transition-all transform active:scale-90"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-1 scroll-smooth">
              {images.map((img: string, idx: number) => (
                <button 
                  key={idx} 
                  onClick={() => setMainImage(img)}
                  className={`flex-shrink-0 w-24 h-24 rounded-3xl overflow-hidden border-2 transition-all p-1 bg-white ${mainImage === img ? 'border-lipstick shadow-lg shadow-lipstick/10' : 'border-transparent hover:border-lipstick/40 grayscale hover:grayscale-0'}`}
                >
                  <img src={img} className="w-full h-full object-cover rounded-2xl" alt={`${product.name} thumbnail ${idx+1}`} />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Right: Info */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 flex flex-col pt-2"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-start gap-4">
               <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight md:leading-[1.1]">{product.name}</h1>
               <button 
                onClick={handleShare} 
                className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition shadow-sm text-gray-500 hover:text-lipstick flex-shrink-0"
               >
                 <Share2 className="w-6 h-6" />
               </button>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-100">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="text-xs font-bold text-yellow-700">৫.০ (১৮ রিভিউ)</span>
              </div>
              <div className="h-1.5 w-1.5 rounded-full bg-gray-300"></div>
              {isOutOfStock ? (
                <span className="bg-red-50 text-red-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">স্টকে নেই</span>
              ) : (
                <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">স্টকে আছে</span>
              )}
            </div>

            <div className="flex items-end gap-5 py-6">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-400 mb-1">মূল্য:</span>
                <span className="text-5xl font-black text-lipstick-dark leading-none">{product.price} ৳</span>
              </div>
              {product.oldPrice && (
                <div className="flex flex-col mb-1">
                  <span className="text-lg text-gray-300 line-through font-bold">{product.oldPrice} ৳</span>
                  <span className="text-xs font-black text-emerald-500">{(Math.round((1 - parseInt(product.price) / parseInt(product.oldPrice)) * 100))}% ছাড়</span>
                </div>
              )}
            </div>

            <div className="h-px bg-gray-100 w-full my-4"></div>

            {!isOutOfStock ? (
              <div className="space-y-8 pt-4">
                <div className="flex items-center gap-8">
                  <span className="text-gray-900 font-black uppercase tracking-wider text-sm">পরিমাণ:</span>
                  <div className="flex items-center border-2 border-gray-100 rounded-3xl bg-gray-50 p-1.5 shadow-inner">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-12 h-12 flex items-center justify-center hover:bg-white rounded-2xl text-gray-400 hover:text-lipstick transition-all shadow-sm active:scale-90"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="w-16 text-center font-black text-2xl text-gray-900">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-12 h-12 flex items-center justify-center hover:bg-white rounded-2xl text-gray-400 hover:text-lipstick transition-all shadow-sm active:scale-100"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-5">
                  <button 
                    onClick={handleAddToCart}
                    className="flex-1 group relative bg-white text-lipstick-dark border-2 border-lipstick-dark py-5 px-8 rounded-3xl font-black flex items-center justify-center overflow-hidden transition-all hover:bg-lipstick hover:text-white"
                  >
                    <ShoppingCart className="w-6 h-6 mr-3 relative z-10" />
                    <span className="relative z-10">কার্টে যোগ করুন</span>
                    <div className="absolute inset-0 bg-white group-hover:bg-lipstick transition-all scale-x-0 group-hover:scale-x-100 origin-left"></div>
                  </button>
                  <button 
                    onClick={handleBuyNow}
                    className="flex-[1.2] bg-lipstick-dark text-white py-5 px-8 rounded-3xl font-black flex items-center justify-center hover:bg-lipstick transition-all shadow-2xl shadow-lipstick-dark/30 transform active:scale-[0.98]"
                  >
                    <CreditCard className="w-6 h-6 mr-3" />
                    অর্ডার করুন
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 text-center border-dashed mt-6">
                <p className="text-gray-400 font-bold">দুঃখিত, এই পণ্যটি সাময়িকভাবে আউট অফ স্টক আছে।</p>
              </div>
            )}

            {/* Trust Points */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 py-8 border-y border-gray-100">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-4 bg-blue-50 rounded-3xl">
                  <ShieldCheck className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">১০০% আসল</h4>
                  <p className="text-[10px] text-gray-400">Authentic Guaranteed</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-4 bg-emerald-50 rounded-3xl">
                  <Truck className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">ফাস্ট ডেলিভারি</h4>
                  <p className="text-[10px] text-gray-400">Doorstep Delivery</p>
                </div>
              </div>
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="p-4 bg-orange-50 rounded-3xl">
                  <RefreshCcw className="w-7 h-7 text-orange-600" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider">রিটার্ন পলিসি</h4>
                  <p className="text-[10px] text-gray-400">Easy 3-Day Return</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-20"
      >
        <div className="flex gap-12 border-b border-gray-100 mb-10 overflow-x-auto no-scrollbar scroll-smooth">
          {['description', 'delivery', 'reviews'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-5 px-2 text-sm md:text-lg font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-lipstick-dark' : 'text-gray-300 hover:text-gray-500'}`}
            >
              {tab === 'description' ? 'বিবরণ' : tab === 'delivery' ? 'ডেলিভারি তথ্য' : 'রিভিউ (০)'}
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 w-full h-1.5 bg-lipstick-dark rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-gray-100 shadow-sm min-h-[300px]"
        >
          {activeTab === 'description' && (
            <div className="prose prose-lg prose-pink max-w-none">
              <div className="text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">
                {product.description || 'এই প্রোডাক্ট সম্পর্কে বিস্তারিত কোনো তথ্য এখনো দেওয়া হয়নি। আমরা শীঘ্রই এটি আপডেট করার চেষ্টা করছি।'}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                {[
                  { title: 'উচ্চমানের ফর্মুলা', icon: '✨' },
                  { title: 'প্যারাবেন মুক্ত', icon: '🌿' },
                  { title: 'দীর্ঘস্থায়ী ফলাফল', icon: '⏳' },
                  { title: 'সব ধরের ত্বকের জন্য', icon: '💁‍♀️' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="font-bold text-gray-800">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'delivery' && (
            <div className="space-y-8">
              <div className="bg-lipstick/5 p-8 rounded-3xl border border-lipstick/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-5 group-hover:scale-125 transition-transform duration-1000">
                  <Truck className="w-32 h-32" />
                </div>
                <h4 className="text-2xl font-black text-lipstick-dark mb-6 flex items-center">
                   <div className="w-3 h-3 rounded-full bg-lipstick-dark mr-3"></div>
                   শিপিং ডিটেইলস
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <h5 className="font-black text-gray-900 border-b border-gray-200 pb-2 flex justify-between">
                      <span>ঢাকার ভেতরে</span>
                      <span className="text-lipstick">৭০ ৳</span>
                    </h5>
                    <p className="text-sm text-gray-500 font-medium">ডেলিভারি সময়: ২৪ - ৪৮ ঘণ্টা (হোম ডেলিভারি)</p>
                  </div>
                  <div className="space-y-3">
                    <h5 className="font-black text-gray-900 border-b border-gray-200 pb-2 flex justify-between">
                      <span>ঢাকার বাইরে</span>
                      <span className="text-lipstick">১৬০ ৳</span>
                    </h5>
                    <p className="text-sm text-gray-500 font-medium">ডেলিভারি সময়: ২ - ৪ দিন (কুরিয়ার সার্ভিস)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'reviews' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-5xl">⭐️</div>
              <div className="text-center">
                <p className="text-2xl font-black text-gray-900 mb-2">এই পণ্যের কোনো রিভিউ নেই</p>
                <p className="text-gray-400 font-medium max-w-xs mx-auto">প্রথম রিভিউ লিখে আকর্ষণীয় ক্যাশব্যাক পয়েন্ট পান!</p>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-32">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
            <div className="text-center md:text-left">
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-2">আপনার ভালো লাগতে পারে</h2>
              <p className="text-gray-400 font-bold">Similar highlights you might adore</p>
            </div>
            <Link 
              href={`/?filter=${product.category || ''}`} 
              className="group bg-lipstick-dark text-white px-8 py-4 rounded-3xl font-black hover:bg-lipstick transition-all shadow-xl shadow-lipstick/20 flex items-center"
            >
              সব দেখুন
              <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Sticky Bottom Bar for Mobile */}
      {!isOutOfStock && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="lg:hidden fixed bottom-6 left-4 right-4 z-[100]"
        >
          <div className="bg-black/90 backdrop-blur-xl rounded-[2rem] p-3 shadow-2xl flex items-center gap-3">
            <div className="px-4 border-r border-white/20">
              <span className="text-white text-lg font-black">{product.price}৳</span>
            </div>
            <button 
              onClick={handleAddToCart}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center transition-all"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              কার্ট
            </button>
            <button 
              onClick={handleBuyNow}
              className="flex-[1.5] bg-lipstick text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center shadow-lg shadow-lipstick/30 active:scale-95 transition-all"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              অর্ডার করুন
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
