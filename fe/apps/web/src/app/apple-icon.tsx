import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#080C14',
        borderRadius: '36px',
      }}
    >
      {/* Simplified logo mark — layers + cursor */}
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="26"
          y="24"
          width="76"
          height="12"
          rx="6"
          fill="#38BDF8"
          fillOpacity="0.18"
          stroke="#38BDF8"
          strokeWidth="0.9"
          strokeOpacity="0.45"
        />
        <rect
          x="26"
          y="42"
          width="58"
          height="12"
          rx="6"
          fill="#2DD4BF"
          fillOpacity="0.18"
          stroke="#2DD4BF"
          strokeWidth="0.9"
          strokeOpacity="0.45"
        />
        <rect
          x="26"
          y="60"
          width="68"
          height="12"
          rx="6"
          fill="#FB923C"
          fillOpacity="0.18"
          stroke="#FB923C"
          strokeWidth="0.9"
          strokeOpacity="0.45"
        />
        <rect
          x="26"
          y="78"
          width="44"
          height="12"
          rx="6"
          fill="#A78BFA"
          fillOpacity="0.18"
          stroke="#A78BFA"
          strokeWidth="0.9"
          strokeOpacity="0.45"
        />
        <rect
          x="26"
          y="96"
          width="54"
          height="12"
          rx="6"
          fill="#4ADE80"
          fillOpacity="0.18"
          stroke="#4ADE80"
          strokeWidth="0.9"
          strokeOpacity="0.45"
        />
        <line
          x1="76"
          y1="14"
          x2="76"
          y2="114"
          stroke="white"
          strokeWidth="1.8"
          strokeOpacity="0.6"
          strokeLinecap="round"
        />
        <polygon points="72,15 80,15 76,10" fill="white" fillOpacity="0.6" />
        <circle cx="76" cy="30" r="4" fill="#38BDF8" />
        <circle cx="76" cy="30" r="7.5" fill="#38BDF8" fillOpacity="0.12" />
        <circle cx="76" cy="48" r="4" fill="#2DD4BF" />
        <circle cx="76" cy="66" r="4" fill="#FB923C" />
        <circle cx="76" cy="84" r="4" fill="#A78BFA" />
        <circle cx="76" cy="102" r="4" fill="#4ADE80" />
      </svg>
    </div>,
    { ...size },
  );
}
