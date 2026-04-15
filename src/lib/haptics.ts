/**
 * Haptic feedback utility for mobile devices.
 * Uses the Vibration API when available, silently no-ops otherwise.
 */

export const haptics = {
  /** Tap leger - selection, toggle */
  light: (): boolean | undefined => navigator?.vibrate?.(10),

  /** Tap moyen - bouton principal */
  medium: (): boolean | undefined => navigator?.vibrate?.(25),

  /** Tap fort - action importante */
  heavy: (): boolean | undefined => navigator?.vibrate?.(50),

  /** Pattern succes - confirmation */
  success: (): boolean | undefined => navigator?.vibrate?.([10, 50, 10]),

  /** Pattern erreur - alerte */
  error: (): boolean | undefined => navigator?.vibrate?.([50, 30, 50]),

  /** Pattern match - celebration */
  match: (): boolean | undefined => navigator?.vibrate?.([10, 30, 10, 30, 50]),
};
