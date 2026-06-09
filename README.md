# Concert Ticket Reservation

Full-stack concert ticket reservation app. Next.js frontend, NestJS backend,
PostgreSQL, Docker, JWT role-based auth (`ADMIN` / `USER`).

## Setup

**Prerequisite:** Docker + Docker Compose.

```bash
docker compose up --build
```

This builds and starts three services. On startup the backend container runs
`prisma migrate deploy && prisma db seed` automatically, so the schema and seed
data are ready with no extra steps.

| Service  | URL                     | Notes                          |
| -------- | ----------------------- | ------------------------------ |
| Frontend | http://localhost:3000   | Next.js app — start here       |
| Backend  | http://localhost:3001   | NestJS REST API                |
| Postgres | localhost:5432          | `postgres` / `postgres`        |

**Seeded logins** (password `password` for both):

| Role  | Email               |
| ----- | ------------------- |
| Admin | `admin@example.com` |
| User  | `user@example.com`  |

Open http://localhost:3000, pick an access level, and log in with one of the
seeded accounts. Admins create/delete concerts and view the audit trail; users
reserve/cancel seats and view their own history.

## Architecture

Monorepo with two independently-built apps and a root `docker-compose.yml`:

```
frontend/   Next.js (App Router, TS, Tailwind v4)
backend/    NestJS (TS), Prisma + PostgreSQL, Dockerfile + prisma/ inside
docker-compose.yml
```

**Backend** — feature modules with clean controller / service / DTO separation:

- `auth/` — `POST /auth/register` (role forced to `USER`), `POST /auth/login`.
  JWT payload carries `sub`, `name`, `email`, `role`.
- `concerts/` — `GET /concerts` (auth: availability + per-user reserved flag),
  `POST /concerts` + `DELETE /concerts/:id` (`ADMIN`), and `admin.controller`
  for `GET /admin/stats` + `GET /admin/reservations` (`ADMIN` audit log).
- `reservations/` — `POST /concerts/:id/reservations` + `DELETE /reservations/:id`
  + `GET /me/reservations` (`USER`).
- `common/` — shared `JwtAuthGuard`, `RolesGuard` (reads role from JWT payload),
  `@Roles` / `@CurrentUser` decorators, global `PrismaService`, response
  interceptor (`{ data, message }` envelope) and exception filter.

Routes are protected with NestJS Guards; `RolesGuard` rejects `USER` calls to
`ADMIN` endpoints with `403`. Global `ValidationPipe`
(`whitelist` + `forbidNonWhitelisted` + `transform`) enforces server-side
validation, returning `400` on bad input. Cancel is a **soft delete**
(`status → CANCELED`) so the admin audit trail keeps a full record.

**Frontend** — App Router pages (`src/app/`): landing → login/signup
(split-screen, route by role), `concerts/` (reserve/cancel cards + history),
`admin/` (stat cards, create/delete, audit table). A central API client
(`src/lib/api.ts`) wraps every call and surfaces backend errors as `ApiError`,
shown via toast or inline message — never silent. Responsive across
mobile/tablet/desktop per the Figma design.

## Libraries

**Backend:** NestJS 11, Prisma 6 (`@prisma/client`), `@nestjs/jwt` +
`@nestjs/passport` + `passport-jwt` (JWT auth), `class-validator` +
`class-transformer` (validation), `bcryptjs` (password hashing),
Jest + `ts-jest` (tests).

**Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript.

## Tests

**Backend** unit tests (mock `PrismaService`) cover concert-create validation,
delete authorization, reservation success, duplicate + sold-out rejection,
cancel ownership, and role-guard behavior:

```bash
cd backend
npm install
npm test
```

22 tests pass. Concurrency (no over-booking) is verified live against the
Docker stack rather than in unit tests — see below.

**Frontend** component/integration tests (Vitest + React Testing Library, per the
Next.js testing guide) cover the login form (button label per access level,
session save + role routing on success, backend error shown as an alert), the
toast, the delete-confirmation modal, and the password-reveal field:

```bash
cd frontend
npm install
npm test
```

## Bonus: Theory

### Performance Optimization

For a massive dataset and high traffic:

- **Indexing** — keep the listing query index-backed. Foreign keys and the
  partial unique index already exist; add covering/composite indexes for the
  hot `GET /concerts` ordering (`createdAt`) as data grows.
- **Pagination** — replace the full-table listing with cursor (keyset)
  pagination so payload and query cost stay bounded.
- **Caching** — Redis for hot, rarely-changing reads (concert list, admin
  stats) with event-based invalidation on create/delete/reserve; HTTP
  `Cache-Control` for the listing endpoint.
- **CDN** — Next.js static assets and images served from a CDN edge; use
  ISR / React Server Components so concert pages render once and serve cached.
- **Database scaling** — connection pooling (PgBouncer), read replicas to
  offload listing/stats reads from the write primary.

### Concurrency Control (no over-booking)

The race — 1,000 users for the last 10 seats — is handled with **pessimistic
locking inside a database transaction**, which is what this app actually
implements:

1. Each reserve runs in an interactive Prisma `$transaction`.
2. It takes a row lock on the concert: `SELECT ... FOR UPDATE`. Concurrent
   reservers for the same concert serialize on this lock instead of racing.
3. Inside the lock it **recounts active reservations** and rejects with `409`
   if the concert is full (`active >= totalSeats`).
4. A **partial unique index** on `(userId, concertId) WHERE status = 'ACTIVE'`
   enforces the one-seat-per-user rule at the DB level — a second active
   reservation for the same pair fails (`409`) even under a race, as a backstop
   to the application check.

Cancel is a soft delete (`status → CANCELED`), so a canceled seat frees up and
the user can re-reserve — the partial index only constrains `ACTIVE` rows.

Verified live: a 5-user race on a 1-seat concert yields exactly one `201` and
four `409` — no over-booking.

**Alternatives at larger scale:** optimistic locking (a version column,
retry on conflict) avoids holding locks but costs retries under heavy
contention; a message queue serializing reservations per concert decouples the
booking spike from the database and smooths write load.
