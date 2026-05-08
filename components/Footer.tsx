import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-lipstick text-white py-10 mt-auto">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-1">
            <h3 className="text-xl font-bold mb-4">Any&apos;s Beauty Corner</h3>
            <p className="text-sm opacity-90 leading-relaxed">আপনার সৌন্দর্য চর্চার বিশ্বস্ত সঙ্গী। স্বাস্থ্য, স্কিনকেয়ার ও মেকআপের আসল প্রোডাক্ট সুলভ মূল্যে।</p>
          </div>
          <div>
            <h4 className="font-semibold border-b border-white/20 pb-2 mb-4">দরকারি লিংক</h4>
            <ul className="space-y-2 text-sm opacity-90">
              <li><Link href="/" className="hover:underline">হোম</Link></li>
              <li><Link href="/order-track" className="hover:underline">অর্ডার ট্র্যাক</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold border-b border-white/20 pb-2 mb-4">ক্যাটাগরি</h4>
            <ul className="space-y-2 text-sm opacity-90">
              <li><Link href="/?filter=cosmetics" className="hover:underline">মেকআপ</Link></li>
              <li><Link href="/?filter=skincare" className="hover:underline">স্কিনকেয়ার</Link></li>
              <li><Link href="/?filter=haircare" className="hover:underline">হেয়ারকেয়ার</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold border-b border-white/20 pb-2 mb-4">যোগাযোগ</h4>
            <ul className="space-y-3 text-sm opacity-90">
              <li className="flex items-start">
                <span className="mr-2">📍</span>
                <span>মিরপুর ১০, ঢাকা</span>
              </li>
              <li className="flex items-center">
                <span className="mr-2">📞</span>
                <a href="tel:+8801931866636" className="hover:underline">+880 1931-866636</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/20 pt-6 text-sm text-center opacity-80">
          <p>© {new Date().getFullYear()} Any&apos;s Beauty Corner. সর্বস্বত্ব সংরক্ষিত।</p>
        </div>
      </div>
    </footer>
  );
}
