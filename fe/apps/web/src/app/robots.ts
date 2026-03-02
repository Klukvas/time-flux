import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/constants/seo';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/blog', '/terms', '/privacy', '/refund'],
        disallow: [
          '/auth/',
          '/timeline/',
          '/dashboard/',
          '/categories/',
          '/chapters/',
          '/day-states/',
          '/settings/',
          '/week/',
        ],
      },
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'ClaudeBot',
          'anthropic-ai',
          'Google-Extended',
        ],
        allow: ['/', '/blog', '/terms', '/privacy', '/refund'],
        disallow: [
          '/auth/',
          '/timeline/',
          '/dashboard/',
          '/categories/',
          '/chapters/',
          '/day-states/',
          '/settings/',
          '/week/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
