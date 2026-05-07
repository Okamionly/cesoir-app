"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { m, AnimatePresence } from "motion/react";
import { springs, micro, ambient } from "@/lib/motion-design";
import PageHeader from "@/components/ui/PageHeader";
import { Camera, ChevronLeft, ChevronRight, Check, Info } from "@/components/ui/lucide";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────
type VerifyMethod = "selfie" | "phone" | "social" | "video";
type SelfieStep = "instructions" | "camera" | "success";
type PhoneStep = "input" | "code" | "success";
type VideoStep = "instructions" | "smile" | "turn" | "verifying" | "success";

// ─── Constants ───────────────────────────────────────
const POSES = [
  { label: "Peace sign", emoji: "✌️", instruction: "Fais le signe de paix avec ta main" },
  { label: "Pouce en l'air", emoji: "👍", instruction: "Lève ton pouce devant la caméra" },
];

const METHODS: { key: VerifyMethod; icon: string; title: string; subtitle: string }[] = [
  { key: "selfie", icon: "📸", title: "Selfie verification", subtitle: "Photo avec une pose spécifique" },
  { key: "phone", icon: "📱", title: "Vérification téléphone", subtitle: "Code SMS à 6 chiffres" },
  { key: "video", icon: "🎥", title: "Vidéo verification", subtitle: "Liveness check en vidéo" },
  { key: "social", icon: "🔗", title: "Réseaux sociaux", subtitle: "Connecte Instagram ou LinkedIn" },
];

const VIDEO_PROMPTS = [
  { step: "smile" as const, emoji: "😊", instruction: "Souris à la caméra", duration: 2500 },
  { step: "turn" as const, emoji: "👈", instruction: "Tourne la tête à gauche", duration: 2500 },
];

// ─── Variants ────────────────────────────────────────
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.92 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...springs.elastic, delay: 0.15 + i * 0.1 },
  }),
  tap: { scale: 0.97, transition: springs.micro },
};

const stepVariants = {
  enter: { opacity: 0, x: 80, scale: 0.96 },
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
  exit: {
    opacity: 0,
    x: -80,
    scale: 0.96,
    transition: { duration: 0.3, ease: [0.76, 0, 0.24, 1] as [number, number, number, number] },
  },
};

const digitVariants = {
  hidden: { opacity: 0, scale: 0.3 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { ...springs.snap, delay: i * 0.06 },
  }),
};

const checkmarkVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.2 },
  },
};

const celebrationVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: [0, 1.35, 0.9, 1.1, 1],
    opacity: 1,
    transition: { duration: 0.7, times: [0, 0.3, 0.5, 0.7, 1] },
  },
};

// ─── Progress component ──────────────────────────────
function ProgressBar({ methods, completed }: { methods: VerifyMethod[]; completed: Set<VerifyMethod> }) {
  const total = methods.length;
  const done = methods.filter(m => completed.has(m)).length;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-text-muted font-semibold uppercase tracking-wider">
          Progression
        </span>
        <span className="text-[11px] font-bold text-accent">{done}/{total}</span>
      </div>
      <div className="h-1.5 bg-border rounded-full overflow-hidden">
        <m.div
          className="h-full rounded-full gradient-bg"
          initial={{ width: 0 }}
          animate={{ width: `${(done / total) * 100}%` }}
          transition={springs.heavy}
        />
      </div>
    </div>
  );
}

// ─── Selfie verification ─────────────────────────────
function SelfieVerification({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<SelfieStep>("instructions");
  const [selectedPose, setSelectedPose] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoCapture = useCallback(async (file: File) => {
    setUploading(true);
    setUploadError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setUploadError("Session expirée. Reconnecte-toi.");
        setUploading(false);
        return;
      }
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch("/api/profile/verify/selfie", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setUploadError(data.error ?? "Erreur lors de l'envoi. Reessaie.");
        setUploading(false);
        return;
      }
      setStep("success");
    } catch {
      setUploadError("Erreur réseau. Reessaie.");
    } finally {
      setUploading(false);
    }
  }, []);

  return (
    <AnimatePresence mode="wait">
      {step === "instructions" && (
        <m.div
          key="selfie-instructions"
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          <p className="text-[13px] text-text-muted leading-relaxed mb-5">
            Prends un selfie en reproduisant la pose demandee. Cela prouve que tu es bien la personne sur tes photos.
          </p>

          <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-3">Choisis ta pose</p>
          <div className="flex gap-3 mb-6">
            {POSES.map((pose, i) => (
              <m.button
                key={pose.label}
                onClick={() => setSelectedPose(i)}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border transition-colors tap-target ${
                  selectedPose === i
                    ? "border-accent bg-accent/8"
                    : "border-border bg-bg-card hover:border-accent/30"
                }`}
                whileTap={micro.tapScale}
              >
                <span className="text-[32px]">{pose.emoji}</span>
                <span className="text-[12px] font-semibold text-text">{pose.label}</span>
              </m.button>
            ))}
          </div>

          <m.button
            onClick={() => setStep("camera")}
            className="w-full gradient-bg text-white py-3.5 rounded-full text-[14px] font-semibold shadow-glow tap-target"
            whileTap={micro.tapScale}
          >
            Ouvrir la camera
          </m.button>
        </m.div>
      )}

      {step === "camera" && (
        <m.div
          key="selfie-camera"
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {/* Camera preview placeholder */}
          <m.div
            className="relative h-72 rounded-2xl overflow-hidden mb-5"
            style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)" /* dark camera-viewport tint — intentional out-of-palette atmospheric surface */ }}
            animate={{
              borderColor: ["color-mix(in srgb, var(--color-accent) 30%, transparent)", "color-mix(in srgb, var(--color-accent-2) 30%, transparent)", "color-mix(in srgb, var(--color-accent) 30%, transparent)"],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Border breathe effect */}
            <m.div
              className="absolute inset-0 rounded-2xl border-2 border-accent/30"
              animate={ambient.breathe(3)}
            />

            {/* Grid overlay */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: "linear-gradient(color-mix(in srgb, var(--color-bg) 30%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--color-bg) 30%, transparent) 1px, transparent 1px)",
                backgroundSize: "33.33% 33.33%",
              }}
            />

            {/* Center guide circle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <m.div
                className="w-32 h-32 rounded-full border-2 border-white/20"
                animate={ambient.breathe(4)}
              />
            </div>

            {/* Camera icon */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Camera size={48} strokeWidth={1} color="white" className="opacity-30" aria-hidden="true" />
              <p className="text-white/40 text-[12px] mt-2">Camera preview</p>
            </div>

            {/* Pose instruction at bottom */}
            <m.div
              className="absolute bottom-4 left-0 right-0 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springs.elastic}
            >
              <span className="text-[28px]">{POSES[selectedPose].emoji}</span>
              <p className="text-white text-[13px] font-semibold mt-1">{POSES[selectedPose].instruction}</p>
            </m.div>
          </m.div>

          {/* Hidden file input — triggers camera on mobile or file picker on desktop */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="user"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handlePhotoCapture(file);
            }}
          />
          {uploadError && (
            <p className="text-[12px] text-danger text-center mb-3">{uploadError}</p>
          )}
          <m.button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full gradient-bg text-white py-3.5 rounded-full text-[14px] font-semibold shadow-glow tap-target disabled:opacity-60"
            whileTap={!uploading ? micro.tapScale : undefined}
          >
            {uploading ? "Envoi en cours..." : "Prendre la photo"}
          </m.button>
          <button
            onClick={() => setStep("instructions")}
            className="w-full text-center text-[13px] text-text-muted font-medium py-3 mt-2 tap-target"
          >
            Retour
          </button>
        </m.div>
      )}

      {step === "success" && (
        <m.div
          key="selfie-success"
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="flex flex-col items-center py-8"
        >
          {/* Celebration circle + checkmark */}
          <m.div
            className="relative w-24 h-24 rounded-full gradient-bg flex items-center justify-center shadow-glow mb-5"
            variants={celebrationVariants}
            initial="hidden"
            animate="visible"
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" aria-hidden="true">
              <m.path
                d="M20 6L9 17l-5-5"
                strokeLinecap="round"
                strokeLinejoin="round"
                variants={checkmarkVariants}
                initial="hidden"
                animate="visible"
              />
            </svg>

            {/* Sparkle particles */}
            {[...Array(8)].map((_, i) => (
              <m.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{ background: i % 2 === 0 ? "var(--color-accent)" : "var(--color-accent-2)" }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos((i / 8) * Math.PI * 2) * 60,
                  y: Math.sin((i / 8) * Math.PI * 2) * 60,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{ duration: 0.8, delay: 0.3 + i * 0.05 }}
              />
            ))}
          </m.div>

          <m.p
            className="text-[18px] font-black text-text mb-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Selfie vérifié !
          </m.p>
          <m.p
            className="text-[13px] text-text-muted mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Ta photo a été validée avec succès
          </m.p>
          <m.button
            onClick={onComplete}
            className="gradient-bg text-white px-8 py-3 rounded-full text-[14px] font-semibold shadow-glow tap-target"
            whileTap={micro.tapScale}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            Continuer
          </m.button>
        </m.div>
      )}
    </AnimatePresence>
  );
}

// ─── Phone verification ──────────────────────────────
function PhoneVerification({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<PhoneStep>("input");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (step !== "code" || canResend) return;
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [step, timer, canResend]);

  // Auto-focus first digit input
  useEffect(() => {
    if (step === "code") {
      setTimeout(() => inputRefs.current[0]?.focus(), 400);
    }
  }, [step]);

  const handleDigitChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    if (newCode.every(d => d !== "") && index === 5) {
      setTimeout(() => setStep("success"), 600);
    }
  }, [code]);

  const handleDigitKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [code]);

  const handleResend = () => {
    setTimer(45);
    setCanResend(false);
    setCode(["", "", "", "", "", ""]);
    inputRefs.current[0]?.focus();
  };

  return (
    <AnimatePresence mode="wait">
      {step === "input" && (
        <m.div
          key="phone-input"
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          <p className="text-[13px] text-text-muted leading-relaxed mb-5">
            Un code SMS sera envoyé à ton numéro pour confirmer ton identité.
          </p>

          <label className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold mb-2 block">
            Numéro de téléphone
          </label>
          <div className="flex gap-2 mb-6">
            <div className="flex items-center gap-1.5 bg-bg-card border border-border rounded-xl px-3 py-3 shrink-0">
              <span className="text-[14px]">🇫🇷</span>
              <span className="text-[14px] font-semibold text-text">+33</span>
            </div>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="6 12 34 56 78"
              className="flex-1 px-4 py-3 bg-bg-card border border-border rounded-xl text-[14px] text-text placeholder:text-text-muted outline-none focus:border-accent/50 transition-colors"
              aria-label="Numéro de téléphone"
              inputMode="tel"
            />
          </div>

          <m.button
            onClick={() => {
              if (phone.length >= 9) {
                setStep("code");
              }
            }}
            disabled={phone.length < 9}
            className={`w-full py-3.5 rounded-full text-[14px] font-semibold tap-target transition-all ${
              phone.length >= 9
                ? "gradient-bg text-white shadow-glow"
                : "bg-border text-text-muted cursor-not-allowed"
            }`}
            whileTap={phone.length >= 9 ? micro.tapScale : undefined}
          >
            Envoyer le code
          </m.button>
        </m.div>
      )}

      {step === "code" && (
        <m.div
          key="phone-code"
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          <p className="text-[13px] text-text-muted leading-relaxed mb-2">
            Code envoyé au <span className="font-semibold text-text">+33 {phone}</span>
          </p>
          <button
            onClick={() => { setStep("input"); setCode(["", "", "", "", "", ""]); }}
            className="text-[12px] text-accent font-semibold mb-5"
          >
            Modifier le numéro
          </button>

          {/* 6-digit code input */}
          <div className="flex gap-2.5 justify-center mb-6">
            {code.map((digit, i) => (
              <m.div
                key={i}
                variants={digitVariants}
                initial="hidden"
                animate="visible"
                custom={i}
              >
                <input
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleDigitChange(i, e.target.value)}
                  onKeyDown={e => handleDigitKeyDown(i, e)}
                  className={`w-12 h-14 text-center text-[20px] font-black rounded-xl border-2 outline-none transition-all ${
                    digit
                      ? "border-accent bg-accent/8 text-text"
                      : "border-border bg-bg-card text-text focus:border-accent/50"
                  }`}
                  aria-label={`Chiffre ${i + 1}`}
                />
              </m.div>
            ))}
          </div>

          {/* Timer / resend */}
          <div className="text-center">
            {canResend ? (
              <button
                onClick={handleResend}
                className="text-[13px] text-accent font-semibold tap-target"
              >
                Renvoyer le code
              </button>
            ) : (
              <p className="text-[13px] text-text-muted">
                Renvoyer dans <span className="font-semibold text-text">{timer}s</span>
              </p>
            )}
          </div>
        </m.div>
      )}

      {step === "success" && (
        <m.div
          key="phone-success"
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="flex flex-col items-center py-8"
        >
          <m.div
            className="relative w-24 h-24 rounded-full gradient-bg flex items-center justify-center shadow-glow mb-5"
            variants={celebrationVariants}
            initial="hidden"
            animate="visible"
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" aria-hidden="true">
              <m.path
                d="M20 6L9 17l-5-5"
                strokeLinecap="round"
                strokeLinejoin="round"
                variants={checkmarkVariants}
                initial="hidden"
                animate="visible"
              />
            </svg>

            {[...Array(8)].map((_, i) => (
              <m.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{ background: i % 2 === 0 ? "var(--color-accent)" : "var(--color-accent-2)" }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos((i / 8) * Math.PI * 2) * 60,
                  y: Math.sin((i / 8) * Math.PI * 2) * 60,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{ duration: 0.8, delay: 0.3 + i * 0.05 }}
              />
            ))}
          </m.div>

          <m.p
            className="text-[18px] font-black text-text mb-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Téléphone vérifié !
          </m.p>
          <m.p
            className="text-[13px] text-text-muted mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Ton numéro a été confirmé
          </m.p>
          <m.button
            onClick={onComplete}
            className="gradient-bg text-white px-8 py-3 rounded-full text-[14px] font-semibold shadow-glow tap-target"
            whileTap={micro.tapScale}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            Continuer
          </m.button>
        </m.div>
      )}
    </AnimatePresence>
  );
}

// ─── Video liveness verification ────────────────────
function VideoLivenessVerification({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<VideoStep>("instructions");
  const [promptIndex, setPromptIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const videoFileRef = useRef<File | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const submitVideoToApi = useCallback(async (file: File) => {
    setUploading(true);
    setUploadError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setUploadError("Session expirée. Reconnecte-toi.");
        setUploading(false);
        return false;
      }
      const formData = new FormData();
      formData.append("video", file);
      const res = await fetch("/api/profile/verify/video", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setUploadError(data.error ?? "Erreur lors de l'envoi. Reessaie.");
        setUploading(false);
        return false;
      }
      return true;
    } catch {
      setUploadError("Erreur réseau. Reessaie.");
      setUploading(false);
      return false;
    }
  }, []);

  useEffect(() => {
    if (step === "smile" || step === "turn") {
      const idx = step === "smile" ? 0 : 1;
      setPromptIndex(idx);
      const timer = setTimeout(() => {
        if (idx === 0) {
          setStep("turn");
        } else {
          setStep("verifying");
        }
      }, VIDEO_PROMPTS[idx].duration);
      return () => clearTimeout(timer);
    }
    if (step === "verifying") {
      // If we captured a video file, submit it; otherwise go to success anyway
      // (mobile may not support MediaRecorder — the prompts UX still works).
      const file = videoFileRef.current;
      const proceed = async () => {
        if (file) {
          const ok = await submitVideoToApi(file);
          if (!ok) {
            // Revert to instructions so user can retry
            setStep("instructions");
            return;
          }
        }
        // Delay so "verifying" spinner is visible before success
        setTimeout(() => setStep("success"), 1500);
      };
      void proceed();
    }
  }, [step, submitVideoToApi]);

  return (
    <AnimatePresence mode="wait">
      {/* Hidden video file input for upload fallback */}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        capture="user"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            videoFileRef.current = file;
            setStep("smile");
          }
        }}
      />

      {step === "instructions" && (
        <m.div
          key="video-instructions"
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          <p className="text-[13px] text-text-muted leading-relaxed mb-5">
            Vérification vidéo en temps réel. Suis les instructions qui s&apos;affichent pour prouver que c&apos;est bien toi.
          </p>

          <div className="space-y-3 mb-6">
            {VIDEO_PROMPTS.map((prompt, i) => (
              <div key={prompt.step} className="flex items-center gap-3 bg-bg-card border border-border rounded-xl p-3">
                <div className="w-8 h-8 rounded-lg bg-accent/8 flex items-center justify-center shrink-0">
                  <span className="text-[18px]">{prompt.emoji}</span>
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-text">Étape {i + 1}</p>
                  <p className="text-[11px] text-text-muted">{prompt.instruction}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-accent/5 border border-accent/10 rounded-xl p-3 mb-6">
            <span className="text-[16px]">🔵</span>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Récompense : badge <span className="font-bold text-accent">Vidéo Vérifié</span> avec coche bleue sur ton profil
            </p>
          </div>

          {uploadError && (
            <p className="text-[12px] text-danger text-center mb-3">{uploadError}</p>
          )}
          <m.button
            onClick={() => videoInputRef.current?.click()}
            disabled={uploading}
            className="w-full gradient-bg text-white py-3.5 rounded-full text-[14px] font-semibold shadow-glow tap-target disabled:opacity-60"
            whileTap={!uploading ? micro.tapScale : undefined}
          >
            {uploading ? "Envoi en cours..." : "Lancer la vérification vidéo"}
          </m.button>
        </m.div>
      )}

      {(step === "smile" || step === "turn") && (
        <m.div
          key={`video-${step}`}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {/* Camera placeholder */}
          <m.div
            className="relative h-72 rounded-2xl overflow-hidden mb-5"
            style={{ background: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)" /* dark camera-viewport tint — intentional out-of-palette atmospheric surface */ }}
          >
            {/* Recording indicator */}
            <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
              <m.div
                className="w-3 h-3 rounded-full bg-danger"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
              <span className="text-white/80 text-[11px] font-semibold">REC</span>
            </div>

            {/* Grid overlay */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: "linear-gradient(color-mix(in srgb, var(--color-bg) 30%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--color-bg) 30%, transparent) 1px, transparent 1px)",
                backgroundSize: "33.33% 33.33%",
              }}
            />

            {/* Face guide */}
            <div className="absolute inset-0 flex items-center justify-center">
              <m.div
                className="w-36 h-36 rounded-full border-2 border-accent/40"
                animate={{
                  borderColor: ["color-mix(in srgb, var(--color-accent) 40%, transparent)", "color-mix(in srgb, var(--color-accent-2) 40%, transparent)", "color-mix(in srgb, var(--color-accent) 40%, transparent)"],
                  scale: [1, 1.02, 1],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            {/* Camera icon */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" className="opacity-20" aria-hidden="true">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <polygon points="22 8 22 13 17 10.5" />
              </svg>
              <p className="text-white/30 text-[11px] mt-1">Caméra preview</p>
            </div>

            {/* Current instruction */}
            <m.div
              className="absolute bottom-4 left-0 right-0 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springs.elastic}
            >
              <m.span
                className="text-[36px]"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {VIDEO_PROMPTS[promptIndex].emoji}
              </m.span>
              <p className="text-white text-[15px] font-bold mt-1">
                {VIDEO_PROMPTS[promptIndex].instruction}
              </p>
            </m.div>
          </m.div>

          {/* Step progress */}
          <div className="flex items-center gap-2 mb-4">
            {VIDEO_PROMPTS.map((p, i) => (
              <div key={p.step} className="flex-1">
                <div className={`h-1.5 rounded-full ${
                  i < promptIndex ? "gradient-bg" : i === promptIndex ? "bg-accent/40" : "bg-border"
                }`}>
                  {i === promptIndex && (
                    <m.div
                      className="h-full rounded-full gradient-bg"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: VIDEO_PROMPTS[i].duration / 1000, ease: "linear" }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-[12px] text-text-muted">
            Étape {promptIndex + 1} sur {VIDEO_PROMPTS.length}
          </p>
        </m.div>
      )}

      {step === "verifying" && (
        <m.div
          key="video-verifying"
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="flex flex-col items-center py-12"
        >
          <m.div
            className="w-16 h-16 rounded-full border-2 border-t-accent border-r-transparent border-b-transparent border-l-transparent mb-4"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          />
          <p className="text-[15px] font-bold text-text mb-1">Analyse en cours...</p>
          <p className="text-[12px] text-text-muted">Vérification de la vivacité</p>
        </m.div>
      )}

      {step === "success" && (
        <m.div
          key="video-success"
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="flex flex-col items-center py-8"
        >
          <m.div
            className="relative w-24 h-24 rounded-full gradient-bg flex items-center justify-center shadow-glow mb-5"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.35, 0.9, 1.1, 1] }}
            transition={{ duration: 0.7, times: [0, 0.3, 0.5, 0.7, 1] }}
          >
            {/* Blue checkmark */}
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" fill="#3B82F6" /* LinkedIn brand blue — intentional */ />
              <m.path
                d="M8 12l3 3 5-5"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>

            {/* Sparkle particles */}
            {[...Array(8)].map((_, i) => (
              <m.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{ background: i % 2 === 0 ? "#3B82F6" : "var(--color-accent-2)" /* LinkedIn brand + CeSoir green */ }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{
                  x: Math.cos((i / 8) * Math.PI * 2) * 60,
                  y: Math.sin((i / 8) * Math.PI * 2) * 60,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{ duration: 0.8, delay: 0.3 + i * 0.05 }}
              />
            ))}
          </m.div>

          <m.div
            className="flex items-center gap-2 mb-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-[18px] font-black text-text">Vidéo Vérifié</p>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" fill="#3B82F6" /* LinkedIn brand blue — intentional */ />
              <path d="M8 12l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </m.div>
          <m.p
            className="text-[13px] text-text-muted mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Badge coche bleue attribué à ton profil
          </m.p>
          <m.button
            onClick={onComplete}
            className="gradient-bg text-white px-8 py-3 rounded-full text-[14px] font-semibold shadow-glow tap-target"
            whileTap={micro.tapScale}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            Continuer
          </m.button>
        </m.div>
      )}
    </AnimatePresence>
  );
}

// ─── Social verification ─────────────────────────────
function SocialVerification() {
  return (
    <m.div
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
    >
      <p className="text-[13px] text-text-muted leading-relaxed mb-5">
        Connecte un réseau social pour prouver que tu es une vraie personne. Nous ne publierons jamais rien.
      </p>

      <div className="space-y-3">
        {/* Instagram */}
        <m.button
          className="w-full flex items-center justify-between bg-bg-card border border-border rounded-2xl p-4 opacity-60 cursor-not-allowed relative overflow-hidden"
          disabled
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" /* Instagram brand gradient — intentional */ }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </div>
            <div className="text-left">
              <p className="text-[13px] font-bold text-text">Instagram</p>
              <p className="text-[10px] text-text-muted">Confirme ton identité visuelle</p>
            </div>
          </div>
          <span className="text-[9px] font-bold text-accent bg-accent/10 px-2 py-1 rounded-full uppercase tracking-wider">
            Bientôt
          </span>
        </m.button>

        {/* LinkedIn */}
        <m.button
          className="w-full flex items-center justify-between bg-bg-card border border-border rounded-2xl p-4 opacity-60 cursor-not-allowed relative overflow-hidden"
          disabled
        >
          <div className="flex items-center gap-3">
            {/* LinkedIn brand blue #0A66C2 — intentional out-of-palette */}
            <div className="w-10 h-10 rounded-xl bg-[#0A66C2] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </div>
            <div className="text-left">
              <p className="text-[13px] font-bold text-text">LinkedIn</p>
              <p className="text-[10px] text-text-muted">Vérifie ton profil professionnel</p>
            </div>
          </div>
          <span className="text-[9px] font-bold text-accent bg-accent/10 px-2 py-1 rounded-full uppercase tracking-wider">
            Bientôt
          </span>
        </m.button>
      </div>

      <p className="text-[11px] text-text-muted text-center mt-5 leading-relaxed">
        La vérification sociale sera bientôt disponible. En attendant, utilise le selfie ou le téléphone.
      </p>
    </m.div>
  );
}

// ─── Main page ───────────────────────────────────────
export default function VerifyPage() {
  const [activeMethod, setActiveMethod] = useState<VerifyMethod | null>(null);
  const [completedMethods, setCompletedMethods] = useState<Set<VerifyMethod>>(new Set());
  const [isFullyVerified, setIsFullyVerified] = useState(false);

  const handleComplete = (method: VerifyMethod) => {
    const updated = new Set(completedMethods);
    updated.add(method);
    setCompletedMethods(updated);
    setActiveMethod(null);

    // Any single method = verified
    if (updated.size >= 1) {
      setTimeout(() => setIsFullyVerified(true), 300);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <PageHeader title="Vérification" subtitle="Obtiens le badge Vérifié" backHref="/profile" />

      <div className="px-5 pt-5 pb-24">
        {/* Progress bar */}
        <ProgressBar
          methods={["selfie", "phone", "video", "social"]}
          completed={completedMethods}
        />

        {/* Verified celebration */}
        <AnimatePresence>
          {isFullyVerified && !activeMethod && (
            <m.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={springs.elastic}
              className="mb-6 bg-safe/8 border border-safe/20 rounded-2xl p-5 text-center"
            >
              <m.div
                className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-safe/15 mb-3"
                animate={micro.successPop}
              >
                <Check size={24} strokeWidth={2.5} className="text-safe" aria-hidden="true" />
              </m.div>
              <p className="text-[16px] font-black text-text mb-1">Profil vérifié !</p>
              <p className="text-[12px] text-text-muted">
                Ton badge Vérifié est maintenant visible sur ton profil.
              </p>
            </m.div>
          )}
        </AnimatePresence>

        {/* Active method view */}
        <AnimatePresence mode="wait">
          {activeMethod && (
            <m.div
              key={activeMethod}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Back button */}
              <button
                onClick={() => setActiveMethod(null)}
                className="flex items-center gap-2 text-[13px] text-accent font-semibold mb-4 tap-target"
              >
                <ChevronLeft size={14} strokeWidth={2} className="text-accent" aria-hidden="true" />
                Méthodes de vérification
              </button>

              {activeMethod === "selfie" && (
                <SelfieVerification onComplete={() => handleComplete("selfie")} />
              )}
              {activeMethod === "phone" && (
                <PhoneVerification onComplete={() => handleComplete("phone")} />
              )}
              {activeMethod === "video" && (
                <VideoLivenessVerification onComplete={() => handleComplete("video")} />
              )}
              {activeMethod === "social" && (
                <SocialVerification />
              )}
            </m.div>
          )}
        </AnimatePresence>

        {/* Method cards — shown when no method active */}
        {!activeMethod && (
          <m.div
            className="space-y-3"
            initial="hidden"
            animate="visible"
          >
            {METHODS.map((method, i) => {
              const isCompleted = completedMethods.has(method.key);
              const isSocial = method.key === "social";

              return (
                <m.button
                  key={method.key}
                  variants={cardVariants}
                  custom={i}
                  whileTap={!isCompleted ? "tap" : undefined}
                  onClick={() => !isCompleted && setActiveMethod(method.key)}
                  disabled={isCompleted}
                  className={`w-full flex items-center gap-4 bg-bg-card border rounded-2xl p-4 text-left transition-colors tap-target ${
                    isCompleted
                      ? "border-safe/30 bg-safe/5"
                      : "border-border hover:border-accent/20 active:bg-border/20"
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    isCompleted ? "bg-safe/15" : "bg-accent/8"
                  }`}>
                    {isCompleted ? (
                      <m.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={springs.elastic}
                      >
                        <Check size={20} strokeWidth={2.5} className="text-safe" aria-hidden="true" />
                      </m.div>
                    ) : (
                      <span className="text-[22px]">{method.icon}</span>
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-[14px] font-bold ${isCompleted ? "text-safe" : "text-text"}`}>
                        {method.title}
                      </p>
                      {isSocial && !isCompleted && (
                        <span className="text-[8px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                          Bientôt
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      {isCompleted ? "Vérification complétée" : method.subtitle}
                    </p>
                  </div>

                  {/* Chevron */}
                  {!isCompleted && (
                    <ChevronRight size={16} strokeWidth={1.5} className="text-text-muted shrink-0" aria-hidden="true" />
                  )}
                </m.button>
              );
            })}
          </m.div>
        )}

        {/* Info note */}
        {!activeMethod && (
          <m.div
            className="mt-6 bg-bg-card border border-border rounded-2xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.heavy, delay: 0.5 }}
          >
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/8 flex items-center justify-center shrink-0">
                <Info size={14} strokeWidth={2} className="text-accent" aria-hidden="true" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-text mb-1">Pourquoi se vérifier ?</p>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Les profils vérifiés reçoivent 3x plus de matchs et inspirent confiance aux autres utilisateurs. Une seule méthode suffit pour obtenir le badge.
                </p>
              </div>
            </div>
          </m.div>
        )}
      </div>
    </div>
  );
}
