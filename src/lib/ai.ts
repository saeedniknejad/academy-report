// ---------------------------------------------------------------------------
// AI coach-note expansion.
//
// In production this calls a serverless function (`/api/expand`) that holds the
// OpenAI / Gemini key server-side — the key must never ship to the browser.
// When no endpoint is configured we return a deterministic local mock so the
// feature is fully demoable offline.
// ---------------------------------------------------------------------------
import type { ExpandedNote } from "./types";

const AI_ENDPOINT = import.meta.env.VITE_AI_ENDPOINT as string | undefined;

/** System prompt used by the serverless function (documented here for parity). */
export const SYSTEM_PROMPT = `You are a youth soccer development report writer. Convert the coach's shorthand observation into:
1. A 2-3 sentence parent-friendly paragraph that explains the observation, contextualizes it as normal for the age group (U10-U12), and maintains an encouraging tone. Never compare to other players.
2. A "Try at home" drill suggestion (specific exercise, duration, frequency).
3. A "Suggested training drill" for the coach (more technical, with sets/reps/conditions).

Rules:
- Lead with what the player IS doing well related to this area
- Frame the growth area as "next challenge" not a weakness
- Use simple language (no tactical jargon for parents)
- Keep the parent version to 2-3 sentences max
- Make the drill actionable and fun for the age group

Return strict JSON: { "parentNote": string, "tryAtHome": string, "coachDrill": string }`;

export interface ExpandRequest {
  observation: string;
  playerName?: string;
  ageGroup?: string;
  position?: string;
}

async function callEndpoint(req: ExpandRequest): Promise<ExpandedNote> {
  const res = await fetch(AI_ENDPOINT as string, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`AI endpoint error: ${res.status}`);
  return (await res.json()) as ExpandedNote;
}

// A small keyword-driven mock so different notes produce different, relevant
// output without any network call.
function mockExpand(req: ExpandRequest): ExpandedNote {
  const name = req.playerName ?? "Your child";
  const obs = req.observation.toLowerCase();

  const pick = <T,>(fallback: T, ...cases: [boolean, T][]): T => {
    for (const [cond, val] of cases) if (cond) return val;
    return fallback;
  };

  const parentNote = pick(
    `${name} is showing real commitment in this area and it's paying off in sessions. The observation the coach noted — "${req.observation}" — is a completely normal part of development at this age, and it becomes the next fun challenge to work on together. With a little regular practice, this is exactly the kind of skill that clicks quickly at U10–U12.`,
    [
      obs.includes("touch") || obs.includes("receiv"),
      `${name} is reading the game well and getting into good positions to receive the ball. Right now the next challenge is settling that first touch when a defender is close — this is completely normal at this age as "scanning before receiving" is still developing. A few minutes of playful practice at home will build the confidence to take that touch under pressure.`,
    ],
    [
      obs.includes("shoot") || obs.includes("finish") || obs.includes("goal"),
      `${name} is getting into great goalscoring positions, which is the hardest part to teach. The next step is being decisive when the chance appears rather than taking an extra touch — totally normal for this age as composure grows with repetition. Short, fun finishing games will turn those chances into goals.`,
    ],
    [
      obs.includes("pass") || obs.includes("link"),
      `${name} sees passing options that many players miss and links up well with teammates. The next challenge is weighting the pass under a bit more pressure — a normal development stage that sharpens with reps. A quick daily passing game builds that timing.`,
    ]
  );

  const tryAtHome = pick(
    `Wall-pass touches: one-touch passes against a wall, gradually increasing the pace. 5 minutes a day, 4 days a week — make it a game by counting clean touches in a row.`,
    [
      obs.includes("shoot") || obs.includes("finish"),
      `Two-touch finish: roll the ball out, one touch to set, one touch to shoot at a target (a bucket or cones). 3 rounds of 10 shots, twice a week — celebrate every target hit!`,
    ],
    [
      obs.includes("dribbl") || obs.includes("1v1"),
      `Cone slalom: set 5 cones a step apart and dribble through using both feet. 4 runs, rest, repeat for 6 minutes — race a timer to make it fun.`,
    ]
  );

  const coachDrill = pick(
    `Rondo 4v1 with a one-touch condition and a defender applying pressure from behind. 3 sets of 4 minutes, 60s rest. Progression: shrink the grid to force faster scanning.`,
    [
      obs.includes("shoot") || obs.includes("finish"),
      `Finishing under time pressure: server plays a ball into the box, striker has 2 touches max to finish before a recovering defender arrives. 4 sets of 8 reps per foot. Condition: first touch must go forward.`,
    ],
    [
      obs.includes("touch") || obs.includes("receiv"),
      `Receiving on the half-turn: player checks to a feeder, receives across the body away from a passive-then-active defender, plays out to a target. 3 sets of 6 per side. Progression: add a scan cue before each pass.`,
    ]
  );

  return { parentNote, tryAtHome, coachDrill };
}

/** Expand a short coach observation into a full parent-facing note + drills. */
export async function expandCoachNote(req: ExpandRequest): Promise<ExpandedNote> {
  if (AI_ENDPOINT) {
    try {
      return await callEndpoint(req);
    } catch (err) {
      console.error("AI endpoint failed, using local mock:", err);
    }
  }
  // Simulate latency so the loading UI is exercised in the demo.
  await new Promise((r) => setTimeout(r, 650));
  return mockExpand(req);
}

export function isAiConfigured(): boolean {
  return Boolean(AI_ENDPOINT);
}
