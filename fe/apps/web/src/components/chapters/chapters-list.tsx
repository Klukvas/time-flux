'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { EventGroup } from '@lifespan/api';
import { extractApiError } from '@lifespan/api';
import { getUserMessage } from '@lifespan/domain';
import { useDeleteEventGroup, useEventGroups, useTranslation } from '@lifespan/hooks';
import { formatDateRange, hexToRgba } from '@lifespan/utils';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ChapterFormModal } from './chapter-form-modal';

export function ChaptersList() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: groups, isLoading } = useEventGroups();
  const deleteGroup = useDeleteEventGroup();

  const [formOpen, setFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<EventGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<EventGroup | null>(null);

  const sorted = groups
    ? [...groups].sort((a, b) => {
        // Active periods first (groups with at least one active period)
        const aActive = a.periods.some((p) => p.endDate === null);
        const bActive = b.periods.some((p) => p.endDate === null);
        if (aActive !== bActive) return aActive ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      })
    : [];

  const handleDelete = () => {
    if (!deletingGroup) return;
    deleteGroup.mutate(deletingGroup.id, {
      onSuccess: () => {
        toast.success(t('chapters.deleted'));
        setDeletingGroup(null);
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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-content">{t('chapters.title')}</h1>
        <Button onClick={() => { setEditingGroup(null); setFormOpen(true); }}>
          + {t('chapters.create')}
        </Button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title={t('chapters.empty.title')}
          description={t('chapters.empty.description')}
          action={
            <Button onClick={() => { setEditingGroup(null); setFormOpen(true); }}>
              + {t('chapters.create')}
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((group) => {
            const hasActive = group.periods.some((p) => p.endDate === null);
            const latestPeriod = group.periods.length > 0
              ? group.periods.reduce((a, b) =>
                  new Date(b.startDate) > new Date(a.startDate) ? b : a,
                )
              : null;

            return (
              <div
                key={group.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-edge bg-surface-card p-4 transition-shadow hover:shadow-md cursor-pointer"
                style={{
                  borderLeftWidth: 4,
                  borderLeftColor: group.category.color,
                }}
                onClick={() => router.push(`/chapters/${group.id}`)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-content truncate">{group.title}</h3>
                    <span
                      className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: hexToRgba(group.category.color, 0.15),
                        color: group.category.color,
                      }}
                    >
                      {group.category.name}
                    </span>
                    {hasActive && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" />
                        {t('periods.active')}
                      </span>
                    )}
                  </div>
                  {group.description && (
                    <p className="mt-1 truncate text-sm text-content-secondary">{group.description}</p>
                  )}
                  <div className="mt-1 flex items-center gap-3 text-xs text-content-tertiary">
                    <span>{group.periods.length} {group.periods.length === 1 ? 'period' : 'periods'}</span>
                    {latestPeriod && (
                      <span>{formatDateRange(latestPeriod.startDate, latestPeriod.endDate)}</span>
                    )}
                  </div>
                </div>

                <div className="ml-2 flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setEditingGroup(group); setFormOpen(true); }}
                  >
                    <span className="hidden md:inline">{t('common.edit')}</span>
                    <svg className="h-4 w-4 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                    </svg>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:text-danger-hover"
                    onClick={() => setDeletingGroup(group)}
                  >
                    <span className="hidden md:inline">{t('common.delete')}</span>
                    <svg className="h-4 w-4 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ChapterFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingGroup(null); }}
        group={editingGroup}
      />

      <ConfirmDialog
        open={!!deletingGroup}
        onClose={() => setDeletingGroup(null)}
        onConfirm={handleDelete}
        title={t('chapters.delete')}
        message={t('chapters.confirm_delete_message')}
        loading={deleteGroup.isPending}
      />
    </div>
  );
}
