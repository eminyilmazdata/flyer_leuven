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

   Seed creates the default campaign (`leuven-center`) and streets from `data/streets-seed.json`. If that campaign **already exists**, re-running seed **adds any missing street names** from the file (case-insensitive match); it does not remove streets or change assignments.

   After adding migration `0001` (password hashes), **existing** users in the database have `password_hash` null until the coordinator uses **Set password** on each account (or deletes and recreates them).

5. **Develop**:

   ```bash
   npm run dev
   ```

## Go live (checklist)

Do these **in order** the first time you ship to production.

1. **Neon** — Create a project + database. Copy the **connection string** (pooled URL is fine). Remove `&channel_binding=require` if present.
2. **GitHub** — Push `main` (this repo is already set up for Vercel import).
3. **Vercel** — [New Project](https://vercel.com/new) → Import this GitHub repo. Framework: Next.js (auto). Root: repo root.
4. **Environment variables** (Vercel → Project → **Settings** → **Environment Variables**), for **Production** (and Preview if you want):

   | Key | Value |
   |-----|--------|
   | `DATABASE_URL` | Neon URL |
   | `SESSION_SECRET` | Random string, 32+ characters |
   | `COORDINATOR_PASSWORD` | Password for `/coordinator/login` |
   | `CRON_SECRET` | Random string (cron auth) |

5. **Deploy** — Trigger first deployment (or push to `main`). Wait until it succeeds.
6. **Database schema + data** — On your **laptop**, put the **same** `DATABASE_URL` in `.env.local`, then:

   ```bash
   npm install
   npm run db:ping
   npm run db:migrate
   npm run db:seed
   ```

   `db:migrate` applies `drizzle/0000_*.sql` and `0001_*.sql`. `db:seed` creates the campaign and streets from `data/streets-seed.json` on an empty DB; if the campaign already exists, it **imports new street names** from the same file only.

7. **Smoke test** — Open your Vercel URL → `/` should list streets. `/api/health/db` should return `"ok": true`. `/coordinator/login` with `COORDINATOR_PASSWORD` → create a volunteer → `/login` as that user.
8. **Custom domain** (optional) — Vercel → **Settings** → **Domains** → add DNS as instructed.
9. **Cron** — `CRON_SECRET` must match what Vercel sends; see **Vercel** subsection below.

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
| `npm run db:seed`     | Seed campaign + streets, or sync missing streets from `streets-seed.json` if campaign exists |
| `npm run db:ping`     | Test `DATABASE_URL` with `select 1` |
| `npm run streets:fetch` | Download street names from OSM into `data/streets-seed.json` (needs network) |

## Street list (OpenStreetMap)

Street names come from **`data/streets-seed.json`**. **`npm run db:seed`** creates the default campaign on an empty database, or **appends streets** that appear in the file but not yet in the DB (same campaign, case-insensitive name match).

To **refresh the list** from [OpenStreetMap](https://www.openstreetmap.org/) via the public [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API):

```bash
npm run streets:fetch
```

- Default bounding box covers **central Leuven + nearby** (south, west, north, east in WGS84). Tighten or move it with env **`OSM_BBOX`** (comma-separated), e.g. `OSM_BBOX=50.873,4.688,50.885,4.715 npm run streets:fetch`.
- Write elsewhere with **`STREETS_OUT=./data/my-streets.json`** to compare before replacing `streets-seed.json`.
- OSM is community-maintained: occasional odd labels are filtered, but you should still **spot-check** the JSON.
- **`db:seed`** on an existing campaign only **adds** streets from `streets-seed.json`; it never deletes. Remove or rename mistakes via the coordinator UI.

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
