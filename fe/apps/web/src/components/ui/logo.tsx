'use client';

import Image from 'next/image';
import { useTheme } from '@timeflux/hooks';

interface LogoProps {
  /** 'horizontal' shows mark + wordmark, 'mark' shows icon only. */
  variant?: 'horizontal' | 'mark';
  className?: string;
}

/**
 * Brand logo — theme-aware.
 * - horizontal: 280x60 logo with wordmark (uses inline SVG for theme adaptation)
 * - mark: 120x120 square icon (uses dark/light variant based on theme)
 */
export function Logo({ variant = 'horizontal', className }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  if (variant === 'mark') {
    return (
      <Image
        src={isDark ? '/logo-mark.svg' : '/logo-mark-mono-light.svg'}
        alt="TimeFlux"
        width={32}
        height={32}
        className={className}
        priority
      />
    );
  }

  return (
    <HorizontalLogo isDark={isDark} className={className} />
  );
}

/** Inline SVG horizontal logo — wordmark color adapts to theme. */
function HorizontalLogo({
  isDark,
  className,
}: {
  isDark: boolean;
  className?: string;
}) {
  const textFill = isDark ? '#EFF2F7' : '#0F172A';
  const bgFill = isDark ? '#080C14' : '#F1F5F9';

  return (
    <svg
      width="140"
      height="30"
      viewBox="0 0 280 60"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="TimeFlux"
    >
      {/* Mark */}
      <rect x="0" y="0" width="60" height="60" rx="14" fill={bgFill} />

      <rect x="10" y="9" width="40" height="7" rx="3.5" fill="#38BDF8" fillOpacity="0.18" stroke="#38BDF8" strokeWidth="0.8" strokeOpacity="0.45" />
      <rect x="10" y="20" width="30" height="7" rx="3.5" fill="#2DD4BF" fillOpacity="0.18" stroke="#2DD4BF" strokeWidth="0.8" strokeOpacity="0.45" />
      <rect x="10" y="31" width="36" height="7" rx="3.5" fill="#FB923C" fillOpacity="0.18" stroke="#FB923C" strokeWidth="0.8" strokeOpacity="0.45" />
      <rect x="10" y="42" width="23" height="7" rx="3.5" fill="#A78BFA" fillOpacity="0.18" stroke="#A78BFA" strokeWidth="0.8" strokeOpacity="0.45" />

      <line x1="40" y1="4" x2="40" y2="56" stroke={isDark ? 'white' : '#0F172A'} strokeWidth="1.4" strokeOpacity="0.6" strokeLinecap="round" />
      <polygon points="37,5 43,5 40,1" fill={isDark ? 'white' : '#0F172A'} fillOpacity="0.6" />

      <circle cx="40" cy="12" r="2.5" fill="#38BDF8" />
      <circle cx="40" cy="12" r="5" fill="#38BDF8" fillOpacity="0.12" />
      <circle cx="40" cy="23" r="2.5" fill="#2DD4BF" />
      <circle cx="40" cy="34" r="2.5" fill="#FB923C" />
      <circle cx="40" cy="45" r="2.5" fill="#A78BFA" />

      {/* Wordmark */}
      <text x="76" y="38" fontFamily="'DM Sans', -apple-system, sans-serif" fontSize="26" fontWeight="500" letterSpacing="-1" fill={textFill}>
        Time<tspan fill="#38BDF8">Flux</tspan>
      </text>
    </svg>
  );
}
