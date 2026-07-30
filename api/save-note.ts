import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

type SaveNoteRequest = {
  playerId: string;
  observation: string;
  playerName?: string;
  ageGroup?: string;
  position?: string;
  sessionType?: string;
  theme?: string;
  note: {
    parentNote: string;
    tryAtHome: string;
    coachDrill: string;
  };
};

function normalizeText(value?: string) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY."
      );
    }

    const {
      playerId,
      observation,
      playerName,
      ageGroup,
      position,
      sessionType,
      theme,
      note,
    } = req.body as SaveNoteRequest;

    if (!playerId || !observation || !note) {
      return res.status(400).json({
        error: "playerId, observation and note are required.",
      });
    }

    const normalizedContext = [
      normalizeText(observation),
      normalizeText(playerName),
      normalizeText(ageGroup),
      normalizeText(position),
      normalizeText(sessionType),
      normalizeText(theme),
    ].join("|");

    const contextHash = createHash("sha256")
      .update(normalizedContext)
      .digest("hex");

    const generatedDate = new Date().toISOString().slice(0, 10);

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    const { data, error } = await supabaseAdmin
      .from("ai_generations")
      .insert({
        player_id: playerId,
        context_hash: contextHash,
        generated_date: generatedDate,
        generated_note: note,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return res.status(200).json({
      saved: true,
      generation: data,
    });
  } catch (error) {
    console.error("save-note handler failed:", error);

    return res.status(500).json({
      error: "Unable to save AI note.",
    });
  }
}