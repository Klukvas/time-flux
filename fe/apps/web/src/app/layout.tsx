import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import { ApiProvider } from '@/lib/api-provider';
import { I18nProvider } from '@/lib/i18n-provider';
import { ThemeProvider } from '@/lib/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'LifeSpan',
  description: 'Your visual life timeline',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <I18nProvider>
            <ApiProvider>
              {children}
              <Toaster position="top-right" />
            </ApiProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
