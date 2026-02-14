'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { extractApiError } from '@lifespan/api';
import type { DayMedia } from '@lifespan/api';
import { getPeriodsForDate, getUserMessage } from '@lifespan/domain';
import {
  useCreateDayMedia,
  useCreateDayStateFromRecommendation,
  useCreatePeriod,
  useDayMedia,
  useDayStates,
  useDeleteDayMedia,
  useEventGroups,
  useMemoriesContext,
  usePresignedUpload,
  useRecommendations,
  useTranslation,
  useUpsertDay,
} from '@lifespan/hooks';
import {
  addDays,
  extractVideoThumbnail,
  formatDate,
  hexToRgba,
  isBeyondTomorrow,
  isImageType,
  isToday,
  isVideoType,
  todayISO,
} from '@lifespan/utils';
import type { MediaItem } from '@lifespan/utils';
import { MAX_COMMENT_LENGTH } from '@lifespan/constants';
import { Button } from '@/components/ui/button';
import { MediaUploader } from '@/components/ui/media-uploader';
import { MediaCarousel } from '@/components/ui/media-carousel';
import { DayCircle } from '@/components/ui/day-circle';
import { CalendarPopover } from '@/components/ui/calendar-popover';
import { ChapterSelector } from '@/components/ui/chapter-selector';
import { useViewStore } from '@/stores/view-store';

interface DayPageProps {
  date: string;
}

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

export function DayPage({ date }: DayPageProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const timelineMode = useViewStore((s) => s.timelineMode);
  const { data: dayStates } = useDayStates();
  const { data: allGroups } = useEventGroups();
  const { data: recommendations } = useRecommendations();
  const createDayStateFromRec = useCreateDayStateFromRecommendation();
  const { data: existingMedia } = useDayMedia(date);
  const { data: memoriesData } = useMemoriesContext('day', date);
  const upsertDay = useUpsertDay();
  const createDayMedia = useCreateDayMedia();
  const deleteDayMedia = useDeleteDayMedia();
  const createPeriod = useCreatePeriod();
  const { upload } = usePresignedUpload();

  const [selectedDayStateId, setSelectedDayStateId] = useState<string | null>(null);
  const [selectedMainMediaId, setSelectedMainMediaId] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [localMediaItems, setLocalMediaItems] = useState<MediaItem[]>([]);
  const [initialized, setInitialized] = useState(false);

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

  const activePeriodIds = useMemo(
    () => new Set(overlappingPeriods.map((p) => p.id)),
    [overlappingPeriods],
  );

  const [videoThumbnails, setVideoThumbnails] = useState<Record<string, string>>({});

  const allMediaItems = useMemo(() => {
    const persisted = (existingMedia ?? []).map((m) => {
      const item = toMediaItem(m);
      const thumb = videoThumbnails[m.id];
      if (thumb && isVideoType(m.contentType)) {
        return { ...item, thumbnailUrl: thumb };
      }
      return item;
    });
    return [...persisted, ...localMediaItems];
  }, [existingMedia, localMediaItems, videoThumbnails]);

  // Initialize state from existing media
  useEffect(() => {
    if (!initialized && existingMedia) {
      const cover = existingMedia.find((m) => isImageType(m.contentType));
      if (cover && !selectedMainMediaId) {
        setSelectedMainMediaId(cover.id);
      } else if (!cover && existingMedia.length > 0) {
        // Only videos exist — extract first frame as visual preview
        const firstVideo = existingMedia.find((m) => isVideoType(m.contentType));
        if (firstVideo) {
          setSelectedMainMediaId(firstVideo.id);
          extractVideoThumbnail(firstVideo.url).then((thumb) => {
            if (thumb) {
              setVideoThumbnails((prev) => ({ ...prev, [firstVideo.id]: thumb }));
            }
          });
        }
      }
      setInitialized(true);
    }
  }, [existingMedia, initialized, selectedMainMediaId]);

  // Reset when date changes
  useEffect(() => {
    setSelectedDayStateId(null);
    setSelectedMainMediaId(null);
    setComment('');
    setLocalMediaItems([]);
    setInitialized(false);
  }, [date]);

  const [creatingMoodKey, setCreatingMoodKey] = useState<string | null>(null);
  const [createdMoodKeys, setCreatedMoodKeys] = useState<Set<string>>(new Set());

  const handleCreateMoodFromRec = async (key: string) => {
    setCreatingMoodKey(key);
    try {
      const name = t(`day_states.recommendations.${key}`);
      const created = await createDayStateFromRec.mutateAsync({ key, name });
      setSelectedDayStateId(created.id);
      setCreatedMoodKeys((prev) => new Set(prev).add(key));
    } catch {
      // error handled by mutation
    } finally {
      setCreatingMoodKey(null);
    }
  };

  const handleAddMedia = useCallback(
    async (files: File[]) => {
      const newItems: MediaItem[] = files.map((f) => ({
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        file: f,
        previewUrl: URL.createObjectURL(f),
        mimeType: f.type,
        uploading: true,
      }));
      setLocalMediaItems((prev) => [...prev, ...newItems]);

      for (const item of newItems) {
        try {
          const result = await upload(item.file!);
          const saved = await createDayMedia.mutateAsync({
            date,
            data: {
              s3Key: result.key,
              fileName: item.file!.name,
              contentType: item.file!.type,
              size: item.file!.size,
            },
          });

          if (!selectedMainMediaId && isImageType(item.file!.type)) {
            setSelectedMainMediaId(saved.id);
          }

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
        onSuccess: () => toast.success(t('day_form.day_updated')),
        onError: (err) => toast.error(getUserMessage(extractApiError(err))),
      },
    );
  };

  const handleClearMood = () => {
    setSelectedDayStateId(null);
    upsertDay.mutate(
      { date, data: { dayStateId: null, mainMediaId: selectedMainMediaId } },
      {
        onSuccess: () => toast.success(t('day_form.mood_cleared')),
        onError: (err) => toast.error(getUserMessage(extractApiError(err))),
      },
    );
  };

  const handleSelectMood = (id: string) => {
    setSelectedDayStateId(id);
    upsertDay.mutate(
      { date, data: { dayStateId: id, mainMediaId: selectedMainMediaId } },
      {
        onSuccess: () => toast.success(t('day_form.day_updated')),
        onError: (err) => toast.error(getUserMessage(extractApiError(err))),
      },
    );
  };

  const navigateDay = (offset: number) => {
    const newDate = addDays(date, offset);
    router.push(`/timeline/day/${newDate}`);
  };

  const handleDatePick = (newDate: string) => {
    router.push(`/timeline/day/${newDate}`);
  };

  const handleBack = () => {
    router.push('/timeline');
  };

  const handleChapterSelect = (eventGroupId: string) => {
    createPeriod.mutate(
      { groupId: eventGroupId, data: { startDate: date } },
      {
        onSuccess: () => toast.success(t('day_form.chapter_added')),
        onError: (err) => toast.error(getUserMessage(extractApiError(err))),
      },
    );
  };

  const today = isToday(date);
  const futureDisabled = isBeyondTomorrow(date);
  const isPending = upsertDay.isPending;
  const memories = memoriesData?.memories ?? [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          {/* Back button — always navigates to /timeline preserving mode */}
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 rounded-lg border border-edge px-3 py-1.5 text-sm text-content hover:bg-surface-secondary"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('day_form.back_to_timeline')}
          </button>

          {/* Day navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDay(-1)}
              className="rounded-lg border border-edge px-3 py-1.5 text-sm text-content hover:bg-surface-secondary"
              title="Previous day"
            >
              &larr;
            </button>
            <button
              onClick={() => router.push(`/timeline/day/${todayISO()}`)}
              className="rounded-lg border border-edge px-3 py-1.5 text-sm text-content hover:bg-surface-secondary"
            >
              Today
            </button>
            <button
              onClick={() => navigateDay(1)}
              className="rounded-lg border border-edge px-3 py-1.5 text-sm text-content hover:bg-surface-secondary"
              title="Next day"
            >
              &rarr;
            </button>
          </div>
        </div>

        {/* Date header + pick date button */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-2xl font-bold text-content">
              {formatDate(date, 'cccc, MMMM d, yyyy')}
            </h1>
            <CalendarPopover value={date} onChange={handleDatePick} />
          </div>
          {today && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {t('week.today')}
            </div>
          )}
          {futureDisabled && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-3 py-1 text-xs font-medium text-danger">
              Future date — read only
            </div>
          )}
        </div>
      </div>

      {/* Memories Section */}
      {memories.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-medium text-content-secondary">
            {t('memories.on_this_day')}
          </h3>
          <div className="space-y-2">
            {memories.map((memory) => {
              const label =
                memory.interval.type === 'months'
                  ? memory.interval.value === 1
                    ? t('memories.one_month_ago')
                    : t('memories.months_ago', { count: memory.interval.value })
                  : memory.interval.value === 1
                    ? t('memories.one_year_ago')
                    : t('memories.years_ago', { count: memory.interval.value });

              return (
                <button
                  key={memory.date}
                  onClick={() => router.push(`/timeline/day/${memory.date}`)}
                  className="group w-full rounded-xl border border-edge bg-surface-card p-3 text-left transition-all hover:border-accent/30 hover:shadow-md"
                >
                  <p className="mb-2 text-xs font-medium text-accent">{label}</p>
                  <div className="flex items-center gap-3">
                    <DayCircle date={memory.date} color={memory.mood?.color} size="md" />
                    <div className="min-w-0 flex-1">
                      {memory.mood && (
                        <p className="text-sm font-medium text-content">{memory.mood.name}</p>
                      )}
                      {memory.mediaCount > 0 && (
                        <p className="text-xs text-content-secondary">
                          {memory.mediaCount} {memory.mediaCount === 1 ? t('memories.photo') : t('memories.photos')}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Mood Picker */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-content-secondary">{t('day_form.mood')}</h3>
          <div className="flex flex-wrap gap-2">
            {dayStates?.map((ds) => (
              <button
                key={ds.id}
                type="button"
                onClick={() => handleSelectMood(ds.id)}
                disabled={isPending || futureDisabled}
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
            {selectedDayStateId && (
              <button
                type="button"
                onClick={handleClearMood}
                disabled={isPending || futureDisabled}
                className="rounded-full border border-dashed border-edge px-3 py-1.5 text-sm text-content-secondary hover:bg-surface-secondary"
              >
                {t('common.clear')}
              </button>
            )}
          </div>
          {(() => {
            const visibleRecs = (recommendations?.moods ?? []).filter((r) => !createdMoodKeys.has(r.key));
            return visibleRecs.length > 0 && !dayStates?.length ? (
            <div className="mt-2">
              <p className="mb-1.5 text-xs text-content-tertiary">{t('day_states.recommendations.title')}</p>
              <div className="flex flex-wrap gap-1.5">
                {visibleRecs.map((rec) => {
                  const name = t(`day_states.recommendations.${rec.key}`);
                  const isCreating = creatingMoodKey === rec.key;
                  return (
                    <button
                      key={rec.key}
                      type="button"
                      onClick={() => handleCreateMoodFromRec(rec.key)}
                      disabled={!!creatingMoodKey || isPending || futureDisabled}
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
            ) : null;
          })()}
        </div>

        {/* Media Section — Carousel + Upload */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-content-secondary">{t('day_form.photos_videos')}</h3>

          {/* Carousel for existing + uploading media */}
          {allMediaItems.length > 0 && (
            <div className="mb-3">
              <MediaCarousel
                items={allMediaItems}
                coverId={selectedMainMediaId}
                onSetCover={setSelectedMainMediaId}
                onRemove={handleRemoveMedia}
                disabled={isPending || futureDisabled}
              />
            </div>
          )}

          {/* Upload dropzone (always visible for adding more) */}
          {!futureDisabled && (
            <MediaUploader
              items={[]}
              onAdd={handleAddMedia}
              onRemove={handleRemoveMedia}
              disabled={isPending || futureDisabled}
            />
          )}
        </div>

        {/* Comment */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-content-secondary">{t('day_form.comment')}</h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={MAX_COMMENT_LENGTH}
            rows={3}
            placeholder={t('day_form.comment_placeholder')}
            className="block w-full rounded-lg border border-edge bg-surface-card px-3 py-2 text-sm text-content shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
            disabled={isPending || futureDisabled}
          />
          <p className="mt-1 text-right text-xs text-content-tertiary">
            {comment.length}/{MAX_COMMENT_LENGTH}
          </p>
        </div>

        {/* Active Chapters Section */}
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

          {/* Searchable chapter selector dropdown */}
          <div className="mt-2">
            <ChapterSelector
              activePeriodIds={activePeriodIds}
              onSelect={handleChapterSelect}
              disabled={futureDisabled}
            />
          </div>
        </div>

        {/* Save */}
        {!futureDisabled && (
          <div className="flex justify-end border-t border-edge pt-4">
            <Button onClick={handleSave} loading={upsertDay.isPending}>
              {t('common.save')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
