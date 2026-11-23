import { BRAND } from '@/config/brand';
import type { MetadataRoute } from 'next';
export default function robots(): MetadataRoute.Robots {
  const base = BRAND.siteUrl;
  return { rules: { userAgent: '*', allow: '/', disallow: ['/account', '/admin', '/login', '/setup'] }, sitemap: base + '/sitemap.xml' };
}
