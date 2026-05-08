import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-lipstick text-white py-12 mt-auto">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
          <div className="md:col-span-5">
            <h3 className="text-2xl font-serif italic mb-4">Any&apos;s Beauty Corner</h3>
            <p className="text-sm opacity-80 leading-relaxed max-w-sm mb-6">আপনার সৌন্দর্য চর্চার বিশ্বস্ত সঙ্গী। আমরা বিশ্বাস করি প্রতিটি মানুষের ত্বকের যত্ন নেওয়া প্রয়োজন সঠিক ও আসল প্রোডাক্ট দিয়ে।</p>
            <div className="flex gap-4">
              {['Facebook', 'Instagram', 'TikTok'].map(platform => (
                <span key={platform} className="text-[10px] uppercase tracking-widest font-bold border-b border-white/40 pb-0.5 hover:border-white transition-all cursor-pointer opacity-80 hover:opacity-100">{platform}</span>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] mb-5 opacity-60">Company</h4>
            <ul className="space-y-3 text-xs font-medium">
              <li><Link href="/" className="hover:opacity-60 transition-opacity">হোম</Link></li>
              <li><Link href="/order-track" className="hover:opacity-60 transition-opacity">অর্ডার ট্র্যাক</Link></li>
              <li><Link href="/#categories" className="hover:opacity-60 transition-opacity">কলেকশন</Link></li>
            </ul>
          </div>
          <div className="md:col-span-2">
            <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] mb-5 opacity-60">Categories</h4>
            <ul className="space-y-3 text-xs font-medium">
              <li><Link href="/?filter=cosmetics" className="hover:opacity-60 transition-opacity">মেকআপ</Link></li>
              <li><Link href="/?filter=skincare" className="hover:opacity-60 transition-opacity">স্কিনকেয়ার</Link></li>
              <li><Link href="/?filter=haircare" className="hover:opacity-60 transition-opacity">হেয়ারকেয়ার</Link></li>
            </ul>
          </div>
          <div className="md:col-span-3">
            <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] mb-5 opacity-60">Contact</h4>
            <ul className="space-y-5 text-xs font-medium">
              <li className="flex flex-col">
                <span className="text-[9px] uppercase tracking-widest opacity-50 mb-0.5">Visit Us</span>
                <span>মিরপুর ১০, ঢাকা</span>
              </li>
              <li className="flex flex-col">
                <span className="text-[9px] uppercase tracking-widest opacity-50 mb-0.5">Call Support</span>
                <a href="tel:+8801931866636" className="text-base font-serif italic">+880 1931-866636</a>
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
