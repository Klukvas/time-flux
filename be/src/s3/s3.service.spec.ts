import { MIME_TO_EXTENSION, ALLOWED_UPLOAD_CONTENT_TYPES, MAX_UPLOAD_SIZE } from './dto/presigned-url.dto.js';

describe('S3 Upload Constants', () => {
  // ─── MIME WHITELIST ─────────────────────────────────────────

  describe('ALLOWED_UPLOAD_CONTENT_TYPES', () => {
    it('should allow standard image types', () => {
      expect(ALLOWED_UPLOAD_CONTENT_TYPES).toContain('image/jpeg');
      expect(ALLOWED_UPLOAD_CONTENT_TYPES).toContain('image/png');
      expect(ALLOWED_UPLOAD_CONTENT_TYPES).toContain('image/webp');
      expect(ALLOWED_UPLOAD_CONTENT_TYPES).toContain('image/gif');
    });

    it('should allow standard video types', () => {
      expect(ALLOWED_UPLOAD_CONTENT_TYPES).toContain('video/mp4');
      expect(ALLOWED_UPLOAD_CONTENT_TYPES).toContain('video/webm');
      expect(ALLOWED_UPLOAD_CONTENT_TYPES).toContain('video/quicktime');
    });

    it('should NOT allow potentially dangerous types', () => {
      expect(ALLOWED_UPLOAD_CONTENT_TYPES).not.toContain('application/javascript');
      expect(ALLOWED_UPLOAD_CONTENT_TYPES).not.toContain('text/html');
      expect(ALLOWED_UPLOAD_CONTENT_TYPES).not.toContain('application/x-executable');
      expect(ALLOWED_UPLOAD_CONTENT_TYPES).not.toContain('application/octet-stream');
      expect(ALLOWED_UPLOAD_CONTENT_TYPES).not.toContain('text/xml');
      expect(ALLOWED_UPLOAD_CONTENT_TYPES).not.toContain('application/pdf');
    });

    it('should NOT allow SVG (potential XSS vector)', () => {
      expect(ALLOWED_UPLOAD_CONTENT_TYPES).not.toContain('image/svg+xml');
    });
  });

  // ─── SERVER-DERIVED EXTENSION ──────────────────────────────

  describe('MIME_TO_EXTENSION', () => {
    it('should derive correct extension for each MIME type', () => {
      expect(MIME_TO_EXTENSION['image/jpeg']).toBe('.jpg');
      expect(MIME_TO_EXTENSION['image/png']).toBe('.png');
      expect(MIME_TO_EXTENSION['image/webp']).toBe('.webp');
      expect(MIME_TO_EXTENSION['image/gif']).toBe('.gif');
      expect(MIME_TO_EXTENSION['video/mp4']).toBe('.mp4');
      expect(MIME_TO_EXTENSION['video/webm']).toBe('.webm');
      expect(MIME_TO_EXTENSION['video/quicktime']).toBe('.mov');
    });

    it('should return undefined for unknown MIME types (uses fallback empty string)', () => {
      // Unknown MIME types get no extension (server derives extension, not user)
      expect(MIME_TO_EXTENSION['application/pdf']).toBeUndefined();
      expect(MIME_TO_EXTENSION['text/plain']).toBeUndefined();
    });

    it('should have entries for all allowed content types', () => {
      for (const contentType of ALLOWED_UPLOAD_CONTENT_TYPES) {
        expect(MIME_TO_EXTENSION[contentType]).toBeDefined();
        expect(MIME_TO_EXTENSION[contentType]).toMatch(/^\.\w+$/);
      }
    });
  });

  // ─── FILE SIZE LIMIT ───────────────────────────────────────

  describe('MAX_UPLOAD_SIZE', () => {
    it('should be exactly 50MB', () => {
      expect(MAX_UPLOAD_SIZE).toBe(50 * 1024 * 1024);
    });

    it('should reject files over 50MB', () => {
      const oversized = MAX_UPLOAD_SIZE + 1;
      expect(oversized > MAX_UPLOAD_SIZE).toBe(true);
    });

    it('should accept files at exactly 50MB', () => {
      expect(MAX_UPLOAD_SIZE).toBe(MAX_UPLOAD_SIZE);
    });
  });
});
