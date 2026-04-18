"use client";

import Link from "next/link";
import SceneController from "@/components/landing/SceneController";

/**
 * CeSoir Landing — Single-page morphic cinematic experience.
 *
 * The SceneController takes the full viewport (h-screen, no vertical scroll
 * between scenes). A minimal footer lives BELOW the fold, reachable via small
 * scroll after the full-viewport experience — it holds legal/about links.
 */
export default function LandingPage() {
  return (
    <div className="bg-[#0A0A0D] text-white">
      {/* Full-viewport morphic scene experience */}
      <SceneController />

      {/* Minimal footer — accessible only via scroll past the hero */}
      <footer className="border-t border-white/5 py-10 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-lg text-[#8B5CF6]">&#9790;</span>
          <span className="text-[14px] font-bold">CeSoir</span>
        </div>
        <div className="flex justify-center gap-6 mb-4 flex-wrap">
          <Link
            href="/about"
            className="text-[12px] text-white/40 hover:text-white/70 transition-colors py-1"
          >
            À propos
          </Link>
          <Link
            href="/safety"
            className="text-[12px] text-white/40 hover:text-white/70 transition-colors py-1"
          >
            Sécurité
          </Link>
          <Link
            href="/cgu"
            className="text-[12px] text-white/40 hover:text-white/70 transition-colors py-1"
          >
            CGU
          </Link>
          <Link
            href="/privacy"
            className="text-[12px] text-white/40 hover:text-white/70 transition-colors py-1"
          >
            Confidentialité
          </Link>
        </div>
        <p className="text-[10px] text-white/25">
          &copy; 2026 CeSoir. Tous droits réservés.
        </p>
      </footer>
    </div>
  );
}
