import { SEO, getBaseUrl } from '@/lib/constants/seo';
import type { BlogPostWithContent } from '@/lib/blog/types';

function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function WebApplicationJsonLd() {
  const baseUrl = getBaseUrl();

  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: SEO.siteName,
        description: SEO.description,
        url: baseUrl,
        applicationCategory: 'LifestyleApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      }}
    />
  );
}

export function OrganizationJsonLd() {
  const baseUrl = getBaseUrl();

  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SEO.siteName,
        url: baseUrl,
        logo: `${baseUrl}/apple-icon`,
      }}
    />
  );
}

export function ArticleJsonLd({ post }: { post: BlogPostWithContent }) {
  const baseUrl = getBaseUrl();

  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.frontmatter.title,
        description: post.frontmatter.description,
        datePublished: post.frontmatter.date,
        author: post.frontmatter.author
          ? { '@type': 'Person', name: post.frontmatter.author }
          : undefined,
        publisher: {
          '@type': 'Organization',
          name: SEO.siteName,
          url: baseUrl,
        },
        mainEntityOfPage: `${baseUrl}/blog/${post.slug}`,
        keywords: post.frontmatter.tags,
      }}
    />
  );
}
