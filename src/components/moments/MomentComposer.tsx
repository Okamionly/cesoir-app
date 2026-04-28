"use client";

/**
 * MomentComposer — modal for posting a 24h moment.
 *
 * Flow
 * ────
 * 1. User taps a "+" affordance somewhere (chat page top of NEW MATCHS).
 * 2. The composer opens with a hidden file input that's triggered on
 *    mount via a ref (mobile native picker on iOS / Android, regular
 *    file dialog on desktop).
 * 3. User picks an image. We read it into a Blob, optionally transcode
 *    JPEG/PNG → WebP via a canvas pass (webp is smaller for the same
 *    perceptual quality), and show a 1:1 preview.
 * 4. User types an optional caption (capped at 50 chars, live counter).
 * 5. Hits "Publier" — `onPost(blob, caption)` is called and the modal
 *    closes on success.
 *
 * Constraints
 * ───────────
 * - Image max 4 MB (enforced both before transcode and after).
 * - Caption max 50 chars (enforced via `maxLength` AND the API zod schema).
 * - The transcode is best-effort: if canvas decode fails (rare, animated
 *   GIF, exotic ICC profile), we fall back to uploading the original.
 * - We also downscale to 1080×1080 max (fit-inside) to bound storage cost.
 *
 * What this is NOT:
 * - It's not a camera capture. The `<input type="file" accept="image/*"
 *   capture="environment">` triggers the OS picker which on iOS gives the
 *   user a "Take Photo" + "Photo Library" choice. We rely on that native
 *   sheet rather than reimplementing camera UI.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { m, AnimatePresence } from "motion/react";
import { X } from "@/components/ui/lucide";
import { MOMENT_CAPTION_MAX, MOMENT_MAX_BYTES } from "@/lib/storage";

interface MomentComposerProps {
  open: boolean;
  onClose: () => void;
  /** Returns true if the post succeeded — composer closes on success */
  onPost: (blob: Blob, caption: string) => Promise<boolean>;
}

/**
 * Downscale + transcode a File to WebP via an offscreen canvas.
 *
 * Returns the original File (typed as Blob) if anything goes wrong —
 * the API still accepts JPEG/PNG, this is a best-effort cost saving.
 *
 * Max edge defaults to 1080 — covers the highest density iPhone display
 * the moment will ever render on; anything larger is wasted bandwidth.
 */
async function transcodeToWebp(
  file: File,
  maxEdge = 1080,
  quality = 0.85,
): Promise<Blob> {
  if (!/^image\/(jpeg|jpg|png|webp)$/i.test(file.type)) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file).catch(() => null);
    if (!bitmap) return file;

    const ratio = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * ratio);
    const h = Math.round(bitmap.height * ratio);

    const canvas =
      typeof OffscreenCanvas !== "undefined"
        ? new OffscreenCanvas(w, h)
        : (() => {
            const c = document.createElement("canvas");
            c.width = w;
            c.height = h;
            return c;
          })();

    const ctx = (canvas as HTMLCanvasElement | OffscreenCanvas).getContext("2d") as
      | CanvasRenderingContext2D
      | OffscreenCanvasRenderingContext2D
      | null;
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);

    let out: Blob | null = null;
    if ("convertToBlob" in canvas) {
      out = await (canvas as OffscreenCanvas).convertToBlob({
        type: "image/webp",
        quality,
      });
    } else {
      out = await new Promise<Blob | null>((resolve) =>
        (canvas as HTMLCanvasElement).toBlob(
          (b) => resolve(b),
          "image/webp",
          quality,
        ),
      );
    }
    bitmap.close?.();
    if (!out) return file;
    // If transcoding actually made it bigger (rare on screenshots), keep
    // the original.
    return out.size < file.size ? out : file;
  } catch {
    return file;
  }
}

export function MomentComposer({ open, onClose, onPost }: MomentComposerProps) {
  const [file, setFile] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset internal state every time the composer opens.
  useEffect(() => {
    if (!open) {
      setFile(null);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setCaption("");
      setPosting(false);
      setError(null);
    }
  }, [open]);

  // Auto-trigger the file picker on first open. iOS Safari requires
  // the click to come from a user gesture — but since `open` is
  // toggled inside an onClick handler upstream, the gesture context
  // is preserved.
  useEffect(() => {
    if (open && !file && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [open, file]);

  // Revoke the object URL on unmount to avoid leaking blob handles.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const picked = e.target.files?.[0];
      if (!picked) return;

      if (picked.size > MOMENT_MAX_BYTES) {
        setError(
          `Photo trop grande (max ${Math.round(MOMENT_MAX_BYTES / 1024 / 1024)} Mo)`,
        );
        return;
      }

      setError(null);
      const transcoded = await transcodeToWebp(picked);

      // Defence in depth: re-check size post-transcode (the canvas
      // pass can occasionally INFLATE a tiny PNG when downscaled to
      // an awkward dimension).
      if (transcoded.size > MOMENT_MAX_BYTES) {
        setError(
          `Photo trop grande après compression (max ${Math.round(MOMENT_MAX_BYTES / 1024 / 1024)} Mo)`,
        );
        return;
      }

      setFile(transcoded);
      const url = URL.createObjectURL(transcoded);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    },
    [],
  );

  const handlePublish = useCallback(async () => {
    if (!file || posting) return;
    setPosting(true);
    setError(null);
    const ok = await onPost(file, caption.trim());
    setPosting(false);
    if (ok) {
      onClose();
    } else {
      setError("Échec de la publication. Réessaie.");
    }
  }, [file, posting, caption, onPost, onClose]);

  const remaining = MOMENT_CAPTION_MAX - caption.length;
  const overLimit = remaining < 0;

  return (
    <AnimatePresence>
      {open && (
        <m.div
          key="moment-composer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/85 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Publier un moment"
        >
          <m.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="bg-bg w-full sm:w-[420px] sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-[15px] font-semibold text-text">
                Nouveau moment
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="w-8 h-8 rounded-full hover:bg-border/40 flex items-center justify-center"
              >
                <X size={18} className="text-text" />
              </button>
            </div>

            {/* File input — visually hidden, triggered programmatically */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="sr-only"
              onChange={handleFileChange}
            />

            {/* Preview / picker */}
            <div className="px-4 pt-4">
              {previewUrl ? (
                <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-border/40">
                  {/* Native <img> — Next/Image needs a remote loader for
                      blob: URLs and the cost isn't worth it for a
                      transient preview. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Aperçu du moment"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 px-3 py-1.5 rounded-full bg-black/60 text-white text-[12px] font-semibold backdrop-blur"
                  >
                    Changer
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square w-full rounded-xl border-2 border-dashed border-accent/40 flex flex-col items-center justify-center gap-2 hover:border-accent/70 transition-colors"
                >
                  <span className="text-3xl text-accent">+</span>
                  <span className="text-[13px] font-semibold text-text">
                    Choisir une photo
                  </span>
                  <span className="text-[11px] text-text-muted">
                    JPEG / PNG / WebP, 4 Mo max
                  </span>
                </button>
              )}
            </div>

            {/* Caption */}
            <div className="px-4 pt-3 pb-4">
              <label
                htmlFor="moment-caption"
                className="text-[10px] text-text-muted uppercase tracking-widest font-semibold mb-1.5 block"
              >
                Caption (optionnelle)
              </label>
              <div className="relative">
                <input
                  id="moment-caption"
                  type="text"
                  value={caption}
                  onChange={(e) =>
                    setCaption(e.target.value.slice(0, MOMENT_CAPTION_MAX + 5))
                  }
                  maxLength={MOMENT_CAPTION_MAX + 5}
                  placeholder="Au bar Z…"
                  className="w-full bg-border/30 border border-border focus:border-accent rounded-xl px-3.5 py-3 text-[14px] text-text outline-none transition-colors"
                />
                <span
                  className={`absolute right-3 top-1/2 -translate-y-1/2 text-[11px] tabular-nums ${
                    overLimit ? "text-red-500" : "text-text-muted"
                  }`}
                >
                  {remaining}
                </span>
              </div>
            </div>

            {error && (
              <div className="px-4 pb-2">
                <p className="text-[12px] text-red-500">{error}</p>
              </div>
            )}

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border flex items-center gap-2 bg-bg">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-[14px] font-semibold text-text-muted hover:text-text transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={!file || posting || overLimit}
                className="flex-1 py-3 rounded-xl text-[14px] font-semibold text-white gradient-bg disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {posting ? "Publication…" : "Publier"}
              </button>
            </div>

            <div className="px-4 pb-4 -mt-1">
              <p className="text-[10px] text-text-muted text-center">
                Visible 24 h par tes matchs uniquement.
              </p>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
