import { ImageResponse } from 'next/og';
import { SEO } from '@/lib/constants/seo';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          borderRadius: '36px',
          fontSize: '96px',
          fontWeight: 800,
          color: '#ffffff',
          letterSpacing: '-4px',
        }}
      >
        {SEO.siteName.charAt(0)}
      </div>
    ),
    { ...size },
  );
}
