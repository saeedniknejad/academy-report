// ---------------------------------------------------------------------------
// Domain types for the Academy Report app.
//
// The raw shape mirrors one row of the coach assessment sheet (Google Forms /
// Google Sheets). Everything else in the app is *derived* from a list of these
// rows so there is a single source of truth.
// ---------------------------------------------------------------------------

/** The ten skills scored on the 1–5 form scale. */
export const SKILL_KEYS = [
  "firstTouch",
  "passing",
  "dribbling",
  "shooting",
  "positioning",
  "decisionMaking",
  "gameAwareness",
  "speedAgility",
  "effort",
  "teamwork",
] as const;

export type SkillKey = (typeof SKILL_KEYS)[number];

/** Plain-language label for each skill (used on axes and in the UI). */
export const SKILL_LABELS: Record<SkillKey, string> = {
  firstTouch: "First Touch",
  passing: "Passing",
  dribbling: "Dribbling",
  shooting: "Shooting",
  positioning: "Positioning",
  decisionMaking: "Decision Making",
  gameAwareness: "Game Awareness",
  speedAgility: "Speed & Agility",
  effort: "Effort",
  teamwork: "Teamwork",
};

/**
 * Compact radar uses a curated subset of the ten skills so the chart stays
 * readable. Order matches the reference mockup's spirit (technical → physical).
 */
export const RADAR_SKILLS: SkillKey[] = [
  "firstTouch",
  "passing",
  "dribbling",
  "shooting",
  "positioning",
  "decisionMaking",
  "gameAwareness",
  "speedAgility",
];

export type Position =
  | "GK"
  | "Defender"
  | "Midfielder"
  | "Forward"
  | "Winger"
  | "Mixed-Training";

export type SessionType = "Training" | "Match" | "Tournament";

/** Selectable options for the coach entry form (single source of truth). */
export const POSITIONS: Position[] = [
  "GK",
  "Defender",
  "Midfielder",
  "Forward",
  "Winger",
  "Mixed-Training",
];

export const SESSION_TYPES: SessionType[] = ["Training", "Match", "Tournament"];

/** 1–5 scale labels shown next to each rating selector. */
export const SCALE_LABELS: Record<number, string> = {
  1: "Emerging",
  2: "Developing",
  3: "Consistent",
  4: "Strong",
  5: "Excelling",
};

/** One assessment row — 1:1 with a form submission / sheet row. */
export interface Assessment {
  timestamp: string; // ISO — auto from the form
  playerId?: string;
  playerName: string;
  date: string; // ISO date of the session
  sessionType: SessionType;
  assessedBy: string;
  position: Position;
  scores: Record<SkillKey, number>; // each 1–5
  highlight?: string;
  areaToDevelop?: string;
  /** NEVER shown to parents — enforced at the data layer. */
  internalNotes?: string;
}

/** Static roster metadata (jersey number, primary position). */
export interface PlayerMeta {
  id?: string;
  name: string;
  number: number;
  primaryPosition: string;
  ageGroup: string;
}

export interface Goal {
  id: string;
  playerName: string;
  text: string;
  status: "in-progress" | "achieved";
}

export interface AttendanceRecord {
  playerName: string;
  attended: number;
  total: number;
}

export type TrendDirection = "up" | "flat" | "down";

/** A single point on a radar chart (0–100 display scale). */
export interface RadarPoint {
  skill: string;
  value: number;
  /** Optional second series (e.g. season average overlay). */
  season?: number;
}

export interface MonthlyPoint {
  month: string; // e.g. "Apr"
  value: number; // overall score, 0–100
}

/** Everything the UI needs for one player, fully derived from assessments. */
export interface PlayerProfile {
  meta: PlayerMeta;
  /** Most recent position actually played. */
  latestPosition: Position;
  currentRadar: RadarPoint[]; // current month, with season overlay
  seasonAverage: Record<SkillKey, number>; // 0–100
  currentAverage: Record<SkillKey, number>; // 0–100
  monthlyProgress: MonthlyPoint[];
  trend: TrendDirection;
  /** Skills that dropped ≥1 point (on the 1–5 scale) vs last month. */
  droppedSkills: SkillKey[];
  flagged: boolean;
  latestHighlight?: string;
  latestAreaToDevelop?: string;
  timeline: { date: string; sessionType: SessionType }[];
}

/** Structured output of an AI coach-note expansion. */
export interface ExpandedNote {
  parentNote: string;
  tryAtHome: string;
  coachDrill: string;
}
