import type { ConfigService } from '@nestjs/config';

type PaidTier = 'PRO' | 'PREMIUM';

export function buildPriceToTierMap(
  config: ConfigService,
): ReadonlyMap<string, PaidTier> {
  const entries: [string, PaidTier][] = [];

  const proId = config.get<string>('PADDLE_PRO_PRICE_ID');
  if (proId) entries.push([proId, 'PRO']);

  const premiumId = config.get<string>('PADDLE_PREMIUM_PRICE_ID');
  if (premiumId) entries.push([premiumId, 'PREMIUM']);

  return new Map(entries);
}

export function tierFromPriceId(
  map: ReadonlyMap<string, PaidTier>,
  priceId: string,
): PaidTier | undefined {
  return map.get(priceId);
}

export function buildTierToPriceMap(
  config: ConfigService,
): ReadonlyMap<PaidTier, string> {
  const entries: [PaidTier, string][] = [];

  const proId = config.get<string>('PADDLE_PRO_PRICE_ID');
  if (proId) entries.push(['PRO', proId]);

  const premiumId = config.get<string>('PADDLE_PREMIUM_PRICE_ID');
  if (premiumId) entries.push(['PREMIUM', premiumId]);

  return new Map(entries);
}
