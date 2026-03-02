import type { Metadata } from 'next';
import { getBaseUrl } from '@/lib/constants/seo';

export const metadata: Metadata = {
  title: 'Refund Policy',
  description:
    'Refund Policy for TimeFlux — learn about our 14-day refund window, cancellation process, and how refunds are handled through Paddle.',
  alternates: {
    canonical: `${getBaseUrl()}/refund`,
  },
};

export default function RefundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
