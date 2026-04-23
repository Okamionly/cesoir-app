"use client";

import { useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { checkPhoto } from "@/lib/nsfw";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface PhotoUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
  onUploadComplete: (url: string) => void;
  /** Compact mode for inline use (profile page overlay) */
  variant?: "default" | "compact";
  /** Display name initial as fallback */
  fallbackLetter?: string;
}

export default function PhotoUpload({
  userId,
  currentAvatarUrl,
  onUploadComplete,
  variant = "default",
  fallbackLetter = "?",
}: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayUrl = preview || currentAvatarUrl;

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Format accepte : JPG, PNG ou WebP");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError(`Taille max : ${MAX_SIZE_MB} Mo`);
      return;
    }

    // NSFW pre-check (V5 Wave 15 — Trust & Safety)
    setUploading(true);
    setProgress(5);
    const nsfwResult = await checkPhoto(file);
    if (!nsfwResult.safe) {
      setUploading(false);
      setProgress(0);
      setError(
        `Photo refusee : contenu inapproprie detecte (${nsfwResult.categories.join(", ")}). Merci de choisir une autre photo.`,
      );
      return;
    }
    setUploading(false);
    setProgress(0);

    // Show local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Auto-upload
    uploadFile(file);
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function uploadFile(file: File) {
    setUploading(true);
    setProgress(0);
    setError(null);

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filePath = `${userId}/avatar.${ext}`;

    // Simulate progress since supabase-js v2 doesn't expose upload progress
    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return p + 10;
      });
    }, 120);

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    clearInterval(progressInterval);

    if (uploadError) {
      setProgress(0);
      setUploading(false);
      setError("Erreur lors de l'upload. Reessaie.");
      setPreview(null);
      return;
    }

    setProgress(100);

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const publicUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    // Update profile
    await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", userId);

    setTimeout(() => {
      setUploading(false);
      setProgress(0);
      onUploadComplete(publicUrl);
    }, 400);
  }

  // -- Compact variant: just a circular photo with camera overlay --
  if (variant === "compact") {
    return (
      <div className="relative group">
        <div className="w-28 h-28 rounded-2xl gradient-bg p-[3px] shadow-glow shrink-0 transition-all group-hover:shadow-[0_0_40px_rgba(139,92,246,0.35)]">
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Photo de profil"
              className="w-full h-full rounded-[13px] object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-[13px] bg-bg flex items-center justify-center text-[36px] font-black text-accent">
              {fallbackLetter}
            </div>
          )}
        </div>

        {/* Camera overlay button */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          aria-label="Changer la photo de profil"
          className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full gradient-bg flex items-center justify-center shadow-glow border-2 border-bg active:scale-90 transition-transform tap-target"
        >
          {uploading ? (
            <svg width="16" height="16" viewBox="0 0 24 24" className="animate-spin text-white">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          )}
        </button>

        {/* Progress ring */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-28 h-28 rounded-2xl border-2 border-accent/30 overflow-hidden">
              <div
                className="h-full gradient-bg opacity-20 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          aria-hidden="true"
        />

        {error && (
          <p className="absolute -bottom-7 left-0 right-0 text-[10px] text-danger text-center font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }

  // -- Default variant: full upload card for registration --
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Circle preview */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label="Selectionner une photo de profil"
        className="relative w-32 h-32 rounded-full group tap-target focus-visible:outline-2 focus-visible:outline-accent"
      >
        {/* Gradient border */}
        <div className="absolute inset-0 rounded-full gradient-bg opacity-40 group-hover:opacity-100 transition-opacity" />
        <div className="absolute inset-[3px] rounded-full bg-bg overflow-hidden">
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Apercu de ta photo"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-text-muted group-hover:text-accent transition-colors">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span className="text-[10px] font-semibold">Ajouter</span>
            </div>
          )}
        </div>

        {/* Upload progress overlay */}
        {uploading && (
          <div className="absolute inset-[3px] rounded-full bg-bg/70 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center">
              <svg width="24" height="24" viewBox="0 0 24 24" className="animate-spin text-accent mx-auto mb-1">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="31.4" strokeDashoffset="10" strokeLinecap="round" />
              </svg>
              <span className="text-[11px] font-bold text-accent">{progress}%</span>
            </div>
          </div>
        )}
      </button>

      {/* Progress bar */}
      {uploading && (
        <div className="w-full max-w-[200px] h-1 bg-border rounded-full overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progression de l'upload">
          <div
            className="h-full gradient-bg rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Label */}
      {!uploading && !displayUrl && (
        <p className="text-[13px] text-text-muted text-center">
          JPG, PNG ou WebP &middot; {MAX_SIZE_MB} Mo max
        </p>
      )}

      {/* Success state */}
      {!uploading && displayUrl && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-[12px] text-accent font-semibold hover:underline tap-target"
        >
          Changer la photo
        </button>
      )}

      {/* Error */}
      {error && (
        <p className="text-[12px] text-danger font-medium text-center" role="alert">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
