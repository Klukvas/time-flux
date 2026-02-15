'use client';

import { useTranslation } from '@lifespan/hooks';

export function OnThisDayPreview() {
  const { t } = useTranslation();

  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-2xl border border-edge bg-surface-card shadow-lg">
          {/* Header */}
          <div className="border-b border-edge px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">
              {t('landing.memory.title')}
            </p>
          </div>

          {/* Content */}
          <div className="flex items-start gap-5 p-6">
            {/* Placeholder image */}
            <div className="hidden h-20 w-20 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 sm:flex">
              <svg className="h-8 w-8 text-accent/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              {/* Mood badge */}
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1">
                <span className="h-2.5 w-2.5 rounded-full bg-success" />
                <span className="text-xs font-medium text-success">
                  {t('landing.memory.mood')}
                </span>
              </div>

              {/* Text */}
              <p className="text-base leading-relaxed text-content">
                {t('landing.memory.text')}
              </p>

              {/* Date */}
              <p className="mt-3 text-xs text-content-tertiary">
                Feb 14, 2025
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
