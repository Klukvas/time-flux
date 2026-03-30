'use client';

import { type FormEvent, useState } from 'react';
import { useApi, useTranslation } from '@timeflux/hooks';
import { extractApiError } from '@timeflux/api';
import { getUserMessage } from '@timeflux/domain';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface SupportModalProps {
  open: boolean;
  onClose: () => void;
}

export function SupportModal({ open, onClose }: SupportModalProps) {
  const { t } = useTranslation();
  const api = useApi();

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [subjectError, setSubjectError] = useState('');
  const [bodyError, setBodyError] = useState('');
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setSubject('');
    setBody('');
    setSubjectError('');
    setBodyError('');
  }

  function validate(): boolean {
    let valid = true;

    if (!subject.trim()) {
      setSubjectError(t('support.subject_required'));
      valid = false;
    } else {
      setSubjectError('');
    }

    if (!body.trim()) {
      setBodyError(t('support.body_required'));
      valid = false;
    } else {
      setBodyError('');
    }

    return valid;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await api.support.send({
        subject: subject.trim(),
        body: body.trim(),
        page: window.location.pathname,
        platform: 'time-flux::web',
      });
      toast.success(t('support.success'));
      resetForm();
      onClose();
    } catch (err) {
      toast.error(getUserMessage(extractApiError(err)));
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (!loading) {
      resetForm();
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={t('support.title')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          id="support-subject"
          label={t('support.subject_label')}
          placeholder={t('support.subject_placeholder')}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          error={subjectError}
          maxLength={200}
          disabled={loading}
        />

        <div>
          <label
            htmlFor="support-body"
            className="mb-1 block text-sm font-medium text-content"
          >
            {t('support.body_label')}
          </label>
          <textarea
            id="support-body"
            rows={5}
            placeholder={t('support.body_placeholder')}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            disabled={loading}
            aria-invalid={!!bodyError || undefined}
            aria-describedby={bodyError ? 'support-body-error' : undefined}
            className={`w-full resize-none rounded-lg border bg-[var(--color-surface)] px-3 py-2 text-sm text-content placeholder:text-content-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-theme ${bodyError ? 'border-danger' : 'border-edge hover:border-edge-hover'}`}
          />
          {bodyError && (
            <p id="support-body-error" className="mt-1 text-xs text-danger">
              {bodyError}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={loading}>
            {t('support.send')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
