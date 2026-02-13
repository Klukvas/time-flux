/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: [
    '@lifespan/api',
    '@lifespan/constants',
    '@lifespan/domain',
    '@lifespan/hooks',
    '@lifespan/i18n',
    '@lifespan/theme',
    '@lifespan/utils',
  ],
};

module.exports = nextConfig;
