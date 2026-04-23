# Product Requirements Document (PRD)

## AI-Powered Job Application Assistant

Version: 1.0
Date: 2026-04-23
Owner: PMA Team
Status: Approved for Build

## 1. Source of Truth and Change Control

This PRD is the single source of truth for implementation across frontend, backend, and data science.

Rules:

- All build decisions must map to this PRD.
- If a requirement is not defined here, it is out of scope until this document is updated.
- Any change request must be added as a new version section before implementation.
- In case of conflict between old notes and implementation details, this PRD wins.

## 2. Product Vision

Build a web application (preferred over desktop) that streamlines the job application process by providing users with an AI co-pilot for:

- Profile-based application support
- Resume-to-job matching and improvement guidance
- Tailored application answers
- Application pipeline tracking

## 3. Objectives

Primary objectives:

- Reduce user time spent on repetitive application tasks.
- Improve quality of job application materials.
- Increase clarity of where each application stands.
- Create a trustworthy, editable, human-in-control AI experience.

Success criteria:

- End-to-end onboarding flow completed successfully.
- Users can analyze resume vs JD and receive structured, actionable output.
- Users can generate, edit, and copy tailored answers.
- Dashboard shows clear application statuses.

## 4. Core Features (Must Have)

1. Autofill Agent

- Securely stores user profile data: identity, contact, work history, education, skills, preferences.
- Provides intelligent form-fill payloads for job application fields.
- User remains in control (review/edit before submission).

2. Resume-to-JD Scoring Agent

- Inputs: resume text/file + job description (URL or text).
- Outputs: match score + structured suggestions to improve fit.
- Must return consistent JSON schema.

3. Tailored Answer Agent

- Inputs: user profile + job description + application question.
- Outputs: personalized, high-quality suggested answer text.
- User can edit/copy/regenerate.

4. Job Application Dashboard

- Shows each application lifecycle state.
- Minimum supported statuses:
- Not Submitted
- Submitted
- Received Initial Response
- Interview Requested
- Onsite/Video Interview Requested
- Rejected After Interview

## 5. Platform and Scope

In scope:

- Responsive web app (desktop first, mobile supported).
- High-fidelity onboarding wizard UI.
- Job search results and job detail overview UI.
- Backend APIs for user profile, resume analysis, answer generation.
- DS service logic for scraping, prompting, parsing, structured output.

Out of scope (v1):

- Browser extension release (optional future work).
- Full production infra automation.
- Advanced ranking/personalization models beyond prompt-based approach.

## 5.1 Deployment Stack Decision (Mandatory)

Chosen production stack:

- Application platform: Next.js App Router (single full-stack codebase)
- Hosting and deployment: Vercel
- Runtime: Node.js 20.x
- Persistent data store: Managed PostgreSQL (recommended Neon or Supabase)
- Observability: Vercel request logs plus Sentry error tracking

Rationale:

- Enables fast deployment with one codebase for frontend and backend APIs.
- Reduces operational overhead while meeting full-stack requirements.
- Provides straightforward scaling for UI and API routes.

Deployment constraints:

- Local in-memory storage is allowed only for development prototypes.
- Production must use persistent database storage.
- Secrets must be managed as environment variables on deployment platform.

## 6. User Experience and Visual Requirements (From Reference Screens)

Global style requirements:

- Light gray page background.
- Centered white cards/containers with clean spacing.
- Thin dark frame around primary content region where applicable.
- Top row with Back action, progress bar, and progress percent.
- Rounded chips/pills for selectable options.
- Primary CTA: Save and Continue, disabled until valid selection.
- Emphasis color: blue-cyan accent for selected states and progress.
- UX principle: AI as co-pilot, user can review and override.

### 6.1 Onboarding Steps (Required)

Step 1 (11%): Values in a new role

- Prompt: What do you value in a new role?
- Constraint: select up to 3.
- Chip-based multi-select.

Step 2: Role interests and specializations

- Prompt: What kinds of roles are you interested in?
- Constraint: select up to 5 role areas.
- Search by job title input.
- Category groups with chips (example categories shown in reference: Technical and Engineering, Finance and Strategy, Creative and Design, Education and Training, Legal and Support, Life Sciences).
- Specialization panel appears for selected role family (example shown for AI and Machine Learning with specialization checklist).

Step 3 (33%): Work location preferences

- Prompt: Where would you like to work?
- Grouped by country (examples shown: United States, Canada, United Kingdom, Australia).
- City-level selectable options with remote-tag items.
- Country-level select-all controls.
- Add Location action per country section.

Step 4 (40%): Role level

- Prompt: What level of roles are you looking for?
- Constraint: select up to 2.
- Levels shown include Internship, Entry, Junior, Mid, Senior, Expert/Leadership.
- Conditional follow-up section appears for leadership preference when senior/leadership selected.

Step 5 (50%): Company size

- Prompt: What is your ideal company size?
- Multi-select size bands.
- Includes Unselect all sizes control.

Step 6 (60%): Industry preferences

- Prompt A: industries exciting to user.
- Prompt B: industries user does not want.
- Two separate chip groups in the same step.

Step 7 (70%): Skills

- Prompt: What skills do you have or enjoy working with?
- Search field for skills.
- Include chips for selected skills.
- Exclude list for skills user does not want to work with.

Step 8 (80%): Minimum expected salary

- Prompt: minimum expected salary.
- Slider input with prominent numeric badge.
- Currency shown as USD.

Step 9 (100%): Job search status

- Prompt: Lastly, what is the status of your job search?
- Options include:
- Actively looking
- Not looking but open to offers
- Not looking and closed to offers
- Save action at completion.

### 6.2 Job Search Results and Job Detail Views (Required)

Results screen:

- Left column: job list with search/filter controls.
- Center/detail region: selected job details.
- Action buttons: Save and Apply.
- Tabs or segmented toggle for Summary and Full Job Posting.

Overview-focused detail panel:

- Left sub-panel: job/company snapshot, salary if present, level tags, location, category chips, required skills.
- Main sub-panel: summary of match alignment, requirements, responsibilities, desired qualifications.
- Referral/insight cards supported in layout.

## 7. Functional Requirements by Team

## 7.1 Frontend Requirements

Tech:

- React.js or Next.js.
- Componentized architecture with reusable UI primitives.
- State management with hooks (useState, useEffect, useContext or equivalent).
- Service layer for API calls.

Required frontend modules:

- Onboarding wizard engine:
- Step routing/state persistence
- Validation rules per step
- Progress indicator and navigation controls
- Profile/settings views
- Resume analyzer view
- Generated answer component
- Job search results page
- Job overview/details page
- Dashboard status tracker view

Behavior requirements:

- Save and Continue disabled until step validity is met.
- All AI-generated content is editable before use.
- User feedback controls available for AI quality (minimum thumbs up/down or equivalent signal).

Frontend acceptance criteria:

- UI visually matches provided reference direction (layout, spacing, controls, progress behavior).
- Desktop and mobile responsive behavior.
- Mock mode available for all major flows prior to backend integration.

## 7.2 Backend Requirements

Tech:

- Node.js/Express or Python/Flask/FastAPI (implementation choice allowed).
- Structured logging enabled from day one.
- Health endpoint required.

Required APIs (minimum contract):

- POST /api/users
- Purpose: create user profile.
- GET /api/users/{userId}
- Purpose: fetch user profile.
- POST /api/resume/analyze
- Purpose: trigger resume-to-JD scoring workflow.
- POST /api/generate/answer
- Purpose: generate tailored answer text.

Additional required APIs for product completeness:

- POST /api/applications
- PUT /api/applications/{applicationId}/status
- GET /api/applications?userId={id}
- GET /api/jobs/search (mock or provider-backed)
- GET /api/jobs/{jobId}

Backend behavior requirements:

- Input validation on every endpoint.
- Contract-consistent JSON responses.
- Error shape standardized.
- Request IDs and timing logged.
- Sensitive fields protected.

Backend acceptance criteria:

- All required endpoints return documented schemas.
- Health endpoint reports service state.
- Logs capture requests, key workflow steps, and failures.

## 7.3 Data Science Requirements

Core responsibilities:

- Build agent workflows for scraping, prompting, parsing.
- Ensure structured output reliability.
- Define and maintain data contracts with backend.

Required DS components:

1. Job Description Scraper Tool

- Input: job URL.
- Output: cleaned JD text.
- Must remove noisy content (nav, footer, ads where possible).

2. Resume Scoring Workflow

- Input: resume text + JD URL/text.
- Steps:
- scrape JD (if URL)
- build prompt
- call LLM
- parse and validate JSON
- Output schema must include score and suggestions.

3. Tailored Answer Workflow

- Input: user profile + JD text + question.
- Prompt LLM as career coach.
- Return high-quality answer string.

4. Prompt Prototyping and Reliability

- Use iterative prompt refinement.
- Use few-shot examples for structured output reliability.
- Define fallback behavior on parse failure.

DS acceptance criteria:

- Resume analysis returns valid structured JSON for agreed schema.
- Tailored answer generation is coherent, role-specific, and editable.
- Scraper tool works on multiple job page formats with acceptable quality.

## 8. Data Contracts (Canonical v1)

## 8.1 User Profile Schema (logical)

- userId: string
- fullName: string
- email: string
- phone: string
- locationPreferences: object
- workHistory: array
- education: array
- skillsInclude: array
- skillsExclude: array
- rolePreferences: array
- roleLevels: array
- companySizePreferences: array
- industryInclude: array
- industryExclude: array
- salaryMinimumUsd: number
- jobSearchStatus: enum

## 8.2 Resume Analyze Request/Response

Request:

- userId: string (optional if resume supplied directly)
- resumeText: string
- jdUrl: string (optional)
- jdText: string (optional)

Response:

- score: integer (0-100)
- summary: string
- strengths: array of strings
- gaps: array of strings
- suggestions: array of strings
- extractedKeywords: array of strings

## 8.3 Generate Answer Request/Response

Request:

- userId: string
- jdText: string
- question: string
- tone: string (optional)
- maxLength: integer (optional)

Response:

- answer: string
- alternatives: array of strings (optional)
- rationale: string (optional)

## 8.4 Standard Error Response

- error: object
- code: string
- message: string
- requestId: string

## 9. Non-Functional Requirements

- Security:
- Protect user PII.
- Do not expose secrets in frontend.
- Use secure transport and secure secret handling.

- Reliability:
- Graceful handling of LLM and scraper failures.
- Retries and timeout strategy for external calls.

- Performance:
- Onboarding step transitions should feel immediate.
- Resume analysis should provide progress/loading state.

- Observability:
- Structured logs for request lifecycle and AI workflow steps.
- Health endpoint and basic service status checks.

## 10. Agentic UX Rules (Mandatory)

- Show when AI is working.
- Let user edit/reject AI outputs.
- Keep clear boundaries between suggestions and user-submitted final content.
- Collect explicit feedback on AI quality.

## 11. Delivery Plan

Phase 1: UX and Foundation

- Build all onboarding screens and results/detail screens with mock data.
- Finalize API contracts and shared types.

Phase 2: Backend and DS Integration

- Implement required APIs.
- Integrate scraper and LLM workflows.
- Connect frontend service layer to live endpoints.

Phase 3: Hardening

- Validation, logging, error handling improvements.
- Quality tuning for prompts and parsing.
- End-to-end testing.

## 12. Testing and Definition of Done

Must-pass checks:

- All onboarding steps complete with validation and expected progress markers.
- Resume analysis API returns schema-valid output.
- Tailored answer API returns usable editable output.
- Dashboard statuses can be created/read/updated.
- Results and overview pages render with realistic data.
- Mobile responsiveness verified for primary flows.

Definition of Done:

- Product behavior matches this PRD.
- No critical contract mismatch between FE, BE, DS.
- Core user journeys run end-to-end without blockers.

## 13. Risks and Mitigations

- Risk: Scraper fragility across job sites.
- Mitigation: robust parsing pipeline, fallback to manual JD paste.

- Risk: Inconsistent LLM JSON output.
- Mitigation: strict prompt schema instructions, few-shot examples, parser validation and retry.

- Risk: UX drift from references.
- Mitigation: shared component library and visual QA checklist.

## 14. Build Governance

This PRD is mandatory build governance.

- Engineers must reference requirement IDs/sections in pull requests.
- Any feature not covered by this PRD is deferred.
- Updates require explicit version bump and approval note in this file.

## 15. Role Assignment Details (Complete Consolidation)

This section consolidates assignment guidance for all three tracks and is binding for delivery.

### 15.1 Frontend Engineer Assignment (Detailed)

Phase 1: Pre-Office Hours Preparation (1 week)

- Research agentic UX principles and translate findings into concrete UI behavior.
- Map full user journey for onboarding, activation, interaction, and feedback.
- Create low-fidelity wireframes for:
- Profile/Settings screen
- Main assistant interface
- Resume score dashboard/modal
- Generated answer component with copy/edit flows

Expected outputs from Phase 1:

- User flow diagram for each core feature.
- Wireframes for primary screens.
- Risk notes for implementation challenges.

Phase 2: Development

- Initialize React.js or Next.js project.
- Build static components first with mock data.
- Implement key frontend modules:
- User profile form
- Resume analyzer component
- Generated answer component
- Implement state management using hooks and context-equivalent patterns.
- Create a dedicated API service layer to separate network logic from UI components.

Frontend quality bar:

- Intuitive, trustworthy interface.
- AI outputs visible, editable, and user controlled.
- Feedback loop for AI quality is built in.

### 15.2 Backend Engineer Assignment (Detailed)

Phase 1: Preparation

- Research agentic system design constraints for AI-assisted products.
- Create high-level architecture diagram including:
- Client frontend
- API layer
- Agent logic integration point
- Database choice and rationale
- External LLM provider integration
- Plan initial local execution and future deployment direction.
- Plan logging and observability approach including health checks.

Expected outputs from Phase 1:

- Architecture diagram.
- Local run strategy.
- Logging and health check plan.

Phase 2: Development

- Set up project and database connectivity.
- Define schemas/models aligned with data contracts.
- Implement core endpoints:
- POST /api/users
- GET /api/users/{userId}
- POST /api/resume/analyze
- POST /api/generate/answer
- Add logging for incoming requests, workflow milestones, and failures.

Backend quality bar:

- Secure, scalable foundation.
- Reliable contracts with frontend and data science.
- Observable request and agent execution lifecycle.

### 15.3 Data Scientist Assignment (Detailed)

Phase 1: Preparation

- Research web scraping techniques and job-page extraction constraints.
- Evaluate agent frameworks and design patterns centered on tool use and planning.
- Design workflow diagrams for:
- Resume scorer flow
- Tailored answer flow
- Define exact data contracts for input fields and output schemas.

Expected outputs from Phase 1:

- Agent workflow diagrams.
- Proposed data models/contracts.
- Prompt strategy notes.

Phase 2: Development

- Build scraper tool returning clean JD text.
- Prototype and iterate prompts for quality and consistency.
- Use few-shot prompts for structured output reliability.
- Build orchestration function that runs:
- scrape
- prompt format
- LLM call
- parse/validate output
- Organize code for backend import and invocation.

Data science quality bar:

- Reliable structured output.
- Clear failure handling on parse/API issues.
- Reusable service functions for backend integration.

### 15.4 Office Hours Guidance

- Office hours are optional support for roadblocks.
- Development must continue without waiting for office hours.
- Teams should keep momentum and iterate continuously.

## 16. Reference Inputs and Learning Resources

Reference links captured from source material:

- YT: Deploy DeepSeek R1 using Azure AI Foundry and Build a Web Chatbot (no API charges)
- https://www.youtube.com/watch?v=pj2knBX4S1w
- Azure account and pricing entry point
- https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account
- Microsoft Q and A on billing for free trial account
- https://learn.microsoft.com/en-us/answers/questions/2283380/billing-for-free-trial-account
- DeepSeek R1 availability on Azure AI Foundry and GitHub
- https://azure.microsoft.com/en-us/blog/deepseek-r1-is-now-available-on-azure-ai-foundry-and-github/

Helpful learning resource topics captured from source material:

- Agent Development Kit walkthroughs and masterclass content.
- Intro tutorials for building AI agents from scratch in Python.
- SmolAgents and multi-agent system references.

Reference product inspiration noted in source material:

- Simplify UI/UX pattern inspiration for onboarding and job view interactions.

---

End of PRD v1.0
