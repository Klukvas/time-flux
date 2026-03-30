'use client';

import { useMemo } from 'react';
import { useTranslation } from '@timeflux/hooks';
import { buildMonthCards } from '@timeflux/domain';
import { todayISO } from '@timeflux/utils';
import { DateTime } from 'luxon';
import { useViewStore } from '@/stores/view-store';

export function MonthView({
  year,
  startDate,
}: {
  year: number;
  startDate: string;
}) {
  const { t, language } = useTranslation();
  const drillIntoMonth = useViewStore((s) => s.drillIntoMonth);

  const today = todayISO();

  const months = useMemo(
    () => buildMonthCards(year, startDate, today),
    [year, startDate, today],
  );

  const monthNames = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const dt = DateTime.fromObject({ year, month: i + 1 });
      return (language ? dt.reconfigure({ locale: language }) : dt).toFormat(
        'LLLL',
      );
    });
  }, [year, language]);

  return (
    <div>
      <p className="mb-4 text-sm text-content-secondary">
        {t('timeline.zoom.select_month')}
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {months.map((card) => {
          const disabled = card.isFuture || card.isBeforeStart;
          return (
            <button
              key={card.key}
              onClick={() => !disabled && drillIntoMonth(card.month)}
              disabled={disabled}
              className={`group rounded-xl border p-4 text-left transition-all ${
                card.isCurrent
                  ? 'border-accent ring-2 ring-accent/20 bg-surface-elevated'
                  : disabled
                    ? 'border-edge bg-surface opacity-40 cursor-default'
                    : 'border-edge bg-surface-elevated hover:border-accent/30 hover:shadow-md'
              }`}
            >
              <span
                className={`text-lg font-semibold ${
                  card.isCurrent
                    ? 'text-accent'
                    : disabled
                      ? 'text-content-tertiary'
                      : 'text-content'
                }`}
              >
                {monthNames[card.month - 1]}
              </span>

              <p className="mt-1 text-xs text-content-tertiary">
                {t('timeline.zoom.days_in_month', { count: card.totalDays })}
              </p>

              {card.isCurrent && (
                <span className="mt-1 inline-block rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                  {t('week.today').toLowerCase()}
                </span>
              )}

              {card.isFuture && (
                <span className="mt-1 inline-block text-[10px] text-content-tertiary">
                  {t('timeline.zoom.future')}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
