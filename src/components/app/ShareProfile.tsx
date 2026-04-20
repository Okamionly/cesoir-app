"use client";

import { useState, useCallback } from "react";
import { Check, Share2 } from "@/components/ui/lucide";

interface ShareProfileProps {
  userId: string;
  userName: string;
}

export default function ShareProfile({ userId, userName }: ShareProfileProps) {
  const [copied, setCopied] = useState(false);
  const profileUrl = `https://cesoir-app.vercel.app/p/${userId}`;

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${userName} sur CeSoir`,
          text: `Decouvre le profil de ${userName} sur CeSoir !`,
          url: profileUrl,
        });
        return;
      } catch {
        // User cancelled or API not available — fallback to clipboard
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Old browser fallback
      const input = document.createElement("input");
      input.value = profileUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [profileUrl, userName]);

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-all active:scale-[0.97] ${
        copied
          ? "bg-green-500/10 text-green-500 border border-green-500/30"
          : "bg-accent/10 text-accent border border-accent/20"
      }`}
      aria-label="Partager le profil"
    >
      {copied ? (
        <Check size={16} strokeWidth={2} aria-hidden="true" />
      ) : (
        <Share2 size={16} strokeWidth={2} aria-hidden="true" />
      )}
      {copied ? "Lien copie !" : "Partager"}
    </button>
  );
}
