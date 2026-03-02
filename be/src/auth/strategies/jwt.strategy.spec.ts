import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy.js';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    const configService = {
      get: (key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret';
        return undefined;
      },
    };
    strategy = new JwtStrategy(configService as any);
  });

  describe('validate', () => {
    it('should return JwtPayload when sub and email are present', () => {
      const result = strategy.validate({
        sub: 'user-1',
        email: 'test@example.com',
      });

      expect(result).toEqual({
        sub: 'user-1',
        email: 'test@example.com',
        timezone: 'UTC',
      });
    });

    it('should throw UnauthorizedException when sub is missing', () => {
      expect(() => strategy.validate({ email: 'test@example.com' })).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when email is missing', () => {
      expect(() => strategy.validate({ sub: 'user-1' })).toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when both sub and email are missing', () => {
      expect(() => strategy.validate({})).toThrow(UnauthorizedException);
    });
  });
});
