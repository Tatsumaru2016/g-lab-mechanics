/** Shutter ↔ jog dial lock — keep in sync with JogDial settle (~520ms) */
export const SHUTTER = {
  closeMs: 300,
  openMs: 520,
  fadeMs: 220,
  lockFallbackMs: 640,
} as const;
