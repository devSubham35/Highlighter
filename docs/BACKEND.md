# Highlighter Backend Documentation

This document describes the current backend implementation for **Highlighter** — a visual bug-reporting SaaS. The backend is a **Next.js App Router API** backed by **PostgreSQL** (via Prisma), **Better Auth** for sessions, and **Cloudflare R2** for screenshot storage.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Environment Variables](#environment-variables)
4. [Database Schema](#database-schema)
5. [Authentication](#authentication)
6. [Authorization & Access Control](#authorization--access-control)
7. [API Reference](#api-reference)
8. [Widget (Public) vs Dashboard (Authenticated) APIs](#widget-public-vs-dashboard-authenticated-apis)
9. [Screenshot Upload Flow](#screenshot-upload-flow)
10. [Report Metadata Model](#report-metadata-model)
11. [Validation Layer](#validation-layer)
12. [Shared Helpers & Utilities](#shared-helpers--utilities)
13. [Rate Limiting & CORS](#rate-limiting--cors)
14. [OpenAPI Specification](#openapi-specification)
15. [Error Handling Conventions](#error-handling-conventions)
16. [Key User Flows](#key-user-flows)

---

## Architecture Overview

```
┌─────────────────┐     session cookie      ┌──────────────────────────────┐
│  Dashboard UI   │ ───────────────────────▶│  Next.js API Routes          │
│  (React)        │                         │  /src/app/api/**             │
└─────────────────┘                         └──────────────┬───────────────┘
                                                           │
┌─────────────────┐     project API key     │              │
│  Widget (JS)    │ ───────────────────────▶│              │
│  on customer    │     + CORS              │              ▼
│  websites       │                         │     ┌────────────────┐
└─────────────────┘                         │     │  Prisma ORM    │
                                            │     │  PostgreSQL    │
                                            │     └────────────────┘
                                            │
                                            │     ┌────────────────┐
                                            └────▶│  Cloudflare R2 │
                                                  │  (screenshots) │
                                                  └────────────────┘
```

**High-level design:**

- All backend logic lives in **Next.js Route Handlers** under `src/app/api/`.
- **Better Auth** handles sign-up, sign-in, sessions, and password changes at `/api/auth/[...all]`.
- **Dashboard routes** require a valid session cookie and enforce workspace membership.
- **Widget routes** (`POST /api/reports`, `POST /api/upload`) are public, CORS-enabled, and authenticated via a per-project API key (`project_live_*`).
- Business data is stored in **PostgreSQL**; screenshot binaries go to **R2** via presigned upload URLs.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Next.js 16 (App Router) |
| Language | TypeScript |
| ORM | Prisma 6 |
| Database | PostgreSQL |
| Auth | Better Auth (`better-auth`) with Prisma adapter |
| Validation | Zod 4 |
| Object storage | AWS S3 SDK → Cloudflare R2 |
| API docs | OpenAPI 3.0 (`/api/openapi`) |

**Key source locations:**

| Path | Purpose |
|------|---------|
| `src/app/api/**` | HTTP route handlers |
| `src/lib/auth.ts` | Better Auth server config |
| `src/lib/auth-client.ts` | Better Auth client (frontend) |
| `src/lib/db.ts` | Prisma client singleton |
| `src/lib/api/helpers.ts` | Session, org access, shared query helpers |
| `src/lib/validations.ts` | Zod schemas for API + forms |
| `src/lib/report-metadata.ts` | JSON metadata parsing/merging for reports |
| `src/lib/http.ts` | CORS headers, rate limiting |
| `src/lib/r2.ts` | R2 presigned URL generation |
| `src/lib/api-key.ts` | Project API key generation |
| `prisma/schema.prisma` | Database schema |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (pooled) |
| `DATABASE_URL_UNPOOLED` | Optional | Direct connection for migrations |
| `BETTER_AUTH_SECRET` | Yes | Secret for signing auth tokens/cookies |
| `BETTER_AUTH_URL` | Yes | Public app URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_URL` | Yes | Frontend base URL |
| `R2_ACCOUNT_ID` | Yes* | Cloudflare account ID for R2 |
| `R2_ACCESS_KEY_ID` | Yes* | R2 access key |
| `R2_SECRET_ACCESS_KEY` | Yes* | R2 secret key |
| `R2_BUCKET_NAME` | Yes* | R2 bucket name |
| `R2_PUBLIC_URL` | Yes* | Public CDN/base URL for uploaded files |

\* Required for screenshot upload functionality.

See `.env.example` for a template.

---

## Database Schema

Defined in `prisma/schema.prisma`. All IDs use **CUID** unless noted.

### Auth models (Better Auth)

| Model | Table | Description |
|-------|-------|-------------|
| `User` | `users` | Account holder (name, email, image) |
| `Session` | `sessions` | Active sessions with token + expiry |
| `Account` | `accounts` | Credential provider records (includes hashed password) |
| `Verification` | `verifications` | Email verification tokens (unused while verification is disabled) |

### Workspace models

| Model | Table | Description |
|-------|-------|-------------|
| `Workspace` | `workspaces` | Workspace (name, unique slug, ownerId) |
| `Membership` | `memberships` | User ↔ workspace link with role |
| `Invitation` | `invitations` | Pending workspace invites with token + expiry |

**Member roles** (`MemberRole` enum):

| Role | Rank | Typical permissions |
|------|------|---------------------|
| `OWNER` | 3 | Full control, delete workspace, change roles |
| `ADMIN` | 2 | Manage projects, members, invitations |
| `MEMBER` | 1 | View and work on projects/reports |

### Project & reporting models

| Model | Table | Description |
|-------|-------|-------------|
| `Project` | `projects` | Website under a workspace; has unique `apiKey` for widget |
| `Report` | `reports` | Bug/issue submitted via widget or dashboard |
| `Comment` | `comments` | Threaded comments on a report |

**Report status** (`ReportStatus`): `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`

**Severity** (`Severity`): `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`

**Invitation status** (`InvitationStatus`): `PENDING`, `ACCEPTED`, `EXPIRED`

### Notable field defaults

```prisma
Project.widgetColor    = "#2563eb"
Project.widgetPosition = "bottom-right"
Project.archived       = false
Report.status          = OPEN
Report.severity        = MEDIUM
Invitation.expiresAt   = 7 days from creation
```

### Cascade deletes

Deleting a `Workspace` cascades to memberships, projects, and invitations. Deleting a `Project` cascades to reports. Deleting a `Report` cascades to comments.

---

## Authentication

**Provider:** [Better Auth](https://www.better-auth.com/) configured in `src/lib/auth.ts`.

```typescript
betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL],
});
```

### Auth endpoint

All auth operations are handled by a catch-all route:

```
GET|POST  /api/auth/[...all]
```

Handled by `toNextJsHandler(auth)` — includes:

- `POST /api/auth/sign-up/email` — register
- `POST /api/auth/sign-in/email` — login
- `POST /api/auth/sign-out` — logout
- Session management, password flows, etc.

### Session usage in API routes

Dashboard routes read the session via:

```typescript
const session = await auth.api.getSession({ headers: await headers() });
```

Or through helpers:

```typescript
const authResult = await requireSession();
if ("error" in authResult) return authResult.error;
```

Sessions are **cookie-based**. The frontend uses `@/lib/auth-client` (`signIn`, `signUp`, `signOut`).

---

## Authorization & Access Control

Centralized in `src/lib/api/helpers.ts`.

### Role hierarchy

```typescript
const roleRank = { MEMBER: 1, ADMIN: 2, OWNER: 3 };
```

`hasMinRole(userRole, minimumRole)` returns true if the user meets or exceeds the required level.

### Helper functions

| Function | Returns | Behavior |
|----------|---------|----------|
| `getSession()` | Session or null | Reads current session |
| `requireSession()` | `{ session }` or `{ error: 401 }` | Requires authenticated user |
| `requireWorkspaceMembership(workspaceId, minRole?)` | `{ session, membership }` or error | Requires workspace membership; default min role = `MEMBER` |
| `jsonError(message, status)` | `NextResponse` | Standard error JSON `{ error: ... }` |

### Access patterns by resource

| Resource | Access rule |
|----------|-------------|
| Workspace list | User must be a member |
| Workspace detail | Member of that workspace |
| Workspace update | `ADMIN` or `OWNER` |
| Workspace delete | `OWNER` only |
| Project list/create | Member to list; `ADMIN`+ to create |
| Project detail/update/delete | Any member of the project's workspace |
| Report list/detail/update/delete | Member of the report's project's workspace |
| Report create (widget) | Valid `projectApiKey` only — no session |
| Invitations | `ADMIN`+ to create/list/revoke |
| Member role change | `OWNER` only |
| Member removal | Self-leave (any role except owner) or `ADMIN`+ (with admin restrictions) |

### Project access (inline)

`requireProjectAccess()` in `/api/projects/[projectId]` checks:

```typescript
project.workspace.memberships.some({ userId: session.user.id })
```

### Report access (inline)

`requireReport()` in `/api/reports/[reportId]` uses the same workspace-membership chain through `project.workspace`.

---

## API Reference

Base URL: `{BETTER_AUTH_URL}/api`

All authenticated routes expect a valid session cookie unless noted.

---

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `*` | `/auth/[...all]` | Varies | Better Auth handler (sign-up, sign-in, sign-out, etc.) |

---

### Users

#### `GET /api/users/me`

Returns the current user profile plus workspace count.

**Response:**

```json
{
  "id": "cuid",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "emailVerified": false,
  "image": null,
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601",
  "workspaceCount": 2
}
```

#### `PATCH /api/users/me`

Updates the current user's name via Better Auth.

**Body:** `{ "name": "string" }` (2–50 chars)

#### `POST /api/users/me/change-password`

**Body:**

```json
{
  "currentPassword": "string",
  "newPassword": "string",
  "revokeOtherSessions": false
}
```

Returns `{ "ok": true }` or `400` if current password is wrong.

---

### Workspaces

#### `GET /api/workspaces`

Lists all workspaces the current user belongs to, with counts.

**Response item fields:** `id`, `name`, `slug`, `ownerId`, `role`, `projectCount`, `memberCount`, `createdAt`, `updatedAt`

#### `POST /api/workspaces`

Creates a workspace. Creator becomes `OWNER`.

**Body:**

```json
{
  "name": "Acme Support",
  "inviteEmail": "optional@example.com"
}
```

- Generates a unique slug: `{slugified-name}-{random5}`
- Optionally creates a pending invitation if `inviteEmail` is provided
- Returns `201` with workspace + counts

**Errors:** `409` if workspace name already exists for this user

#### `GET /api/workspaces/:workspaceId`

Full workspace detail including members. Pending invitations included only for `ADMIN`/`OWNER`.

#### `PATCH /api/workspaces/:workspaceId`

**Requires:** `ADMIN`+

**Body:** `{ "name": "string" }`

#### `DELETE /api/workspaces/:workspaceId`

**Requires:** `OWNER`

Permanently deletes the workspace and all related data (cascade).

---

### Members

#### `GET /api/workspaces/:workspaceId/members`

Lists all members with user profile fields.

#### `PATCH /api/workspaces/:workspaceId/members/:userId`

**Requires:** `OWNER`

**Body:** `{ "role": "ADMIN" | "MEMBER" }`

Cannot change the workspace owner's role.

#### `DELETE /api/workspaces/:workspaceId/members/:userId`

Two paths:

1. **Self-removal:** Any member except `OWNER` can leave without admin role
2. **Admin removal:** Requires `ADMIN`+; admins cannot remove other admins

---

### Invitations

#### `GET /api/invitations?workspaceId=`

**Requires:** `ADMIN`+ for the workspace

#### `POST /api/invitations`

**Requires:** `ADMIN`+

**Body:**

```json
{
  "email": "user@example.com",
  "role": "ADMIN" | "MEMBER",
  "workspaceId": "cuid"
}
```

- Invitation expires in **7 days**
- Returns `409` if user is already a member or a pending invite exists

#### `GET /api/invitations/token/:token`

**Public** — no session required. Used by invite landing pages.

Returns invitation metadata and `valid: boolean`.

#### `POST /api/invitations/accept`

**Requires:** session; invite email must match logged-in user's email

**Body:** `{ "token": "string" }`

Creates membership and marks invitation `ACCEPTED` in a transaction.

#### `DELETE /api/invitations/:invitationId`

**Requires:** `ADMIN`+ for the invitation's workspace

---

### Projects

#### `GET /api/projects?workspaceId=&enriched=`

**Requires:** workspace membership

| Query | Description |
|-------|-------------|
| `workspaceId` | Required |
| `enriched` | Default `true`; set `false` for raw project rows |

When enriched, each project includes:

- `openCount` — reports with status `OPEN`
- `imageCount` — reports with a screenshot
- `lastIssueAt` — ISO timestamp of most recent report

#### `POST /api/projects`

**Requires:** `ADMIN`+

**Body:**

```json
{
  "workspaceId": "cuid",
  "name": "Marketing Site",
  "websiteUrl": "https://example.com",
  "widgetColor": "#22c55e",
  "widgetPosition": "bottom-right"
}
```

Auto-generates `apiKey` via `generateApiKey()` → `project_live_{24-char-nanoid}`

#### `GET /api/projects/:projectId`

Returns project with `_count.reports`.

#### `PATCH /api/projects/:projectId`

**Body (all optional):** `name`, `websiteUrl`, `archived`, `widgetColor`, `widgetPosition`

#### `DELETE /api/projects/:projectId`

Deletes project and all reports (cascade).

---

### Reports (Issues)

#### `POST /api/reports` — Widget submission

**Public** · **CORS enabled** · **Rate limited** (10 req/min per IP)

**Body:**

```json
{
  "projectApiKey": "project_live_...",
  "title": "Button not clickable",
  "description": "Optional details",
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "screenshotUrl": "https://...",
  "pageUrl": "https://customer-site.com/page",
  "browser": "Chrome",
  "browserVersion": "120",
  "os": "macOS",
  "device": "desktop",
  "screenWidth": 1920,
  "screenHeight": 1080,
  "viewportWidth": 1440,
  "viewportHeight": 900,
  "userAgent": "...",
  "referrer": "...",
  "metadata": {}
}
```

**Response `201`:** `{ "id": "cuid", "message": "Report submitted" }`

**Errors:** `404` invalid API key, `429` rate limit, `400` validation

#### `GET /api/reports` — Dashboard list

**Requires:** session

| Query | Filter |
|-------|--------|
| `projectId` | Scope to one project |
| `status` | `OPEN`, `IN_PROGRESS`, etc. |
| `severity` | `LOW`, `MEDIUM`, etc. |
| `search` | Case-insensitive title search |

Limited to reports in workspaces the user belongs to. Max **50** results, newest first.

Includes `project` relation and `_count.comments`.

#### `GET /api/reports/:reportId`

Full report with comments (including author) ordered ascending.

#### `PATCH /api/reports/:reportId`

Supports two payload shapes:

**Legacy (status only):**

```json
{ "status": "IN_PROGRESS" }
```

**Full update:**

```json
{
  "status": "RESOLVED",
  "description": "Updated description",
  "metadata": {
    "type": "BUG",
    "priority": "HIGH",
    "assigneeIds": ["cuid1", "cuid2"],
    "reporterName": "Anonymous",
    "activityLog": []
  }
}
```

Metadata is **merged** with existing JSON via `mergeReportMetadata()` — partial updates do not wipe other metadata keys.

#### `DELETE /api/reports/:reportId`

Permanently deletes the report and its comments.

---

### Comments

#### `GET /api/reports/:reportId/comments`

Returns comments with `author` relation, oldest first.

#### `POST /api/reports/:reportId/comments`

**Body:** `{ "content": "string" }` (1–2000 chars)

**Response `201`:** Created comment with author.

---

### Upload (Screenshots)

#### `POST /api/upload`

**Public** · **CORS enabled**

**Body:**

```json
{
  "contentType": "image/png",
  "projectKey": "project_live_..."
}
```

**Validation:** `contentType` must start with `image/`

**Response:**

```json
{
  "uploadUrl": "https://...presigned...",
  "publicUrl": "https://pub-xxx.r2.dev/screenshots/...",
  "key": "screenshots/{projectKey}/{nanoid}.png"
}
```

Presigned URL expires in **300 seconds** (5 minutes).

#### `OPTIONS /api/upload` and `OPTIONS /api/reports`

CORS preflight handlers returning `204`.

---

### OpenAPI

#### `GET /api/openapi`

Returns the full OpenAPI 3.0 JSON spec generated from `src/lib/openapi/spec.ts`. Cached for 1 hour.

---

## Widget (Public) vs Dashboard (Authenticated) APIs

| Aspect | Widget routes | Dashboard routes |
|--------|---------------|------------------|
| Auth | Project API key | Session cookie |
| CORS | Yes (`Access-Control-Allow-Origin: *`) | No (same-origin) |
| Rate limit | Yes (reports only) | No |
| Endpoints | `POST /reports`, `POST /upload` | Everything else |

**Typical widget flow:**

1. Widget loads with embedded `projectApiKey`
2. User captures screenshot → `POST /api/upload` → upload binary to presigned URL
3. Widget submits report → `POST /api/reports` with `screenshotUrl` + session metadata

---

## Screenshot Upload Flow

```
Widget                    API                     R2
  │                        │                       │
  │── POST /api/upload ───▶│                       │
  │◀─ { uploadUrl, publicUrl }                       │
  │                        │                       │
  │── PUT uploadUrl ───────────────────────────────▶│
  │   (binary image)       │                       │
  │                        │                       │
  │── POST /api/reports ──▶│                       │
  │   screenshotUrl=publicUrl                        │
  │                        │── store URL in DB ───▶│
```

**R2 client** (`src/lib/r2.ts`):

- Endpoint: `https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
- Public URLs: `{R2_PUBLIC_URL}/{key}`
- Keys: `screenshots/{projectKey}/{nanoid}.{ext}`

---

## Report Metadata Model

Reports store flexible issue-tracking data in a JSON `metadata` column. Parsed and validated by `src/lib/report-metadata.ts`.

### Schema

```typescript
type ReportMetadata = {
  type?: "BUG" | "IMPROVEMENT";
  priority?: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assigneeIds?: string[];       // User CUIDs
  reporterName?: string;
  reporterId?: string;
  issueNumber?: number;       // Display key suffix (e.g. MS-2)
  activityLog?: ActivityEntry[];
};
```

### Activity log entries

```typescript
type ActivityEntry = {
  id: string;
  kind: "reported" | "title_ai" | "status" | "priority" | "comment";
  at: string;                   // ISO8601
  actorName?: string;
  issueType?: IssueType;
  fromStatus?: ReportStatus;
  toStatus?: ReportStatus;
  fromPriority?: IssuePriority;
  toPriority?: IssuePriority;
  comment?: string;
};
```

### Helper functions

| Function | Purpose |
|----------|---------|
| `parseReportMetadata(raw)` | Safely parse JSON column |
| `mergeReportMetadata(existing, patch)` | Shallow merge for PATCH updates |
| `appendActivityLog(metadata, entry)` | Append timeline event |
| `buildDefaultActivityLog(...)` | Seed initial timeline on report creation |
| `formatIssueKey(projectName, issueNumber)` | e.g. `MS-2` from project name |

Issue numbers are assigned client-side when loading project reports (based on report creation order), not by the database.

---

## Validation Layer

All API input is validated with **Zod** schemas in `src/lib/validations.ts`.

| Schema | Used by |
|--------|---------|
| `createWorkspaceSchema` | `POST /workspaces` |
| `updateWorkspaceSchema` | `PATCH /workspaces/:id` |
| `createProjectSchema` | `POST /projects` |
| `updateProjectSchema` | `PATCH /projects/:id` |
| `createReportSchema` | `POST /reports` (widget) |
| `updateReportSchema` | `PATCH /reports/:id` |
| `updateReportStatusSchema` | Legacy PATCH fallback |
| `createCommentSchema` | `POST /reports/:id/comments` |
| `inviteMemberSchema` | `POST /invitations` |
| `acceptInvitationSchema` | `POST /invitations/accept` |
| `updateMemberRoleSchema` | `PATCH /members/:userId` |
| `updateUserProfileSchema` | `PATCH /users/me` |
| `changePasswordSchema` | `POST /users/me/change-password` |

Validation failures return **400** with Zod's `flatten()` output:

```json
{
  "error": {
    "formErrors": [],
    "fieldErrors": { "email": ["Invalid email"] }
  }
}
```

---

## Shared Helpers & Utilities

### `enrichProjects(projects)`

Aggregates per-project stats in batch (avoids N+1 queries):

- Open report count
- Screenshot count
- Last issue timestamp

### `getWorkspaceCounts(workspaceId)`

Returns `{ projectCount, memberCount, pendingInvites }`.

### `isWorkspaceNameTaken(userId, name, excludeId?)`

Case-insensitive duplicate name check scoped to workspaces the user belongs to.

### `slugify(value)`

Lowercases, replaces non-alphanumeric runs with `-`, trims edges.

### `generateApiKey()`

Returns `project_live_` + 24-character alphanumeric nanoid.

---

## Rate Limiting & CORS

Implemented in `src/lib/http.ts`.

### Rate limiting

- **In-memory** sliding window (not distributed — resets on server restart)
- Window: **60 seconds**
- Default max: **10 requests** per key
- Applied to: `POST /api/reports` keyed by `report:{ip}`

### CORS headers

```typescript
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
}
```

Used on widget-facing routes and the `json()` helper.

---

## OpenAPI Specification

- **Endpoint:** `GET /api/openapi`
- **Generator:** `src/lib/openapi/spec.ts` + `src/lib/openapi/schemas.ts`
- Documents all REST routes, request/response schemas, and auth notes
- Can be consumed by Swagger UI or external API clients

---

## Error Handling Conventions

| Status | Meaning | Typical cause |
|--------|---------|---------------|
| `400` | Bad request | Zod validation failure |
| `401` | Unauthorized | Missing or invalid session |
| `403` | Forbidden | Insufficient role or wrong invite email |
| `404` | Not found | Resource missing or no access (intentionally vague for workspace membership) |
| `409` | Conflict | Duplicate name, existing member, duplicate invite |
| `429` | Too many requests | Widget rate limit exceeded |
| `201` | Created | Successful POST for resources |

**Error body shape:**

```json
{ "error": "Human-readable message" }
// or
{ "error": { "formErrors": [], "fieldErrors": {} } }
```

Workspace membership failures return **404** (not 403) to avoid leaking workspace existence.

---

## Key User Flows

### 1. Sign up and create workspace

```
POST /api/auth/sign-up/email
GET  /api/workspaces          (empty)
POST /api/workspaces          → OWNER membership created
POST /api/projects             → apiKey generated
```

### 2. Invite teammate

```
POST /api/invitations            → token + 7-day expiry
GET  /api/invitations/token/:token   (invitee views invite)
POST /api/auth/sign-up/email     (invitee registers if needed)
POST /api/invitations/accept     → membership created
```

### 3. Widget bug report

```
POST /api/upload                 → presigned URL
PUT  {uploadUrl}                 → binary to R2
POST /api/reports                → report row created
GET  /api/reports?projectId=     (team triages in dashboard)
PATCH /api/reports/:id           → status, assignees, metadata
POST /api/reports/:id/comments   → discussion
```

### 4. Leave or manage workspace

```
DELETE /api/workspaces/:workspaceId/members/:userId   (self or admin)
PATCH  /api/workspaces/:workspaceId/members/:userId   (owner changes role)
DELETE /api/workspaces/:workspaceId                   (owner deletes workspace)
```

---

## Development Commands

```bash
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate    # Run migrations
npm run seed              # Seed database (if configured)
npm run dev               # Start dev server (API + UI)
```

---

## Notes & Limitations

1. **Email verification is disabled** — accounts are active immediately after sign-up.
2. **Rate limiting is in-process** — not suitable for multi-instance production without a shared store (Redis, etc.).
3. **Project PATCH/DELETE** allows any org member, not just admins — creation requires `ADMIN`+.
4. **Issue numbers** (`metadata.issueNumber`) are computed when rendering project pages, not stored atomically at creation time.
5. **No webhook/email notifications** — invitations are created in the database only; delivery is not implemented in the API layer.
6. **OpenAPI auth routes** document Better Auth endpoints; refer to Better Auth docs for the full auth surface area.

---

*Last updated to reflect the codebase as implemented in the Highlighter repository.*
