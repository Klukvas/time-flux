import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAllPosts, getPostBySlug } from '@/lib/blog/get-posts';
import { getBaseUrl } from '@/lib/constants/seo';
import { getPostHreflangAlternates } from '@/lib/blog/translations';
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo/json-ld';
import { BlogPostHeader } from '@/components/blog/blog-post-header';
import { BlogProse } from '@/components/blog/blog-prose';
import { BlogCTA } from '@/components/blog/blog-cta';
import { RelatedPosts } from '@/components/blog/related-posts';

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return { title: 'Post Not Found' };
  }

  const baseUrl = getBaseUrl();
  const allPosts = getAllPosts();

  return {
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    alternates: {
      canonical: `${baseUrl}/blog/${post.slug}`,
      languages: getPostHreflangAlternates(post.slug, allPosts),
    },
    openGraph: {
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      type: 'article',
      publishedTime: post.frontmatter.date,
      url: `${baseUrl}/blog/${post.slug}`,
      authors: post.frontmatter.author ? [post.frontmatter.author] : undefined,
      tags: post.frontmatter.tags,
      locale:
        post.frontmatter.language === 'UK'
          ? 'uk_UA'
          : post.frontmatter.language === 'RU'
            ? 'ru_RU'
            : 'en_US',
      images: [
        {
          url: `${baseUrl}/blog/${post.slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: post.frontmatter.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.frontmatter.title,
      description: post.frontmatter.description,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div>
      <ArticleJsonLd post={post} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Blog', url: '/blog' },
          { name: post.frontmatter.title, url: `/blog/${post.slug}` },
        ]}
      />
      <BlogPostHeader post={post} />
      <BlogProse html={post.content} />
      <BlogCTA />
      <RelatedPosts currentSlug={post.slug} />
    </div>
  );
}
