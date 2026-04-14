"use client";

import { motion } from "framer-motion";
import { Profile } from "@/lib/mock-profiles";

interface SmartQueueBadgeProps {
  profile: Profile;
}

interface Badge {
  key: string;
  label: string;
  color: string;
  bgColor: string;
  pulse?: boolean;
}

function getBadges(profile: Profile): Badge[] {
  const badges: Badge[] = [];

  // Karma badge (simulated: profiles with id < 10 get high karma)
  const karma = 3.5 + (parseInt(profile.id) % 5) * 0.3;
  if (karma >= 4.5) {
    badges.push({
      key: "karma",
      label: `Karma ${karma.toFixed(1)} \u2605`,
      color: "#F59E0B",
      bgColor: "rgba(245,158,11,0.15)",
    });
  }

  // Dispo maintenant
  if (profile.time === "Dispo maintenant") {
    badges.push({
      key: "dispo",
      label: "Dispo maintenant",
      color: "#00FF88",
      bgColor: "rgba(0,255,136,0.15)",
      pulse: true,
    });
  }

  // Same intention (mode matching) - simulated for some profiles
  const intentionModes = ["solo-diner", "plus-one", "foodie-quest"];
  if (intentionModes.includes(profile.mode)) {
    badges.push({
      key: "intention",
      label: "Meme intention",
      color: "#8B5CF6",
      bgColor: "rgba(139,92,246,0.15)",
    });
  }

  // Distance badge
  if (profile.distance <= 0.5) {
    const meters = Math.round(profile.distance * 1000);
    badges.push({
      key: "distance",
      label: `A ${meters}m`,
      color: "#06b6d4",
      bgColor: "rgba(6,182,212,0.15)",
    });
  }

  return badges.slice(0, 3); // Max 3 badges
}

const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const badgeVariant = {
  hidden: { opacity: 0, scale: 0.7, y: -4 },
  show: { opacity: 1, scale: 1, y: 0 },
};

export default function SmartQueueBadge({ profile }: SmartQueueBadgeProps) {
  const badges = getBadges(profile);

  if (badges.length === 0) return null;

  return (
    <motion.div
      className="flex flex-wrap gap-1 z-10"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {badges.map((badge) => (
        <motion.span
          key={badge.key}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold backdrop-blur-md"
          style={{
            color: badge.color,
            backgroundColor: badge.bgColor,
          }}
          variants={badgeVariant}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          {badge.pulse && (
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: badge.color }}
              />
              <span
                className="relative inline-flex rounded-full h-1.5 w-1.5"
                style={{ backgroundColor: badge.color }}
              />
            </span>
          )}
          {badge.label}
        </motion.span>
      ))}
    </motion.div>
  );
}
