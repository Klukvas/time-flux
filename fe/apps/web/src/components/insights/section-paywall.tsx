'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useTranslation } from '@timeflux/hooks';

interface SectionPaywallProps {
  readonly children: ReactNode;
}

export function SectionPaywall({ children }: SectionPaywallProps) {
  const { t } = useTranslation();

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[6px] opacity-60" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-xl border border-edge bg-surface-elevated px-6 py-4 text-center shadow-lg">
          <p className="text-sm font-semibold text-content">
            {t('insights.section_locked_title')}
          </p>
          <p className="mt-1 text-xs text-content-secondary">
            {t('insights.section_locked_description')}
          </p>
          <Link
            href="/settings"
            className="group relative mt-3 inline-block overflow-hidden rounded-lg px-5 py-2 text-xs font-semibold text-white shadow transition-shadow hover:shadow-md"
          >
            <span className="absolute inset-0 animate-gradient bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-600 bg-[length:200%_200%]" />
            <span className="relative">{t('insights.paywall_cta')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
