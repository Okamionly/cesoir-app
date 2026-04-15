"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Cluster } from "@/lib/mapClustering";
import { formatCluster } from "@/lib/mapClustering";

interface ClusterMarkerProps {
  cluster: Cluster;
  onClick?: (cluster: Cluster) => void;
}

export default function ClusterMarker({ cluster, onClick }: ClusterMarkerProps) {
  const [hovered, setHovered] = useState(false);
  const { label, showCount } = formatCluster(cluster);

  // Single profile: show avatar
  if (!showCount) {
    const profile = cluster.profiles[0];
    return (
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onClick?.(cluster)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex flex-col items-center cursor-pointer"
        aria-label={`Profil de ${profile.name}`}
      >
        <div className="w-10 h-10 rounded-full gradient-bg p-[2px] shadow-glow">
          {profile.photo ? (
            <img
              src={profile.photo}
              alt={profile.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-bg flex items-center justify-center text-[14px] font-bold text-accent">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Name tooltip on hover */}
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -bottom-7 bg-bg-card border border-border rounded-lg px-2 py-0.5 shadow-lg whitespace-nowrap"
          >
            <span className="text-[10px] font-semibold text-text">{profile.name}</span>
          </motion.div>
        )}
      </motion.button>
    );
  }

  // Multi-profile cluster: gradient circle with count
  const size = Math.min(64, 36 + cluster.count * 2);

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => onClick?.(cluster)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex flex-col items-center cursor-pointer"
      aria-label={label}
    >
      {/* Outer glow ring */}
      <div
        className="rounded-full flex items-center justify-center shadow-glow"
        style={{
          width: size + 8,
          height: size + 8,
          background: "linear-gradient(135deg, rgba(139,92,246,0.25), rgba(0,255,136,0.25))",
        }}
      >
        {/* Inner circle with gradient */}
        <div
          className="rounded-full flex items-center justify-center"
          style={{
            width: size,
            height: size,
            background: "linear-gradient(135deg, #8B5CF6, #00FF88)",
          }}
        >
          <span className="text-white font-black text-[14px]">{cluster.count}</span>
        </div>
      </div>

      {/* Label on hover */}
      {hovered && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-7 bg-bg-card border border-border rounded-lg px-2.5 py-1 shadow-lg whitespace-nowrap"
        >
          <span className="text-[10px] font-semibold text-text">{label}</span>
        </motion.div>
      )}
    </motion.button>
  );
}
