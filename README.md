# Fitness Leaderboard — Phase 1 + 2 + 3

A real multi-user web app: username/password auth, daily exercise logging
(including user-submitted custom exercises), a streak counter with a grace
period, friends, time/scope-filterable leaderboards with search, a daily
challenge, and near-real-time updates via polling.

## Quick local test (Windows)

Double-click **`start.bat`** (or run it from a terminal). First run it will:
1. Copy `.env.example` to `.env` if missing and pause so you can fill in
   `DATABASE_URL` and `JWT_SECRET` — **you still need a real Postgres
   database even for local testing**, there's no built-in SQLite mode.
   The free tiers of Supabase, Neon, or Railway all work fine for this,
   or a local Postgres install/Docker container.
2. Run `npm install`, `npx prisma generate`, `npx prisma db push`, and
   the seed script.
3. Start the dev server and open `http://localhost:3000` in your browser.

Every later run just re-syncs the schema (safe/no-op if unchanged) and
starts the server — no need to redo the setup steps by hand.

## Stack
- Next.js 14 (App Router) — frontend + backend API routes in one project
- PostgreSQL — real relational database
- Prisma — ORM / migrations
- bcryptjs — password hashing
- jsonwebtoken — session cookies (httpOnly, signed)
- Tailwind CSS — styling

## 1. Local setup

```bash
npm install
cp .env.example .env
# edit .env: put in your real DATABASE_URL and a random JWT_SECRET
npx prisma migrate dev --name init
npm run seed        # loads the 19 official exercises
npm run dev
```

Visit http://localhost:3000 — it'll redirect to /login.

## 2. Deploying (since you already have hosting)

**Database:** Point `DATABASE_URL` at your Postgres instance (Railway,
Supabase, Render, Neon, etc. — any standard Postgres connection string works).

**App hosting (Vercel is the easiest fit for Next.js):**
1. Push this project to a GitHub repo.
2. Import it into Vercel.
3. Set environment variables in the Vercel project settings:
   - `DATABASE_URL`
   - `JWT_SECRET`
4. Vercel will run `next build` automatically. Before first use, run the
   migration + seed against your production database once:
   ```bash
   DATABASE_URL="your-production-url" npx prisma migrate deploy
   DATABASE_URL="your-production-url" npm run seed
   ```
   (Run this from your own machine, or via a one-off Railway/Render job —
   it only needs to happen once, and again after any future schema change.)

If you're hosting the Node server yourself instead of Vercel (e.g. on
Railway/Render as a Node service), the same `npm run build && npm start`
works — no code changes needed.

## 3. What's actually happening under the hood

- **Auth**: `/api/auth/signup` and `/api/auth/login` hash/check passwords
  with bcrypt and set a signed JWT in an httpOnly cookie. No sessions table
  needed — the JWT itself is the session, valid for 30 days.
- **Logging**: `/api/logs` writes a row per submission and recalculates the
  user's streak (see `lib` logic in that route) — if you logged yesterday,
  streak +1; if you already logged today, no change; otherwise it resets to 1.
- **Leaderboard**: computed live with `prisma.log.groupBy` summing all
  logged amounts per user for a given exercise — no separate leaderboard
  table to keep in sync, it's always derived straight from the logs.

## 4. What Phase 2 added
- **Friends**: `Friendship` model, request/accept/decline flow at
  `/api/friends*`, and a `/friends` page to search users and manage
  requests.
- **Time-window + scope leaderboards**: `/api/leaderboard/:exerciseId`
  now takes `?window=today|weekly|monthly|yearly|alltime` and
  `?scope=everyone|friends`, computed live off `Log.date` ranges —
  no separate leaderboard table to keep in sync.
- **Streak grace period**: `lib/streak.js` computes display state lazily
  (no cron needed) — 0 days since your last log = active, exactly 1 day
  = "grace" (pause icon, one more chance today), 2+ days = broken.
- **Public profiles**: every username almost everywhere (leaderboard rows,
  friends list) links to `/profile/[username]` showing their all-time
  per-exercise totals and streak.

## 5. What Phase 3 added
- **"Others" custom exercises**: pick "+ Custom exercise" on the dashboard,
  type any name, log it. It's private (only you see it) until a *second*
  distinct user logs the exact same name (case/whitespace-insensitive) —
  at that point `lib/logging.js`'s `maybePromoteExercise` flips it public
  and it shows up in everyone's exercise grid and gets a real leaderboard,
  same as any official exercise.
- **Daily Challenge**: `/api/challenge` lazily generates one global
  challenge per calendar day (random official exercise + a reasonable
  target) the first time anyone asks for it that day. Marking it
  "Completed" is honor-system only — it also inserts a real log entry for
  that amount, so it counts on leaderboards too.
- **Near-real-time leaderboards**: `LeaderboardBoard` now polls every 8
  seconds while a board is open, so other people's logs show up without
  a manual refresh. This is polling, not true WebSockets — a real push
  connection needs a persistent server process (works fine on
  Railway/Render, but not on Vercel's serverless functions). Worth
  upgrading to Socket.IO later if 8-second polling ever feels too slow.

## 6. Next steps (Phase 4 from the plan)
- The Rep Defense minigame: Points economy, troop types, auto-battler loop,
  Game ELO leaderboard, speed/auto-play controls
- Fitness Plans: separate multi-day plan streak system
