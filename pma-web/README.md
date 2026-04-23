# PMA Web

AI-Powered Job Application Assistant built from the PRD in [../PRD.md](../PRD.md).

## Chosen Deployable Stack

- Frontend and backend: Next.js App Router on Vercel
- API runtime: Node.js serverless functions
- Data contracts and services: TypeScript in [lib](lib)
- Recommended persistent data for production: managed Postgres (Neon or Supabase)
- Recommended observability: Vercel logs + Sentry

Why this stack:

- Fastest path from local to production deployment
- One codebase for frontend and backend APIs
- Good scaling model for mixed UI and API workloads
- Low operational overhead while meeting PRD functional scope

## Local Development

Prerequisite:

- Node 20.x

Install and run:

- npm install
- npm run dev

Quality checks:

- npm run lint
- npm run typecheck
- npm run build
- npm run check

## API Endpoints

- GET /api/health
- POST /api/users
- GET /api/users/{userId}
- POST /api/resume/analyze
- POST /api/generate/answer
- GET /api/jobs/search
- GET /api/jobs/{jobId}
- POST /api/applications
- GET /api/applications?userId={id}
- PUT /api/applications/{applicationId}/status

## Deploy

Vercel deployment is documented in [DEPLOYMENT.md](DEPLOYMENT.md).

Container deployment is also supported with [Dockerfile](Dockerfile).
