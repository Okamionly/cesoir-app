import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

interface RsvpBody {
  event_id: string;
  action: "join" | "leave";
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
    error: authError,
  } = await db.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  }

  let body: RsvpBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const { event_id, action } = body;
  if (!event_id || typeof event_id !== "string") {
    return NextResponse.json({ error: "event_id requis" }, { status: 400 });
  }
  if (action !== "join" && action !== "leave") {
    return NextResponse.json({ error: "action doit etre 'join' ou 'leave'" }, { status: 400 });
  }

  if (action === "join") {
    // Capacity check
    const { data: event } = await db
      .from("popup_events")
      .select("max_attendees")
      .eq("id", event_id)
      .maybeSingle();

    if (event && event.max_attendees && event.max_attendees > 0) {
      const { count } = await db
        .from("event_attendees")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event_id);
      if ((count ?? 0) >= event.max_attendees) {
        return NextResponse.json({ error: "event_full" }, { status: 409 });
      }
    }

    const { error: insertError } = await db.from("event_attendees").insert({
      event_id,
      user_id: user.id,
    });

    if (insertError) {
      // 23505 = duplicate = already joined, treat as success
      if (insertError.code === "23505") {
        return NextResponse.json({ joined: true, idempotent: true });
      }
      console.error("[/api/events/rsvp] insert failed:", insertError.message);
      return NextResponse.json({ error: "Erreur lors du RSVP" }, { status: 500 });
    }

    return NextResponse.json({ joined: true });
  }

  // action === 'leave'
  const { error: deleteError } = await db
    .from("event_attendees")
    .delete()
    .eq("event_id", event_id)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("[/api/events/rsvp] delete failed:", deleteError.message);
    return NextResponse.json({ error: "Erreur lors du desistement" }, { status: 500 });
  }

  return NextResponse.json({ joined: false });
}
