import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";

/**
 * (venues) — B2B route group for bar/venue owners.
 *
 * Wave 15 CRO 10/10 (2026-04-23). Owner-only access is enforced in
 * `src/proxy.ts` via the `NEXT_PUBLIC_VENUE_OWNERS` whitelist. The layout
 * deliberately skips AppShell / AppChrome / bottom-nav so the dashboard
 * looks clearly distinct from the consumer app (no bottom nav, no FAB).
 */

export const metadata: Metadata = {
  title: "CeSoir Venues — Dashboard",
  description: "Dashboard B2B CeSoir · Montpellier",
  robots: { index: false, follow: false },
};

export default function VenuesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-white text-neutral-900 antialiased">
        {children}
      </div>
    </AuthProvider>
  );
}
