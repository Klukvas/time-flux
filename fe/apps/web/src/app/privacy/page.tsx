'use client';

import { useTranslation } from '@lifespan/hooks';
import { LegalPageLayout } from '@/components/legal/legal-page-layout';

const SECTIONS = [
  'intro',
  'data_collected',
  'usage',
  'storage',
  'third_parties',
  'cookies',
  'rights',
  'contact',
] as const;

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <LegalPageLayout>
      <h1 className="mb-2 text-3xl font-bold text-content">
        {t('legal.privacy_title')}
      </h1>
      <p className="mb-8 text-sm text-content-tertiary">
        {t('legal.last_updated')}
      </p>

      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <section key={section}>
            <h2 className="mb-2 text-lg font-semibold text-content">
              {t(`legal.privacy.${section}_title`)}
            </h2>
            <p className="leading-relaxed text-content-secondary">
              {t(`legal.privacy.${section}_text`)}
            </p>
          </section>
        ))}
      </div>
    </LegalPageLayout>
  );
}
