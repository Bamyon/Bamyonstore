import { BRAND } from '@/config/brand';
import type { MetadataRoute } from 'next';
import { getProducts, getPosts } from '@/lib/server';

export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = BRAND.siteUrl;
  const [p, b] = await Promise.all([getProducts(), getPosts()]);
  return [
    ...['', '/shop', '/services', '/services/website-design', '/services/graphic-design', '/services/google-business-profile', '/blog', '/reviews', '/careers', '/track'].map((u) => ({ url: base + u })),
    ...p.map((x: any) => ({ url: `${base}/shop/${x.id}` })),
    ...b.map((x: any) => ({ url: `${base}/blog/${x.id}` })),
  ];
}
