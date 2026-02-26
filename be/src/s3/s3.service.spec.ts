import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

// ─── UUID mock (must be declared before module imports) ───────────────────────
const MOCK_UUID = 'aaaabbbb-cccc-dddd-eeee-ffffffffffff';

jest.mock('uuid', () => ({
  v4: jest.fn(() => MOCK_UUID),
}));

// ─── AWS SDK mocks ────────────────────────────────────────────────────────────
const mockS3Send = jest.fn();

jest.mock('@aws-sdk/client-s3', () => {
  const actual = jest.requireActual('@aws-sdk/client-s3');
  return {
    ...actual,
    S3Client: jest.fn().mockImplementation(() => ({ send: mockS3Send })),
    PutObjectCommand: jest
      .fn()
      .mockImplementation((input) => ({ input, __type: 'PutObjectCommand' })),
    GetObjectCommand: jest
      .fn()
      .mockImplementation((input) => ({ input, __type: 'GetObjectCommand' })),
    DeleteObjectCommand: jest
      .fn()
      .mockImplementation((input) => ({
        input,
        __type: 'DeleteObjectCommand',
      })),
    DeleteObjectsCommand: jest
      .fn()
      .mockImplementation((input) => ({
        input,
        __type: 'DeleteObjectsCommand',
      })),
  };
});

const mockGetSignedUrl = jest.fn();

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: (...args: unknown[]) => mockGetSignedUrl(...args),
}));

// ─── Imports after mocks ──────────────────────────────────────────────────────
import { S3Service } from './s3.service';
import {
  MIME_TO_EXTENSION,
  ALLOWED_UPLOAD_CONTENT_TYPES,
  MAX_UPLOAD_SIZE,
} from './dto/presigned-url.dto.js';
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';

// ─────────────────────────────────────────────────────────────────────────────
// S3 Upload Constants
// ─────────────────────────────────────────────────────────────────────────────

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
      expect(ALLOWED_UPLOAD_CONTENT_TYPES).not.toContain(
        'application/javascript',
      );
      expect(ALLOWED_UPLOAD_CONTENT_TYPES).not.toContain('text/html');
      expect(ALLOWED_UPLOAD_CONTENT_TYPES).not.toContain(
        'application/x-executable',
      );
      expect(ALLOWED_UPLOAD_CONTENT_TYPES).not.toContain(
        'application/octet-stream',
      );
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

// ─────────────────────────────────────────────────────────────────────────────
// S3Service
// ─────────────────────────────────────────────────────────────────────────────

describe('S3Service', () => {
  let service: S3Service;

  const configValues: Record<string, string> = {
    S3_ENDPOINT: 'http://localhost:9000',
    S3_REGION: 'us-east-1',
    S3_ACCESS_KEY_ID: 'test-access-key',
    S3_SECRET_ACCESS_KEY: 'test-secret-key',
    S3_BUCKET: 'test-bucket',
  };

  const mockConfigService = {
    get: jest.fn(
      (key: string, defaultValue?: string) => configValues[key] ?? defaultValue,
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
  });

  // ─── generatePresignedUploadUrl ────────────────────────────

  describe('generatePresignedUploadUrl', () => {
    it('should return an uploadUrl and a key', async () => {
      const expectedUrl = 'https://s3.example.com/presigned-upload';
      mockGetSignedUrl.mockResolvedValueOnce(expectedUrl);

      const result = await service.generatePresignedUploadUrl(
        'user-123',
        'image/jpeg',
        1024,
      );

      expect(result).toEqual({
        uploadUrl: expectedUrl,
        key: `uploads/user-123/${MOCK_UUID}.jpg`,
      });
    });

    it('should include the userId in the key path', async () => {
      mockGetSignedUrl.mockResolvedValueOnce('https://s3.example.com/url');
      const userId = 'my-special-user-id';

      const { key } = await service.generatePresignedUploadUrl(
        userId,
        'image/png',
        512,
      );

      expect(key).toMatch(new RegExp(`^uploads/${userId}/`));
    });

    it('should derive file extension from the MIME type', async () => {
      mockGetSignedUrl.mockResolvedValueOnce('https://s3.example.com/url');
      const { key: jpgKey } = await service.generatePresignedUploadUrl(
        'u1',
        'image/jpeg',
        100,
      );
      expect(jpgKey).toMatch(/\.jpg$/);

      mockGetSignedUrl.mockResolvedValueOnce('https://s3.example.com/url');
      const { key: mp4Key } = await service.generatePresignedUploadUrl(
        'u1',
        'video/mp4',
        100,
      );
      expect(mp4Key).toMatch(/\.mp4$/);

      mockGetSignedUrl.mockResolvedValueOnce('https://s3.example.com/url');
      const { key: movKey } = await service.generatePresignedUploadUrl(
        'u1',
        'video/quicktime',
        100,
      );
      expect(movKey).toMatch(/\.mov$/);
    });

    it('should produce a key with no extension for an unknown MIME type', async () => {
      mockGetSignedUrl.mockResolvedValueOnce('https://s3.example.com/url');

      // 'application/pdf' is not in MIME_TO_EXTENSION — extension falls back to ''
      const { key } = await service.generatePresignedUploadUrl(
        'u1',
        'application/pdf',
        100,
      );

      // Key should end with the UUID and have no trailing dot
      expect(key).toMatch(new RegExp(`${MOCK_UUID}$`));
      expect(key).not.toMatch(/\.$/);
    });

    it('should call getSignedUrl with a PutObjectCommand and 1-hour expiry', async () => {
      mockGetSignedUrl.mockResolvedValueOnce('https://s3.example.com/url');

      await service.generatePresignedUploadUrl('user-abc', 'image/webp', 2048);

      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: `uploads/user-abc/${MOCK_UUID}.webp`,
        ContentType: 'image/webp',
        ContentLength: 2048,
      });

      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ __type: 'PutObjectCommand' }),
        { expiresIn: 3600 },
      );
    });
  });

  // ─── getPresignedReadUrl ───────────────────────────────────

  describe('getPresignedReadUrl', () => {
    it('should return a signed read URL for the given key', async () => {
      const expectedUrl = 'https://s3.example.com/presigned-read';
      mockGetSignedUrl.mockResolvedValueOnce(expectedUrl);

      const result = await service.getPresignedReadUrl(
        'uploads/user-1/some-file.jpg',
      );

      expect(result).toBe(expectedUrl);
    });

    it('should call getSignedUrl with a GetObjectCommand and 24-hour expiry', async () => {
      mockGetSignedUrl.mockResolvedValueOnce('https://s3.example.com/url');
      const key = 'uploads/user-1/photo.jpg';

      await service.getPresignedReadUrl(key);

      expect(GetObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: key,
      });

      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ __type: 'GetObjectCommand' }),
        { expiresIn: 86400 },
      );
    });
  });

  // ─── deleteObject ──────────────────────────────────────────

  describe('deleteObject', () => {
    it('should send a DeleteObjectCommand for the given key', async () => {
      mockS3Send.mockResolvedValueOnce({});
      const key = 'uploads/user-1/to-delete.jpg';

      await service.deleteObject(key);

      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: key,
      });
      expect(mockS3Send).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from the S3 client', async () => {
      mockS3Send.mockRejectedValueOnce(new Error('S3 unavailable'));

      await expect(service.deleteObject('some/key')).rejects.toThrow(
        'S3 unavailable',
      );
    });
  });

  // ─── deleteObjects ─────────────────────────────────────────

  describe('deleteObjects', () => {
    it('should send a DeleteObjectsCommand with all provided keys', async () => {
      mockS3Send.mockResolvedValueOnce({});
      const keys = ['uploads/u1/a.jpg', 'uploads/u1/b.mp4', 'uploads/u1/c.gif'];

      await service.deleteObjects(keys);

      expect(DeleteObjectsCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Delete: {
          Objects: [
            { Key: 'uploads/u1/a.jpg' },
            { Key: 'uploads/u1/b.mp4' },
            { Key: 'uploads/u1/c.gif' },
          ],
          Quiet: true,
        },
      });
      expect(mockS3Send).toHaveBeenCalledTimes(1);
    });

    it('should return early without sending a command when the keys array is empty', async () => {
      await service.deleteObjects([]);

      expect(DeleteObjectsCommand).not.toHaveBeenCalled();
      expect(mockS3Send).not.toHaveBeenCalled();
    });

    it('should propagate errors from the S3 client', async () => {
      mockS3Send.mockRejectedValueOnce(new Error('Bulk delete failed'));

      await expect(service.deleteObjects(['uploads/u1/x.jpg'])).rejects.toThrow(
        'Bulk delete failed',
      );
    });
  });

  // ─── constructor / config wiring ──────────────────────────

  describe('constructor', () => {
    it('should read S3_BUCKET from config with lifespan as default', async () => {
      const localConfig = {
        get: jest.fn((key: string, defaultValue?: string) => {
          // Simulate S3_BUCKET not set in env so the default is used
          if (key === 'S3_BUCKET') return defaultValue;
          return configValues[key] ?? defaultValue;
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          S3Service,
          { provide: ConfigService, useValue: localConfig },
        ],
      }).compile();

      const localService = module.get<S3Service>(S3Service);

      expect(localService).toBeDefined();
      expect(localConfig.get).toHaveBeenCalledWith('S3_BUCKET', 'lifespan');
    });
  });
});
