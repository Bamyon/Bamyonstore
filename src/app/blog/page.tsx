import BlogFeed from '@/components/Blog';
import { getPosts } from '@/lib/server';

export const revalidate = 60;
export const metadata = { title: 'Blog', description: 'News, tips and stories from Bamyon Store.' };

export default async function BlogPage() {
  const posts = await getPosts();
  return <div className="feed"><h1>Blog</h1><BlogFeed posts={posts} /></div>;
}
