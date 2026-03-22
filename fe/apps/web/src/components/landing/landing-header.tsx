'use client';

import Link from 'next/link';

interface LandingHeaderProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  onRegister: () => void;
}

export function LandingHeader({
  isAuthenticated,
  onLogin,
  onRegister,
}: LandingHeaderProps) {
  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 flex h-[60px] items-center justify-between px-8"
      style={{
        background: 'rgba(8,12,20,0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 no-underline">
        <svg
          width="32"
          height="32"
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="32" height="32" rx="7" fill="#080C14" />
          <rect
            x="6"
            y="7"
            width="20"
            height="4"
            rx="2"
            fill="#38BDF8"
            fillOpacity="0.25"
            stroke="#38BDF8"
            strokeWidth="0.5"
            strokeOpacity="0.5"
          />
          <rect
            x="6"
            y="13"
            width="15"
            height="4"
            rx="2"
            fill="#2DD4BF"
            fillOpacity="0.25"
            stroke="#2DD4BF"
            strokeWidth="0.5"
            strokeOpacity="0.5"
          />
          <rect
            x="6"
            y="19"
            width="18"
            height="4"
            rx="2"
            fill="#FB923C"
            fillOpacity="0.25"
            stroke="#FB923C"
            strokeWidth="0.5"
            strokeOpacity="0.5"
          />
          <rect
            x="6"
            y="25"
            width="12"
            height="4"
            rx="2"
            fill="#A78BFA"
            fillOpacity="0.25"
            stroke="#A78BFA"
            strokeWidth="0.5"
            strokeOpacity="0.5"
          />
          <line
            x1="20"
            y1="4"
            x2="20"
            y2="30"
            stroke="white"
            strokeWidth="1.2"
            strokeOpacity="0.7"
            strokeLinecap="round"
          />
          <polygon points="17.5,5 22.5,5 20,2" fill="white" fillOpacity="0.7" />
          <circle cx="20" cy="9" r="2" fill="#38BDF8" />
          <circle cx="20" cy="9" r="3.5" fill="#38BDF8" fillOpacity="0.14" />
          <circle cx="20" cy="15" r="2" fill="#2DD4BF" />
          <circle cx="20" cy="21" r="2" fill="#FB923C" />
          <circle cx="20" cy="27" r="2" fill="#A78BFA" />
        </svg>
        <span
          className="text-base font-bold tracking-tight"
          style={{ color: '#EFF2F7', letterSpacing: '-0.03em' }}
        >
          Time<span style={{ color: '#38BDF8' }}>Flux</span>
        </span>
      </Link>

      {/* Center links */}
      <ul
        className="hidden items-center gap-1 md:flex"
        style={{ listStyle: 'none' }}
      >
        {['Features', 'Insights', 'Pricing'].map((label) => (
          <li key={label}>
            <a
              href={`#${label.toLowerCase()}`}
              className="rounded-md px-3 py-1.5 text-sm font-medium no-underline transition-colors text-[#8892A4] hover:text-[#EFF2F7] hover:bg-[#141E30]"
            >
              {label}
            </a>
          </li>
        ))}
        <li>
          <Link
            href="/blog"
            className="rounded-md px-3 py-1.5 text-sm font-medium no-underline transition-colors text-[#8892A4] hover:text-[#EFF2F7] hover:bg-[#141E30]"
          >
            Blog
          </Link>
        </li>
      </ul>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {isAuthenticated ? (
          <Link
            href="/timeline"
            className="inline-flex items-center gap-1.5 rounded-[7px] px-4 py-[7px] text-sm font-semibold no-underline transition-opacity hover:opacity-90"
            style={{ background: '#38BDF8', color: '#080C14' }}
          >
            Go to platform
          </Link>
        ) : (
          <>
            <button
              onClick={onLogin}
              className="inline-flex items-center rounded-[7px] border bg-transparent px-4 py-[7px] text-sm font-medium transition-colors text-[#8892A4] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] hover:text-[#EFF2F7]"
            >
              Sign in
            </button>
            <button
              onClick={onRegister}
              className="inline-flex items-center rounded-[7px] px-4 py-[7px] text-sm font-semibold transition-opacity hover:opacity-90 active:scale-[0.98]"
              style={{ background: '#38BDF8', color: '#080C14' }}
            >
              Get started free&nbsp;&rarr;
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
