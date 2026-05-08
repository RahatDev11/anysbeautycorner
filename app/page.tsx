'use client';

import { useEffect, useState, Suspense } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import ProductCard from '@/components/ProductCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ArrowRight, Sparkles } from 'lucide-react';

function HomeContent() {
  const [products, setProducts] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const filterCat = searchParams.get('filter');
  const searchQuery = searchParams.get('search');

  useEffect(() => {
    const productsRef = ref(database, 'products/');
    const eventsRef = ref(database, 'events');

    const unsubProducts = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const prods = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setProducts(prods);
      }
      setLoading(false);
    });

    const unsubEvents = onValue(eventsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const evts = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter(e => e.isActive)
          .sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99))
          .slice(0, 3);
        setEvents(evts);
      }
    });

    return () => {
      unsubProducts();
      unsubEvents();
    };
  }, []);

  let displayProducts = products;
  if (filterCat && filterCat !== 'all') {
    displayProducts = products.filter(p => p.category === filterCat);
  }
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    displayProducts = displayProducts.filter(p => 
      p.name.toLowerCase().includes(query) || (p.tags && p.tags.toLowerCase().includes(query))
    );
  }

  const sliderProducts = products.filter(p => p.isInSlider).sort((a, b) => (a.sliderOrder || 99) - (b.sliderOrder || 99));

  return (
    <div className="container mx-auto p-4 md:p-8 pb-32">
      {/* Search Result Indicator */}
      <AnimatePresence>
        {searchQuery && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-lipstick/5 p-6 rounded-[2rem] border border-lipstick/10"
          >
            <div>
              <p className="text-xs font-black text-lipstick/60 uppercase tracking-widest mb-1">সার্চ রেজাল্ট</p>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-none">
                &quot;{searchQuery}&quot;
              </h2>
            </div>
            <Link href="/" className="bg-lipstick text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-lipstick/20 hover:scale-105 transition-transform w-max">
              সব প্রোডাক্ট দেখুন
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Slider */}
      {!filterCat && !searchQuery && sliderProducts.length > 0 && (
        <section className="mb-16 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-lipstick/10 border border-gray-100">
          <Swiper
            modules={[Autoplay, Pagination, EffectFade]}
            effect="fade"
            loop={sliderProducts.length > 1}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            pagination={{ clickable: true }}
            className="w-full h-[450px] md:h-[600px]"
          >
            {sliderProducts.map((product) => {
              const image = product.image ? product.image.split(',')[0].trim() : 'https://via.placeholder.com/1200x800';
              return (
                <SwiperSlide key={product.id}>
                  <div className="relative w-full h-full group">
                    <img src={image} alt={product.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[10s] ease-linear" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent md:bg-gradient-to-r md:from-black/70 md:to-transparent flex flex-col justify-center p-8 md:p-24">
                      <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                      >
                         <span className="inline-block bg-lipstick text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-xl">New Arrival</span>
                        <h3 className="text-white text-4xl md:text-7xl font-black mb-4 leading-[1.1] tracking-tighter max-w-2xl">{product.name}</h3>
                        <div className="flex items-center gap-6 mb-10">
                          <span className="text-white/90 text-2xl md:text-4xl font-black">{product.price} ৳</span>
                          {product.oldPrice && <span className="text-white/40 text-lg md:text-2xl line-through font-bold">{product.oldPrice} ৳</span>}
                        </div>
                        <Link 
                          href={`/product/${product.id}`}
                          className="group bg-white text-lipstick-dark hover:bg-lipstick hover:text-white py-4 px-10 rounded-[1.5rem] font-black text-lg transition-all shadow-2xl flex items-center w-max"
                        >
                          এখনই কিনুন
                          <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </Link>
                      </motion.div>
                    </div>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </section>
      )}

      {/* Events Slider Upgrade */}
      {!filterCat && !searchQuery && events.length > 0 && (
        <section className="mb-20">
          <div className="flex flex-col items-center mb-10">
            <span className="text-lipstick-dark font-black tracking-[0.3em] uppercase text-[10px] mb-2">Special Updates</span>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900">ইভেন্ট ও অফার</h2>
          </div>
          <Swiper
            modules={[Autoplay, Pagination]}
            loop={events.length > 1}
            autoplay={{ delay: 6000 }}
            pagination={{ clickable: true }}
            spaceBetween={30}
            className="rounded-[2.5rem] h-[220px] md:h-[280px]"
          >
            {events.map((event) => (
              <SwiperSlide key={event.id}>
                {event.imageUrl ? (
                  <div 
                    className="w-full h-full bg-cover bg-center rounded-[2.5rem] shadow-xl relative overflow-hidden group" 
                    style={{ backgroundImage: `url(${event.imageUrl})` }}
                  >
                    <div className="absolute inset-0 bg-lipstick/40 mix-blend-multiply group-hover:opacity-0 transition-opacity"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8 md:p-12">
                      <h3 className="text-3xl md:text-5xl font-black text-white mb-2 tracking-tighter">{event.title}</h3>
                      <p className="text-white/80 text-sm md:text-lg font-bold max-w-xl">{event.description}</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full bg-lipstick/5 flex flex-col justify-center items-center text-center p-8 rounded-[2.5rem] shadow-sm border border-lipstick/10 relative">
                    <Sparkles className="absolute top-8 right-8 text-lipstick/20 w-16 h-16" />
                    <h3 className="text-3xl md:text-5xl font-black text-lipstick-dark mb-4 tracking-tighter">{event.title}</h3>
                    <p className="text-gray-500 font-bold max-w-2xl text-sm md:text-xl leading-relaxed">{event.description}</p>
                  </div>
                )}
              </SwiperSlide>
            ))}
          </Swiper>
        </section>
      )}

      {/* Main Content Info */}
      <section>
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="text-center md:text-left">
            <span className="text-lipstick-dark font-black tracking-[0.3em] uppercase text-[10px] mb-2 block">Our Collection</span>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 leading-[0.9] tracking-tighter">
              {filterCat ? (filterCat === 'skincare' ? 'স্কিনকেয়ার' : filterCat === 'cosmetics' ? 'মেকআপ' : filterCat === 'haircare' ? 'হেয়ারকেয়ার' : filterCat) : 'সকল প্রোডাক্ট'}
            </h2>
          </div>
          {filterCat && (
            <Link href="/" className="group flex items-center bg-gray-100 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-500 hover:bg-lipstick hover:text-white transition-all">
              সব দেখুন
              <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="aspect-[4/5] bg-gray-100 w-full mb-4"></div>
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-gray-100 rounded-full w-3/4"></div>
                  <div className="h-4 bg-gray-100 rounded-full w-1/2"></div>
                  <div className="h-12 bg-gray-100 rounded-2xl w-full mt-6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : displayProducts.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8"
          >
            {displayProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-gray-200">
            <div className="text-7xl mb-6">🏜️</div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">কোনো প্রোডাক্ট পাওয়া যায়নি!</h3>
            <p className="text-gray-400 font-bold max-w-sm mx-auto mb-10">আপনার সার্চ বা ফিল্টারের সাথে মিলে যায় এমন কোনো পণ্য বর্তমানে নেই।</p>
            <Link href="/" className="inline-block px-10 py-5 bg-lipstick text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-lipstick/20">
              সব প্রোডাক্ট দেখুন
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-[70vh]"><div className="w-12 h-12 border-4 border-lipstick border-t-transparent rounded-full animate-spin"></div></div>}>
      <HomeContent />
    </Suspense>
  );
}
