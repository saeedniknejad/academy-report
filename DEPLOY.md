# Deploy & Integrate — Supabase + Vercel

This app currently runs on **bundled mock data** and keeps coach-entered
assessments in React state (they reset on refresh). This guide takes it to a
persistent, deployed one-stop shop.

## 0. Run locally first

```bash
npm install
npm run dev      # http://localhost:3000
```

---

## 1. Supabase (storage + auth) — free tier

1. Create a project at [supabase.com](https://supabase.com) → copy the **Project URL**
   and the **anon public key** (Project Settings → API).
2. In the SQL editor, create the tables:

```sql
create table players (
  name text primary key,
  number int unique not null,
  primary_position text not null,
  age_group text not null default 'U12'
);

create table assessments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  player_name text not null references players(name),
  date date not null,
  session_type text not null,
  assessed_by text,
  position text not null,
  first_touch int, passing int, dribbling int, shooting int,
  positioning int, decision_making int, game_awareness int,
  speed_agility int, effort int, teamwork int,
  highlight text,
  area_to_develop text,
  internal_notes text          -- coach-only; never expose to a parent role
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  player_name text not null references players(name),
  text text not null,
  status text not null default 'in-progress'
);

create table attendance (
  player_name text primary key references players(name),
  attended int not null default 0,
  total int not null default 16
);
```

3. Enable **Row Level Security** on every table, then add policies. Simplest
   coach-only setup: authenticated users can do everything.

```sql
alter table players enable row level security;
alter table assessments enable row level security;
alter table goals enable row level security;
alter table attendance enable row level security;

-- Repeat for each table:
create policy "coach full access" on assessments
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
```

4. Auth → add your coach's email (Authentication → Users), or enable email
   magic-link sign-in.

---

## 2. Wire the app to Supabase

```bash
npm install @supabase/supabase-js
```

Set in `.env` (see `.env.example`):

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

**Where to change code — everything is isolated in `src/lib/data.ts`:**

- `getAssessments()` / `getRoster()` / `getGoals()` / `getAttendance()` — swap the
  mock returns for `supabase.from('...').select()`. Map snake_case columns to the
  camelCase `SkillKey` fields (a `rowToAssessment`-style mapper already exists).
- Add a `saveAssessment(a)` that `insert()`s a row (+ upserts a new player).
- In `src/App.tsx`, `addAssessment()` already updates local state for instant UI;
  add an `await saveAssessment(...)` call there to persist.

Because every component reads *derived* data (`src/lib/derive.ts`) and never the
data source directly, no component changes are needed — only `data.ts`.

---

## 3. AI note expansion (serverless, key stays server-side)

`src/lib/ai.ts` already calls `VITE_AI_ENDPOINT` and falls back to a local mock.
Create `api/expand.ts` (Vercel serverless) that reads the request
`{ observation, playerName, ageGroup, position }`, calls your model with the
`SYSTEM_PROMPT` exported from `ai.ts`, and returns
`{ parentNote, tryAtHome, coachDrill }`.

- Put the model key in a **non-VITE** env var (e.g. `GEMINI_API_KEY`) so it never
  ships to the browser.
- Set `VITE_AI_ENDPOINT=/api/expand`.

Google **Gemini** has a genuine free tier and is the cheapest option.

---

## 4. Deploy to Vercel — free tier

1. Push this folder to a GitHub repo.
2. Import it at [vercel.com](https://vercel.com). Framework: **Vite**
   (build + output are pinned in `vercel.json`).
3. Add env vars in Vercel → Project → Settings → Environment Variables:
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - `VITE_AI_ENDPOINT=/api/expand`
   - `GEMINI_API_KEY` (server-only, for the function)
4. Deploy. `vercel.json` rewrites all non-`/api` routes to `index.html` for the SPA.

---

## Cost summary (squad scale = free)

| Piece | Service | Cost |
|---|---|---|
| Hosting + serverless AI fn | Vercel Hobby | Free |
| Storage + auth | Supabase Free | Free |
| AI model | Google Gemini free tier | Free |
