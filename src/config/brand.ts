// Everything that makes this store "Bamyon" lives here. To launch another brand, change this file,
// the colours at the top of src/app/globals.css, the logos in public/assets and the Firebase values in src/lib/firebase.ts.
export const BRAND = {
  key: 'bamyon',
  name: 'Bamyon',
  short: 'Bamyon',
  nameA: 'BAM', // shown in the text colour
  nameB: 'YON', // shown in the accent colour
  tagline: 'Build. Play. Shop.',
  description: 'Bamyon designs websites, graphics and Google presence for businesses, hosts online games with ranks and prizes, and keeps a full shop open for everyone.',
  wallet: 'Bamyon Wallet',
  idLabel: 'Bamyon ID',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'bmz.bamyon@gmail.com',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || '2348112772267',
  location: process.env.NEXT_PUBLIC_LOCATION || '',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://bamyon.online',
  logo: '/assets/logo-icon-96.png',
  logoLg: '/assets/logo-icon-256.png',
  wordmark: '/assets/logo-wordmark.png',
  themeColor: '#0b183e',
  cloudFolder: 'bamyon',
  gameRewardWins: 500, // online wins needed for the cash reward (admin can change it in Store settings)
  gameReward: 10000, // reward in NGN (admin can change it in Store settings)
  starterSections: ['Clothes', 'Shoes', 'Food', 'Gadgets & accessories', 'Beauty', 'Home & living'],
};

/** WhatsApp chat link with an optional ready-made message. */
export const waLink = (msg = ''): string => `https://wa.me/${BRAND.whatsapp}${msg ? '?text=' + encodeURIComponent(msg) : ''}`;
