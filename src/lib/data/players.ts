import { ROSTER } from "../mockData";
import type { PlayerMeta } from "../types";
import { isSupabaseConfigured, supabase } from "../supabase";

export async function getRoster(teamId: string): Promise<PlayerMeta[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase!
        .from("players")
        .select("*")
        .eq("is_active", true)
        .eq("team_id", teamId)
        .order("number", { ascending: true });

      if (error) {
        throw error;
      }

      if (data && data.length) {
        return data.map((row) => ({
          id: String(row.id),
          name: String(row.player_name),
          number: Number(row.number),
          primaryPosition: String(row.primary_position),
          ageGroup: String(row.age_group ?? "U12"),
        }));
      }

      return [];
    } catch (error) {
      console.error("Supabase roster read failed:", error);
      throw error;
    }
  }

  return ROSTER;
}

export async function deactivatePlayer(teamId: string, playerId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase!
    .from("players")
    .update({ is_active: false })
    .eq("id", playerId)
      .eq("team_id", teamId);

  if (error) {
    throw error;
  }
}