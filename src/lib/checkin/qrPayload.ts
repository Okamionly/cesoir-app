/**
 * QR check-in payload helpers (Wave 17).
 *
 * Both the display and the scanner components agree on the same encoding:
 *
 *   payload  = `cesoir://checkin/{planId}/{userId}`
 *   sixCode  = 6 deterministic digits derived from (planId, userId)
 *
 * Both sides compute the same `sixCode` independently from the SAME
 * inputs, which is how the camera-denied fallback works without any
 * server round-trip on either side: each user just shows their digits
 * and the peer types them in.
 */

/** UUID v4-ish shape — defensive only; server is the source of truth. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Build the payload string we encode into the QR. */
export function buildQrPayload(planId: string, userId: string): string {
  return `cesoir://checkin/${planId}/${userId}`;
}

/**
 * Decode a QR payload string into its components. Returns null if the
 * string doesn't match our known scheme — caller should treat that as
 * "ignore, keep scanning" rather than as an error.
 */
export interface DecodedPayload {
  planId: string;
  userId: string;
}

export function decodeQrPayload(raw: string): DecodedPayload | null {
  if (typeof raw !== "string") return null;
  // Allow optional trailing slash, ignore query/hash if any.
  const m = raw.match(
    /^cesoir:\/\/checkin\/([0-9a-f-]{36})\/([0-9a-f-]{36})\/?(?:[?#].*)?$/i,
  );
  if (!m) return null;
  const planId = m[1];
  const userId = m[2];
  if (!UUID_RE.test(planId) || !UUID_RE.test(userId)) return null;
  return { planId, userId };
}

/**
 * Derive a stable 6-digit code from (planId, userId). Same inputs always
 * produce the same digits on every device — no server call, no clock —
 * so this is the deterministic fallback when the camera is denied.
 *
 * Implementation note: a simple FNV-1a 32-bit hash over the canonical
 * payload is plenty for collision avoidance within a single match
 * (population of TWO codes per plan). We then mod 1_000_000 and zero-pad
 * to 6 digits. This is NOT a cryptographic identity — anyone with the
 * payload can compute it. The security boundary is the API: the server
 * still validates plan membership and auth.uid() before awarding karma.
 */
export function deriveSixDigitCode(planId: string, userId: string): string {
  const input = buildQrPayload(planId, userId);
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    // Math.imul to keep the multiply 32-bit (avoid float precision drift).
    h = Math.imul(h, 0x01000193);
  }
  // Cast to unsigned then mod and pad.
  const unsigned = h >>> 0;
  return String(unsigned % 1_000_000).padStart(6, "0");
}

/**
 * Resolve a 6-digit code typed by the user against the EXPECTED peer
 * (planId, peerUserId). Returns true if the digits match what
 * deriveSixDigitCode(planId, peerUserId) would produce.
 *
 * The caller is responsible for knowing the peer's user_id (the chat /
 * plan UI already has it via the conversation lookup), so this is a
 * pure equality check. No server round-trip.
 */
export function verifySixDigitCode(
  typed: string,
  planId: string,
  peerUserId: string,
): boolean {
  const expected = deriveSixDigitCode(planId, peerUserId);
  return typed.replace(/\D/g, "").padStart(6, "0") === expected;
}
