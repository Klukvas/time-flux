'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import type { Category } from '@lifespan/api';
import { extractApiError } from '@lifespan/api';
import { getUserMessage } from '@lifespan/domain';
import { useCategories, useCreateCategoryFromRecommendation, useDeleteCategory, useRecommendations, useTranslation } from '@lifespan/hooks';
import { contrastTextColor } from '@lifespan/utils';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { CategoryFormModal } from './category-form-modal';

export function CategoriesList() {
  const { t } = useTranslation();
  const { data: categories, isLoading } = useCategories();
  const { data: recommendations } = useRecommendations();
  const deleteCategory = useDeleteCategory();
  const createFromRecommendation = useCreateCategoryFromRecommendation();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [formInitialName, setFormInitialName] = useState<string | undefined>();
  const [formInitialColor, setFormInitialColor] = useState<string | undefined>();
  const [addingAll, setAddingAll] = useState(false);
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());
  const [suggestionsDismissed, setSuggestionsDismissed] = useState(false);
  const [creatingKey, setCreatingKey] = useState<string | null>(null);

  const handleDelete = () => {
    if (!deletingCategory) return;
    deleteCategory.mutate(deletingCategory.id, {
      onSuccess: () => {
        toast.success(t('categories.deleted'));
        setDeletingCategory(null);
      },
      onError: (err) => {
        toast.error(getUserMessage(extractApiError(err)));
      },
    });
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormInitialName(undefined);
    setFormInitialColor(undefined);
    setFormOpen(true);
  };

  const handleAcceptRecommendation = async (key: string) => {
    setCreatingKey(key);
    try {
      const name = t(`categories.recommendations.${key}`);
      await createFromRecommendation.mutateAsync({ key, name });
      toast.success(t('categories.created'));
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
      const remaining = (recommendations?.categories ?? []).filter((s) => !dismissedKeys.has(s.key));
      for (const rec of remaining) {
        const name = t(`categories.recommendations.${rec.key}`);
        await createFromRecommendation.mutateAsync({ key: rec.key, name });
      }
      toast.success(t('categories.created'));
      setSuggestionsDismissed(true);
    } catch (err) {
      toast.error(getUserMessage(extractApiError(err as Error)));
    } finally {
      setAddingAll(false);
    }
  };

  const visibleRecommendations = (recommendations?.categories ?? []).filter((s) => !dismissedKeys.has(s.key));
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
        <h1 className="text-2xl font-bold text-content">{t('categories.title')}</h1>
        <Button onClick={handleOpenCreate}>
          + {t('categories.create')}
        </Button>
      </div>

      {!categories?.length && !showRecommendations && (
        <EmptyState
          title={t('categories.empty.title')}
          description={t('categories.empty.description')}
          action={
            <Button onClick={handleOpenCreate}>
              + {t('categories.create')}
            </Button>
          }
        />
      )}

      {/* Recommended categories */}
      {showRecommendations && (
        <div className="mb-6 space-y-6">
          {!categories?.length && (
            <EmptyState
              title={t('categories.empty.title')}
              description={t('categories.empty.description')}
            />
          )}

          <div className="rounded-xl border border-edge bg-surface-card p-5">
            <div className="mb-1 text-sm font-semibold text-content">
              {t('categories.recommendations.title')}
            </div>
            <p className="mb-4 text-xs text-content-secondary">
              {t('categories.recommendations.description')}
            </p>

            <div className="flex flex-wrap gap-2">
              {visibleRecommendations.map((s) => {
                const name = t(`categories.recommendations.${s.key}`);
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
                {t('categories.recommendations.add_all')}
              </Button>
              <button
                type="button"
                onClick={() => setSuggestionsDismissed(true)}
                className="text-xs text-content-tertiary hover:text-content-secondary transition-colors"
              >
                {t('categories.recommendations.dismiss')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing categories grid */}
      {categories && categories.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="rounded-xl border border-edge bg-surface-card transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-3 p-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                  style={{
                    backgroundColor: cat.color,
                    color: contrastTextColor(cat.color),
                  }}
                >
                  {cat.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-content">{cat.name}</p>
                  <p className="text-xs text-content-secondary">
                    {cat.isSystem ? t('categories.system_label') : t('categories.custom_label')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 border-t border-edge px-2 py-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setEditingCategory(cat); setFormInitialName(undefined); setFormInitialColor(undefined); setFormOpen(true); }}
                >
                  {t('common.edit')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger hover:text-danger-hover"
                  onClick={() => setDeletingCategory(cat)}
                >
                  {t('common.delete')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingCategory(null); setFormInitialName(undefined); setFormInitialColor(undefined); }}
        category={editingCategory}
        initialName={formInitialName}
        initialColor={formInitialColor}
      />

      <ConfirmDialog
        open={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDelete}
        title={t('categories.delete')}
        message={t('categories.confirm_delete_message', { name: deletingCategory?.name ?? '' })}
        loading={deleteCategory.isPending}
      />
    </div>
  );
}
