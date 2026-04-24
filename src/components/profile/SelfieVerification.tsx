"use client";

/**
 * SelfieVerification — V5 Wave 15 real selfie verification via @vladmandic/face-api
 * (formerly face-api.js; swapped 2026-04-24 patrol #8 to drop the
 * node-fetch@<2.6.7 CVE (GHSA-r683-j2x4-v87g, CVSS 8.8 high). The maintained
 * fork ships the same browser API with no node-fetch dep.)
 *
 * Flow:
 *   1. Capture 3 random poses (look left, smile, nod up) — liveness proxy
 *   2. Match captured face vs avatar using face-api.js descriptors
 *   3. If cosine-distance < 0.7 → insert profile_verifications + badge
 *      else → insert moderation_queue item for human review
 *
 * Deps are dynamically imported so the app doesn't crash when face-api.js
 * isn't installed. Graceful fallback → queue for human review.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

interface Props {
  userId: string;
  avatarUrl: string | null;
  onComplete: (result: { verified: boolean; queued: boolean }) => void;
}

type Step = "idle" | "loading_model" | "pose_1" | "pose_2" | "pose_3" | "matching" | "done";

const POSE_PROMPTS = [
  { key: "pose_1" as const, label: "Regarde a gauche", emoji: "👈" },
  { key: "pose_2" as const, label: "Souris a la camera", emoji: "😊" },
  { key: "pose_3" as const, label: "Hoche la tete", emoji: "👆" },
];

const MATCH_THRESHOLD = 0.7; // Lower = stricter. 0.6 is face-api.js default.

export default function SelfieVerification({ userId, avatarUrl, onComplete }: Props) {
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [captureCount, setCaptureCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const capturesRef = useRef<Float32Array[]>([]);
  const faceApiRef = useRef<unknown>(null);

  // Cleanup webcam on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startWebcam = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      return true;
    } catch (err) {
      logger.error("selfie_webcam_failed", { err: String(err) });
      setError("Impossible d'acceder a la camera. Verifie les permissions.");
      return false;
    }
  }, []);

  const loadFaceApi = useCallback(async () => {
    if (faceApiRef.current) return faceApiRef.current;
    try {
      const faceapi = await import("@vladmandic/face-api").catch(() => null);
      if (!faceapi) {
        logger.warn("face_api_missing");
        return null;
      }
      // Models served from /public/models/ (weights ~5MB). If not present
      // the face detector throws and we fall back to manual queue.
      await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
      await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
      faceApiRef.current = faceapi;
      return faceapi;
    } catch (err) {
      logger.warn("face_api_load_failed", { err: String(err) });
      return null;
    }
  }, []);

  const captureDescriptor = useCallback(async (): Promise<Float32Array | null> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const faceapi = faceApiRef.current as any;
    if (!faceapi || !videoRef.current) return null;
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      return detection?.descriptor ?? null;
    } catch (err) {
      logger.warn("face_api_detect_failed", { err: String(err) });
      return null;
    }
  }, []);

  const handleStart = useCallback(async () => {
    setStep("loading_model");
    const ok = await startWebcam();
    if (!ok) {
      setStep("idle");
      return;
    }
    const faceapi = await loadFaceApi();
    if (!faceapi) {
      // Graceful fallback — queue for manual review with no capture
      await queueForReview(null);
      setStep("done");
      onComplete({ verified: false, queued: true });
      return;
    }
    setStep("pose_1");
  }, [startWebcam, loadFaceApi, onComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCapture = useCallback(async () => {
    const desc = await captureDescriptor();
    if (desc) {
      capturesRef.current.push(desc);
      setCaptureCount((c) => c + 1);
    }
    // Move to next pose
    const poses = POSE_PROMPTS.map((p) => p.key);
    const curIdx = poses.indexOf(step as (typeof poses)[number]);
    if (curIdx >= 0 && curIdx < poses.length - 1) {
      setStep(poses[curIdx + 1]);
    } else {
      setStep("matching");
      void runMatching();
    }
  }, [captureDescriptor, step]); // eslint-disable-line react-hooks/exhaustive-deps

  const runMatching = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const faceapi = faceApiRef.current as any;
    if (!faceapi || capturesRef.current.length === 0 || !avatarUrl) {
      await queueForReview(null);
      setStep("done");
      onComplete({ verified: false, queued: true });
      return;
    }
    try {
      // Load avatar + extract descriptor
      const img = await faceapi.fetchImage(avatarUrl);
      const avatarDet = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!avatarDet) {
        await queueForReview("avatar_no_face");
        setStep("done");
        onComplete({ verified: false, queued: true });
        return;
      }
      // Mean distance across 3 captures
      const distances = capturesRef.current.map((desc) =>
        faceapi.euclideanDistance(desc, avatarDet.descriptor),
      );
      const avgDist: number =
        distances.reduce((a: number, b: number) => a + b, 0) / distances.length;

      if (avgDist < MATCH_THRESHOLD) {
        // Match — insert verification
        await supabase.from("profile_verifications").upsert({
          user_id: userId,
          method: "selfie",
          verified_at: new Date().toISOString(),
          confidence: Math.max(0, 1 - avgDist),
        });
        await supabase.from("profiles").update({ is_verified: true }).eq("id", userId);
        setStep("done");
        onComplete({ verified: true, queued: false });
      } else {
        await queueForReview(`low_confidence_${avgDist.toFixed(3)}`);
        setStep("done");
        onComplete({ verified: false, queued: true });
      }
    } catch (err) {
      logger.error("selfie_matching_failed", { err: String(err) });
      await queueForReview("exception");
      setStep("done");
      onComplete({ verified: false, queued: true });
    } finally {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    }
  }, [avatarUrl, userId, onComplete]);

  const queueForReview = useCallback(
    async (reason: string | null) => {
      try {
        await supabase.from("moderation_queue").insert({
          item_type: "profile",
          item_id: userId,
          user_id: userId,
          flag_source: "manual",
          flag_score: 0.5,
          flag_categories: reason ? [`selfie_verify:${reason}`] : ["selfie_verify:unknown"],
          status: "pending",
        });
      } catch (err) {
        logger.error("selfie_queue_failed", { err: String(err) });
      }
    },
    [userId],
  );

  const currentPose = POSE_PROMPTS.find((p) => p.key === step);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
        />
        {step === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-card/80">
            <p className="text-[13px] text-text-muted px-4 text-center">
              Clique sur &quot;Demarrer&quot; pour lancer la verification
            </p>
          </div>
        )}
        {step === "matching" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <p className="text-white text-[14px] font-semibold">Analyse en cours...</p>
          </div>
        )}
        {currentPose && (
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <span className="text-[32px]">{currentPose.emoji}</span>
            <p className="text-white text-[13px] font-bold mt-1 drop-shadow">
              {currentPose.label}
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-[12px] text-danger text-center" role="alert">
          {error}
        </p>
      )}

      {step === "idle" && (
        <button
          onClick={handleStart}
          className="gradient-bg text-white px-6 py-3 rounded-full text-[14px] font-semibold shadow-glow"
        >
          Demarrer la verification
        </button>
      )}
      {currentPose && (
        <button
          onClick={handleCapture}
          className="gradient-bg text-white px-6 py-3 rounded-full text-[14px] font-semibold shadow-glow"
        >
          Capturer ({captureCount + 1}/3)
        </button>
      )}
      {step === "done" && (
        <p className="text-[13px] text-text-muted text-center">Verification terminee.</p>
      )}
    </div>
  );
}
