"use client";

import { motion } from "motion/react";
import { springs } from "@/lib/motion-design";
import { app } from "@/lib/design-tokens";

interface MockQRProps {
  userId?: string;
  size?: number;
  color?: string;
  showLabel?: boolean;
}

/**
 * Deterministic mock QR code based on userId hash.
 * 9x9 grid with 3 corner anchors (like real QR finder patterns).
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function generatePattern(userId: string): boolean[][] {
  const hash = hashCode(userId);
  const grid: boolean[][] = Array.from({ length: 9 }, () => Array(9).fill(false));

  // Corner anchors (3x3 finder patterns) — always filled
  // Top-left
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) grid[r][c] = true;
  grid[1][1] = false; // hollow center

  // Top-right
  for (let r = 0; r < 3; r++) for (let c = 6; c < 9; c++) grid[r][c] = true;
  grid[1][7] = false;

  // Bottom-left
  for (let r = 6; r < 9; r++) for (let c = 0; c < 3; c++) grid[r][c] = true;
  grid[7][1] = false;

  // Fill remaining cells deterministically
  let seed = hash;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      // Skip anchor zones
      if (r < 3 && c < 3) continue;
      if (r < 3 && c >= 6) continue;
      if (r >= 6 && c < 3) continue;

      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      grid[r][c] = (seed % 3) !== 0; // ~66% fill rate
    }
  }

  return grid;
}

export default function MockQR({
  userId = "demo-user",
  size = 120,
  color = app.violet,
  showLabel = true,
}: MockQRProps) {
  const pattern = generatePattern(userId);
  const cellSize = size / 9;
  const gap = cellSize * 0.12;
  const cellDraw = cellSize - gap;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        role="img"
        aria-label="QR code vers le profil CeSoir"
      >
        {pattern.map((row, r) =>
          row.map((filled, c) =>
            filled ? (
              <motion.rect
                key={`${r}-${c}`}
                x={c * cellSize + gap / 2}
                y={r * cellSize + gap / 2}
                width={cellDraw}
                height={cellDraw}
                rx={cellDraw * 0.15}
                fill={color}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  ...springs.micro,
                  delay: (r * 9 + c) * 0.005,
                }}
                style={{ transformOrigin: `${c * cellSize + cellSize / 2}px ${r * cellSize + cellSize / 2}px` }}
              />
            ) : null
          )
        )}
      </svg>
      {showLabel && (
        <span
          className="text-[8px] font-bold uppercase tracking-[0.15em]"
          style={{ color }}
        >
          CeSoir
        </span>
      )}
    </div>
  );
}
