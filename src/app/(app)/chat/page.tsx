"use client";

import type { Metadata } from "next";

const mockChats = [
  { id: "1", name: "Sarah", lastMsg: "Super ! On se retrouve a 20h au resto ?", time: "19:32", unread: 2, color: "#8B5CF6", mode: "🍽️ Solo Diner", online: true },
  { id: "2", name: "Claire", lastMsg: "Rex est trop content ! A tout a l'heure", time: "18:45", unread: 1, color: "#00FF88", mode: "🐶 Dog Date", online: true },
  { id: "3", name: "Marta", lastMsg: "Perfecto ! Hablamos en espanol y francais", time: "17:20", unread: 0, color: "#f59e0b", mode: "🌐 Langues", online: false },
  { id: "4", name: "Thomas", lastMsg: "J'ai pris les places, RDV devant le cinema", time: "16:05", unread: 0, color: "#ec4899", mode: "🎬 Plus-One", online: false },
];

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border px-4 pt-2 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg text-accent" aria-hidden="true">☾</span>
            <span className="text-base font-bold">Messages</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" aria-hidden="true" />
            <span className="text-[11px] text-accent font-semibold">{mockChats.filter(c => c.unread > 0).length} nouveaux</span>
          </div>
        </div>
      </header>

      {/* Matches bar */}
      <div className="px-4 py-4 border-b border-border">
        <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold mb-3">Nouveaux matchs</p>
        <div className="flex gap-4 overflow-x-auto no-scrollbar" role="list" aria-label="Nouveaux matchs">
          {mockChats.filter(c => c.unread > 0).map((chat) => (
            <div key={chat.id} className="shrink-0 flex flex-col items-center gap-1.5 cursor-pointer" role="listitem">
              <div className="relative">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white ring-2 ring-accent ring-offset-2 ring-offset-bg" style={{ background: chat.color }}>
                  {chat.name[0]}
                </div>
                {chat.online && <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-safe border-2 border-bg" aria-label="En ligne" />}
                {chat.unread > 0 && <div className="absolute -top-1 -right-1 w-5 h-5 gradient-bg rounded-full flex items-center justify-center text-[10px] font-bold text-white">{chat.unread}</div>}
              </div>
              <span className="text-[11px] font-semibold text-text">{chat.name}</span>
            </div>
          ))}
          {[1, 2, 3].map((i) => (
            <div key={`empty-${i}`} className="shrink-0 flex flex-col items-center gap-1.5 opacity-30" aria-hidden="true">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center text-xl text-text-muted">?</div>
              <span className="text-[11px] font-semibold text-text-muted">...</span>
            </div>
          ))}
        </div>
      </div>

      {/* Icebreakers */}
      <div className="px-4 py-4 border-b border-border">
        <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold mb-3">Brise-glaces suggeres</p>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { text: "Tu recommandes quoi comme resto ce soir ?", mode: "🍽️" },
            { text: "Ton chien s'entend bien avec les autres ?", mode: "🐶" },
            { text: "On se retrouve ou pour pratiquer ?", mode: "🌐" },
            { text: "C'est quoi ton plan pour ce soir ?", mode: "⭐" },
          ].map((ice, i) => (
            <button key={i} className="shrink-0 bg-accent/5 border border-accent/15 rounded-xl px-3.5 py-2.5 text-left max-w-[200px] hover:border-accent/30 transition-colors tap-target">
              <span className="text-[10px] text-accent font-semibold block mb-1">{ice.mode} Suggestion</span>
              <span className="text-[12px] text-text-soft leading-snug">{ice.text}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat list */}
      <div role="list" aria-label="Conversations">
        <p className="text-[10px] text-text-muted uppercase tracking-widest font-semibold px-4 pt-4 pb-2">Conversations</p>
        {mockChats.map((chat) => (
          <div key={chat.id} role="listitem" className="flex items-center gap-3.5 px-4 py-3.5 active:bg-bg-card transition-colors cursor-pointer border-b border-border/50">
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ background: chat.color }}>
                {chat.name[0]}
              </div>
              {chat.online && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-safe border-2 border-bg" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-[15px] ${chat.unread > 0 ? "font-bold text-text" : "font-semibold text-text"}`}>{chat.name}</span>
                <span className={`text-[11px] ${chat.unread > 0 ? "text-accent font-semibold" : "text-text-muted"}`}>{chat.time}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className={`text-[13px] truncate ${chat.unread > 0 ? "text-text font-medium" : "text-text-muted"}`}>{chat.lastMsg}</p>
                {chat.unread > 0 && <span className="shrink-0 w-5 h-5 gradient-bg rounded-full flex items-center justify-center text-[10px] font-bold text-white">{chat.unread}</span>}
              </div>
              <span className="text-[10px] text-text-muted mt-0.5">{chat.mode}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
