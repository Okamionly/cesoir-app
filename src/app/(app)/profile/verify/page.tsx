"use client";

import Link from "next/link";
import VideoVerification from "@/components/app/VideoVerification";

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 bg-bg/95 backdrop-blur-md border-b border-border px-5 pt-3 pb-3">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="w-9 h-9 rounded-full bg-bg-card border border-border flex items-center justify-center tap-target" aria-label="Retour">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
          </Link>
          <div>
            <h1 className="text-base font-bold text-text">Verification video</h1>
            <p className="text-[11px] text-text-muted">Un selfie video = confiance x10</p>
          </div>
        </div>
      </header>

      <div className="px-4 pt-4 pb-24">
        <div className="mb-4">
          <p className="text-[13px] text-text-muted leading-relaxed">
            Pour renforcer la confiance au sein de la communaute, verifie ton profil avec un court selfie video.
            Tu devras reproduire 3 poses aleatoires.
          </p>
        </div>
        <VideoVerification />
      </div>
    </div>
  );
}
