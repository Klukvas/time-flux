'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import type { DayState } from '@lifespan/api';
import { extractApiError } from '@lifespan/api';
import { getUserMessage } from '@lifespan/domain';
import { useCreateDayStateFromRecommendation, useDayStates, useDeleteDayState, useRecommendations, useTranslation } from '@lifespan/hooks';
import { contrastTextColor } from '@lifespan/utils';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { DayStateFormModal } from './day-state-form-modal';

export function DayStatesList() {
  const { t } = useTranslation();
  const { data: dayStates, isLoading } = useDayStates();
  const { data: recommendations } = useRecommendations();
  const deleteDayState = useDeleteDayState();
  const createFromRecommendation = useCreateDayStateFromRecommendation();

  const [formOpen, setFormOpen] = useState(false);
  const [editingDayState, setEditingDayState] = useState<DayState | null>(null);
  const [deletingDayState, setDeletingDayState] = useState<DayState | null>(null);
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);
  const [creatingKey, setCreatingKey] = useState<string | null>(null);
  const [addingAll, setAddingAll] = useState(false);

  const handleDelete = () => {
    if (!deletingDayState) return;
    deleteDayState.mutate(deletingDayState.id, {
      onSuccess: () => {
        toast.success(t('day_states.deleted'));
        setDeletingDayState(null);
      },
      onError: (err) => {
        toast.error(getUserMessage(extractApiError(err)));
      },
    });
  };

  const handleAcceptRecommendation = async (key: string) => {
    setCreatingKey(key);
    try {
      const name = t(`day_states.recommendations.${key}`);
      await createFromRecommendation.mutateAsync({ key, name });
      toast.success(t('day_states.created'));
      setDismissedKeys((prev) => new Set(prev).add(key));
    } catch (err) {
      toast.error(getUserMessage(extractApiError(err as Error)));
    } finally {
      setCreatingKey(null);
    }
  };

  const handleDismissRecommendation = (key: string) => {
    setDismissedKeys((prev) => new Set(prev).add(key));
  };

  const handleAddAll = async () => {
    setAddingAll(true);
    try {
      const colors = new Set((dayStates ?? []).map((ds) => ds.color.toLowerCase()));
      const remaining = (recommendations?.moods ?? []).filter(
        (s) => !dismissedKeys.has(s.key) && !colors.has(s.color.toLowerCase()),
      );
      for (const rec of remaining) {
        const name = t(`day_states.recommendations.${rec.key}`);
        await createFromRecommendation.mutateAsync({ key: rec.key, name });
      }
      toast.success(t('day_states.created'));
      setSuggestionsDismissed(true);
    } catch (err) {
      toast.error(getUserMessage(extractApiError(err as Error)));
    } finally {
      setAddingAll(false);
    }
  };

  const existingColors = new Set((dayStates ?? []).map((ds) => ds.color.toLowerCase()));
  const visibleRecommendations = (recommendations?.moods ?? []).filter(
    (s) => !dismissedKeys.has(s.key) && !existingColors.has(s.color.toLowerCase()),
  );
  const showRecommendations = !suggestionsDismissed && visibleRecommendations.length > 0;

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
        <h1 className="text-2xl font-bold text-content">{t('day_states.title')}</h1>
        <Button onClick={() => { setEditingDayState(null); setFormOpen(true); }}>
          + {t('day_states.create')}
        </Button>
      </div>

      {!dayStates?.length && !showRecommendations && (
        <EmptyState
          title={t('day_states.empty.title')}
          description={t('day_states.empty.description')}
          action={
            <Button onClick={() => { setEditingDayState(null); setFormOpen(true); }}>
              + {t('day_states.create')}
            </Button>
          }
        />
      )}

      {/* Recommended moods */}
      {showRecommendations && (
        <div className="mb-6 space-y-6">
          {!dayStates?.length && (
            <EmptyState
              title={t('day_states.empty.title')}
              description={t('day_states.empty.description')}
            />
          )}

          <div className="rounded-xl border border-edge bg-surface-card p-5">
            <div className="mb-1 text-sm font-semibold text-content">
              {t('day_states.recommendations.title')}
            </div>
            <p className="mb-4 text-xs text-content-secondary">
              {t('day_states.recommendations.description')}
            </p>

            <div className="flex flex-wrap gap-2">
              {visibleRecommendations.map((s) => {
                const name = t(`day_states.recommendations.${s.key}`);
                const isCreating = creatingKey === s.key;
                return (
                  <div key={s.key} className="group relative flex items-center">
                    <button
                      type="button"
                      onClick={() => handleAcceptRecommendation(s.key)}
                      disabled={addingAll || isCreating}
                      className="flex items-center gap-2 rounded-full border border-edge pl-3 pr-8 py-1.5 text-sm text-content transition-colors hover:bg-surface-secondary disabled:opacity-50"
                    >
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      {name}
                      {isCreating && (
                        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDismissRecommendation(s.key)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-content-tertiary hover:text-content-secondary hover:bg-surface-secondary transition-colors"
                      title="Dismiss"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleAddAll}
                loading={addingAll}
              >
                {t('day_states.recommendations.add_all')}
              </Button>
              <button
                type="button"
                onClick={() => setSuggestionsDismissed(true)}
                className="text-xs text-content-tertiary hover:text-content-secondary transition-colors"
              >
                {t('day_states.recommendations.dismiss')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing moods grid */}
      {dayStates && dayStates.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {dayStates.map((ds) => (
            <div
              key={ds.id}
              className="rounded-xl border border-edge bg-surface-card transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3 p-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    backgroundColor: ds.color,
                    color: contrastTextColor(ds.color),
                  }}
                >
                  {ds.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-content">{ds.name}</p>
                  <p className="text-xs text-content-secondary">
                    {ds.isSystem ? t('categories.system_label') : t('categories.custom_label')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 border-t border-edge px-2 py-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setEditingDayState(ds); setFormOpen(true); }}
                >
                  {t('common.edit')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger hover:text-danger-hover"
                  onClick={() => setDeletingDayState(ds)}
                >
                  {t('common.delete')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DayStateFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingDayState(null); }}
        dayState={editingDayState}
      />

      <ConfirmDialog
        open={!!deletingDayState}
        onClose={() => setDeletingDayState(null)}
        onConfirm={handleDelete}
        title={t('day_states.delete')}
        message={t('day_states.confirm_delete_message', { name: deletingDayState?.name ?? '' })}
        loading={deleteDayState.isPending}
      />
    </div>
  );
}
