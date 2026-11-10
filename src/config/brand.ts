// Everything that makes this store "Bamyon" lives here. To launch another brand, change this file,
// the colours at the top of src/app/globals.css, the logos in public/assets and the Firebase values in src/lib/firebase.ts.
export const BRAND = {
  key: 'bamyon',
  name: 'Bamyon Store',
  short: 'Bamyon',
  nameA: 'BAM', // shown in the text colour
  nameB: 'YON', // shown in the accent colour
  tagline: 'Shop. Build. Grow.',
  description: 'Bamyon Store sells clothes, food, gadgets and more, delivered to your door. Bamyon Studio builds websites, designs brands and sets up Google Business Profiles.',
  wallet: 'Bamyon Wallet',
  idLabel: 'Bamyon ID',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'bmz.bamyon@gmail.com',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || '2348112772267',
  location: process.env.NEXT_PUBLIC_LOCATION || '',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://bamyon.vercel.app',
  logo: '/assets/logo-icon-96.png',
  logoLg: '/assets/logo-icon-256.png',
  wordmark: '/assets/logo-wordmark.png',
  themeColor: '#0b183e',
  cloudFolder: 'bamyon',
  starterSections: ['Clothes', 'Shoes', 'Food', 'Gadgets & accessories', 'Beauty', 'Home & living'],
};

/** WhatsApp chat link with an optional ready-made message. */
export const waLink = (msg = ''): string => `https://wa.me/${BRAND.whatsapp}${msg ? '?text=' + encodeURIComponent(msg) : ''}`;
