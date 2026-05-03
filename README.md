# Flyer Leuven

Volunteer web app for **reserving and completing** flyering on whole streets in Leuven city center. Deploys cleanly to **Vercel** with **Postgres** (e.g. Neon).

## Features

- Public board of streets with status: open, reserved, completed.
- **Volunteer log in** with username + password. Accounts are **created only by the coordinator** (no public self-registration); `/register` redirects to the login page with a short explanation.
- **Reserve** an open street, **release** it, or **mark done** when finished.
- **Coordinator** area (password-protected): **create volunteer accounts** (username + password), **set or change** a volunteer’s password (signs them out), clear streets, delete users, add/delete streets, **CSV export**.
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

   After adding migration `0001` (password hashes), **existing** users in the database have `password_hash` null until the coordinator uses **Set password** on each account (or deletes and recreates them).

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

- Coordinator creates a volunteer, then log out coordinator and log in as that volunteer on `/login`.
- Two browsers: try to reserve the same open street; one should get a conflict message.
- Complete a reserved street; status should become done.
- Coordinator: change volunteer password, clear street, delete user, add street, CSV download.

## Troubleshooting (Vercel)

- **`npm warn deprecated @esbuild-kit/...` during install:** comes from dev tooling (e.g. `tsx`); it is **not** a failed deploy. Safe to ignore unless you want to chase transitive upgrades later.
- **“Database connection failed”:** (1) Open **`/api/health/db`** on the live site — JSON shows if `DATABASE_URL` is set, the host, and a **sanitized** error (e.g. remove `&channel_binding=require`, or run migrate/seed). (2) In Vercel, **`DATABASE_URL`** must be enabled for **Production**; **redeploy** after changes. (3) On your machine use **`.env.local`** (leading dot), not `env.local`; scripts load `.env` then `.env.local`. Run `npm run db:migrate` and `npm run db:seed` with the **same** URL as Vercel.
- **Blank / 500 with no message:** check **Vercel → Project → Logs** (or Runtime Logs) for the real Postgres error (e.g. `relation "campaigns" does not exist` → run migrations).

## Tech

Next.js (App Router), Tailwind CSS v4, Drizzle ORM, `@neondatabase/serverless`, Postgres.
