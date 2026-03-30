import type { MetadataRoute } from 'next';
import { getBaseUrl, buildHreflangAlternates } from '@/lib/constants/seo';
import { getAllPosts } from '@/lib/blog/get-posts';
import { getPostHreflangAlternates } from '@/lib/blog/translations';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl();
  const now = new Date();
  const allPosts = getAllPosts();

  const blogPosts = allPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.frontmatter.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
    alternates: {
      languages: getPostHreflangAlternates(post.slug, allPosts),
    },
  }));

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: { languages: buildHreflangAlternates('') },
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: { languages: buildHreflangAlternates('/blog') },
    },
    ...blogPosts,
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
      alternates: { languages: buildHreflangAlternates('/terms') },
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
      alternates: { languages: buildHreflangAlternates('/privacy') },
    },
    {
      url: `${baseUrl}/refund`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.3,
      alternates: { languages: buildHreflangAlternates('/refund') },
    },
  ];
}
