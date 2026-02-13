# LifeSpan — Life Timeline API

Backend API for building a visual timeline of your life. Track events, periods, and daily moods with user-defined categories and colors.

## Stack

- **NestJS** + TypeScript
- **PostgreSQL** + Prisma ORM
- **JWT** authentication
- **Swagger** API docs at `/api/docs`
- **Hetzner S3** (presigned URLs for file uploads)

## Quick Start

### Prerequisites

- Node.js >= 18
- PostgreSQL (local or Docker)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lifespan?schema=public"
JWT_SECRET="your-secure-random-secret"
JWT_EXPIRES_IN="7d"
```

### 3. Set up database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed demo data
npm run prisma:seed
```

### 4. Run

```bash
# Development (watch mode)
npm run start:dev

# Production
npm run build
npm run start:prod
```

The API is available at `http://localhost:3000`.
Swagger docs at `http://localhost:3000/api/docs`.

## Demo User

| Field    | Value              |
|----------|--------------------|
| Email    | demo@lifespan.app  |
| Password | demo1234           |

## API Endpoints

| Method | Endpoint                     | Description                    |
|--------|------------------------------|--------------------------------|
| POST   | /api/v1/auth/register        | Register a new user            |
| POST   | /api/v1/auth/login           | Login                          |
| GET    | /api/v1/categories           | List categories                |
| POST   | /api/v1/categories           | Create category                |
| PATCH  | /api/v1/categories/:id       | Update category                |
| DELETE | /api/v1/categories/:id       | Delete category                |
| GET    | /api/v1/day-states           | List day states                |
| POST   | /api/v1/day-states           | Create day state               |
| PATCH  | /api/v1/day-states/:id       | Update day state               |
| DELETE | /api/v1/day-states/:id       | Delete day state               |
| POST   | /api/v1/events               | Create event                   |
| PATCH  | /api/v1/events/:id           | Update event                   |
| POST   | /api/v1/events/:id/close     | Close an active event          |
| DELETE | /api/v1/events/:id           | Delete event                   |
| GET    | /api/v1/events?from=&to=     | List events (date range)       |
| PUT    | /api/v1/days/:date           | Set day state                  |
| GET    | /api/v1/days?from=&to=       | List days (date range)         |
| GET    | /api/v1/timeline             | Vertical timeline view         |
| GET    | /api/v1/timeline/week?date=  | Week view                      |
| POST   | /api/v1/uploads/presigned-url| Get S3 upload URL              |

## Scripts

```bash
npm run start:dev        # Development server
npm run build            # Build for production
npm run prisma:generate  # Regenerate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:seed      # Seed database
npm run prisma:studio    # Open Prisma Studio
```

## Architecture

See [docs/architecture.md](docs/architecture.md) for detailed documentation.
