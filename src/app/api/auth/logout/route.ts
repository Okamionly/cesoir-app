import { createClient } from "@/lib/supabase/server";
import { apiRaw } from "@/lib/api/response";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return apiRaw({ ok: true });
}
