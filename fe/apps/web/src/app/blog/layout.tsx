import type { Metadata } from 'next';
import { SEO } from '@/lib/constants/seo';
import { BlogLayout } from '@/components/blog/blog-layout';

export const metadata: Metadata = {
  title: {
    template: `%s | ${SEO.siteName} Blog`,
    default: `Blog | ${SEO.siteName}`,
  },
  description:
    'Tips and insights on life tracking, mood journaling, personal growth, and organizing your life story.',
};

export default function BlogRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BlogLayout>{children}</BlogLayout>;
}
