"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { springs } from "@/lib/motion-design";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  rightAction?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  backHref,
  rightAction,
}: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Back button */}
        {backHref && (
          <motion.div whileTap={{ scale: 0.9 }} transition={springs.micro}>
            <Link
              href={backHref}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-card border border-border text-text-muted hover:text-text transition-colors"
              aria-label="Retour"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
          </motion.div>
        )}

        {/* Title & subtitle */}
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-display font-bold text-text truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-text-muted truncate">{subtitle}</p>
          )}
        </div>

        {/* Right action slot */}
        {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
      </div>
    </header>
  );
}
