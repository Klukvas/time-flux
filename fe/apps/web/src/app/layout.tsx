import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { ApiProvider } from '@/lib/api-provider';
import { I18nProvider } from '@/lib/i18n-provider';
import { ThemeProvider } from '@/lib/theme-provider';
import { SEO, getBaseUrl } from '@/lib/constants/seo';
import {
  WebApplicationJsonLd,
  OrganizationJsonLd,
} from '@/components/seo/json-ld';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
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
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO.defaultTitle,
    description: SEO.description,
    site: SEO.twitterHandle,
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
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? undefined,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: SEO.themeColor,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
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
        <WebApplicationJsonLd />
        <OrganizationJsonLd />
      </body>
    </html>
  );
}
