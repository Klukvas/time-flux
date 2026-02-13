'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding, useTimeline, useWeekTimeline } from '@lifespan/hooks';
import {
  buildWeekGrid,
  groupTimelineHorizontal,
} from '@lifespan/domain';
import type { HorizontalTimelineWeek } from '@lifespan/domain';
import type { DayMedia } from '@lifespan/api';
import {
  addDays,
  formatDate,
  formatDayNumber,
  formatDayShort,
  hexToRgba,
  isBeyondTomorrow,
  isImageType,
  isToday,
  todayISO,
} from '@lifespan/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { DayCircle } from '@/components/ui/day-circle';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { OnThisDaySection } from '@/components/timeline/on-this-day';
import { useViewStore } from '@/stores/view-store';
import type { TimelineMode } from '@/stores/view-store';

const MODE_OPTIONS: { value: TimelineMode; label: string }[] = [
  { value: 'horizontal', label: 'All Time' },
  { value: 'week', label: 'Week' },
];

export function TimelineView() {
  const router = useRouter();
  const timelineMode = useViewStore((s) => s.timelineMode);
  const setTimelineMode = useViewStore((s) => s.setTimelineMode);
  const onboarding = useOnboarding();

  const [currentDate, setCurrentDate] = useState(todayISO());
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});

  const navigateToDayPage = useCallback(
    (date: string) => {
      router.push(`/timeline/day/${date}`);
    },
    [router],
  );

  // When the onboarding "day" step advances to first-memory, navigate to day page for today
  useEffect(() => {
    if (onboarding.step === 'first-memory') {
      navigateToDayPage(todayISO());
      onboarding.complete();
    }
  }, [onboarding.step]);

  const navigateWeek = (offset: number) => {
    setActiveMemoryDate(null);
    setCurrentDate(addDays(currentDate, offset * 7));
  };

  const goToToday = () => setCurrentDate(todayISO());

  const showNavigation = timelineMode === 'week';

  const [activeMemoryDate, setActiveMemoryDate] = useState<string | null>(null);

  const handleMemoryClick = (date: string) => {
    setActiveMemoryDate(date);
    navigateToDayPage(date);
  };

  return (
    <div>
      {/* On This Day — memory resurfacing */}
      <OnThisDaySection onMemoryClick={handleMemoryClick} selectedDate={activeMemoryDate} />

      {/* Header */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-content">Timeline</h1>

          {/* Navigation for Week */}
          {showNavigation && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateWeek(-1)}
                className="rounded-lg border border-edge px-3 py-1.5 text-sm text-content hover:bg-surface-secondary"
              >
                &larr;
              </button>
              <button
                onClick={goToToday}
                className="rounded-lg border border-edge px-3 py-1.5 text-sm text-content hover:bg-surface-secondary"
              >
                Today
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

        {/* Controls row — wraps on mobile */}
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedControl value={timelineMode} onChange={setTimelineMode} options={MODE_OPTIONS} />

          {/* Date range filter for Horizontal mode */}
          {timelineMode === 'horizontal' && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                className="w-full rounded-lg border border-edge bg-surface-card px-3 py-1.5 text-sm text-content sm:w-auto"
                value={dateRange.from ?? ''}
                onChange={(e) =>
                  setDateRange((p) => ({ ...p, from: e.target.value || undefined }))
                }
              />
              <span className="hidden text-content-tertiary sm:inline">to</span>
              <input
                type="date"
                className="w-full rounded-lg border border-edge bg-surface-card px-3 py-1.5 text-sm text-content sm:w-auto"
                value={dateRange.to ?? ''}
                onChange={(e) =>
                  setDateRange((p) => ({ ...p, to: e.target.value || undefined }))
                }
              />
              {(dateRange.from || dateRange.to) && (
                <Button variant="ghost" size="sm" onClick={() => setDateRange({})}>
                  Clear
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mode content */}
      {timelineMode === 'horizontal' && (
        <HorizontalMode dateRange={dateRange} onDayClick={navigateToDayPage} />
      )}
      {timelineMode === 'week' && (
        <WeekMode currentDate={currentDate} onDayClick={navigateToDayPage} />
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────

type DayClickHandler = (date: string) => void;

/** Get the URL of the main (cover) image, falling back to the first image. */
function getMainImageUrl(media: DayMedia[], mainMediaId?: string | null): string | undefined {
  if (mainMediaId) {
    const main = media.find((m) => m.id === mainMediaId);
    if (main?.url) return main.url;
  }
  return media.find((m) => isImageType(m.contentType))?.url;
}

// ─── Horizontal Mode ───────────────────────────────────────

function HorizontalMode({
  dateRange,
  onDayClick,
}: {
  dateRange: { from?: string; to?: string };
  onDayClick: DayClickHandler;
}) {
  const { data, isLoading, error } = useTimeline(dateRange);

  const horizontalWeeks = useMemo(
    () => (data ? groupTimelineHorizontal(data) : []),
    [data],
  );

  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage />;

  if (data) {
    return (
      <div>
        <p className="mb-4 text-sm text-content-secondary">
          Showing {formatDate(data.from)} — {formatDate(data.to)}
        </p>
        <HorizontalTimeline weeks={horizontalWeeks} onDayClick={onDayClick} />
      </div>
    );
  }

  return null;
}

function HorizontalTimeline({
  weeks,
  onDayClick,
}: {
  weeks: HorizontalTimelineWeek[];
  onDayClick: DayClickHandler;
}) {
  if (weeks.length === 0) {
    return (
      <EmptyState
        title="No timeline data"
        description="Create some chapters to see your timeline."
      />
    );
  }

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[500px]">
      {/* Day headers */}
      <div className="mb-3 grid grid-cols-7 gap-2 px-1">
        {dayLabels.map((label) => (
          <div key={label} className="text-center text-xs font-medium text-content-tertiary">
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label[0]}</span>
          </div>
        ))}
      </div>

      {/* Week rows */}
      <div className="space-y-6">
        {weeks.map((week) => (
          <div key={week.weekStart}>
            {/* Period bars above day circles */}
            {week.periods.length > 0 && (
              <div
                className="relative mb-1.5"
                style={{ minHeight: `${Math.max(1, week.periods.length) * 22}px` }}
              >
                {week.periods.map((wp, idx) => (
                  <div
                    key={wp.period.id}
                    className="absolute rounded-full truncate px-2 text-xs font-medium"
                    style={{
                      left: `${(wp.startCol / 7) * 100}%`,
                      width: `${(wp.span / 7) * 100}%`,
                      top: `${idx * 22}px`,
                      backgroundColor: hexToRgba(wp.period.category.color, 0.2),
                      color: wp.period.category.color,
                      height: '18px',
                      lineHeight: '18px',
                    }}
                    title={`${wp.period.eventGroup.title}${wp.period.comment ? `: ${wp.period.comment}` : ''}`}
                  >
                    {wp.span > 1 ? wp.period.eventGroup.title : ''}
                  </div>
                ))}
              </div>
            )}

            {/* Day circles row with connecting line */}
            <div className="relative grid grid-cols-7 gap-2">
              <div className="absolute top-1/2 left-[7%] right-[7%] h-px bg-edge-light -translate-y-2" />

              {week.days.map((day) => {
                const disabled = isBeyondTomorrow(day.date);
                return (
                <div key={day.date} className="relative flex flex-col items-center gap-1">
                  <DayCircle
                    date={day.date}
                    color={day.dayState?.color}
                    imageUrl={getMainImageUrl(day.media, day.mainMediaId)}
                    size="md"
                    label={`${formatDate(day.date)} — ${day.dayState?.name ?? 'No mood'}`}
                    onClick={disabled ? undefined : () => onDayClick(day.date)}
                    disabled={disabled}
                  />
                  <span
                    className={`text-xs ${
                      isToday(day.date)
                        ? 'font-bold text-accent'
                        : disabled
                          ? 'text-content-tertiary/50'
                          : 'text-content-tertiary'
                    }`}
                  >
                    {day.dayNumber}
                  </span>
                </div>
                );
              })}
            </div>

            {/* Week date range label */}
            <div className="mt-1 text-right text-xs text-content-tertiary">
              {formatDate(week.weekStart, 'MMM d')} —{' '}
              {formatDate(week.weekEnd, 'MMM d')}
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}

// ─── Week Mode ─────────────────────────────────────────────

function WeekMode({
  currentDate,
  onDayClick,
}: {
  currentDate: string;
  onDayClick: DayClickHandler;
}) {
  const { data: weekData, isLoading } = useWeekTimeline({ date: currentDate });

  const weekDays = useMemo(() => (weekData ? buildWeekGrid(weekData) : []), [weekData]);

  if (isLoading) return <Spinner />;

  if (weekData) {
    return (
      <div>
        <p className="mb-4 text-sm text-content-secondary">
          {formatDate(weekData.weekStart)} — {formatDate(weekData.weekEnd)}
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
              } bg-surface-card`}
            >
              <p className="text-xs font-medium text-content-secondary">
                {formatDayShort(day.date)}
              </p>
              <p className="text-xl font-bold text-content md:text-2xl">{formatDayNumber(day.date)}</p>

              <div className="mt-2 flex justify-center">
                <DayCircle
                  date={day.date}
                  color={day.dayState?.color}
                  imageUrl={getMainImageUrl(day.media, day.mainMediaId)}
                  size="lg"
                  label={day.dayState?.name ?? 'No mood'}
                />
              </div>

              {day.periods.length > 0 && (
                <div className="mt-2 space-y-1">
                  {day.periods.slice(0, 3).map((period) => (
                    <div
                      key={period.id}
                      className="rounded-md px-2 py-0.5 text-xs font-medium truncate"
                      style={{
                        backgroundColor: hexToRgba(period.category.color, 0.15),
                        color: period.category.color,
                      }}
                      title={`${period.eventGroup.title}${period.comment ? `: ${period.comment}` : ''}`}
                    >
                      {period.eventGroup.title}
                    </div>
                  ))}
                  {day.periods.length > 3 && (
                    <p className="text-center text-xs text-content-tertiary">
                      +{day.periods.length - 3} more
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

  return <EmptyState title="No data for this week" />;
}

// ─── Shared UI Helpers ─────────────────────────────────────

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
    </div>
  );
}

function ErrorMessage() {
  return (
    <div className="py-16 text-center text-sm text-danger">Failed to load timeline.</div>
  );
}
