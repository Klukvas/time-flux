import type { BlogPost } from './types';
import { getTranslatedSlugs } from './translations';

export function getRelatedPosts(
  currentSlug: string,
  allPosts: BlogPost[],
  limit = 3,
): BlogPost[] {
  const current = allPosts.find((p) => p.slug === currentSlug);
  if (!current) return [];

  const translationSlugs = new Set(getTranslatedSlugs(currentSlug));
  const currentTags = new Set(current.frontmatter.tags);

  const scored = allPosts
    .filter(
      (p) =>
        p.slug !== currentSlug && !translationSlugs.has(p.slug),
    )
    .map((post) => {
      const sharedTags = post.frontmatter.tags.filter((t) =>
        currentTags.has(t),
      ).length;
      const sameLanguage =
        post.frontmatter.language === current.frontmatter.language ? 1 : 0;
      return { post, score: sharedTags * 2 + sameLanguage };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (
        new Date(b.post.frontmatter.date).getTime() -
        new Date(a.post.frontmatter.date).getTime()
      );
    });

  return scored.slice(0, limit).map(({ post }) => post);
}
