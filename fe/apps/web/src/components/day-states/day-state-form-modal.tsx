'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { DayState } from '@lifespan/api';
import { extractApiError } from '@lifespan/api';
import { getUserMessage, validateColor, validateName } from '@lifespan/domain';
import { useCreateDayState, useTranslation, useUpdateDayState } from '@lifespan/hooks';
import { BASE_COLORS, contrastTextColor, getMoodEmoji, getMoodLabel } from '@lifespan/utils';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ColorPicker } from '@/components/ui/color-picker';

const DEFAULT_COLOR: string = BASE_COLORS[0].hex;

interface DayStateFormModalProps {
  open: boolean;
  onClose: () => void;
  dayState?: DayState | null;
}

export function DayStateFormModal({ open, onClose, dayState }: DayStateFormModalProps) {
  const { t } = useTranslation();
  const createDayState = useCreateDayState();
  const updateDayState = useUpdateDayState();

  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [score, setScore] = useState(5);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!dayState;

  useEffect(() => {
    if (dayState) {
      setName(dayState.name);
      setColor(dayState.color);
      setScore(dayState.score);
    } else {
      setName('');
      setColor(DEFAULT_COLOR);
      setScore(5);
    }
    setErrors({});
  }, [dayState, open]);

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
      toast.success(isEditing ? t('day_states.updated') : t('day_states.created'));
      onClose();
    };
    const onError = (err: Error) => {
      toast.error(getUserMessage(extractApiError(err)));
    };

    if (isEditing) {
      updateDayState.mutate({ id: dayState.id, data: { name, color, score } }, { onSuccess, onError });
    } else {
      createDayState.mutate({ name, color, score }, { onSuccess, onError });
    }
  };

  const isPending = createDayState.isPending || updateDayState.isPending;

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? t('day_states.edit') : t('day_states.create')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Live preview */}
        <div className="flex items-center gap-3 rounded-lg border border-edge bg-surface-secondary px-4 py-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors"
            style={{
              backgroundColor: color,
              color: contrastTextColor(color),
            }}
          >
            {name ? name[0].toUpperCase() : '?'}
          </div>
          <span className="truncate text-sm font-medium text-content">
            {name || t('day_states.preview_placeholder')}
          </span>
        </div>

        <Input
          id="dayStateName"
          label={t('day_states.form.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          placeholder={t('day_states.form.name_placeholder')}
        />
        <div>
          <label className="mb-2 block text-sm font-medium text-content-secondary">
            {t('day_states.form.color')}
          </label>
          <ColorPicker value={color} onChange={setColor} />
          {errors.color && <p className="mt-1 text-xs text-danger">{errors.color}</p>}
        </div>

        {/* Mood Intensity Slider */}
        <div>
          <label className="mb-2 block text-sm font-medium text-content-secondary">
            {t('day_states.form.mood_intensity')}
          </label>
          <div className="relative px-1">
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              className="mood-slider w-full cursor-pointer"
            />
            <div
              className="pointer-events-none absolute -top-7 -translate-x-1/2 text-2xl transition-all"
              style={{ left: `${(score / 10) * 100}%` }}
            >
              {getMoodEmoji(score)}
            </div>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-content-tertiary">0</span>
            <span className="text-sm font-medium text-content-secondary">
              {score} — {getMoodLabel(score)}
            </span>
            <span className="text-xs text-content-tertiary">10</span>
          </div>
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
