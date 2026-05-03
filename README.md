# Flyer Leuven

Volunteer web app for **reserving and completing** flyering on whole streets in Leuven city center. Deploys cleanly to **Vercel** with **Postgres** (e.g. Neon).

## Features

- Public board of streets with status: open, reserved, completed.
- **Register / log in** with a username only (no password).
- **Reserve** an open street, **release** it, or **mark done** when finished.
- **Coordinator** area (password-protected): clear any street, delete volunteers and their assignments, add/delete streets, **CSV export**.
- **Cron** (optional): auto-releases reservations older than `STALE_RESERVATION_HOURS` (default 48).

## Setup

1. **Clone** and install dependencies:

   ```bash
   npm install
   ```

2. **Postgres**: create a database (e.g. [Neon](https://neon.tech)) and copy the connection string.

3. **Environment**: copy `.env.example` to `.env.local` and fill values:

   - `DATABASE_URL` — Postgres URL (Neon pooled URL works on Vercel).
   - `SESSION_SECRET` — long random string (32+ characters).
   - `COORDINATOR_PASSWORD` — password for `/coordinator/login`.
   - `CRON_SECRET` — random string; Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` to the release endpoint.

4. **Migrations and seed**:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

   Seed creates the default campaign (`leuven-center`) and streets from `data/streets-seed.json`. Re-running seed does nothing if the campaign already exists.

5. **Develop**:

   ```bash
   npm run dev
   ```

## Vercel

1. Connect the repo and set the same environment variables in the Vercel project.
2. **Build**: default `npm run build` is fine. Run migrations once after first deploy (locally against production `DATABASE_URL`, or via a one-off command / CI step):

   ```bash
   DATABASE_URL="…production…" npm run db:migrate
   DATABASE_URL="…production…" npm run db:seed
   ```

3. **Cron**: `vercel.json` schedules `GET /api/cron/release-stale` daily. Set `CRON_SECRET` in Vercel; the platform sends the bearer token automatically for secured cron invocations.

## Scripts

| Script            | Purpose                          |
| ----------------- | -------------------------------- |
| `npm run dev`     | Next.js dev server               |
| `npm run build`   | Production build                 |
| `npm run db:generate` | Regenerate SQL from Drizzle schema |
| `npm run db:migrate`  | Apply SQL in `drizzle/` to the DB |
| `npm run db:seed`     | Seed default campaign + streets |
| `npm run db:ping`     | Test `DATABASE_URL` with `select 1` |

## Manual checks

- Two browsers: try to reserve the same open street; one should get a conflict message.
- Complete a reserved street; status should become done.
- Coordinator: clear street, delete user, add street, CSV download.

## Troubleshooting (Vercel)

- **`npm warn deprecated @esbuild-kit/...` during install:** comes from dev tooling (e.g. `tsx`); it is **not** a failed deploy. Safe to ignore unless you want to chase transitive upgrades later.
- **Site loads but shows “Database connection failed”:** Vercel env is wrong or the DB has no tables. Set **`DATABASE_URL`** to your Neon connection string (often the **pooled** URL). On your machine, point `.env.local` at the **same** URL and run `npm run db:migrate` and `npm run db:seed` once.
- **Blank / 500 with no message:** check **Vercel → Project → Logs** (or Runtime Logs) for the real Postgres error (e.g. `relation "campaigns" does not exist` → run migrations).

## Tech

Next.js (App Router), Tailwind CSS v4, Drizzle ORM, `@neondatabase/serverless`, Postgres.
