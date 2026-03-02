import Link from 'next/link';
import type { BlogPost } from '@/lib/blog/types';
import { LanguageBadge } from './language-badge';

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  const { slug, frontmatter, readingTime } = post;

  return (
    <Link
      href={`/blog/${slug}`}
      className="group block rounded-xl border border-edge bg-surface-card p-6 transition-all hover:border-accent/40 hover:shadow-md"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <LanguageBadge language={frontmatter.language} />
        {frontmatter.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent"
          >
            {tag}
          </span>
        ))}
      </div>

      <h2 className="mb-2 text-lg font-semibold text-content group-hover:text-accent transition-colors">
        {frontmatter.title}
      </h2>

      <p className="mb-4 text-sm leading-relaxed text-content-secondary line-clamp-3">
        {frontmatter.description}
      </p>

      <div className="flex items-center gap-3 text-xs text-content-tertiary">
        <time dateTime={frontmatter.date}>
          {new Date(frontmatter.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </time>
        <span>·</span>
        <span>{readingTime}</span>
      </div>
    </Link>
  );
}
