'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { EventGroup } from '@lifespan/api';
import { extractApiError } from '@lifespan/api';
import { getUserMessage, validateTitle, validateDescription } from '@lifespan/domain';
import {
  useCategories,
  useCreateCategoryFromRecommendation,
  useCreateEventGroup,
  useRecommendations,
  useTranslation,
  useUpdateEventGroup,
} from '@lifespan/hooks';
import { MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH } from '@lifespan/constants';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CategorySelect } from '@/components/ui/category-select';

interface ChapterFormModalProps {
  open: boolean;
  onClose: () => void;
  group?: EventGroup | null;
}

export function ChapterFormModal({ open, onClose, group }: ChapterFormModalProps) {
  const { t } = useTranslation();
  const { data: categories } = useCategories();
  const { data: recommendations } = useRecommendations();
  const createGroup = useCreateEventGroup();
  const updateGroup = useUpdateEventGroup();
  const createCategoryFromRec = useCreateCategoryFromRecommendation();

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [creatingRecKey, setCreatingRecKey] = useState<string | null>(null);

  const isEditing = !!group;

  useEffect(() => {
    if (group) {
      setTitle(group.title);
      setCategoryId(group.category.id);
      setDescription(group.description ?? '');
    } else {
      setTitle('');
      setCategoryId(categories?.[0]?.id ?? '');
      setDescription('');
    }
    setErrors({});
  }, [group, open, categories]);

  const handleCreateCategoryFromRec = async (key: string) => {
    setCreatingRecKey(key);
    try {
      const name = t(`categories.recommendations.${key}`);
      const created = await createCategoryFromRec.mutateAsync({ key, name });
      setCategoryId(created.id);
    } catch {
      // error handled by mutation
    } finally {
      setCreatingRecKey(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const titleResult = validateTitle(title);
    if (!titleResult.valid) newErrors.title = titleResult.error!;
    if (!categoryId) newErrors.category = t('chapters.form.select_category_error');
    const descResult = validateDescription(description);
    if (!descResult.valid) newErrors.description = descResult.error!;
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const onSuccess = () => {
      toast.success(isEditing ? t('chapters.updated') : t('chapters.created'));
      onClose();
    };
    const onError = (err: Error) => {
      toast.error(getUserMessage(extractApiError(err)));
    };

    if (isEditing) {
      updateGroup.mutate(
        {
          id: group.id,
          data: {
            title,
            categoryId,
            description: description || undefined,
          },
        },
        { onSuccess, onError },
      );
    } else {
      createGroup.mutate(
        {
          title,
          categoryId,
          description: description || undefined,
        },
        { onSuccess, onError },
      );
    }
  };

  const isPending = createGroup.isPending || updateGroup.isPending;

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? t('chapters.edit') : t('chapters.create')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="title"
          label={t('chapters.form.title')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={MAX_TITLE_LENGTH}
          placeholder={t('chapters.form.title_placeholder')}
          error={errors.title}
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-content-secondary">
            {t('chapters.form.category')}
          </label>
          <CategorySelect
            categories={categories ?? []}
            value={categoryId}
            onChange={setCategoryId}
            placeholder={t('chapters.form.select_category')}
            noItemsText={t('chapters.form.no_categories')}
            error={errors.category}
          />
          {!categories?.length && (recommendations?.categories ?? []).length > 0 && (
            <div className="mt-2">
              <p className="mb-1.5 text-xs text-content-tertiary">{t('categories.recommendations.title')}</p>
              <div className="flex flex-wrap gap-1.5">
                {(recommendations?.categories ?? []).map((rec) => {
                  const name = t(`categories.recommendations.${rec.key}`);
                  const isCreating = creatingRecKey === rec.key;
                  return (
                    <button
                      key={rec.key}
                      type="button"
                      onClick={() => handleCreateCategoryFromRec(rec.key)}
                      disabled={!!creatingRecKey}
                      className="flex items-center gap-1.5 rounded-full border border-edge px-2.5 py-1 text-xs text-content transition-colors hover:bg-surface-secondary disabled:opacity-50"
                    >
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: rec.color }} />
                      {name}
                      {isCreating && (
                        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-content-secondary">
            {t('chapters.form.description_optional')}
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={MAX_DESCRIPTION_LENGTH}
            rows={3}
            className="block w-full rounded-lg border border-edge bg-surface-card px-3 py-2 text-sm text-content shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder={t('chapters.form.description_placeholder')}
          />
          {errors.description && <p className="mt-1 text-xs text-danger">{errors.description}</p>}
          <p className="mt-1 text-right text-xs text-content-tertiary">{description.length}/{MAX_DESCRIPTION_LENGTH}</p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={isPending}>
            {isEditing ? t('common.update') : t('common.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
