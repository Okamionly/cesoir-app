"use client";

import React from "react";
import { motion } from "motion/react";
import { micro, springs } from "@/lib/motion-design";

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
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
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
          <motion.div
            initial={micro.shake}
            animate={{ x: 0 }}
            transition={{ ...springs.elastic, delay: 0.1 }}
          >
            <motion.span
              className="text-5xl block mb-6"
              animate={micro.shake}
              aria-hidden="true"
            >
              !!
            </motion.span>
          </motion.div>

          <h1 className="text-xl font-bold mb-2 text-text">
            Oups, quelque chose s&apos;est mal passe
          </h1>
          <p className="text-sm text-text-muted mb-8 max-w-xs">
            Pas de panique, ca arrive meme aux meilleurs. Reessaie et tout
            devrait rentrer dans l&apos;ordre.
          </p>

          <motion.button
            onClick={this.handleReset}
            className="gradient-bg text-white font-semibold py-3 px-8 rounded-full text-sm"
            whileTap={{ scale: 0.95, transition: springs.micro }}
            whileHover={{ scale: 1.03, transition: springs.gentle }}
          >
            Reessayer
          </motion.button>
        </div>
      );
    }

    return this.props.children;
  }
}
