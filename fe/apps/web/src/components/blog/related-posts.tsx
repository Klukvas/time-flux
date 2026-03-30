import Link from 'next/link';
import { getAllPosts } from '@/lib/blog/get-posts';
import { getRelatedPosts } from '@/lib/blog/get-related-posts';
import { getTranslatedSlugs } from '@/lib/blog/translations';
import { BlogCard } from './blog-card';

interface RelatedPostsProps {
  currentSlug: string;
}

const LANGUAGE_LABELS: Record<string, string> = {
  EN: 'English',
  UK: 'Українською',
  RU: 'Русский',
};

export function RelatedPosts({ currentSlug }: RelatedPostsProps) {
  const allPosts = getAllPosts();
  const related = getRelatedPosts(currentSlug, allPosts, 3);
  const translatedSlugs = getTranslatedSlugs(currentSlug);
  const translations = allPosts.filter((p) => translatedSlugs.includes(p.slug));

  if (related.length === 0 && translations.length === 0) return null;

  return (
    <aside className="mt-16 border-t border-edge pt-10">
      {translations.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-content-tertiary">
            Read in another language
          </h3>
          <div className="flex flex-wrap gap-2">
            {translations.map((t) => (
              <Link
                key={t.slug}
                href={`/blog/${t.slug}`}
                className="rounded-lg border border-edge px-3 py-1.5 text-sm text-content-secondary hover:border-accent/40 hover:text-accent transition-colors"
              >
                {LANGUAGE_LABELS[t.frontmatter.language] ??
                  t.frontmatter.language}{' '}
                – {t.frontmatter.title}
              </Link>
            ))}
          </div>
        </div>
      )}
      {related.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-content">
            Related Posts
          </h3>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
