# MoneyFlow

A personal finance platform for tracking income, expenses, budgets and savings
goals. Full stack: PostgreSQL, Prisma, Next.js App Router, Auth.js, React 19.

Every figure in the interface — balances, budget usage, savings rate, chart
series, insights — is computed from the signed-in user's own transactions. There
is no mock data, no placeholder endpoint and no hardcoded number anywhere in the
product surface.

**Demo login:** `demo@moneyflow.app` / `DemoPass123` (created by the seed script)

---

## Contents

- [Features](#features)
- [Technology](#technology)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Requirements](#requirements)
- [Installation](#installation)
- [Environment variables](#environment-variables)
- [Database setup](#database-setup)
- [Migrations](#migrations)
- [Seeding](#seeding)
- [Development](#development)
- [Testing](#testing)
- [Production build](#production-build)
- [Deployment](#deployment)
- [Money and dates](#money-and-dates)
- [Security](#security)

---

## Features

**Dashboard.** Total balance across active accounts with month-over-month
change, income, expenses, net cash flow and savings rate. A six-month income vs
expense area chart, a spending-by-category donut, a net cash flow chart, recent
transactions, budget progress and savings goal progress. Quick actions open the
create dialogs without leaving the page.

**Transactions.** Create, edit and delete. Full-text search across description,
notes, category and account. Filter by type, account, category and date range;
sort by date or amount; paginate. Totals reflect the current filter, not the
whole history. A table on laptops, a touch-friendly card list on phones.

**Accounts.** Cash, bank, savings, investment, wallet and credit accounts, each
with a currency, an opening balance and a live computed balance. Every account
has a detail page with its own totals and recent activity. Accounts can be
archived, which removes them from the total balance without deleting history.

**Categories.** Fifteen defaults are created for every new user. Users can add
their own with a colour and an icon, rename any of them, and delete custom ones
once nothing references them.

**Budgets.** A monthly limit per expense category. Spend is calculated live from
transactions, so editing or deleting a transaction updates the budget
immediately. Budgets warn at 80% and are clearly marked when exceeded. The month
switcher moves between months.

**Savings goals.** A name, target, optional target date and colour. Add or
withdraw money; each movement is recorded as a contribution, and a withdrawal
can never take a goal below zero. Goals are marked funded on reaching target.

**Analytics.** Six date-range presets plus a custom range. Totals with
period-over-period change, income and expense trends, category splits for both
directions, per-account balances, largest expenses, and a plain-language
insights panel generated only from figures that actually exist.

**Settings.** Profile, currency (NGN, USD, EUR, GBP), theme, category
management, password change, notification preferences, and account deletion
behind password re-entry.

Throughout: light and dark themes, skeleton loading states, considered empty
states, error boundaries, toast notifications, keyboard-accessible dialogs and
forms, and a mobile layout designed rather than shrunk.

---

## Technology

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack, React 19) |
| Language | TypeScript (strict) |
| Database | PostgreSQL |
| ORM | Prisma 7 with the `@prisma/adapter-pg` driver adapter |
| Auth | Auth.js (NextAuth v5), credentials provider, JWT sessions |
| Styling | Tailwind CSS v4, shadcn/ui, Lucide icons |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Tests | Vitest |
| Package manager | npm |

---

## Architecture

Requests flow in one direction, and the security boundary sits on the server.

```
Browser
  │
  ├─ Server Component page  ──►  requireUser()  ──►  query module  ──►  Prisma ──► PostgreSQL
  │        (renders HTML)          (session)         (user-scoped)
  │
  └─ Client Component form ──►  server action  ──►  Zod ──► ownership check ──► Prisma
                                 (requireUserId)
```

**Pages are Server Components.** They call `requireUser()`, then a query module,
then render. No financial data is fetched from the browser, so there is no API
surface to secure separately and no loading waterfall on first paint.

**Mutations are server actions.** Every action validates its input with Zod,
resolves the session itself, and confirms that the records it touches belong to
that user before writing. Writes use `updateMany`/`deleteMany` with the user id
in the filter, which makes a cross-user write impossible rather than merely
unlikely.

**Actions never throw across the boundary.** They return
`{ ok: true, data }` or `{ ok: false, error, fieldErrors }`. The client maps
field errors back onto the form; a raw database error never reaches the browser.

**The proxy is optimistic only.** `src/proxy.ts` redirects on the presence of a
session cookie so signed-out visitors do not see a flash of the app. It is not
the security boundary — every page, query and action checks the session itself.

**Query modules own the data access.** Nothing outside `src/server/queries`
talks to Prisma for financial data, and every function there takes a `userId` as
its first argument. Aggregation happens in PostgreSQL (`groupBy`, `date_trunc`)
rather than by pulling rows into Node.

---

## Project structure

```
prisma/
  schema.prisma              Models, relations, indexes, cascades
  migrations/                Generated SQL migrations
  seed.ts                    Demo user with ~9 months of realistic data

src/
  app/
    (auth)/                  Split-screen login and register
    (app)/                   Authenticated shell + all product pages
      dashboard/ transactions/ accounts/ budgets/ goals/ analytics/ settings/
      error.tsx not-found.tsx, plus a loading.tsx per route
    api/auth/[...nextauth]/  Auth.js route handler
    page.tsx                 Marketing landing page
    globals.css              Design tokens, light + dark themes

  components/
    ui/                      shadcn primitives
    layout/                  Sidebar, top bar, mobile drawer and tab bar
    dashboard/ transactions/ accounts/ budgets/ goals/ analytics/ settings/
    charts/                  Recharts wrappers with shared tooltip styling
    shared/                  Money, deltas, empty states, skeletons, dialogs
    providers/               Quick-add dialog context

  server/
    actions/                 Server actions, one module per domain
    queries/                 User-scoped data access and aggregation
    money.ts                 Decimal arithmetic
    insights.ts              Pure insight generation (unit tested)
    session.ts               Session resolution and guards
    action-result.ts         The result shape every action returns

  lib/                       Prisma client, auth config, validation, dates, currency
  hooks/                     Media query, hydration, localStorage
  types/                     DTOs shared between server and client
  proxy.ts                   Optimistic route protection

tests/
  unit/                      Money, dates, insights, validation
  integration/               Auth, transactions, budgets, goals, dashboard (real database)
```

---

## Requirements

- Node.js 20.9 or newer (22 LTS recommended)
- npm 10+
- PostgreSQL 14+

---

## Installation

```bash
git clone <your-repo-url> moneyflow
cd moneyflow
npm install
cp .env.example .env
```

---

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string used by the app and by migrations. |
| `AUTH_SECRET` | yes | Signs and encrypts session tokens. Generate with `npx auth secret`. |
| `AUTH_URL` | yes in production | Canonical URL of the deployment. Vercel sets this for you. |
| `AUTH_TRUST_HOST` | behind a proxy | Set to `true` for Docker, Railway, Fly and most self-hosted setups. |
| `SHADOW_DATABASE_URL` | optional | Only when your database user cannot create shadow databases. |
| `DATABASE_POOL_MAX` | optional | Connection pool ceiling. Defaults to 10. |
| `DATABASE_POOL_IDLE_MS` | optional | Idle timeout for pooled connections. Defaults to 10000. |

Never commit `.env`. It is git-ignored; `.env.example` is not.

---

## Database setup

### Option A — your own PostgreSQL

Create a database and point `DATABASE_URL` at it:

```bash
createdb moneyflow
# DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/moneyflow?schema=public"
```

### Option B — Docker

```bash
docker run --name moneyflow-db \
  -e POSTGRES_USER=moneyflow \
  -e POSTGRES_PASSWORD=moneyflow \
  -e POSTGRES_DB=moneyflow \
  -p 5432:5432 -d postgres:16

# DATABASE_URL="postgresql://moneyflow:moneyflow@localhost:5432/moneyflow?schema=public"
```

### Option C — the bundled dev server

Prisma can run a local PostgreSQL-compatible server with no installation:

```bash
npx prisma dev -n moneyflow -d
```

It prints a `DATABASE_URL` to copy into `.env`. This server is PGlite-backed and
serves one connection at a time, so set `DATABASE_POOL_MAX="1"` alongside it.
Use a real PostgreSQL instance for anything beyond local exploration.

---

## Migrations

```bash
npm run db:migrate      # create and apply a migration in development
npm run db:deploy       # apply existing migrations (CI and production)
npm run db:generate     # regenerate Prisma Client after a schema change
npm run db:reset        # drop, re-migrate and re-seed — destroys all data
npm run db:studio       # browse the data
```

Prisma Client is generated into `src/generated/prisma` and is git-ignored, so
run `npm run db:generate` after cloning or changing the schema.

---

## Seeding

```bash
npm run db:seed
```

Creates one demo user with five accounts, fifteen categories, roughly nine
months of realistic transactions, budgets for the last three months, and four
savings goals in different states — enough that every chart, budget bar and
insight has something real to show. The data is generated from a fixed seed, so
repeated runs produce the same dataset.

Re-running the seed deletes and recreates the demo user only. Other accounts are
left alone.

**Demo credentials:** `demo@moneyflow.app` / `DemoPass123`

---

## Development

```bash
npm run dev             # http://localhost:3000
npm run typecheck
npm run lint
```

---

## Testing

```bash
npm test                # everything
npm run test:watch
```

120 tests across eight files.

**Unit tests** cover decimal arithmetic and the guarantee that money never goes
through floating point, currency formatting, UTC period boundaries, insight
generation, and every validation rule.

**Integration tests** run against a real PostgreSQL database using the real
server actions and query modules, with only the session injected. They cover
registration and password hashing, transaction create/edit/delete and the
resulting balance changes, search, filtering, sorting, pagination, budget and
savings goal calculations, dashboard and analytics figures, and — in detail —
user data isolation: one user can neither read, edit, delete, nor attach records
to another user's accounts, categories, transactions, budgets or goals.

Integration tests create users under `@moneyflow.test` and remove them
afterwards. They skip automatically when `DATABASE_URL` is not set.

---

## Production build

```bash
npm run build
npm run start
```

---

## Deployment

### Vercel

1. Push the repository to GitHub and import it.
2. Set `DATABASE_URL` and `AUTH_SECRET` in the project's environment variables.
   `AUTH_URL` is provided automatically.
3. Set the build command to `prisma generate && prisma migrate deploy && next build`,
   so the client is generated and migrations are applied on each deploy.
4. Point `DATABASE_URL` at a pooled connection string (Neon, Supabase, or
   Vercel Postgres) and keep `DATABASE_POOL_MAX` modest for serverless.

### Docker or a VPS

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start
```

Set `AUTH_TRUST_HOST="true"` when running behind a reverse proxy, and terminate
TLS in front of the app so session cookies are sent with the `Secure` flag.

---

## Money and dates

Two decisions matter more than any other in a finance application, so they are
enforced in one place each.

**Money never touches floating point.** Every monetary column is
`DECIMAL(18,2)`. Arithmetic happens through `src/server/money.ts`, which wraps
Prisma's `Decimal`. Values cross to the browser as fixed-2 decimal strings and
are converted to `number` only for display and for chart geometry. Rounding is
half-up to two places. A unit test asserts that `0.1 + 0.2` is exactly `0.3` and
that a thousand additions of `0.01` come to exactly `10.00`.

**Dates are calendar dates, not instants.** Money spent on the 1st belongs to
that month regardless of the reader's timezone. Transaction dates are stored at
UTC midnight, every period boundary is computed in UTC, month buckets are keyed
by a `YYYY-MM` string produced in SQL, and display formatting reads the UTC
components back. Mixing local and UTC boundaries is what silently moves a
transaction into the wrong month, so the codebase does not do it anywhere.

---

## Security

- Passwords are hashed with bcrypt at cost 12 and never leave the server.
- A failed login against an unknown email performs an equivalent bcrypt
  comparison, so response time cannot be used to enumerate registered accounts.
- Sessions are signed JWTs. The token carries only the user id; the user record
  is re-read on each request, so edits and deletions take effect immediately.
- Every page, query and server action resolves the session independently.
- Every financial query is scoped by `userId`. Updates and deletes include the
  user id in their filter, so a crafted request cannot reach another user's row.
- Server actions confirm that referenced accounts and categories belong to the
  caller before writing.
- All input is validated with Zod on the server, regardless of client validation.
- Errors are logged server-side and returned as safe messages. Stack traces and
  database errors are never sent to the browser.
- Secrets come from environment variables. Nothing is hardcoded and `.env` is
  git-ignored.
- Security headers (`X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy`) are set in `next.config.ts`.

### A note on `npm audit`

`npm audit` reports advisories against `mysql2` and `deepmerge-ts`. Both arrive
through the Prisma **CLI**, which is a dev dependency, and neither is reachable
from application code — this project uses PostgreSQL and never loads the MySQL
driver. They are not shipped in the production bundle.
