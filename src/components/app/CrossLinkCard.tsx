"use client";

import Link from "next/link";
import type { Route } from "next";
import { m } from "motion/react";
import { springs } from "@/lib/motion-design";
import { ChevronRight } from "@/components/ui/lucide";

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
    <Link href={href as Route} className="block">
      <m.div
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
        <ChevronRight size={14} strokeWidth={2} className="text-text-muted shrink-0" aria-hidden="true" />
      </m.div>
    </Link>
  );
}
