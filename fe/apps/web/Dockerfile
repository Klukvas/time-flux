# ============================================
# Stage 1: Install dependencies
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

# Copy root workspace manifests
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/

# Copy all workspace package manifests
COPY packages/api/package.json ./packages/api/
COPY packages/constants/package.json ./packages/constants/
COPY packages/domain/package.json ./packages/domain/
COPY packages/hooks/package.json ./packages/hooks/
COPY packages/i18n/package.json ./packages/i18n/
COPY packages/theme/package.json ./packages/theme/
COPY packages/utils/package.json ./packages/utils/

RUN npm ci

# ============================================
# Stage 2: Build the application
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY . .

# Next.js collects anonymous telemetry — disable in CI
ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* vars are baked in at build time
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build -w apps/web

# ============================================
# Stage 3: Production image
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nextjs && \
    adduser --system --uid 1001 nextjs

# Copy Next.js standalone output and static assets
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nextjs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
