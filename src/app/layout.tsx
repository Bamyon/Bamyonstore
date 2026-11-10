import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
// Fonts are bundled with the app (no Google request at build time). Latin only, five files.
import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-500.css';
import '@fontsource/poppins/latin-600.css';
import '@fontsource/poppins/latin-700.css';
import '@fontsource/playfair-display/latin-700.css';
import './globals.css';
import Providers from '@/components/Providers';
import Shell from '@/components/Shell';
import { BRAND } from '@/config/brand';


export const metadata: Metadata = {
  metadataBase: new URL(BRAND.siteUrl),
  title: { default: `${BRAND.name} | ${BRAND.tagline}`, template: `%s | ${BRAND.short}` },
  description: BRAND.description,
  manifest: '/manifest.webmanifest',
  icons: { icon: [{ url: '/favicon.ico' }, { url: '/assets/favicon-32.png', sizes: '32x32', type: 'image/png' }, { url: '/assets/icon-192.png', sizes: '192x192', type: 'image/png' }], apple: '/assets/apple-touch-icon.png' },
  openGraph: { siteName: BRAND.name, images: [BRAND.wordmark] },
};
export const viewport: Viewport = { themeColor: BRAND.themeColor, viewportFit: 'cover', width: 'device-width', initialScale: 1 };

const themeScript = `try{document.documentElement.dataset.theme=localStorage.theme||'dark'}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>
        <Providers><Shell>{children}</Shell></Providers>
      </body>
    </html>
  );
}
