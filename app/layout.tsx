import type {Metadata} from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartSidebar from '@/components/CartSidebar';

export const metadata: Metadata = {
  title: "Any's Beauty Corner",
  description: "আপনার সৌন্দর্য চর্চার বিশ্বস্ত সঙ্গী।",
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="antialiased flex flex-col min-h-screen" suppressHydrationWarning>
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
