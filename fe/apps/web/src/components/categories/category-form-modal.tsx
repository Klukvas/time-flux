'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { Category } from '@lifespan/api';
import { extractApiError } from '@lifespan/api';
import { getUserMessage, validateColor, validateName } from '@lifespan/domain';
import { useCreateCategory, useTranslation, useUpdateCategory } from '@lifespan/hooks';
import { BASE_COLORS, contrastTextColor } from '@lifespan/utils';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ColorPicker } from '@/components/ui/color-picker';

const DEFAULT_COLOR: string = BASE_COLORS[0].hex;

interface CategoryFormModalProps {
  open: boolean;
  onClose: () => void;
  category?: Category | null;
  initialName?: string;
  initialColor?: string;
}

export function CategoryFormModal({ open, onClose, category, initialName, initialColor }: CategoryFormModalProps) {
  const { t } = useTranslation();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!category;

  useEffect(() => {
    if (category) {
      setName(category.name);
      setColor(category.color);
    } else {
      setName(initialName ?? '');
      setColor(initialColor ?? DEFAULT_COLOR);
    }
    setErrors({});
  }, [category, open, initialName, initialColor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const nameResult = validateName(name);
    if (!nameResult.valid) newErrors.name = nameResult.error!;
    const colorResult = validateColor(color);
    if (!colorResult.valid) newErrors.color = colorResult.error!;
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const onSuccess = () => {
      toast.success(isEditing ? t('categories.updated') : t('categories.created'));
      onClose();
    };
    const onError = (err: Error) => {
      toast.error(getUserMessage(extractApiError(err)));
    };

    if (isEditing) {
      updateCategory.mutate({ id: category.id, data: { name, color } }, { onSuccess, onError });
    } else {
      createCategory.mutate({ name, color }, { onSuccess, onError });
    }
  };

  const isPending = createCategory.isPending || updateCategory.isPending;

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? t('categories.edit') : t('categories.create')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Live preview */}
        <div className="flex items-center gap-3 rounded-lg border border-edge bg-surface-secondary px-4 py-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors"
            style={{
              backgroundColor: color,
              color: contrastTextColor(color),
            }}
          >
            {name ? name[0].toUpperCase() : '?'}
          </div>
          <span className="truncate text-sm font-medium text-content">
            {name || t('categories.preview_placeholder')}
          </span>
        </div>

        <Input
          id="categoryName"
          label={t('categories.form.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          placeholder={t('categories.form.name_placeholder')}
        />
        <div>
          <label className="mb-2 block text-sm font-medium text-content-secondary">
            {t('categories.form.color')}
          </label>
          <ColorPicker value={color} onChange={setColor} />
          {errors.color && <p className="mt-1 text-xs text-danger">{errors.color}</p>}
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
