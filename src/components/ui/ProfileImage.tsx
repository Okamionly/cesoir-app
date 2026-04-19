"use client";

import Image from "next/image";
import { app } from "@/lib/design-tokens";

interface ProfileImageProps {
  src: string | null | undefined;
  alt: string;
  size?: number;
  className?: string;
  priority?: boolean;
  fallbackInitial?: string;
  fallbackColor?: string;
}

const FALLBACK_BG = app.violet;

/**
 * Wrapper around next/image optimized for profile photos.
 * - Handles null/undefined src with initial-letter fallback
 * - Correct sizes hint for common profile avatar widths
 * - Lazy loading by default, priority for above-the-fold
 */
export default function ProfileImage({
  src,
  alt,
  size = 48,
  className = "",
  priority = false,
  fallbackInitial,
  fallbackColor,
}: ProfileImageProps) {
  const initial = fallbackInitial || alt?.[0]?.toUpperCase() || "?";
  const bgColor = fallbackColor || FALLBACK_BG;

  if (!src) {
    return (
      <div
        className={`rounded-full flex items-center justify-center text-white font-bold shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          background: bgColor,
          fontSize: size * 0.4,
        }}
        aria-label={alt}
      >
        {initial}
      </div>
    );
  }

  // Determine responsive sizes based on the rendered size
  const sizes =
    size <= 40
      ? "40px"
      : size <= 64
        ? "64px"
        : size <= 128
          ? "128px"
          : `${size}px`;

  return (
    <div
      className={`relative rounded-full overflow-hidden shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}
