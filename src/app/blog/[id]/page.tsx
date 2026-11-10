import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import BlogFeed from '@/components/Blog';
import Icon from '@/components/Icon';
import { getPost } from '@/lib/server';

export const revalidate = 60;
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const p = await getPost(params.id);
  return p ? { title: p.title, description: (p.body || '').slice(0, 160) } : { title: 'Blog' };
}
export default async function PostPage({ params }: { params: { id: string } }) {
  const p = await getPost(params.id);
  if (!p) notFound();
  return <div className="feed"><Link className="back" href="/blog"><Icon n="back" />All posts</Link><BlogFeed posts={[p]} full /></div>;
}
