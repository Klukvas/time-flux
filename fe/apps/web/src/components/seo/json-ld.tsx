import { SEO, getBaseUrl } from '@/lib/constants/seo';
import type { BlogPostWithContent } from '@/lib/blog/types';

const LANGUAGE_MAP: Record<string, string> = {
  EN: 'en',
  UK: 'uk',
  RU: 'ru',
};

function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function SoftwareApplicationJsonLd() {
  const baseUrl = getBaseUrl();

  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
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

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  const baseUrl = getBaseUrl();

  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url.startsWith('http')
            ? item.url
            : `${baseUrl}${item.url}`,
        })),
      }}
    />
  );
}

export function ArticleJsonLd({ post }: { post: BlogPostWithContent }) {
  const baseUrl = getBaseUrl();
  const articleUrl = `${baseUrl}/blog/${post.slug}`;
  const imageUrl = `${articleUrl}/opengraph-image`;

  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.frontmatter.title,
        description: post.frontmatter.description,
        datePublished: post.frontmatter.date,
        dateModified: post.frontmatter.date,
        inLanguage: LANGUAGE_MAP[post.frontmatter.language] ?? 'en',
        wordCount: post.wordCount,
        image: imageUrl,
        author: post.frontmatter.author
          ? { '@type': 'Person', name: post.frontmatter.author }
          : { '@type': 'Organization', name: SEO.siteName },
        publisher: {
          '@type': 'Organization',
          name: SEO.siteName,
          url: baseUrl,
        },
        mainEntityOfPage: articleUrl,
        keywords: post.frontmatter.tags,
      }}
    />
  );
}
