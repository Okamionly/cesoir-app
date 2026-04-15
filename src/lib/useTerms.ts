"use client";

import { useState, useEffect, useCallback } from "react";

const TERMS_KEY = "cesoir_terms_accepted";

/** Bump this version whenever the CGU are updated — users will be asked to re-accept. */
const CURRENT_TERMS_VERSION = "2026-04-01";

interface TermsState {
  accepted: boolean;
  acceptedVersion: string | null;
  needsReAccept: boolean;
  acceptTerms: () => void;
}

function getStored(): { version: string; date: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TERMS_KEY);
    return raw ? (JSON.parse(raw) as { version: string; date: string }) : null;
  } catch {
    return null;
  }
}

/**
 * Hook to track whether the user has accepted the current version of the Terms of Service.
 *
 * Usage:
 *   const { accepted, needsReAccept, acceptTerms } = useTerms();
 *   if (!accepted || needsReAccept) show CGU modal, call acceptTerms() on agree.
 */
export function useTerms(): TermsState {
  const [accepted, setAccepted] = useState(false);
  const [acceptedVersion, setAcceptedVersion] = useState<string | null>(null);
  const [needsReAccept, setNeedsReAccept] = useState(false);

  useEffect(() => {
    const stored = getStored();
    if (stored) {
      setAcceptedVersion(stored.version);
      if (stored.version === CURRENT_TERMS_VERSION) {
        setAccepted(true);
        setNeedsReAccept(false);
      } else {
        // Terms have been updated since last acceptance
        setAccepted(false);
        setNeedsReAccept(true);
      }
    } else {
      setAccepted(false);
      setNeedsReAccept(false);
    }
  }, []);

  const acceptTerms = useCallback(() => {
    const data = {
      version: CURRENT_TERMS_VERSION,
      date: new Date().toISOString(),
    };
    localStorage.setItem(TERMS_KEY, JSON.stringify(data));
    setAccepted(true);
    setAcceptedVersion(CURRENT_TERMS_VERSION);
    setNeedsReAccept(false);
  }, []);

  return { accepted, acceptedVersion, needsReAccept, acceptTerms };
}
