import type { Metadata } from 'next';
import { getBaseUrl, buildHreflangAlternates } from '@/lib/constants/seo';
import { BreadcrumbJsonLd } from '@/components/seo/json-ld';

export const metadata: Metadata = {
  title: 'Refund Policy',
  description:
    'Refund Policy for TimeFlux – learn about our 14-day refund window, cancellation process, and how refunds are handled through Paddle.',
  alternates: {
    canonical: `${getBaseUrl()}/refund`,
    languages: buildHreflangAlternates('/refund'),
  },
};

export default function RefundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Refund Policy', url: '/refund' },
        ]}
      />
      {children}
    </>
  );
}
