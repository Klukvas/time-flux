export const SEO = {
  siteName: 'LifeSpan',
  titleTemplate: '%s | LifeSpan',
  defaultTitle: 'LifeSpan — Visualize Your Life Timeline',
  description:
    'Track your life journey with an interactive visual timeline. Log daily moods, organize life chapters, capture memories, and gain insights into your personal history.',
  keywords: [
    'life timeline',
    'personal journal',
    'mood tracker',
    'life chapters',
    'visual diary',
    'life events',
    'memory journal',
    'self reflection',
    'daily mood log',
    'life organizer',
  ] as string[],
  themeColor: '#6366f1',
  locale: 'en_US',
  type: 'website' as const,
  twitterHandle: '@lifespan_app',
} as const;

export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}
