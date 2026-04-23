# Deployment Guide

## Production Stack Decision

Chosen stack for deployment:

- Platform: Vercel
- App: Next.js App Router (frontend + backend APIs)
- Runtime: Node.js 20.x
- Data layer for production: managed Postgres (recommended Neon or Supabase)
- Observability: Vercel logs plus Sentry

This stack is chosen to satisfy full-stack deployment requirements with low operational overhead and good scalability.

## 1) Vercel Deployment

1. Push [pma-web](.) to a Git repository.
2. Import repository in Vercel.
3. Set project root to the pma-web directory.
4. Configure environment variables from [.env.example](.env.example).
5. Deploy.

Build command:

- npm run build

Start command:

- npm run start

Node version:

- 20.x

## 2) Docker Deployment

Build image:

- docker build -t pma-web:latest .

Run container:

- docker run -p 3000:3000 --env-file .env pma-web:latest

Health check:

- GET /api/health

## 3) Production Readiness Next Steps

Current code uses in-memory storage in [lib/store.ts](lib/store.ts). For durable deployment:

1. Replace in-memory store with managed Postgres.
2. Add schema migrations and backup strategy.
3. Add auth and role-based access controls.
4. Add rate-limiting on API endpoints.
5. Add error reporting and alerting.

## 4) Non-Functional Requirement Mapping

- Security: use managed secrets and no client-side secret exposure.
- Reliability: health endpoint exists and API validation is in place.
- Performance: Next.js optimized production build enabled.
- Observability: request logs in Vercel, optional Sentry integration.
