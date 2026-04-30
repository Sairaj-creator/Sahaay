// ─── Haptics utility (Vibration API) ──────────────────────────────────────────
// Provides physical feedback for visually impaired users.

export function vibrate(pattern = 50) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern)
  }
}

export const VIBRATIONS = {
  success: [50, 30, 50],
  error: [200, 100, 200],
  start: 100,
  stop: 50,
  tap: 20,
}
