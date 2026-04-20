"use client";

import React from "react";
import { m } from "motion/react";
import { micro, springs } from "@/lib/motion-design";
import { logger } from "@/lib/logger";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
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
      boundary: "root",
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

      return (
        <div className="min-h-[60vh] bg-bg flex flex-col items-center justify-center px-6 text-center">
          <m.div
            initial={micro.shake}
            animate={{ x: 0 }}
            transition={{ ...springs.elastic, delay: 0.1 }}
          >
            <m.span
              className="text-5xl block mb-6"
              animate={micro.shake}
              aria-hidden="true"
            >
              !!
            </m.span>
          </m.div>

          <h1 className="text-xl font-bold mb-2 text-text">
            Oups, quelque chose s&apos;est mal passe
          </h1>
          <p className="text-sm text-text-muted mb-8 max-w-xs">
            Pas de panique, ca arrive meme aux meilleurs. Reessaie et tout
            devrait rentrer dans l&apos;ordre.
          </p>

          <m.button
            onClick={this.handleReset}
            className="gradient-bg text-white font-semibold py-3 px-8 rounded-full text-sm"
            whileTap={{ scale: 0.95, transition: springs.micro }}
            whileHover={{ scale: 1.03, transition: springs.gentle }}
          >
            Reessayer
          </m.button>
        </div>
      );
    }

    return this.props.children;
  }
}
