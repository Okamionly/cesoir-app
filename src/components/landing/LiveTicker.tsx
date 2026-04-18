"use client";

import { useState } from "react";
import { usePausableInterval } from "@/lib/usePausableInterval";

const events = [
  "Sarah et Marc se sont retrouves en Solo Diner il y a 12 min",
  "14 personnes viennent d'activer Night Owl",
  "Claire et son chien Rex ont un Dog Date dans 1h",
  "Nouveau match Langue Exchange a 0.8 km de toi",
  "Priya lance une Foodie Quest : meilleur pho de Paris",
  "3 personnes cherchent un +1 pour un concert ce soir",
  "Kevin propose un running au Luxembourg a 19h",
  "Manon organise une soiree jeux sans alcool dans le Marais",
  "Enzo cherche un adversaire Mario Kart au Meltdown",
  "Gabriel a 2 places pour l'expo Basquiat ce soir",
];

export default function LiveTicker() {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);

  usePausableInterval(() => {
    setVisible(false);
    setTimeout(() => {
      setCurrent(c => (c + 1) % events.length);
      setVisible(true);
    }, 300);
  }, 4000);

  return (
    <div className="w-full max-w-lg mx-auto px-6 py-4">
      <div className="bg-bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3 overflow-hidden">
        <span className="shrink-0 w-2 h-2 rounded-full bg-accent animate-pulse" aria-hidden="true" />
        <p
          className={`text-[12px] text-text-muted transition-all duration-300 truncate ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
          aria-live="polite"
        >
          {events[current]}
        </p>
      </div>
    </div>
  );
}
