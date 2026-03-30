'use client';

import { useMemo } from 'react';
import { useTimeline, useTranslation } from '@timeflux/hooks';
import { groupTimelineByWeeksForMonth } from '@timeflux/domain';
import { formatDate } from '@timeflux/utils';
import { TimelineSkeleton } from '@/components/ui/skeleton';
import { HorizontalTimeline } from './horizontal-timeline';

export function WeekRowsView({
  year,
  month,
  startDate,
  hasBirthDate,
  onDayClick,
}: {
  year: number;
  month: number;
  startDate?: string;
  hasBirthDate: boolean;
  onDayClick: (date: string) => void;
}) {
  const { t, language } = useTranslation();

  const monthStr = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();
  const from = `${year}-${monthStr}-01`;
  const to = `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`;

  const { data, isLoading, error } = useTimeline({ from, to });

  const weeks = useMemo(() => {
    if (!data) return [];
    return groupTimelineByWeeksForMonth(data, year, month, startDate);
  }, [data, year, month, startDate]);

  if (isLoading) return <TimelineSkeleton />;

  if (error) {
    return (
      <div className="py-16 text-center text-sm text-danger">
        {t('timeline.failed_to_load')}
      </div>
    );
  }

  if (data) {
    return (
      <div>
        <p className="mb-4 text-sm text-content-secondary">
          {t('timeline.showing_range', {
            from: formatDate(from, undefined, language),
            to: formatDate(to, undefined, language),
          })}
        </p>

        <HorizontalTimeline
          weeks={weeks}
          onDayClick={onDayClick}
          startDate={startDate}
          hasBirthDate={hasBirthDate}
        />
      </div>
    );
  }

  return <TimelineSkeleton />;
}
