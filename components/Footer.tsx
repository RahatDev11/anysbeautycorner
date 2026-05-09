import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-lipstick text-white py-8 md:py-12 mt-auto">
      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-x-4 gap-y-8 md:gap-10 mb-8 md:mb-12">
          <div className="col-span-2 md:col-span-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-white rounded-xl overflow-hidden relative shadow-sm">
                <Image 
                  src="/logo.jpg" 
                  alt="Logo" 
                  fill 
                  className="object-contain p-1"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="text-xl md:text-2xl font-serif italic">Any&apos;s Beauty Corner</h3>
            </div>
            <p className="text-sm md:text-base opacity-80 leading-relaxed max-w-sm mb-6">আপনার সৌন্দর্য চর্চার বিশ্বস্ত সঙ্গী। আমরা বিশ্বাস করি প্রতিটি মানুষের ত্বকের যত্ন নেওয়া প্রয়োজন সঠিক ও আসল প্রোডাক্ট দিয়ে।</p>
            <div className="flex gap-4">
              {['Facebook', 'Instagram', 'TikTok'].map(platform => (
                <span key={platform} className="text-xs uppercase tracking-widest font-bold border-b border-white/40 pb-0.5 hover:border-white transition-all cursor-pointer opacity-80 hover:opacity-100">{platform}</span>
              ))}
            </div>
          </div>
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-4 md:mb-5 opacity-60">Company</h4>
            <ul className="space-y-2.5 md:space-y-3 text-sm md:text-base font-medium">
              <li><Link href="/" className="hover:opacity-60 transition-opacity">হোম</Link></li>
              <li><Link href="/order-track" className="hover:opacity-60 transition-opacity">অর্ডার ট্র্যাক</Link></li>
              <li><Link href="/#categories" className="hover:opacity-60 transition-opacity">কলেকশন</Link></li>
            </ul>
          </div>
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-4 md:mb-5 opacity-60">Categories</h4>
            <ul className="space-y-2.5 md:space-y-3 text-sm md:text-base font-medium">
              <li><Link href="/?filter=cosmetics" className="hover:opacity-60 transition-opacity">মেকআপ</Link></li>
              <li><Link href="/?filter=skincare" className="hover:opacity-60 transition-opacity">স্কিনকেয়ার</Link></li>
              <li><Link href="/?filter=haircare" className="hover:opacity-60 transition-opacity">হেয়ারকেয়ার</Link></li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-4 md:mb-5 opacity-60">Contact</h4>
            <ul className="space-y-4 md:space-y-5 text-sm md:text-base font-medium">
              <li className="flex flex-col">
                <span className="text-xs uppercase tracking-widest opacity-50 mb-0.5">Visit Us</span>
                <span>মিরপুর 10, ঢাকা</span>
              </li>
              <li className="flex flex-col">
                <span className="text-xs uppercase tracking-widest opacity-50 mb-0.5">Call Support</span>
                <a href="tel:+8801931866636" className="text-lg font-serif italic">+880 1931-866636</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] uppercase tracking-[0.3em] font-bold opacity-40">
          <p>© {new Date().getFullYear()} Any&apos;s Beauty Corner</p>
          <p>Created with dedication</p>
        </div>
      </div>
    </footer>
  );
}
