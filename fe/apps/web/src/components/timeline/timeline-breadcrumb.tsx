'use client';

import { useTranslation } from '@timeflux/hooks';
import { DateTime } from 'luxon';
import { useViewStore } from '@/stores/view-store';

export function TimelineBreadcrumb() {
  const { t, language } = useTranslation();
  const zoomLevel = useViewStore((s) => s.zoomLevel);
  const selectedYear = useViewStore((s) => s.selectedYear);
  const selectedMonth = useViewStore((s) => s.selectedMonth);
  const resetToYearView = useViewStore((s) => s.resetToYearView);
  const zoomOut = useViewStore((s) => s.zoomOut);

  if (zoomLevel === 'year') return null;

  const monthLabel =
    selectedYear && selectedMonth
      ? DateTime.fromObject({ year: selectedYear, month: selectedMonth })
          .reconfigure({ locale: language ?? undefined })
          .toFormat('LLLL')
      : null;

  return (
    <nav className="mb-4 flex items-center gap-1.5 text-sm">
      <button
        onClick={resetToYearView}
        className="text-accent hover:underline"
      >
        {t('timeline.breadcrumb.all_years')}
      </button>

      {selectedYear && (
        <>
          <span className="text-content-tertiary">/</span>
          {zoomLevel === 'weeks' ? (
            <button
              onClick={zoomOut}
              className="text-accent hover:underline"
            >
              {selectedYear}
            </button>
          ) : (
            <span className="text-content font-medium">{selectedYear}</span>
          )}
        </>
      )}

      {monthLabel && zoomLevel === 'weeks' && (
        <>
          <span className="text-content-tertiary">/</span>
          <span className="text-content font-medium">{monthLabel}</span>
        </>
      )}
    </nav>
  );
}
