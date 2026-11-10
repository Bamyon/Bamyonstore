# Bamyon Store

Next.js 14 (App Router) and TypeScript. **Bamyon Store** sells clothes, food, gadgets and more (wallet, orders, blog, chat, admin). **Bamyon Studio** pages explain the website, graphic design and Google Business Profile services. Data and sign-in run on Firebase (`bamyon-shop`). Built for Vercel.

## First-time setup (about 10 minutes)

1. **Firebase console, project `bamyon-shop`**
   - Authentication, Sign-in method: turn on **Email/Password**.
   - Firestore Database: create it (production mode, any region close to your customers).
   - Firestore, Rules: paste the contents of `firebase/firestore.rules` and **Publish**.
   - Authentication, Settings, Authorized domains: add your site domain (Vercel or Netlify) once you have it. Also set `NEXT_PUBLIC_SITE_URL` to that address.
2. **Deploy to Vercel or Netlify**: push this folder to a Git repository and import it. On Vercel there is nothing to change. On Netlify the included `netlify.toml` sets the build command and the Next.js plugin.
3. **Create the admin**: open `https://your-domain/setup`, fill the form. This creates the administrator and locks the page. Do it straight after deploying.
4. **Fill the store** (sign in, open the side menu, Manage):
   - Homepage rows: tap *Add starter sections* (Clothes, Shoes, Food, Gadgets, Beauty, Home), then rename as you like.
   - Delivery zones, Products, Store settings (announcement, WhatsApp number for deposits).

## What is inside

- **Store**: shop, product pages with verified reviews, cart and checkout, wallet, order tracking with a live rider map, blog with likes and threaded comments.
- **Studio**: `/services` and one page per service (website design, graphic design, Google Business Profile). The copy lives in `src/config/services.ts`, so you can edit wording or add a service without touching the layout.
- **Chat**: customers message the store from their dashboard (text and pictures). Admins and staff with the reply permission see every conversation and can start one from People, Message. Unread chats show a notification dot.
- **Uploads**: one picture picker (tap or drop, preview, progress ring, replace, camera, remove) used for profile photos and product photos.
- **Menu and dashboard**: one animated side drawer for everyone, with search, explore tiles, account links and permission-based management groups; a dashboard with a greeting, wallet, quick tiles and order progress (admins get totals and quick links).
- **Rewards**: the admin creates reward codes (Manage, Sell, Reward codes) with an amount, a claim limit and an expiry. Customers claim them from Wallet or Rewards, at sign-up, and the amount goes straight into their wallet. Every customer also gets a referral code (their Bamyon ID) and a share link. The referral bonus (set in Store settings) is claimable by both the friend and the person who invited them after the friend's first delivered order.
- **Blog**: admin can write, edit (title, text, pictures, cover), unpublish and delete posts.
- **Speed**: five self-hosted font files, small logo files for the header, no heavy blur effects on lists, no animated grid background, lazy-loaded checkout, cached static assets.
- **Fonts**: Poppins for text and numbers, Playfair Display for headings. Both are self-hosted through `@fontsource`, so builds never need to reach Google.

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck
```

Contact details default to WhatsApp +2348112772267 and bmz.bamyon@gmail.com (see `src/config/brand.ts`). Optional overrides live in `.env.example`.

## Branding

Everything brand-specific is in `src/config/brand.ts` (name, wallet name, ID label, sections), the colours at the top of `src/app/globals.css`, the logos in `public/assets`, and the Firebase values in `src/lib/firebase.ts`. Images upload to Cloudinary under the `bamyon/` folder.

## Structure

| Path | What it holds |
| --- | --- |
| `src/app` | Routes. Public pages (landing, shop, product, blog) are server rendered and cached for 60 seconds. |
| `src/app/account/[section]` | Signed-in area: orders, deliveries, wallet, chat, settings, partner. |
| `src/app/admin/[section]` | Management screens, each guarded by a permission. |
| `src/components` | Shell (top bar, side drawer, bottom nav), cart and checkout, product and blog components. |
| `src/views` | Full-page screens used by the account and admin routes. |
| `src/lib` | Firebase client, server reads, order and wallet logic (`local.ts`), types, helpers. |
| `firebase` | Security rules: `firestore.rules` for testing, `firestore.live.rules` for going live. |
| `functions` | Cloud Functions (Node 22) for going live. |

## Navigation and notifications

One side drawer (hamburger, top left) holds all navigation, including the management groups a user has permission for. A bottom bar gives four quick links and stays mounted between pages. Notification dots appear on the hamburger and the matching item for new products, new blog posts, unread chat, order updates, and for staff new orders, pending deposits and pending withdrawals.

## Testing mode and going live

With `NEXT_PUBLIC_USE_FUNCTIONS=false` (default) wallet, checkout and tracking run in the browser through Firestore transactions. The rules allow this but are test grade.

To take real money: deploy the functions (`cd functions && npm install`, then `firebase use bamyon-shop` and `firebase deploy --only functions` from `firebase/`; Blaze plan), set `NEXT_PUBLIC_USE_FUNCTIONS=true` in Vercel, redeploy, test, then publish `firebase/firestore.live.rules`.

## Android app

Once live on https, open pwabuilder.com, enter your address, and package for Android. The manifest, icons and service worker are in `public/`.
