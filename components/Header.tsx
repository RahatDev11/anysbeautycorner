'use client';

import Link from 'next/link';
import { useStore } from '@/lib/store';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { ShoppingBag, Search, Menu, X, UserCircle, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';

export default function Header() {
  const { cart, isCartOpen, setIsCartOpen, isMobileMenuOpen, setIsMobileMenuOpen, user, setUser } = useStore();
  const router = useRouter();
  const cartItemCount = cart.reduce((total, item) => total + (item.quantity || 0), 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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
      console.error('Login failed', error);
      alert('লগইন ব্যর্থ হয়েছে।');
    }
  };

  const handleLogout = async () => {
    if (confirm('আপনি কি লগআউট করতে চান?')) {
      await signOut(auth);
      setUser(null);
      setIsUserMenuOpen(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header className="bg-lipstick/90 backdrop-blur-md text-white py-3 px-4 md:px-8 flex justify-between items-center fixed top-0 left-0 w-full z-50 shadow-lg shadow-lipstick/10 transition-all duration-300">
      <Link href="/" className="flex items-center text-white shrink-0 group">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="flex items-center"
        >
          <div className="h-10 w-10 rounded-2xl mr-3 bg-white text-lipstick flex justify-center items-center font-black shadow-md transform rotate-3 group-hover:rotate-0 transition-transform">AB</div>
          <span className="text-lg md:text-xl font-black whitespace-nowrap hidden sm:block tracking-tighter">Any&apos;s Beauty Corner</span>
        </motion.div>
      </Link>

      <div className="flex items-center space-x-3 md:space-x-6 flex-grow justify-end">
        <nav className="hidden lg:flex space-x-8 items-center text-white shrink-0 mr-4 font-bold text-sm uppercase tracking-widest">
          <Link href="/" className="opacity-80 hover:opacity-100 transition-opacity">হোম</Link>
          <Link href="/?filter=skincare" className="opacity-80 hover:opacity-100 transition-opacity">স্কিনকেয়ার</Link>
          <Link href="/?filter=cosmetics" className="opacity-80 hover:opacity-100 transition-opacity">মেকআপ</Link>
          <Link href="/order-track" className="opacity-80 hover:opacity-100 transition-opacity">অর্ডার ট্র্যাক</Link>
        </nav>

        <form onSubmit={handleSearch} className="hidden md:block relative max-w-[240px] xl:max-w-xs w-full ml-4 group">
          <input
            type="text"
            className="w-full h-11 pl-11 pr-4 border-0 rounded-2xl text-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/90 backdrop-blur-sm placeholder:text-gray-400 font-medium"
            placeholder="প্রোডাক্ট সার্চ করুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-lipstick transition-colors" />
        </form>

        <div className="flex items-center gap-2">
          <button className="md:hidden p-2.5 text-white hover:bg-white/10 rounded-xl transition" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Search className="w-6 h-6" />
          </button>

          <div className="relative">
            {user ? (
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 bg-white/10 p-1.5 pr-3 rounded-2xl hover:bg-white/20 transition-all border border-white/5"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-xl shadow-sm" />
                ) : (
                  <UserCircle className="w-8 h-8" />
                )}
                <span className="text-xs font-black max-w-[80px] truncate hidden md:block uppercase tracking-wider">{user.displayName?.split(' ')[0]}</span>
              </button>
            ) : (
              <button className="flex items-center p-2.5 hover:bg-white/10 rounded-xl transition text-white" onClick={handleLogin}>
                <UserCircle className="w-6 h-6" />
              </button>
            )}

            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-56 bg-white rounded-[1.5rem] shadow-2xl py-3 z-[60] border border-gray-100 p-2"
                >
                  <div className="px-4 py-3 border-b border-gray-100 mb-2">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">অ্যাকাউন্ট</p>
                    <p className="text-sm font-bold text-gray-800 truncate">{user?.displayName}</p>
                  </div>
                  <Link href="/order-track" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition font-bold" onClick={() => setIsUserMenuOpen(false)}>
                    আমার অর্ডার
                  </Link>
                  <button className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 rounded-xl transition font-bold mt-1" onClick={handleLogout}>
                    লগআউট
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            className="bg-white text-lipstick w-11 h-11 rounded-2xl shadow-xl flex items-center justify-center relative hover:scale-105 transition-transform active:scale-95 group"
            onClick={() => setIsCartOpen(!isCartOpen)}
          >
            <ShoppingBag className="w-5 h-5 group-hover:rotate-6 transition-transform" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-gray-900 text-white font-black text-[10px] rounded-full h-6 w-6 flex items-center justify-center ring-4 ring-lipstick md:ring-white">
                {cartItemCount}
              </span>
            )}
          </button>

          <button
            className="md:hidden bg-white/10 text-white w-11 h-11 rounded-2xl flex items-center justify-center transition-all p-2.5 active:scale-95"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-[85%] max-w-sm bg-white z-[100] shadow-2xl flex flex-col rounded-l-[2rem] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 bg-lipstick text-white flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-white rounded-lg text-lipstick flex items-center justify-center font-black">AB</div>
                  <span className="font-black tracking-tighter uppercase text-sm">Navigation</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="bg-white/20 p-2 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-grow space-y-8">
                 <form onSubmit={handleSearch} className="relative group">
                  <input
                    type="text"
                    className="w-full h-12 pl-12 pr-4 border-2 border-gray-100 rounded-2xl text-gray-800 transition-all focus:outline-none focus:border-lipstick bg-gray-50 font-bold text-sm"
                    placeholder="পণ্য সার্চ করুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </form>

                <div className="space-y-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">ক্যাটাগরি</p>
                  <ul className="space-y-2">
                    {[
                      { label: 'হোম', href: '/' },
                      { label: 'স্কিনকেয়ার', href: '/?filter=skincare' },
                      { label: 'মেকআপ', href: '/?filter=cosmetics' },
                      { label: 'হেয়ারকেয়ার', href: '/?filter=haircare' },
                      { label: 'অর্ডার ট্র্যাক', href: '/order-track' },
                    ].map((item, idx) => (
                      <li key={idx}>
                        <Link 
                          href={item.href} 
                          className="flex items-center group p-4 bg-gray-50 rounded-2xl hover:bg-lipstick hover:text-white transition-all font-black text-gray-700 text-sm"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <span className="flex-1">{item.label}</span>
                          <ChevronRight className="w-4 h-4 opacity-30 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-6 border-t border-gray-50 bg-gray-50/50">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-4">Any&apos;s Beauty Corner</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
