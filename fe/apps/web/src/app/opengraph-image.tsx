import { ImageResponse } from 'next/og';
import { SEO } from '@/lib/constants/seo';

export const runtime = 'edge';

export const alt = SEO.defaultTitle;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
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
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '32px',
          }}
        >
          {['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'].map(
            (color) => (
              <div
                key={color}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: color,
                }}
              />
            ),
          )}
        </div>
        <div
          style={{
            fontSize: '72px',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-2px',
            marginBottom: '16px',
          }}
        >
          {SEO.siteName}
        </div>
        <div
          style={{
            fontSize: '28px',
            color: '#94a3b8',
            maxWidth: '600px',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          Visualize Your Life Timeline
        </div>
      </div>
    ),
    { ...size },
  );
}
