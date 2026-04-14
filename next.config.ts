import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "ycyxmvzilzkusecpgvbi.supabase.co" },
    ],
  },
};

export default nextConfig;
