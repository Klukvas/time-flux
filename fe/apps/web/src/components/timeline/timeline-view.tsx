'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding, useTranslation } from '@timeflux/hooks';
import { addDays, getStartDate, todayISO } from '@timeflux/utils';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { OnThisDaySection } from '@/components/timeline/on-this-day';
import { TimelineBreadcrumb } from '@/components/timeline/timeline-breadcrumb';
import { YearView } from '@/components/timeline/year-view';
import { MonthView } from '@/components/timeline/month-view';
import { WeekRowsView } from '@/components/timeline/week-rows-view';
import { WeekDetailView } from '@/components/timeline/week-detail-view';
import { useAuthStore } from '@/stores/auth-store';
import { useViewStore } from '@/stores/view-store';
import type { TimelineMode } from '@/stores/view-store';

export function TimelineView() {
  const router = useRouter();
  const { t } = useTranslation();
  const timelineMode = useViewStore((s) => s.timelineMode);
  const setTimelineMode = useViewStore((s) => s.setTimelineMode);
  const zoomLevel = useViewStore((s) => s.zoomLevel);
  const selectedYear = useViewStore((s) => s.selectedYear);
  const selectedMonth = useViewStore((s) => s.selectedMonth);
  const onboarding = useOnboarding();
  const user = useAuthStore((s) => s.user);

  const modeOptions: { value: TimelineMode; label: string }[] = useMemo(
    () => [
      { value: 'zoom', label: t('timeline.modes.zoom') },
      { value: 'week', label: t('timeline.modes.week') },
    ],
    [t],
  );

  const startDate = useMemo(() => getStartDate(user), [user]);

  const [currentDate, setCurrentDate] = useState(todayISO());
  const [activeMemoryDate, setActiveMemoryDate] = useState<string | null>(null);

  const navigateToDayPage = useCallback(
    (date: string) => router.push(`/timeline/day/${date}`),
    [router],
  );

  // Onboarding: navigate to day page when first-memory step activates
  useEffect(() => {
    if (onboarding.step === 'first-memory') {
      navigateToDayPage(todayISO());
      onboarding.complete();
    }
  }, [onboarding.step, navigateToDayPage, onboarding]);

  // Week navigation (for week detail mode)
  const navigateWeek = useCallback(
    (offset: number) => {
      setActiveMemoryDate(null);
      const next = addDays(currentDate, offset * 7);
      if (startDate && next < startDate) {
        setCurrentDate(startDate);
      } else {
        setCurrentDate(next);
      }
    },
    [currentDate, startDate],
  );

  const handleMemoryClick = useCallback(
    (date: string) => {
      setActiveMemoryDate(date);
      navigateToDayPage(date);
    },
    [navigateToDayPage],
  );

  return (
    <div>
      {/* On This Day */}
      <OnThisDaySection
        onMemoryClick={handleMemoryClick}
        selectedDate={activeMemoryDate}
      />

      {/* Header */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-content">
            {t('timeline.title')}
          </h1>

          {/* Week navigation (week detail mode only) */}
          {timelineMode === 'week' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateWeek(-1)}
                className="rounded-lg border border-edge px-3 py-1.5 text-sm text-content hover:bg-surface-secondary"
              >
                &larr;
              </button>
              <button
                onClick={() => setCurrentDate(todayISO())}
                className="rounded-lg border border-edge px-3 py-1.5 text-sm text-content hover:bg-surface-secondary"
              >
                {t('week.today')}
              </button>
              <button
                onClick={() => navigateWeek(1)}
                className="rounded-lg border border-edge px-3 py-1.5 text-sm text-content hover:bg-surface-secondary"
              >
                &rarr;
              </button>
            </div>
          )}
        </div>

        <SegmentedControl
          value={timelineMode}
          onChange={setTimelineMode}
          options={modeOptions}
        />
      </div>

      {/* Zoom mode */}
      {timelineMode === 'zoom' && (
        <>
          <TimelineBreadcrumb />
          {startDate && zoomLevel === 'year' && (
            <YearView startDate={startDate} />
          )}
          {startDate && zoomLevel === 'month' && selectedYear && (
            <MonthView year={selectedYear} startDate={startDate} />
          )}
          {startDate && zoomLevel === 'weeks' && selectedYear && selectedMonth && (
            <WeekRowsView
              year={selectedYear}
              month={selectedMonth}
              startDate={startDate}
              hasBirthDate={!!user?.birthDate}
              onDayClick={navigateToDayPage}
            />
          )}
        </>
      )}

      {/* Week detail mode */}
      {timelineMode === 'week' && (
        <WeekDetailView
          currentDate={currentDate}
          onDayClick={navigateToDayPage}
          startDate={startDate}
        />
      )}
    </div>
  );
}
