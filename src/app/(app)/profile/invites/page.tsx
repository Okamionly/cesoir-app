import { redirect } from "next/navigation";

/**
 * /profile/invites — legacy Wave 15 page replaced 2026-04-26 by
 * /invites/mine which uses the hybrid reward model (mig 025).
 *
 * Kept as a server-side redirect so old bookmarks / saved deep links
 * still land correctly. The replacement is a richer dashboard with
 * Web Share API + stats banner + reward explainer.
 */
export default function LegacyInvitesRedirect(): never {
  redirect("/invites/mine");
}
