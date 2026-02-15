# LifeSpan — Project Overview

**LifeSpan** is a personal life-tracking application that lets users record daily moods, track life events across categories, attach photos/videos to days, and visualize their life as an interactive timeline.

---

## Product Features

### Authentication
- Email + password registration and login
- **Google OAuth 2.0** login/registration via `passport-google-oauth20`
  - First-time Google login → auto-creates account (provider=GOOGLE)
  - Existing email match → links Google account to existing user (race-condition-safe via DB transaction)
  - Email verification enforced (rejects unverified Google emails)
  - Returns same JWT format as email/password flow
- **Refresh token rotation** — short-lived access tokens (15 min) + SHA-256-hashed refresh tokens (7 days)
  - `POST /auth/refresh` — rotates refresh token on each use
  - `POST /auth/logout` — revokes refresh token
- Password complexity: min 8 chars, 1 uppercase, 1 lowercase, 1 digit
- Email normalization (lowercase + trim) on all auth flows
- JWT-based session management
- Timezone-aware accounts (user selects their timezone)
- Multi-step onboarding flow for new users
- User model supports: `googleId`, `provider` (LOCAL/GOOGLE), `avatarUrl`, nullable `passwordHash`
- DB CHECK constraint: LOCAL users must have a password hash

### Timeline
- **Horizontal (All Time)** — full lifespan view rendered as week rows with day circles, period bars spanning across days, and date range filtering; starts strictly from user's registration date (first week may be partial, no days before registration rendered), with "Your journey begins" marker on the first day
- **Week Mode** — 7-day card grid showing mini mood circles and up to 3 periods per day; days before registration are filtered out
- Click any day to navigate to the dedicated Day page (`/timeline/day/[date]`)
- Date range filters clamped to registration date (min attribute on date inputs)
- Week navigation clamped to not go before registration week

### Day Page
- **Dedicated route:** `/timeline/day/YYYY-MM-DD` (web), `/timeline/day/[date]` (mobile)
- Full standalone page replacing the previous DayFormModal navigation flow
- **Sections:** Memories (from context API), Mood Picker (inline save), Media Carousel (horizontal scroll + fullscreen viewer), Comment (300 char limit), Active Chapters (overlapping periods), Save button
- **Back button** → navigates to `/timeline` preserving last selected timeline mode (stored in Zustand view store)
- **Calendar date picker** — "Вибрати день" / "Pick a day" button opens calendar popover (web: `react-day-picker` with confirm/cancel flow, mobile: native `DateTimePicker`), future dates disabled, Luxon timezone-safe
- **Media carousel** — horizontal scroll (`embla-carousel` on web, `FlatList` on mobile) with click-to-preview fullscreen viewer (keyboard nav + swipe, left/right arrows, ESC to close)
- **Searchable chapter selector** — "Додати розділ" / "Add chapter" opens searchable dropdown (web: custom popover, mobile: slide-up modal with search input), filters by title, highlights active chapters
- Previous/Next day navigation arrows + Today button — updates URL without full reload
- Memories section fetches from `GET /api/v1/memories/context?mode=day&date=[date]`, hidden if empty
- Date validated on route level; invalid dates show 404
- DayFormModal component retained for potential future quick-edit mode

### Chapters (Event Groups)
- Reusable named concepts (e.g. "Working at Company X", "Trip to Italy") tied to a category
- Each chapter has a title, optional description, and a category
- Cannot delete a chapter that still has periods (409 error)
- Create, edit, and delete chapters with confirmation dialogs

### Periods (Event Periods)
- Date-range instances within a chapter (e.g. "Jan–Jun 2024")
- Periods can be **active** (ongoing, no end date) or **closed** (with end date)
- Only one active period per chapter at a time (DB partial unique index + app-level check)
- Closed period overlap detection (strict `<`/`>` comparison — boundary-sharing allowed, e.g. 01–10 + 10–20 is valid; true overlap like 01–10 + 05–15 is rejected)
- Optional comment per period (up to 300 chars)
- Close, edit, and delete periods with confirmation dialogs

### Chapter Details
- View all periods for a chapter with mood statistics
- Mood distribution bar chart aggregated across all periods
- Media gallery with all photos/videos from days within periods
- Total days count across all periods

### Categories
- Organize chapters into color-coded categories
- 8 recommended categories: Work, Education, Relationship, Health, Hobby, Travel, Living, Finance
- Recommendations fetched from backend API (single source of truth) with keys + colors; translated names resolved via i18n
- Shown as interactive chips (accept, dismiss, add all); individual selection removes only the selected chip while keeping the rest visible
- Compact inline recommendations also shown in chapter form when no categories exist
- Create custom categories with name, hex color, and display order
- Cannot delete a category that has chapters

### Day States (Moods)
- Record daily emotional state
- 5 recommended moods: Great (9), Good (7), Okay (5), Bad (3), Terrible (1) — color-coded green → red
- Recommendations fetched from backend API; same accept/dismiss/add-all flow as categories (individual selection removes only selected chip)
- Compact inline recommendations also shown in day form when no moods exist
- Create custom moods with name, hex color, display order, and **mood intensity score (0-10)**
- **Score slider** (0-10) in mood creation/editing with emoji thumb that changes dynamically based on value
- Emoji mapping: 0-2 = Angry, 3-4 = Sad, 5-6 = Neutral, 7-8 = Happy, 9-10 = Very Happy
- Score label: Very Negative (0-2), Negative (3-4), Neutral (5-6), Positive (7-8), Very Positive (9-10)
- Cannot delete a mood assigned to any day

### Media (Photos & Videos)
- Upload images (JPEG, PNG, WebP, GIF) and videos (MP4, WebM, QuickTime) up to 50 MB
- Direct browser-to-S3 uploads via presigned URLs (Hetzner S3-compatible storage)
- **S3 hardening**: MIME-type whitelist, server-derived file extensions, ContentLength enforcement
- Attach media to specific dates; first image auto-set as cover photo
- **Video thumbnail extraction**: for video-only days, first frame extracted via HTML5 video + canvas as JPEG data URL; used as day preview and allows setting video as cover
- Presigned read URLs for secure access (24-hour expiry)
- `Day.mainMediaId` now has proper FK to `DayMedia` (onDelete: SetNull)

### Onboarding
- Multi-step guided tour for first-time users
- Steps: welcome → highlight-timeline → highlight-chapters → highlight-categories → highlight-moods → day → first-memory
- Sidebar highlights with tooltips during navigation steps (web)
- Auto-opens day form on final step to capture first memory
- Onboarding completion synced to backend (`PATCH /auth/onboarding`)
- Available on both web and mobile

### Memories — "On This Day"
- Resurfaces past data for the same calendar date across fixed intervals
- Accepts optional `date` query param (`GET /api/v1/memories/on-this-day?date=YYYY-MM-DD`); defaults to today in user's timezone
- Supported intervals (fixed): 1 month ago, 6 months ago, 1 year ago
- Exact date matching only — no tolerance, no period-based logic
- A memory exists if a Day record has a dayState OR media attached
- Each memory includes: interval metadata, date, mood (nullable), mediaCount
- Response: `{ baseDate, memories[] }` — max 3 items, ordered 1mo → 6mo → 1yr
- Timezone-aware: uses user's IANA timezone via Luxon for all date arithmetic
- Handles leap year (Feb 29) and month-end edge cases gracefully via Luxon auto-adjust
- Single optimized DB query (1 `findMany` with `date IN [...]`)
- Displayed above the Timeline as collapsible memory cards
- Tapping a memory navigates to the Day page for that past date
- Available on both web and mobile

### Insights (Emotional Analytics)
- Global mood overview: average mood score, distribution, best/worst category, 30-day trend
- Mood scoring: uses explicit `score` field (0-10) stored on each DayState — no more derived scoring from display order
- Category-level mood analysis: average mood per category based on overlapping period days
- 30-day trend line chart on 0-10 scale (recharts on web, react-native-svg-charts on mobile)
- Chapter-level insights: total periods, days, media, average mood, activity density per period
- **Weekday Behavioral Analytics** (requires ≥14 tracked days):
  - Best/worst mood weekday: average mood score per weekday (min 3 data points)
  - Most/least active weekday: activity score = mediaCount + periodsStarted + periodsClosed
  - Most emotionally unstable weekday: highest standard deviation (min 5 data points)
  - Recovery Index: weekday with highest rate of score-increase-by-≥2 events
  - Burnout Pattern Detection: detects Monday-low/Friday-high stress pattern with confidence score
  - All calculations timezone-aware (Luxon + user IANA timezone)
  - Displayed as card grid in "Weekday Patterns" section on web + mobile
- Backend endpoint: `GET /api/v1/analytics/mood-overview`
- Chapter analytics embedded in existing `GET /api/v1/event-groups/:id/details` response
- All aggregation computed on backend (5 optimized queries for global, in-memory grouping by weekday)
- Available on both web (`/dashboard`) and mobile (Insights tab)

### Chapter Details (Enhanced)
- Now includes analytics section with stats grid, mood distribution, and activity density
- Activity density shows active days (with mood or media) per period as progress bars
- Mobile app now has a full chapter detail screen (`/chapter/[id]`) with all sections

### Settings
- View account info (email, timezone)
- Theme preference (Light / Dark / System)
- Language preference

---

## UI Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Landing | `/` | Redesigned public landing page with 6 sections: Header (lang/theme switchers), Hero (mock timeline preview), Social Proof (animated counter stats), Chapters Vibe (4 themed cards), On This Day Preview (memory resurfacing), Final CTA |
| Insights | `/dashboard` | Emotional analytics — mood overview, distribution, trends, category stats |
| Timeline | `/timeline` | Main dashboard — 2 visualization modes (horizontal, week) |
| Day Page | `/timeline/day/[date]` | Full day editing — mood, media, comment, chapters, memories |
| Chapters | `/chapters` | List of all chapters with create, edit, delete actions |
| Chapter Details | `/chapters/[id]` | Detail view: periods, mood stats, media gallery |
| Categories | `/categories` | Grid of color-coded category cards with CRUD |
| Day States | `/day-states` | Grid of mood cards with CRUD |
| Settings | `/settings` | Account info, theme and language selectors, sign out |
| Google Callback | `/auth/google/callback` | Handles Google OAuth redirect, extracts token, stores auth |
| Week (legacy) | `/week` | Redirects to `/timeline` (legacy route kept for backward compat) |

### Mobile Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Root | `/` | Redirects to timeline (authenticated) or login |
| Login | `/(auth)/login` | Login screen |
| Register | `/(auth)/register` | Register screen |
| Timeline | `/(tabs)/timeline` | Timeline tab — horizontal + week modes |
| Insights | `/(tabs)/insights` | Mood overview, weekday insights (react-native-svg-charts) |
| Chapters | `/(tabs)/chapters` | Chapters list tab |
| Categories | `/(tabs)/categories` | Categories grid tab |
| Day States | `/(tabs)/day-states` | Day States grid tab |
| Settings | `/(tabs)/settings` | Account info, theme, language, sign out |
| Day | `/timeline/day/[date]` | Day screen — mood, media, comments, chapters, memories |
| Chapter Detail | `/chapter/[id]` | Chapter detail — periods, analytics, media gallery |

### Modals & Dialogs
- **LoginForm / RegisterForm** — auth forms on landing page with "Continue with Google" button, i18n-mapped backend validation errors (email exists, invalid email, weak password, wrong credentials, Google account without password), show/hide password toggle with eye icon
- **GoogleCallbackPage** (`/auth/google/callback`) — handles Google OAuth redirect, extracts token, stores auth
- **ChapterFormModal** — create or edit a chapter (title, category, description)
- **PeriodFormModal** — create or edit a period (dates, comment)
- **ClosePeriodModal** — confirm closing an active period
- **CategoryFormModal** — create or edit a category (name, color)
- **DayStateFormModal** — create or edit a mood (name, color, score slider 0-10 with emoji)
- **DayFormModal** — assign mood and upload media for a day (retained for potential quick-edit mode; default flow uses Day page)
- **ConfirmDialog** — generic delete confirmation

### Mobile App (Expo + React Native)
- Same feature set with native navigation
- Tab bar: Timeline, Insights, Chapters, Categories, Day States, Settings
- Dedicated Day screen (`/timeline/day/[date]`) with mood picker, comments, chapters, memories
- Chapter detail screen (`/chapter/[id]`) with periods, analytics, media gallery
- Auth screens: Login, Register
- Secure token storage via `expo-secure-store`
- API-driven category and mood recommendations with one-click acceptance
- Multi-step onboarding overlay

---

## Frontend Features

### Internationalization (i18n)
- **Languages:** English (en), Ukrainian (uk)
- Auto-detects browser/device language on first visit
- Persisted to localStorage (web) / device storage (mobile)
- Translation keys cover all modules: auth, nav, timeline, chapters, periods, categories, day states, memories, settings, common, errors, validation

### Theming
- **Modes:** Light, Dark, System (follows OS preference)
- Semantic color tokens via CSS variables on `<html data-theme="...">`
- Tailwind CSS extended with `var()` references for dynamic switching
- Persisted to localStorage; instant switch without reload
- Light palette: gray-50 backgrounds, gray-900 text, blue-500 accent
- Dark palette: inverted with blue-400 accent and high-contrast backgrounds

### State Management
- **Zustand** stores for auth, theme, language, sidebar, and view preferences
- **TanStack React Query** for server state (data fetching, caching, mutations)
- Hydration from localStorage (web) / SecureStore (mobile) on mount

### Tech Stack
- **Web:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Mobile:** Expo, React Native 0.76, Expo Router
- **Shared packages:** API client (Axios), domain logic, hooks, i18n, theme tokens, utils, constants
- **Monorepo** with npm workspaces for code sharing between web and mobile

### UI Components (33 custom)
- Layout: DashboardShell (document-level scroll, sticky mobile header), Sidebar (collapsible, sticky h-dvh on desktop)
- Forms: Input, Button (primary/secondary/danger/ghost), ColorPicker, CategorySelect, Modal, SegmentedControl
- Display: DayCircle (mood badge with color/image), EmptyState, ConfirmDialog
- Day Page: CalendarPopover (react-day-picker with confirm/cancel popover), MediaCarousel (embla-carousel + fullscreen viewer), ChapterSelector (searchable dropdown)
- Landing: LandingHeader (logo + lang/theme switchers + auth buttons), HeroSection (headline + mock timeline), SocialProofSection (animated count-up stats), ChaptersVibeSection (4 themed vibe cards), OnThisDayPreview (memory card preview), FinalCTA (gradient CTA block)
- Feature: MediaUploader, TimelineView, OnThisDaySection, ChaptersList, ChapterDetails, CategoriesList, DayStatesList, OnboardingOverlay

### Error Handling & Feedback
- Toast notifications (react-hot-toast) for success/error
- Confirm dialogs for destructive actions
- Client-side + server-side validation with inline error messages
- Loading spinners and disabled buttons during mutations

### Responsive Design
- Mobile-first Tailwind CSS
- Adaptive grid layouts (1–3 columns based on viewport)
- Document-level scrolling (no nested scroll containers) — enables iOS address bar collapse
- All viewport heights use `dvh` (dynamic viewport height) for iOS Safari compatibility
- Mobile header is `sticky top-0` instead of inside a fixed container
- Desktop sidebar is `sticky top-0 h-dvh` — stays in place while document scrolls
- Shared design tokens across web and mobile

---

## Architecture at a Glance

```
LifeSpan/
├── be/                        NestJS backend
│   ├── src/
│   │   ├── auth/              Registration, login, JWT, Google OAuth
│   │   ├── categories/        Category CRUD
│   │   ├── day-states/        Mood CRUD
│   │   ├── event-groups/      Chapter + Period CRUD, details
│   │   ├── days/              Day upsert + query
│   │   ├── timeline/          Timeline + week aggregation
│   │   ├── recommendations/   Static recommendation constants endpoint
│   │   ├── analytics/          Emotional pattern detection & mood analytics
│   │   ├── memories/           "On This Day" memory resurfacing
│   │   ├── media/             Media attach/list/delete
│   │   ├── s3/                S3 presigned URL generation
│   │   ├── prisma/            Database client module
│   │   └── common/            Guards, filters, decorators, pipes, errors, constants, middleware
│   └── prisma/                Schema, migrations, seed (seed.ts)
│
├── fe/                        Frontend monorepo
│   ├── apps/
│   │   ├── web/               Next.js 14 web app
│   │   └── mobile/            Expo React Native app
│   └── packages/
│       ├── api/               Axios client + endpoints
│       ├── domain/            Validation, errors, helpers
│       ├── hooks/             React Query hooks
│       ├── i18n/              en + uk translations
│       ├── theme/             Color tokens + types
│       ├── utils/             Date, color, validation utils
│       └── constants/         App-wide constants
│
├── terraform/                 Hetzner Cloud IaC (Terraform)
│   ├── main.tf               SSH key, firewall, server resources
│   ├── variables.tf           Input variables (token, location, SSH key)
│   ├── outputs.tf             Server IP, SSH command
│   ├── provider.tf            Hetzner Cloud provider config
│   ├── versions.tf            Provider version constraints
│   └── cloud-init.yaml        Server provisioning (Docker, UFW, fail2ban)
│
├── docker-compose.yml         PostgreSQL + app services
└── PROJECT_OVERVIEW.md        ← this file
```

**Backend:** NestJS 11 · TypeScript · PostgreSQL · Prisma 7 · JWT · Swagger · SWC · Helmet · @nestjs/throttler
**Frontend:** Next.js 14 · Expo · React 18 · Zustand · TanStack Query · Tailwind CSS · Luxon

### Backend Infrastructure

| Component | Description |
|-----------|-------------|
| **JwtAuthGuard** | Protects all authenticated endpoints via `@UseGuards(JwtAuthGuard)` |
| **GoogleAuthGuard** | Initiates and handles Google OAuth flow |
| **CurrentUser** | Param decorator — extracts user from JWT payload |
| **ParseDatePipe** | Validates `YYYY-MM-DD` format on date path/query params |
| **GlobalExceptionFilter** | Catches all exceptions, normalizes error responses |
| **RequestLoggerMiddleware** | Logs incoming HTTP requests (method, URL, status, duration) |

### Database Models (9)

| Model | Key Fields |
|-------|-----------|
| **User** | email, passwordHash?, googleId?, provider (LOCAL/GOOGLE), avatarUrl?, timezone, onboardingCompleted, createdAt |
| **Category** | userId, name, color, isSystem, order |
| **DayState** | userId, name, color, isSystem, order, score (0-10) |
| **EventGroup** | userId, categoryId, title, description? |
| **EventPeriod** | eventGroupId, startDate, endDate?, comment? |
| **Day** | userId, date, dayStateId?, mainMediaId? |
| **DayMedia** | dayId, userId, s3Key, fileName, contentType, size |
| **RefreshToken** | userId, tokenHash (SHA-256), expiresAt |
| **AuthProvider** (enum) | LOCAL, GOOGLE |

### Test Coverage (11 suites, 161 tests)

| Test File | Tests | What It Covers |
|-----------|-------|----------------|
| `auth.service.spec.ts` | Registration (email normalization, duplicate rejection, bcrypt 12 rounds, timezone default), login (user not found, Google-only rejection, wrong password), refresh token rotation (SHA-256, replay prevention, 7-day expiry), logout, Google OAuth transaction (account linking, avatar preservation, error re-throw) |
| `google.strategy.spec.ts` | Google strategy `validate()` callback delegation |
| `event-groups.service.spec.ts` | Active period constraint, overlap detection (adjacent edges allowed, boundary-sharing 01–10+10–20 allowed, exact same range rejected, contained/wrapping rejected), date validation (start > end), close period checks, update period revalidation, delete group with periods, not-found errors |
| `memories.service.spec.ts` | Interval calculation (1mo/6mo/1yr), max 3 results, content filtering (mood-only, media-only, exclude empty), Feb 29 / month-end edge cases, timezone handling, invalid date, week mode aggregation |
| `analytics.service.spec.ts` | Average mood score from explicit scores, distribution percentages, best/worst category by mood, activity score (media + periods), 30-day trend (exclude score 0), weekday insights threshold (≥14 days) |
| `categories.service.spec.ts` | Delete constraint (reject with chapters), create (auto-order), createFromRecommendation (color + invalid key), update not-found |
| `day-states.service.spec.ts` | Delete constraint (reject when in use), create (score storage, auto-order), recommendation scores (great=9…terrible=1), update score |
| `media.service.spec.ts` | Future date validation, auto cover photo (first image, no override, skip video), day upsert before create, delete (clear cover, S3 before DB), timezone-aware validation |
| `mood-score.spec.ts` | `buildMoodScoreMap` (ID→score, empty, score 0), `computeAverageMoodScore` (rounding, null cases, skip unknown, exclude negative, realistic dataset) |
| `s3.service.spec.ts` | MIME whitelist (images, videos, dangerous types rejected, SVG blocked), extension mapping, 50 MB size limit |
| `weekday-insights.spec.ts` | Weekday grouping, best/worst mood day, activity scoring, volatility (std dev), recovery index, burnout pattern detection |

---

## Security & Production Hardening

| Layer | Protection |
|-------|-----------|
| HTTP | Helmet (CSP, frameguard, referrer-policy), CORS origin whitelist, 1 MB body size limit |
| Rate Limiting | Global 100 req/60s, register 3/min, login 5/min (`@nestjs/throttler`) |
| Auth | Short-lived JWT (15 min), refresh token rotation (SHA-256 hashed, 7-day expiry), password complexity |
| S3 Uploads | MIME whitelist, server-derived extensions, ContentLength enforcement, max 50 MB |
| Google OAuth | Transaction-safe account linking, email normalization, provider not overwritten |
| DB Integrity | `updatedAt` on all tables, unique constraints (category/mood names per user), FK for mainMediaId |
| DB Constraints | Partial unique index (one active period per group), CHECK (LOCAL→password required) |
| Indexes | Composite indexes on days(userId, dayStateId), event_periods(eventGroupId, endDate) |
| Validation | `@IsNotEmpty()` on all name/title fields, ISO 8601 date pipe, future date limit, period overlap detection |

---

## Infrastructure (Terraform + Hetzner Cloud)

| Component | Description |
|-----------|-------------|
| **Provider** | Hetzner Cloud (`hetznercloud/hcloud ~> 1.49`) |
| **Server** | `cx22` Ubuntu 22.04, single instance, public IPv4/IPv6 |
| **Firewall** | Inbound: TCP 22 (SSH), 80 (HTTP), 443 (HTTPS) only |
| **SSH** | Key-only auth, root login disabled, `deploy` user with sudo |
| **Docker** | Docker CE + Compose plugin installed via cloud-init |
| **Hardening** | UFW, fail2ban (3 retries), unattended security upgrades |
| **S3 Storage** | Pre-existing Hetzner S3 bucket (not managed by Terraform) |

### Deployment

```bash
cd terraform
export TF_VAR_hcloud_token="your-api-token"
terraform init
terraform plan
terraform apply
ssh deploy@<server_ip>
```

---

## CI/CD (GitHub Actions)

Pipeline defined in `.github/workflows/ci.yml` with three parallel/gated jobs:

| Job | Trigger | What it does |
|-----|---------|--------------|
| **backend-test** | push + PR to main | `npm ci` → `npm test --ci --coverage` in `be/` |
| **frontend-lint** | push + PR to main | `npm ci` → `npm run lint -w apps/web` in `fe/` |
| **docker-build-and-push** | push to main only | Builds + pushes backend & frontend Docker images |

### Docker Images

| Image | Dockerfile | Base | Output |
|-------|-----------|------|--------|
| `backend` | `be/Dockerfile` | node:20-alpine, 3-stage (deps → build → runner) | `dist/main.js` via SWC |
| `frontend` | `fe/apps/web/Dockerfile` | node:20-alpine, 3-stage (deps → build → runner) | Next.js standalone |

Images tagged with `latest` + short commit SHA, pushed to GHCR (configurable to Docker Hub).

### Required Secrets

| Secret | Used for | When |
|--------|----------|------|
| `GITHUB_TOKEN` | GHCR push | Automatic (no setup needed) |
| `DOCKER_USERNAME` | Docker Hub login | Only if `DOCKER_REGISTRY=docker.io` |
| `DOCKER_PASSWORD` | Docker Hub login | Only if `DOCKER_REGISTRY=docker.io` |

### Optimizations
- Node dependency caching via `actions/setup-node`
- Docker layer caching via GitHub Actions cache (`type=gha`)
- Concurrency control: cancels in-flight runs for same branch/PR
- Trivy vulnerability scanning on pushed images
- Coverage report uploaded as artifact (7-day retention)
