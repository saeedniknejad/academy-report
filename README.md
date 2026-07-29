# Academy Report

A responsive youth-soccer (U10–U12, 8v8) **Coach** dashboard: full squad
overview, team + individual radar charts, monthly progress, trend flags, peer
comparison, in-app assessment entry, AI note expansion, attendance, goals,
batch report generation, historical month selector, and PDF export.

Dark **navy** theme with gold accents: Barlow Condensed headings, Inter body,
IBM Plex Mono for data/labels.

## 👉 First time? Read `SETUP-GUIDE.md`

**`SETUP-GUIDE.md`** is a click-by-click, non-developer walkthrough that takes
you from this zip to a live website with database, login, and AI. Start there.
`DEPLOY.md` is a shorter technical version of the same steps.

## Tech stack

- React 18 + TypeScript + Vite
- Tailwind CSS v3 (navy theme in `tailwind.config.ts`)
- Recharts (radar + bar charts), Lucide React icons
- **Supabase** for storage + coach auth (falls back to bundled demo data when unset)
- **Vercel serverless** (`api/expand.ts`) + **Google Gemini** for AI note expansion

## Getting started

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # type-check + production build to dist/
npm run preview   # serve the production build
```

The app runs out of the box on bundled **mock data** (a full U12 squad with four
months of assessments). No API keys required for the demo.

## Connecting live data (Google Sheets)

Copy `.env.example` to `.env` and fill in:

```
VITE_GOOGLE_SHEET_ID=<your sheet id>
VITE_GOOGLE_API_KEY=<read-only API key>
VITE_GOOGLE_SHEET_RANGE=Assessments!A1:Z1000
```

The sheet's first row must be headers matching the form fields (`Player Name`,
`Date`, `Session Type`, `Position Played`, `First Touch`, `Passing`,
`Dribbling`, `Shooting`, `Positioning`, `Decision Making`, `Game Awareness`,
`Speed & Agility`, `Effort`, `Teamwork`, `Highlight`, `Area to Develop`,
`Internal Coach Notes`). Scores are on the 1–5 scale and are converted to a
0–100 display scale for the radar charts (1=20 … 5=100).

If the sheet can't be reached, the app logs the error and falls back to mock
data so it never renders blank.

## AI note expansion

The coach types a short observation (e.g. *"weak first touch under pressure"*)
and the app expands it into a parent-friendly paragraph, a "try at home" drill,
and a technical coach drill — all editable before publishing to the parent view.

For production, deploy a serverless function that holds the OpenAI / Gemini key
**server-side** and set:

```
VITE_AI_ENDPOINT=/api/expand
```

The endpoint receives `{ observation, playerName, ageGroup, position }` and must
return `{ parentNote, tryAtHome, coachDrill }`. The exact system prompt lives in
`src/lib/ai.ts` (`SYSTEM_PROMPT`). When `VITE_AI_ENDPOINT` is unset, a
deterministic local mock generates relevant output so the feature is fully
demoable offline.

> ⚠️ Never put a model API key in a `VITE_`-prefixed variable — those are bundled
> into the client. Keep the key in the serverless function only.

## Privacy model

`internalNotes` is stripped at the data layer for the parent audience
(`getAssessments({ audience: "parent" })`), and the parent view only ever reads
*derived* profiles (scores, trends), never raw rows. FLAG badges and raw 1–5
scores are coach-only.

## Project structure

```
src/
  App.tsx                      # view toggle + data loading, wires everything
  components/
    CoachView.tsx              # squad + team/individual panels + tools
    ParentReport.tsx           # single-child parent report
    SquadList.tsx              # player selection (sidebar / mobile scroller)
    PlayerCard.tsx             # one squad-list item
    CoachNoteExpander.tsx      # AI note input + editable expansion
    RadarChart.tsx             # reusable radar (with overlay series)
    ProgressChart.tsx          # monthly bar chart
    panels.tsx                 # attendance, goals, stars, timeline
    ui.tsx                     # Card, Badge, TrendArrow, ProgressBar, …
  lib/
    types.ts                   # domain types + skill labels
    data.ts                    # Google Sheets reader + mock fallback + scrub
    derive.ts                  # averages, radars, trends, flags (pure)
    ai.ts                      # AI expansion (endpoint + local mock)
    mockData.ts                # bundled demo squad + assessments
```

## Responsive behaviour

- **Mobile (<640px):** single column; squad list becomes a horizontal scroller;
  charts stack. Tap targets are ≥44px.
- **Tablet (640–1024px):** 2-column content.
- **Desktop (>1024px):** 3-column grid (squad 1 col, content 2 cols).

Charts use `ResponsiveContainer` and resize fluidly.

## Deploy (Vercel / Netlify)

1. Push the repo and import it.
2. Build command `npm run build`, output directory `dist`.
3. Set the `VITE_*` environment variables above.
4. Add a serverless function at `/api/expand` for AI note expansion.

## Export to PDF

Both views include an **Export PDF** / **Save** button that triggers the
browser's print dialog (choose "Save as PDF"). The dark theme prints as-is.
