// ---------------------------------------------------------------------------
// Pure functions that turn the flat assessment list into everything the UI
// renders: averages, radar series, monthly progress, trends and flags.
//
// Keeping this side-effect free makes it trivial to swap the mock data source
// for the live Google Sheets reader without touching the components.
// ---------------------------------------------------------------------------
import {
  RADAR_SKILLS,
  SKILL_KEYS,
  SKILL_LABELS,
  type Assessment,
  type MonthlyPoint,
  type PlayerMeta,
  type PlayerProfile,
  type Position,
  type RadarPoint,
  type SkillKey,
  type TrendDirection,
} from "./types";

/** Convert a 1–5 form score to the 0–100 display scale (1=20 … 5=100). */
export function toDisplayScale(score: number): number {
  return Math.round(score * 20);
}

const MONTH_LABEL = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthKey(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T12:00:00`);

  const month = MONTH_LABEL[d.getMonth()];
  const year = String(d.getFullYear()).slice(-2);

  return `${month}-${year}`;
}

function averageScores(rows: Assessment[]): Record<SkillKey, number> {
  const totals = {} as Record<SkillKey, number>;
  SKILL_KEYS.forEach((k) => (totals[k] = 0));
  rows.forEach((r) => SKILL_KEYS.forEach((k) => (totals[k] += r.scores[k])));
  const out = {} as Record<SkillKey, number>;
  const n = rows.length || 1;
  SKILL_KEYS.forEach((k) => (out[k] = totals[k] / n));
  return out;
}

/** Overall (mean across all ten skills) on the 0–100 scale. */
function overall100(scores: Record<SkillKey, number>): number {
  const mean = SKILL_KEYS.reduce((s, k) => s + scores[k], 0) / SKILL_KEYS.length;
  return toDisplayScale(mean);
}

function sortByDateAsc(rows: Assessment[]): Assessment[] {
  return [...rows].sort((a, b) => a.date.localeCompare(b.date));
}

/** Compute a single player's full profile from their assessment rows. */
export function buildPlayerProfile(meta: PlayerMeta, all: Assessment[]): PlayerProfile {
  const rows = sortByDateAsc(all.filter((r) => r.playerName === meta.name));

  // Group rows by month, preserving chronological order.
  const byMonth = new Map<string, Assessment[]>();
  rows.forEach((r) => {
    const key = monthKey(r.date);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(r);
  });
  const monthKeys = [...byMonth.keys()];

  const currentKey = monthKeys[monthKeys.length - 1];
  const previousKey = monthKeys[monthKeys.length - 2];
  const currentRows = currentKey ? byMonth.get(currentKey)! : [];
  const previousRows = previousKey ? byMonth.get(previousKey)! : [];

  const currentAvgRaw = averageScores(currentRows); // 1–5
  const previousAvgRaw = previousRows.length ? averageScores(previousRows) : currentAvgRaw;
  const seasonRows = rows.slice(0, Math.max(0, rows.length - currentRows.length));
  const seasonAvgRaw = seasonRows.length ? averageScores(seasonRows) : currentAvgRaw;

  // Convert averages to 0–100 for display.
  const currentAverage = mapScale(currentAvgRaw);
  const seasonAverage = mapScale(seasonAvgRaw);

  // Radar series: current month (value) with season average overlay (season).
  const currentRadar: RadarPoint[] = RADAR_SKILLS.map((k) => ({
    skill: SKILL_LABELS[k],
    value: toDisplayScale(currentAvgRaw[k]),
    season: toDisplayScale(seasonAvgRaw[k]),
  }));

  // Monthly progress = overall score per month.
  const monthlyProgress: MonthlyPoint[] = monthKeys.map((key) => ({
    month: key,
    value: overall100(averageScores(byMonth.get(key)!)),
  }));

  // Trend: current overall vs previous overall.
  const currOverall = overall100(currentAvgRaw);
  const prevOverall = overall100(previousAvgRaw);
  const trend: TrendDirection =
    currOverall - prevOverall > 2 ? "up" : currOverall - prevOverall < -2 ? "down" : "flat";

  // Flags: any skill dropped ≥1 point on the 1–5 scale vs last month.
  const droppedSkills: SkillKey[] = SKILL_KEYS.filter(
    (k) => previousAvgRaw[k] - currentAvgRaw[k] >= 1
  );

  const latest = rows[rows.length - 1];
  const latestPosition: Position = latest?.position ?? "Mixed-Training";

  return {
    meta,
    latestPosition,
    currentRadar,
    seasonAverage,
    currentAverage,
    monthlyProgress,
    trend,
    droppedSkills,
    flagged: droppedSkills.length > 0,
    latestHighlight: latest?.highlight,
    latestAreaToDevelop: latest?.areaToDevelop,
    timeline: rows.map((r) => ({ date: r.date, sessionType: r.sessionType })),
  };
}

function mapScale(raw: Record<SkillKey, number>): Record<SkillKey, number> {
  const out = {} as Record<SkillKey, number>;
  SKILL_KEYS.forEach((k) => (out[k] = toDisplayScale(raw[k])));
  return out;
}

/** Build every player's profile. */
export function buildAllProfiles(roster: PlayerMeta[], all: Assessment[]): PlayerProfile[] {
  return roster.map((m) => buildPlayerProfile(m, all));
}

/** Team radar = mean of each skill across all players' current-month values. */
export function buildTeamRadar(profiles: PlayerProfile[]): RadarPoint[] {
  return RADAR_SKILLS.map((k, i) => {
    const label = SKILL_LABELS[k];
    const values = profiles.map((p) => p.currentRadar[i]?.value ?? 0);
    const mean = values.reduce((s, v) => s + v, 0) / (values.length || 1);
    return { skill: label, value: Math.round(mean) };
  });
}

/** Overlay two players onto one radar series (for coach comparison mode). */
export function buildComparisonRadar(a: PlayerProfile, b: PlayerProfile): RadarPoint[] {
  return a.currentRadar.map((point, i) => ({
    skill: point.skill,
    value: point.value, // player A
    season: b.currentRadar[i]?.value ?? 0, // reuse `season` slot for player B
  }));
}
