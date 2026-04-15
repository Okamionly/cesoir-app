"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { springs } from "@/lib/motion-design";

interface CrossLinkCardProps {
  title: string;
  subtitle?: string;
  emoji: string;
  href: string;
  gradient?: string;
}

export default function CrossLinkCard({
  title,
  subtitle,
  emoji,
  href,
  gradient,
}: CrossLinkCardProps) {
  return (
    <Link href={href} className="block">
      <motion.div
        className="flex items-center gap-3 px-3.5 py-3 rounded-xl border border-border/50 bg-card transition-colors"
        style={
          gradient
            ? { background: gradient }
            : undefined
        }
        whileHover={{
          y: -2,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          transition: springs.gentle,
        }}
        whileTap={{ scale: 0.97, transition: springs.micro }}
      >
        <span className="text-lg shrink-0" aria-hidden="true">
          {emoji}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-text leading-tight truncate">
            {title}
          </p>
          {subtitle && (
            <p className="text-[10px] text-text-muted mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-text-muted shrink-0"
          aria-hidden="true"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </motion.div>
    </Link>
  );
}
