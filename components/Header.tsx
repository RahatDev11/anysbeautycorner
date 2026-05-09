"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { auth, googleProvider, database } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { ref, onValue, push, update } from "firebase/database";
import Image from "next/image";
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  UserCircle,
  ChevronRight,
  Bell,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";

export default function Header() {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    user,
    setUser,
  } = useStore();
  const router = useRouter();
  const cartItemCount = cart.reduce(
    (total, item) => total + (item.quantity || 0),
    0,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Scroll lock for mobile menu
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  // Fetch notifications
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

  // Client-side detection of order status changes
  useEffect(() => {
    if (!user) return;

    const ordersRef = ref(database, "orders");
    let isFirstEvent = true;

    const unsubscribe = onValue(ordersRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const allOrders = snapshot.val();
      const userOrders: any[] = [];

      Object.keys(allOrders).forEach((key) => {
        const o = allOrders[key];
        if (
          o.userId === user.uid ||
          o.customerEmail === user.email ||
          o.userEmail === user.email
        ) {
          userOrders.push({ id: key, ...o });
        }
      });

      const knownStatuses = JSON.parse(
        localStorage.getItem(`knownOrderStatuses_${user.uid}`) || "{}",
      );
      const newKnownStatuses = { ...knownStatuses };
      let hasChanges = false;

      for (const order of userOrders) {
        const oldStatus = knownStatuses[order.id];
        if (oldStatus && oldStatus !== order.status && !isFirstEvent) {
          // Status changed!
          const notifRef = ref(database, `users/${user.uid}/notifications`);

          const getStatusText = (s: string) => {
            const txt: Record<string, string> = {
              processing: "প্রসেসিং",
              confirmed: "কনফার্মড",
              packaging: "প্যাকেজিং",
              shipped: "ডেলিভারি হয়েছে",
              delivered: "সম্পন্ন হয়েছে",
            };
            return txt[s] || s;
          };

          push(notifRef, {
            orderId: order.orderId || order.id,
            oldStatus,
            newStatus: order.status,
            message: `আপনার অর্ডার #${(order.orderId || order.id).substring(0, 6)} এর স্ট্যাটাস '${getStatusText(order.status)}' হয়েছে।`,
            timestamp: Date.now(),
            read: false,
          });
        }
        if (newKnownStatuses[order.id] !== order.status) {
          newKnownStatuses[order.id] = order.status;
          hasChanges = true;
        }
      }

      if (hasChanges) {
        localStorage.setItem(
          `knownOrderStatuses_${user.uid}`,
          JSON.stringify(newKnownStatuses),
        );
      }

      isFirstEvent = false;
    });

    return () => unsubscribe();
  }, [user]);

  const markNotificationsAsRead = () => {
    if (!user) return;
    notifications.forEach((n) => {
      if (!n.read) {
        update(ref(database, `users/${user.uid}/notifications/${n.id}`), {
          read: true,
        });
      }
    });
  };

  const handleLogout = async () => {
    if (confirm("আপনি কি লগআউট করতে চান?")) {
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
    <>
      <header className="bg-lipstick/90 backdrop-blur-md text-white py-2.5 px-4 md:px-8 flex justify-between items-center fixed top-0 left-0 w-full z-50 shadow-lg shadow-lipstick/5 transition-all duration-300">
        <Link href="/" className="flex items-center text-white shrink-0 group">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="flex items-center"
          >
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:mr-3 mr-2 bg-white overflow-hidden relative shadow-md transform rotate-3 group-hover:rotate-0 transition-transform shrink-0">
              <Image
                src="/logo.png"
                alt="Logo"
                fill
                className="object-contain p-1"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-[17px] leading-[1.05] min-[380px]:text-[20px] sm:text-2xl md:text-3xl font-serif font-semibold tracking-tight italic max-w-[130px] min-[380px]:max-w-[180px] sm:max-w-none line-clamp-2 sm:line-clamp-none sm:whitespace-nowrap">
              Any&apos;s Beauty Corner
            </span>
          </motion.div>
        </Link>

        <div className="flex items-center space-x-3 md:space-x-8 flex-grow justify-end">
          <nav className="hidden lg:flex space-x-6 items-center text-white shrink-0 mr-4 font-bold text-[10px] uppercase tracking-[0.2em] opacity-80">
            <Link href="/" className="hover:opacity-100 transition-opacity">
              হোম
            </Link>
            <Link
              href="/?filter=skincare"
              className="hover:opacity-100 transition-opacity"
            >
              স্কিনকেয়ার
            </Link>
            <Link
              href="/?filter=cosmetics"
              className="hover:opacity-100 transition-opacity"
            >
              মেকআপ
            </Link>
            <Link
              href="/order-track"
              className="hover:opacity-100 transition-opacity"
            >
              অর্ডার ট্র্যাক
            </Link>
          </nav>

          <form
            onSubmit={handleSearch}
            className="hidden lg:block relative max-w-[200px] xl:max-w-[240px] w-full ml-4 group"
          >
            <input
              type="text"
              className="w-full h-9 pl-9 pr-4 border-0 rounded-xl text-gray-800 text-xs transition-all focus:outline-none focus:ring-2 focus:ring-white/50 bg-white/90 backdrop-blur-sm placeholder:text-gray-400 font-medium"
              placeholder="সার্চ করুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-lipstick transition-colors" />
          </form>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button
              className="lg:hidden w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center text-white hover:bg-white/10 rounded-[14px] sm:rounded-2xl transition"
              onClick={() => {
                setIsMobileSearchOpen(!isMobileSearchOpen);
                setIsMobileMenuOpen(false);
                setIsCartOpen(false);
              }}
            >
              <Search className="w-5 h-5" />
            </button>

            <div className="relative hidden lg:block">
              <button
                className="bg-white/10 text-white w-9 h-9 sm:w-11 sm:h-11 rounded-[14px] sm:rounded-2xl flex items-center justify-center relative hover:bg-white/20 transition-all p-2 active:scale-95 border border-white/5"
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setIsUserMenuOpen(false);
                  if (!isNotificationsOpen) markNotificationsAsRead();
                }}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white font-black text-[9px] rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center ring-2 ring-lipstick">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-72 sm:w-80 bg-white rounded-[1.5rem] shadow-2xl py-3 z-[60] border border-gray-100 p-2"
                  >
                    <div className="px-4 py-3 border-b border-gray-100 mb-2 flex justify-between items-center">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        নোটিফিকেশন
                      </p>
                    </div>
                    <div className="max-h-80 overflow-y-auto pr-1 space-y-1">
                      {user ? (
                        notifications.length > 0 ? (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className="p-3 hover:bg-gray-50 rounded-xl transition cursor-pointer"
                            >
                              <p className="text-sm font-bold text-gray-800 leading-tight">
                                {n.message}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-1 font-medium">
                                {new Date(n.timestamp).toLocaleString("bn-BD", {
                                  hour: "numeric",
                                  minute: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center">
                            <Bell className="w-8 h-8 mx-auto text-gray-200 mb-2" />
                            <p className="text-sm text-gray-500 font-medium">
                              কোনো নতুন নোটিফিকেশন নেই
                            </p>
                          </div>
                        )
                      ) : (
                        <div className="p-6 text-center">
                          <Bell className="w-8 h-8 mx-auto text-gray-200 mb-2" />
                          <p className="text-sm text-gray-500 font-medium">
                            লগইন করুন
                          </p>
                          <Link
                            href="/profile"
                            onClick={() => setIsNotificationsOpen(false)}
                            className="mt-3 block w-full py-2 bg-lipstick text-white text-xs font-bold rounded-xl hover:bg-rose-600 transition-colors"
                          >
                            প্রোফাইলে যান
                          </Link>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              className="bg-white text-lipstick w-9 h-9 sm:w-11 sm:h-11 rounded-[14px] sm:rounded-2xl shadow-xl flex items-center justify-center relative hover:scale-105 transition-transform active:scale-95 group"
              onClick={() => {
                setIsCartOpen(!isCartOpen);
                setIsMobileMenuOpen(false);
                setIsNotificationsOpen(false);
              }}
            >
              <ShoppingBag className="w-5 h-5 group-hover:rotate-6 transition-transform" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-gray-900 text-white font-black text-[10px] rounded-full h-4 w-4 sm:h-6 sm:w-6 flex items-center justify-center ring-2 sm:ring-4 ring-lipstick md:ring-white">
                  {cartItemCount}
                </span>
              )}
            </button>

            <button
              className="lg:hidden bg-white/10 text-white w-9 h-9 sm:w-11 sm:h-11 rounded-[14px] sm:rounded-2xl flex items-center justify-center transition-all p-2 active:scale-95"
              onClick={() => {
                setIsMobileMenuOpen(!isMobileMenuOpen);
                setIsCartOpen(false);
                setIsNotificationsOpen(false);
              }}
            >
              <Menu className="w-6 h-6 sm:w-7 sm:h-7" />
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Dropdown */}
        <AnimatePresence>
          {isMobileSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden absolute top-full left-0 w-full bg-white shadow-xl overflow-hidden border-t border-gray-100 z-40 origin-top"
            >
              <div className="p-4 bg-white">
                <form
                  onSubmit={(e) => {
                    handleSearch(e);
                    setIsMobileSearchOpen(false);
                  }}
                  className="relative group"
                >
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-gray-400 group-focus-within:text-lipstick transition-colors" />
                  </div>
                  <input
                    type="text"
                    className="w-full h-12 lg:h-13 pl-12 pr-4 border-2 border-gray-100 rounded-2xl text-gray-800 transition-all focus:outline-none focus:border-lipstick bg-gray-50/50 font-bold text-sm"
                    placeholder="পণ্য সার্চ করুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute top-0 right-0 h-full w-[85%] max-w-sm bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] flex flex-col rounded-l-[2rem] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 bg-lipstick text-white shadow-md relative z-10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white rounded-xl overflow-hidden relative shadow-sm transform -rotate-3">
                    <Image
                      src="/logo.png"
                      alt="Logo"
                      fill
                      className="object-contain p-1"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-serif italic text-[17px] leading-none">
                      Any&apos;s Beauty Corner
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70 mt-0.5">
                      Explore Menu
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="bg-white/20 p-2.5 rounded-2xl hover:bg-white/30 transition-all active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-grow space-y-8 bg-white">
                {user && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsNotificationsOpen(true);
                        if (unreadCount > 0) markNotificationsAsRead();
                      }}
                      className="flex-1 flex items-center justify-center py-3 bg-gray-50 rounded-[1.25rem] border border-gray-100 hover:bg-gray-100 transition-colors"
                    >
                      <div className="relative">
                        <Bell className="w-5 h-5 text-gray-700" />
                        {unreadCount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-black text-[9px] rounded-full h-4 w-4 flex items-center justify-center ring-2 ring-white">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </button>

                    <Link
                      href="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex-1 flex items-center justify-center py-3 bg-gray-50 rounded-[1.25rem] border border-gray-100 hover:bg-gray-100 transition-colors"
                    >
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="User" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
                      ) : (
                        <UserCircle className="w-6 h-6 text-gray-700" />
                      )}
                    </Link>
                  </div>
                )}

                {!user && (
                  <div className="pt-2">
                    <Link
                      href="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full py-3.5 flex items-center justify-center gap-2 border-2 border-gray-100 text-gray-700 rounded-[1.25rem] font-bold text-sm hover:bg-gray-50 transition-all active:scale-[0.98]"
                    >
                      <UserCircle className="w-5 h-5" />
                      লগইন করুন
                    </Link>
                  </div>
                )}

                <div className="space-y-5">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      প্রধান মেনু
                    </p>
                    <div className="h-px flex-1 bg-gray-100 ml-4"></div>
                  </div>
                  <ul className="space-y-2.5">
                    {[
                      { label: "হোম পেইজ", href: "/" },
                      {
                        label: "স্কিনকেয়ার কালেকশন",
                        href: "/?filter=skincare",
                      },
                      { label: "মেকআপ ও কসমেটিকস", href: "/?filter=cosmetics" },
                      { label: "হেয়ারকেয়ার টিপস", href: "/?filter=haircare" },
                      { label: "অর্ডার ট্র্যাক করুন", href: "/order-track" },
                    ].map((item, idx) => (
                      <li key={idx}>
                        <Link
                          href={item.href}
                          className="flex items-center group p-4 border border-transparent rounded-[1.25rem] hover:bg-gray-50 transition-all font-bold text-gray-700 hover:text-lipstick text-sm"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <span className="flex-1">{item.label}</span>
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {user && (
                  <button
                    onClick={handleLogout}
                    className="w-full py-4 text-center border-2 border-red-50 text-red-500 rounded-[1.25rem] font-bold text-sm hover:bg-red-50 transition-all active:scale-[0.98]"
                  >
                    লগআউট
                  </button>
                )}
              </div>

              <div className="p-8 border-t border-gray-50 bg-gray-50/50 flex flex-col items-center">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-xl bg-white overflow-hidden relative shadow-sm">
                    <Image
                      src="/logo.png"
                      alt="Logo"
                      fill
                      className="object-contain p-1"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="font-serif italic text-xs">
                    Any&apos;s Beauty Corner
                  </span>
                </div>
                <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.3em] text-center">
                  Privacy Policy • Terms Service
                </p>
                <p className="text-[8px] font-bold text-gray-200 uppercase tracking-widest text-center mt-2">
                  © {new Date().getFullYear()} All Rights Reserved
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
