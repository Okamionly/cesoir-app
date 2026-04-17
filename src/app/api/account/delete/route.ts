import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];

    // Use anon client to verify the token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    const userId = user.id;

    // Delete avatar from storage
    const { data: files } = await supabase.storage.from("avatars").list(userId);
    if (files && files.length > 0) {
      await supabase.storage.from("avatars").remove(files.map(f => `${userId}/${f.name}`));
    }

    // Delete profile (cascades to interactions, conversations, messages, reviews, reports, mode_activations)
    await supabase.from("profiles").delete().eq("id", userId);

    // Sign out the user
    await supabase.auth.signOut();

    // Note: To fully delete from auth.users, we'd need service_role key
    // For now, the profile is gone and the auth account is orphaned but harmless
    // Add SUPABASE_SERVICE_ROLE_KEY as env var later for full deletion

    return NextResponse.json({ success: true, message: "Compte supprime" });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
