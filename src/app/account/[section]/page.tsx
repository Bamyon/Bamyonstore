import { notFound } from 'next/navigation';
import type { ComponentType } from 'react';
import { Gate } from '@/components/ui';
import Orders from '@/views/Orders';
import Wallet from '@/views/Wallet';
import Chat from '@/views/Chat';
import Settings from '@/views/Settings';
import Partner from '@/views/Partner';
import Referrals from '@/views/Referrals';
import { PartnerProducts } from '@/views/admin/Products';

const MyOrders = () => <Orders mode="mine" />;
const Deliveries = () => <Orders mode="deliveries" />;
const SECTIONS: Record<string, ComponentType> = { orders: MyOrders, deliveries: Deliveries, wallet: Wallet, chat: Chat, settings: Settings, partner: Partner, products: PartnerProducts, referrals: Referrals };

export function generateStaticParams() { return Object.keys(SECTIONS).map((section) => ({ section })); }

export default function AccountSection({ params }: { params: { section: string } }) {
  const View = SECTIONS[params.section];
  if (!View) notFound();
  return <Gate><View /></Gate>;
}
