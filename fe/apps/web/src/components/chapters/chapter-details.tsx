'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { EventGroup, EventPeriod } from '@lifespan/api';
import { extractApiError } from '@lifespan/api';
import { getUserMessage } from '@lifespan/domain';
import {
  useDeleteEventGroup,
  useDeletePeriod,
  useEventGroupDetails,
  useTranslation,
} from '@lifespan/hooks';
import { formatDateRange, hexToRgba, isImageType } from '@lifespan/utils';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ChapterFormModal } from './chapter-form-modal';
import { PeriodFormModal } from './period-form-modal';
import { ClosePeriodModal } from './close-period-modal';

interface ChapterDetailsProps {
  groupId: string;
}

export function ChapterDetails({ groupId }: ChapterDetailsProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: details, isLoading, error } = useEventGroupDetails(groupId);
  const deleteGroup = useDeleteEventGroup();
  const deletePeriod = useDeletePeriod();

  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const [periodFormOpen, setPeriodFormOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<EventPeriod | null>(null);
  const [closingPeriod, setClosingPeriod] = useState<EventPeriod | null>(null);
  const [deletingPeriod, setDeletingPeriod] = useState<EventPeriod | null>(null);
  const [deletingGroup, setDeletingGroup] = useState(false);

  const handleDeleteGroup = () => {
    deleteGroup.mutate(groupId, {
      onSuccess: () => {
        toast.success(t('chapters.deleted'));
        router.push('/chapters');
      },
      onError: (err) => {
        toast.error(getUserMessage(extractApiError(err)));
      },
    });
  };

  const handleDeletePeriod = () => {
    if (!deletingPeriod) return;
    deletePeriod.mutate(deletingPeriod.id, {
      onSuccess: () => {
        toast.success(t('periods.deleted'));
        setDeletingPeriod(null);
      },
      onError: (err) => {
        toast.error(getUserMessage(extractApiError(err)));
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="py-16 text-center text-sm text-danger">
        {t('chapters.details.not_found')}
      </div>
    );
  }

  const sortedPeriods = [...details.periods].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => router.push('/chapters')}
        className="mb-4 flex items-center gap-1 text-sm text-content-secondary hover:text-content"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t('chapters.title')}
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-content">{details.title}</h1>
              <span
                className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{
                  backgroundColor: hexToRgba(details.category.color, 0.15),
                  color: details.category.color,
                }}
              >
                {details.category.name}
              </span>
            </div>
            {details.description && (
              <p className="mt-2 text-sm text-content-secondary">{details.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setEditGroupOpen(true)}>
              {t('common.edit')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-danger hover:text-danger-hover"
              onClick={() => setDeletingGroup(true)}
            >
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      {details.totalDays > 0 && (
        <div className="mb-6 flex items-center gap-6 rounded-lg border border-edge bg-surface-card p-4">
          <div>
            <p className="text-2xl font-bold text-content">{details.totalDays}</p>
            <p className="text-xs text-content-tertiary">{t('chapters.details.total_days')}</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-content">{details.periods.length}</p>
            <p className="text-xs text-content-tertiary">{t('chapters.details.periods')}</p>
          </div>
        </div>
      )}

      {/* Mood stats */}
      {details.moodStats && details.moodStats.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-content-secondary">
            {t('chapters.details.mood_stats')}
          </h2>
          <div className="space-y-2">
            {details.moodStats.map((stat) => (
              <div key={stat.dayStateName} className="flex items-center gap-3">
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: stat.dayStateColor }}
                />
                <span className="text-sm text-content w-24 truncate">{stat.dayStateName}</span>
                <div className="flex-1 h-2 rounded-full bg-surface-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${stat.percentage}%`,
                      backgroundColor: stat.dayStateColor,
                    }}
                  />
                </div>
                <span className="text-xs text-content-tertiary w-16 text-right">
                  {stat.count} ({stat.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chapter Insights */}
      {details.analytics && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-content-secondary">
            {t('insights.chapter_insights')}
          </h2>

          {/* Stats grid */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-edge bg-surface-card p-3 text-center">
              <p className="text-xl font-bold text-content">{details.analytics.totalDays}</p>
              <p className="text-xs text-content-tertiary">{t('insights.total_days')}</p>
            </div>
            <div className="rounded-lg border border-edge bg-surface-card p-3 text-center">
              <p className="text-xl font-bold text-content">{details.analytics.totalPeriods}</p>
              <p className="text-xs text-content-tertiary">{t('insights.total_periods')}</p>
            </div>
            <div className="rounded-lg border border-edge bg-surface-card p-3 text-center">
              <p className="text-xl font-bold text-content">{details.analytics.totalMedia}</p>
              <p className="text-xs text-content-tertiary">{t('insights.total_media')}</p>
            </div>
            <div className="rounded-lg border border-edge bg-surface-card p-3 text-center">
              <p className="text-xl font-bold text-content">
                {details.analytics.averageMoodScore !== null
                  ? details.analytics.averageMoodScore.toFixed(1)
                  : '—'}
              </p>
              <p className="text-xs text-content-tertiary">{t('insights.average_mood_score')}</p>
            </div>
          </div>

          {/* Mood distribution */}
          {details.analytics.moodDistribution.length > 0 && (
            <div className="mb-4 space-y-2">
              {details.analytics.moodDistribution.map((item) => (
                <div key={item.moodId} className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="w-20 truncate text-xs text-content">{item.moodName}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-surface-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                    />
                  </div>
                  <span className="w-14 text-right text-xs text-content-tertiary">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Activity density */}
          {details.analytics.density.length > 0 && (
            <div>
              <h3 className="mb-2 text-xs font-medium text-content-tertiary">
                {t('insights.activity_density')}
              </h3>
              <div className="space-y-2">
                {details.analytics.density.map((d, i) => {
                  const startDate = new Date(d.start);
                  const endDate = new Date(d.end);
                  const totalDaysInRange = Math.max(
                    1,
                    Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
                  );
                  const pct = Math.round((d.activeDays / totalDaysInRange) * 100);

                  return (
                    <div key={i} className="rounded-lg border border-edge bg-surface-card px-3 py-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-content-secondary">
                          {d.start} — {d.end}
                        </span>
                        <span className="text-content-tertiary">
                          {t('insights.active_days', { count: d.activeDays })} ({pct}%)
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-surface-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Periods */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-content-secondary">
            {t('chapters.details.periods')}
          </h2>
          <Button
            size="sm"
            onClick={() => { setEditingPeriod(null); setPeriodFormOpen(true); }}
          >
            + {t('periods.create')}
          </Button>
        </div>

        {sortedPeriods.length === 0 ? (
          <p className="text-sm text-content-tertiary">{t('chapters.details.no_data')}</p>
        ) : (
          <div className="space-y-2">
            {sortedPeriods.map((period) => {
              const isActive = period.endDate === null;
              return (
                <div
                  key={period.id}
                  className="flex items-center justify-between rounded-lg border border-edge bg-surface-card px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-content">
                        {formatDateRange(period.startDate, period.endDate)}
                      </span>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                          <span className="h-1.5 w-1.5 rounded-full bg-success" />
                          {t('periods.active')}
                        </span>
                      )}
                    </div>
                    {period.comment && (
                      <p className="mt-0.5 truncate text-xs text-content-secondary">{period.comment}</p>
                    )}
                  </div>
                  <div className="ml-2 flex shrink-0 items-center gap-1 sm:ml-4 sm:gap-2">
                    {isActive && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setClosingPeriod(period)}
                      >
                        <span className="hidden sm:inline">{t('common.close')}</span>
                        <svg className="h-4 w-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setEditingPeriod(period); setPeriodFormOpen(true); }}
                    >
                      <span className="hidden sm:inline">{t('common.edit')}</span>
                      <svg className="h-4 w-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-danger hover:text-danger-hover"
                      onClick={() => setDeletingPeriod(period)}
                    >
                      <span className="hidden sm:inline">{t('common.delete')}</span>
                      <svg className="h-4 w-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Media gallery */}
      {details.media && details.media.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-content-secondary">
            {t('chapters.details.media_gallery')}
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {details.media.map((m) => (
              <div
                key={m.id}
                className="aspect-square overflow-hidden rounded-lg border border-edge bg-surface-secondary"
              >
                {isImageType(m.contentType) ? (
                  <img src={m.url} alt={m.fileName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-content-tertiary">
                    {m.contentType.split('/')[1]?.toUpperCase() ?? 'FILE'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <ChapterFormModal
        open={editGroupOpen}
        onClose={() => setEditGroupOpen(false)}
        group={details as EventGroup}
      />

      <PeriodFormModal
        open={periodFormOpen}
        onClose={() => { setPeriodFormOpen(false); setEditingPeriod(null); }}
        groupId={groupId}
        period={editingPeriod}
      />

      <ClosePeriodModal
        open={!!closingPeriod}
        onClose={() => setClosingPeriod(null)}
        period={closingPeriod}
      />

      <ConfirmDialog
        open={!!deletingPeriod}
        onClose={() => setDeletingPeriod(null)}
        onConfirm={handleDeletePeriod}
        title={t('periods.delete')}
        message={t('periods.confirm_delete_message')}
        loading={deletePeriod.isPending}
      />

      <ConfirmDialog
        open={deletingGroup}
        onClose={() => setDeletingGroup(false)}
        onConfirm={handleDeleteGroup}
        title={t('chapters.delete')}
        message={t('chapters.confirm_delete_message')}
        loading={deleteGroup.isPending}
      />
    </div>
  );
}
