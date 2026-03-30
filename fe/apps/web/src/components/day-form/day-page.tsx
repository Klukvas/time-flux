'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { extractApiError } from '@timeflux/api';
import type {
  CreateDayMediaRequest,
  DayContextMemory,
  DayMedia,
} from '@timeflux/api';
import { getPeriodsForDate, getUserMessage } from '@timeflux/domain';
import {
  useCreateDayMedia,
  useCreatePeriod,
  useDayMedia,
  useDays,
  useDayStates,
  useDeleteDayMedia,
  useEventGroups,
  useMemoriesContext,
  usePresignedUpload,
  useTranslation,
  useUpdateDayLocation,
  useUpsertDay,
} from '@timeflux/hooks';
import {
  addDays,
  extractVideoThumbnail,
  formatDate,
  getStartDate,
  hexToRgba,
  isBeyondTomorrow,
  isImageType,
  isToday,
  isVideoType,
  todayISO,
} from '@timeflux/utils';
import type { MediaItem } from '@timeflux/utils';
import { MAX_COMMENT_LENGTH } from '@timeflux/constants';
import { Button } from '@/components/ui/button';
import { MediaUploader } from '@/components/ui/media-uploader';

const MediaCarousel = dynamic(
  () =>
    import('@/components/ui/media-carousel').then((mod) => mod.MediaCarousel),
  {
    loading: () => (
      <div className="h-[120px] animate-pulse rounded-lg bg-surface-secondary" />
    ),
  },
);
import { DayCircle } from '@/components/ui/day-circle';
import { CalendarPopover } from '@/components/ui/calendar-popover';
import { ChapterSelector } from '@/components/ui/chapter-selector';
import { LocationFormModal } from './location-form-modal';
import { MediaPeriodAssign } from './media-period-assign';
import { useAuthStore } from '@/stores/auth-store';
import { useViewStore } from '@/stores/view-store';

interface DayPageProps {
  date: string;
}

function toMediaItem(m: DayMedia): MediaItem {
  return {
    id: m.id,
    previewUrl: m.url ?? '',
    mimeType: m.contentType,
    key: m.s3Key,
    uploading: false,
    persisted: true,
    fileName: m.fileName,
    periodId: m.periodId ?? null,
  };
}

export function DayPage({ date }: DayPageProps) {
  const router = useRouter();
  const { t, language } = useTranslation();
  const timelineMode = useViewStore((s) => s.timelineMode);
  const user = useAuthStore((s) => s.user);

  const startDate = useMemo(
    () => getStartDate(user),
    [user?.birthDate, user?.createdAt, user?.timezone],
  );

  // Redirect to start date if navigating before it
  useEffect(() => {
    if (startDate && date < startDate) {
      router.replace(`/timeline/day/${startDate}`);
    }
  }, [date, startDate, router]);

  const { data: dayStates } = useDayStates();
  const { data: allGroups } = useEventGroups();
  const { data: existingMedia } = useDayMedia(date);
  const { data: memoriesData } = useMemoriesContext('day', date);
  const { data: daysData } = useDays({ from: date, to: date });
  const upsertDay = useUpsertDay();
  const updateLocation = useUpdateDayLocation();
  const createDayMedia = useCreateDayMedia();
  const deleteDayMedia = useDeleteDayMedia();
  const createPeriod = useCreatePeriod();
  const { upload } = usePresignedUpload();

  const dayRecord = daysData?.[0] ?? null;
  const [showLocationModal, setShowLocationModal] = useState(false);

  const [selectedDayStateId, setSelectedDayStateId] = useState<string | null>(
    null,
  );
  const [selectedMainMediaId, setSelectedMainMediaId] = useState<string | null>(
    null,
  );
  const mainMediaIdRef = useRef(selectedMainMediaId);
  mainMediaIdRef.current = selectedMainMediaId;
  const [comment, setComment] = useState('');
  const [localMediaItems, setLocalMediaItems] = useState<MediaItem[]>([]);
  const [initializedForDate, setInitializedForDate] = useState<string | null>(
    null,
  );

  const overlappingPeriods = useMemo(() => {
    if (!allGroups) return [];
    const allPeriods = allGroups.flatMap((g) =>
      g.periods.map((p) => ({
        ...p,
        endDate: p.endDate ?? null,
        comment: p.comment ?? null,
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

  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);

  // Reset period selection when the selected period is no longer active
  useEffect(() => {
    if (selectedPeriodId !== null && !activePeriodIds.has(selectedPeriodId)) {
      setSelectedPeriodId(null);
    }
  }, [activePeriodIds, selectedPeriodId]);

  const [videoThumbnails, setVideoThumbnails] = useState<
    Record<string, string>
  >({});

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

  // Initialize state from existing media (only when data is for the current date)
  useEffect(() => {
    if (initializedForDate !== date && existingMedia) {
      const cover = existingMedia.find((m) => isImageType(m.contentType));
      if (cover) {
        setSelectedMainMediaId(cover.id);
      } else if (existingMedia.length > 0) {
        // Only videos exist — extract first frame as visual preview
        const firstVideo = existingMedia.find((m) =>
          isVideoType(m.contentType),
        );
        if (firstVideo && firstVideo.url) {
          setSelectedMainMediaId(firstVideo.id);
          extractVideoThumbnail(firstVideo.url).then((thumb) => {
            if (thumb) {
              setVideoThumbnails((prev) => ({
                ...prev,
                [firstVideo.id]: thumb,
              }));
            }
          });
        }
      }
      setInitializedForDate(date);
    }
  }, [existingMedia, initializedForDate, date]);

  // Track which date has been initialized with server data
  const initializedDateRef = useRef<string | null>(null);

  // Reset when date changes, then initialize from server data
  useEffect(() => {
    if (initializedDateRef.current !== date) {
      setSelectedDayStateId(null);
      setSelectedMainMediaId(null);
      setComment('');
      setLocalMediaItems([]);
      setInitializedForDate(null);
      initializedDateRef.current = null;
    }

    if (dayRecord && initializedDateRef.current !== date) {
      setComment(dayRecord.comment ?? '');
      setSelectedDayStateId(dayRecord.dayState?.id ?? null);
      initializedDateRef.current = date;
    }
  }, [date, dayRecord]);

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
              contentType: item.file!
                .type as CreateDayMediaRequest['contentType'],
              size: item.file!.size,
              ...(selectedPeriodId ? { periodId: selectedPeriodId } : {}),
            },
          });

          if (!mainMediaIdRef.current && isImageType(item.file!.type)) {
            setSelectedMainMediaId(saved.id);
          }

          setLocalMediaItems((prev) => prev.filter((m) => m.id !== item.id));
          if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        } catch {
          if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
          setLocalMediaItems((prev) =>
            prev.map((m) =>
              m.id === item.id
                ? {
                    ...m,
                    uploading: false,
                    error: 'Upload failed',
                    previewUrl: '',
                  }
                : m,
            ),
          );
        }
      }
    },
    [upload, createDayMedia, date, selectedPeriodId],
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
      {
        date,
        data: {
          dayStateId: selectedDayStateId,
          mainMediaId: selectedMainMediaId,
          comment: comment || null,
        },
      },
      {
        onSuccess: () => toast.success(t('day_form.day_updated')),
        onError: (err) => toast.error(getUserMessage(extractApiError(err))),
      },
    );
  };

  const handleClearMood = () => {
    const previousId = selectedDayStateId;
    setSelectedDayStateId(null);
    upsertDay.mutate(
      { date, data: { dayStateId: null, mainMediaId: selectedMainMediaId } },
      {
        onSuccess: () => toast.success(t('day_form.mood_cleared')),
        onError: (err) => {
          setSelectedDayStateId(previousId);
          toast.error(getUserMessage(extractApiError(err)));
        },
      },
    );
  };

  const handleSelectMood = (id: string) => {
    const previousId = selectedDayStateId;
    setSelectedDayStateId(id);
    upsertDay.mutate(
      { date, data: { dayStateId: id, mainMediaId: selectedMainMediaId } },
      {
        onSuccess: () => toast.success(t('day_form.day_updated')),
        onError: (err) => {
          setSelectedDayStateId(previousId);
          toast.error(getUserMessage(extractApiError(err)));
        },
      },
    );
  };

  const navigateDay = (offset: number) => {
    const newDate = addDays(date, offset);
    if (startDate && newDate < startDate) return;
    router.push(`/timeline/day/${newDate}`);
  };

  const handleDatePick = (newDate: string) => {
    router.push(`/timeline/day/${newDate}`);
  };

  const handleBack = () => {
    router.push('/timeline');
  };

  const handleSaveLocation = (data: {
    locationName: string;
    latitude?: number;
    longitude?: number;
  }) => {
    updateLocation.mutate(
      {
        date,
        data: {
          locationName: data.locationName,
          latitude: data.latitude ?? null,
          longitude: data.longitude ?? null,
        },
      },
      {
        onSuccess: () => {
          toast.success(t('day_form.location_updated'));
          setShowLocationModal(false);
        },
        onError: (err) => toast.error(getUserMessage(extractApiError(err))),
      },
    );
  };

  const handleRemoveLocation = () => {
    updateLocation.mutate(
      { date, data: { locationName: null, latitude: null, longitude: null } },
      {
        onSuccess: () => toast.success(t('day_form.location_removed')),
        onError: (err) => toast.error(getUserMessage(extractApiError(err))),
      },
    );
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
  const memories: DayContextMemory[] =
    (memoriesData?.type === 'day'
      ? (memoriesData.memories as DayContextMemory[])
      : []) ?? [];

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
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            {t('day_form.back_to_timeline')}
          </button>

          {/* Day navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDay(-1)}
              disabled={!!startDate && date <= startDate}
              className="rounded-lg border border-edge px-3 py-1.5 text-sm text-content hover:bg-surface-secondary disabled:opacity-40 disabled:cursor-default"
              title={t('day_form.previous_day')}
            >
              &larr;
            </button>
            <button
              onClick={() => router.push(`/timeline/day/${todayISO()}`)}
              className="rounded-lg border border-edge px-3 py-1.5 text-sm text-content hover:bg-surface-secondary"
            >
              {t('day_form.today')}
            </button>
            <button
              onClick={() => navigateDay(1)}
              className="rounded-lg border border-edge px-3 py-1.5 text-sm text-content hover:bg-surface-secondary"
              title={t('day_form.next_day')}
            >
              &rarr;
            </button>
          </div>
        </div>

        {/* Date header + pick date button */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-2xl font-bold text-content">
              {formatDate(date, 'cccc, MMMM d, yyyy', language)}
            </h1>
            <CalendarPopover
              value={date}
              onChange={handleDatePick}
              minDate={startDate}
            />
          </div>
          {today && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {t('week.today')}
            </div>
          )}
          {futureDisabled && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-3 py-1 text-xs font-medium text-danger">
              {t('day_form.future_read_only')}
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
                  className="group w-full rounded-xl border border-edge bg-surface-elevated p-3 text-left transition-all hover:border-accent/30 hover:shadow-md"
                >
                  <p className="mb-2 text-xs font-medium text-accent">
                    {label}
                  </p>
                  <div className="flex items-center gap-3">
                    <DayCircle
                      date={memory.date}
                      color={memory.mood?.color}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      {memory.mood && (
                        <p className="text-sm font-medium text-content">
                          {memory.mood.name}
                        </p>
                      )}
                      {memory.mediaCount > 0 && (
                        <p className="text-xs text-content-secondary">
                          {memory.mediaCount}{' '}
                          {memory.mediaCount === 1
                            ? t('memories.photo')
                            : t('memories.photos')}
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
          <h3 className="mb-2 text-sm font-medium text-content-secondary">
            {t('day_form.mood')}
          </h3>
          {dayStates && dayStates.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {dayStates.map((ds) => (
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
          ) : (
            <p className="text-sm text-content-tertiary">
              {t('day_form.no_moods')}{' '}
              <Link
                href="/day-states"
                className="font-medium text-accent hover:text-accent-hover"
              >
                {t('day_form.create_moods')}
              </Link>
            </p>
          )}
        </div>

        {/* Period selector for new uploads */}
        {overlappingPeriods.length >= 1 && !futureDisabled && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-content-secondary">
              {t('day_form.tag_to_period')}
            </h3>
            <div
              className="flex flex-wrap gap-1.5"
              role="group"
              aria-label={t('day_form.tag_to_period')}
            >
              <button
                type="button"
                onClick={() => setSelectedPeriodId(null)}
                aria-pressed={selectedPeriodId === null}
                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  selectedPeriodId === null
                    ? 'border-accent bg-accent/10 font-medium text-accent'
                    : 'border-edge text-content-secondary hover:bg-surface-secondary'
                }`}
              >
                {t('day_form.all_periods')}
              </button>
              {overlappingPeriods.map((period) => (
                <button
                  key={period.id}
                  type="button"
                  onClick={() => setSelectedPeriodId(period.id)}
                  aria-pressed={selectedPeriodId === period.id}
                  className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    selectedPeriodId === period.id
                      ? 'border-transparent font-medium text-white'
                      : 'border-edge text-content-secondary hover:bg-surface-secondary'
                  }`}
                  style={
                    selectedPeriodId === period.id
                      ? { backgroundColor: period.category.color }
                      : {
                          borderLeftWidth: 3,
                          borderLeftColor: period.category.color,
                        }
                  }
                >
                  {period.eventGroup.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Media Section — Carousel + Upload */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-content-secondary">
            {t('day_form.photos_videos')}
          </h3>

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

          {/* Per-media chapter assignment */}
          {!futureDisabled && (
            <MediaPeriodAssign
              media={existingMedia ?? []}
              periods={overlappingPeriods}
              date={date}
            />
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

        {/* Location */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-content-secondary">
            {t('day_form.location')}
          </h3>
          {dayRecord?.locationName ? (
            <div className="flex items-center gap-3 rounded-lg border border-edge bg-surface-elevated px-3 py-2.5">
              <span className="text-base">📍</span>
              <span className="min-w-0 flex-1 truncate text-sm text-content">
                {dayRecord.locationName}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                {dayRecord.latitude != null && dayRecord.longitude != null && (
                  <a
                    href={`https://www.google.com/maps?q=${dayRecord.latitude},${dayRecord.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-accent hover:underline"
                  >
                    {t('day_form.view_on_map')}
                  </a>
                )}
                {!futureDisabled && (
                  <>
                    <button
                      onClick={() => setShowLocationModal(true)}
                      className="text-xs font-medium text-content-secondary hover:text-content"
                    >
                      {t('day_form.change_location')}
                    </button>
                    <button
                      onClick={handleRemoveLocation}
                      disabled={updateLocation.isPending}
                      className="text-xs font-medium text-danger hover:underline"
                    >
                      {t('day_form.remove_location')}
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-edge px-3 py-2.5">
              <span className="flex-1 text-sm text-content-tertiary">
                {t('day_form.no_location')}
              </span>
              {!futureDisabled && (
                <button
                  onClick={() => setShowLocationModal(true)}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  + {t('day_form.add_location')}
                </button>
              )}
            </div>
          )}
        </div>

        <LocationFormModal
          open={showLocationModal}
          onClose={() => setShowLocationModal(false)}
          onSave={handleSaveLocation}
          saving={updateLocation.isPending}
          initialName={dayRecord?.locationName ?? ''}
          initialLat={dayRecord?.latitude ?? undefined}
          initialLng={dayRecord?.longitude ?? undefined}
        />

        {/* Comment */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-content-secondary">
            {t('day_form.comment')}
          </h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={MAX_COMMENT_LENGTH}
            rows={3}
            placeholder={t('day_form.comment_placeholder')}
            className="block w-full rounded-lg border border-edge bg-surface-elevated px-3 py-2 text-sm text-content shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
            disabled={isPending || futureDisabled}
          />
          <p className="mt-1 text-right text-xs text-content-tertiary">
            {comment.length}/{MAX_COMMENT_LENGTH}
          </p>
        </div>

        {/* Active Chapters Section */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-content-secondary">
              {t('chapters.title')}
            </h3>
            <button
              onClick={() => router.push('/chapters')}
              className="text-xs font-medium text-accent hover:underline"
            >
              {t('chapters.view_all')}
            </button>
          </div>
          {overlappingPeriods.length > 0 ? (
            <div className="space-y-1.5">
              {overlappingPeriods.map((period) => (
                <button
                  key={period.id}
                  onClick={() =>
                    router.push(`/chapters/${period.eventGroup.id}`)
                  }
                  className="flex w-full items-center gap-2 rounded-lg border border-edge px-3 py-2 text-left text-sm transition-colors hover:bg-surface-secondary"
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
                    <span className="truncate text-content-secondary">
                      {period.comment}
                    </span>
                  )}
                  {period.endDate === null && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-success">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                      {t('periods.active')}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-content-tertiary">
              {t('chapters.empty.description')}
            </p>
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

        {/* Actions */}
        {!futureDisabled && (
          <div className="flex justify-end gap-3 border-t border-edge pt-4">
            <Button variant="secondary" onClick={handleBack}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} loading={upsertDay.isPending}>
              {t('common.save')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
