'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation, useUpdateProfile } from '@timeflux/hooks';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';

const MIN_AGE_YEARS = 13;
const MAX_AGE_YEARS = 130;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function computeMinDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MAX_AGE_YEARS);
  return d.toISOString().split('T')[0];
}

function computeMaxDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_AGE_YEARS);
  return d.toISOString().split('T')[0];
}

const MIN_DATE = computeMinDate();
const MAX_DATE = computeMaxDate();

export function BirthDateSection() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const updateProfile = useUpdateProfile();

  const isPaid = user?.tier === 'PRO' || user?.tier === 'PREMIUM';
  const currentBirthDate = user?.birthDate ?? null;

  const [inputValue, setInputValue] = useState(currentBirthDate ?? '');
  const [isDirty, setIsDirty] = useState(false);

  // Sync input when birthDate changes from outside (e.g., re-auth)
  useEffect(() => {
    if (!isDirty) {
      setInputValue(currentBirthDate ?? '');
    }
  }, [currentBirthDate, isDirty]);

  const handleChange = useCallback(
    (value: string) => {
      setInputValue(value);
      setIsDirty(value !== (currentBirthDate ?? ''));
    },
    [currentBirthDate],
  );

  const handleSave = useCallback(() => {
    if (!inputValue) return;

    if (
      !ISO_DATE_RE.test(inputValue) ||
      isNaN(new Date(inputValue).getTime()) ||
      inputValue < MIN_DATE ||
      inputValue > MAX_DATE
    ) {
      toast.error(t('settings.birth_date_invalid'));
      return;
    }

    updateProfile.mutate(
      { birthDate: inputValue },
      {
        onSuccess: (updatedUser) => {
          setUser(updatedUser);
          setIsDirty(false);
          toast.success(t('settings.birth_date_saved'));
        },
        onError: () => {
          toast.error(t('settings.birth_date_error'));
        },
      },
    );
  }, [inputValue, updateProfile, setUser, t]);

  const handleClear = useCallback(() => {
    updateProfile.mutate(
      { birthDate: null },
      {
        onSuccess: (updatedUser) => {
          setUser(updatedUser);
          setInputValue('');
          setIsDirty(false);
          toast.success(t('settings.birth_date_cleared'));
        },
        onError: () => {
          toast.error(t('settings.birth_date_error'));
        },
      },
    );
  }, [updateProfile, setUser, t]);

  return (
    <div className="rounded-xl border border-edge bg-surface-elevated p-6">
      <h2 className="mb-4 text-lg font-semibold text-content">
        {t('settings.birth_date')}
      </h2>

      {isPaid ? (
        <div className="space-y-4">
          <p className="text-sm text-content-secondary">
            {t('settings.birth_date_description')}
          </p>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="birth-date-input" className="sr-only">
                {t('settings.birth_date')}
              </label>
              <input
                id="birth-date-input"
                type="date"
                value={inputValue}
                min={MIN_DATE}
                max={MAX_DATE}
                onChange={(e) => handleChange(e.target.value)}
                className="rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-base sm:text-sm text-content"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={!isDirty || !inputValue || updateProfile.isPending}
              size="sm"
            >
              {t('common.save')}
            </Button>

            {currentBirthDate && (
              <Button
                variant="ghost"
                onClick={handleClear}
                disabled={updateProfile.isPending}
                size="sm"
              >
                {t('common.clear')}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-content-secondary">
            {t('settings.birth_date_locked')}
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-edge px-4 py-3">
            <svg
              aria-hidden="true"
              className="h-5 w-5 text-content-tertiary"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            <span className="text-sm text-content-tertiary">
              {t('settings.birth_date_upgrade_hint')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
