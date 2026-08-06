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

export async function createRosterPlayers(
  teamId: string,
  players: PlayerMeta[]
): Promise<PlayerMeta[]> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  if (players.length === 0) {
    return [];
  }

  const rows = players.map((player) => ({
    team_id: teamId,
    player_name: player.name.trim(),
    number: player.number,
    primary_position: player.primaryPosition,
    age_group: player.ageGroup,
    is_active: true,
  }));

  const { data, error } = await supabase!
    .from("players")
    .insert(rows)
    .select("id, player_name, number, primary_position, age_group");

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.player_name),
    number: Number(row.number),
    primaryPosition: String(row.primary_position),
    ageGroup: String(row.age_group),
  }));
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