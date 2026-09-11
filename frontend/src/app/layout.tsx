import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'ФРИПЕТ - Передай животному дом',
  description: 'Платформа для передачи животных новым владельцам',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('fripet-theme');var isLight=t?t==='light':!!(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches);document.documentElement.classList.toggle('light',!!isLight);}catch(e){}})();`,
          }}
        />
      </head>
      <body className={inter.className}>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
