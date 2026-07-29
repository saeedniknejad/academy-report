// ---------------------------------------------------------------------------
// Supabase client.
//
// The client is created only when the two public env vars are present. When
// they are absent, `supabase` is null and the app runs entirely on bundled mock
// data — so the project works out of the box and only talks to Supabase once
// you've filled in `.env`.
// ---------------------------------------------------------------------------
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  URL && ANON_KEY ? createClient(URL, ANON_KEY) : null;

export function isSupabaseConfigured(): boolean {
  return supabase !== null;
}

/**
 * Whether a coach must sign in before using the app. Off by default so you can
 * get the app live first; set VITE_REQUIRE_AUTH=true once Supabase auth is set
 * up to lock data entry to your coach only.
 */
export function authRequired(): boolean {
  return isSupabaseConfigured() && import.meta.env.VITE_REQUIRE_AUTH === "true";
}
