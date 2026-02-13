import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import {
  SYSTEM_CATEGORIES,
  SYSTEM_DAY_STATES,
} from '../src/common/constants/system-defaults.js';

import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
  },
  forcePathStyle: true,
});
const s3Bucket = process.env.S3_BUCKET ?? 'lifespan';

// ─── Constants ───────────────────────────────────────────────────────────────

const DEMO_EMAIL = 'demo@lifespan.app';
const DEMO_PASSWORD = 'demo1234';
const DEMO_TIMEZONE = 'Europe/Berlin';
const BCRYPT_ROUNDS = 12;

const DAYS_PER_MONTH = 30;
/** How far back the demo user's history goes — 1.5 years */
const HISTORY_MONTHS = 18;
const HISTORY_DAYS = HISTORY_MONTHS * DAYS_PER_MONTH;

/** Probability that a given weekday gets a day entry */
const WEEKDAY_ENTRY_PROBABILITY = 0.72;
/** Probability that a given weekend day gets a day entry */
const WEEKEND_ENTRY_PROBABILITY = 0.5;
/** Probability that a day entry has a mood assigned (vs. no mood) */
const MOOD_ASSIGNMENT_PROBABILITY = 0.82;

// Day state names — must match SYSTEM_DAY_STATES
const GREAT = 'Great';
const GOOD = 'Good';
const OKAY = 'Okay';
const BAD = 'Bad';
const TERRIBLE = 'Terrible';

// Category names — must match SYSTEM_CATEGORIES
const CAT_WORK = 'Work';
const CAT_EDUCATION = 'Education';
const CAT_RELATIONSHIP = 'Relationship';
const CAT_HEALTH = 'Health';
const CAT_HOBBY = 'Hobby';
const CAT_TRAVEL = 'Travel';
const CAT_LIVING = 'Living';
const CAT_FINANCE = 'Finance';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Mood name → relative weight (higher = more likely to be picked) */
type MoodWeights = Record<string, number>;

interface PeriodDefinition {
  /** How many days ago the period started */
  startDaysAgo: number;
  /** How many days ago the period ended (null = still active) */
  endDaysAgo: number | null;
  comment: string;
  /** Mood bias applied to days that fall within this period's range */
  moodBias: MoodWeights;
}

interface EventGroupDefinition {
  id: string;
  category: string;
  title: string;
  description?: string;
  periods: PeriodDefinition[];
}

interface ResolvedPeriod {
  startDate: Date;
  endDate: Date | null;
  moodBias: MoodWeights;
}

/** Probability that a day entry gets a photo attached */
const MEDIA_ATTACHMENT_PROBABILITY = 0.45;

/** Seed image files available for random attachment */
const SEED_IMAGE_FILES = ['i1.png', 'i2.png'];

// ─── Helper Functions ────────────────────────────────────────────────────────

/** Returns a date N days ago from now, normalized to midnight UTC */
function daysAgo(days: number): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - Math.round(days));
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

/** Returns a new date offset by N days from a base date */
function addDays(base: Date, days: number): Date {
  const date = new Date(base);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

/** Normalizes a date to midnight UTC */
function toMidnightUTC(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Seeded pseudo-random number generator (LCG) for reproducible results.
 * Every run of the seed produces the same data.
 */
function createSeededRandom(seed: number) {
  let state = seed;
  return (): number => {
    state = (state * 1664525 + 1013904223) & 0xffffffff;
    return (state >>> 0) / 0xffffffff;
  };
}

const random = createSeededRandom(42);

/** Picks a random element from `items` using `weights` as relative probabilities */
function weightedPick<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let roll = random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

/** Checks whether a date falls within [startDate, endDate] (inclusive) */
function isDateInRange(
  date: Date,
  startDate: Date,
  endDate: Date | null,
): boolean {
  const time = date.getTime();
  if (time < startDate.getTime()) return false;
  if (endDate !== null && time > endDate.getTime()) return false;
  return true;
}

/**
 * Combines a baseline mood distribution with active period biases.
 * The result averages the baseline with each active period's bias,
 * so overlapping periods pull the mood distribution in their direction.
 */
function computeEffectiveMoodWeights(
  baseline: MoodWeights,
  activeBiases: MoodWeights[],
): MoodWeights {
  if (activeBiases.length === 0) return { ...baseline };

  const merged: MoodWeights = {};
  const allKeys = new Set([
    ...Object.keys(baseline),
    ...activeBiases.flatMap((b) => Object.keys(b)),
  ]);

  for (const key of allKeys) {
    const values = [
      baseline[key] ?? 0,
      ...activeBiases.map((b) => b[key] ?? 0),
    ];
    merged[key] = values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  return merged;
}

// ─── Mood Baseline ───────────────────────────────────────────────────────────

/** Default mood distribution when no special periods are active */
const BASELINE_MOOD: MoodWeights = {
  [GREAT]: 15,
  [GOOD]: 40,
  [OKAY]: 30,
  [BAD]: 12,
  [TERRIBLE]: 3,
};

// ─── Event Group Definitions (1.5 years of life) ────────────────────────────

const EVENT_GROUP_DEFINITIONS: EventGroupDefinition[] = [
  // ─── Work ────────────────────────────────────────
  {
    id: 'software-engineer-techcorp',
    category: CAT_WORK,
    title: 'Software Engineer at TechCorp',
    description: 'First full-time position after university as a backend engineer',
    periods: [
      {
        startDaysAgo: 540,
        endDaysAgo: 340,
        comment: 'Started as a junior backend engineer — steep learning curve but supportive team',
        moodBias: {
          [GREAT]: 10, [GOOD]: 35, [OKAY]: 35, [BAD]: 15, [TERRIBLE]: 5,
        },
      },
      {
        startDaysAgo: 340,
        endDaysAgo: 210,
        comment: 'Promoted to mid-level — leading a small team, more responsibility',
        moodBias: {
          [GREAT]: 20, [GOOD]: 40, [OKAY]: 25, [BAD]: 12, [TERRIBLE]: 3,
        },
      },
    ],
  },
  {
    id: 'senior-dev-startup',
    category: CAT_WORK,
    title: 'Senior Developer at Nimbus',
    description: 'Joined an early-stage startup as senior full-stack developer',
    periods: [
      {
        startDaysAgo: 195,
        endDaysAgo: null,
        comment: 'Senior full-stack role — more autonomy, exciting product, equity stake',
        moodBias: {
          [GREAT]: 25, [GOOD]: 40, [OKAY]: 22, [BAD]: 10, [TERRIBLE]: 3,
        },
      },
    ],
  },
  {
    id: 'freelance-side-projects',
    category: CAT_WORK,
    title: 'Freelance Side Projects',
    description: 'Evening and weekend freelance web development gigs',
    periods: [
      {
        startDaysAgo: 360,
        endDaysAgo: 270,
        comment: 'Built an e-commerce site for a local bakery — nice side income but tiring',
        moodBias: {
          [GREAT]: 10, [GOOD]: 30, [OKAY]: 35, [BAD]: 20, [TERRIBLE]: 5,
        },
      },
    ],
  },

  // ─── Education ───────────────────────────────────
  {
    id: 'aws-certification',
    category: CAT_EDUCATION,
    title: 'AWS Cloud Certification',
    description: 'Studying for AWS Solutions Architect Associate exam',
    periods: [
      {
        startDaysAgo: 480,
        endDaysAgo: 420,
        comment: 'Intensive study for AWS SAA — 2 hours daily after work',
        moodBias: {
          [GREAT]: 10, [GOOD]: 30, [OKAY]: 40, [BAD]: 15, [TERRIBLE]: 5,
        },
      },
      {
        startDaysAgo: 420,
        endDaysAgo: 410,
        comment: 'Passed the exam! Celebrating the certification',
        moodBias: {
          [GREAT]: 50, [GOOD]: 35, [OKAY]: 10, [BAD]: 5, [TERRIBLE]: 0,
        },
      },
    ],
  },
  {
    id: 'system-design-course',
    category: CAT_EDUCATION,
    title: 'System Design Mastery',
    description: 'Online course on distributed systems and architecture patterns',
    periods: [
      {
        startDaysAgo: 150,
        endDaysAgo: 90,
        comment: 'Working through system design course — load balancers, caching, DB sharding',
        moodBias: {
          [GREAT]: 15, [GOOD]: 40, [OKAY]: 30, [BAD]: 12, [TERRIBLE]: 3,
        },
      },
    ],
  },
  {
    id: 'learning-rust',
    category: CAT_EDUCATION,
    title: 'Learning Rust',
    description: 'Picking up Rust for systems programming side projects',
    periods: [
      {
        startDaysAgo: 50,
        endDaysAgo: null,
        comment: 'Working through The Rust Book — ownership model is mind-bending but rewarding',
        moodBias: {
          [GREAT]: 20, [GOOD]: 35, [OKAY]: 30, [BAD]: 12, [TERRIBLE]: 3,
        },
      },
    ],
  },

  // ─── Relationship ────────────────────────────────
  {
    id: 'relationship-sarah',
    category: CAT_RELATIONSHIP,
    title: 'Relationship with Sarah',
    description: 'First serious relationship after moving to the city',
    periods: [
      {
        startDaysAgo: 480,
        endDaysAgo: 350,
        comment: 'Honeymoon phase — everything feels electric, spending all free time together',
        moodBias: {
          [GREAT]: 40, [GOOD]: 35, [OKAY]: 15, [BAD]: 8, [TERRIBLE]: 2,
        },
      },
      {
        startDaysAgo: 350,
        endDaysAgo: 300,
        comment: 'Growing apart — different life goals becoming apparent, lots of arguments',
        moodBias: {
          [GREAT]: 5, [GOOD]: 15, [OKAY]: 30, [BAD]: 35, [TERRIBLE]: 15,
        },
      },
      {
        startDaysAgo: 300,
        endDaysAgo: 290,
        comment: 'Breakup — mutual but painful, needed space to process',
        moodBias: {
          [GREAT]: 2, [GOOD]: 5, [OKAY]: 20, [BAD]: 40, [TERRIBLE]: 33,
        },
      },
    ],
  },
  {
    id: 'dating-phase',
    category: CAT_RELATIONSHIP,
    title: 'Getting Back Out There',
    description: 'Casual dating after the breakup, rediscovering myself',
    periods: [
      {
        startDaysAgo: 240,
        endDaysAgo: 160,
        comment: 'Started dating again — a few awkward first dates but also some fun ones',
        moodBias: {
          [GREAT]: 15, [GOOD]: 35, [OKAY]: 30, [BAD]: 15, [TERRIBLE]: 5,
        },
      },
    ],
  },
  {
    id: 'relationship-emma',
    category: CAT_RELATIONSHIP,
    title: 'Relationship with Emma',
    description: 'Met at a friend\'s dinner party — clicked instantly',
    periods: [
      {
        startDaysAgo: 120,
        endDaysAgo: null,
        comment: 'New relationship — feels more mature this time, shared interests and values',
        moodBias: {
          [GREAT]: 35, [GOOD]: 40, [OKAY]: 15, [BAD]: 8, [TERRIBLE]: 2,
        },
      },
    ],
  },

  // ─── Health ──────────────────────────────────────
  {
    id: 'running-routine',
    category: CAT_HEALTH,
    title: 'Morning Running',
    description: 'Building a consistent morning running habit',
    periods: [
      {
        startDaysAgo: 420,
        endDaysAgo: 320,
        comment: 'Started Couch to 5K — running 3 mornings a week, slowly building endurance',
        moodBias: {
          [GREAT]: 25, [GOOD]: 40, [OKAY]: 25, [BAD]: 8, [TERRIBLE]: 2,
        },
      },
      {
        startDaysAgo: 320,
        endDaysAgo: 280,
        comment: 'Training for first 10K race — pushed too hard, knee pain started',
        moodBias: {
          [GREAT]: 10, [GOOD]: 25, [OKAY]: 35, [BAD]: 22, [TERRIBLE]: 8,
        },
      },
    ],
  },
  {
    id: 'burnout-recovery',
    category: CAT_HEALTH,
    title: 'Burnout & Recovery',
    description: 'Hit a wall from overwork — needed time to recover',
    periods: [
      {
        startDaysAgo: 280,
        endDaysAgo: 240,
        comment: 'Burnout crash — insomnia, anxiety, zero motivation, took sick leave',
        moodBias: {
          [GREAT]: 2, [GOOD]: 5, [OKAY]: 20, [BAD]: 45, [TERRIBLE]: 28,
        },
      },
      {
        startDaysAgo: 240,
        endDaysAgo: 210,
        comment: 'Recovery phase — therapy sessions, better boundaries, slowly feeling human again',
        moodBias: {
          [GREAT]: 8, [GOOD]: 25, [OKAY]: 40, [BAD]: 20, [TERRIBLE]: 7,
        },
      },
    ],
  },
  {
    id: 'gym-strength',
    category: CAT_HEALTH,
    title: 'Gym & Strength Training',
    description: 'Switched from running to weight training for overall fitness',
    periods: [
      {
        startDaysAgo: 180,
        endDaysAgo: null,
        comment: 'Gym 4x/week — progressive overload program, feeling stronger every month',
        moodBias: {
          [GREAT]: 30, [GOOD]: 40, [OKAY]: 20, [BAD]: 8, [TERRIBLE]: 2,
        },
      },
    ],
  },
  {
    id: 'meditation-practice',
    category: CAT_HEALTH,
    title: 'Daily Meditation',
    description: 'Started meditating to manage stress and improve focus',
    periods: [
      {
        startDaysAgo: 90,
        endDaysAgo: null,
        comment: '10 minutes every morning — using Headspace, noticing real improvements in focus',
        moodBias: {
          [GREAT]: 22, [GOOD]: 42, [OKAY]: 25, [BAD]: 8, [TERRIBLE]: 3,
        },
      },
    ],
  },

  // ─── Hobby ───────────────────────────────────────
  {
    id: 'photography',
    category: CAT_HOBBY,
    title: 'Photography',
    description: 'Picked up a camera and started shooting — mostly landscapes and street',
    periods: [
      {
        startDaysAgo: 500,
        endDaysAgo: 300,
        comment: 'Learning basics with a second-hand Fuji — shooting every weekend',
        moodBias: {
          [GREAT]: 25, [GOOD]: 40, [OKAY]: 25, [BAD]: 8, [TERRIBLE]: 2,
        },
      },
      {
        startDaysAgo: 200,
        endDaysAgo: null,
        comment: 'Got back into it — started an Instagram portfolio, joined a local photo club',
        moodBias: {
          [GREAT]: 28, [GOOD]: 40, [OKAY]: 22, [BAD]: 8, [TERRIBLE]: 2,
        },
      },
    ],
  },
  {
    id: 'book-club',
    category: CAT_HOBBY,
    title: 'Monthly Book Club',
    description: 'Joined a local book club — one book per month, great discussions',
    periods: [
      {
        startDaysAgo: 360,
        endDaysAgo: 200,
        comment: 'Reading one book per month with the group — expanded my taste a lot',
        moodBias: {
          [GREAT]: 18, [GOOD]: 42, [OKAY]: 28, [BAD]: 10, [TERRIBLE]: 2,
        },
      },
    ],
  },
  {
    id: 'cooking-adventures',
    category: CAT_HOBBY,
    title: 'Cooking Adventures',
    description: 'Learning to cook properly — working through different cuisines',
    periods: [
      {
        startDaysAgo: 150,
        endDaysAgo: null,
        comment: 'Cooking 5 nights a week — currently obsessed with Thai and Italian cuisine',
        moodBias: {
          [GREAT]: 22, [GOOD]: 42, [OKAY]: 25, [BAD]: 8, [TERRIBLE]: 3,
        },
      },
    ],
  },

  // ─── Travel ──────────────────────────────────────
  {
    id: 'portugal-summer',
    category: CAT_TRAVEL,
    title: 'Summer in Portugal',
    description: 'Two-week trip through Lisbon, Porto, and the Algarve coast',
    periods: [
      {
        startDaysAgo: 480,
        endDaysAgo: 466,
        comment: 'Portugal road trip — pastéis de nata, surfing in Nazaré, sunsets in Lagos',
        moodBias: {
          [GREAT]: 50, [GOOD]: 35, [OKAY]: 12, [BAD]: 3, [TERRIBLE]: 0,
        },
      },
    ],
  },
  {
    id: 'vienna-christmas',
    category: CAT_TRAVEL,
    title: 'Christmas in Vienna',
    description: 'Christmas market trip to Vienna with friends',
    periods: [
      {
        startDaysAgo: 390,
        endDaysAgo: 383,
        comment: 'Vienna Christmas markets — Glühwein, Sachertorte, Schönbrunn Palace in snow',
        moodBias: {
          [GREAT]: 45, [GOOD]: 38, [OKAY]: 14, [BAD]: 3, [TERRIBLE]: 0,
        },
      },
    ],
  },
  {
    id: 'france-roadtrip',
    category: CAT_TRAVEL,
    title: 'Road Trip Through France',
    description: 'Ten-day road trip from Paris to the Côte d\'Azur',
    periods: [
      {
        startDaysAgo: 270,
        endDaysAgo: 260,
        comment: 'France road trip — Versailles, Loire Valley châteaux, lavender fields in Provence',
        moodBias: {
          [GREAT]: 48, [GOOD]: 35, [OKAY]: 14, [BAD]: 3, [TERRIBLE]: 0,
        },
      },
    ],
  },
  {
    id: 'amsterdam-weekend',
    category: CAT_TRAVEL,
    title: 'Weekend in Amsterdam',
    description: 'Quick city break to Amsterdam with Emma',
    periods: [
      {
        startDaysAgo: 100,
        endDaysAgo: 97,
        comment: 'Amsterdam — bike rides along canals, Rijksmuseum, cozy cafés',
        moodBias: {
          [GREAT]: 45, [GOOD]: 38, [OKAY]: 14, [BAD]: 3, [TERRIBLE]: 0,
        },
      },
    ],
  },
  {
    id: 'thailand-vacation',
    category: CAT_TRAVEL,
    title: 'Thailand Vacation',
    description: 'Two-week vacation in Thailand — Bangkok, Chiang Mai, and islands',
    periods: [
      {
        startDaysAgo: 45,
        endDaysAgo: 31,
        comment: 'Thailand — temples in Bangkok, elephants in Chiang Mai, diving in Koh Tao',
        moodBias: {
          [GREAT]: 52, [GOOD]: 33, [OKAY]: 12, [BAD]: 3, [TERRIBLE]: 0,
        },
      },
    ],
  },

  // ─── Living ──────────────────────────────────────
  {
    id: 'studio-downtown',
    category: CAT_LIVING,
    title: 'Studio Apartment Downtown',
    description: 'Tiny but central studio — first place on my own',
    periods: [
      {
        startDaysAgo: 540,
        endDaysAgo: 330,
        comment: 'Living solo for the first time — small space but great location near work',
        moodBias: {
          [GREAT]: 15, [GOOD]: 35, [OKAY]: 30, [BAD]: 15, [TERRIBLE]: 5,
        },
      },
    ],
  },
  {
    id: 'apartment-move',
    category: CAT_LIVING,
    title: 'The Big Move',
    description: 'Moving to a bigger apartment — stressful but worth it',
    periods: [
      {
        startDaysAgo: 330,
        endDaysAgo: 315,
        comment: 'Moving chaos — packing, cleaning, furniture assembly, lost deposit dispute',
        moodBias: {
          [GREAT]: 3, [GOOD]: 15, [OKAY]: 30, [BAD]: 35, [TERRIBLE]: 17,
        },
      },
    ],
  },
  {
    id: 'new-apartment',
    category: CAT_LIVING,
    title: 'Two-Bedroom with Garden',
    description: 'Finally settled into a proper apartment with outdoor space',
    periods: [
      {
        startDaysAgo: 315,
        endDaysAgo: null,
        comment: 'Love the new place — morning coffee in the garden, enough room for a home office',
        moodBias: {
          [GREAT]: 20, [GOOD]: 42, [OKAY]: 25, [BAD]: 10, [TERRIBLE]: 3,
        },
      },
    ],
  },

  // ─── Finance ─────────────────────────────────────
  {
    id: 'student-loan',
    category: CAT_FINANCE,
    title: 'Student Loan Repayment',
    description: 'Aggressive repayment plan to clear student debt',
    periods: [
      {
        startDaysAgo: 540,
        endDaysAgo: 360,
        comment: 'Paying off student loans — tight budget but making progress every month',
        moodBias: {
          [GREAT]: 8, [GOOD]: 25, [OKAY]: 38, [BAD]: 22, [TERRIBLE]: 7,
        },
      },
      {
        startDaysAgo: 360,
        endDaysAgo: 355,
        comment: 'Final payment! Debt free — incredible feeling of freedom',
        moodBias: {
          [GREAT]: 55, [GOOD]: 30, [OKAY]: 10, [BAD]: 5, [TERRIBLE]: 0,
        },
      },
    ],
  },
  {
    id: 'investment-portfolio',
    category: CAT_FINANCE,
    title: 'Investment Portfolio',
    description: 'Started investing in index funds and learning about personal finance',
    periods: [
      {
        startDaysAgo: 300,
        endDaysAgo: null,
        comment: 'Monthly contributions to ETF portfolio — slow and steady wealth building',
        moodBias: {
          [GREAT]: 15, [GOOD]: 40, [OKAY]: 30, [BAD]: 12, [TERRIBLE]: 3,
        },
      },
    ],
  },
  {
    id: 'emergency-fund',
    category: CAT_FINANCE,
    title: 'Emergency Fund Goal',
    description: 'Saving 6 months of expenses as a safety net',
    periods: [
      {
        startDaysAgo: 180,
        endDaysAgo: 90,
        comment: 'Building emergency fund — reached the 6-month target!',
        moodBias: {
          [GREAT]: 18, [GOOD]: 40, [OKAY]: 28, [BAD]: 11, [TERRIBLE]: 3,
        },
      },
    ],
  },
];

// ─── Seed Logic ──────────────────────────────────────────────────────────────

/** Creates the demo user (upsert for idempotency) */
async function seedUser(passwordHash: string): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      passwordHash,
      timezone: DEMO_TIMEZONE,
      onboardingCompleted: true,
      createdAt: daysAgo(HISTORY_DAYS),
    },
  });
  console.log(`  User: ${user.email} (password: ${DEMO_PASSWORD})`);
  return user.id;
}

/** Removes existing data so the seed can be re-run cleanly */
async function cleanExistingData(userId: string): Promise<void> {
  const [deletedMedia, deletedGroups, deletedDays] = await Promise.all([
    prisma.dayMedia.deleteMany({ where: { userId } }),
    prisma.eventGroup.deleteMany({ where: { userId } }),
    prisma.day.deleteMany({ where: { userId } }),
  ]);
  console.log(
    `  Cleaned: ${deletedGroups.count} event groups, ${deletedDays.count} days, ${deletedMedia.count} media`,
  );
}

/** Upserts system categories and returns a name→id map */
async function seedCategories(
  userId: string,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  for (const cat of SYSTEM_CATEGORIES) {
    const id = `system-cat-${cat.order}-${userId}`;
    await prisma.category.upsert({
      where: { id },
      update: {},
      create: {
        id,
        userId,
        name: cat.name,
        color: cat.color,
        isSystem: true,
        order: cat.order,
      },
    });
    map.set(cat.name, id);
  }

  console.log(`  Categories: ${SYSTEM_CATEGORIES.length}`);
  return map;
}

/** Upserts system day states and returns a name→id map */
async function seedDayStates(
  userId: string,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  for (const ds of SYSTEM_DAY_STATES) {
    const id = `system-ds-${ds.order}-${userId}`;
    await prisma.dayState.upsert({
      where: { id },
      update: {},
      create: {
        id,
        userId,
        name: ds.name,
        color: ds.color,
        isSystem: true,
        order: ds.order,
        score: ds.score,
      },
    });
    map.set(ds.name, id);
  }

  console.log(`  Day states: ${SYSTEM_DAY_STATES.length}`);
  return map;
}

/** Creates event groups with their periods and returns resolved period data for mood computation */
async function seedEventGroups(
  userId: string,
  categoryMap: Map<string, string>,
): Promise<ResolvedPeriod[]> {
  const resolved: ResolvedPeriod[] = [];
  let groupCount = 0;
  let periodCount = 0;

  for (const def of EVENT_GROUP_DEFINITIONS) {
    const categoryId = categoryMap.get(def.category);
    if (!categoryId) {
      console.warn(
        `  Warning: category "${def.category}" not found, skipping group "${def.id}"`,
      );
      continue;
    }

    const groupId = `demo-group-${def.id}-${userId}`;

    await prisma.eventGroup.create({
      data: {
        id: groupId,
        userId,
        categoryId,
        title: def.title,
        description: def.description ?? null,
      },
    });
    groupCount++;

    for (const period of def.periods) {
      const startDate = daysAgo(period.startDaysAgo);
      const endDate =
        period.endDaysAgo !== null ? daysAgo(period.endDaysAgo) : null;

      await prisma.eventPeriod.create({
        data: {
          eventGroupId: groupId,
          startDate,
          endDate,
          comment: period.comment,
        },
      });
      periodCount++;

      resolved.push({ startDate, endDate, moodBias: period.moodBias });
    }
  }

  console.log(`  Event groups: ${groupCount}, Periods: ${periodCount}`);
  return resolved;
}

/**
 * Generates day entries over the last 1.5 years.
 *
 * Logic:
 * - Iterates every day from historyStart to today
 * - Weekdays have a higher chance of getting an entry than weekends
 * - For each day with an entry, determines mood based on active periods:
 *   1. Find all periods active on that date
 *   2. Merge their mood biases with the baseline distribution
 *   3. Randomly pick a mood using the merged weights
 * - Some days (~18%) get no mood at all
 *
 * Returns created Day records keyed by days-ago for media attachment.
 */
async function seedDays(
  userId: string,
  dayStateMap: Map<string, string>,
  resolvedPeriods: ResolvedPeriod[],
): Promise<Map<number, string>> {
  const today = toMidnightUTC(new Date());
  const historyStart = daysAgo(HISTORY_DAYS);
  const dayStateNames = SYSTEM_DAY_STATES.map((ds) => ds.name);

  const daysToCreate: Array<{
    userId: string;
    date: Date;
    dayStateId: string | null;
    daysAgoValue: number;
  }> = [];

  let currentDate = new Date(historyStart);
  let dayIndex = HISTORY_DAYS;

  while (currentDate <= today) {
    const dayOfWeek = currentDate.getUTCDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const entryChance = isWeekend
      ? WEEKEND_ENTRY_PROBABILITY
      : WEEKDAY_ENTRY_PROBABILITY;

    if (random() < entryChance) {
      let dayStateId: string | null = null;

      if (random() < MOOD_ASSIGNMENT_PROBABILITY) {
        const activeBiases = resolvedPeriods
          .filter((p) => isDateInRange(currentDate, p.startDate, p.endDate))
          .map((p) => p.moodBias);

        const effectiveWeights = computeEffectiveMoodWeights(
          BASELINE_MOOD,
          activeBiases,
        );

        const weights = dayStateNames.map(
          (name) => effectiveWeights[name] ?? 0,
        );
        const pickedMood = weightedPick(dayStateNames, weights);
        dayStateId = dayStateMap.get(pickedMood) ?? null;
      }

      daysToCreate.push({
        userId,
        date: new Date(currentDate),
        dayStateId,
        daysAgoValue: dayIndex,
      });
    }

    currentDate = addDays(currentDate, 1);
    dayIndex--;
  }

  // Insert all days and collect id mapping for media attachment
  const daysAgoToIdMap = new Map<number, string>();
  for (const day of daysToCreate) {
    const created = await prisma.day.create({
      data: {
        userId: day.userId,
        date: day.date,
        dayStateId: day.dayStateId,
      },
    });
    daysAgoToIdMap.set(day.daysAgoValue, created.id);
  }

  // Log mood distribution
  const moodCounts: Record<string, number> = {};
  let noMoodCount = 0;
  for (const day of daysToCreate) {
    if (day.dayStateId) {
      const name =
        [...dayStateMap.entries()].find(
          ([, id]) => id === day.dayStateId,
        )?.[0] ?? 'Unknown';
      moodCounts[name] = (moodCounts[name] ?? 0) + 1;
    } else {
      noMoodCount++;
    }
  }

  console.log(`  Days: ${daysToCreate.length}`);
  console.log('  Mood distribution:');
  for (const name of dayStateNames) {
    console.log(`    ${name}: ${moodCounts[name] ?? 0}`);
  }
  console.log(`    No mood: ${noMoodCount}`);

  return daysAgoToIdMap;
}

/**
 * Randomly attaches seed images to ~45% of days as DayMedia.
 * Picks a random image from SEED_IMAGE_FILES for each selected day.
 * Uploads the actual image file to S3 so presigned read URLs work.
 */
async function seedMedia(
  userId: string,
  daysAgoToIdMap: Map<number, string>,
): Promise<void> {
  const prismaDir = path.resolve(__dirname);

  // Resolve file sizes and buffers upfront
  const imageData: Array<{ file: string; size: number; buffer: Buffer }> = [];
  for (const file of SEED_IMAGE_FILES) {
    const filePath = path.join(prismaDir, file);
    try {
      const buffer = fs.readFileSync(filePath);
      imageData.push({ file, size: buffer.length, buffer });
    } catch {
      console.warn(`  Warning: seed image "${file}" not found at ${filePath}, skipping`);
    }
  }

  if (imageData.length === 0) {
    console.log('  Media: no seed images found, skipping');
    return;
  }

  // De-duplicate S3 uploads: track which s3Keys have already been uploaded
  const uploadedKeys = new Set<string>();
  let mediaCount = 0;

  for (const [, dayId] of daysAgoToIdMap) {
    if (random() >= MEDIA_ATTACHMENT_PROBABILITY) continue;

    const image = imageData[Math.floor(random() * imageData.length)];
    const s3Key = `seed/${userId}/${mediaCount}-${image.file}`;

    // Upload to S3 if not already uploaded
    if (!uploadedKeys.has(s3Key)) {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: s3Bucket,
          Key: s3Key,
          Body: image.buffer,
          ContentType: 'image/png',
        }),
      );
      uploadedKeys.add(s3Key);
    }

    const dayMedia = await prisma.dayMedia.create({
      data: {
        dayId,
        userId,
        s3Key,
        fileName: image.file,
        contentType: 'image/png',
        size: image.size,
      },
    });

    await prisma.day.update({
      where: { id: dayId },
      data: { mainMediaId: dayMedia.id },
    });

    mediaCount++;
  }

  console.log(`  Media: ${mediaCount} images uploaded & attached to days (~${Math.round((mediaCount / daysAgoToIdMap.size) * 100)}%)`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding database with demo data (1.5 years of history)...\n');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);
  const userId = await seedUser(passwordHash);

  await cleanExistingData(userId);

  const categoryMap = await seedCategories(userId);
  const dayStateMap = await seedDayStates(userId);
  const resolvedPeriods = await seedEventGroups(userId, categoryMap);

  const daysAgoToIdMap = await seedDays(userId, dayStateMap, resolvedPeriods);
  await seedMedia(userId, daysAgoToIdMap);

  console.log('\nSeed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
