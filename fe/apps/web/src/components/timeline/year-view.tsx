'use client';

import { useMemo } from 'react';
import { useTranslation } from '@timeflux/hooks';
import { buildYearCards } from '@timeflux/domain';
import { todayISO } from '@timeflux/utils';
import { useViewStore } from '@/stores/view-store';

export function YearView({ startDate }: { startDate: string }) {
  const { t } = useTranslation();
  const drillIntoYear = useViewStore((s) => s.drillIntoYear);

  const today = todayISO();
  const currentYear = parseInt(today.slice(0, 4), 10);

  const years = useMemo(
    () => buildYearCards(startDate, today),
    [startDate, today],
  );

  if (years.length === 0) return null;

  return (
    <div>
      <p className="mb-4 text-sm text-content-secondary">
        {t('timeline.zoom.select_year')}
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {years.map((card) => {
          const isFuture = card.year > currentYear;
          return (
            <button
              key={card.year}
              onClick={() => !isFuture && drillIntoYear(card.year)}
              disabled={isFuture}
              className={`group relative rounded-xl border p-4 text-center transition-all ${
                card.isCurrent
                  ? 'border-accent ring-2 ring-accent/20 bg-surface-elevated'
                  : isFuture
                    ? 'border-edge bg-surface opacity-40 cursor-default'
                    : 'border-edge bg-surface-elevated hover:border-accent/30 hover:shadow-md'
              }`}
            >
              <span
                className={`text-2xl font-bold ${
                  card.isCurrent ? 'text-accent' : 'text-content'
                }`}
              >
                {card.year}
              </span>

              {card.isCurrent && (
                <span className="mt-1 block text-xs font-medium text-accent">
                  {t('week.today').toLowerCase()}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
