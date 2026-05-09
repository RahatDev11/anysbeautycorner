'use client';

import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { PackageOpen, MapPin, User, Mail, Settings, Edit3, ArrowRight, ShieldCheck, Heart, LogIn } from 'lucide-react';
import Link from 'next/link';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';

export default function Profile() {
  const { user, setUser } = useStore();
  const router = useRouter();

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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50/50 pt-32 pb-12 px-4 sm:px-6 flex flex-col items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-10 rounded-[2rem] shadow-sm border border-gray-100 max-w-md w-full text-center relative overflow-hidden"
        >
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-lipstick/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"></div>
          
          <div className="w-20 h-20 bg-lipstick/10 text-lipstick rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
            <User className="w-10 h-10" />
          </div>
          
          <h1 className="text-2xl font-serif font-bold text-gray-900 mb-3 relative z-10">আপনার প্রোফাইল</h1>
          <p className="text-gray-500 mb-8 font-medium relative z-10">আপনার প্রোফাইল দেখতে এবং অর্ডার পরিচালনা করতে অনুগ্রহ করে লগইন করুন।</p>
          
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-lipstick text-white py-4 rounded-xl font-bold hover:bg-rose-600 transition-colors shadow-lg shadow-lipstick/20 hover:shadow-lipstick/30 hover:-translate-y-0.5 relative z-10"
          >
            <LogIn className="w-5 h-5" />
            গুগল দিয়ে লগইন করুন
          </button>
          
          <div className="mt-6 text-sm text-gray-400 font-medium relative z-10">
            <Link href="/" className="hover:text-lipstick underline underline-offset-4 transition-colors">হোম পেইজে ফিরে যান</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8">
        
        {/* Header Section */}
        <div className="flex items-center gap-2 text-sm font-black text-gray-400 uppercase tracking-widest pl-2">
          <Link href="/" className="hover:text-lipstick transition-colors">হোম</Link>
          <span>/</span>
          <span className="text-lipstick">প্রোফাইল</span>
        </div>

        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden"
        >
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-lipstick/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none"></div>

          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] overflow-hidden shadow-lg border-4 border-white bg-gray-100 relative z-10">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-lipstick/10 text-lipstick">
                  <User className="w-12 h-12" />
                </div>
              )}
            </div>
            <button className="absolute -bottom-3 -right-3 w-10 h-10 bg-white shadow-lg rounded-xl border border-gray-100 flex items-center justify-center text-gray-600 hover:text-lipstick hover:scale-110 transition-all z-20">
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 text-center md:text-left z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              ভেরিফাইড অ্যাকাউন্ট
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-semibold text-gray-900 mb-2 truncate max-w-[200px] sm:max-w-[300px] md:max-w-none mx-auto md:mx-0">{user.displayName}</h1>
            <p className="text-gray-500 font-medium mb-6 flex items-center justify-center md:justify-start gap-2">
              <Mail className="w-4 h-4" />
              {user.email || 'ইমেইল দেওয়া হয়নি'}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <Link href="/order-track" className="px-6 py-3 bg-lipstick text-white rounded-xl font-bold md:text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all outline-none focus:ring-2 focus:ring-lipstick/50 focus:ring-offset-2 flex items-center gap-2">
                <PackageOpen className="w-4 h-4" />
                অর্ডার ট্র্যাক করুন
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-1 md:col-span-2 lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
          >
             <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
                 <PackageOpen className="w-5 h-5" />
               </div>
               <div>
                  <h3 className="font-bold text-gray-900">সাম্প্রতিক অর্ডার</h3>
                  <p className="text-xs text-gray-500 font-medium">আপনার সবশেষ কেনাকাটাগুলো</p>
               </div>
             </div>

             {/* Content placeholder - in a real app this would fetch orders */}
             <div className="text-center py-10 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100">
               <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-gray-400">
                 <PackageOpen className="w-6 h-6" />
               </div>
               <p className="text-gray-500 font-medium mb-4">আপনার কোনো সাম্প্রতিক অর্ডার নেই</p>
               <Link href="/" className="inline-flex items-center gap-2 font-bold text-lipstick hover:text-rose-600 transition-colors">
                  শপিং শুরু করুন <ArrowRight className="w-4 h-4" />
               </Link>
             </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col"
          >
             <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                 <MapPin className="w-5 h-5" />
               </div>
               <div>
                  <h3 className="font-bold text-gray-900">ঠিকানা</h3>
                  <p className="text-xs text-gray-500 font-medium">ডেলিভারি ঠিকানা</p>
               </div>
             </div>

             <div className="flex-1 text-center py-8 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center">
               <p className="text-gray-500 font-medium mb-3">কোনো ঠিকানা সেভ করা নেই</p>
               <button className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center gap-2">
                 <Edit3 className="w-4 h-4" />
                 ঠিকানা যোগ করুন
               </button>
             </div>
          </motion.div>

          {/* Additional Quick Links */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {[
              { icon: Heart, label: 'উইশলিস্ট', desc: 'আপনার পছন্দের পণ্য', colorClass: 'bg-pink-50 text-pink-500' },
              { icon: MapPin, label: 'সেভড ঠিকানা', desc: 'ম্যানেজ করুন', colorClass: 'bg-blue-50 text-blue-500' },
              { icon: Settings, label: 'সেটিংস', desc: 'অ্যাকাউন্টের পছন্দসমূহ', colorClass: 'bg-gray-50 text-gray-500' },
              { icon: Mail, label: 'নোটিফিকেশন', desc: 'আপডেট পান', colorClass: 'bg-purple-50 text-purple-500' },
            ].map((item, idx) => (
              <button key={idx} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-lipstick/30 hover:shadow-md transition-all text-left outline-none focus:ring-2 focus:ring-lipstick/20 group">
                <div className={`w-12 h-12 rounded-2xl ${item.colorClass} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 group-hover:text-lipstick transition-colors">{item.label}</p>
                  <p className="text-xs text-gray-500 font-medium">{item.desc}</p>
                </div>
              </button>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
