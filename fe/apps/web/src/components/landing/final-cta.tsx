'use client';

import { useTranslation } from '@lifespan/hooks';

interface FinalCTAProps {
  onStart: () => void;
}

export function FinalCTA({ onStart }: FinalCTAProps) {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 sm:py-32">
      {/* Gradient background */}
      <div className="landing-gradient absolute inset-0 opacity-[0.06]" />
      <div className="absolute inset-0 bg-surface/70" />

      <div className="relative mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-content sm:text-4xl lg:text-5xl">
          {t('landing.cta.headline')}
        </h2>
        <p className="mt-4 text-xl text-content-secondary">
          {t('landing.cta.subtext')}
        </p>
        <div className="mt-10">
          <button
            onClick={onStart}
            className="rounded-xl bg-accent px-8 py-4 text-lg font-semibold text-accent-text shadow-lg shadow-accent/25 transition-all hover:bg-accent-hover hover:shadow-xl hover:shadow-accent/30"
          >
            {t('landing.cta.button')}
          </button>
        </div>
      </div>
    </section>
  );
}
