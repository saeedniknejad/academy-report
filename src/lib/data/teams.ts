import type { Team } from "../types";
import { isSupabaseConfigured, supabase } from "../supabase";

export async function getMyTeams(): Promise<Team[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data: userData, error: userError } =
    await supabase!.auth.getUser();

  if (userError) {
    throw userError;
  }

  const userId = userData.user?.id;

  if (!userId) {
    throw new Error("No authenticated user was found.");
  }

  const { data, error } = await supabase!
    .from("team_members")
    .select(`
      role,
      status,
      teams (
        id,
        name,
        club_name,
        age_group,
        season_start_year,
        season_end_year,
        is_active
      )
    `)
    .eq("user_id", userId)
    .eq("status", "Active");

  if (error) {
    throw error;
  }

  return (data ?? [])
    .flatMap((membership) => membership.teams ?? [])
    .filter((team) => team.is_active)
    .map((team) => ({
      id: String(team.id),
      name: String(team.name),
      clubName: String(team.club_name),
      ageGroup: Number(team.age_group),
      seasonStartYear: Number(team.season_start_year),
      seasonEndYear: Number(team.season_end_year),
      isActive: Boolean(team.is_active),
    }));
}

export async function createTeam(input: {
  name: string;
  clubName: string;
  ageGroup: number;
  seasonStartYear: number;
  seasonEndYear: number;
}): Promise<Team> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase!.rpc(
    "create_team_with_owner",
    {
      p_name: input.name.trim(),
      p_club_name: input.clubName.trim(),
      p_age_group: input.ageGroup,
      p_season_start_year: input.seasonStartYear,
      p_season_end_year: input.seasonEndYear,
    }
  );

  if (error) {
    throw error;
  }

  const createdTeam = Array.isArray(data) ? data[0] : data;

  if (!createdTeam?.id) {
    throw new Error("The team was created without an ID.");
  }

  return {
    id: String(createdTeam.id),
    name: String(createdTeam.name),
    clubName: String(createdTeam.club_name),
    ageGroup: Number(createdTeam.age_group),
    seasonStartYear: Number(createdTeam.season_start_year),
    seasonEndYear: Number(createdTeam.season_end_year),
    isActive: Boolean(createdTeam.is_active),
  };
}

export async function deactivateTeam(teamId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase!.rpc(
    "deactivate_owned_team",
    {
      p_team_id: teamId,
    }
  );

  if (error) {
    throw error;
  }
}