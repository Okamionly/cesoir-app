import { createClient } from "./server";
import type { DbProfile } from "@/lib/supabase-types";

/** Returns the authenticated user from the session, or null. SSR-safe. */
export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
}

/** Returns the profile row for a given userId, or null. */
export async function getProfile(userId: string): Promise<DbProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data ?? null;
}

/** Returns the profile of the currently authenticated user, or null. */
export async function getCurrentProfile(): Promise<DbProfile | null> {
  const user = await getUser();
  if (!user) return null;
  return getProfile(user.id);
}
