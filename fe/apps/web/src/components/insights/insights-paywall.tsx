'use client';

import Link from 'next/link';
import { useTranslation } from '@lifespan/hooks';

const PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true';

export function InsightsPaywall() {
  const { t } = useTranslation();

  if (!PAYMENTS_ENABLED) return null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-content">
        {t('insights.title')}
      </h1>

      <div className="relative">
        {/* Blurred static mock dashboard */}
        <div
          className="pointer-events-none select-none blur-[6px] opacity-60"
          aria-hidden="true"
        >
          <div className="space-y-6">
            {/* Average Mood */}
            <div className="rounded-lg border border-edge bg-surface-card p-6">
              <p className="text-sm font-medium text-content-secondary">
                {t('insights.average_mood')}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-content">7.2</span>
                <span className="text-sm text-content-tertiary">
                  {t('insights.out_of')}
                </span>
              </div>
            </div>

            {/* Mood Distribution */}
            <div className="rounded-lg border border-edge bg-surface-card p-6">
              <h2 className="mb-4 text-sm font-medium text-content-secondary">
                {t('insights.mood_distribution')}
              </h2>
              <div className="space-y-3">
                {[
                  { name: 'Great', color: '#22c55e', pct: 35 },
                  { name: 'Good', color: '#84cc16', pct: 28 },
                  { name: 'Okay', color: '#eab308', pct: 22 },
                  { name: 'Bad', color: '#f97316', pct: 10 },
                  { name: 'Terrible', color: '#ef4444', pct: 5 },
                ].map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="w-24 truncate text-sm text-content">
                      {item.name}
                    </span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-secondary">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${item.pct}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                    <span className="w-20 text-right text-xs text-content-tertiary">
                      {item.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-edge bg-surface-card p-6">
                <p className="text-sm font-medium text-success">
                  {t('insights.best_category')}
                </p>
                <p className="mt-2 text-lg font-semibold text-content">Work</p>
                <p className="mt-1 text-sm text-content-tertiary">
                  8.1 {t('insights.out_of')}
                </p>
              </div>
              <div className="rounded-lg border border-edge bg-surface-card p-6">
                <p className="text-sm font-medium text-danger">
                  {t('insights.worst_category')}
                </p>
                <p className="mt-2 text-lg font-semibold text-content">
                  Health
                </p>
                <p className="mt-1 text-sm text-content-tertiary">
                  4.3 {t('insights.out_of')}
                </p>
              </div>
            </div>

            {/* Trend placeholder */}
            <div className="rounded-lg border border-edge bg-surface-card p-6">
              <h2 className="mb-4 text-sm font-medium text-content-secondary">
                {t('insights.trend_last_30_days')}
              </h2>
              <div className="flex h-[180px] items-end gap-1">
                {[5, 6, 7, 6, 8, 7, 6, 5, 7, 8, 7, 6, 5, 6, 7].map((v, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-accent/40"
                    style={{ height: `${v * 10}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Centered upgrade overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-sm rounded-2xl border border-edge bg-surface-card p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
              <svg
                className="h-7 w-7 text-violet-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-content">
              {t('insights.paywall_title')}
            </h2>
            <p className="mt-2 text-sm text-content-secondary">
              {t('insights.paywall_description')}
            </p>
            <Link
              href="/settings"
              className="group relative mt-6 inline-block overflow-hidden rounded-xl px-8 py-3 text-sm font-semibold text-white shadow-lg transition-shadow hover:shadow-xl"
            >
              <span className="absolute inset-0 animate-gradient bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-600 bg-[length:200%_200%]" />
              <span className="relative flex items-center gap-2">
                {t('insights.paywall_cta')}
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
