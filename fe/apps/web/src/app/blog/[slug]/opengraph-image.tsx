import { ImageResponse } from 'next/og';
import { getPostBySlug } from '@/lib/blog/get-posts';

export const alt = 'TimeFlux Blog Post';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BRAND_COLORS = ['#38BDF8', '#2DD4BF', '#FB923C', '#A78BFA', '#4ADE80'];

const LANGUAGE_LABELS: Record<string, string> = {
  EN: 'English',
  UK: 'Українська',
  RU: 'Русский',
};

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export default async function OpenGraphImage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              'linear-gradient(135deg, #080C14 0%, #0f172a 50%, #080C14 100%)',
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              fontSize: '72px',
              fontWeight: 800,
              color: '#EFF2F7',
              display: 'flex',
            }}
          >
            Time<span style={{ color: '#38BDF8' }}>Flux</span>
          </div>
        </div>
      ),
      { ...size },
    );
  }

  const { title, description, language, date } = post.frontmatter;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          background:
            'linear-gradient(135deg, #080C14 0%, #0f172a 50%, #080C14 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top: brand dots + language badge */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', gap: '10px' }}>
            {BRAND_COLORS.map((color) => (
              <div
                key={color}
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: color,
                }}
              />
            ))}
          </div>
          <div
            style={{
              fontSize: '18px',
              color: '#94a3b8',
              backgroundColor: 'rgba(148, 163, 184, 0.1)',
              padding: '6px 16px',
              borderRadius: '8px',
              display: 'flex',
            }}
          >
            {LANGUAGE_LABELS[language] ?? language}
          </div>
        </div>

        {/* Middle: title + description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              fontSize: '48px',
              fontWeight: 800,
              color: '#EFF2F7',
              lineHeight: 1.15,
              letterSpacing: '-1px',
              display: 'flex',
            }}
          >
            {truncate(title, 80)}
          </div>
          <div
            style={{
              fontSize: '22px',
              color: '#94a3b8',
              lineHeight: 1.4,
              display: 'flex',
            }}
          >
            {truncate(description, 120)}
          </div>
        </div>

        {/* Bottom: date + brand */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '18px', color: '#64748b', display: 'flex' }}>
            {new Date(date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            {' · '}
            {post.readingTime}
          </div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#EFF2F7',
              display: 'flex',
            }}
          >
            Time<span style={{ color: '#38BDF8' }}>Flux</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
