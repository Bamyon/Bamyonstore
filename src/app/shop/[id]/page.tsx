import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductView from '@/components/ProductView';
import { getProduct, getProducts } from '@/lib/server';
import { cl, naira } from '@/lib/util';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const p = await getProduct(params.id);
  if (!p) return { title: 'Product' };
  return { title: p.name, description: `${p.name} for ${naira(p.price)}. ${p.desc || ''}`.slice(0, 160), openGraph: { images: cl(p.img, 800) ? [cl(p.img, 800)] : [] } };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const p = await getProduct(params.id);
  if (!p) notFound();
  const all = await getProducts();
  const related = all.filter((x) => x.id !== p.id && x.section === p.section && x.stock !== false && !(typeof x.qty === 'number' && x.qty <= 0)).slice(0, 8);
  return <ProductView p={p} related={related} />;
}
