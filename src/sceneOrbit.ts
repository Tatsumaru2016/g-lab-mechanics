import { CHAMBERS } from "./types";

/** Hub X — keep in sync with JogDial `DIAL_CENTER_X` */
export const DIAL_PIVOT_X = -52;

/** Degrees per scene detent on dial + ring */
export const CHAMBER_STEP_DEG = 72;

/** Previous / next settle at ±76° — no sector clip; z-index keeps main on top */
export const ADJACENT_PEEK = {
  prevDeg: 76,
  nextDeg: -76,
  settleFromDist: 0.72,
} as const;

export const ORBIT = {
  activeSpan: 1.5,
  /** Main scene — 80% opaque */
  focusedOpacity: 0.8,
  adjacentOpacity: 0.48,
  /** Only show immediate neighbor while scrolling or peeking */
  neighborMinDist: 0.45,
  neighborMaxDist: 1.1,
} as const;

export function sceneOpacityForDist(dist: number, isMain: boolean): number {
  if (isMain) return ORBIT.focusedOpacity;
  if (dist >= ADJACENT_PEEK.settleFromDist) return ORBIT.adjacentOpacity;
  const t = Math.min(1, dist / 0.9);
  return ORBIT.focusedOpacity + (ORBIT.adjacentOpacity - ORBIT.focusedOpacity) * t;
}

export function detentAngle(index: number): number {
  return -index * CHAMBER_STEP_DEG;
}

export function chamberPositionFromRotation(rotation: number): number {
  return Math.max(0, Math.min(CHAMBERS.length - 1, -rotation / CHAMBER_STEP_DEG));
}

export function sceneSlotAngle(index: number): number {
  return -index * CHAMBER_STEP_DEG;
}

export function ringRotationFromDial(rotationDeg: number): number {
  return -rotationDeg;
}

export function ringRotationFromPosition(position: number): number {
  return position * CHAMBER_STEP_DEG;
}

/**
 * Ring angle for rendering. Neighbors settle at ±85°; main follows dial 1:1.
 */
export function sceneDisplayAngle(chamberIndex: number, position: number): number {
  const offset = position - chamberIndex;
  const natural = offset * CHAMBER_STEP_DEG;
  const dist = Math.abs(offset);
  const mainIndex = Math.round(position);

  if (chamberIndex === mainIndex && dist < 0.2) return natural;

  const { prevDeg, nextDeg, settleFromDist } = ADJACENT_PEEK;

  if (chamberIndex < mainIndex) {
    if (dist < settleFromDist) return natural;
    const blend = Math.min(1, (dist - settleFromDist) / (1 - settleFromDist));
    return natural + (prevDeg - natural) * blend;
  }

  if (chamberIndex > mainIndex) {
    if (dist < settleFromDist) return natural;
    const blend = Math.min(1, (dist - settleFromDist) / (1 - settleFromDist));
    return natural + (nextDeg - natural) * blend;
  }

  return natural;
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
  const angleFromSlot = sceneDisplayAngle(chamberIndex, position);
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
