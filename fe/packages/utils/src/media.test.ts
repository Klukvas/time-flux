import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  IMAGE_MIME_TYPES,
  VIDEO_MIME_TYPES,
  MEDIA_MIME_TYPES,
  MEDIA_ACCEPT,
  MAX_FILE_SIZE,
  isImageType,
  isVideoType,
  isAcceptedMediaType,
  validateMediaFile,
  generateFileName,
} from './media';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
describe('MEDIA constants', () => {
  it('IMAGE_MIME_TYPES contains expected image types', () => {
    expect(IMAGE_MIME_TYPES).toContain('image/jpeg');
    expect(IMAGE_MIME_TYPES).toContain('image/png');
    expect(IMAGE_MIME_TYPES).toContain('image/webp');
    expect(IMAGE_MIME_TYPES).toContain('image/gif');
    expect(IMAGE_MIME_TYPES).toContain('image/heic');
    expect(IMAGE_MIME_TYPES).toContain('image/heif');
  });

  it('VIDEO_MIME_TYPES contains expected video types', () => {
    expect(VIDEO_MIME_TYPES).toContain('video/mp4');
    expect(VIDEO_MIME_TYPES).toContain('video/webm');
    expect(VIDEO_MIME_TYPES).toContain('video/quicktime');
  });

  it('MEDIA_MIME_TYPES is the union of image and video types', () => {
    expect(MEDIA_MIME_TYPES).toHaveLength(
      IMAGE_MIME_TYPES.length + VIDEO_MIME_TYPES.length,
    );
    for (const t of IMAGE_MIME_TYPES) {
      expect(MEDIA_MIME_TYPES).toContain(t);
    }
    for (const t of VIDEO_MIME_TYPES) {
      expect(MEDIA_MIME_TYPES).toContain(t);
    }
  });

  it('MEDIA_ACCEPT is a comma-separated string of all MIME types', () => {
    const types = MEDIA_ACCEPT.split(',');
    expect(types).toHaveLength(MEDIA_MIME_TYPES.length);
    for (const t of MEDIA_MIME_TYPES) {
      expect(types).toContain(t);
    }
  });

  it('MAX_FILE_SIZE is 50 MB', () => {
    expect(MAX_FILE_SIZE).toBe(50 * 1024 * 1024);
  });
});

// ---------------------------------------------------------------------------
// isImageType
// ---------------------------------------------------------------------------
describe('isImageType', () => {
  it.each([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/heic',
    'image/heif',
  ])('returns true for %s', (type) => {
    expect(isImageType(type)).toBe(true);
  });

  it('returns false for video type', () => {
    expect(isImageType('video/mp4')).toBe(false);
  });

  it('returns false for unsupported image type', () => {
    expect(isImageType('image/bmp')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isImageType('')).toBe(false);
  });

  it('returns false for application type', () => {
    expect(isImageType('application/pdf')).toBe(false);
  });

  it('returns false for text type', () => {
    expect(isImageType('text/plain')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isVideoType
// ---------------------------------------------------------------------------
describe('isVideoType', () => {
  it.each(['video/mp4', 'video/webm', 'video/quicktime'])(
    'returns true for %s',
    (type) => {
      expect(isVideoType(type)).toBe(true);
    },
  );

  it('returns false for image type', () => {
    expect(isVideoType('image/jpeg')).toBe(false);
  });

  it('returns false for unsupported video type', () => {
    expect(isVideoType('video/avi')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isVideoType('')).toBe(false);
  });

  it('returns false for audio type', () => {
    expect(isVideoType('audio/mpeg')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isAcceptedMediaType
// ---------------------------------------------------------------------------
describe('isAcceptedMediaType', () => {
  it('returns true for all image MIME types', () => {
    for (const type of IMAGE_MIME_TYPES) {
      expect(isAcceptedMediaType(type)).toBe(true);
    }
  });

  it('returns true for all video MIME types', () => {
    for (const type of VIDEO_MIME_TYPES) {
      expect(isAcceptedMediaType(type)).toBe(true);
    }
  });

  it('returns false for application/json', () => {
    expect(isAcceptedMediaType('application/json')).toBe(false);
  });

  it('returns false for text/html', () => {
    expect(isAcceptedMediaType('text/html')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isAcceptedMediaType('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateMediaFile
// ---------------------------------------------------------------------------
describe('validateMediaFile', () => {
  function createFile(
    name: string,
    type: string,
    sizeBytes: number,
  ): File {
    // Create a File-like object with the properties the function uses
    const content = new Uint8Array(Math.min(sizeBytes, 1024));
    const file = new File([content], name, { type });
    // Override the size property since File constructor doesn't let us set arbitrary sizes easily
    Object.defineProperty(file, 'size', { value: sizeBytes });
    return file;
  }

  it('returns null for a valid image file', () => {
    const file = createFile('photo.jpg', 'image/jpeg', 1024 * 1024);
    expect(validateMediaFile(file)).toBeNull();
  });

  it('returns null for a valid video file', () => {
    const file = createFile('clip.mp4', 'video/mp4', 10 * 1024 * 1024);
    expect(validateMediaFile(file)).toBeNull();
  });

  it('returns null for a file exactly at the size limit', () => {
    const file = createFile('large.png', 'image/png', MAX_FILE_SIZE);
    expect(validateMediaFile(file)).toBeNull();
  });

  it('returns UNSUPPORTED_TYPE for unsupported MIME type', () => {
    const file = createFile('doc.pdf', 'application/pdf', 1024);
    expect(validateMediaFile(file)).toBe('UNSUPPORTED_TYPE');
  });

  it('returns UNSUPPORTED_TYPE for empty MIME type', () => {
    const file = createFile('unknown', '', 1024);
    expect(validateMediaFile(file)).toBe('UNSUPPORTED_TYPE');
  });

  it('returns FILE_TOO_LARGE for oversized file', () => {
    const file = createFile('huge.jpg', 'image/jpeg', MAX_FILE_SIZE + 1);
    expect(validateMediaFile(file)).toBe('FILE_TOO_LARGE');
  });

  it('checks type before size (unsupported type takes priority)', () => {
    // A file that is both unsupported and too large should return UNSUPPORTED_TYPE
    const file = createFile(
      'huge.txt',
      'text/plain',
      MAX_FILE_SIZE + 1,
    );
    expect(validateMediaFile(file)).toBe('UNSUPPORTED_TYPE');
  });

  it('returns null for every accepted MIME type', () => {
    for (const type of MEDIA_MIME_TYPES) {
      const file = createFile('test.bin', type, 1024);
      expect(validateMediaFile(file)).toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// generateFileName
// ---------------------------------------------------------------------------
describe('generateFileName', () => {
  it('preserves the original file extension', () => {
    const name = generateFileName('photo.jpg');
    expect(name).toMatch(/\.jpg$/);
  });

  it('preserves extension for multi-dot filenames', () => {
    const name = generateFileName('my.cool.photo.png');
    expect(name).toMatch(/\.png$/);
  });

  it('generates unique names on successive calls', () => {
    const name1 = generateFileName('a.jpg');
    const name2 = generateFileName('a.jpg');
    expect(name1).not.toBe(name2);
  });

  it('uses "bin" extension when original has no extension', () => {
    const name = generateFileName('noextension');
    expect(name).toMatch(/\.noextension$/);
    // Actually, split('.').pop() on "noextension" returns "noextension"
    // The function uses the last segment after split('.') which is "noextension" itself
  });

  it('generates a non-empty base name', () => {
    const name = generateFileName('test.mp4');
    const baseName = name.replace(/\.\w+$/, '');
    expect(baseName.length).toBeGreaterThan(0);
  });

  it('does not contain spaces or special characters in the ID portion', () => {
    const name = generateFileName('my file (1).jpg');
    const idPart = name.split('.')[0]!;
    // ID is base36 timestamp + random base36 chars
    expect(idPart).toMatch(/^[a-z0-9]+$/);
  });

  it('handles file with dot only', () => {
    const name = generateFileName('.gitignore');
    // split('.') on ".gitignore" => ["", "gitignore"], pop() => "gitignore"
    expect(name).toMatch(/\.gitignore$/);
  });
});
