import { notFound } from 'next/navigation';
import type { ComponentType } from 'react';
import { Gate } from '@/components/ui';
import AdminOrders from '@/views/admin/Orders';
import AdminProducts from '@/views/admin/Products';
import { Zones, Promos, Sections, Jobs, Rewards } from '@/views/admin/Collections';
import { ReviewsAdmin, BlogAdmin, Applications } from '@/views/admin/Content';
import People, { Partners } from '@/views/admin/People';
import { Cashier, Transactions, Withdrawals } from '@/views/admin/Money';
import { StoreSettings, Reports } from '@/views/admin/Store';

// section -> [permission needed, screen]. "admin" means the admin role only.
const SECTIONS: Record<string, [string, ComponentType]> = {
  orders: ['orders.view', AdminOrders], products: ['products.view', AdminProducts], sections: ['products.edit', Sections], zones: ['zones.manage', Zones], promos: ['promotions.manage', Promos], rewards: ['promotions.manage', Rewards],
  reviews: ['reviews.moderate', ReviewsAdmin], blog: ['blog.manage', BlogAdmin], jobs: ['careers.manage', Jobs], applications: ['careers.view_applications', Applications],
  people: ['users.view', People], partners: ['admin', Partners], cashier: ['wallet.credit', Cashier], transactions: ['wallet.monitor', Transactions], withdrawals: ['wallet.monitor', Withdrawals],
  settings: ['settings.manage', StoreSettings], reports: ['analytics.view', Reports],
};

export function generateStaticParams() { return Object.keys(SECTIONS).map((section) => ({ section })); }

export default function AdminSection({ params }: { params: { section: string } }) {
  const e = SECTIONS[params.section];
  if (!e) notFound();
  const [perm, View] = e;
  return <div className="wrap"><Gate perm={perm}><View /></Gate></div>;
}
