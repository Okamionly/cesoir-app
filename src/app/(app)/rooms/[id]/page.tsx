"use client";

// ========================================
// Room Detail — stub (2026-04-20 mock cleanup)
// ========================================
//
// The full live-audio room UI (speakers + listeners + hand raises + mute/
// unmute + live timer) lived here as a prototype driven by a hardcoded
// MOCK_ROOM_DATA map. The backend (realtime audio + presence via Supabase
// Realtime or LiveKit) is not yet wired up, so any visit to a specific room
// now renders a premium EmptyState. The rooms list at /rooms continues to
// work against the `useRooms` hook.

import { useParams } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

export default function RoomDetailPage() {
  const params = useParams();
  const roomId = typeof params.id === "string" ? params.id : "";

  return (
    <div className="min-h-screen bg-bg pb-28">
      <PageHeader
        title="Salon vocal"
        icon={<span className="text-lg" aria-hidden="true">{"\uD83C\uDFA7"}</span>}
      />
      <EmptyState
        emoji={"\uD83C\uDFA4"}
        title="Salon bientot disponible"
        subtitle={
          roomId
            ? "Les salons vocaux en direct arrivent tres bientot. En attendant, reviens a la liste pour voir les prochains."
            : "Les salons vocaux en direct arrivent tres bientot."
        }
        actionLabel="Retour aux salons"
        actionHref="/rooms"
      />
    </div>
  );
}
