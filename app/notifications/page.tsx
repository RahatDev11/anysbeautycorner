"use client";

import { useState, useEffect } from "react";
import { database } from "@/lib/firebase";
import { ref, onValue, update } from "firebase/database";
import { useStore } from "@/lib/store";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Check, Clock, Package, Heart, LayoutDashboard, ChevronLeft, LogIn } from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
  const { user } = useStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const { permission, requestPermission } = usePushNotifications(user?.uid);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    const notificationsRef = ref(database, `users/${user.uid}/notifications`);
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const notifs = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        notifs.sort((a, b) => b.timestamp - a.timestamp);
        setNotifications(notifs);
      } else {
        setNotifications([]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const markAsRead = (id: string, isRead: boolean) => {
    if (!user || isRead) return;
    update(ref(database, `users/${user.uid}/notifications/${id}`), {
      read: true
    });
  };

  const markAllAsRead = () => {
    if (!user) return;
    const updates: any = {};
    notifications.forEach(n => {
      if (!n.read) {
        updates[`users/${user.uid}/notifications/${n.id}/read`] = true;
      }
    });
    if (Object.keys(updates).length > 0) {
      update(ref(database), updates);
    }
  };

  // Helper to get time elapsed
  const timeAgo = (timestamp: number) => {
    const now = Date.now();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);

    if (diffInSeconds < 60) return "এইমাত্র";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} মিনিট আগে`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} ঘণ্টা আগে`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} দিন আগে`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'promo':
        return <Heart className="w-5 h-5 text-pink-500" />;
      case 'system':
        return <LayoutDashboard className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  if (!user) {
     return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
              <LogIn className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">লগইন প্রয়োজন</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
              নোটিফিকেশন দেখতে অনুগ্রহ করে আপনার অ্যাকাউন্টে লগইন করুন।
            </p>
            <Link
              href="/profile"
              className="px-6 py-3 bg-lipstick text-white text-sm font-bold rounded-xl hover:bg-lipstick-dark transition-colors inline-block"
            >
              প্রোফাইলে যান
            </Link>
          </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-10 pt-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <Link 
              href="/"
              className="p-2 bg-white rounded-xl shadow-sm text-gray-500 hover:text-gray-900 border border-gray-100 transition-colors active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-gray-900">নোটিফিকেশন</h1>
              <p className="text-sm text-gray-500 mt-1">আপনার সকল আপডেট এখানে দেখুন</p>
            </div>
          </div>
          
          {notifications.some(n => !n.read) && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-lipstick transition-all active:scale-95 shadow-sm"
            >
              <Check className="w-4 h-4" />
              সব পড়া হয়েছে
            </button>
          )}
        </div>

        <div className="space-y-4">
          {user && permission !== 'granted' && (
            <div className="p-4 bg-lipstick/5 rounded-2xl border border-lipstick/10 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-gray-900 mb-1">সরাসরি মোবাইলে নোটিফিকেশন পেতে চান?</p>
                <p className="text-xs text-gray-600">নতুন অফার, অর্ডার আপডেট সরাসরি আপনার স্ক্রিনে পেতে অ্যালাউ করুন।</p>
              </div>
              <button 
                onClick={() => requestPermission()}
                className="w-full sm:w-auto px-6 py-2.5 bg-lipstick text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-lipstick-dark transition-colors whitespace-nowrap shrink-0"
              >
                অ্যালাউ করুন
              </button>
            </div>
          )}
          
          <AnimatePresence>
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className={`bg-white rounded-[1.5rem] p-5 sm:p-6 shadow-sm border transition-all ${
                    !notification.read ? 'border-lipstick/30 shadow-lipstick/5' : 'border-gray-100'
                  }`}
                  onClick={() => markAsRead(notification.id, notification.read)}
                >
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      !notification.read ? 'bg-lipstick/10' : 'bg-gray-50'
                    }`}>
                      {getIcon(notification.type || 'system')}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={`text-base font-bold ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="w-2.5 h-2.5 bg-lipstick rounded-full mt-1 shrink-0" />
                        )}
                      </div>
                      <p className={`text-sm ${!notification.read ? 'text-gray-700' : 'text-gray-500'} mb-3`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{timeAgo(notification.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-[1.5rem] p-12 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center"
              >
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">কোনো নোটিফিকেশন নেই</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">
                  নতুন কোনো আপডেট আসলে এখানে দেখানো হবে। প্রোমশন বা অর্ডারের খবরের জন্য চোখ রাখুন।
                </p>
                <Link
                  href="/"
                  className="mt-6 px-6 py-3 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors"
                >
                  শপিং করুন
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
