"use client";

import dynamic from "next/dynamic";

const Moon3D = dynamic(() => import("./Moon3D"), {
  ssr: false,
  loading: () => (
    <span
      className="text-6xl text-[#8B5CF6] mb-6 drop-shadow-[0_0_30px_rgba(139,92,246,0.5)]"
      style={{ animation: "float 6s ease-in-out infinite" }}
    >
      ☾
    </span>
  ),
});

export function Moon3DLoader() {
  return <Moon3D />;
}
