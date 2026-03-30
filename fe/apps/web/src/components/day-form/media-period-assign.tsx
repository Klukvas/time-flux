'use client';

import toast from 'react-hot-toast';
import { extractApiError } from '@timeflux/api';
import type { DayMedia } from '@timeflux/api';
import { getUserMessage } from '@timeflux/domain';
import { useUpdateDayMediaPeriod, useTranslation } from '@timeflux/hooks';
import { hexToRgba } from '@timeflux/utils';

interface Period {
  id: string;
  eventGroup: { id: string; title: string };
  category: { color: string };
}

interface MediaPeriodAssignProps {
  media: DayMedia[];
  periods: Period[];
  date: string;
}

export function MediaPeriodAssign({
  media,
  periods,
  date,
}: MediaPeriodAssignProps) {
  const { t } = useTranslation();
  const updateMediaPeriod = useUpdateDayMediaPeriod();

  if (periods.length === 0 || media.length === 0) return null;

  return (
    <div className="mb-3">
      <div className="mb-2 flex items-center gap-1.5">
        <h4 className="text-xs font-medium text-content-secondary">
          {t('day_form.media_chapters')}
        </h4>
        <div className="group relative">
          <svg
            className="h-3.5 w-3.5 cursor-help text-content-tertiary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-label={t('day_form.media_chapters_info')}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-60 -translate-x-1/2 rounded-lg border border-edge bg-surface-elevated p-2.5 text-[11px] leading-relaxed text-content-secondary opacity-0 shadow-lg transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
            {t('day_form.media_chapters_info')}
            <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-edge" />
          </div>
        </div>
      </div>
      <div className="space-y-1.5" data-testid="media-period-list">
        {media.map((m) => {
          const isUpdating =
            updateMediaPeriod.isPending &&
            updateMediaPeriod.variables?.id === m.id;
          const currentPeriod = periods.find((p) => p.id === m.periodId);
          return (
            <div
              key={m.id}
              className={`flex items-center gap-3 rounded-lg border border-edge bg-surface-elevated px-3 py-2 transition-opacity ${isUpdating ? 'opacity-50' : ''}`}
              data-testid={`media-row-${m.id}`}
            >
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-surface-secondary">
                {m.url ? (
                  <img
                    src={m.url}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-content-tertiary">
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3 3h18"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <span className="min-w-0 flex-1 truncate text-xs text-content-secondary">
                {m.fileName}
              </span>
              {currentPeriod && (
                <div
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: currentPeriod.category.color }}
                  data-testid={`color-dot-${m.id}`}
                />
              )}
              <select
                disabled={isUpdating}
                value={m.periodId ?? ''}
                onChange={(e) => {
                  const newPeriodId = e.target.value || null;
                  updateMediaPeriod.mutate(
                    { id: m.id, date, data: { periodId: newPeriodId } },
                    {
                      onError: (err) =>
                        toast.error(getUserMessage(extractApiError(err))),
                    },
                  );
                }}
                className="shrink-0 rounded-md border border-edge bg-surface-secondary px-2 py-1 text-xs text-content transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                data-testid={`period-select-${m.id}`}
              >
                <option value="">{t('day_form.all_periods')}</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.eventGroup.title}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
