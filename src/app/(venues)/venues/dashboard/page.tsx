import VenueDashboard from "@/components/venues/VenueDashboard";

/**
 * /venues/dashboard — B2B owner-only dashboard (Wave 15 CRO 10/10).
 *
 * Access is gated in `src/proxy.ts` via NEXT_PUBLIC_VENUE_OWNERS whitelist.
 * This page delegates to VenueDashboard (client component) so data loads
 * happen client-side via the Supabase browser client.
 */
export default function VenuesDashboardPage() {
  return <VenueDashboard />;
}
