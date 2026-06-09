import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence, type MotionValue } from "motion/react";
import { CHAMBERS } from "../types";
import { CHAMBER_STEP_DEG, SCOUTER_AIM_DEG } from "../sceneOrbit";
import { Volume2, VolumeX } from "lucide-react";

interface JogDialProps {
  currentChamber: number;
  /** Shared with scene ring — updated every animation frame */
  dialRotationMV: MotionValue<number>;
  onChamberChange: (index: number) => void;
  /** Fires when dial settles on a detent */
  onSceneLocked?: () => void;
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
/** Match dial shell scale; scouter frame = tick band at 3 o'clock */
const DIAL_RING_SCALE = 0.9;
const RING_OUTER_PX = G.scaleOuter * DIAL_RING_SCALE;
/** Fixed scouter channel: dial hub (left) → past outer tick ring */
const SCOUTER_SLOT_EXTEND_PX = 24;
const SCOUTER_SLOT = {
  left: DIAL_CENTER_X,
  width: RING_OUTER_PX + SCOUTER_SLOT_EXTEND_PX,
  height: 52,
} as const;
const SLOT_LEFT = SCOUTER_SLOT.left;
const SLOT_WIDTH = SCOUTER_SLOT.width;
const SLOT_HEIGHT = SCOUTER_SLOT.height;
const SLOT_TOP = `calc(50% - ${SLOT_HEIGHT / 2}px)`;
/** Right edge of dial + scouter channel (px from viewport left) */
const DIAL_OCCLUSION_RIGHT_PX =
  DIAL_CENTER_X + RING_OUTER_PX + SCOUTER_SLOT_EXTEND_PX;
/** Main scene content starts here — dial/scouter cleared with a modest gap */
export const DIAL_SCENE_CLEARANCE_PX = Math.ceil(DIAL_OCCLUSION_RIGHT_PX + 32);

const SCOUTER = {
  ink: SCOUTER_BLUE,
  border: "rgba(0, 61, 184, 0.48)",
  borderStrong: "rgba(0, 61, 184, 0.72)",
  fill: "rgba(0, 61, 184, 0.1)",
  fillStrong: "rgba(0, 61, 184, 0.22)",
  beam: "rgba(0, 61, 184, 0.5)",
  glow: "rgba(0, 61, 184, 0.35)",
  scanLine: "rgba(0, 61, 184, 0.95)",
  scanFlash: "rgba(0, 61, 184, 0.2)",
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

function tickKindAtDeg(deg: number): "major" | "medium" | "minor" {
  if (deg % STEP_DEGREES === 0) return "major";
  if (deg % (STEP_DEGREES / 2) === 0) return "medium";
  return "minor";
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
}: JogDialProps) {
  const dialRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [muted, setMuted] = useState(false);
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

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  };

  /** Passing tick while rotating — soft, not the final gear lock */
  const playDetentTick = () => {
    if (muted) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      const tick = ctx.createOscillator();
      const tickGain = ctx.createGain();
      tick.type = "triangle";
      tick.frequency.setValueAtTime(520, now);
      tick.frequency.exponentialRampToValueAtTime(280, now + 0.012);
      tickGain.gain.setValueAtTime(0.045, now);
      tickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.016);
      tick.connect(tickGain);
      tickGain.connect(ctx.destination);
      tick.start(now);
      tick.stop(now + 0.018);
    } catch {
      // Audio fallback
    }
  };

  /** Gear mesh lock — teeth engage when dial stops on final detent */
  const playGearMeshLock = (variant: "full" | "confirm" = "full") => {
    if (muted) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const amp = variant === "full" ? 1 : 0.48;

      const meshTooth = (t: number, freq: number, gainAmp: number, q = 7.5) => {
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.52, t + 0.013);

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = freq;
        filter.Q.value = q;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(gainAmp * amp, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.024);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.028);
      };

      const housing = ctx.createOscillator();
      const housingGain = ctx.createGain();
      const housingLp = ctx.createBiquadFilter();
      housing.type = "sawtooth";
      housing.frequency.setValueAtTime(68, now);
      housing.frequency.exponentialRampToValueAtTime(34, now + 0.1);
      housingLp.type = "lowpass";
      housingLp.frequency.value = 200;
      housingGain.gain.setValueAtTime(0.09 * amp, now);
      housingGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.105);
      housing.connect(housingLp);
      housingLp.connect(housingGain);
      housingGain.connect(ctx.destination);
      housing.start(now);
      housing.stop(now + 0.11);

      meshTooth(now + 0.016, 760, 0.055);
      meshTooth(now + 0.04, 980, 0.07);
      meshTooth(now + 0.064, 1280, 0.085, 9);

      const seatTime = now + 0.072;
      const seat = ctx.createOscillator();
      const seatGain = ctx.createGain();
      seat.type = "triangle";
      seat.frequency.setValueAtTime(195, seatTime);
      seat.frequency.exponentialRampToValueAtTime(82, seatTime + 0.065);
      seatGain.gain.setValueAtTime(0.24 * amp, seatTime);
      seatGain.gain.exponentialRampToValueAtTime(0.0001, seatTime + 0.075);
      seat.connect(seatGain);
      seatGain.connect(ctx.destination);
      seat.start(seatTime);
      seat.stop(seatTime + 0.08);

      const ring = ctx.createOscillator();
      const ringGain = ctx.createGain();
      ring.type = "sine";
      ring.frequency.setValueAtTime(1680, seatTime + 0.004);
      ring.frequency.exponentialRampToValueAtTime(620, seatTime + 0.05);
      ringGain.gain.setValueAtTime(0.08 * amp, seatTime + 0.004);
      ringGain.gain.exponentialRampToValueAtTime(0.0001, seatTime + 0.055);
      ring.connect(ringGain);
      ringGain.connect(ctx.destination);
      ring.start(seatTime + 0.004);
      ring.stop(seatTime + 0.06);

      const bufLen = Math.floor(ctx.sampleRate * 0.032);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const samples = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        samples[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.045));
      }
      const scrape = ctx.createBufferSource();
      scrape.buffer = buf;
      const scrapeF = ctx.createBiquadFilter();
      scrapeF.type = "bandpass";
      scrapeF.frequency.value = 2400;
      scrapeF.Q.value = 2.8;
      const scrapeG = ctx.createGain();
      scrapeG.gain.setValueAtTime(0.0001, seatTime);
      scrapeG.gain.linearRampToValueAtTime(0.16 * amp, seatTime + 0.006);
      scrapeG.gain.exponentialRampToValueAtTime(0.0001, seatTime + 0.038);
      scrape.connect(scrapeF);
      scrapeF.connect(scrapeG);
      scrapeG.connect(ctx.destination);
      scrape.start(seatTime);
    } catch {
      // Audio fallback
    }
  };

  const triggerSnapFeedback = (withScenePulse: boolean) => {
    playGearMeshLock(withScenePulse ? "full" : "confirm");
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
  }, [currentChamber, onChamberChange, muted]);

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
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartChamberRef.current = currentChamberRef.current;
    dragStartAngle.current = getMouseAngle(e) - rotationRef.current;
    lastMoveAngleRef.current = rotationRef.current;
    lastMoveTimeRef.current = performance.now();
    velocityRef.current = 0;
    if (audioContextRef.current?.state === "suspended") {
      audioContextRef.current.resume();
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

      const idx = detentIndex(physical);
      const atDetent = Math.abs(physical - detentAngle(idx)) < PHYSICS.detentLockDeg;

      if (idx !== lastLoggedChamber.current && atDetent) {
        lastLoggedChamber.current = idx;
        playDetentTick();
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
  }, [isDragging, onChamberChange, muted, dialRotationMV]);

  const dialRevealed = isDragging || detentKick;
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
      <div
        className={`absolute top-5 left-2 z-[60] pointer-events-auto transition-all duration-300 ${
          dialRevealed
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-1.5 group-hover/dial:opacity-100 group-hover/dial:translate-x-0"
        }`}
      >
        <button
          onClick={() => {
            setMuted(!muted);
            if (muted) setTimeout(() => playGearMeshLock("confirm"), 50);
          }}
          className="p-2 bg-[#F6F6F4]/50 hover:bg-[#F6F6F4]/70 text-neutral-800 rounded-full flex items-center justify-center border border-neutral-300/30 active:scale-95 backdrop-blur-[3px]"
          title={muted ? "Unmute mechanical clicking" : "Mute mechanical clicking"}
        >
          {muted ? (
            <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-neutral-600" />
          )}
        </button>
      </div>

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
                <linearGradient id="dialBezelMetal" x1="15%" y1="10%" x2="85%" y2="90%">
                  <stop offset="0%" stopColor="#FAFBFD" />
                  <stop offset="38%" stopColor="#D8DEE8" />
                  <stop offset="62%" stopColor="#A0A8B6" />
                  <stop offset="100%" stopColor="#E2E7EE" />
                </linearGradient>
                <radialGradient id="dialScaleFace" cx="36%" cy="30%" r="75%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="55%" stopColor="#FAFBFC" />
                  <stop offset="100%" stopColor="#ECEFF4" />
                </radialGradient>
                <linearGradient id="dialScaleSheen" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
                  <stop offset="50%" stopColor="rgba(255,255,255,0.08)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
                <linearGradient id="dialWell" x1="50%" y1="0%" x2="50%" y2="100%">
                  <stop offset="0%" stopColor="#F4F6FA" />
                  <stop offset="100%" stopColor="#E2E7EE" />
                </linearGradient>
                <linearGradient id="dialGripMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C8CED8" />
                  <stop offset="50%" stopColor="#9AA4B0" />
                  <stop offset="100%" stopColor="#B8C0CC" />
                </linearGradient>
                <radialGradient id="dialKnobFace" cx="38%" cy="32%" r="62%">
                  <stop offset="0%" stopColor="#F8FAFC" />
                  <stop offset="45%" stopColor="#D0D6E0" />
                  <stop offset="100%" stopColor="#8892A0" />
                </radialGradient>
                <radialGradient id="dialKnobHotspot" cx="34%" cy="28%" r="22%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
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
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth="0.6"
                />

                {/* Scale face */}
                <circle cx={G.cx} cy={G.cy} r={G.scaleOuter} fill="#FFFFFF" />
                <circle cx={G.cx} cy={G.cy} r={G.scaleOuter} fill="url(#dialScaleFace)" />
                <circle
                  cx={G.cx}
                  cy={G.cy}
                  r={G.scaleOuter}
                  fill="url(#dialScaleSheen)"
                  opacity="0.35"
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
            className="relative w-full h-full overflow-hidden rounded-r-md transition-[box-shadow,border-color] duration-200 border-y border-r backdrop-blur-[3px]"
            style={{
              borderColor: syncEffect
                ? SCOUTER.borderStrong
                : isSceneSynced
                  ? SCOUTER.border
                  : "rgba(0, 61, 184, 0.32)",
              boxShadow: syncEffect
                ? `inset 0 0 0 2px ${SCOUTER.borderStrong}, 0 0 20px ${SCOUTER.glow}`
                : isSceneSynced
                  ? `inset 0 0 0 1.5px ${SCOUTER.border}, 0 0 10px rgba(0, 61, 184, 0.1)`
                  : `inset 0 1px 6px rgba(0, 61, 184, 0.08)`,
              background: syncEffect
                ? `linear-gradient(90deg, ${SCOUTER.fillStrong} 0%, rgba(0, 61, 184, 0.1) 100%)`
                : `linear-gradient(90deg, ${SCOUTER.fill} 0%, rgba(255,255,255,0.2) 100%)`,
            }}
          >
            <AnimatePresence>
              {syncEffect && (
                <>
                  {/* Scan light — hub → tick ring */}
                  <motion.div
                    key="scan-glow"
                    initial={{ left: "-12%", opacity: 0, width: "28%" }}
                    animate={{
                      left: ["-12%", "38%", "88%"],
                      opacity: [0, 0.95, 0.7, 0],
                      width: ["28%", "22%", "14%", "8%"],
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-y-0 pointer-events-none"
                    style={{
                      background: `linear-gradient(90deg, transparent 0%, rgba(0, 61, 184, 0.12) 30%, ${SCOUTER.beam} 50%, rgba(0, 61, 184, 0.12) 70%, transparent 100%)`,
                    }}
                  />
                  <motion.div
                    key="scan-core"
                    initial={{ left: "-4%", opacity: 0, width: "10%" }}
                    animate={{
                      left: ["-4%", "42%", "94%"],
                      opacity: [0, 1, 0.85, 0],
                      width: ["10%", "8%", "5%", "3%"],
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-y-[2px] pointer-events-none rounded-sm"
                    style={{
                      background: `linear-gradient(90deg, transparent, rgba(0, 61, 184, 0.55) 48%, ${SCOUTER.scanLine} 50%, rgba(0, 61, 184, 0.55) 52%, transparent)`,
                      boxShadow: `0 0 14px ${SCOUTER.glow}, 0 0 28px rgba(0, 61, 184, 0.28)`,
                    }}
                  />
                  <motion.div
                    key="scan-line"
                    initial={{ left: "0%", opacity: 0, scaleY: 0.6 }}
                    animate={{
                      left: ["0%", "46%", "98%"],
                      opacity: [0, 1, 0.9, 0],
                      scaleY: [0.6, 1, 1, 0.85],
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-y-1 w-[2px] origin-center pointer-events-none"
                    style={{
                      backgroundColor: SCOUTER.ink,
                      boxShadow: `0 0 10px ${SCOUTER.glow}, 0 0 20px rgba(0, 61, 184, 0.55)`,
                    }}
                  />
                  <motion.div
                    key="scan-flash"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0, 0.55, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.44, ease: "easeOut", times: [0, 0.72, 0.86, 1] }}
                    className="absolute inset-0 rounded-r-lg pointer-events-none"
                    style={{ backgroundColor: SCOUTER.scanFlash }}
                  />
                </>
              )}
            </AnimatePresence>

            {/* Right edge = outer tick ring */}
            <div
              className="absolute inset-y-2 right-0 w-px pointer-events-none"
              style={{ backgroundColor: SCOUTER.border }}
            />
            <div
              className="absolute inset-y-2 left-4 right-2 border-y border-dashed pointer-events-none"
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
            <div className="absolute inset-y-0 left-8 right-2 z-10 flex items-center justify-end gap-2.5 pointer-events-none">
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
                  {CHAMBERS[dialActiveIndex].name}
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
                      LOCK
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>

          {/* Scan continues into scene after channel lock */}
          <AnimatePresence>
            {syncEffect && (
              <motion.div
                key="scan-sweep-scene"
                initial={{ scaleX: 0, opacity: 0.75 }}
                animate={{ scaleX: 1, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-full top-1/2 -translate-y-1/2 h-[46px] w-[min(36vw,220px)] origin-left pointer-events-none rounded-r-md"
                style={{
                  background: `linear-gradient(90deg, rgba(0, 61, 184, 0.32) 0%, rgba(0, 61, 184, 0.12) 45%, transparent 100%)`,
                  boxShadow: `0 0 22px rgba(0, 61, 184, 0.12)`,
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
