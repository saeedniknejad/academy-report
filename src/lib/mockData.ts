// ---------------------------------------------------------------------------
// Static seed data used when no live Google Sheet is configured.
//
// This models several months of assessments for a U12 squad so the derived
// trends, flags and progress charts have something real to compute over.
// ---------------------------------------------------------------------------
import type {
  Assessment,
  AttendanceRecord,
  PlayerMeta,
  Position,
  SessionType,
  SkillKey,
} from "./types";

export const ROSTER: PlayerMeta[] = [
  { name: "Kian R.", number: 7, primaryPosition: "Winger", ageGroup: "U12" },
  { name: "Arman T.", number: 10, primaryPosition: "Attacking Mid", ageGroup: "U12" },
  { name: "Dario N.", number: 4, primaryPosition: "Center Back", ageGroup: "U12" },
  { name: "Milo S.", number: 9, primaryPosition: "Striker", ageGroup: "U12" },
  { name: "Elias P.", number: 2, primaryPosition: "Right Back", ageGroup: "U12" },
  { name: "Yusuf K.", number: 11, primaryPosition: "Winger", ageGroup: "U12" },
];

const MONTHS = [
  { key: "Apr", date: "2026-04-14" },
  { key: "May", date: "2026-05-12" },
  { key: "Jun", date: "2026-06-16" },
  { key: "Jul", date: "2026-07-14" },
];

const SKILLS: SkillKey[] = [
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
];

// Base 1–5 skill profiles per player, plus a per-month delta so trends emerge.
// deltas: how each player's overall level shifts across Apr→Jul.
type Seed = {
  pos: Position;
  base: Partial<Record<SkillKey, number>>;
  monthDelta: number[]; // additive per month, applied to all skills (clamped 1–5)
  highlights: string[];
  areas: string[];
  internal: string;
};

const SEEDS: Record<string, Seed> = {
  "Kian R.": {
    pos: "Winger",
    base: { firstTouch: 3, passing: 4, dribbling: 4, shooting: 3, positioning: 3, decisionMaking: 3, gameAwareness: 3, speedAgility: 5, effort: 4, teamwork: 4 },
    monthDelta: [0, 0.3, 0.6, 0.9],
    highlights: ["Beat two defenders on the wing and delivered a great cross.", "Tracked back to win the ball and started a counter."],
    areas: ["Composure in front of goal", "Scanning before receiving"],
    internal: "Confidence high; push him to use weaker foot in 1v1s.",
  },
  "Arman T.": {
    pos: "Midfielder",
    base: { firstTouch: 4, passing: 5, dribbling: 4, shooting: 3, positioning: 4, decisionMaking: 4, gameAwareness: 4, speedAgility: 3, effort: 4, teamwork: 5 },
    monthDelta: [0, 0.4, 0.7, 1.0],
    highlights: ["Dictated the tempo in midfield with clean one-touch passing.", "Two assists in the weekend match."],
    areas: ["Defensive positioning when out of possession", "Shooting from distance"],
    internal: "Natural leader; give him captain rotation.",
  },
  "Dario N.": {
    pos: "Defender",
    base: { firstTouch: 3, passing: 3, dribbling: 2, shooting: 2, positioning: 4, decisionMaking: 3, gameAwareness: 4, speedAgility: 3, effort: 4, teamwork: 4 },
    monthDelta: [0, 0.1, 0.1, 0.0],
    highlights: ["Dominant in the air on set pieces.", "Read the game well to intercept through balls."],
    areas: ["First touch under pressure", "Playing out from the back"],
    internal: "Plateauing on ball-carrying; needs rondo reps.",
  },
  "Milo S.": {
    pos: "Forward",
    base: { firstTouch: 4, passing: 3, dribbling: 4, shooting: 4, positioning: 4, decisionMaking: 3, gameAwareness: 3, speedAgility: 4, effort: 4, teamwork: 3 },
    monthDelta: [0, 0.3, 0.4, -0.3], // recent dip -> flag
    highlights: ["Clinical finish from a tight angle.", "Great movement to find space in the box."],
    areas: ["Link-up play under pressure", "Holding the ball up with back to goal"],
    internal: "Slight dip after minor knock; monitor confidence.",
  },
  "Elias P.": {
    pos: "Defender",
    base: { firstTouch: 3, passing: 3, dribbling: 3, shooting: 2, positioning: 3, decisionMaking: 3, gameAwareness: 3, speedAgility: 4, effort: 5, teamwork: 4 },
    monthDelta: [0, 0.3, 0.5, 0.7],
    highlights: ["Overlapping runs added a real attacking threat.", "Never stopped working for the full match."],
    areas: ["Crossing accuracy", "Defensive 1v1 patience"],
    internal: "Motor is elite; refine end product.",
  },
  "Yusuf K.": {
    pos: "Winger",
    base: { firstTouch: 3, passing: 3, dribbling: 4, shooting: 3, positioning: 3, decisionMaking: 3, gameAwareness: 3, speedAgility: 4, effort: 4, teamwork: 4 },
    monthDelta: [0, 0.2, 0.2, 0.2],
    highlights: ["Direct running caused problems all game.", "Won a penalty with a clever turn."],
    areas: ["Decision making in the final third", "Tracking back consistently"],
    internal: "Flat trend; vary training to re-engage.",
  },
};

const SESSION_TYPES: SessionType[] = ["Training", "Match", "Tournament"];

function clamp(n: number): number {
  return Math.max(1, Math.min(5, Math.round(n)));
}

/** Build the full flat list of assessments (one row per player per month). */
function buildAssessments(): Assessment[] {
  const rows: Assessment[] = [];
  ROSTER.forEach((player) => {
    const seed = SEEDS[player.name];
    MONTHS.forEach((month, mi) => {
      const scores = {} as Record<SkillKey, number>;
      SKILLS.forEach((skill) => {
        const base = seed.base[skill] ?? 3;
        scores[skill] = clamp(base + seed.monthDelta[mi]);
      });
      rows.push({
        timestamp: `${month.date}T18:30:00.000Z`,
        playerName: player.name,
        date: month.date,
        sessionType: SESSION_TYPES[mi % SESSION_TYPES.length],
        assessedBy: "Coach Rivera",
        position: seed.pos,
        scores,
        highlight: seed.highlights[mi % seed.highlights.length],
        areaToDevelop: seed.areas[mi % seed.areas.length],
        internalNotes: seed.internal,
      });
    });
  });
  return rows;
}

export const MOCK_ASSESSMENTS: Assessment[] = buildAssessments();

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { playerName: "Kian R.", attended: 15, total: 16 },
  { playerName: "Arman T.", attended: 16, total: 16 },
  { playerName: "Dario N.", attended: 13, total: 16 },
  { playerName: "Milo S.", attended: 14, total: 16 },
  { playerName: "Elias P.", attended: 16, total: 16 },
  { playerName: "Yusuf K.", attended: 12, total: 16 },
];
