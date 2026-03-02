import type { Metadata } from 'next';
import { getBaseUrl } from '@/lib/constants/seo';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms of Service for LifeSpan — read our terms and conditions for using the life timeline application.',
  alternates: {
    canonical: `${getBaseUrl()}/terms`,
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
