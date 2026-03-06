'use client';

import { useEffect, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { enUS } from 'react-day-picker/locale/en-US';
import { uk } from 'react-day-picker/locale/uk';
import 'react-day-picker/style.css';
import { DateTime } from 'luxon';
import type { Language } from '@timeflux/i18n';
import { useTranslation } from '@timeflux/hooks';
import { Button } from './button';

const DAY_PICKER_LOCALES: Record<Language, typeof enUS> = { en: enUS, uk };

interface CalendarPopoverProps {
  value: string; // ISO date string YYYY-MM-DD
  onChange: (date: string) => void;
  minDate?: string; // ISO date string YYYY-MM-DD — disables dates before this
}

export function CalendarPopover({
  value,
  onChange,
  minDate,
}: CalendarPopoverProps) {
  const { t, language } = useTranslation();
  const [open, setOpen] = useState(false);
  const [tempDate, setTempDate] = useState<string>(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Luxon-based dates for timezone safety
  const todayJS = DateTime.now().startOf('day').toJSDate();
  const selectedJS = DateTime.fromISO(tempDate).toJSDate();

  // Reset temp selection when popover opens
  useEffect(() => {
    if (open) setTempDate(value);
  }, [open, value]);

  // Click-outside and Escape handlers
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const handleSelect = (day: Date | undefined) => {
    if (!day) return;
    const iso = DateTime.fromJSDate(day).toISODate()!;
    setTempDate(iso);
  };

  const handleConfirm = () => {
    onChange(tempDate);
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const hasChanged = tempDate !== value;

  const pickerLocale = DAY_PICKER_LOCALES[language] ?? enUS;

  return (
    <div ref={containerRef} className="relative inline-block">
      <Button variant="secondary" size="sm" onClick={() => setOpen((o) => !o)}>
        <svg
          className="mr-1.5 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        {t('day_form.pick_date')}
      </Button>

      {open && (
        <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 rounded-xl border border-edge bg-surface-elevated p-4 shadow-xl">
          <DayPicker
            mode="single"
            selected={selectedJS}
            onSelect={handleSelect}
            defaultMonth={selectedJS}
            locale={pickerLocale}
            disabled={{
              after: todayJS,
              ...(minDate
                ? { before: DateTime.fromISO(minDate).toJSDate() }
                : {}),
            }}
            showOutsideDays
            classNames={{
              root: 'rdp-timeflux text-content text-sm',
              day: 'rdp-timeflux-day',
              today: 'rdp-timeflux-today',
              selected: 'rdp-timeflux-selected',
              outside: 'rdp-timeflux-outside',
              chevron: 'fill-content-secondary',
            }}
          />

          {/* Action buttons */}
          <div className="mt-3 flex items-center justify-end gap-2 border-t border-edge pt-3">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              {t('day_form.calendar_cancel')}
            </Button>
            <Button size="sm" onClick={handleConfirm} disabled={!hasChanged}>
              {t('day_form.calendar_go')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
