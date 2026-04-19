"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { m, AnimatePresence } from "motion/react";
import { springs } from "@/lib/motion-design";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import PageHeader from "@/components/ui/PageHeader";
import { Upload, Download, Check, Copy } from "@/components/ui/lucide";
import ProfileShareCard, {
  GRADIENT_PRESETS,
  type CardStyle,
  type GradientPreset,
  type ShareCardData,
} from "@/components/app/ProfileShareCard";

const CARD_STYLES: { key: CardStyle; label: string; desc: string }[] = [
  { key: "minimal", label: "Minimal", desc: "Clean & elegant" },
  { key: "gradient", label: "Gradient", desc: "Bold & colorful" },
  { key: "neon", label: "Neon", desc: "Cyberpunk glow" },
];

type AspectRatio = "square" | "story" | "wide";

const ASPECT_OPTIONS: { key: AspectRatio; label: string; ratio: string }[] = [
  { key: "square", label: "Carre", ratio: "1:1" },
  { key: "story", label: "Story", ratio: "9:16" },
  { key: "wide", label: "Twitter", ratio: "16:9" },
];

export default function ShareProfilePage() {
  const { user } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);

  // Profile data
  const [profileData, setProfileData] = useState<ShareCardData>({
    name: "Youssef",
    age: 28,
    city: "Paris",
    avatarUrl: null,
    mode: "Solo Diner",
    stats: { meetups: 12, karma: 4.8, streak: 7 },
    userId: user?.id || "demo-user",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("avatar_url, name")
      .eq("id", user.id)
      .single()
      .then(({ data }: { data: { avatar_url?: string; name?: string } | null }) => {
        if (data) {
          setProfileData((prev) => ({
            ...prev,
            name: data.name || prev.name,
            avatarUrl: data.avatar_url || null,
            userId: user.id,
          }));
        }
      });
  }, [user]);

  // Card configuration
  const [cardStyle, setCardStyle] = useState<CardStyle>("minimal");
  const [gradient, setGradient] = useState<GradientPreset>(GRADIENT_PRESETS[0]);
  const [showStats, setShowStats] = useState(true);
  const [showMode, setShowMode] = useState(true);
  const [showQR, setShowQR] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("square");

  // UI state
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // 3D tilt on hover
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientY - rect.top) / rect.height - 0.5) * -10;
    const y = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
    setTilt({ x, y });
  }, []);
  const handleMouseLeave = useCallback(() => setTilt({ x: 0, y: 0 }), []);

  // Download as PNG via canvas
  const handleDownload = useCallback(async () => {
    const el = cardRef.current;
    if (!el) return;

    try {
      // Dynamic import html-to-image concept via canvas
      const canvas = document.createElement("canvas");
      const scale = 2;
      canvas.width = el.offsetWidth * scale;
      canvas.height = el.offsetHeight * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Render via foreignObject SVG -> canvas
      const svgData = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${el.offsetWidth}" height="${el.offsetHeight}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml">
              ${el.outerHTML}
            </div>
          </foreignObject>
        </svg>
      `;
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.scale(scale, scale);
          ctx.drawImage(img, 0, 0);
          URL.revokeObjectURL(url);
          resolve();
        };
        img.onerror = reject;
        img.src = url;
      });

      const link = document.createElement("a");
      link.download = `cesoir-${profileData.name.toLowerCase()}-card.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch {
      // Fallback: screenshot hint
      alert("Fais une capture d'ecran de la carte pour la partager !");
    }
  }, [profileData.name]);

  // Share via Web Share API
  const handleShare = useCallback(async () => {
    const shareUrl = `${window.location.origin}/p/${profileData.userId}`;
    const shareData = {
      title: `${profileData.name} sur CeSoir`,
      text: `Retrouve ${profileData.name} sur CeSoir ! Rejoins-moi ce soir.`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  }, [profileData]);

  // Copy link
  const handleCopyLink = useCallback(async () => {
    const shareUrl = `${window.location.origin}/p/${profileData.userId}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  }, [profileData.userId]);

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader title="Partager mon profil" backHref="/profile" />

      {/* Card Preview with 3D tilt */}
      <div className="px-5 pt-6 pb-4 flex justify-center">
        <m.div
          style={{
            perspective: 1000,
            transformStyle: "preserve-3d",
          }}
          animate={{
            rotateX: tilt.x,
            rotateY: tilt.y,
          }}
          transition={springs.snap}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <ProfileShareCard
            ref={cardRef}
            data={profileData}
            style={cardStyle}
            gradient={gradient}
            showStats={showStats}
            showMode={showMode}
            showQR={showQR}
            aspectRatio={aspectRatio}
          />
        </m.div>
      </div>

      {/* Style Selector */}
      <div className="px-5 mt-4">
        <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3">Style</p>
        <div className="flex gap-2">
          {CARD_STYLES.map((s) => {
            const active = cardStyle === s.key;
            return (
              <m.button
                key={s.key}
                onClick={() => setCardStyle(s.key)}
                animate={{
                  scale: active ? 1.05 : 0.95,
                  opacity: active ? 1 : 0.6,
                }}
                transition={springs.snap}
                className={`flex-1 py-3 rounded-xl text-center transition-colors tap-target ${
                  active
                    ? "gradient-bg text-white shadow-glow"
                    : "bg-bg-card border border-border text-text-muted"
                }`}
              >
                <p className="text-[13px] font-bold">{s.label}</p>
                <p className={`text-[9px] ${active ? "text-white/70" : "text-text-muted"}`}>{s.desc}</p>
              </m.button>
            );
          })}
        </div>
      </div>

      {/* Color Picker */}
      <div className="px-5 mt-5">
        <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3">Couleur</p>
        <div className="flex gap-3">
          {GRADIENT_PRESETS.map((g) => {
            const active = gradient.id === g.id;
            return (
              <m.button
                key={g.id}
                onClick={() => setGradient(g)}
                animate={{ scale: active ? 1.15 : 1 }}
                transition={springs.snap}
                className="flex flex-col items-center gap-1.5 tap-target"
                aria-pressed={active}
              >
                <div
                  className="w-10 h-10 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${g.from}, ${g.to})`,
                    boxShadow: active ? `0 0 16px ${g.from}50` : "none",
                    border: active ? "2px solid white" : "2px solid transparent",
                  }}
                />
                <span className={`text-[9px] font-semibold ${active ? "text-text" : "text-text-muted"}`}>
                  {g.name}
                </span>
              </m.button>
            );
          })}
        </div>
      </div>

      {/* Toggles */}
      <div className="px-5 mt-5">
        <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3">Options</p>
        <div className="bg-bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
          {[
            { label: "Afficher les stats", value: showStats, toggle: () => setShowStats(!showStats) },
            { label: "Afficher le mode", value: showMode, toggle: () => setShowMode(!showMode) },
            { label: "Afficher le QR code", value: showQR, toggle: () => setShowQR(!showQR) },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={opt.toggle}
              className="w-full flex items-center justify-between px-4 py-3.5 tap-target"
            >
              <span className="text-[13px] font-semibold text-text">{opt.label}</span>
              <div
                className={`w-11 h-6 rounded-full relative transition-colors ${
                  opt.value ? "bg-accent" : "bg-border"
                }`}
              >
                <m.div
                  className="absolute top-[2px] w-5 h-5 rounded-full bg-white shadow"
                  animate={{ left: opt.value ? 22 : 2 }}
                  transition={springs.snap}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio */}
      <div className="px-5 mt-5">
        <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3">Format</p>
        <div className="flex gap-2">
          {ASPECT_OPTIONS.map((opt) => {
            const active = aspectRatio === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setAspectRatio(opt.key)}
                className={`flex-1 py-2.5 rounded-xl text-center transition-all tap-target ${
                  active
                    ? "gradient-bg text-white shadow-glow"
                    : "border border-border text-text-muted hover:border-accent/30"
                }`}
              >
                <p className="text-[12px] font-bold">{opt.label}</p>
                <p className={`text-[9px] ${active ? "text-white/70" : "text-text-muted"}`}>{opt.ratio}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-5 mt-6 space-y-2 pb-24">
        <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3">Actions</p>

        {/* Share */}
        <m.button
          onClick={handleShare}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.snap, delay: 0.05 }}
          className="w-full gradient-bg text-white py-3.5 rounded-xl font-bold text-[14px] shadow-glow flex items-center justify-center gap-2 tap-target active:scale-[0.98] transition-transform"
        >
          <Upload size={18} strokeWidth={2} />
          Partager
        </m.button>

        {/* Copy link */}
        <m.button
          onClick={handleCopyLink}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.snap, delay: 0.1 }}
          className="w-full bg-bg-card border border-border text-text py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 tap-target active:scale-[0.98] transition-transform"
        >
          <AnimatePresence mode="wait">
            {copySuccess ? (
              <m.div
                key="check"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                transition={springs.elastic}
                className="flex items-center gap-2 text-safe"
              >
                <Check size={18} strokeWidth={2.5} />
                Copie !
              </m.div>
            ) : (
              <m.div
                key="copy"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-2"
              >
                <Copy size={18} strokeWidth={1.5} />
                Copier le lien
              </m.div>
            )}
          </AnimatePresence>
        </m.button>

        {/* Download */}
        <m.button
          onClick={handleDownload}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.snap, delay: 0.15 }}
          className="w-full bg-bg-card border border-border text-text py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 tap-target active:scale-[0.98] transition-transform"
        >
          <AnimatePresence mode="wait">
            {downloadSuccess ? (
              <m.div
                key="success"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                transition={springs.elastic}
                className="flex items-center gap-2 text-safe"
              >
                <Check size={18} strokeWidth={2.5} />
                Telecharge !
              </m.div>
            ) : (
              <m.div
                key="download"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-2"
              >
                <Download size={18} strokeWidth={1.5} />
                Telecharger PNG
              </m.div>
            )}
          </AnimatePresence>
        </m.button>
      </div>
    </div>
  );
}
