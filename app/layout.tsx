import type {Metadata} from 'next';
import './globals.css';

import { Providers } from '@/components/Providers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartSidebar from '@/components/CartSidebar';
import { Inter, Cormorant_Garamond } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: "Any's Beauty Corner",
  description: "আপনার সৌন্দর্য চর্চার বিশ্বস্ত সঙ্গী।",
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body className="antialiased flex flex-col min-h-screen font-sans bg-[#fcfaf9]" suppressHydrationWarning>
        <Providers>
          <Header />
          <CartSidebar />
          <main className="flex-1 mt-16 md:mt-20">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
