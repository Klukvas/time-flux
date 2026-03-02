/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    outputFileTracingIncludes: {
      '/blog/[slug]': ['./content/blog/*.md'],
      '/blog': ['./content/blog/*.md'],
      '/sitemap.xml': ['./content/blog/*.md'],
    },
  },
  transpilePackages: [
    '@lifespan/api',
    '@lifespan/constants',
    '@lifespan/domain',
    '@lifespan/hooks',
    '@lifespan/i18n',
    '@lifespan/theme',
    '@lifespan/utils',
  ],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com https://cdn.paddle.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://maps.googleapis.com https://*.paddle.com " +
                (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'),
              'frame-src https://cdn.paddle.com https://sandbox-buy.paddle.com https://buy.paddle.com',
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
