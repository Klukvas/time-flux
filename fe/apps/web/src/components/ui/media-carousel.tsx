'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { isImageType, isVideoType } from '@lifespan/utils';
import type { MediaItem } from '@lifespan/utils';

interface MediaCarouselProps {
  items: MediaItem[];
  coverId?: string | null;
  onSetCover?: (id: string) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export function MediaCarousel({ items, coverId, onSetCover, onRemove, disabled }: MediaCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', dragFree: true });
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (items.length === 0) return null;

  return (
    <>
      <div className="overflow-hidden rounded-lg" ref={emblaRef}>
        <div className="flex gap-2">
          {items.map((item, idx) => {
            const isCover = coverId === item.id;
            const canSetCover = item.persisted && !item.uploading && (isImageType(item.mimeType) || item.thumbnailUrl) && onSetCover;
            return (
              <div
                key={item.id}
                className="group relative flex-none"
                style={{ width: 120, height: 120 }}
              >
                {isImageType(item.mimeType) && item.previewUrl ? (
                  <img
                    src={item.previewUrl}
                    alt=""
                    className={`h-full w-full cursor-pointer rounded-lg object-cover border-2 transition-all ${
                      isCover ? 'border-accent' : 'border-edge'
                    }`}
                    onClick={() => !item.uploading && setViewerIndex(idx)}
                  />
                ) : isVideoType(item.mimeType) ? (
                  <div
                    className="flex h-full w-full cursor-pointer items-center justify-center rounded-lg border-2 border-edge bg-surface-secondary"
                    onClick={() => !item.uploading && setViewerIndex(idx)}
                  >
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt=""
                        className="h-full w-full rounded-lg object-cover"
                      />
                    ) : item.previewUrl ? (
                      <video
                        src={item.previewUrl}
                        className="h-full w-full rounded-lg object-cover"
                        muted
                      />
                    ) : null}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60">
                        <svg className="ml-0.5 h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-edge bg-surface-secondary">
                    <svg className="h-8 w-8 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                {/* Cover badge */}
                {isCover && (
                  <div className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white text-xs">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                )}

                {/* Upload spinner */}
                {item.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                )}

                {/* Error overlay */}
                {item.error && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-danger/20">
                    <svg className="h-6 w-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                )}

                {/* Hover actions */}
                {!disabled && !item.uploading && (
                  <div className="absolute right-1 top-1 hidden gap-1 group-hover:flex">
                    {canSetCover && !isCover && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onSetCover(item.id); }}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white text-xs hover:bg-black/80"
                        title="Set as cover"
                      >
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white text-xs hover:bg-danger/80"
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fullscreen viewer */}
      {viewerIndex !== null && (
        <FullScreenViewer
          items={items}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </>
  );
}

// ─── Full Screen Viewer ─────────────────────────────────

interface FullScreenViewerProps {
  items: MediaItem[];
  initialIndex: number;
  onClose: () => void;
}

function FullScreenViewer({ items, initialIndex, onClose }: FullScreenViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const item = items[currentIndex];

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : items.length - 1));
  }, [items.length]);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i < items.length - 1 ? i + 1 : 0));
  }, [items.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, goPrev, goNext]);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
        {currentIndex + 1} / {items.length}
      </div>

      {/* Prev button */}
      {items.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Content */}
      <div className="max-h-[85dvh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        {isImageType(item.mimeType) && item.previewUrl ? (
          <img
            src={item.previewUrl}
            alt=""
            className="max-h-[85dvh] max-w-[90vw] rounded-lg object-contain"
          />
        ) : isVideoType(item.mimeType) && item.previewUrl ? (
          <video
            src={item.previewUrl}
            controls
            autoPlay
            className="max-h-[85dvh] max-w-[90vw] rounded-lg"
          />
        ) : (
          <div className="flex h-64 w-64 items-center justify-center rounded-lg bg-surface-secondary text-content-tertiary">
            No preview
          </div>
        )}
      </div>

      {/* Next button */}
      {items.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
