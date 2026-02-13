import { GoogleStrategy, type GoogleProfile } from './google.strategy.js';
import { ConfigService } from '@nestjs/config';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;

  beforeEach(() => {
    const configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          GOOGLE_CLIENT_ID: 'test-client-id',
          GOOGLE_CLIENT_SECRET: 'test-client-secret',
          GOOGLE_CALLBACK_URL: 'http://localhost:3000/api/v1/auth/google/callback',
        };
        return config[key];
      }),
    } as unknown as ConfigService;

    strategy = new GoogleStrategy(configService);
  });

  describe('validate', () => {
    it('should extract profile data from Google profile', () => {
      const profile = {
        id: 'google-id-123',
        emails: [{ value: 'user@gmail.com', verified: true }],
        photos: [{ value: 'https://lh3.googleusercontent.com/photo.jpg' }],
      };

      const done = jest.fn();
      strategy.validate('access-token', 'refresh-token', profile, done);

      expect(done).toHaveBeenCalledWith(null, {
        email: 'user@gmail.com',
        googleId: 'google-id-123',
        avatarUrl: 'https://lh3.googleusercontent.com/photo.jpg',
      } satisfies GoogleProfile);
    });

    it('should set avatarUrl to null when no photos', () => {
      const profile = {
        id: 'google-id-123',
        emails: [{ value: 'user@gmail.com', verified: true }],
        photos: [],
      };

      const done = jest.fn();
      strategy.validate('access-token', 'refresh-token', profile, done);

      expect(done).toHaveBeenCalledWith(null, {
        email: 'user@gmail.com',
        googleId: 'google-id-123',
        avatarUrl: null,
      });
    });

    it('should reject unverified email', () => {
      const profile = {
        id: 'google-id-123',
        emails: [{ value: 'user@gmail.com', verified: false }],
        photos: [],
      };

      const done = jest.fn();
      strategy.validate('access-token', 'refresh-token', profile, done);

      expect(done).toHaveBeenCalledWith(
        expect.any(Error),
        undefined,
      );
    });

    it('should reject profile with no email', () => {
      const profile = {
        id: 'google-id-123',
        emails: [],
        photos: [],
      };

      const done = jest.fn();
      strategy.validate('access-token', 'refresh-token', profile, done);

      expect(done).toHaveBeenCalledWith(
        expect.any(Error),
        undefined,
      );
    });
  });
});
