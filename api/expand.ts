// ---------------------------------------------------------------------------
// Vercel serverless function: POST /api/expand
//
// Turns a coach's short observation into a parent-friendly note + drills using
// Google Gemini. The model API key lives ONLY in this function's server-side
// env (GEMINI_API_KEY) and never reaches the browser.
//
// Request body:  { observation, playerName?, ageGroup?, position? }
// Response JSON:  { parentNote, tryAtHome, coachDrill }
//
// If GEMINI_API_KEY is not set, this returns 501 and the app falls back to its
// built-in local mock (see src/lib/ai.ts), so the app keeps working.
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a youth soccer development report writer. Convert the coach's shorthand observation into:
1. A 2-3 sentence parent-friendly paragraph that explains the observation, contextualizes it as normal for the age group (U10-U12), and maintains an encouraging tone. Never compare to other players.
2. A "Try at home" drill suggestion (specific exercise, duration, frequency).
3. A "Suggested training drill" for the coach (more technical, with sets/reps/conditions).

Rules:
- Lead with what the player IS doing well related to this area
- Frame the growth area as "next challenge" not a weakness
- Use simple language (no tactical jargon for parents)
- Keep the parent version to 2-3 sentences max
- Make the drill actionable and fun for the age group

Return ONLY strict minified JSON with exactly these keys: {"parentNote": string, "tryAtHome": string, "coachDrill": string}`;

import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

type ExpandRequest = {
  playerId: string;
  observation: string;
  playerName?: string;
  ageGroup?: string;
  position?: string;
  sessionType?: string;
  theme?: string;
};

function normalizeText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,!?;:]+$/g, "");
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY."
  );
}

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Minimal Vercel handler signature (no @vercel/node types needed).
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    res.status(501).json({ error: "GEMINI_API_KEY not configured" });
    return;
  }

  try {
    const {
      playerId,
      observation,
      playerName,
      ageGroup,
      position,
      sessionType,
      theme,
    } = (req.body ?? {}) as Partial<ExpandRequest>;
    if (!playerId || typeof playerId !== "string") {
      res.status(400).json({ error: "Missing 'playerId'." });
      return;
    }
    if (!observation || typeof observation !== "string") {
      res.status(400).json({ error: "Missing 'observation'." });
      return;
    }

    const normalizedContext = JSON.stringify({
      playerId,
      observation: normalizeText(observation),
      ageGroup: normalizeText(ageGroup ?? ""),
      position: normalizeText(position ?? ""),
      sessionType: normalizeText(sessionType ?? ""),
      theme: normalizeText(theme ?? ""),
    });

    const contextHash = createHash("sha256")
      .update(normalizedContext)
      .digest("hex");

    const today = new Date().toISOString().slice(0, 10);

    const { data: todayGeneration, error: cacheError } = await supabaseAdmin
      .from("ai_generations")
      .select("id, context_hash, generated_note")
      .eq("player_id", playerId)
      .eq("generation_date", today)
      .maybeSingle();

    if (cacheError) {
      throw cacheError;
    }

    if (todayGeneration) {
      const cachedNote =
        typeof todayGeneration.generated_note === "string"
          ? JSON.parse(todayGeneration.generated_note)
          : todayGeneration.generated_note;

      if (todayGeneration.context_hash === contextHash) {
        return res.status(200).json({
          parentNote: String(cachedNote.parentNote ?? ""),
          tryAtHome: String(cachedNote.tryAtHome ?? ""),
          coachDrill: String(cachedNote.coachDrill ?? ""),
          cached: true,
        });
      }

      return res.status(429).json({
        error: "An AI note has already been generated for this player today.",
        dailyLimitReached: true,
      });
    }
    
    if (cacheError) {
      throw cacheError;
    }

    if (cachedGeneration) {
      const cachedNote =
        typeof cachedGeneration.generated_note === "string"
          ? JSON.parse(cachedGeneration.generated_note)
          : cachedGeneration.generated_note
      return res.status(200).json({
        parentNote: String(cachedNote.parentNote ?? ""),
        tryAtHome: String(cachedNote.tryAtHome ?? ""),
        coachDrill: String(cachedNote.coachDrill ?? ""),
        cached: true,
      });
    }

    const userPrompt = [
      `Coach observation: "${observation}"`,
      playerName ? `Player: ${playerName}` : "",
      ageGroup ? `Age group: ${ageGroup}` : "",
      position ? `Position: ${position}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const model = "gemini-3.6-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
      }),
    });

    if (!geminiRes.ok) {
      const detail = await geminiRes.text();
      console.error("Gemini error:", detail);
      res.status(502).json({ error: "AI provider error" });
      return;
    }

    const data = await geminiRes.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

    const parsed = JSON.parse(text);

    const generatedNote = {
      parentNote: String(parsed.parentNote ?? ""),
      tryAtHome: String(parsed.tryAtHome ?? ""),
      coachDrill: String(parsed.coachDrill ?? ""),
    };

    const { data: savedGeneration, error: saveError } = await supabaseAdmin
      .from("ai_generations")
      .insert({
        player_id: playerId,
        context_hash: contextHash,
        generation_date: today,
        generated_note: JSON.stringify(generatedNote),
      })
      .select("id, generated_note")
      .single();

    if (saveError) {
      throw saveError;
    }

    return res.status(200).json({
      ...generatedNote,
      cached: false,
    });

  } catch (err) {
    console.error("expand handler failed:", err);
    res.status(500).json({ error: "Internal error" });
  }
}
