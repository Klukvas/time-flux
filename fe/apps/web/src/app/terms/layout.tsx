import type { Metadata } from 'next';
import { getBaseUrl, buildHreflangAlternates } from '@/lib/constants/seo';
import { BreadcrumbJsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms of Service for TimeFlux – read our terms and conditions for using the life timeline application.',
  alternates: {
    canonical: `${getBaseUrl()}/terms`,
    languages: buildHreflangAlternates('/terms'),
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Terms of Service', url: '/terms' },
        ]}
      />
      {children}
    </>
  );
}
