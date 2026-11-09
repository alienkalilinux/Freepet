import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CookieConsent from '@/components/CookieConsent';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://fripet.kz';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ФРИПЕТ — передай животному дом',
    template: '%s — ФРИПЕТ',
  },
  description:
    'Бесплатная платформа для передачи животных новым владельцам: анкеты, чат, заявки и поиск по городу.',
  applicationName: 'ФРИПЕТ',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'ru_KZ',
    siteName: 'ФРИПЕТ',
    title: 'ФРИПЕТ — передай животному дом',
    description:
      'Бесплатная платформа для передачи животных новым владельцам. Без комиссии и платежей.',
    url: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('fripet-theme');var isDark=t?t==='dark':!!(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',!!isDark);}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Перейти к содержанию
        </a>
        <Navbar />
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
