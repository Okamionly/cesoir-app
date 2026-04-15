"use client";

import { useState, useCallback } from "react";

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
      <svg
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {copied ? (
          <path d="M20 6L9 17l-5-5" />
        ) : (
          <>
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
          </>
        )}
      </svg>
      {copied ? "Lien copie !" : "Partager"}
    </button>
  );
}
