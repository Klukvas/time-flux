'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { extractApiError } from '@lifespan/api';
import type { DayMedia } from '@lifespan/api';
import { getPeriodsForDate, getUserMessage } from '@lifespan/domain';
import {
  useCreateDayMedia,
  useCreateDayStateFromRecommendation,
  useDayMedia,
  useDayStates,
  useDeleteDayMedia,
  useEventGroups,
  usePresignedUpload,
  useRecommendations,
  useTranslation,
  useUpsertDay,
} from '@lifespan/hooks';
import { formatDate, hexToRgba, isImageType, isToday } from '@lifespan/utils';
import type { MediaItem } from '@lifespan/utils';
import { MAX_COMMENT_LENGTH } from '@lifespan/constants';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { MediaUploader } from '@/components/ui/media-uploader';

interface DayFormModalProps {
  open: boolean;
  onClose: () => void;
  date: string;
  currentDayStateId?: string | null;
  currentDayStateName?: string | null;
  currentDayStateColor?: string | null;
  currentMainMediaId?: string | null;
}

/** Convert a backend DayMedia record to a local MediaItem for display. */
function toMediaItem(m: DayMedia): MediaItem {
  return {
    id: m.id,
    previewUrl: m.url,
    mimeType: m.contentType,
    key: m.s3Key,
    uploading: false,
    persisted: true,
    fileName: m.fileName,
  };
}

export function DayFormModal({
  open,
  onClose,
  date,
  currentDayStateId,
  currentDayStateName,
  currentDayStateColor,
  currentMainMediaId,
}: DayFormModalProps) {
  const { t } = useTranslation();
  const { data: dayStates } = useDayStates();
  const { data: allGroups } = useEventGroups();
  const { data: recommendations } = useRecommendations();
  const createDayStateFromRec = useCreateDayStateFromRecommendation();
  const { data: existingMedia } = useDayMedia(date);
  const upsertDay = useUpsertDay();
  const createDayMedia = useCreateDayMedia();
  const deleteDayMedia = useDeleteDayMedia();
  const { upload } = usePresignedUpload();

  const [selectedDayStateId, setSelectedDayStateId] = useState<string | null>(null);
  const [selectedMainMediaId, setSelectedMainMediaId] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [localMediaItems, setLocalMediaItems] = useState<MediaItem[]>([]);

  // Periods overlapping this day (flatten from all groups)
  const overlappingPeriods = useMemo(() => {
    if (!allGroups) return [];
    const allPeriods = allGroups.flatMap((g) =>
      g.periods.map((p) => ({
        ...p,
        eventGroup: { id: g.id, title: g.title },
        category: g.category,
      })),
    );
    return getPeriodsForDate(allPeriods, date);
  }, [allGroups, date]);

  // Merge persisted media from backend with local uploads
  const allMediaItems = useMemo(() => {
    const persisted = (existingMedia ?? []).map(toMediaItem);
    return [...persisted, ...localMediaItems];
  }, [existingMedia, localMediaItems]);

  // Reset form when opening
  useEffect(() => {
    if (open) {
      setSelectedDayStateId(currentDayStateId ?? null);
      setSelectedMainMediaId(currentMainMediaId ?? null);
      setComment('');
      setLocalMediaItems([]);
    }
  }, [open, currentDayStateId, currentMainMediaId]);

  const [creatingMoodKey, setCreatingMoodKey] = useState<string | null>(null);

  const handleCreateMoodFromRec = async (key: string) => {
    setCreatingMoodKey(key);
    try {
      const name = t(`day_states.recommendations.${key}`);
      const created = await createDayStateFromRec.mutateAsync({ key, name });
      setSelectedDayStateId(created.id);
    } catch {
      // error handled by mutation
    } finally {
      setCreatingMoodKey(null);
    }
  };

  const handleAddMedia = useCallback(
    async (files: File[]) => {
      const newItems: MediaItem[] = files.map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        previewUrl: URL.createObjectURL(f),
        mimeType: f.type,
        uploading: true,
      }));
      setLocalMediaItems((prev) => [...prev, ...newItems]);

      for (const item of newItems) {
        try {
          // 1. Upload file to S3
          const result = await upload(item.file!);

          // 2. Register media record in the backend
          const saved = await createDayMedia.mutateAsync({
            date,
            data: {
              s3Key: result.key,
              fileName: item.file!.name,
              contentType: item.file!.type,
              size: item.file!.size,
            },
          });

          // 3. Auto-select as cover if it's the first image and no cover set
          if (!selectedMainMediaId && isImageType(item.file!.type)) {
            setSelectedMainMediaId(saved.id);
          }

          // 4. Remove from local items — it's now in existingMedia via query invalidation
          setLocalMediaItems((prev) => prev.filter((m) => m.id !== item.id));
          if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        } catch {
          setLocalMediaItems((prev) =>
            prev.map((m) =>
              m.id === item.id ? { ...m, uploading: false, error: 'Upload failed' } : m,
            ),
          );
        }
      }
    },
    [upload, createDayMedia, date, selectedMainMediaId],
  );

  const handleRemoveMedia = useCallback(
    (id: string) => {
      // Check if this is a persisted (backend) item
      const persisted = existingMedia?.find((m) => m.id === id);
      if (persisted) {
        deleteDayMedia.mutate(
          { id, date },
          {
            onError: (err) => toast.error(getUserMessage(extractApiError(err))),
          },
        );
        return;
      }

      // Otherwise remove local item
      setLocalMediaItems((prev) => {
        const item = prev.find((m) => m.id === id);
        if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
        return prev.filter((m) => m.id !== id);
      });
    },
    [existingMedia, deleteDayMedia, date],
  );

  const handleSave = () => {
    upsertDay.mutate(
      { date, data: { dayStateId: selectedDayStateId, mainMediaId: selectedMainMediaId } },
      {
        onSuccess: () => {
          toast.success(t('day_form.day_updated'));
          onClose();
        },
        onError: (err) => toast.error(getUserMessage(extractApiError(err))),
      },
    );
  };

  const handleClearMood = () => {
    setSelectedDayStateId(null);
    upsertDay.mutate(
      { date, data: { dayStateId: null, mainMediaId: selectedMainMediaId } },
      {
        onSuccess: () => {
          toast.success(t('day_form.mood_cleared'));
          onClose();
        },
        onError: (err) => toast.error(getUserMessage(extractApiError(err))),
      },
    );
  };

  const today = isToday(date);
  const isPending = upsertDay.isPending;

  return (
    <Modal open={open} onClose={onClose} title={formatDate(date, 'cccc, MMMM d, yyyy')}>
      <div className="space-y-5">
        {/* Today indicator */}
        {today && (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {t('week.today')}
          </div>
        )}

        {/* Mood Picker */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-content-secondary">{t('day_form.mood')}</h3>
          <div className="flex flex-wrap gap-2">
            {dayStates?.map((ds) => (
              <button
                key={ds.id}
                type="button"
                onClick={() => setSelectedDayStateId(ds.id)}
                disabled={isPending}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  selectedDayStateId === ds.id
                    ? 'border-transparent text-white'
                    : 'border-edge text-content hover:bg-surface-secondary'
                }`}
                style={
                  selectedDayStateId === ds.id
                    ? { backgroundColor: ds.color }
                    : undefined
                }
              >
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: ds.color }}
                />
                {ds.name}
              </button>
            ))}
            {currentDayStateId && (
              <button
                type="button"
                onClick={handleClearMood}
                disabled={isPending}
                className="rounded-full border border-dashed border-edge px-3 py-1.5 text-sm text-content-secondary hover:bg-surface-secondary"
              >
                {t('common.clear')}
              </button>
            )}
          </div>
          {!dayStates?.length && (recommendations?.moods ?? []).length > 0 && (
            <div className="mt-2">
              <p className="mb-1.5 text-xs text-content-tertiary">{t('day_states.recommendations.title')}</p>
              <div className="flex flex-wrap gap-1.5">
                {(recommendations?.moods ?? []).map((rec) => {
                  const name = t(`day_states.recommendations.${rec.key}`);
                  const isCreating = creatingMoodKey === rec.key;
                  return (
                    <button
                      key={rec.key}
                      type="button"
                      onClick={() => handleCreateMoodFromRec(rec.key)}
                      disabled={!!creatingMoodKey || isPending}
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

        {/* Media Upload */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-content-secondary">{t('day_form.photos_videos')}</h3>
          <MediaUploader
            items={allMediaItems}
            onAdd={handleAddMedia}
            onRemove={handleRemoveMedia}
            coverId={selectedMainMediaId}
            onSetCover={setSelectedMainMediaId}
            disabled={isPending}
          />
        </div>

        {/* Comment */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-content-secondary">{t('day_form.comment')}</h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={MAX_COMMENT_LENGTH}
            rows={2}
            placeholder={t('day_form.comment_placeholder')}
            className="block w-full rounded-lg border border-edge bg-surface-card px-3 py-2 text-sm text-content shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
            disabled={isPending}
          />
          <p className="mt-1 text-right text-xs text-content-tertiary">
            {comment.length}/{MAX_COMMENT_LENGTH}
          </p>
        </div>

        {/* Periods for this day */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-content-secondary">{t('chapters.title')}</h3>
          {overlappingPeriods.length > 0 ? (
            <div className="space-y-1.5">
              {overlappingPeriods.map((period) => (
                <div
                  key={period.id}
                  className="flex items-center gap-2 rounded-lg border border-edge px-3 py-2 text-sm"
                  style={{
                    borderLeftWidth: 3,
                    borderLeftColor: period.category.color,
                    backgroundColor: hexToRgba(period.category.color, 0.04),
                  }}
                >
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: hexToRgba(period.category.color, 0.15),
                      color: period.category.color,
                    }}
                  >
                    {period.eventGroup.title}
                  </span>
                  {period.comment && (
                    <span className="truncate text-content-secondary">{period.comment}</span>
                  )}
                  {period.endDate === null && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-success">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                      {t('periods.active')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-content-tertiary">{t('chapters.empty.description')}</p>
          )}

          <Link
            href="/chapters"
            className="mt-2 inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('chapters.create')}
          </Link>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-edge pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} loading={upsertDay.isPending}>
            {t('common.save')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
