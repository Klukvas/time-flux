import type { Metadata } from 'next';
import { getAllPosts } from '@/lib/blog/get-posts';
import { BlogCard } from '@/components/blog/blog-card';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Tips and insights on life tracking, mood journaling, personal growth, and organizing your life story.',
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div>
      <div className="mb-10">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-content">
          Blog
        </h1>
        <p className="text-content-secondary">
          Tips, insights, and ideas for tracking and understanding your life.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
