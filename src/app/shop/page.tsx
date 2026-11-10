import ShopClient from '@/components/ShopClient';
import { getProducts, getSections } from '@/lib/server';

export const revalidate = 60;
export const metadata = { title: 'Shop', description: 'Shop clothes, shoes, food, gadgets and more. Pay on delivery or from your wallet.' };

export default async function ShopPage() {
  const [products, sections] = await Promise.all([getProducts(), getSections()]);
  return <ShopClient products={products} sections={sections} />;
}
