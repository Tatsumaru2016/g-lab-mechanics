import { CHAMBERS } from "./types";

/** Hub X — keep in sync with JogDial `DIAL_CENTER_X` */
export const DIAL_PIVOT_X = -52;

/** Degrees per scene detent on dial + ring (full circle, 9 × 72° > 360°) */
export const CHAMBER_STEP_DEG = 72;

/**
 * Jog dial appears as a semicircle on screen but scenes orbit a full circle
 * around this hub. Active slot aims at the scouter (3 o'clock).
 */
export const SCOUTER_AIM_DEG = 0;

export const ORBIT = {
  activeSpan: 1.5,
  /** Main scene — 80% opaque */
  focusedOpacity: 0.8,
  adjacentOpacity: 0.48,
  /** Fade to adjacent opacity when dist ≥ this */
  adjacentSettleDist: 0.72,
  /** Only show immediate neighbor while scrolling or peeking */
  neighborMinDist: 0.45,
  neighborMaxDist: 1.1,
} as const;

export function sceneOpacityForDist(dist: number, isMain: boolean): number {
  if (isMain) return ORBIT.focusedOpacity;
  if (dist >= ORBIT.adjacentSettleDist) return ORBIT.adjacentOpacity;
  const t = Math.min(1, dist / 0.9);
  return ORBIT.focusedOpacity + (ORBIT.adjacentOpacity - ORBIT.focusedOpacity) * t;
}

export function detentAngle(index: number): number {
  return -index * CHAMBER_STEP_DEG;
}

export function chamberPositionFromRotation(rotation: number): number {
  return Math.max(0, Math.min(CHAMBERS.length - 1, -rotation / CHAMBER_STEP_DEG));
}

/** Fixed slot on the full circle (scene index → rest angle before dial spin) */
export function sceneSlotAngle(index: number): number {
  return index * CHAMBER_STEP_DEG;
}

/**
 * Display angle for a scene panel on the full orbit.
 * position − index → CW / CCW offset; 0° = scouter (3 o'clock).
 * Settled: prev (index−1) at +72°, next (index+1) at −72°.
 */
export function sceneOrbitAngle(chamberIndex: number, position: number): number {
  return (position - chamberIndex) * CHAMBER_STEP_DEG + SCOUTER_AIM_DEG;
}

/** @deprecated Use sceneOrbitAngle */
export function sceneDisplayAngle(chamberIndex: number, position: number): number {
  return sceneOrbitAngle(chamberIndex, position);
}

export function ringRotationFromDial(rotationDeg: number): number {
  return -rotationDeg;
}

export function ringRotationFromPosition(position: number): number {
  return position * CHAMBER_STEP_DEG;
}

export function sceneZIndex(chamberIndex: number, position: number): number {
  const mainIndex = Math.round(position);
  if (chamberIndex === mainIndex) return 50;
  if (Math.abs(position - chamberIndex) < 1) return 11;
  return 5;
}

export function sceneSlotMeta(chamberIndex: number, position: number) {
  const dist = Math.abs(position - chamberIndex);
  const mainIndex = Math.round(position);
  const isMain = chamberIndex === mainIndex;
  const angleFromSlot = sceneOrbitAngle(chamberIndex, position);
  const isNeighbor =
    Math.abs(chamberIndex - mainIndex) === 1 &&
    dist >= ORBIT.neighborMinDist &&
    dist <= ORBIT.neighborMaxDist;

  return {
    dist,
    angleFromSlot,
    opacity: sceneOpacityForDist(dist, isMain),
    zIndex: sceneZIndex(chamberIndex, position),
    isMain,
    isNeighbor,
    isVisible: isMain || isNeighbor,
    isFocused: isMain || dist < 0.25,
    isActive: dist < ORBIT.activeSpan,
  };
}
