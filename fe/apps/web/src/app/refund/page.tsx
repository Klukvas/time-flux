'use client';

import { useTranslation } from '@timeflux/hooks';
import { LegalPageLayout } from '@/components/legal/legal-page-layout';

const SECTIONS = [
  'overview',
  'eligibility',
  'how_to',
  'processing',
  'cancellation',
  'changes',
  'contact',
] as const;

export default function RefundPage() {
  const { t } = useTranslation();

  return (
    <LegalPageLayout>
      <h1 className="mb-2 text-3xl font-bold text-content">
        {t('legal.refund_title')}
      </h1>
      <p className="mb-8 text-sm text-content-tertiary">
        {t('legal.last_updated')}
      </p>

      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <section key={section}>
            <h2 className="mb-2 text-lg font-semibold text-content">
              {t(`legal.refund.${section}_title`)}
            </h2>
            <p className="leading-relaxed text-content-secondary">
              {t(`legal.refund.${section}_text`)}
            </p>
          </section>
        ))}
      </div>
    </LegalPageLayout>
  );
}
