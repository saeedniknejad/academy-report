// ---------------------------------------------------------------------------
// Data source: reads assessments from a Google Sheet when configured, and
// otherwise falls back to the bundled mock data so the app runs out of the box.
//
// Privacy: `internalNotes` is stripped for any consumer that isn't the coach
// view. Use `getAssessments({ audience })` and never pass raw rows to the
// parent view.
// ---------------------------------------------------------------------------
import {
  MOCK_ASSESSMENTS,
  MOCK_ATTENDANCE,
} from "./mockData";
import type {
  Assessment,
  AttendanceRecord,
  Goal,
  PlayerMeta,
  Position,
  SessionType,
  SkillKey,
} from "./types";
import { SKILL_KEYS } from "./types";
import { isSupabaseConfigured, supabase } from "./supabase";

export { createTeam, getMyTeams } from "./data/teams";
export { deactivatePlayer, getRoster } from "./data/players";
import { getRoster } from "./data/players";
/** Default number of sessions in a reporting period (for new-player attendance). */
export const DEFAULT_ATTENDANCE_TOTAL = 16;

// ---------------------------------------------------------------------------
// Supabase column mapping
//
// The database uses snake_case columns; the app uses camelCase SkillKeys. These
// two maps + helpers convert between an Assessment and a Supabase table row.
// ---------------------------------------------------------------------------

/** SkillKey -> assessments table column name. */
const SKILL_COLUMN: Record<SkillKey, string> = {
  firstTouch: "first_touch",
  passing: "passing",
  dribbling: "dribbling",
  shooting: "shooting",
  positioning: "positioning",
  decisionMaking: "decision_making",
  gameAwareness: "game_awareness",
  speedAgility: "speed_agility",
  effort: "effort",
  teamwork: "teamwork",
};

/** Build an insert payload for the `assessments` table from an Assessment. */
function assessmentToDbRow(a: Assessment): Record<string, unknown> {
  if (!a.playerId) {
    throw new Error (
        `Missing player ID for ${a.playerName}`
    );
  }

  const row: Record<string, unknown> = {
    player_id: a.playerId,
    player_name: a.playerName,
    date: a.date,
    session_type: a.sessionType,
    assessed_by: a.assessedBy,
    position: a.position,
    highlight: a.highlight ?? null,
    area_to_develop: a.areaToDevelop ?? null,
    internal_notes: a.internalNotes ?? null,
  };
  SKILL_KEYS.forEach((k) => (row[SKILL_COLUMN[k]] = a.scores[k]));
  return row;
}

/** Convert a Supabase `assessments` row back into an Assessment. */
function dbRowToAssessment(row: Record<string, unknown>): Assessment {
  const scores = {} as Record<SkillKey, number>;
  SKILL_KEYS.forEach((k) => {
    const v = Number(row[SKILL_COLUMN[k]]);
    scores[k] = !Number.isNaN(v) && v >= 1 && v <= 5 ? v : 3;
  });
  return {
    id: row.id ? String(row.id) : undefined,
    createdAt: row.created_at ? String(row.created_at) : undefined,
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
    timestamp: `${String(row.date)}T12:00:00`,
    playerId:row.player_id ? String(row.player_id): undefined,
    playerName: String(row.player_name),
    date: String(row.date),
    sessionType: (String(row.session_type) || "Training") as SessionType,
    assessedBy: String(row.assessed_by ?? ""),
    position: (String(row.position) || "Mixed-Training") as Position,
    scores,
    highlight: (row.highlight as string) || undefined,
    areaToDevelop: (row.area_to_develop as string) || undefined,
    internalNotes: (row.internal_notes as string) || undefined,
  };
}

const SHEET_ID = import.meta.env.VITE_GOOGLE_SHEET_ID as string | undefined;
const SHEET_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;
const SHEET_RANGE = (import.meta.env.VITE_GOOGLE_SHEET_RANGE as string | undefined) ?? "Assessments!A1:Z1000";

export function isLiveDataConfigured(): boolean {
  return Boolean(SHEET_ID && SHEET_API_KEY);
}

/** Header label (in the sheet) → skill key. */
const HEADER_TO_SKILL: Record<string, SkillKey> = {
  "First Touch": "firstTouch",
  Passing: "passing",
  Dribbling: "dribbling",
  Shooting: "shooting",
  Positioning: "positioning",
  "Decision Making": "decisionMaking",
  "Game Awareness": "gameAwareness",
  "Speed & Agility": "speedAgility",
  Effort: "effort",
  Teamwork: "teamwork",
};

/** Map a header row + a data row into an Assessment. */
function rowToAssessment(headers: string[], row: string[]): Assessment | null {
  const cell = (label: string): string => {
    const idx = headers.indexOf(label);
    return idx >= 0 ? (row[idx] ?? "").trim() : "";
  };

  const playerName = cell("Player Name");
  const date = cell("Date");
  if (!playerName || !date) return null;

  const scores = {} as Record<SkillKey, number>;
  SKILL_KEYS.forEach((k) => (scores[k] = 3));
  Object.entries(HEADER_TO_SKILL).forEach(([label, key]) => {
    const raw = Number(cell(label));
    if (!Number.isNaN(raw) && raw >= 1 && raw <= 5) scores[key] = raw;
  });

  return {
    timestamp: cell("Timestamp") || `${date}T00:00:00.000Z`,
    playerName,
    date,
    sessionType: (cell("Session Type") || "Training") as SessionType,
    assessedBy: cell("Assessed By"),
    position: (cell("Position Played") || "Mixed-Training") as Position,
    scores,
    highlight: cell("Highlight") || undefined,
    areaToDevelop: cell("Area to Develop") || undefined,
    internalNotes: cell("Internal Coach Notes") || undefined,
  };
}

async function fetchFromSheet(): Promise<Assessment[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(
    SHEET_RANGE
  )}?key=${SHEET_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Sheets API error: ${res.status}`);
  const json = (await res.json()) as { values?: string[][] };
  const values = json.values ?? [];
  if (values.length < 2) return [];
  const [headers, ...rows] = values;
  return rows
    .map((r) => rowToAssessment(headers, r))
    .filter((a): a is Assessment => a !== null);
}

/** Remove parent-forbidden fields from a row. */
function scrub(a: Assessment): Assessment {
  const { internalNotes: _omit, ...rest } = a;
  return rest;
}

/** URL-safe token for a player, e.g. "Milo S." -> "milo-s". */
export function playerSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type GetAssessmentsOptions =
  | { audience: "coach" }
  | { audience: "parent"; childName: string };

/**
 * Primary entry point. Returns live sheet data when configured, else mock data.
 *
 * Privacy: the parent audience is scoped to a SINGLE child. Rows for every
 * other player are filtered out here — at the data layer — so a parent's client
 * never receives another child's data, and `internalNotes` is stripped too.
 */
export async function getAssessments(
    teamId: string,
    opts: GetAssessmentsOptions = { audience: "coach" }
): Promise<Assessment[]> {
  let rows: Assessment[];

  if (isSupabaseConfigured()) {
    // Supabase is the primary store once configured.
    try {
      const { data, error } = await supabase!
        .from("assessments")
        .select("*")
        .eq("team_id", teamId)
        .order("date", { ascending: true });
      if (error) throw error;
      rows = (data ?? []).map((r) => dbRowToAssessment(r as Record<string, unknown>));
    } catch (err) {
      console.error("Supabase read failed, falling back to mock data:", err);
      rows = MOCK_ASSESSMENTS;
    }
  } else if (isLiveDataConfigured()) {
    try {
      rows = await fetchFromSheet();
    } catch (err) {
      console.error("Falling back to mock data:", err);
      rows = MOCK_ASSESSMENTS;
    }
  } else {
    rows = MOCK_ASSESSMENTS;
  }

  if (opts.audience === "parent") {
    return rows
      .filter((r) => r.playerName === opts.childName)
      .map(scrub);
  }
  return rows;
}

/** Find one assessment by player, session date, and session type. */
export async function getAssessmentByIdentity(
  playerId: string,
  date: string,
  sessionType: SessionType
): Promise<Assessment | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase!
    .from("assessments")
    .select("*")
    .eq("player_id", playerId)
    .eq("date", date)
    .eq("session_type", sessionType)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data
    ? dbRowToAssessment(data as Record<string, unknown>)
    : null;
}

/**
 * Resolve which child a parent is allowed to see. In production this comes from
 * an authenticated session or a signed per-player URL token; here we read a
 * `?child=<slug>` query param and match it against the roster. Returns null if
 * the token is missing or doesn't match a known player.
 */
export async function resolveParentChild(teamId: string, token?: string): Promise<PlayerMeta | null> {
  if (!token) return null;
  const roster = await getRoster(teamId);
  return roster.find((m) => playerSlug(m.name) === token) ?? null;
}

/** Attendance for a single child (parent) or the whole squad (coach). */
export async function getAttendance(teamId: string, childName?: string): Promise<AttendanceRecord[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase!.from("attendance").select("*").eq("team_id", teamId);
      if (error) throw error;
      let rows: AttendanceRecord[] = (data ?? []).map((r) => ({
        playerName: String(r.player_name),
        attended: Number(r.attended),
        total: Number(r.total),
      }));
      if (childName) rows = rows.filter((a) => a.playerName === childName);
      return rows;
    } catch (err) {
      console.error("Supabase attendance read failed, falling back to mock:", err);
    }
  }
  if (childName) return MOCK_ATTENDANCE.filter((a) => a.playerName === childName);
  return MOCK_ATTENDANCE;
}

/** Goals for a single player or the whole squad. */
export async function getGoals(teamId: string, playerId?: string): Promise<Goal[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    let query = supabase!
      .from("goals")
      .select(
        "id, player_id, text, status, created_at, updated_at, achieved_at"
      )
        .eq("team_id", teamId);

    if (playerId) {
      query = query.eq("player_id", playerId);
    }

    const { data, error } = await query.order("created_at", {ascending: true});

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => ({
      id: String(row.id),
      playerId: String(row.player_id),
      text: String(row.text),
      status:
        String(row.status) === "achieved"
          ? "achieved"
          : "in-progress",
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      achievedAt: row.achieved_at
        ? String(row.achieved_at)
        : null
    }));
  } catch (error) {
    console.error("Supabase goals read failed:", error);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Writes (Supabase). When Supabase is NOT configured these are no-ops that
// resolve successfully, so the in-app form still updates the UI via React state
// during local/demo use.
// ---------------------------------------------------------------------------

/**
 * Persist a coach-entered assessment. If `newPlayer` is provided, the player is
 * inserted first (and seeded with an attendance row); otherwise the existing
 * player's attendance is incremented by one session.
 */
export async function saveAssessment(
  assessment: Assessment,
  newPlayer?: PlayerMeta
): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  if (newPlayer) {
    const { data: existingPlayer, error: lookupError } = await supabase!
      .from("players")
      .select("id, is_active")
      .eq("number", newPlayer.number)
      .maybeSingle();

    if (lookupError) {
      throw lookupError;
    }

    let playerId: string;

    if (existingPlayer) {
      if (existingPlayer.is_active) {
        throw new Error(
          `Jersey number #${newPlayer.number} already belongs to an active player.`
        );
      }

      const { data: reactivatedPlayer, error: reactivateError } =
        await supabase!
          .from("players")
          .update({
            player_name: newPlayer.name,
            primary_position: newPlayer.primaryPosition,
            age_group: newPlayer.ageGroup,
            is_active: true,
          })
          .eq("id", existingPlayer.id)
          .select("id")
          .single();

      if (reactivateError) {
        throw reactivateError;
      }

      playerId = String(reactivatedPlayer.id);
    } else {
      const { data: createdPlayer, error: playerError } = await supabase!
        .from("players")
        .insert({
          player_name: newPlayer.name,
          number: newPlayer.number,
          primary_position: newPlayer.primaryPosition,
          age_group: newPlayer.ageGroup,
          is_active: true,
        })
        .select("id")
        .single();

      if (playerError) {
        throw playerError;
      }

      if (!createdPlayer?.id) {
        throw new Error("The new player was created without a player ID.");
      }

      playerId = String(createdPlayer.id);

      const { error: attendanceError } = await supabase!
        .from("attendance")
        .insert({
          id: playerId,
          player_name: newPlayer.name,
          attended: 1,
          total: DEFAULT_ATTENDANCE_TOTAL,
        });

      if (attendanceError) {
        throw attendanceError;
      }
    }

    assessment.playerId = playerId;
    newPlayer.id = playerId;
  }

  const assessmentRow = assessmentToDbRow(assessment);

  let assessmentError;

  if (assessment.id) {
    console.log("Updating assessment:", {
      id: assessment.id,
      row: assessmentRow
    });
    const result = await supabase!
      .from("assessments")
      .update({
        ...assessmentRow,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assessment.id)
      .select("id, updated_at")
      .single();

    console.log("Assessment update result:", {
      data: result.data,
      error: result.error
    });

    assessmentError = result.error;
  } else {
    const result = await supabase!
      .from("assessments")
      .insert(assessmentRow);

    assessmentError = result.error;
  }

  if (assessmentError) {
    throw assessmentError;
  }

  if (!newPlayer && !assessment.id) {
    const { data } = await supabase!
      .from("attendance")
      .select("attended,total")
      .eq("player_name", assessment.playerName)
      .maybeSingle();

    if (data) {
      const attended = Math.min(
        Number(data.attended) + 1,
        Number(data.total)
      );

      await supabase!
        .from("attendance")
        .update({ attended })
        .eq("player_name", assessment.playerName);
    }
  }
}

/** Flip a goal between in-progress and achieved. No-op in demo mode. */
export async function toggleGoalStatus(
  id: string,
  nextStatus: "achieved" | "in-progress"
): Promise<Goal> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  const now = new Date().toISOString();
  const { data, error } = await supabase!
      .from("goals")
      .update({
        status: nextStatus,
        updated_at: now,
        achieved_at: nextStatus === "achieved" ? now : null
      })
      .eq("id", id)
      .select("id, player_id, text, status, created_at, updated_at, achieved_at")
      .single();

  if (error) {throw error;}
  if (!data) {
    throw new Error("The goal status was updated but no record was returned.");
  }

  return {
    id: String(data.id),
    playerId: String(data.player_id),
    text: String(data.text),
    status: data.status === "achieved" ? "achieved" : "in-progress",
    createdAt: String(data.created_at),
    updatedAt: String(data.updated_at),
    achievedAt: data.achieved_at
      ? String(data.achieved_at): null
  };
}

/** Create a new goal for a player. */
export async function createGoal(
  playerId: string,
  text: string
): Promise<Goal> {
  const cleanText = text.trim();

  if (!cleanText) {
    throw new Error("Goal text cannot be empty.");
  }

  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase!
    .from("goals")
    .insert({
      player_id: playerId,
      text: cleanText,
      status: "in-progress",
    })
    .select(
      "id, player_id, text, status, created_at, updated_at, achieved_at"
    )
    .single();

  if (error) {
    throw Error;
  }

  if (!data) {
    throw new Error("The goal was saved but no record was returned");
  }

  return {
    id: String(data.id),
    playerId: String(data.player_id),
    text: String(data.text),
    status:
      String(data.status) === "achieved"
        ? "achieved"
        : "in-progress",
    createdAt: String(data.created_at),
    updatedAt: String(data.updated_at),
    achievedAt: data.achieved_at
      ? String(data.achieved_at)
      : undefined
  };
}