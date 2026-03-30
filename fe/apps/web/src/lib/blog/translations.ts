import type { BlogPost, BlogLanguage } from './types';
import { getBaseUrl } from '@/lib/constants/seo';

const BLOG_LANG_TO_HREFLANG: Record<BlogLanguage, string> = {
  EN: 'en',
  UK: 'uk',
  RU: 'ru',
};

/**
 * Groups of slugs representing the same post in different languages.
 * Update this list when adding new translated blog posts.
 */
const TRANSLATION_GROUPS: readonly string[][] = [
  ['life-tracking-101', 'shcho-take-life-tracking', 'zachem-vesti-dnevnik-zhizni'],
  ['mood-patterns-what-they-reveal', 'yak-vidstezhuvaty-nastrii', 'kak-otslezhivat-nastroenie'],
  ['build-life-chapters', 'rozdily-zhyttya'],
  ['digital-journaling-vs-paper', 'tsyfrovyi-chy-paperovyi-shchodennyk'],
  ['year-in-review-guide', 'richnyj-pidsumok'],
];

export function getTranslatedSlugs(slug: string): string[] {
  const group = TRANSLATION_GROUPS.find((g) => g.includes(slug));
  if (!group) return [];
  return group.filter((s) => s !== slug);
}

export function getPostHreflangAlternates(
  slug: string,
  allPosts: BlogPost[],
): Record<string, string> {
  const baseUrl = getBaseUrl();
  const currentPost = allPosts.find((p) => p.slug === slug);
  if (!currentPost) return {};

  const currentHreflang = BLOG_LANG_TO_HREFLANG[currentPost.frontmatter.language];
  const alternates: Record<string, string> = {
    [currentHreflang]: `${baseUrl}/blog/${slug}`,
    'x-default': `${baseUrl}/blog/${slug}`,
  };

  const siblingsSlugs = getTranslatedSlugs(slug);
  for (const siblingSlug of siblingsSlugs) {
    const sibling = allPosts.find((p) => p.slug === siblingSlug);
    if (sibling) {
      const hreflang = BLOG_LANG_TO_HREFLANG[sibling.frontmatter.language];
      alternates[hreflang] = `${baseUrl}/blog/${sibling.slug}`;
    }
  }

  return alternates;
}
