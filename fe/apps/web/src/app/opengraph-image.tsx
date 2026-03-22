import { ImageResponse } from 'next/og';
import { SEO } from '@/lib/constants/seo';

export const runtime = 'edge';

export const alt = SEO.defaultTitle;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Brand colors from the TimeFlux logo mark. */
const BRAND_COLORS = ['#38BDF8', '#2DD4BF', '#FB923C', '#A78BFA', '#4ADE80'];

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
          background:
            'linear-gradient(135deg, #080C14 0%, #0f172a 50%, #080C14 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Logo mark dots */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '32px',
          }}
        >
          {BRAND_COLORS.map((color) => (
            <div
              key={color}
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: color,
              }}
            />
          ))}
        </div>
        <div
          style={{
            fontSize: '72px',
            fontWeight: 800,
            color: '#EFF2F7',
            letterSpacing: '-2px',
            marginBottom: '16px',
            display: 'flex',
          }}
        >
          Time
          <span style={{ color: '#38BDF8' }}>Flux</span>
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
