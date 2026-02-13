'use client';

import { useState } from 'react';
import { useOnThisDay, useTranslation } from '@lifespan/hooks';
import type { Memory } from '@lifespan/api';
import { DayCircle } from '@/components/ui/day-circle';

interface OnThisDaySectionProps {
  onMemoryClick: (date: string) => void;
  selectedDate?: string | null;
}

export function OnThisDaySection({ onMemoryClick, selectedDate }: OnThisDaySectionProps) {
  const { data } = useOnThisDay();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  if (!data || data.memories.length === 0) return null;

  return (
    <section className="mb-8 animate-fade-in">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-content">
          {t('memories.on_this_day')}
        </h2>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-xs text-content-tertiary hover:text-content-secondary transition-colors"
        >
          {collapsed ? t('memories.show') : t('memories.hide')}
        </button>
      </div>

      {/* Cards */}
      {!collapsed && (
        <div className="space-y-3">
          {data.memories.map((memory) => (
            <MemoryCard
              key={memory.date}
              memory={memory}
              selected={selectedDate === memory.date}
              onClick={() => onMemoryClick(memory.date)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function MemoryCard({
  memory,
  selected,
  onClick,
}: {
  memory: Memory;
  selected: boolean;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const label =
    memory.interval.type === 'months'
      ? memory.interval.value === 1
        ? t('memories.one_month_ago')
        : t('memories.months_ago', { count: memory.interval.value })
      : memory.interval.value === 1
        ? t('memories.one_year_ago')
        : t('memories.years_ago', { count: memory.interval.value });

  return (
    <button
      onClick={onClick}
      className={`group w-full rounded-xl border p-4 text-left transition-all hover:shadow-md ${
        selected
          ? 'border-accent bg-accent/5 ring-2 ring-accent/20'
          : 'border-edge bg-surface-card hover:border-accent/30'
      }`}
    >
      {/* Interval label */}
      <p className="text-xs font-medium text-accent mb-3">{label}</p>

      <div className="flex items-center gap-3">
        {/* Mood circle */}
        <div className="flex-shrink-0">
          <DayCircle
            date={memory.date}
            color={memory.mood?.color}
            size="lg"
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {memory.mood && (
            <p className="text-sm font-medium text-content">
              {memory.mood.name}
            </p>
          )}

          {memory.mediaCount > 0 && (
            <p className="text-xs text-content-secondary mt-0.5">
              {memory.mediaCount} {memory.mediaCount === 1 ? t('memories.photo') : t('memories.photos')}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
