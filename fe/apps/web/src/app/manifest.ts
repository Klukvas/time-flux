import type { MetadataRoute } from 'next';
import { SEO } from '@/lib/constants/seo';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SEO.siteName,
    short_name: SEO.siteName,
    description: SEO.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#080C14',
    theme_color: '#080C14',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/apple-icon',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    categories: ['lifestyle', 'health', 'productivity'],
  };
}
