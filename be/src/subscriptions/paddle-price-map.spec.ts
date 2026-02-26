import { ConfigService } from '@nestjs/config';
import { buildPriceToTierMap, tierFromPriceId } from './paddle-price-map.js';

describe('paddle-price-map', () => {
  const makeConfig = (env: Record<string, string | undefined>) =>
    ({ get: (key: string) => env[key] }) as unknown as ConfigService;

  describe('buildPriceToTierMap', () => {
    it('should build map from both price IDs', () => {
      const config = makeConfig({
        PADDLE_PRO_PRICE_ID: 'pri_pro_123',
        PADDLE_PREMIUM_PRICE_ID: 'pri_premium_456',
      });

      const map = buildPriceToTierMap(config);

      expect(map.size).toBe(2);
      expect(map.get('pri_pro_123')).toBe('PRO');
      expect(map.get('pri_premium_456')).toBe('PREMIUM');
    });

    it('should build map with only PRO price', () => {
      const config = makeConfig({
        PADDLE_PRO_PRICE_ID: 'pri_pro_123',
      });

      const map = buildPriceToTierMap(config);

      expect(map.size).toBe(1);
      expect(map.get('pri_pro_123')).toBe('PRO');
    });

    it('should return empty map when no env vars set', () => {
      const config = makeConfig({});
      const map = buildPriceToTierMap(config);
      expect(map.size).toBe(0);
    });
  });

  describe('tierFromPriceId', () => {
    const map = new Map([
      ['pri_pro', 'PRO' as const],
      ['pri_premium', 'PREMIUM' as const],
    ]);

    it('should return tier for known price', () => {
      expect(tierFromPriceId(map, 'pri_pro')).toBe('PRO');
      expect(tierFromPriceId(map, 'pri_premium')).toBe('PREMIUM');
    });

    it('should return undefined for unknown price', () => {
      expect(tierFromPriceId(map, 'pri_unknown')).toBeUndefined();
    });
  });
});
