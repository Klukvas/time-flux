'use client';

interface HeroSectionProps {
  isAuthenticated: boolean;
  onStart: () => void;
}

export function HeroSection({ isAuthenticated, onStart }: HeroSectionProps) {
  return (
    <section className="landing-grid-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-8 pb-20 pt-[120px] text-center">
      {/* Top glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
        style={{
          width: 800,
          height: 400,
          background:
            'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(56,189,248,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Badge */}
      <div
        className="landing-animate-1 mb-7 inline-flex items-center gap-1.5 rounded-full border px-3 py-1"
        style={{
          borderColor: 'rgba(56,189,248,0.2)',
          background: 'rgba(56,189,248,0.06)',
          fontFamily: "'DM Mono', monospace",
          fontSize: 12,
          color: '#38BDF8',
          letterSpacing: '0.01em',
        }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{
            background: '#38BDF8',
            animation: 'landing-pulse-dot 2s infinite',
          }}
        />
        Now with AI-powered Weekday Analytics
      </div>

      {/* Headline */}
      <h1
        className="landing-animate-2 mb-5"
        style={{
          fontSize: 'clamp(42px, 6vw, 80px)',
          fontWeight: 800,
          letterSpacing: '-0.04em',
          lineHeight: 1.05,
          maxWidth: 800,
          color: '#EFF2F7',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Your life deserves
        <br />a <em style={{ fontStyle: 'normal', color: '#38BDF8' }}>
          real
        </em>{' '}
        timeline.
      </h1>

      {/* Subtext */}
      <p
        className="landing-animate-3 mb-9"
        style={{
          fontSize: 'clamp(16px, 2vw, 19px)',
          color: '#8892A4',
          maxWidth: 520,
          lineHeight: 1.6,
          fontWeight: 400,
        }}
      >
        Track moods, document chapters, revisit memories. TimeFlux turns your
        daily moments into a living map of who you&rsquo;ve been — and who
        you&rsquo;re becoming.
      </p>

      {/* CTAs */}
      <div className="landing-animate-4 mb-16 flex items-center gap-3">
        {isAuthenticated ? (
          <a
            href="/timeline"
            className="inline-flex items-center rounded-lg px-6 py-[11px] text-[15px] font-semibold no-underline transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ background: '#38BDF8', color: '#080C14' }}
          >
            Go to platform&nbsp;&rarr;
          </a>
        ) : (
          <>
            <button
              onClick={onStart}
              className="inline-flex items-center rounded-lg px-6 py-[11px] text-[15px] font-semibold transition-opacity hover:opacity-90 active:scale-[0.98]"
              style={{ background: '#38BDF8', color: '#080C14' }}
            >
              Start tracking for free&nbsp;&rarr;
            </button>
            <a
              href="#features"
              className="inline-flex items-center rounded-lg border px-6 py-[11px] text-[15px] font-medium no-underline transition-colors"
              style={{
                background: 'transparent',
                color: '#8892A4',
                borderColor: 'rgba(255,255,255,0.06)',
              }}
            >
              See how it works
            </a>
          </>
        )}
      </div>

      {/* Timeline Preview */}
      <TimelinePreview />
    </section>
  );
}

/* ── Mock Timeline ── */

const MOOD_STYLES = {
  great: { bg: 'rgba(74,222,128,0.18)', color: '#4ADE80' },
  good: { bg: 'rgba(56,189,248,0.18)', color: '#38BDF8' },
  okay: { bg: 'rgba(250,204,21,0.18)', color: '#FACC15' },
  bad: { bg: 'rgba(251,146,60,0.18)', color: '#FB923C' },
} as const;

const PERIOD_COLORS = {
  work: '#38BDF8',
  travel: '#2DD4BF',
  health: '#FB7185',
} as const;

type MoodKey = keyof typeof MOOD_STYLES;
type PeriodKey = keyof typeof PERIOD_COLORS;

interface DayCellProps {
  num: number;
  mood?: MoodKey;
  period?: PeriodKey;
  isToday?: boolean;
}

function DayCell({ num, mood, period, isToday }: DayCellProps) {
  const m = mood ? MOOD_STYLES[mood] : null;
  return (
    <div
      className="relative flex aspect-square cursor-pointer items-center justify-center rounded-lg text-[11px] font-medium"
      style={{
        background: '#141E30',
        color: isToday ? '#38BDF8' : m ? '#EFF2F7' : '#3E4A5C',
        border: isToday ? '1px solid #38BDF8' : 'none',
        boxShadow: isToday ? '0 0 0 2px rgba(56,189,248,0.1)' : 'none',
        fontWeight: isToday ? 700 : 500,
      }}
    >
      <div
        className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-[11px] font-semibold"
        style={m ? { background: m.bg, color: m.color } : undefined}
      >
        {num}
      </div>
      {period && (
        <div
          className="absolute bottom-1 left-1 right-1 h-[3px] rounded-sm"
          style={{ background: PERIOD_COLORS[period] }}
        />
      )}
    </div>
  );
}

const WEEKS: DayCellProps[][] = [
  [
    { num: 2, mood: 'great', period: 'work' },
    { num: 3, mood: 'great', period: 'work' },
    { num: 4, mood: 'good', period: 'work' },
    { num: 5, mood: 'good', period: 'work' },
    { num: 6, mood: 'great', period: 'work' },
    { num: 7, mood: 'great', period: 'travel' },
    { num: 8, mood: 'great', period: 'travel' },
  ],
  [
    { num: 9, mood: 'okay', period: 'work' },
    { num: 10, mood: 'good', period: 'work' },
    { num: 11, mood: 'okay', period: 'work' },
    { num: 12, mood: 'bad', period: 'work' },
    { num: 13, mood: 'okay', period: 'work' },
    { num: 14, mood: 'good', period: 'health' },
    { num: 15, mood: 'great', period: 'health' },
  ],
  [
    { num: 16, mood: 'great', period: 'work' },
    { num: 17, mood: 'great', period: 'work' },
    { num: 18, mood: 'good', period: 'work' },
    { num: 19, mood: 'great', period: 'work' },
    { num: 20, mood: 'good', period: 'work' },
    { num: 21, mood: 'great', period: 'travel' },
    { num: 22, isToday: true },
  ],
];

const CHIPS = [
  {
    label: 'Startup \u00B7 Active',
    color: '#38BDF8',
    bg: 'rgba(56,189,248,0.12)',
    border: 'rgba(56,189,248,0.25)',
  },
  {
    label: 'Prague Trip \u00B7 Mar 7\u20139',
    color: '#2DD4BF',
    bg: 'rgba(45,212,191,0.10)',
    border: 'rgba(45,212,191,0.25)',
  },
  {
    label: 'Running Program',
    color: '#FB7185',
    bg: 'rgba(251,113,133,0.10)',
    border: 'rgba(251,113,133,0.25)',
  },
  {
    label: 'Rust Course \u00B7 Active',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.10)',
    border: 'rgba(167,139,250,0.25)',
  },
];

function TimelinePreview() {
  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const RANGE_LABELS = ['Mar 2', 'Mar 9', 'Mar 16'];

  return (
    <div
      className="landing-animate-5 landing-drift hidden w-full overflow-hidden rounded-[14px] border sm:block"
      style={{
        maxWidth: 880,
        background: '#0D1421',
        borderColor: 'rgba(255,255,255,0.06)',
        boxShadow:
          '0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(56,189,248,0.04)',
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-2 border-b px-5 py-3.5"
        style={{ background: '#141E30', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: '#FF5F57' }}
        />
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: '#FFBD2E' }}
        />
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: '#28CA42' }}
        />
        <span
          className="ml-2 text-xs"
          style={{ fontFamily: "'DM Mono', monospace", color: '#3E4A5C' }}
        >
          March 2025
        </span>
        <span
          className="ml-auto text-xs"
          style={{ fontFamily: "'DM Mono', monospace", color: '#38BDF8' }}
        >
          Today
        </span>
      </div>

      <div className="p-5">
        {/* Week header */}
        <div
          className="mb-2 grid gap-1.5"
          style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}
        >
          <div />
          {DAY_LABELS.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] uppercase"
              style={{
                fontFamily: "'DM Mono', monospace",
                color: '#3E4A5C',
                letterSpacing: '0.08em',
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {WEEKS.map((week, wi) => (
          <div
            key={wi}
            className="mb-2.5 grid gap-1.5"
            style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}
          >
            <div
              className="flex items-center justify-end pr-2 text-right text-[10px]"
              style={{ fontFamily: "'DM Mono', monospace", color: '#3E4A5C' }}
            >
              {RANGE_LABELS[wi]}
            </div>
            {week.map((day, di) => (
              <DayCell key={di} {...day} />
            ))}
          </div>
        ))}

        {/* Chapters */}
        <div
          className="mt-3.5 flex flex-wrap gap-1.5 border-t pt-3.5"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          {CHIPS.map((c) => (
            <div
              key={c.label}
              className="inline-flex items-center gap-1.5 rounded-[5px] border px-2.5 py-[3px] text-[11px]"
              style={{
                fontFamily: "'DM Mono', monospace",
                borderColor: c.border,
                color: c.color,
                background: c.bg,
              }}
            >
              <div
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: c.color }}
              />
              {c.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
