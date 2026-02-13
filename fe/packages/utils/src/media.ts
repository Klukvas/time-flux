/** Accepted image MIME types. */
export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
] as const;

/** Accepted video MIME types. */
export const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const;

/** All accepted media MIME types. */
export const MEDIA_MIME_TYPES = [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES] as const;

/** Accept string for file inputs. */
export const MEDIA_ACCEPT = MEDIA_MIME_TYPES.join(',');

/** Max file size in bytes (50 MB). */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/** Check if a MIME type is an image. */
export function isImageType(mimeType: string): boolean {
  return (IMAGE_MIME_TYPES as readonly string[]).includes(mimeType);
}

/** Check if a MIME type is a video. */
export function isVideoType(mimeType: string): boolean {
  return (VIDEO_MIME_TYPES as readonly string[]).includes(mimeType);
}

/** Check if a MIME type is accepted. */
export function isAcceptedMediaType(mimeType: string): boolean {
  return (MEDIA_MIME_TYPES as readonly string[]).includes(mimeType);
}

/** Validate file for upload. Returns error string or null. */
export function validateMediaFile(file: File): string | null {
  if (!isAcceptedMediaType(file.type)) {
    return 'Unsupported file type. Use JPEG, PNG, WebP, GIF, HEIC, MP4, WebM, or MOV.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File is too large. Maximum size is 50 MB.';
  }
  return null;
}

/** Generate a unique file name preserving the extension. */
export function generateFileName(originalName: string): string {
  const ext = originalName.split('.').pop() ?? 'bin';
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  return `${id}.${ext}`;
}

/** Extract the first frame of a video as a data URL. Returns null on failure. */
export function extractVideoThumbnail(videoUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(null);
      return;
    }

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
    };

    video.addEventListener('loadeddata', () => {
      try {
        video.currentTime = 0.1;
      } catch {
        cleanup();
        resolve(null);
      }
    });

    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          resolve(null);
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        cleanup();
        resolve(dataUrl);
      } catch {
        cleanup();
        resolve(null);
      }
    });

    video.addEventListener('error', () => {
      cleanup();
      resolve(null);
    });

    const timeout = setTimeout(() => {
      cleanup();
      resolve(null);
    }, 5000);

    video.addEventListener('seeked', () => clearTimeout(timeout), { once: true });
    video.addEventListener('error', () => clearTimeout(timeout), { once: true });

    video.src = videoUrl;
  });
}

/** Upload/display item for UI tracking. */
export interface MediaItem {
  id: string;
  file?: File;
  previewUrl: string;
  mimeType: string;
  key?: string;
  uploading: boolean;
  error?: string;
  /** True if this item is persisted in the backend. */
  persisted?: boolean;
  /** Original file name (for persisted items without a File reference). */
  fileName?: string;
  /** Extracted video thumbnail data URL (for video-only days). */
  thumbnailUrl?: string;
}
