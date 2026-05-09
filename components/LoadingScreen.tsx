'use client';

import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function LoadingScreen({ isLoading }: { isLoading?: boolean }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (isLoading === undefined) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 2500); // Show for 2.5 seconds
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const show = isLoading !== undefined ? isLoading : isVisible;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6"
        >
          <div className="relative flex flex-col items-center">
            {/* Logo Wrapper */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 1.2, 
                ease: [0.16, 1, 0.3, 1] 
              }}
              className="w-36 h-36 md:w-44 md:h-44 rounded-full p-1 mb-10 relative flex items-center justify-center bg-white shadow-xl shadow-lipstick/10 border border-lipstick/5"
            >
              <div className="w-[90%] h-[90%] rounded-full overflow-hidden border border-lipstick/10 bg-white flex flex-col items-center justify-center relative">
                 <Image 
                   src="/logo.jpg" 
                   alt="Any's Beauty Corner Logo" 
                   fill 
                   className="object-contain p-2"
                   referrerPolicy="no-referrer"
                   priority
                 />
              </div>
              
              {/* Outer Pulsing Glow */}
              <motion.div 
                animate={{ 
                  scale: [1, 1.05, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-lipstick/5 rounded-full -z-10 blur-xl"
              />
            </motion.div>

            {/* Text Animation */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-center relative"
            >
              <h1 className="text-4xl md:text-5xl font-serif text-lipstick-dark font-medium tracking-tight mb-2 flex items-center justify-center">
                Any&apos;s <span className="text-lipstick italic ml-2">Beauty</span> <span className="ml-2">Corner</span>
              </h1>
              <div className="flex items-center justify-center gap-4">
                <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-lipstick/20" />
                <p className="text-[11px] font-bold uppercase tracking-[0.6em] text-gray-400 ml-2">Luxury Cosmetics</p>
                <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-lipstick/20" />
              </div>
            </motion.div>

            {/* Progress indicator */}
            <div className="absolute bottom-[-100px] w-48 h-1 bg-gray-50 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ x: "-100%" }}
                 animate={{ x: "200%" }}
                 transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                 className="h-full bg-lipstick w-1/2 rounded-full"
               />
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-12 text-[10px] font-bold text-gray-300 uppercase tracking-widest"
          >
            Loading your beauty journey...
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
