import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider } from '@/lib/i18n';
import { AuthProvider } from '@/lib/auth-context';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import SitewideBanner from '@/components/sitewide-banner';
import FloatingWidgets from '@/components/floating-widgets';

export const metadata: Metadata = {
  title: {
    default: 'Plotify Bangladesh | Premium Real Estate Marketplace',
    template: '%s | Plotify Bangladesh',
  },
  description: 'Find, buy, sell, and rent verified apartments, houses, plots, mess rooms & hotels across Bangladesh. Direct owner contact, 100% verified listings, transparent BDT pricing.',
  keywords: ['bangladesh real estate', 'dhaka apartment sale', 'gulshan flat', 'bashundhara plot', 'rent flat dhaka', 'property bangladesh'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://plotify.com.bd',
    siteName: 'Plotify Bangladesh',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 dark:bg-dark-900 text-slate-900 dark:text-slate-100 antialiased transition-colors duration-200">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <div className="flex flex-col min-h-screen">
                <SitewideBanner />
                <Navbar />
                <main className="flex-1 flex flex-col">{children}</main>
                <Footer />
              </div>
              <FloatingWidgets />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
