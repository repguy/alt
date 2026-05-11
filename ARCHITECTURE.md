# ALT — Architecture Documentation

> Last updated: May 2026

This document is the definitive technical reference for the ALT Agency Automation Platform. It covers every system component, data flow, authentication model, API contract, database schema, and deployment model.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Monorepo Structure](#2-monorepo-structure)
3. [Frontend Application](#3-frontend-application)
4. [API Server](#4-api-server)
5. [Database Schema](#5-database-schema)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [API Contract — Contract-First Pattern](#7-api-contract--contract-first-pattern)
8. [Data Flow Diagrams](#8-data-flow-diagrams)
9. [Security Model](#9-security-model)
10. [Multi-Tenancy Model](#10-multi-tenancy-model)
11. [Billing & Plans](#11-billing--plans)
12. [White-Label System](#12-white-label-system)
13. [AI / Async Processing](#13-ai--async-processing)
14. [Deployment Architecture](#14-deployment-architecture)
15. [Environment Variables](#15-environment-variables)
16. [Development Workflows](#16-development-workflows)

---

## 1. System Overview

ALT is a full-stack, multi-tenant SaaS application that enables digital agencies to automate:

- **Website audits** — AI-scored analysis across 6 dimensions (SEO, Performance, Accessibility, UX, Conversion, Mobile)
- **Lead generation** — AI-powered prospect discovery by niche + location
- **Proposal management** — Build, send, and track service proposals with line items
- **Client CRM** — Full client lifecycle with notes, activity timeline, linked proposals
- **Outreach campaigns** — Email campaign creation with merge-tag templating
- **Analytics** — MRR, ARR, pipeline funnel, proposal win rate — all from real data
- **White-label** — Per-workspace brand name, color, domain, and email sender

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Replit Shared Proxy (HTTPS)               │
│                  Routes by path prefix (/api, /)             │
└───────────────────┬─────────────────────┬───────────────────┘
                    │                     │
          ┌─────────▼──────┐    ┌─────────▼──────┐
          │  Express API   │    │  React + Vite  │
          │  (port 8080)   │    │  (port 18928)  │
          │  /api/*        │    │  /             │
          └────────┬───────┘    └────────────────┘
                   │
        ┌──────────▼──────────┐
        │   PostgreSQL DB     │
        │   (Replit managed)  │
        └─────────────────────┘
                   │
        ┌──────────▼──────────┐
        │  Clerk Auth (proxy) │
        │  /api/__clerk/*     │
        └─────────────────────┘
```

---

## 2. Monorepo Structure

```
workspace/
├── artifacts/
│   ├── alt/                    # React + Vite frontend (SPA)
│   └── api-server/             # Express 5 API backend
├── lib/
│   ├── api-spec/               # OpenAPI 3.1 spec (source of truth)
│   ├── api-zod/                # Generated Zod schemas (do not edit)
│   ├── api-client-react/       # Generated React Query hooks (do not edit)
│   └── db/                     # Drizzle ORM schema + migrations
├── scripts/                    # Utility scripts
├── pnpm-workspace.yaml         # Package catalog + workspace config
├── tsconfig.base.json          # Shared TypeScript strict defaults
├── tsconfig.json               # Root solution config (composite libs only)
└── package.json                # Root orchestration scripts
```

### Package Graph

```
api-spec  ──codegen──►  api-zod  ◄──  api-server
                    └──►  api-client-react  ◄──  alt (frontend)

db  ◄──  api-server
```

**Rules:**
- `lib/*` packages are TypeScript composite (emit declarations via `tsc --build`)
- `artifacts/*` are leaf packages (checked with `tsc --noEmit`, never emit)
- No artifact may import from another artifact — share via `lib/` packages only
- Never hand-write API types or Zod schemas — always regenerate from the spec

---

## 3. Frontend Application

**Location:** `artifacts/alt/`  
**Package:** `@workspace/alt`  
**Port:** Reads from `$PORT` env var (assigned by workflow config, default 18928 in dev)  
**Base path:** `/` (root of the shared proxy)

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Build | Vite 6 |
| UI framework | React 19 |
| Routing | Wouter |
| State / data fetching | TanStack Query v5 + generated hooks |
| Component library | shadcn/ui (Radix primitives + Tailwind) |
| Styling | Tailwind CSS v4 |
| Animations | Framer Motion |
| Charts | Recharts |
| Forms | react-hook-form + @hookform/resolvers + Zod |
| Command palette | cmdk |
| Auth | Clerk React SDK |
| Dates | date-fns |

### Directory Layout

```
artifacts/alt/src/
├── App.tsx                     # Root: ClerkProvider, Router, all routes
├── main.tsx                    # React DOM entry point
├── components/
│   ├── layout/
│   │   └── app-layout.tsx      # Sidebar shell + topbar + mobile drawer
│   ├── command-palette.tsx     # Cmd+K command palette (cmdk)
│   ├── dialogs/
│   │   ├── new-audit-dialog.tsx
│   │   ├── create-proposal-dialog.tsx
│   │   └── add-lead-dialog.tsx
│   └── ui/                     # shadcn/ui components (generated)
├── pages/
│   ├── marketing/
│   │   └── landing.tsx         # Public landing page (/)
│   ├── auth/
│   │   ├── sign-in.tsx         # Clerk SignIn component
│   │   └── sign-up.tsx         # Clerk SignUp component
│   ├── onboarding/
│   │   └── index.tsx           # Multi-step onboarding wizard
│   ├── dashboard.tsx
│   ├── audits/
│   │   ├── index.tsx           # Audits list
│   │   └── detail.tsx          # Audit detail + scores + issues
│   ├── leads/
│   │   ├── index.tsx           # Leads pipeline table
│   │   └── find.tsx            # AI Lead Finder form
│   ├── proposals/
│   │   ├── index.tsx           # Proposals list
│   │   └── detail.tsx          # Proposal detail + line items
│   ├── clients/
│   │   ├── index.tsx           # Clients grid
│   │   └── detail.tsx          # Client CRM + notes
│   ├── campaigns/
│   │   ├── index.tsx           # Campaigns list
│   │   ├── new.tsx             # Campaign creation form
│   │   └── detail.tsx          # Campaign stats + template
│   ├── analytics.tsx           # MRR / pipeline charts
│   ├── billing.tsx             # Subscription + usage limits
│   ├── settings.tsx            # User profile (Clerk-managed)
│   ├── whitelabel.tsx          # Brand config form
│   └── not-found.tsx
└── hooks/
    └── use-toast.ts            # Toast notifications
```

### Routing Model

All routing uses **Wouter** (lightweight React Router alternative).

```
/                   → LandingPage (signed-out) | Redirect to /dashboard (signed-in)
/sign-in            → Clerk SignIn component
/sign-up            → Clerk SignUp component
/onboarding         → OnboardingWizard (shown once, after first sign-up)
/dashboard          → Dashboard
/audits             → AuditsList
/audits/:id         → AuditDetail
/leads              → LeadsList
/leads/find         → AI Lead Finder
/proposals          → ProposalsList
/proposals/:id      → ProposalDetail
/clients            → ClientsList
/clients/:id        → ClientDetail
/campaigns          → CampaignsList
/campaigns/new      → CampaignNew
/campaigns/:id      → CampaignDetail
/analytics          → Analytics
/whitelabel         → Whitelabel
/settings           → Settings
/billing            → Billing
```

All routes under the `AppShellRoutes` component are protected by `<Show when="signed-in">` — Clerk will redirect unauthenticated users to `/sign-in` automatically.

### Key Frontend Patterns

**API calls:** Always via generated hooks from `@workspace/api-client-react`. Never use `fetch()` directly.

```tsx
import { useListAudits, useCreateAudit } from "@workspace/api-client-react";

const { data: audits, isLoading } = useListAudits();
const createAudit = useCreateAudit();
createAudit.mutate({ data: { url: "https://example.com" } });
```

**Toast notifications:** Always via `useToast` from `@/hooks/use-toast`.

**Forms:** Always `react-hook-form` + `zodResolver` + Zod schema.

**Dark mode:** Enforced at the HTML root via `class="dark"` — no toggle.

**Page transitions:** Framer Motion `AnimatePresence` wraps page content in `app-layout.tsx`, keyed by route location for smooth slide/fade transitions.

---

## 4. API Server

**Location:** `artifacts/api-server/`  
**Package:** `@workspace/api-server`  
**Port:** Reads from `$PORT` env var (default 8080 in dev)  
**Base path:** `/api` — all routes are prefixed with `/api`

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 24 |
| Framework | Express 5 |
| Auth middleware | @clerk/express |
| ORM | Drizzle ORM |
| Database | PostgreSQL (via `pg`) |
| Validation | Zod schemas from `@workspace/api-zod` |
| Logging | pino + pino-http |
| Security | helmet + express-rate-limit |
| Build | esbuild (CJS bundle output) |

### Middleware Stack (in order)

```
1. pino-http          → Request/response logging (no console.log)
2. helmet             → Security headers (HSTS, X-Content-Type, etc.)
3. Clerk proxy        → Forwards /api/__clerk/* to Clerk's backend
4. cors               → Credentials + wildcard origin (dev) or domain whitelist (prod)
5. express.json       → Body parsing (1MB limit)
6. express.urlencoded → Form body parsing (1MB limit)
7. clerkMiddleware    → Sets req.auth on all requests (does NOT enforce auth)
8. generalLimiter     → 200 req/min per IP on all /api routes
9. strictLimiter      → 30 req/min per IP on POST /api/audits, POST /api/leads
10. Router            → All route handlers
```

### Route Layout

```
artifacts/api-server/src/routes/
├── index.ts           → Master router (mounts all sub-routers)
├── health.ts          → GET /healthz
├── users/             → GET/PATCH /users/me
├── workspaces/        → GET/PATCH /workspaces/current, GET /workspaces/current/members
├── audits/            → CRUD /audits + POST /audits (triggers async scoring)
├── leads/             → CRUD /leads + POST /leads/find (AI simulation)
├── proposals/         → CRUD /proposals + POST /proposals/:id/send, /accept
├── clients/           → CRUD /clients + CRUD /clients/:id/notes
├── campaigns/         → CRUD /campaigns + POST /campaigns/:id/launch
├── analytics/         → GET /analytics/dashboard, /analytics/revenue
├── whitelabel/        → GET/PUT /whitelabel
├── blog/              → CRUD /blog/posts + POST /blog/waitlist
└── billing/           → GET /billing/subscription + GET /billing/plans
```

### Auth Middleware

```typescript
// lib/auth.ts
export async function requireAuth(req, res, next) {
  const { userId } = req.auth ?? {};
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  // Auto-provision: first sign-in creates user + workspace + member records
  let user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, userId) });
  if (!user) {
    const clerkUser = await clerkClient.users.getUser(userId);
    // INSERT into users, workspaces, workspace_members in a transaction
    user = await provisionNewUser(clerkUser);
  }

  req.user = user;
  req.workspaceId = user.defaultWorkspaceId;
  next();
}
```

Every protected route handler starts with `router.use(requireAuth)`.

---

## 5. Database Schema

**Location:** `lib/db/src/schema/`  
**ORM:** Drizzle ORM  
**Database:** PostgreSQL (Replit managed, connection via `DATABASE_URL`)

### Tables Overview

| Table | Description | Key Fields |
|-------|-------------|-----------|
| `users` | Platform accounts | `clerk_id`, `email`, `plan`, `onboarding_completed` |
| `workspaces` | Tenants / organizations | `slug`, `owner_id`, `plan`, `primary_color` |
| `workspace_members` | User↔Workspace membership | `workspace_id`, `user_id`, `role`, `status` |
| `audits` | Website audit records | `workspace_id`, `url`, `status`, `overall_score`, 6 sub-scores |
| `audit_issues` | Per-audit issue items | `audit_id`, `category`, `severity`, `title`, `recommendation` |
| `leads` | Prospect pipeline | `workspace_id`, `business_name`, `status`, `audit_score` |
| `proposals` | Service proposals | `workspace_id`, `client_id`, `title`, `status`, `total_value` |
| `proposal_services` | Proposal line items | `proposal_id`, `name`, `price`, `quantity`, `recurring` |
| `clients` | CRM records | `workspace_id`, `name`, `status`, `total_revenue` |
| `client_notes` | CRM notes | `client_id`, `content`, `author_name` |
| `activity_events` | Audit trail / timeline | `workspace_id`, `type`, `description`, `entity_type`, `entity_id` |
| `campaigns` | Email outreach campaigns | `workspace_id`, `name`, `status`, `sent_count`, `open_rate` |
| `campaign_emails` | Individual email records | `campaign_id`, `to_email`, `status`, `opened_at` |
| `whitelabel_configs` | Per-workspace branding | `workspace_id`, `brand_name`, `primary_color`, `custom_domain` |
| `subscriptions` | Billing/plan limits | `workspace_id`, `plan`, `audit_limit`, `audits_used` |
| `blog_posts` | Public blog content | `slug`, `status`, `published` |
| `waitlist` | Pre-launch email list | `email`, `position` |

### Entity Relationships

```
users ─────────────────────────────── workspace_members ──── workspaces
                                                                   │
                              ┌────────────────────────────────────┤
                              │                                     │
                           audits                                leads
                              │                                     │
                        audit_issues                           proposals
                                                                   │
                                                         proposal_services
                                                                   
                         clients ─── client_notes          campaigns
                                                                │
                                                        campaign_emails
                                                        
                        subscriptions                  whitelabel_configs
                        (per workspace)                 (per workspace)
```

### Workspace Scoping

**Every data table includes a `workspace_id` foreign key.** The API server enforces this at the query level — every `SELECT`, `INSERT`, `UPDATE` always filters by `req.workspaceId`. Users can never access data from another workspace.

---

## 6. Authentication & Authorization

### Auth Provider: Clerk (Replit-managed)

ALT uses Clerk for all authentication. The Replit platform manages the Clerk tenant — no external Clerk dashboard is needed.

### Clerk Proxy Pattern

To avoid cross-origin issues on the shared Replit proxy domain, all Clerk SDK requests are routed through the Express server:

```
Browser → /api/__clerk/* → Express → Clerk backend API
```

This is configured in:
- `artifacts/api-server/src/middlewares/clerkProxyMiddleware.ts` — Express middleware that proxies to Clerk
- `artifacts/alt/src/App.tsx` — `proxyUrl={clerkProxyUrl}` prop on `<ClerkProvider>`
- `.env` — `VITE_CLERK_PROXY_URL` points to the current domain's `/api/__clerk`

### Auth Flow — First Sign-In

```
1. User clicks "Sign Up" → Clerk UI renders
2. User completes sign-up form → Clerk creates identity
3. Clerk issues session token → stored in browser cookie
4. Frontend redirects to /onboarding (localStorage "onboarding_done" not set)
5. First API request hits requireAuth middleware
6. Middleware calls Clerk to verify session token
7. No user record found → AUTO-PROVISION:
   a. Fetch Clerk user profile (name, email, avatar)
   b. INSERT into users table
   c. INSERT into workspaces table (default workspace)
   d. INSERT into workspace_members (owner role)
   e. INSERT into subscriptions (free plan)
   f. INSERT into whitelabel_configs (defaults)
8. All subsequent requests use the cached DB user record
```

### Auth Flow — Subsequent Requests

```
Browser                Express                Clerk
   │── POST /api/audits ──►│                   │
   │  (cookie: __session)  │── Verify token ──►│
   │                       │◄── userId ────────│
   │                       │── DB lookup user  │
   │                       │── Scope query to  │
   │                       │   workspace_id    │
   │◄── 200 OK ────────────│                   │
```

### Authorization Levels

| Level | Enforcement | Description |
|-------|-------------|-------------|
| Unauthenticated | No Clerk session | Landing page, blog, waitlist only |
| Authenticated | `requireAuth` middleware | All app routes, scoped to workspace |
| Workspace Owner | `role === 'owner'` check | Can modify workspace settings, billing |
| Member | `role === 'member'` | Read/write access to workspace data |

---

## 7. API Contract — Contract-First Pattern

### Overview

ALT uses a **contract-first** approach: the OpenAPI 3.1 spec is the single source of truth for the API. Code is generated from the spec — never the reverse.

```
lib/api-spec/openapi.yaml
        │
        ▼  (pnpm --filter @workspace/api-spec run codegen)
        │
   ┌────┴────────────────────────────────────────┐
   │                                             │
   ▼                                             ▼
lib/api-zod/src/generated/api.ts        lib/api-client-react/src/generated/api.ts
(Zod validation schemas)                (React Query hooks)
   │                                             │
   ▼                                             ▼
api-server (validates inputs/outputs)    alt frontend (data fetching)
```

### Adding a New Endpoint

1. Add the path + operation to `lib/api-spec/openapi.yaml`
2. Run `pnpm --filter @workspace/api-spec run codegen`
3. Generated Zod schemas appear in `lib/api-zod/src/generated/api.ts`
4. Generated React Query hooks appear in `lib/api-client-react/src/generated/api.ts`
5. Implement the route handler in `artifacts/api-server/src/routes/`
6. Use generated Zod schema to validate request body
7. Use generated hook in the frontend

### Generated Hook Naming Convention

OpenAPI `operationId` → hook name:

| operationId | Hook |
|-------------|------|
| `listAudits` | `useListAudits()` |
| `createAudit` | `useCreateAudit()` |
| `getAudit` | `useGetAudit(id)` |
| `updateAudit` | `useUpdateAudit()` |
| `deleteAudit` | `useDeleteAudit()` |

---

## 8. Data Flow Diagrams

### Website Audit Flow

```
User enters URL → POST /api/audits
                        │
                  Creates audit record (status: "pending")
                        │
                  Returns audit.id immediately (202)
                        │
                  Async setTimeout (simulates AI):
                  ┌─────────────────────────────┐
                  │  Generate 6 scores (random   │
                  │  weighted around realistic   │
                  │  averages per category)      │
                  │  Generate AI summary text    │
                  │  Generate issue list (5-15)  │
                  │  SET status = "completed"    │
                  └─────────────────────────────┘
                        │
Frontend polls /api/audits/:id (React Query refetchInterval)
until status === "completed", then re-renders with scores
```

### Lead Find Flow

```
User fills niche + location → POST /api/leads/find
                                      │
                              Async simulation (setTimeout):
                              ┌───────────────────────────┐
                              │  Generate N mock leads    │
                              │  with realistic business  │
                              │  names, emails, phones    │
                              │  and a random audit score │
                              └───────────────────────────┘
                                      │
                              Bulk INSERT into leads table
                                      │
                              Returns { inserted: N }
                                      │
Frontend navigates to /leads, React Query refetches list
```

### Proposal Lifecycle

```
draft → (send action) → sent → (accept action) → accepted
  │                                                   │
  └── can be deleted anytime                         └── revenue recorded
                                                          in analytics
```

---

## 9. Security Model

### Transport

- All traffic between browser and services goes through the Replit shared proxy over **HTTPS/TLS** — the app never handles TLS termination itself.
- The proxy uses mutual TLS between the proxy layer and the underlying services.

### HTTP Security Headers (helmet)

```
Strict-Transport-Security: max-age=15552000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 0
Referrer-Policy: no-referrer
Cross-Origin-Opener-Policy: same-origin
```

### Rate Limiting

| Scope | Limit | Window |
|-------|-------|--------|
| All `/api/*` | 200 requests | 1 minute per IP |
| POST `/api/audits` | 30 requests | 1 minute per IP |
| POST `/api/leads` (find) | 30 requests | 1 minute per IP |

### Input Validation

All request bodies are validated with Zod schemas (generated from OpenAPI spec) before reaching business logic. Malformed requests are rejected with a structured 400 error.

### Auth Token Security

- Session tokens are managed entirely by Clerk — stored in `HttpOnly` cookies
- The Express server never issues or stores session tokens
- `requireAuth` verifies the token via Clerk's SDK on every request — no local token caching

### Secrets Management

All secrets are stored as Replit environment secrets (never in code or `.env` files committed to git):

| Secret | Purpose |
|--------|---------|
| `CLERK_SECRET_KEY` | Server-side Clerk API calls |
| `CLERK_PUBLISHABLE_KEY` | Client-side Clerk initialization |
| `VITE_CLERK_PUBLISHABLE_KEY` | Frontend Clerk initialization |
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Express session signing (reserved) |

---

## 10. Multi-Tenancy Model

ALT is a **workspace-based multi-tenant** system. Each user belongs to one or more workspaces. Every data record is scoped to a workspace.

### Workspace Provisioning

On first sign-in, the `requireAuth` middleware auto-creates:

```
workspace: {
  name: "{User's name}'s Agency",
  slug: "user-name-agency",
  plan: "free",
  ownerId: userId
}

workspace_member: {
  workspaceId: newWorkspace.id,
  userId: userId,
  role: "owner",
  status: "active"
}

subscription: {
  workspaceId: newWorkspace.id,
  plan: "free",
  auditLimit: 5,
  leadLimit: 25
}

whitelabel_config: {
  workspaceId: newWorkspace.id,
  brandName: "ALT",
  primaryColor: "#6366f1"
}
```

### Data Isolation

Every database query in the API server applies `WHERE workspace_id = ?` using `req.workspaceId`. This is set in the `requireAuth` middleware from the authenticated user's workspace membership record.

---

## 11. Billing & Plans

### Plan Tiers

| Plan | Audits/mo | Leads/mo | Team Members | Features |
|------|-----------|----------|--------------|---------|
| Free | 5 | 25 | 1 | Basic audit, 1 campaign |
| Pro | 100 | 1,000 | 3 | All features, whitelabel |
| Agency | 500 | 10,000 | 10 | Priority support, API access |
| Enterprise | Unlimited | Unlimited | Unlimited | Custom SLA, SSO |

### Billing Integration

The current implementation tracks usage in the `subscriptions` table (`audits_used`, `leads_used`). The Billing page shows usage progress bars and plan details.

**To integrate real payments**: Connect Stripe (see `artifacts/alt/src/pages/billing.tsx` — the "Manage Billing in Stripe" button is already wired for a future Stripe Customer Portal URL). See the user manual section for setup steps.

---

## 12. White-Label System

Per-workspace white-label configuration lives in `whitelabel_configs`:

| Field | Purpose |
|-------|---------|
| `brand_name` | Replaces "ALT" in all UI text |
| `logo_url` | Custom logo URL |
| `primary_color` | CSS hex color override |
| `custom_domain` | Domain for hosted reports |
| `hide_alt_branding` | Removes "Powered by ALT" footer |
| `custom_email_from` | From address on outreach emails |

The white-label settings page (`/whitelabel`) updates this configuration via `PUT /api/whitelabel`.

---

## 13. AI / Async Processing

Currently, ALT uses **deterministic simulation** for all AI operations. This provides a realistic async UX experience (progress states, loading spinners, score reveal) without requiring external AI API keys or costs during development.

### Audit Scoring Simulation

```typescript
// In routes/audits/index.ts
setTimeout(async () => {
  const scores = {
    seoScore: randomBetween(45, 95),
    performanceScore: randomBetween(30, 85),
    accessibilityScore: randomBetween(50, 90),
    uxScore: randomBetween(40, 88),
    conversionScore: randomBetween(35, 80),
    mobileScore: randomBetween(45, 92),
  };
  scores.overallScore = Math.round(Object.values(scores).reduce((a, b) => a + b) / 6);
  // Generate AI summary and issues list
  await db.update(auditsTable).set({ ...scores, status: "completed" }).where(...);
}, 4000 + Math.random() * 3000); // 4-7 second delay
```

### Replacing Simulation with Real AI

To swap in a real AI backend:

1. Add an OpenAI/Anthropic/Gemini integration via the Replit integrations panel
2. Replace the `setTimeout` blocks in `routes/audits/index.ts` and `routes/leads/index.ts` with actual API calls
3. For audits: call an AI model with the URL's scraped HTML content and ask it to score each dimension
4. For leads: integrate with Google Places API or similar for real prospect discovery

---

## 14. Deployment Architecture

### Development (Replit Workspace)

```
┌─────────────────────────────────────────────────────────────┐
│  Replit Proxy  (shared domain: *.replit.dev or REPL_DOMAIN)│
│  Routes:                                                     │
│    /api/*    → api-server (port 8080)                       │
│    /*        → alt frontend (port 18928)                    │
└─────────────────────────────────────────────────────────────┘

Workflows:
  - "API Server"  → pnpm --filter @workspace/api-server run dev (nodemon)
  - "web"         → pnpm --filter @workspace/alt run dev (Vite HMR)
```

### Production (Replit Deployments)

```
┌─────────────────────────────────────────────────────────────┐
│  Replit Deployment Proxy (custom domain / .replit.app)      │
│  Same path-based routing as development                     │
└─────────────────────────────────────────────────────────────┘

Services:
  - api-server: pnpm --filter @workspace/api-server run start
                (runs the esbuild CJS bundle: dist/index.cjs)
  - alt:        pnpm --filter @workspace/alt run build
                (produces dist/ served as static files)

Database: Same PostgreSQL instance (DATABASE_URL references production DB)
Auth: Clerk automatically serves the correct keys per domain via
      publishableKeyFromHost() — no extra config needed
```

### Environment Detection

The API server uses `publishableKeyFromHost()` from `@clerk/shared/keys` to select the correct Clerk publishable key based on the request's `Host` header. This means the same code runs correctly in both dev (`.replit.dev`) and production (`.replit.app` or custom domain).

---

## 15. Environment Variables

| Variable | Where | Required | Description |
|----------|-------|----------|-------------|
| `DATABASE_URL` | API server | Yes | PostgreSQL connection string |
| `CLERK_SECRET_KEY` | API server | Yes | Clerk backend secret |
| `CLERK_PUBLISHABLE_KEY` | API server | Yes | Clerk publishable key (for publishableKeyFromHost) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Frontend build | Yes | Clerk publishable key for Vite |
| `VITE_CLERK_PROXY_URL` | Frontend build | Yes | Full URL to `/api/__clerk` proxy |
| `SESSION_SECRET` | API server | Reserved | Express session signing |
| `PORT` | Both | Yes | Injected by workflow runner |
| `BASE_PATH` | Frontend | Yes | Base URL path (usually "/") |
| `NODE_ENV` | Both | Yes | "development" or "production" |

---

## 16. Development Workflows

### Starting the App

Never run `pnpm dev` at the root. Use the Replit workflow buttons or:

```bash
# API server
pnpm --filter @workspace/api-server run dev

# Frontend
pnpm --filter @workspace/alt run dev
```

### TypeScript Checking

```bash
# Full check (libs first, then leaf packages)
pnpm run typecheck

# Libs only (needed after schema changes)
pnpm run typecheck:libs

# Single package
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/alt run typecheck
```

### Database

```bash
# Push schema changes (dev only — never production)
pnpm --filter @workspace/db run push

# After adding new schema files, ALWAYS run typecheck:libs first
pnpm run typecheck:libs
```

### API Codegen

```bash
# Regenerate after editing openapi.yaml
pnpm --filter @workspace/api-spec run codegen
```

### Adding a New Feature (end-to-end)

1. **Schema**: Add/edit table in `lib/db/src/schema/`
2. **Push**: `pnpm --filter @workspace/db run push`
3. **Typecheck libs**: `pnpm run typecheck:libs`
4. **OpenAPI**: Add endpoint to `lib/api-spec/openapi.yaml`
5. **Codegen**: `pnpm --filter @workspace/api-spec run codegen`
6. **Route**: Implement handler in `artifacts/api-server/src/routes/`
7. **Frontend**: Use generated hook in the relevant page component

---

## Appendix: Common Gotchas

| Issue | Cause | Fix |
|-------|-------|-----|
| `TS2305: no exported member` | New schema file added but `typecheck:libs` not run | `pnpm run typecheck:libs` |
| Blank preview pane | Vite dev server not allowing all hosts | Ensure `server.allowedHosts: true` in vite.config.ts |
| Clerk 401 on API requests | Proxy URL mismatch | Check `VITE_CLERK_PROXY_URL` matches the actual proxy domain |
| Rate limit 429 errors | Too many requests during dev testing | Use the Replit workspace IP; limit is 200/min |
| `pnpm dev` fails at root | Root has no `dev` script | Use workflow runner or `pnpm --filter @workspace/<name> run dev` |
| Type errors after merge | Leaf package imported a new lib type without `typecheck:libs` | Always run `typecheck:libs` before `typecheck` |
