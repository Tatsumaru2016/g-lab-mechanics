import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence, type MotionValue } from "motion/react";
import { CHAMBERS } from "../types";
import { CHAMBER_STEP_DEG, SCOUTER_AIM_DEG } from "../sceneOrbit";
import { playGearMeshLock, playRatchetTick, ensureJogAudioReady, type RatchetKind } from "../audio/mechanicalDial";
import { chamberI18nKey } from "../i18n/chamberKey";
import { useTranslation } from "react-i18next";

interface JogDialProps {
  currentChamber: number;
  /** Shared with scene ring — updated every animation frame */
  dialRotationMV: MotionValue<number>;
  onChamberChange: (index: number) => void;
  /** Fires when dial settles on a detent */
  onSceneLocked?: () => void;
  /** Global SFX gate — when false, no dial sounds play */
  soundEnabled?: boolean;
}

const DIAL_SIZE = 380;
const STEP_DEGREES = CHAMBER_STEP_DEG;
const TICK_STEP = 6;

/** Scouter HUD — deep blue, darker than cyan accent (#00C8FF) */
const SCOUTER_BLUE = "#003DB8";

/** Safe-dial geometry (viewBox 0 0 360 360) */
const G = {
  cx: 180,
  cy: 180,
  bezelOuter: 178,
  bezelInner: 171,
  scaleOuter: 169,
  scaleInner: 127,
  /** Scene numbers — inside short ticks, toward center */
  numR: 136,
  gripOuter: 122,
  gripInner: 106,
  knobR: 94,
} as const;

const DIAL_INK = {
  tick: "#1A1F26",
  tickMedium: "#4A5260",
  tickMinor: "#7A8492",
  number: "#1A1F26",
  numberMuted: "#5A6370",
  ringHair: "#B0B8C4",
  ringDeep: "#78828E",
} as const;

/** Hub slightly past left edge → ~half the dial visible */
export const DIAL_CENTER_X = -52;
const DIAL_MOUNT_LEFT = DIAL_CENTER_X - DIAL_SIZE / 2;
const DIAL_MOUNT_TOP = `calc(50% - ${DIAL_SIZE / 2}px)`;
/** Match dial shell scale; scouter sits inside white outer bezel */
const DIAL_SHELL_SCALE = 0.9;
const BEZEL_OUTER_PX = G.bezelOuter * DIAL_SHELL_SCALE;
/** Keep blue frame inside the thick white outer ring, nudged slightly left */
const SCOUTER_INSET_FROM_WHITE_PX = 10;
const SCOUTER_NUDGE_LEFT_PX = -5;
const SCOUTER_SLOT = {
  left: DIAL_CENTER_X,
  width: BEZEL_OUTER_PX - SCOUTER_INSET_FROM_WHITE_PX - SCOUTER_NUDGE_LEFT_PX,
  height: 52,
} as const;
const SLOT_LEFT = SCOUTER_SLOT.left;
const SLOT_WIDTH = SCOUTER_SLOT.width;
const SLOT_HEIGHT = SCOUTER_SLOT.height;
const SLOT_TOP = `calc(50% - ${SLOT_HEIGHT / 2}px)`;
/** Right edge of dial + scouter channel (px from viewport left) */
const DIAL_OCCLUSION_RIGHT_PX = DIAL_CENTER_X + SCOUTER_SLOT.width;
/** Main scene content starts here — dial/scouter cleared with a modest gap */
export const DIAL_SCENE_CLEARANCE_PX = Math.ceil(DIAL_OCCLUSION_RIGHT_PX + 32);

const SCOUTER = {
  ink: SCOUTER_BLUE,
  border: "rgba(0, 61, 184, 0.48)",
  borderStrong: "rgba(0, 61, 184, 0.72)",
  fill: "rgba(0, 61, 184, 0.1)",
  fillStrong: "rgba(0, 61, 184, 0.22)",
  glow: "rgba(0, 61, 184, 0.35)",
} as const;

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: G.cx + radius * Math.cos(rad),
    y: G.cy + radius * Math.sin(rad),
  };
}

function markAngle(deg: number) {
  return deg;
}

/** Scene index mark on dial — slot on full circle; 0 at scouter (3 o'clock) when rotation = 0 */
function sceneMarkAngle(sceneIndex: number) {
  return sceneIndex * STEP_DEGREES + SCOUTER_AIM_DEG;
}

function tickKindAtDeg(deg: number): RatchetKind {
  if (deg % STEP_DEGREES === 0) return "major";
  if (deg % (STEP_DEGREES / 2) === 0) return "medium";
  return "minor";
}

function ratchetKindForTickSlot(tickSlot: number): RatchetKind {
  const deg = (((tickSlot * TICK_STEP) % 360) + 360) % 360;
  return tickKindAtDeg(deg);
}

/** Tick lengths — clearer large / small contrast */
function shortTickRadii(kind: "major" | "medium" | "minor") {
  const band = G.scaleOuter - G.scaleInner;
  const len =
    kind === "major" ? band * 0.42 : kind === "medium" ? band * 0.28 : band * 0.16;
  return { inner: G.scaleOuter - len, outer: G.scaleOuter - 0.2 };
}

/**
 * Mechanical detent model (Bourns encoder / Sony ratchet jog dial):
 * - Ball-spring wells at fixed angles — resistance rises between detents
 * - Discrete tactile click when each detent engages
 * - Release can overshoot one valley, then spring back and latch
 */
const PHYSICS = {
  boundaryGive: 0.1,
  wellSharpness: 2.35,
  fingerBlend: 0.36,
  detentLockDeg: 2.6,
  maxOvershoot: 4.8,
  velocityScale: 2.4,
} as const;

function rubberBoundary(angle: number, min: number, max: number): number {
  if (angle < min) return min + (angle - min) * PHYSICS.boundaryGive;
  if (angle > max) return max + (angle - max) * PHYSICS.boundaryGive;
  return angle;
}

function applyDetentWell(rawAngle: number): number {
  const center = -Math.round(-rawAngle / STEP_DEGREES) * STEP_DEGREES;
  const offset = rawAngle - center;
  const norm = offset / (STEP_DEGREES / 2);
  const resistance = Math.exp(-norm * norm * PHYSICS.wellSharpness);
  return center + offset * (PHYSICS.fingerBlend + (1 - PHYSICS.fingerBlend) * resistance);
}

function detentAngle(index: number): number {
  return -index * STEP_DEGREES;
}

function detentIndex(angle: number): number {
  return Math.max(0, Math.min(CHAMBERS.length - 1, Math.round(-angle / STEP_DEGREES)));
}

export default function JogDial({
  currentChamber,
  dialRotationMV,
  onChamberChange,
  onSceneLocked,
  soundEnabled = true,
}: JogDialProps) {
  const dialRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const [rotation, setRotation] = useState(detentAngle(currentChamber));
  const [isDragging, setIsDragging] = useState(false);
  const [detentKick, setDetentKick] = useState(false);
  const [syncEffect, setSyncEffect] = useState(false);
  const [isSettling, setIsSettling] = useState(false);

  const dragStartAngle = useRef(0);
  const lastLoggedChamber = useRef(currentChamber);
  const currentChamberRef = useRef(currentChamber);
  const rotationRef = useRef(detentAngle(currentChamber));
  const lastMoveAngleRef = useRef(0);
  const lastMoveTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const pendingSnapRef = useRef(false);
  const snapSceneChangedRef = useRef(false);
  const dragStartChamberRef = useRef(currentChamber);
  const isDraggingRef = useRef(false);
  const kickTimerRef = useRef<number | null>(null);
  const lastTickSlotRef = useRef(0);

  const triggerSnapFeedback = (withScenePulse: boolean) => {
    if (soundEnabled) {
      playGearMeshLock(withScenePulse ? "full" : "confirm");
    }
    setDetentKick(true);
    // Lock VFX on every snap; full pulse when scene index actually changed
    setSyncEffect(true);
    if (withScenePulse) onSceneLocked?.();
    if (kickTimerRef.current) window.clearTimeout(kickTimerRef.current);
    kickTimerRef.current = window.setTimeout(() => {
      setDetentKick(false);
      setSyncEffect(false);
      setIsSettling(false);
    }, 520);
  };

  const beginSettleSnap = (
    index: number,
    options: { changeScene?: boolean; scenePulse?: boolean; withOvershoot?: boolean } = {}
  ) => {
    const clamped = Math.max(0, Math.min(CHAMBERS.length - 1, index));
    const targetRot = detentAngle(clamped);
    const changeScene = options.changeScene ?? false;
    const scenePulse = options.scenePulse ?? changeScene;
    snapSceneChangedRef.current = scenePulse;
    lastLoggedChamber.current = clamped;

    if (changeScene) {
      onChamberChange(clamped);
    }

    setIsSettling(true);

    const vel = velocityRef.current;
    const overshoot =
      options.withOvershoot !== false
        ? Math.sign(vel) * Math.min(PHYSICS.maxOvershoot, Math.abs(vel) * PHYSICS.velocityScale)
        : 0;

    if (Math.abs(overshoot) > 0.9 && Math.abs(rotationRef.current - targetRot) > 1.2) {
      pendingSnapRef.current = false;
      const peak = targetRot + overshoot * 0.55;
      setRotation(peak);
      rotationRef.current = peak;
      dialRotationMV.set(peak);
      window.requestAnimationFrame(() => {
        pendingSnapRef.current = true;
        setRotation(targetRot);
        rotationRef.current = targetRot;
      });
      return;
    }

    setRotation(targetRot);
    rotationRef.current = targetRot;

    if (Math.abs(rotationRef.current - targetRot) < 0.4) {
      pendingSnapRef.current = false;
      dialRotationMV.set(targetRot);
      triggerSnapFeedback(scenePulse);
      return;
    }

    pendingSnapRef.current = true;
  };

  const handleRotateSettled = () => {
    if (!pendingSnapRef.current) return;
    pendingSnapRef.current = false;
    triggerSnapFeedback(snapSceneChangedRef.current);
  };

  useEffect(() => {
    return () => {
      if (kickTimerRef.current) window.clearTimeout(kickTimerRef.current);
    };
  }, []);

  useEffect(() => {
    currentChamberRef.current = currentChamber;
  }, [currentChamber]);

  useEffect(() => {
    if (isDraggingRef.current) return;
    const rot = detentAngle(currentChamber);
    setRotation(rot);
    rotationRef.current = rot;
    lastLoggedChamber.current = currentChamber;
    // Ring follows via motion onUpdate during spring — do not snap MV here
  }, [currentChamber]);

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    let lastWheelTime = 0;
    const handleWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastWheelTime < 250) return;

      if (Math.abs(e.deltaY) > 10 || Math.abs(e.deltaX) > 10) {
        lastWheelTime = now;
        const delta = e.deltaY > 0 || e.deltaX > 0 ? 1 : -1;
        const next = Math.max(0, Math.min(CHAMBERS.length - 1, currentChamber + delta));
        if (next !== currentChamber) beginSettleSnap(next, { changeScene: true, withOvershoot: false });
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [currentChamber, onChamberChange, soundEnabled]);

  const getMouseAngle = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!dialRef.current) return 0;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let clientX = 0;
    let clientY = 0;
    if ("touches" in e) {
      if (e.touches.length === 0) return 0;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
  };

  const handleStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if ("button" in e && e.button !== 0) {
      return;
    }

    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartChamberRef.current = currentChamberRef.current;
    dragStartAngle.current = getMouseAngle(e) - rotationRef.current;
    lastMoveAngleRef.current = rotationRef.current;
    lastMoveTimeRef.current = performance.now();
    velocityRef.current = 0;
    lastTickSlotRef.current = Math.round(-rotationRef.current / TICK_STEP);
    if (soundEnabled) {
      void ensureJogAudioReady();
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const raw = getMouseAngle(e) - dragStartAngle.current;
      const minRot = detentAngle(CHAMBERS.length - 1) - 8;
      const maxRot = 8;
      const bounded = rubberBoundary(raw, minRot, maxRot);
      const physical = applyDetentWell(bounded);

      const now = performance.now();
      const dt = Math.max(now - lastMoveTimeRef.current, 1);
      velocityRef.current = ((physical - lastMoveAngleRef.current) / dt) * 16;
      lastMoveTimeRef.current = now;
      lastMoveAngleRef.current = physical;

      rotationRef.current = physical;
      setRotation(physical);
      dialRotationMV.set(physical);

      const tickSlot = Math.round(-physical / TICK_STEP);
      if (tickSlot !== lastTickSlotRef.current) {
        lastTickSlotRef.current = tickSlot;
        if (soundEnabled) {
          playRatchetTick(ratchetKindForTickSlot(tickSlot));
        }
      }

      const idx = detentIndex(physical);
      const atDetent = Math.abs(physical - detentAngle(idx)) < PHYSICS.detentLockDeg;

      if (idx !== lastLoggedChamber.current && atDetent) {
        lastLoggedChamber.current = idx;
        if (idx !== currentChamberRef.current) {
          onChamberChange(idx);
        }
      }
    };

    const handleEnd = () => {
      isDraggingRef.current = false;
      setIsDragging(false);

      const physical = applyDetentWell(rotationRef.current);
      const targetIndex = detentIndex(physical);
      const sceneChanged = targetIndex !== dragStartChamberRef.current;
      beginSettleSnap(targetIndex, {
        changeScene: targetIndex !== currentChamberRef.current,
        scenePulse: sceneChanged,
        withOvershoot: true,
      });
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, onChamberChange, soundEnabled, dialRotationMV]);

  const dialActiveIndex = Math.max(
    0,
    Math.min(CHAMBERS.length - 1, Math.round(-rotation / STEP_DEGREES))
  );
  const isLocked = !isDragging && Math.abs(rotation - detentAngle(currentChamber)) < 0.5;
  const frameNumber = dialActiveIndex + 1;
  const isSceneSynced = isLocked && dialActiveIndex === currentChamber;

  const dialShellClass = `rounded-full dial-safe-shell pointer-events-auto cursor-grab active:cursor-grabbing scale-[0.9] md:scale-95 transition-transform duration-100 origin-center overflow-hidden ${
    detentKick ? "scale-[0.87] md:scale-[0.925] rotate-[1.5deg]" : ""
  }`;

  const rotateTransition = isDragging
    ? { type: "just" as const }
    : isSettling || detentKick
      ? {
          type: "spring" as const,
          stiffness: 360,
          damping: 14,
          mass: 1.15,
          restDelta: 0.025,
          restSpeed: 0.025,
        }
      : { type: "spring" as const, stiffness: 260, damping: 28, mass: 1.25 };

  return (
    <div className="absolute inset-0 z-20 group/dial select-none pointer-events-none overflow-visible">
      {/* Dial + fixed slot share hub at (DIAL_CENTER_X, 50%) */}
      <div className="absolute inset-0 overflow-visible pointer-events-none">
        {/* Rotating dial assembly */}
        <div
          ref={dialRef}
          onMouseDown={handleStart}
          onTouchStart={handleStart}
          className={dialShellClass}
          style={{
            position: "absolute",
            left: DIAL_MOUNT_LEFT,
            top: DIAL_MOUNT_TOP,
            width: DIAL_SIZE,
            height: DIAL_SIZE,
          }}
        >
          {/* Index hairline — scouter center (3 o'clock) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 z-40 pointer-events-none"
            style={{
              right: 10,
              width: 16,
              height: 1.5,
              borderRadius: 1,
              background:
                "linear-gradient(90deg, transparent 0%, #C43030 35%, #C43030 65%, transparent 100%)",
              boxShadow: "0 0 6px rgba(196, 48, 48, 0.35)",
            }}
          />

          <motion.div
            style={{ width: 360, height: 360, transformOrigin: "center center" }}
            animate={{ rotate: rotation }}
            transition={rotateTransition}
            onUpdate={(latest) => {
              const r = latest.rotate;
              if (typeof r === "number") dialRotationMV.set(r);
            }}
            onAnimationComplete={handleRotateSettled}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          >
            <svg className="w-full h-full absolute overflow-visible" viewBox="0 0 360 360">
              <defs>
                <linearGradient id="dialBezelMetal" x1="12%" y1="8%" x2="88%" y2="92%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="22%" stopColor="#E8EDF4" />
                  <stop offset="48%" stopColor="#98A2B0" />
                  <stop offset="72%" stopColor="#D4DAE4" />
                  <stop offset="100%" stopColor="#F0F3F8" />
                </linearGradient>
                <radialGradient id="dialScaleFace" cx="34%" cy="28%" r="78%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="42%" stopColor="#F6F8FB" />
                  <stop offset="78%" stopColor="#D8DEE8" />
                  <stop offset="100%" stopColor="#B8C0CC" />
                </radialGradient>
                <linearGradient id="dialScaleSheen" x1="8%" y1="6%" x2="72%" y2="78%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.72)" />
                  <stop offset="38%" stopColor="rgba(255,255,255,0.18)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
                <linearGradient id="dialSpecularArc" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                  <stop offset="42%" stopColor="rgba(255,255,255,0.55)" />
                  <stop offset="58%" stopColor="rgba(255,255,255,0.35)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
                <linearGradient id="dialWell" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#F4F6FA" />
                  <stop offset="100%" stopColor="#E2E7EE" />
                </linearGradient>
                <linearGradient id="dialGripMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E2E7EE" />
                  <stop offset="35%" stopColor="#8E98A6" />
                  <stop offset="65%" stopColor="#B0B8C4" />
                  <stop offset="100%" stopColor="#D8DEE8" />
                </linearGradient>
                <radialGradient id="dialKnobFace" cx="36%" cy="30%" r="64%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="38%" stopColor="#D8DEE8" />
                  <stop offset="72%" stopColor="#98A2B0" />
                  <stop offset="100%" stopColor="#6E7888" />
                </radialGradient>
                <radialGradient id="dialKnobHotspot" cx="32%" cy="26%" r="24%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                  <stop offset="55%" stopColor="rgba(255,255,255,0.15)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </radialGradient>
                <filter id="dialSoftShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#1A2030" floodOpacity="0.12" />
                </filter>
              </defs>

              <g filter="url(#dialSoftShadow)">
                {/* Opaque backing — prevents scene bleed-through */}
                <circle cx={G.cx} cy={G.cy} r={G.bezelOuter} fill="#FFFFFF" />

                {/* Outer bezel — smooth machined ring */}
                <circle
                  cx={G.cx}
                  cy={G.cy}
                  r={(G.bezelOuter + G.bezelInner) / 2}
                  fill="none"
                  stroke="url(#dialBezelMetal)"
                  strokeWidth={G.bezelOuter - G.bezelInner}
                />
                <circle
                  cx={G.cx}
                  cy={G.cy}
                  r={G.bezelOuter}
                  fill="none"
                  stroke="rgba(255,255,255,0.92)"
                  strokeWidth="0.75"
                />
                <circle
                  cx={G.cx}
                  cy={G.cy}
                  r={G.bezelInner + 1}
                  fill="none"
                  stroke="rgba(60,68,80,0.12)"
                  strokeWidth="0.45"
                />

                {/* Scale face */}
                <circle cx={G.cx} cy={G.cy} r={G.scaleOuter} fill="#FFFFFF" />
                <circle cx={G.cx} cy={G.cy} r={G.scaleOuter} fill="url(#dialScaleFace)" />
                <circle
                  cx={G.cx}
                  cy={G.cy}
                  r={G.scaleOuter}
                  fill="url(#dialScaleSheen)"
                  opacity="0.58"
                />
                <ellipse
                  cx={G.cx - 28}
                  cy={G.cy - 42}
                  rx={72}
                  ry={28}
                  fill="url(#dialSpecularArc)"
                  opacity="0.42"
                  transform={`rotate(-18 ${G.cx} ${G.cy})`}
                  pointerEvents="none"
                />
                <circle
                  cx={G.cx}
                  cy={G.cy}
                  r={G.scaleOuter}
                  fill="none"
                  stroke={DIAL_INK.ringDeep}
                  strokeWidth="0.75"
                />
                <circle
                  cx={G.cx}
                  cy={G.cy}
                  r={G.scaleInner}
                  fill="none"
                  stroke={DIAL_INK.ringDeep}
                  strokeWidth="0.6"
                />

                {/* Inner well */}
                <circle cx={G.cx} cy={G.cy} r={G.scaleInner} fill="url(#dialWell)" />

                {/* Ticks */}
                {Array.from({ length: 360 / TICK_STEP }, (_, i) => {
                  const deg = i * TICK_STEP;
                  const kind = tickKindAtDeg(deg);
                  const angle = markAngle(deg);
                  const sceneIdx = deg / STEP_DEGREES;
                  const emphasized =
                    kind === "major" &&
                    sceneIdx < CHAMBERS.length &&
                    sceneIdx === dialActiveIndex;
                  const { inner, outer } = shortTickRadii(kind);
                  const p1 = polar(angle, inner);
                  const p2 = polar(angle, outer);
                  return (
                    <line
                      key={`tick-${deg}`}
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={
                        emphasized
                          ? SCOUTER_BLUE
                          : kind === "minor"
                            ? DIAL_INK.tickMinor
                            : kind === "medium"
                              ? DIAL_INK.tickMedium
                              : DIAL_INK.tick
                      }
                      strokeWidth={kind === "major" ? 1.5 : kind === "medium" ? 1 : 0.65}
                      strokeLinecap="butt"
                      opacity={emphasized ? 1 : 1}
                    />
                  );
                })}

                {/* Scene numbers */}
                {CHAMBERS.map((chamber) => {
                  const index = chamber.index;
                  const angle = sceneMarkAngle(index);
                  const pos = polar(angle, G.numR);
                  const atPointer = index === dialActiveIndex;
                  return (
                    <text
                      key={`scene-num-${index}`}
                      x={pos.x}
                      y={pos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${angle + 90} ${pos.x} ${pos.y})`}
                      fill={atPointer ? SCOUTER_BLUE : DIAL_INK.numberMuted}
                      fontSize={atPointer ? 13 : 11}
                      fontWeight={atPointer ? 700 : 600}
                      fontFamily="'JetBrains Mono', ui-monospace, monospace"
                      letterSpacing={atPointer ? "0.06em" : "0.04em"}
                      opacity={atPointer ? 1 : 0.88}
                    >
                      {index + 1}
                    </text>
                  );
                })}

                {/* Grip ring — clean torus */}
                <circle
                  cx={G.cx}
                  cy={G.cy}
                  r={(G.gripOuter + G.gripInner) / 2}
                  fill="none"
                  stroke="url(#dialGripMetal)"
                  strokeWidth={G.gripOuter - G.gripInner}
                />
                <circle
                  cx={G.cx}
                  cy={G.cy}
                  r={G.gripOuter}
                  fill="none"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="0.35"
                />

                {/* Center knob — brushed cap */}
                <circle cx={G.cx} cy={G.cy} r={G.knobR} fill="url(#dialKnobFace)" />
                <circle
                  cx={G.cx}
                  cy={G.cy}
                  r={G.knobR}
                  fill="url(#dialKnobHotspot)"
                  pointerEvents="none"
                />
                <circle
                  cx={G.cx}
                  cy={G.cy}
                  r={G.knobR - 10}
                  fill="none"
                  stroke="rgba(255,255,255,0.45)"
                  strokeWidth="0.4"
                />
                <circle
                  cx={G.cx}
                  cy={G.cy}
                  r={G.knobR}
                  fill="none"
                  stroke="rgba(60,68,80,0.25)"
                  strokeWidth="0.65"
                />
                <circle cx={G.cx} cy={G.cy} r={7} fill="#ECEFF4" stroke="#B0B8C4" strokeWidth="0.35" />
              </g>
            </svg>
          </motion.div>
        </div>

        {/* Fixed scouter — hub to tick ring (constant size, never resizes) */}
        <div
          className="absolute z-[28] pointer-events-none overflow-visible"
          style={{
            left: SLOT_LEFT,
            top: SLOT_TOP,
            width: SLOT_WIDTH,
            height: SLOT_HEIGHT,
          }}
        >
          <div
            className="relative w-full h-full overflow-hidden rounded-r-md transition-[box-shadow,border-color,background] duration-200 border-y border-r dial-scouter-metal mr-px"
            style={{
              borderColor: syncEffect
                ? SCOUTER.borderStrong
                : isSceneSynced
                  ? SCOUTER.border
                  : "rgba(108, 118, 132, 0.42)",
              boxShadow: syncEffect
                ? `inset 0 0 0 2px ${SCOUTER.borderStrong}, inset 0 1px 0 rgba(255,255,255,0.9), 0 0 18px ${SCOUTER.glow}`
                : isSceneSynced
                  ? `inset 0 0 0 1.5px ${SCOUTER.border}, inset 0 1px 0 rgba(255,255,255,0.85), 0 0 8px rgba(0, 61, 184, 0.08)`
                  : undefined,
              background: syncEffect
                ? `linear-gradient(90deg, #e4e9f2 0%, ${SCOUTER.fillStrong} 52%, rgba(0, 61, 184, 0.12) 100%)`
                : isSceneSynced
                  ? `linear-gradient(90deg, #eceff5 0%, rgba(0, 61, 184, 0.14) 100%)`
                  : undefined,
            }}
          >
            {/* Right edge — inside white outer bezel */}
            <div
              className="absolute inset-y-3 right-1 w-px pointer-events-none"
              style={{ backgroundColor: SCOUTER.border }}
            />
            <div
              className="absolute inset-y-3 left-4 right-3 border-y border-dashed pointer-events-none"
              style={{
                borderColor: isSceneSynced
                  ? "rgba(0, 61, 184, 0.3)"
                  : "rgba(0, 61, 184, 0.18)",
              }}
            />

            {/* Hub pin (left) */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-[78%] rounded-full pointer-events-none"
              style={{ backgroundColor: SCOUTER.borderStrong }}
            />

            {/* Scene name + number on tick ring */}
            <div className="absolute inset-y-0 left-7 right-3 z-10 flex items-center justify-end gap-2.5 pointer-events-none">
              <motion.div
                key={`slot-${dialActiveIndex}`}
                initial={syncEffect ? { scale: 0.7, opacity: 0.2 } : false}
                animate={
                  syncEffect
                    ? { scale: [0.7, 1.18, 1], opacity: [0.2, 1, 1] }
                    : {
                        scale: isSceneSynced ? 1 : 0.88,
                        opacity: isSceneSynced ? 1 : 0,
                      }
                }
                transition={
                  syncEffect
                    ? { duration: 0.42, ease: [0.34, 1.4, 0.64, 1] }
                    : { type: "spring", stiffness: 520, damping: 28 }
                }
                className="relative flex items-center gap-2.5"
              >
                <span
                  className="font-mono uppercase tracking-[0.12em] leading-none whitespace-nowrap text-[8px]"
                  style={{
                    color:
                      syncEffect || isSceneSynced
                        ? SCOUTER.ink
                        : "rgba(0, 61, 184, 0.45)",
                    fontWeight: syncEffect || isSceneSynced ? 700 : 600,
                  }}
                >
                  {t(`chambers.${chamberI18nKey(CHAMBERS[dialActiveIndex].id)}.name`)}
                </span>
                <span
                  className="font-mono tabular-nums leading-none text-[13px]"
                  style={{
                    color:
                      syncEffect || isSceneSynced
                        ? SCOUTER.ink
                        : "rgba(0, 61, 184, 0.5)",
                    fontWeight: syncEffect || isSceneSynced ? 800 : 700,
                    filter:
                      syncEffect || isSceneSynced
                        ? `drop-shadow(0 0 8px ${SCOUTER.glow})`
                        : undefined,
                  }}
                >
                  {frameNumber}
                </span>
                <AnimatePresence>
                  {syncEffect && (
                    <motion.span
                      key="sync-badge"
                      initial={{ opacity: 0, y: 3, scale: 0.8 }}
                      animate={{ opacity: [0, 1, 0], y: [3, -2, -5], scale: [0.8, 1, 0.9] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute -top-2.5 right-0 text-[5px] font-bold tracking-widest whitespace-nowrap"
                      style={{ color: SCOUTER.ink }}
                    >
                      {t("dial.lock")}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
