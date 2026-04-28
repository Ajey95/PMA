# PMA: AI-Powered Job Application Assistant

Welcome to the **PMA (Personalized Mentorship Assistant)** project! This repository serves as the single source of truth for the AI-Powered Job Application Assistant. It's designed to streamline the job application process by providing users with an intelligent co-pilot.

## 📖 Project Overview

This application reduces the time users spend on repetitive application tasks while drastically improving the quality of their job application materials. It features a trustworthy, editable, and human-in-control AI experience.

For the comprehensive product vision, requirements, and data contracts, please refer to our canonical [Product Requirements Document (PRD)](PRD.md).

## ✨ Core Features

1. **Autofill Agent:** Securely manages user profiles and intelligently provides payloads for job application fields.
2. **Resume-to-JD Scoring Agent:** Analyzes resumes against Job Descriptions (URLs or text) and outputs a match score alongside structured, actionable suggestions.
3. **Tailored Answer Agent:** Acts as a career coach to generate personalized, high-quality answers to job application questions based on the user's profile and the JD.
4. **Job Application Dashboard:** Provides clear, end-to-end tracking of application states (e.g., Submitted, Interview Requested, Rejected).

## 🏗️ Technology Stack

The project uses a unified full-stack architecture optimized for fast iteration and deployment:

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Backend API:** Node.js serverless functions (Next.js API Routes)
- **Database:** PostgreSQL (with local in-memory/JSON fallback for dev)
- **Deployment:** Vercel (recommended) or Docker Container
- **AI Integrations:** Groq / DeepSeek R1 (configurable via API keys)
- **Observability:** Vercel logs & Sentry error tracking

## 📂 Repository Structure

- `PRD.md`: The canonical Product Requirements Document. **All build decisions must map back to this document.**
- `pma-web/`: The main Next.js full-stack application.
  - `app/`: Next.js App Router frontend pages and API routes.
  - `components/`: Reusable React UI components.
  - `lib/`: Shared TypeScript data contracts, core business logic, and backend services.
  - `public/`: Static assets.

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js 22.x or 24.x

### Setup

1. Clone this repository and navigate to the web app directory:
   ```bash
   cd pma-web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Environment Variables:
   Copy `.env.example` to `.env` and fill in the necessary keys (e.g., `GROQ_API_KEY`, `PMA_SESSION_SECRET`, `DATABASE_URL`).
4. Run the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

### Code Quality Checks
To ensure code quality before pushing:
```bash
npm run lint
npm run typecheck
npm run build
npm run check
```

## 🔌 Core API Endpoints

The backend exposes several core capabilities in `pma-web/app/api`:

- **Auth & Users:** `/api/auth/signup`, `/api/auth/login`, `/api/users`, `/api/auth/me`, `/api/auth/logout`, `/api/session`
- **Core AI:** 
  - `POST /api/resume/analyze`: Triggers resume-to-JD scoring workflow.
  - `POST /api/generate/answer`: Generates tailored answer text.
  - `POST /api/autofill`: Generates form-fill data based on the user profile.
- **Jobs & Applications:** `/api/jobs/search`, `/api/jobs/{jobId}`, `/api/applications`, `/api/applications/{applicationId}/status`

*Note: API responses use a standard `{ data, requestId }` format on success and `{ error: { code, message, requestId } }` on failure.*

## 🔒 Security & Data Privacy

- Passwords are cryptographically hashed using Node's `scrypt`; raw passwords are never stored.
- User sessions are managed via signed, HTTP-only session cookies.
- User-supplied JD URLs are restricted to public `http`/`https` schemes to prevent SSRF vulnerabilities.
- User PII is protected, and any AI outputs are strictly editable by the user before submission.
- AI endpoints have deterministic fallbacks when external API keys are not configured.

## 🚢 Deployment

For complete deployment details, refer to `pma-web/DEPLOYMENT.md` and the included `Dockerfile`.

The easiest path to production is deploying the `pma-web` directory to **Vercel** and linking a managed PostgreSQL instance (like Neon or Supabase) via the `DATABASE_URL` environment variable.

---
*Built with ❤️ by the PMA Team.*
