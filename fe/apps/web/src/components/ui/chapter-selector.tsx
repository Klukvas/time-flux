'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEventGroups, useTranslation } from '@lifespan/hooks';
import { hexToRgba } from '@lifespan/utils';

interface ChapterSelectorProps {
  /** Period IDs already attached to this day */
  activePeriodIds: Set<string>;
  /** Called when user selects a chapter (eventGroupId) */
  onSelect: (eventGroupId: string) => void;
  disabled?: boolean;
}

export function ChapterSelector({ activePeriodIds, onSelect, disabled }: ChapterSelectorProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: allGroups } = useEventGroups();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setSearch('');
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('keydown', handleEsc);
      inputRef.current?.focus();
    }
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  const groups = allGroups ?? [];
  const filtered = groups.filter((g) =>
    g.title.toLowerCase().includes(search.toLowerCase()),
  );

  // Check which groups have an active period
  const activeGroupIds = new Set(
    groups
      .filter((g) => g.periods.some((p) => activePeriodIds.has(p.id)))
      .map((g) => g.id),
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setSearch(''); }}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover disabled:opacity-50"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        {t('day_form.add_chapter')}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-1 w-72 rounded-xl border border-edge bg-surface-card shadow-xl">
          {/* Search input */}
          <div className="border-b border-edge p-2">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('day_form.search_chapters')}
              className="w-full rounded-lg border border-edge bg-surface px-3 py-1.5 text-sm text-content placeholder:text-content-tertiary focus:border-accent focus:outline-none"
            />
          </div>

          {/* Results */}
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length > 0 ? (
              filtered.map((group) => {
                const isActive = activeGroupIds.has(group.id);
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => {
                      onSelect(group.id);
                      setOpen(false);
                      setSearch('');
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface-secondary ${
                      isActive ? 'opacity-60' : ''
                    }`}
                  >
                    <span
                      className="h-3 w-3 flex-none rounded-full"
                      style={{ backgroundColor: group.category.color }}
                    />
                    <span className="flex-1 truncate text-content">{group.title}</span>
                    {isActive && (
                      <span
                        className="flex-none rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: hexToRgba(group.category.color, 0.15),
                          color: group.category.color,
                        }}
                      >
                        Active
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-4 text-center text-sm text-content-tertiary">
                {t('day_form.no_chapters_found')}
              </p>
            )}
          </div>

          {/* Create new shortcut */}
          {search && filtered.length === 0 && (
            <div className="border-t border-edge p-2">
              <button
                type="button"
                onClick={() => router.push('/chapters')}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-accent hover:bg-surface-secondary"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('day_form.create_new_chapter')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
