"use client";

const mockChats = [
  { id: "1", name: "Sarah", lastMsg: "Super ! On se retrouve a 20h au resto ?", time: "19:32", unread: 2, color: "#a855f7", mode: "Solo Diner" },
  { id: "2", name: "Claire", lastMsg: "Rex est trop content ! A tout a l'heure 🐶", time: "18:45", unread: 1, color: "#f59e0b", mode: "Dog Date" },
  { id: "3", name: "Marta", lastMsg: "Perfecto ! Hablamos en español y français", time: "17:20", unread: 0, color: "#06b6d4", mode: "Langue Exchange" },
];

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-bg/90 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl text-accent">☾</span>
          <h1 className="text-xl font-extrabold">Messages</h1>
        </div>
      </div>

      {/* Chat list */}
      <div className="divide-y divide-border">
        {mockChats.map((chat) => (
          <div key={chat.id} className="flex items-center gap-3 px-4 py-4 active:bg-bg-card-hover transition-colors cursor-pointer">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0"
              style={{ background: chat.color }}
            >
              {chat.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[15px]">{chat.name}</span>
                <span className="text-xs text-text-muted">{chat.time}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-text-muted truncate">{chat.lastMsg}</p>
                {chat.unread > 0 && (
                  <span className="shrink-0 w-5 h-5 gradient-bg rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                    {chat.unread}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-accent font-medium">{chat.mode}</span>
            </div>
          </div>
        ))}
      </div>

      {mockChats.length === 0 && (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">💬</p>
          <p className="text-text-muted text-sm">Pas encore de messages</p>
          <p className="text-text-muted text-xs mt-1">Explore les profils et envoie le premier message !</p>
        </div>
      )}
    </div>
  );
}
