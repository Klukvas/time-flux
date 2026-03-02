import type { Metadata } from 'next';
import { getBaseUrl } from '@/lib/constants/seo';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Privacy Policy for LifeSpan — learn how we collect, use, and protect your personal data.',
  alternates: {
    canonical: `${getBaseUrl()}/privacy`,
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
