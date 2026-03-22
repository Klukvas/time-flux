'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

/* ═══ Shared styles ═══ */
const mono = { fontFamily: "'DM Mono', monospace" } as const;
const C = {
  bg: '#080C14',
  surface: '#0D1421',
  raised: '#141E30',
  accent: '#38BDF8',
  teal: '#2DD4BF',
  rose: '#FB7185',
  violet: '#A78BFA',
  amber: '#FB923C',
  lime: '#A3E635',
  text1: '#EFF2F7',
  text2: '#8892A4',
  text3: '#3E4A5C',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.12)',
} as const;

function Overline({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="block text-[11px] uppercase"
      style={{ ...mono, color: C.accent, letterSpacing: '0.12em' }}
    >
      {children}
    </span>
  );
}

function SectionHeader({
  overline,
  title,
  sub,
}: {
  overline: string;
  title: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="mb-14 text-center">
      <Overline>{overline}</Overline>
      <h2
        className="mt-3 mb-2.5"
        style={{
          fontSize: 'clamp(28px, 3.5vw, 44px)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: C.text1,
        }}
      >
        {title}
      </h2>
      {sub && (
        <p
          className="mx-auto"
          style={{ fontSize: 15, color: C.text2, maxWidth: 480 }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

/* ═══ STATS ═══ */
export function StatsSection() {
  return (
    <section className="mx-auto max-w-[1100px] px-8 py-24">
      <p
        className="mb-4 text-center text-[11px] uppercase"
        style={{ ...mono, color: C.accent, letterSpacing: '0.12em' }}
      >
        Trusted by people who care about their story
      </p>
      <h2
        className="mb-3 text-center"
        style={{
          fontSize: 'clamp(28px, 3.5vw, 44px)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: C.text1,
        }}
      >
        A life lived, documented.
      </h2>
      <p className="mb-14 text-center" style={{ fontSize: 16, color: C.text2 }}>
        Every day, thousands of people trust TimeFlux to capture what matters.
      </p>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 overflow-hidden rounded-[14px] border"
        style={{ gap: 2, borderColor: C.border, background: C.border }}
      >
        {[
          { num: '2.4', suffix: 'M+', label: 'Days tracked worldwide' },
          { num: '340', suffix: 'K+', label: 'Chapters created' },
          { num: '18', suffix: 'M+', label: 'Memories surfaced' },
        ].map((s) => (
          <div
            key={s.label}
            className="p-10 text-center transition-colors hover:bg-[#141E30]"
            style={{ background: C.surface }}
          >
            <span
              className="mb-2 block text-[52px] font-extrabold leading-none"
              style={{
                letterSpacing: '-0.04em',
                color: C.text1,
                fontSize: 'clamp(36px, 4vw, 52px)',
              }}
            >
              <span style={{ color: C.accent }}>{s.num}</span>
              {s.suffix}
            </span>
            <span
              className="text-[13px] font-medium"
              style={{ color: C.text2 }}
            >
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══ FEATURES ═══ */
const FEATURES = [
  {
    icon: '\u23F1',
    title: 'Timeline View',
    desc: 'See your entire life rendered as horizontal week rows \u2014 a persistent map of every day since you started.',
    corner: 'timeline \u2192',
  },
  {
    icon: '\uD83D\uDCD6',
    title: 'Chapters & Periods',
    desc: '"Working at X", "Trip to Italy", "Healing year" \u2014 organize life into named chapters with date-range periods.',
    corner: 'chapters \u2192',
  },
  {
    icon: '\uD83C\uDFAD',
    title: 'Daily Mood Tracking',
    desc: 'Pick from 5 built-in moods or create your own with custom colors, names, and intensity scores from 0\u201310.',
    corner: 'moods \u2192',
  },
  {
    icon: '\uD83D\uDCF7',
    title: 'Media Memories',
    desc: 'Attach photos and videos to any day. Direct browser-to-S3 uploads. Full-screen carousel with keyboard nav.',
    corner: 'media \u2192',
  },
  {
    icon: '\uD83D\uDD01',
    title: 'On This Day',
    desc: 'Resurface memories from 1 month, 6 months, and 1 year ago. Your past self greets you every morning.',
    corner: 'memories \u2192',
  },
  {
    icon: '\uD83D\uDCCD',
    title: 'Day Location',
    desc: 'Pin where you were on any day with an interactive Google Maps picker. Places Autocomplete included.',
    corner: 'location \u2192',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-[1100px] px-8 py-24">
      <SectionHeader
        overline="Everything you need"
        title="Built for the whole arc of your life."
        sub="From your Tuesday mood to your 5-year career \u2014 TimeFlux captures every layer."
      />
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 overflow-hidden rounded-[14px] border"
        style={{ gap: 1, borderColor: C.border, background: C.border }}
      >
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="relative overflow-hidden p-8 transition-colors hover:bg-[#141E30]"
            style={{ background: C.surface }}
          >
            <div
              className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] border text-lg"
              style={{ borderColor: C.border, background: C.raised }}
            >
              {f.icon}
            </div>
            <h3
              className="mb-2 text-base font-bold"
              style={{ letterSpacing: '-0.02em', color: C.text1 }}
            >
              {f.title}
            </h3>
            <p
              className="text-[13px] leading-relaxed"
              style={{ color: C.text2 }}
            >
              {f.desc}
            </p>
            <div
              className="absolute bottom-4 right-4 text-[10px]"
              style={{ ...mono, color: C.text3 }}
            >
              {f.corner}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══ CHAPTERS VIBE ═══ */
const CHAPTERS = [
  {
    emoji: '\uD83D\uDCBC',
    label: 'Work',
    labelColor: C.accent,
    borderColor: 'rgba(56,189,248,0.15)',
    title: 'Career Arcs',
    desc: 'Track every job, project, and professional chapter with mood data and media galleries.',
    periods: [
      { text: 'Startup A \u00B7 2y 3mo', color: C.accent },
      { text: 'Freelance \u00B7 Active', color: 'rgba(56,189,248,0.4)' },
    ],
  },
  {
    emoji: '\u2708\uFE0F',
    label: 'Travel',
    labelColor: C.teal,
    borderColor: 'rgba(45,212,191,0.15)',
    title: 'Adventures',
    desc: 'Every trip as a named period. Geo-tagged days, photo galleries, and the moods that came with it.',
    periods: [
      { text: "Prague \u00B7 Mar 7\u20139 '26", color: C.teal },
      { text: "Japan \u00B7 Apr '25", color: 'rgba(45,212,191,0.4)' },
    ],
  },
  {
    emoji: '\uD83D\uDC9A',
    label: 'Health',
    labelColor: C.rose,
    borderColor: 'rgba(251,113,133,0.15)',
    title: 'Wellness Phases',
    desc: 'Log training programs, recovery periods, mental health journeys \u2014 and see the mood impact clearly.',
    periods: [
      { text: 'Running \u00B7 Active', color: C.rose },
      {
        text: "Therapy \u00B7 Jan\u2013Jun '25",
        color: 'rgba(251,113,133,0.4)',
      },
    ],
  },
  {
    emoji: '\uD83C\uDF93',
    label: 'Education',
    labelColor: C.violet,
    borderColor: 'rgba(167,139,250,0.15)',
    title: 'Learning Eras',
    desc: 'From degrees to side projects \u2014 document what you learned, when you learned it, and how it felt.',
    periods: [
      { text: 'Rust Course \u00B7 Active', color: C.violet },
      { text: 'MSc \u00B7 2020\u20132022', color: 'rgba(167,139,250,0.4)' },
    ],
  },
];

export function ChaptersSection() {
  return (
    <section className="mx-auto max-w-[1100px] px-8 py-24">
      <SectionHeader
        overline="Chapters \u2014 your life in context"
        title="Every era of your life, named."
        sub="Group your days into chapters that mean something. Work, travel, love, growth \u2014 they all belong here."
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CHAPTERS.map((ch) => (
          <div
            key={ch.title}
            className="cursor-default rounded-[14px] border p-7 transition-all hover:-translate-y-1"
            style={{ background: C.surface, borderColor: ch.borderColor }}
          >
            <span className="mb-3.5 block text-[28px]">{ch.emoji}</span>
            <div
              className="mb-1.5 text-[10px] uppercase"
              style={{ ...mono, color: ch.labelColor, letterSpacing: '0.1em' }}
            >
              {ch.label}
            </div>
            <h3
              className="mb-2 text-lg font-bold"
              style={{ letterSpacing: '-0.02em', color: C.text1 }}
            >
              {ch.title}
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: C.text2 }}>
              {ch.desc}
            </p>
            <div className="mt-3.5 flex flex-col gap-1">
              {ch.periods.map((p) => (
                <div
                  key={p.text}
                  className="flex items-center gap-1.5 text-[10px]"
                  style={{ ...mono, color: C.text3 }}
                >
                  <div
                    className="h-1 w-1 shrink-0 rounded-full"
                    style={{ background: p.color }}
                  />
                  {p.text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══ MEMORIES ═══ */
export function MemoriesSection({ onStart }: { onStart?: () => void }) {
  const CARDS = [
    {
      interval: '1 year ago \u00B7 Mar 22, 2025',
      intervalColor: C.accent,
      date: 'Sunday in Kyiv',
      moodColor: '#4ADE80',
      mood: 'Great \u00B7 score 9/10',
      media: '\uD83D\uDCF7 4 photos attached',
      top: 0,
      left: 20,
      zIndex: 3,
      opacity: 1,
      rotate: 0,
    },
    {
      interval: '6 months ago \u00B7 Sep 22, 2025',
      intervalColor: C.teal,
      date: 'First day in Prague',
      moodColor: '#38BDF8',
      mood: 'Good \u00B7 score 7/10',
      media: '\uD83D\uDCF7 12 photos attached',
      top: 100,
      left: 60,
      zIndex: 2,
      opacity: 0.85,
      rotate: 2,
    },
    {
      interval: '1 month ago \u00B7 Feb 22, 2026',
      intervalColor: C.amber,
      date: 'Late February day',
      moodColor: '#FACC15',
      mood: 'Okay \u00B7 score 5/10',
      media: 'no media',
      top: 200,
      left: 10,
      zIndex: 1,
      opacity: 0.65,
      rotate: -1.5,
    },
  ];

  return (
    <section
      className="overflow-hidden border-y px-8 py-24"
      style={{ background: C.surface, borderColor: C.border }}
    >
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 lg:grid-cols-2 items-center gap-12 lg:gap-20">
        <div>
          <Overline>On This Day</Overline>
          <h2
            className="mt-4 mb-4"
            style={{
              fontSize: 'clamp(28px, 3.5vw, 44px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              color: C.text1,
            }}
          >
            Your past self
            <br />
            checks in every day.
          </h2>
          <p
            className="mb-6"
            style={{ fontSize: 15, color: C.text2, lineHeight: 1.7 }}
          >
            TimeFlux resurfaces memories from exactly 1 month, 6 months, and 1
            year ago &mdash; automatically. No searching. No scrolling. Just a
            quiet reminder of who you were.
          </p>
          <button
            onClick={onStart}
            className="inline-flex items-center rounded-[7px] px-4 py-[7px] text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: C.accent, color: C.bg }}
          >
            Try it now&nbsp;&rarr;
          </button>
        </div>
        {/* Mobile: show cards in a simple vertical stack */}
        <div className="flex flex-col gap-4 lg:hidden">
          {CARDS.map((c) => (
            <div
              key={c.interval}
              className="w-full rounded-xl border p-5"
              style={{
                background: C.raised,
                borderColor: C.border,
              }}
            >
              <div
                className="mb-2 text-[10px] uppercase"
                style={{
                  ...mono,
                  color: c.intervalColor,
                  letterSpacing: '0.08em',
                }}
              >
                {c.interval}
              </div>
              <div
                className="mb-1.5 text-[13px] font-semibold"
                style={{ color: C.text1 }}
              >
                {c.date}
              </div>
              <div
                className="flex items-center gap-1.5 text-xs"
                style={{ color: C.text2 }}
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ background: c.moodColor }}
                />
                {c.mood}
              </div>
              <div
                className="mt-2 text-[11px]"
                style={{ ...mono, color: C.text3 }}
              >
                {c.media}
              </div>
            </div>
          ))}
        </div>
        {/* Desktop: fanned absolute-positioned stack */}
        <div className="relative hidden lg:block" style={{ height: 360 }}>
          {CARDS.map((c) => (
            <div
              key={c.interval}
              className="absolute w-[280px] rounded-xl border p-5"
              style={{
                background: C.raised,
                borderColor: C.border,
                top: c.top,
                left: c.left,
                zIndex: c.zIndex,
                opacity: c.opacity,
                transform: `rotate(${c.rotate}deg)`,
              }}
            >
              <div
                className="mb-2 text-[10px] uppercase"
                style={{
                  ...mono,
                  color: c.intervalColor,
                  letterSpacing: '0.08em',
                }}
              >
                {c.interval}
              </div>
              <div
                className="mb-1.5 text-[13px] font-semibold"
                style={{ color: C.text1 }}
              >
                {c.date}
              </div>
              <div
                className="flex items-center gap-1.5 text-xs"
                style={{ color: C.text2 }}
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ background: c.moodColor }}
                />
                {c.mood}
              </div>
              <div
                className="mt-2 text-[11px]"
                style={{ ...mono, color: C.text3 }}
              >
                {c.media}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ INSIGHTS ═══ */
const BAR_DATA = [
  { h: 70, color: '#4ADE80' },
  { h: 60, color: '#38BDF8' },
  { h: 75, color: '#4ADE80' },
  { h: 50, color: '#FACC15' },
  { h: 35, color: '#FB923C' },
  { h: 55, color: '#FACC15' },
  { h: 80, color: '#4ADE80' },
  { h: 90, color: '#4ADE80' },
  { h: 65, color: '#38BDF8' },
  { h: 70, color: '#38BDF8' },
  { h: 85, color: '#4ADE80' },
  { h: 75, color: '#4ADE80' },
  { h: 78, color: '#4ADE80' },
  { h: 88, color: '#4ADE80' },
];

const INSIGHT_BULLETS = [
  {
    title: 'Weekday Behavioral Analytics',
    desc: 'discover your best and worst days with statistical confidence',
  },
  {
    title: 'Burnout Pattern Detection',
    desc: 'spot Monday lows and Friday highs before they become a trend',
  },
  {
    title: 'Recovery Index',
    desc: 'see which weekday you bounce back fastest after a rough patch',
  },
  {
    title: 'Category Mood Correlation',
    desc: 'learn which life chapters energize you and which drain you',
  },
  {
    title: '30-Day Trend Line',
    desc: 'track emotional momentum over time with a clean 0\u201310 chart',
  },
];

export function InsightsSection() {
  const barsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!barsRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          barsRef.current?.classList.add('bars-visible');
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(barsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="insights" className="mx-auto max-w-[1100px] px-8 py-24">
      <SectionHeader
        overline="Emotional Analytics"
        title={
          <>
            Patterns your journal
            <br />
            never could show you.
          </>
        }
        sub="See your emotional history as data \u2014 not just feelings."
      />
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 items-center gap-12 lg:gap-[60px]">
        {/* Chart side */}
        <div>
          <div
            className="rounded-[14px] border p-6"
            style={{ background: C.surface, borderColor: C.border }}
          >
            <div className="mb-5 flex items-center justify-between">
              <span
                className="text-[13px] font-semibold"
                style={{ color: C.text1 }}
              >
                30-Day Mood Trend
              </span>
              <span
                className="rounded px-2 py-0.5 text-[10px] border"
                style={{
                  ...mono,
                  color: C.teal,
                  background: 'rgba(45,212,191,0.10)',
                  borderColor: 'rgba(45,212,191,0.2)',
                }}
              >
                &uarr; +1.2 vs last month
              </span>
            </div>
            <div
              ref={barsRef}
              className="mb-3 flex items-end gap-1.5"
              style={{ height: 120 }}
            >
              {BAR_DATA.map((b, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${b.h}%`,
                    background: `linear-gradient(180deg, ${b.color}, ${b.color}4D)`,
                    transformOrigin: 'bottom',
                    transform: 'scaleY(0)',
                    animation: 'none',
                    opacity: 0.8,
                  }}
                  ref={(el) => {
                    if (!el) return;
                    const parent = el.closest('.bars-visible');
                    if (parent) {
                      el.style.animation = `landing-bar-grow 0.8s cubic-bezier(0.34,1.56,0.64,1) ${0.05 * (i + 1)}s both`;
                    } else {
                      const obs = new MutationObserver(() => {
                        const p = el.closest('.bars-visible');
                        if (p) {
                          el.style.animation = `landing-bar-grow 0.8s cubic-bezier(0.34,1.56,0.64,1) ${0.05 * (i + 1)}s both`;
                          obs.disconnect();
                        }
                      });
                      if (el.parentElement?.parentElement)
                        obs.observe(el.parentElement.parentElement, {
                          attributes: true,
                          attributeFilter: ['class'],
                        });
                    }
                  }}
                />
              ))}
            </div>
            <div
              className="flex justify-between text-[10px]"
              style={{ ...mono, color: C.text3 }}
            >
              <span>Mar 1</span>
              <span>Mar 8</span>
              <span>Mar 15</span>
              <span>Mar 22</span>
            </div>
          </div>
          {/* Mini stats */}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {[
              { label: 'Avg Mood', value: '7.4', extra: '/ 10', color: C.teal },
              { label: 'Best Weekday', value: 'Saturday', color: C.accent },
              { label: 'Top Category', value: 'Travel', color: C.violet },
              { label: 'Tracked Days', value: '241', color: C.text1 },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg border p-3.5"
                style={{ background: C.raised, borderColor: C.border }}
              >
                <div
                  className="mb-1 text-[10px] uppercase"
                  style={{ ...mono, color: C.text3, letterSpacing: '0.08em' }}
                >
                  {s.label}
                </div>
                <div
                  className="text-xl font-bold"
                  style={{ letterSpacing: '-0.02em', color: s.color }}
                >
                  {s.value}
                  {s.extra && (
                    <span
                      className="ml-1 text-xs font-normal"
                      style={{ color: C.text3 }}
                    >
                      {s.extra}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Text side */}
        <div>
          <Overline>PRO + PREMIUM</Overline>
          <h2
            className="mt-4 mb-4"
            style={{
              fontSize: 'clamp(26px, 3vw, 38px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.2,
              color: C.text1,
            }}
          >
            Know yourself
            <br />
            like never before.
          </h2>
          <p
            className="mb-7"
            style={{ fontSize: 15, color: C.text2, lineHeight: 1.7 }}
          >
            Unlock emotional analytics that reveal behavioral patterns across
            weekdays, categories, and time &mdash; powered by your actual data.
          </p>
          <div className="flex flex-col gap-3">
            {INSIGHT_BULLETS.map((b) => (
              <div
                key={b.title}
                className="flex items-start gap-2.5 text-sm"
                style={{ color: C.text2 }}
              >
                <div
                  className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border text-[10px]"
                  style={{
                    background: 'rgba(45,212,191,0.10)',
                    borderColor: 'rgba(45,212,191,0.2)',
                    color: C.teal,
                  }}
                >
                  &#10003;
                </div>
                <span>
                  <strong style={{ color: C.text1 }}>{b.title}</strong> &mdash;{' '}
                  {b.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══ PRICING ═══ */
const PLANS = [
  {
    tier: 'Free',
    price: '0',
    period: 'forever',
    featured: false,
    features: [
      { text: '50 media uploads', ok: true, bold: false },
      { text: '5 chapters', ok: true, bold: false },
      { text: '5 categories & 5 moods', ok: true, bold: false },
      { text: 'Full timeline view', ok: true, bold: false },
      { text: 'Basic analytics', ok: true, bold: false },
      { text: 'On This Day memories', ok: false, bold: false },
      { text: 'Full emotional analytics', ok: false, bold: false },
    ],
    cta: 'Get started',
    ctaStyle: 'ghost' as const,
  },
  {
    tier: 'Pro',
    price: '6',
    period: 'per month',
    featured: true,
    features: [
      { text: '500 media uploads', ok: true, bold: false },
      { text: '30 chapters', ok: true, bold: false },
      { text: '20 categories & 20 moods', ok: true, bold: false },
      { text: 'Full timeline view', ok: true, bold: false },
      { text: 'Full emotional analytics', ok: true, bold: true },
      { text: 'Weekday patterns', ok: true, bold: true },
      { text: 'On This Day memories', ok: false, bold: false },
    ],
    cta: 'Start Pro \u2192',
    ctaStyle: 'primary' as const,
  },
  {
    tier: 'Premium',
    price: '12',
    period: 'per month',
    featured: false,
    features: [
      { text: 'Unlimited media', ok: true, bold: false },
      { text: 'Unlimited chapters', ok: true, bold: false },
      { text: 'Unlimited categories & moods', ok: true, bold: false },
      { text: 'Full timeline view', ok: true, bold: false },
      { text: 'Full emotional analytics', ok: true, bold: false },
      { text: 'On This Day memories', ok: true, bold: true },
      { text: 'Priority support', ok: true, bold: false },
    ],
    cta: 'Go Premium',
    ctaStyle: 'ghost' as const,
  },
];

export function PricingSection({ onStart }: { onStart: () => void }) {
  return (
    <section
      id="pricing"
      className="border-y px-8 py-24"
      style={{ background: C.surface, borderColor: C.border }}
    >
      <div className="mx-auto max-w-[960px]">
        <SectionHeader
          overline="Pricing"
          title="Start free. Go deeper when ready."
          sub="No credit card required. Upgrade or cancel anytime."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PLANS.map((p) => (
            <div
              key={p.tier}
              className="relative rounded-[14px] border p-8 transition-all"
              style={{
                background: C.bg,
                borderColor: p.featured ? 'rgba(56,189,248,0.3)' : C.border,
                boxShadow: p.featured
                  ? '0 0 0 1px rgba(56,189,248,0.08)'
                  : 'none',
              }}
            >
              {p.featured && (
                <div
                  className="absolute -top-px right-6 rounded-b-md px-2.5 py-[3px] text-[10px] font-bold uppercase"
                  style={{
                    ...mono,
                    background: C.accent,
                    color: C.bg,
                    letterSpacing: '0.08em',
                  }}
                >
                  Most popular
                </div>
              )}
              <div
                className="mb-4 text-xs uppercase"
                style={{ ...mono, color: C.text3, letterSpacing: '0.1em' }}
              >
                {p.tier}
              </div>
              <div className="mb-1.5">
                <span
                  className="align-top text-lg font-semibold"
                  style={{ color: C.text2 }}
                >
                  $
                </span>
                <span
                  className="text-[40px] font-extrabold"
                  style={{ letterSpacing: '-0.04em', color: C.text1 }}
                >
                  {p.price}
                </span>
              </div>
              <div className="mb-6 text-[13px]" style={{ color: C.text3 }}>
                {p.period}
              </div>
              <hr
                className="my-5 border-0 border-t"
                style={{ borderColor: C.border }}
              />
              <ul
                className="mb-7 flex flex-col gap-2.5"
                style={{ listStyle: 'none' }}
              >
                {p.features.map((f) => (
                  <li
                    key={f.text}
                    className="flex items-center gap-2 text-[13px]"
                    style={{ color: C.text2 }}
                  >
                    <span
                      style={{ color: f.ok ? C.teal : C.text3, fontSize: 12 }}
                    >
                      {f.ok ? '\u2713' : '\u2014'}
                    </span>
                    {f.bold ? (
                      <strong style={{ color: C.text1 }}>{f.text}</strong>
                    ) : (
                      f.text
                    )}
                  </li>
                ))}
              </ul>
              <button
                onClick={onStart}
                className="w-full rounded-[7px] px-4 py-[11px] text-center text-[15px] font-semibold transition-opacity hover:opacity-90"
                style={
                  p.ctaStyle === 'primary'
                    ? { background: C.accent, color: C.bg, border: 'none' }
                    : {
                        background: 'transparent',
                        color: C.text2,
                        border: `1px solid ${C.border}`,
                      }
                }
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ FINAL CTA ═══ */
export function FinalCTA({
  isAuthenticated,
  onStart,
}: {
  isAuthenticated: boolean;
  onStart: () => void;
}) {
  return (
    <section className="landing-grid-bg relative overflow-hidden px-8 py-[120px] text-center">
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: 600,
          height: 300,
          background:
            'radial-gradient(ellipse 60% 60% at 50% 100%, rgba(56,189,248,0.06) 0%, transparent 70%)',
        }}
      />
      <Overline>Ready to begin?</Overline>
      <h2
        className="mx-auto mt-4 mb-5"
        style={{
          fontSize: 'clamp(32px, 5vw, 60px)',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1.1,
          maxWidth: 700,
          color: C.text1,
        }}
      >
        Every day you don&rsquo;t
        <br />
        track is a day forgotten.
      </h2>
      <p
        className="mx-auto mb-10"
        style={{ fontSize: 16, color: C.text2, maxWidth: 440 }}
      >
        Start with today. Your timeline is waiting.
      </p>
      <div className="flex items-center justify-center gap-3">
        {isAuthenticated ? (
          <Link
            href="/timeline"
            className="inline-flex items-center rounded-lg px-6 py-[11px] text-[15px] font-semibold no-underline transition-opacity hover:opacity-90"
            style={{ background: C.accent, color: C.bg }}
          >
            Go to platform&nbsp;&rarr;
          </Link>
        ) : (
          <>
            <button
              onClick={onStart}
              className="inline-flex items-center rounded-lg px-6 py-[11px] text-[15px] font-semibold transition-opacity hover:opacity-90"
              style={{ background: C.accent, color: C.bg }}
            >
              Start tracking for free&nbsp;&rarr;
            </button>
            <a
              href="#features"
              className="inline-flex items-center rounded-lg border px-6 py-[11px] text-[15px] font-medium no-underline"
              style={{
                background: 'transparent',
                color: C.text2,
                borderColor: C.border,
              }}
            >
              See how it works
            </a>
          </>
        )}
      </div>
    </section>
  );
}

/* ═══ FOOTER ═══ */
export function LandingFooter() {
  return (
    <footer
      className="flex items-center justify-between border-t px-8 py-10"
      style={{ borderColor: C.border }}
    >
      <Link href="/" className="flex items-center gap-2.5 no-underline">
        <svg
          width="22"
          height="22"
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
          className="text-sm font-bold"
          style={{ letterSpacing: '-0.03em', color: C.text2 }}
        >
          Time<span style={{ color: C.accent }}>Flux</span>
        </span>
      </Link>
      <span className="text-xs" style={{ ...mono, color: C.text3 }}>
        &copy; {new Date().getFullYear()} TimeFlux. All rights reserved.
      </span>
      <ul className="flex gap-5" style={{ listStyle: 'none' }}>
        {[
          { label: 'Privacy', href: '/privacy' },
          { label: 'Terms', href: '/terms' },
          { label: 'Refund Policy', href: '/refund' },
          { label: 'Blog', href: '/blog' },
        ].map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-xs no-underline transition-colors text-[#3E4A5C] hover:text-[#8892A4]"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </footer>
  );
}
