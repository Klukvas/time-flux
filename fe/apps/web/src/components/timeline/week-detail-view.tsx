'use client';

import { useMemo } from 'react';
import { useTranslation, useWeekTimeline } from '@timeflux/hooks';
import { buildWeekGrid } from '@timeflux/domain';
import {
  formatDate,
  formatDayNumber,
  formatDayShort,
  hexToRgba,
  isBeyondTomorrow,
  isToday,
} from '@timeflux/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { DayCircle } from '@/components/ui/day-circle';
import { TimelineSkeleton } from '@/components/ui/skeleton';
import { getMainImageUrl } from './horizontal-timeline';

export function WeekDetailView({
  currentDate,
  onDayClick,
  startDate,
}: {
  currentDate: string;
  onDayClick: (date: string) => void;
  startDate?: string;
}) {
  const { t, language } = useTranslation();
  const { data: weekData, isLoading, error } = useWeekTimeline({ date: currentDate });

  const weekDays = useMemo(() => {
    if (!weekData) return [];
    const grid = buildWeekGrid(weekData);
    if (startDate) {
      return grid.filter((day) => day.date >= startDate);
    }
    return grid;
  }, [weekData, startDate]);

  if (isLoading) return <TimelineSkeleton />;

  if (error) {
    return (
      <div className="py-16 text-center text-sm text-danger">
        {t('timeline.failed_to_load')}
      </div>
    );
  }

  if (weekData) {
    return (
      <div>
        <p className="mb-4 text-sm text-content-secondary">
          {formatDate(weekData.weekStart, undefined, language)} —{' '}
          {formatDate(weekData.weekEnd, undefined, language)}
        </p>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-7">
          {weekDays.map((day) => {
            const disabled = isBeyondTomorrow(day.date);
            return (
              <button
                key={day.date}
                onClick={disabled ? undefined : () => onDayClick(day.date)}
                disabled={disabled}
                className={`rounded-xl border border-edge p-3 md:p-4 text-center transition-all ${
                  disabled ? 'opacity-40 cursor-default' : 'hover:shadow-md'
                } ${
                  isToday(day.date) ? 'ring-2 ring-accent' : ''
                } bg-surface-elevated`}
              >
                <p className="text-xs font-medium font-mono text-content-secondary">
                  {formatDayShort(day.date, language)}
                </p>
                <p className="text-xl font-bold text-content md:text-2xl">
                  {formatDayNumber(day.date)}
                </p>

                <div className="mt-2 flex justify-center">
                  <DayCircle
                    date={day.date}
                    color={day.dayState?.color}
                    imageUrl={getMainImageUrl(day.media, day.mainMediaId)}
                    size="lg"
                    label={day.dayState?.name ?? t('timeline.no_mood')}
                  />
                </div>

                {day.periods.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {day.periods.slice(0, 3).map((period) => (
                      <div
                        key={period.id}
                        className="rounded-md px-2 py-0.5 text-xs font-medium font-mono truncate"
                        style={{
                          backgroundColor: hexToRgba(
                            period.category.color,
                            0.15,
                          ),
                          color: period.category.color,
                        }}
                        title={`${period.eventGroup.title}${period.comment ? `: ${period.comment}` : ''}`}
                      >
                        {period.eventGroup.title}
                      </div>
                    ))}
                    {day.periods.length > 3 && (
                      <p className="text-center text-xs text-content-tertiary">
                        {t('timeline.more_periods', {
                          count: day.periods.length - 3,
                        })}
                      </p>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return <EmptyState title={t('timeline.no_week_data')} />;
}
