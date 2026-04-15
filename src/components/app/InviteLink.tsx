"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---

interface InviteLinkProps {
  referralCount?: number;
}

interface ShareOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: (link: string, text: string) => void;
}

// --- Component ---

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default function InviteLink({ referralCount = 3 }: InviteLinkProps) {
  const [code] = useState(generateCode);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const link = `cesoir.app/invite/${code}`;
  const shareText = `Rejoins-moi sur CeSoir ce soir ! ${link}`;

  const handleCopy = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback: do nothing if clipboard API is unavailable
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const shareOptions: ShareOption[] = useMemo(
    () => [
      {
        id: "copy",
        label: "Copier",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        ),
        action: (lnk: string) => handleCopy(lnk, "copy"),
      },
      {
        id: "whatsapp",
        label: "WhatsApp",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
          </svg>
        ),
        action: (_: string, txt: string) => {
          window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank");
        },
      },
      {
        id: "instagram",
        label: "Instagram Story",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="5" />
            <circle cx="18" cy="6" r="1.5" fill="currentColor" stroke="none" />
          </svg>
        ),
        action: (_: string, txt: string) => {
          handleCopy(txt, "instagram");
        },
      },
      {
        id: "sms",
        label: "SMS",
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        ),
        action: (_: string, txt: string) => {
          window.open(`sms:?body=${encodeURIComponent(txt)}`, "_self");
        },
      },
    ],
    [handleCopy]
  );

  return (
    <div className="bg-card border border-border rounded-2xl p-5" aria-label="Lien d'invitation">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-display font-bold text-text">Invite tes amis</h3>
        {referralCount > 0 && (
          <span className="text-[11px] font-semibold text-accent">
            {referralCount} invite{referralCount > 1 ? "s" : ""} utilise{referralCount > 1 ? "es" : "e"}
          </span>
        )}
      </div>

      {/* Link display */}
      <div className="flex items-center gap-2 bg-bg rounded-xl p-3 border border-border mb-4">
        <span className="flex-1 text-sm font-mono text-text truncate">{link}</span>
        <button
          onClick={() => handleCopy(link, "main")}
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all"
          style={{ background: copiedId === "main" ? "#00FF88" : "#8B5CF6" }}
          aria-label={copiedId === "main" ? "Lien copie" : "Copier le lien"}
        >
          <AnimatePresence mode="wait">
            {copiedId === "main" ? (
              <motion.div
                key="check"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.2 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.2 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Share options */}
      <div className="grid grid-cols-4 gap-2">
        {shareOptions.map((opt) => {
          const isActive = copiedId === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => opt.action(link, shareText)}
              className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-bg border border-border hover:border-accent transition-colors"
              aria-label={opt.label}
            >
              <span className={isActive ? "text-[#00FF88]" : "text-text-muted"}>{opt.icon}</span>
              <span className={`text-[10px] font-semibold ${isActive ? "text-[#00FF88]" : "text-text-muted"}`}>
                {isActive ? "Copie !" : opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
