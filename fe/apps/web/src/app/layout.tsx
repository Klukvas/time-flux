import type { Metadata, Viewport } from 'next';
import { DM_Sans, DM_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { ApiProvider } from '@/lib/api-provider';
import { I18nProvider } from '@/lib/i18n-provider';
import { ThemeProvider } from '@/lib/theme-provider';
import { SEO, getBaseUrl, buildHreflangAlternates } from '@/lib/constants/seo';
import {
  SoftwareApplicationJsonLd,
  OrganizationJsonLd,
} from '@/components/seo/json-ld';
import { WebVitalsReporter } from '@/components/seo/web-vitals';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: SEO.defaultTitle,
    template: SEO.titleTemplate,
  },
  description: SEO.description,
  keywords: SEO.keywords,
  authors: [{ name: SEO.siteName }],
  creator: SEO.siteName,
  openGraph: {
    type: SEO.type,
    locale: SEO.locale,
    url: baseUrl,
    siteName: SEO.siteName,
    title: SEO.defaultTitle,
    description: SEO.description,
    images: [
      {
        url: `${baseUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: SEO.defaultTitle,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO.defaultTitle,
    description: SEO.description,
    site: SEO.twitterHandle,
    images: [`${baseUrl}/opengraph-image`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: baseUrl,
    languages: buildHreflangAlternates(''),
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? undefined,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#080C14' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${dmSans.variable} ${dmMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('timeflux_theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <I18nProvider>
            <ApiProvider>
              {children}
              <Toaster position="top-right" />
            </ApiProvider>
          </I18nProvider>
        </ThemeProvider>
        <SoftwareApplicationJsonLd />
        <OrganizationJsonLd />
        <WebVitalsReporter />
      </body>
    </html>
  );
}
