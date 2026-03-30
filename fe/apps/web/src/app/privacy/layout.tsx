import type { Metadata } from 'next';
import { getBaseUrl, buildHreflangAlternates } from '@/lib/constants/seo';
import { BreadcrumbJsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Privacy Policy for TimeFlux – learn how we collect, use, and protect your personal data.',
  alternates: {
    canonical: `${getBaseUrl()}/privacy`,
    languages: buildHreflangAlternates('/privacy'),
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Privacy Policy', url: '/privacy' },
        ]}
      />
      {children}
    </>
  );
}
