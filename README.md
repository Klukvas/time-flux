# LifeSpan — Visual Life Timeline

Track moods, chapters, memories, and media on an interactive timeline. Monorepo with NestJS backend, Next.js web app, and Expo mobile app.

## Tech Stack

- **Backend:** NestJS 11 + TypeScript + PostgreSQL + Prisma 7 + JWT + Swagger
- **Web:** Next.js 14 + Tailwind CSS + TanStack Query
- **Mobile:** Expo (React Native) + expo-router
- **Payments:** Paddle (Merchant of Record)
- **Storage:** Hetzner S3 (presigned URLs)
- **Auth:** Local (email/password) + Google OAuth

## Project Structure

```
├── be/                    # NestJS backend (port 3000)
│   ├── prisma/            # Schema, migrations, seed
│   └── src/
│       ├── auth/          # JWT + Google OAuth
│       ├── categories/    # Chapter categories
│       ├── chapters/      # Life chapters (EventGroups)
│       ├── day-states/    # Moods
│       ├── days/          # Day entries
│       ├── timeline/      # Timeline views
│       ├── media/         # Photo/video metadata
│       ├── s3/            # Presigned upload URLs
│       ├── memories/      # "On this day" memories
│       ├── analytics/     # Mood insights
│       ├── subscriptions/ # Paddle billing
│       └── health/        # Health check
├── fe/                    # Frontend monorepo
│   ├── apps/
│   │   ├── web/           # Next.js (port 3001)
│   │   └── mobile/        # Expo React Native
│   └── packages/
│       ├── api/           # Typed HTTP client
│       ├── hooks/         # TanStack Query hooks
│       ├── i18n/          # Translations (EN/UK)
│       ├── constants/     # Shared constants
│       ├── domain/        # Validation, business logic
│       ├── theme/         # Theme tokens
│       └── utils/         # Shared utilities
└── docker-compose.yml     # PostgreSQL for local dev
```

---

## Quick Start

### Prerequisites

- Node.js >= 18
- Docker (for PostgreSQL)

### 1. Start the database

```bash
docker-compose up -d
```

PostgreSQL will be available on `localhost:5433`.

### 2. Backend

```bash
cd be
npm install
cp .env.example .env
```

Edit `be/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/lifespan?schema=public"
JWT_SECRET="any-long-random-string"
JWT_EXPIRES_IN="7d"
PORT=3000
```

Run migrations and start:

```bash
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run start:dev
```

- API: http://localhost:3000
- Swagger docs: http://localhost:3000/api/docs

### 3. Frontend (Web)

```bash
cd fe
npm install
```

Create `fe/apps/web/.env.local` (if needed):

```env
# Only needed if testing payments or Google Maps
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
NEXT_PUBLIC_PADDLE_PRO_PRICE_ID=
NEXT_PUBLIC_PADDLE_PREMIUM_PRICE_ID=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_MAP_ID=
```

```bash
npm run -w apps/web dev
```

Web app: http://localhost:3001

### 4. Frontend (Mobile)

```bash
cd fe
npm run mobile:start
```

Set `EXPO_PUBLIC_API_URL` to your machine's LAN IP (e.g. `http://192.168.1.x:3000`).

### Demo User

| Field    | Value             |
|----------|-------------------|
| Email    | demo@lifespan.app |
| Password | demo1234          |

---

## Testing Payments (Paddle Sandbox)

Paddle is used as Merchant of Record for subscriptions. To test the full payment flow locally:

### Step 1: Create Paddle Sandbox Account

1. Go to https://sandbox-vendors.paddle.com and create an account
2. Create a **Product** (e.g. "LifeSpan Subscription")
3. Create **two Prices** under the product:
   - Pro (e.g. $4.99/month)
   - Premium (e.g. $9.99/month)
4. Copy the **Price IDs** from each price

### Step 2: Get API Credentials

From the Paddle sandbox dashboard, copy:
- **API Key** (Developer Tools > Authentication)
- **Client-side Token** (Developer Tools > Authentication)
- **Webhook Secret** (Notifications > create a webhook destination first, see Step 4)

### Step 3: Configure Environment Variables

**Backend** (`be/.env`):

```env
PADDLE_API_KEY=pdl_sbox_...
PADDLE_WEBHOOK_SECRET=pdl_ntfset_...
PADDLE_PRO_PRICE_ID=pri_...
PADDLE_PREMIUM_PRICE_ID=pri_...
PADDLE_ENVIRONMENT=sandbox
```

**Frontend** (`fe/apps/web/.env.local`):

```env
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_...
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
NEXT_PUBLIC_PADDLE_PRO_PRICE_ID=pri_...
NEXT_PUBLIC_PADDLE_PREMIUM_PRICE_ID=pri_...
```

### Step 4: Set Up Webhook Tunnel

Paddle needs to send webhook events to your local backend. Use ngrok or any tunnel:

```bash
ngrok http 3000
```

Copy the HTTPS URL (e.g. `https://abc123.ngrok.io`) and in Paddle sandbox dashboard:

1. Go to **Notifications > New destination**
2. Set URL: `https://abc123.ngrok.io/api/v1/webhooks/paddle`
3. Select events: all `subscription.*` events
4. Copy the **Webhook Secret** into your `be/.env`

### Step 5: Test

1. Open http://localhost:3001, log in
2. Go to **Settings > Subscription > Upgrade**
3. Paddle checkout will open
4. Use test card: `4242 4242 4242 4242` (any expiry, any CVV)
5. After payment, the webhook fires and your subscription activates

### Subscription Tiers

| Feature      | Free   | Pro      | Premium   |
|--------------|--------|----------|-----------|
| Media files  | 50     | 500      | Unlimited |
| Chapters     | 5      | 30       | Unlimited |
| Categories   | 5      | 20       | Unlimited |
| Moods        | 5      | 20       | Unlimited |
| Analytics    | Locked | Included | Included  |
| Memories     | Locked | Locked   | Included  |

---

## Google OAuth (Optional)

To enable Google sign-in:

1. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Set authorized redirect URI: `http://localhost:3000/api/v1/auth/google/callback`
3. Add to `be/.env`:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback
FRONTEND_URL=http://localhost:3001
```

---

## Useful Commands

### Backend (`cd be`)

```bash
npm run start:dev        # Development server (watch mode)
npm run build            # Build for production
npm run start:prod       # Run production build
npm run prisma:generate  # Regenerate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:seed      # Seed demo data
npm run prisma:studio    # Open Prisma Studio GUI
npm test                 # Run tests
npm run test:cov         # Tests with coverage
```

### Frontend (`cd fe`)

```bash
npm run -w apps/web dev       # Web dev server
npm run -w apps/web build     # Web production build
npm run mobile:start          # Expo dev server
npm run mobile:ios            # iOS simulator
npm run mobile:android        # Android emulator
```

---

## Public Pages (No Auth Required)

- `/` — Landing page
- `/terms` — Terms of Service
- `/privacy` — Privacy Policy
