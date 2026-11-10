export type Link3 = [string, string, string];
export type Link4 = [string, string, string, string];
export const BROWSE: Link3[] = [['/', 'Home', 'home'], ['/shop', 'Shop', 'bag'], ['/services', 'Services', 'palette'], ['/blog', 'Blog', 'book'], ['/reviews', 'Reviews', 'star'], ['/track', 'Track an order', 'truck'], ['/careers', 'Careers', 'briefcase']];

// [slug, label, icon, permission]  ("admin" = admin role only)
export const ADMIN: [string, Link4[]][] = [
  ['Sell', [['orders', 'Orders', 'orders', 'orders.view'], ['products', 'Products', 'bag', 'products.view'], ['sections', 'Homepage rows', 'rows', 'products.edit'], ['zones', 'Delivery zones', 'pin', 'zones.manage'], ['promos', 'Promotions', 'tag', 'promotions.manage'], ['rewards', 'Reward codes', 'gift', 'promotions.manage']]],
  ['Content', [['reviews', 'Reviews', 'star', 'reviews.moderate'], ['blog', 'Blog posts', 'edit', 'blog.manage'], ['jobs', 'Jobs', 'briefcase', 'careers.manage'], ['applications', 'Applications', 'file', 'careers.view_applications']]],
  ['People and money', [['people', 'People', 'users', 'users.view'], ['partners', 'Partners', 'store', 'admin'], ['cashier', 'Cashier', 'cash', 'wallet.credit'], ['transactions', 'Transactions', 'list', 'wallet.monitor'], ['withdrawals', 'Withdrawals', 'out', 'wallet.monitor']]],
  ['Store', [['settings', 'Store settings', 'settings', 'settings.manage'], ['reports', 'Reports', 'chart', 'analytics.view']]],
];

export function accountLinks(p: { role: string }): Link4[] {
  const L: Link4[] = [['/account', 'Dashboard', 'home', 'home'], ['/account/orders', 'My orders', 'orders', 'orders']];
  if (p.role === 'rider' || p.role === 'staff') L.push(['/account/deliveries', 'My deliveries', 'truck', 'deliveries']);
  if (p.role !== 'admin') L.push(['/account/wallet', 'Wallet', 'wallet', 'wallet']);
  L.push(['/account/referrals', 'Rewards', 'gift', 'referrals']);
  L.push(['/account/chat', 'Chat', 'chat', 'chat']);
  if (p.role === 'partner') L.push(['/account/products', 'My products', 'bag', 'products']);
  if (p.role === 'customer') L.push(['/account/partner', 'Become a partner', 'store', 'partner']);
  L.push(['/account/settings', 'Settings', 'settings', 'settings']);
  return L;
}
