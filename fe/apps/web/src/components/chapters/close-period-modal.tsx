'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import type { EventPeriod } from '@lifespan/api';
import { extractApiError } from '@lifespan/api';
import { getUserMessage } from '@lifespan/domain';
import { useClosePeriod, useTranslation } from '@lifespan/hooks';
import { todayISO } from '@lifespan/utils';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ClosePeriodModalProps {
  open: boolean;
  onClose: () => void;
  period: EventPeriod | null;
}

export function ClosePeriodModal({ open, onClose, period }: ClosePeriodModalProps) {
  const { t } = useTranslation();
  const closePeriod = useClosePeriod();
  const [endDate, setEndDate] = useState(todayISO());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!period || !endDate) return;
    closePeriod.mutate(
      { id: period.id, data: { endDate } },
      {
        onSuccess: () => {
          toast.success(t('periods.closed'));
          onClose();
        },
        onError: (err) => {
          toast.error(getUserMessage(extractApiError(err)));
        },
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title={t('periods.close')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-content-secondary">
          {t('periods.close_description')}
        </p>
        <Input
          id="closeEndDate"
          label={t('periods.form.end_date')}
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          min={period?.startDate}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose} disabled={closePeriod.isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={closePeriod.isPending}>
            {t('periods.close')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
