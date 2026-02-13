'use client';

import { useCallback, useRef, useState } from 'react';
import { MEDIA_ACCEPT, validateMediaFile, isImageType, isVideoType } from '@lifespan/utils';
import type { MediaItem } from '@lifespan/utils';

interface MediaUploaderProps {
  items: MediaItem[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  coverId?: string | null;
  onSetCover?: (id: string) => void;
  disabled?: boolean;
}

export function MediaUploader({ items, onAdd, onRemove, coverId, onSetCover, disabled }: MediaUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const valid: File[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const error = validateMediaFile(file);
        if (!error) valid.push(file);
      }
      if (valid.length > 0) onAdd(valid);
    },
    [onAdd],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  return (
    <div>
      {items.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {items.map((item) => {
            const isCover = coverId === item.id;
            const canSetCover = item.persisted && !item.uploading && isImageType(item.mimeType) && onSetCover;
            return (
              <div key={item.id} className="group relative" title={item.fileName}>
                {isImageType(item.mimeType) && item.previewUrl ? (
                  <img
                    src={item.previewUrl}
                    alt=""
                    className={`h-16 w-16 rounded-lg object-cover border-2 ${
                      isCover ? 'border-accent' : 'border-edge'
                    } ${canSetCover ? 'cursor-pointer' : ''}`}
                    onClick={canSetCover ? () => onSetCover(item.id) : undefined}
                  />
                ) : isImageType(item.mimeType) ? (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-edge bg-surface-secondary">
                    <svg className="h-6 w-6 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-edge bg-surface-secondary">
                    <svg className="h-6 w-6 text-content-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
                {/* Cover badge */}
                {isCover && (
                  <div className="absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white text-xs">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                )}
                {item.uploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                )}
                {item.error && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-danger/20">
                    <svg className="h-5 w-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-danger text-white text-xs group-hover:flex"
                >
                  &times;
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed px-4 py-3 text-sm transition-colors ${
          dragOver
            ? 'border-accent bg-accent/5 text-accent'
            : 'border-edge text-content-tertiary hover:border-content-tertiary hover:text-content-secondary'
        } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
        onClick={() => inputRef.current?.click()}
      >
        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Drop photos or videos here, or click to browse
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={MEDIA_ACCEPT}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
        disabled={disabled}
      />
    </div>
  );
}
