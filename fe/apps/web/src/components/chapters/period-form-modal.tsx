'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { EventPeriod } from '@lifespan/api';
import { extractApiError } from '@lifespan/api';
import { getUserMessage, validateComment, validateDateRange } from '@lifespan/domain';
import { useCreatePeriod, useTranslation, useUpdatePeriod } from '@lifespan/hooks';
import { todayISO } from '@lifespan/utils';
import { MAX_COMMENT_LENGTH } from '@lifespan/constants';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PeriodFormModalProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  period?: EventPeriod | null;
}

export function PeriodFormModal({ open, onClose, groupId, period }: PeriodFormModalProps) {
  const { t } = useTranslation();
  const createPeriod = useCreatePeriod();
  const updatePeriod = useUpdatePeriod();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!period;

  useEffect(() => {
    if (period) {
      setStartDate(period.startDate);
      setEndDate(period.endDate ?? '');
      setComment(period.comment ?? '');
    } else {
      setStartDate(todayISO());
      setEndDate('');
      setComment('');
    }
    setErrors({});
  }, [period, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const dateResult = validateDateRange(startDate, endDate || undefined);
    if (!dateResult.valid) newErrors.dates = dateResult.error!;
    const commentResult = validateComment(comment);
    if (!commentResult.valid) newErrors.comment = commentResult.error!;
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const onSuccess = () => {
      toast.success(isEditing ? t('periods.updated') : t('periods.created'));
      onClose();
    };
    const onError = (err: Error) => {
      toast.error(getUserMessage(extractApiError(err)));
    };

    if (isEditing) {
      updatePeriod.mutate(
        {
          id: period.id,
          data: {
            startDate,
            endDate: endDate || undefined,
            comment: comment || undefined,
          },
        },
        { onSuccess, onError },
      );
    } else {
      createPeriod.mutate(
        {
          groupId,
          data: {
            startDate,
            endDate: endDate || undefined,
            comment: comment || undefined,
          },
        },
        { onSuccess, onError },
      );
    }
  };

  const isPending = createPeriod.isPending || updatePeriod.isPending;

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? t('periods.edit') : t('periods.create')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="startDate"
            label={t('periods.form.start_date')}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            error={errors.dates}
          />
          <Input
            id="endDate"
            label={t('periods.form.end_date_optional')}
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="comment" className="mb-1 block text-sm font-medium text-content-secondary">
            {t('periods.form.comment_optional')}
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={MAX_COMMENT_LENGTH}
            rows={3}
            className="block w-full rounded-lg border border-edge bg-surface-card px-3 py-2 text-sm text-content shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder={t('periods.form.comment_placeholder')}
          />
          {errors.comment && <p className="mt-1 text-xs text-danger">{errors.comment}</p>}
          <p className="mt-1 text-right text-xs text-content-tertiary">{comment.length}/{MAX_COMMENT_LENGTH}</p>
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
