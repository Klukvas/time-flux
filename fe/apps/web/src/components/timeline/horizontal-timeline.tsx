'use client';

import { useMemo } from 'react';
import { useTranslation } from '@timeflux/hooks';
import type { HorizontalTimelineWeek } from '@timeflux/domain';
import type { DayMedia } from '@timeflux/api';
import {
  formatDate,
  hexToRgba,
  isBeyondTomorrow,
  isImageType,
  isToday,
} from '@timeflux/utils';
import { Info } from 'luxon';
import { EmptyState } from '@/components/ui/empty-state';
import { DayCircle } from '@/components/ui/day-circle';

type DayClickHandler = (date: string) => void;

/** Get the URL of the main (cover) image, falling back to the first image. */
export function getMainImageUrl(
  media: DayMedia[],
  mainMediaId?: string | null,
): string | undefined {
  if (mainMediaId) {
    const main = media.find((m) => m.id === mainMediaId);
    if (main?.url) return main.url;
  }
  return media.find((m) => isImageType(m.contentType))?.url ?? undefined;
}

export function HorizontalTimeline({
  weeks,
  onDayClick,
  startDate,
  hasBirthDate,
}: {
  weeks: HorizontalTimelineWeek[];
  onDayClick: DayClickHandler;
  startDate?: string;
  hasBirthDate: boolean;
}) {
  const { t, language } = useTranslation();

  const dayLabels = useMemo(
    () => Info.weekdays('short', { locale: language ?? undefined }),
    [language],
  );

  if (weeks.length === 0) {
    return (
      <EmptyState
        title={t('timeline.empty.title')}
        description={t('timeline.empty.description')}
      />
    );
  }

  return (
    <div>
      <div>
        {/* Day headers */}
        <div className="mb-3 grid grid-cols-7 gap-1 sm:gap-2 px-1">
          {dayLabels.map((label, i) => (
            <div
              key={i}
              className="text-center text-xs font-medium font-mono text-content-tertiary"
            >
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label[0]}</span>
            </div>
          ))}
        </div>

        {/* Week rows */}
        <div className="space-y-6">
          {weeks.map((week) => {
            const colCount = week.days.length;
            const isPartialWeek = colCount < 7;
            const colOffset = isPartialWeek ? 7 - colCount : 0;

            return (
              <div key={week.weekStart}>
                {/* Period bars above day circles */}
                {week.periods.length > 0 && (
                  <div
                    className="relative mb-1.5"
                    style={{
                      minHeight: `${Math.max(1, week.periods.length) * 22}px`,
                    }}
                  >
                    {week.periods.map((wp, idx) => (
                      <div
                        key={wp.period.id}
                        className="absolute rounded-full truncate px-2 text-xs font-medium font-mono"
                        style={{
                          left: `${((wp.startCol + colOffset) / 7) * 100}%`,
                          width: `${(wp.span / 7) * 100}%`,
                          top: `${idx * 22}px`,
                          backgroundColor: hexToRgba(
                            wp.period.category.color,
                            0.2,
                          ),
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
                <div className="relative grid grid-cols-7 gap-1 sm:gap-2">
                  <div className="absolute top-1/2 left-[7%] right-[7%] h-px bg-edge-light -translate-y-2" />

                  {isPartialWeek &&
                    Array.from({ length: colOffset }).map((_, i) => (
                      <div key={`spacer-${i}`} />
                    ))}

                  {week.days.map((day) => {
                    const disabled = isBeyondTomorrow(day.date);
                    const isStartDay = startDate === day.date;
                    return (
                      <div
                        key={day.date}
                        className="relative flex flex-col items-center gap-1"
                      >
                        <DayCircle
                          date={day.date}
                          color={day.dayState?.color}
                          imageUrl={getMainImageUrl(day.media, day.mainMediaId)}
                          size="md"
                          label={`${formatDate(day.date, undefined, language)} — ${day.dayState?.name ?? t('timeline.no_mood')}`}
                          onClick={
                            disabled ? undefined : () => onDayClick(day.date)
                          }
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
                        {isStartDay && (
                          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-accent">
                            {hasBirthDate
                              ? t('timeline.birth_date_label')
                              : t('timeline.journey_begins')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Week date range label */}
                <div
                  className={`mt-1 text-right text-xs font-mono text-content-tertiary ${week.days.length < 7 ? 'mt-5' : ''}`}
                >
                  {formatDate(week.weekStart, 'MMM d', language)} —{' '}
                  {formatDate(week.weekEnd, 'MMM d', language)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
