'use client';

import { useEffect, useRef, useState } from 'react';
import type { Category } from '@lifespan/api';

interface CategorySelectProps {
  categories: Category[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  noItemsText?: string;
  error?: string;
  size?: 'sm' | 'md';
}

function CategoryOption({ category, size = 'md' }: { category: Category; size?: 'sm' | 'md' }) {
  const dotSize = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3';
  return (
    <span className="flex items-center gap-2">
      <span
        className={`${dotSize} shrink-0 rounded-full`}
        style={{ backgroundColor: category.color }}
      />
      <span className="truncate">{category.name}</span>
    </span>
  );
}

export function CategorySelect({
  categories,
  value,
  onChange,
  placeholder = 'Select category...',
  noItemsText = 'No categories',
  error,
  size = 'md',
}: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = categories.find((c) => c.id === value);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const paddingClass = size === 'sm' ? 'px-2 py-1.5' : 'px-3 py-2';
  const textClass = size === 'sm' ? 'text-sm' : 'text-sm';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between rounded-lg border bg-surface-card shadow-sm transition-colors ${paddingClass} ${textClass} ${
          open
            ? 'border-accent ring-2 ring-accent'
            : error
              ? 'border-danger'
              : 'border-edge hover:border-edge-light'
        }`}
      >
        {selected ? (
          <CategoryOption category={selected} size={size} />
        ) : (
          <span className="text-content-tertiary">{placeholder}</span>
        )}
        <svg
          className={`ml-2 h-4 w-4 shrink-0 text-content-secondary transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-edge bg-surface-card py-1 shadow-lg">
          {categories.length === 0 ? (
            <div className={`${paddingClass} text-content-tertiary ${textClass}`}>
              {noItemsText}
            </div>
          ) : (
            categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onChange(cat.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center ${paddingClass} ${textClass} text-content transition-colors hover:bg-surface-secondary ${
                  cat.id === value ? 'bg-surface-secondary font-medium' : ''
                }`}
              >
                <CategoryOption category={cat} size={size} />
              </button>
            ))
          )}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
