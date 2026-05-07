"use client";

/**
 * Component-level React error boundary.
 *
 * Used by callers wrapping a subtree (e.g. <ErrorBoundary><PhotoGallery/></>).
 * Distinct from the Next.js file-convention error.tsx — this one renders
 * INSIDE the page rather than replacing the segment.
 *
 * 2026-05-07: tightened fallback copy (FR amical), added "Retour" Link +
 * "Signaler" support link to match the polish on /app/error.tsx.
 */

import React from "react";
import Link from "next/link";
import { m } from "motion/react";
import { micro, springs } from "@/lib/motion-design";
import { logger } from "@/lib/logger";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  /** Where the "Retour" CTA points. Defaults to "/feed" (post-login). */
  homeHref?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error("error_boundary_caught", {
      boundary: "component",
      message: error.message,
      name: error.name,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const homeHref = this.props.homeHref ?? "/feed";

      return (
        <div
          className="min-h-[60vh] bg-bg flex flex-col items-center justify-center px-6 text-center"
          role="alert"
          aria-live="polite"
        >
          <m.div
            initial={{ x: 0 }}
            animate={micro.shake}
            transition={{ ...springs.elastic, delay: 0.1 }}
          >
            <span
              className="text-5xl block mb-6"
              aria-hidden="true"
              style={{ filter: "drop-shadow(0 0 20px rgba(139,92,246,0.35))" }}
            >
              ☾
            </span>
          </m.div>

          <h2 className="text-xl font-bold mb-2 text-text">
            Quelque chose a coince
          </h2>
          <p className="text-sm text-text-muted mb-7 max-w-xs leading-relaxed">
            Pas de panique, ca arrive meme aux meilleures soirees. Reessaie et
            tout devrait rentrer dans l&apos;ordre.
          </p>

          <div className="flex flex-col items-center gap-3 w-full max-w-xs">
            <m.button
              type="button"
              onClick={this.handleReset}
              className="w-full gradient-bg text-white font-semibold py-3 px-8 rounded-full text-sm"
              whileTap={{ scale: 0.95, transition: springs.micro }}
              whileHover={{ scale: 1.03, transition: springs.gentle }}
            >
              Reessayer
            </m.button>

            <Link
              href={homeHref}
              className="w-full py-3 px-8 rounded-full text-sm font-medium text-text border border-border hover:bg-bg-card transition-colors text-center"
            >
              Retour
            </Link>

            <Link
              href="/help"
              className="text-xs text-text-muted hover:text-text transition-colors underline underline-offset-4 mt-1"
            >
              Signaler le probleme
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
