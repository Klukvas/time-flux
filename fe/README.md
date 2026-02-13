# TimeFlux Frontend

Frontend monorepo for TimeFlux — a visual life timeline application. Contains a Next.js web app, an Expo mobile app, and shared packages.

## Architecture

```
frontend/
├── packages/                    # Shared code (no UI)
│   ├── api/                     # Typed HTTP client + endpoint definitions
│   ├── constants/               # Query keys, error messages, validation constants
│   ├── domain/                  # Business logic (timeline grouping, validation, error mapping)
│   ├── hooks/                   # TanStack Query hooks (categories, events, days, timeline)
│   ├── i18n/                    # Internationalization (en, uk)
│   ├── theme/                   # Theme tokens (light/dark) + CSS variable generation
│   └── utils/                   # Pure helpers (date formatting, color utilities)
├── apps/
│   ├── web/                     # Next.js 14 (App Router) + Tailwind CSS
│   └── mobile/                  # Expo + React Native + Expo Router
├── package.json                 # npm workspaces root
└── tsconfig.base.json           # Shared TypeScript config
```

### Key Architectural Decisions

**1. Shared packages — business logic lives outside UI**

All business logic is in `packages/`. Components only render UI, handle interactions, and call hooks. This means:
- `packages/domain` contains timeline grouping, validation, error mapping
- `packages/hooks` contains all TanStack Query hooks
- `packages/api` contains the typed HTTP client
- `packages/utils` contains date formatting and color helpers
- `packages/constants` contains error messages and query keys
- `packages/i18n` contains all translatable strings (en + uk)
- `packages/theme` contains light/dark theme tokens

**2. No shared UI components between web and mobile**

Web uses Tailwind CSS. Mobile uses React Native StyleSheet. They share logic but not UI.

**3. Backend is the source of truth for time**

The frontend never calculates day boundaries. Dates are only formatted for display using Luxon. The backend handles timezone-aware date interpretation.

**4. Error handling via error_code**

The frontend maps backend `error_code` values to user-friendly messages. Error messages are never parsed from the response — only the code is used.

**5. Server state via TanStack Query, UI state via Zustand**

- TanStack Query manages all server-fetched data (cache, refetch, invalidation)
- Zustand manages client state: auth, theme preference, language, sidebar collapse, timeline mode
- No duplication of backend state in stores

**6. CSS variable-based theming**

Theme colors are defined as CSS variables on `<html data-theme="light|dark">`. Tailwind maps semantic tokens (e.g., `bg-surface`, `text-content`) to these variables. Theme switching is instant — no page reload.

**7. Suggestions over auto-creation**

Categories and moods are NOT automatically created on signup. Instead, suggested items appear as selectable chips that the user can individually accept or dismiss. Nothing is persisted until the user explicitly confirms.

## Data Flow

```
Component → Hook (packages/hooks) → API Client (packages/api) → Backend REST API
                ↕                          ↕
         Domain Logic              Error Extraction
      (packages/domain)          (packages/api/client)
                ↕
         User Message
     (packages/constants)
```

## Setup

### Prerequisites
- Node.js >= 18
- npm >= 9 (workspace support)
- Backend running at `http://localhost:3000`

### Install

```bash
cd frontend
npm install
```

### Web (Next.js)

```bash
npm run web:dev
```

Open [http://localhost:3001](http://localhost:3001).

Set `NEXT_PUBLIC_API_URL` in `apps/web/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Mobile (Expo)

```bash
npm run mobile:start
```

Set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env`:
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

> For physical device testing, use your machine's LAN IP instead of localhost.

## Package Details

### `@lifespan/api`
Typed HTTP client built on Axios. Creates an API instance with automatic JWT injection and 401 handling.

- `createApiClient(config)` — creates Axios instance with interceptors
- `createApi(client)` — returns typed endpoint functions
- `extractApiError(error)` — extracts structured error from Axios error
- Full TypeScript types for all request/response DTOs

### `@lifespan/domain`
Pure business logic functions:

- `groupTimelineByMonth(data)` — groups timeline response by month
- `buildWeekGrid(data)` — builds 7-day grid with events per day
- `sortEvents(events)` — active first, then by date descending
- `isActiveEvent(event)` — checks if event has no end date
- `getUserMessage(error)` — maps error_code to user-friendly string
- `validateEmail/Password/Name/Color/Comment/DateRange` — form validation

### `@lifespan/hooks`
TanStack Query hooks for all API operations:

- `useTimeline(params?)`, `useWeekTimeline(params)`
- `useEvents(params?)`, `useCreateEvent()`, `useUpdateEvent()`, `useCloseEvent()`, `useDeleteEvent()`
- `useCategories()`, `useCreateCategory()`, `useUpdateCategory()`, `useDeleteCategory()`
- `useDayStates()`, `useCreateDayState()`, `useUpdateDayState()`, `useDeleteDayState()`
- `useDays(params)`, `useUpsertDay()`
- `useLogin()`, `useRegister()`
- `useOnboarding()` — manages onboarding flow with sidebar highlighting steps
- `useTranslation()`, `useTheme()` — i18n and theme contexts
- `ApiContext` + `useApi()` — provides API instance to hooks

### `@lifespan/i18n`
Internationalization:

- Supported languages: English (`en`), Ukrainian (`uk`)
- `createTranslate(language)` — creates a translate function
- `translate(language, key, params)` — one-shot translate with interpolation
- Auto-detection of browser language on first launch
- Persistent language preference via localStorage

### `@lifespan/theme`
Theme tokens for light and dark modes:

- `getThemeTokens(resolvedTheme)` — returns semantic color tokens
- `ThemePreference` = `'system' | 'light' | 'dark'`
- CSS variables defined in `globals.css` and toggled via `data-theme` attribute
- System theme detection with live media query listener

### `@lifespan/utils`
Pure utility functions:

- Date formatting: `formatDate`, `formatDayShort`, `formatDayNumber`, `formatMonthYear`, `formatDateRange`, `formatRelative`, `todayISO`, `isToday`, `durationInDays`
- Color helpers: `hexToRgba`, `isLightColor`, `contrastTextColor`, `COLOR_PALETTE`

### `@lifespan/constants`
Shared constants:

- `QUERY_KEYS` — TanStack Query key factories
- `STALE_TIMES` — cache staleness configuration
- `ERROR_MESSAGES` — error_code → user-friendly message mapping
- Validation constants: `MAX_COMMENT_LENGTH`, `MIN_PASSWORD_LENGTH`, etc.

## Features

| Feature | Web | Mobile |
|---------|-----|--------|
| Login / Register | Yes | Yes |
| Vertical Timeline | Yes | Yes |
| Week View | Yes | Yes |
| Create/Edit/Close/Delete Events | Yes | Yes |
| Set/Clear Day Mood | Yes | Yes |
| CRUD Categories | Yes | Yes |
| CRUD Day States (Moods) | Yes | Yes |
| Category Suggestions | Yes | Yes |
| Mood Suggestions | Yes | Yes |
| Dark / Light / System Theme | Yes | Yes |
| Language Switcher (en/uk) | Yes | Yes |
| Collapsible Sidebar | Yes | — |
| Onboarding with Sidebar Highlights | Yes | — |
| Date Range Filtering | Yes | — |
| Color Picker | Yes | Yes |
| JWT Token Storage | localStorage | SecureStore |
| Error Handling (error_code) | Toast | Alert |

## Zustand Stores (Web)

| Store | Key | Purpose |
|-------|-----|---------|
| `auth-store` | `lifespan_token`, `lifespan_user` | JWT token and user object |
| `theme-store` | `lifespan_theme` | Theme preference (system/light/dark) |
| `language-store` | `lifespan_language` | Language code (en/uk) |
| `sidebar-store` | `lifespan_sidebar_collapsed` | Sidebar expanded/collapsed state |
| `view-store` | `lifespan_timeline_mode` | Timeline display mode |

## Onboarding Flow

The onboarding guides new users through the app with sidebar-highlighting steps:

1. **Welcome** — introduction to TimeFlux
2. **Highlight Timeline** — points to and explains the Timeline tab
3. **Highlight Events** — points to and explains the Events tab
4. **Highlight Categories** — points to and explains the Categories tab
5. **Highlight Moods** — points to and explains the Moods tab
6. **Highlight Settings** — points to and explains the Settings tab
7. **Day** — prompts user to try tapping a day
8. **First Memory** — encourages adding a mood or photo

Each highlight step visually rings the corresponding sidebar item and shows an explanatory tooltip beside it.

## Demo

Use the backend demo user:
- Email: `demo@lifespan.app`
- Password: `demo1234`
