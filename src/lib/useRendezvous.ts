"use client";

// ========================================
// useRendezvous — Live meeting tracking hook
// ========================================
//
// Tracks the state of a live rendezvous between two matched users.
// Simulates distance decreasing over time for the mock version.
// In production, this would use Supabase Realtime + geolocation.

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ──────────────────────────────────────

export type MeetingStatus = "pending" | "en_route" | "nearby" | "arrived" | "met";

export interface QuickMessage {
  id: string;
  text: string;
  icon: string;
}

export interface RendezvousState {
  myStatus: MeetingStatus;
  theirStatus: MeetingStatus;
  distance: number; // meters
  eta: number; // minutes
  myPosition: { x: number; y: number };
  theirPosition: { x: number; y: number };
  venuePosition: { x: number; y: number };
  messages: { id: string; text: string; from: "me" | "them"; timestamp: number }[];
  bothArrived: boolean;
}

export const QUICK_MESSAGES: QuickMessage[] = [
  { id: "late", text: "Je suis en retard", icon: "\u23F0" },
  { id: "here", text: "Je suis la !", icon: "\u{1F4CD}" },
  { id: "see", text: "Tu me vois ?", icon: "\u{1F440}" },
  { id: "near", text: "Cherche moi pres de...", icon: "\u{1F50D}" },
];

interface UseRendezvousOptions {
  matchId: string;
  matchName: string;
}

interface UseRendezvousResult {
  state: RendezvousState;
  sendQuickMessage: (messageId: string) => void;
  updateStatus: (status: MeetingStatus) => void;
  confirmMet: () => void;
  notifyArriving: () => void;
}

// ─── Status helpers ─────────────────────────────

function statusFromDistance(distance: number): MeetingStatus {
  if (distance <= 0) return "arrived";
  if (distance <= 50) return "arrived";
  if (distance <= 200) return "nearby";
  return "en_route";
}

function etaFromDistance(distance: number): number {
  // ~80m per minute walking speed
  return Math.max(1, Math.round(distance / 80));
}

// ─── Hook ───────────────────────────────────────

export function useRendezvous({ matchId, matchName }: UseRendezvousOptions): UseRendezvousResult {
  const [state, setState] = useState<RendezvousState>({
    myStatus: "pending",
    theirStatus: "pending",
    distance: 850,
    eta: 11,
    myPosition: { x: 15, y: 75 },
    theirPosition: { x: 80, y: 20 },
    venuePosition: { x: 50, y: 45 },
    messages: [],
    bothArrived: false,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const theirIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulate my position moving toward venue
  useEffect(() => {
    if (state.myStatus === "met" || state.myStatus === "pending") return;

    intervalRef.current = setInterval(() => {
      setState((prev) => {
        const venue = prev.venuePosition;
        const dx = venue.x - prev.myPosition.x;
        const dy = venue.y - prev.myPosition.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 3) {
          return {
            ...prev,
            myPosition: { ...venue },
            myStatus: "arrived",
          };
        }

        const step = 1.2 + Math.random() * 0.5;
        const nx = prev.myPosition.x + (dx / dist) * step;
        const ny = prev.myPosition.y + (dy / dist) * step;

        return {
          ...prev,
          myPosition: { x: nx, y: ny },
        };
      });
    }, 800);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.myStatus]);

  // Simulate their position moving toward venue (slightly slower)
  useEffect(() => {
    if (state.theirStatus === "met" || state.theirStatus === "pending") return;

    theirIntervalRef.current = setInterval(() => {
      setState((prev) => {
        const venue = prev.venuePosition;
        const dx = venue.x - prev.theirPosition.x;
        const dy = venue.y - prev.theirPosition.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 3) {
          return {
            ...prev,
            theirPosition: { ...venue },
            theirStatus: "arrived",
          };
        }

        const step = 0.8 + Math.random() * 0.4;
        const nx = prev.theirPosition.x + (dx / dist) * step;
        const ny = prev.theirPosition.y + (dy / dist) * step;

        return {
          ...prev,
          theirPosition: { x: nx, y: ny },
        };
      });
    }, 1000);

    return () => {
      if (theirIntervalRef.current) clearInterval(theirIntervalRef.current);
    };
  }, [state.theirStatus]);

  // Update distance, eta, and statuses based on positions
  useEffect(() => {
    const dx = state.myPosition.x - state.theirPosition.x;
    const dy = state.myPosition.y - state.theirPosition.y;
    const pixelDist = Math.sqrt(dx * dx + dy * dy);
    // Scale: 1 pixel unit ~= 10 meters
    const meterDist = Math.round(pixelDist * 10);

    const myStatus = state.myStatus === "pending" || state.myStatus === "met"
      ? state.myStatus
      : statusFromDistance(
          Math.sqrt(
            Math.pow(state.myPosition.x - state.venuePosition.x, 2) +
            Math.pow(state.myPosition.y - state.venuePosition.y, 2),
          ) * 10,
        );

    const theirStatus = state.theirStatus === "pending" || state.theirStatus === "met"
      ? state.theirStatus
      : statusFromDistance(
          Math.sqrt(
            Math.pow(state.theirPosition.x - state.venuePosition.x, 2) +
            Math.pow(state.theirPosition.y - state.venuePosition.y, 2),
          ) * 10,
        );

    const bothArrived = myStatus === "arrived" && theirStatus === "arrived";

    setState((prev) => ({
      ...prev,
      distance: meterDist,
      eta: etaFromDistance(meterDist),
      myStatus: prev.myStatus === "pending" || prev.myStatus === "met" ? prev.myStatus : myStatus,
      theirStatus: prev.theirStatus === "pending" || prev.theirStatus === "met" ? prev.theirStatus : theirStatus,
      bothArrived,
    }));
  }, [state.myPosition, state.theirPosition, state.venuePosition]);

  // Simulate them starting after a short delay
  useEffect(() => {
    const timeout = setTimeout(() => {
      setState((prev) => ({
        ...prev,
        theirStatus: prev.theirStatus === "pending" ? "en_route" : prev.theirStatus,
      }));
    }, 3000);

    // Simulate them sending a message
    const msgTimeout = setTimeout(() => {
      setState((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: `them-${Date.now()}`,
            text: "J'arrive dans 5 min !",
            from: "them" as const,
            timestamp: Date.now(),
          },
        ],
      }));
    }, 5000);

    return () => {
      clearTimeout(timeout);
      clearTimeout(msgTimeout);
    };
  }, []);

  const sendQuickMessage = useCallback((messageId: string) => {
    const msg = QUICK_MESSAGES.find((m) => m.id === messageId);
    if (!msg) return;

    setState((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          id: `me-${Date.now()}`,
          text: msg.text,
          from: "me" as const,
          timestamp: Date.now(),
        },
      ],
    }));
  }, []);

  const updateStatus = useCallback((status: MeetingStatus) => {
    setState((prev) => ({
      ...prev,
      myStatus: status,
    }));
  }, []);

  const confirmMet = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (theirIntervalRef.current) clearInterval(theirIntervalRef.current);

    setState((prev) => ({
      ...prev,
      myStatus: "met",
      theirStatus: "met",
      distance: 0,
      eta: 0,
      bothArrived: true,
    }));
  }, []);

  const notifyArriving = useCallback(() => {
    setState((prev) => ({
      ...prev,
      myStatus: prev.myStatus === "pending" ? "en_route" : prev.myStatus,
      messages: [
        ...prev.messages,
        {
          id: `me-${Date.now()}`,
          text: "J'arrive !",
          from: "me" as const,
          timestamp: Date.now(),
        },
      ],
    }));
  }, []);

  return {
    state,
    sendQuickMessage,
    updateStatus,
    confirmMet,
    notifyArriving,
  };
}
