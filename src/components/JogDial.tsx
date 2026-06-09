import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CHAMBERS } from "../types";
import { Volume2, VolumeX } from "lucide-react";

interface JogDialProps {
  currentChamber: number;
  onChamberChange: (index: number) => void;
  /** Fires when dial settles on a detent (sync shutter open with jog lock) */
  onSceneLocked?: () => void;
}

const DIAL_SIZE = 380;
const STEP_DEGREES = 360 / CHAMBERS.length;

const TICK = {
  cx: 180,
  cy: 180,
  outer: 176,
  ring: 173.5,
  inner: { fine: 170, mid: 164, scene: 146 },
  width: { fine: 0.48, mid: 0.72, scene: 1.75, sceneEmphasis: 2.2 },
  opacity: { fine: 0.38, mid: 0.5, scene: 0.72, sceneEmphasis: 0.95 },
} as const;

/** Hub slightly past left edge → ~half the dial visible */
const DIAL_CENTER_X = -52;
const DIAL_MOUNT_LEFT = DIAL_CENTER_X - DIAL_SIZE / 2;
const DIAL_MOUNT_TOP = `calc(50% - ${DIAL_SIZE / 2}px)`;
/** Match dial shell scale; scouter frame = tick band at 3 o'clock */
const DIAL_RING_SCALE = 0.9;
const RING_INNER_PX = TICK.inner.scene * DIAL_RING_SCALE;
const RING_OUTER_PX = TICK.outer * DIAL_RING_SCALE;
/** Fixed scouter channel: dial hub (left) → past outer tick ring */
const SCOUTER_SLOT_EXTEND_PX = 24;
/** Readout sits on the tick ring, inset from the channel's right extension */
const SLOT_NUMBER_LEFT = RING_OUTER_PX - 6;
const SCOUTER_SLOT = {
  left: DIAL_CENTER_X,
  width: RING_OUTER_PX + SCOUTER_SLOT_EXTEND_PX,
  height: 52,
} as const;
const SLOT_LEFT = SCOUTER_SLOT.left;
const SLOT_WIDTH = SCOUTER_SLOT.width;
const SLOT_HEIGHT = SCOUTER_SLOT.height;
const SLOT_TOP = `calc(50% - ${SLOT_HEIGHT / 2}px)`;
/** Scene content inset — hub + channel to tick ring */
export const DIAL_SCENE_CLEARANCE = "pl-[148px] md:pl-[160px]";

const FINE_TICK_STEP = 2;

/** Cool metallic ink on silver track */
const INK = {
  strong: "#3A424E",
  mid: "#5A6370",
  light: "#7A8492",
  faint: "#A8B0BC",
} as const;

/** Scouter / slot HUD — blue transparent readout channel */
const SCOUTER = {
  border: "rgba(0, 87, 255, 0.45)",
  borderStrong: "rgba(0, 87, 255, 0.72)",
  fill: "rgba(0, 87, 255, 0.1)",
  fillStrong: "rgba(0, 87, 255, 0.22)",
  beam: "rgba(0, 200, 255, 0.55)",
  glow: "rgba(0, 87, 255, 0.35)",
} as const;

function classifyTick(angle: number): "fine" | "mid" | "scene" {
  const norm = ((angle % 360) + 360) % 360;
  const rem = norm % STEP_DEGREES;
  const half = STEP_DEGREES / 2;
  const tol = FINE_TICK_STEP / 2;

  if (rem < tol || rem > STEP_DEGREES - tol) return "scene";
  if (Math.abs(rem - half) < tol) return "mid";
  return "fine";
}

function tickStyle(kind: "fine" | "mid" | "scene", emphasized: boolean) {
  if (kind === "fine") {
    return {
      inner: TICK.inner.fine,
      stroke: INK.faint,
      width: TICK.width.fine,
      opacity: TICK.opacity.fine,
    };
  }
  if (kind === "mid") {
    return {
      inner: TICK.inner.mid,
      stroke: INK.light,
      width: TICK.width.mid,
      opacity: TICK.opacity.mid,
    };
  }
  return {
    inner: TICK.inner.scene,
    stroke: emphasized ? "#4A5260" : "#5C6574",
    width: emphasized ? TICK.width.sceneEmphasis : TICK.width.scene,
    opacity: emphasized ? TICK.opacity.sceneEmphasis : TICK.opacity.scene,
  };
}

function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: TICK.cx + radius * Math.cos(rad),
    y: TICK.cy + radius * Math.sin(rad),
  };
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

export default function JogDial({ currentChamber, onChamberChange, onSceneLocked }: JogDialProps) {
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
    const rot = detentAngle(currentChamber);
    setRotation(rot);
    rotationRef.current = rot;
    lastLoggedChamber.current = currentChamber;
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
  }, [isDragging, onChamberChange, muted]);

  const dialRevealed = isDragging || detentKick;
  const previewIndex = Math.max(
    0,
    Math.min(CHAMBERS.length - 1, Math.round(-rotation / STEP_DEGREES))
  );
  const isLocked = !isDragging && Math.abs(rotation - detentAngle(currentChamber)) < 0.5;
  const slotIndex = isDragging ? previewIndex : currentChamber;
  const frameNumber = slotIndex + 1;
  const isSceneSynced = isLocked && previewIndex === currentChamber;

  const dialShellClass = `rounded-full dial-bezel-outer shadow-dial pointer-events-auto cursor-grab active:cursor-grabbing scale-[0.9] md:scale-95 transition-transform duration-100 origin-center ${
    detentKick ? "scale-[0.87] md:scale-[0.925] rotate-[1.5deg]" : ""
  }`;

  const rotateTransition = isDragging
    ? { type: "just" as const }
    : isSettling || detentKick
      ? {
          type: "spring" as const,
          stiffness: 640,
          damping: 14,
          mass: 0.78,
          restDelta: 0.04,
          restSpeed: 0.04,
        }
      : { type: "spring" as const, stiffness: 360, damping: 32, mass: 0.95 };

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
          {/* Perforated mount plate — recessed behind bezel */}
          <div className="absolute inset-[3px] rounded-full dial-mount-plate pointer-events-none opacity-90" />

          {/* Static outer bezel lip */}
          <div className="absolute inset-[5px] rounded-full dial-bezel-highlight pointer-events-none" />

          {/* Recessed numbered track well (fixed, knob casts shadow here) */}
          <div className="absolute inset-[14px] rounded-full dial-track-recess pointer-events-none" />

          {/* Specular gloss over metal surfaces */}
          <div className="absolute inset-[5px] rounded-full dial-metallic-gloss pointer-events-none z-[5]" />

          {/* Fixed 12 o'clock index notch — reference dial marker */}
          <div className="absolute top-[9px] left-1/2 -translate-x-1/2 w-[16px] h-[5px] rounded-[2px] dial-index-notch z-30 pointer-events-none" />

          <motion.div
            style={{ width: 360, height: 360, transformOrigin: "center center" }}
            animate={{ rotate: rotation }}
            transition={rotateTransition}
            onAnimationComplete={handleRotateSettled}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
          >
            <svg className="w-full h-full absolute overflow-visible" viewBox="0 0 360 360">
              <defs>
                <radialGradient id="dialRingSheen" cx="32%" cy="26%" r="72%">
                  <stop offset="0%" stopColor="#F4F6FA" />
                  <stop offset="48%" stopColor="#C8D0DC" />
                  <stop offset="100%" stopColor="#98A2B0" />
                </radialGradient>
                <linearGradient id="metalSegmentA" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E4E9F0" />
                  <stop offset="50%" stopColor="#B8C0CC" />
                  <stop offset="100%" stopColor="#D0D6E0" />
                </linearGradient>
                <linearGradient id="metalSegmentB" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#A0A8B6" />
                  <stop offset="50%" stopColor="#8892A0" />
                  <stop offset="100%" stopColor="#B0B8C4" />
                </linearGradient>
              </defs>

              {/* Brushed silver tick band */}
              <circle
                cx={TICK.cx}
                cy={TICK.cy}
                r={(TICK.outer + TICK.inner.scene) / 2}
                fill="none"
                stroke="url(#dialRingSheen)"
                strokeWidth={TICK.outer - TICK.inner.scene + 4}
                opacity="0.98"
              />
              <circle
                cx={TICK.cx}
                cy={TICK.cy}
                r={TICK.outer}
                fill="none"
                stroke="#8E98A8"
                strokeWidth="0.9"
                opacity="0.85"
              />
              <circle
                cx={TICK.cx}
                cy={TICK.cy}
                r={TICK.inner.scene}
                fill="none"
                stroke="#B8C0CC"
                strokeWidth="0.65"
                opacity="0.9"
              />

              {/* Unified tick scale: fine → mid → scene */}
              {Array.from({ length: 360 / FINE_TICK_STEP }, (_, i) => {
                const angle = i * FINE_TICK_STEP;
                const kind = classifyTick(angle);
                const sceneIdx = kind === "scene" ? detentIndex(angle) : -1;
                const emphasized = kind === "scene" && sceneIdx === slotIndex;
                const style = tickStyle(kind, emphasized);
                const p1 = polar(angle, style.inner);
                const p2 = polar(angle, TICK.outer);

                return (
                  <line
                    key={`tick-${angle}`}
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={style.stroke}
                    strokeWidth={style.width}
                    strokeLinecap="round"
                    opacity={style.opacity}
                  />
                );
              })}

              {/* Inner dial — segmented plate + knurled gear ring (combo-lock style) */}
              {Array.from({ length: 12 }, (_, i) => {
                const a0 = ((i * 30 - 90) * Math.PI) / 180;
                const a1 = (((i + 1) * 30 - 90) * Math.PI) / 180;
                const r0 = 52;
                const r1 = 98;
                const x0 = TICK.cx + r0 * Math.cos(a0);
                const y0 = TICK.cy + r0 * Math.sin(a0);
                const x1 = TICK.cx + r1 * Math.cos(a0);
                const y1 = TICK.cy + r1 * Math.sin(a0);
                const x2 = TICK.cx + r1 * Math.cos(a1);
                const y2 = TICK.cy + r1 * Math.sin(a1);
                const x3 = TICK.cx + r0 * Math.cos(a1);
                const y3 = TICK.cy + r0 * Math.sin(a1);
                return (
                  <path
                    key={`dial-seg-${i}`}
                    d={`M ${x0} ${y0} L ${x1} ${y1} A ${r1} ${r1} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${r0} ${r0} 0 0 0 ${x0} ${y0} Z`}
                    fill={i % 2 === 0 ? "url(#metalSegmentA)" : "url(#metalSegmentB)"}
                    stroke="#8A929E"
                    strokeWidth="0.4"
                  />
                );
              })}
              <circle
                cx={TICK.cx}
                cy={TICK.cy}
                r={99}
                fill="none"
                stroke="#78828E"
                strokeWidth="0.7"
                opacity="0.9"
              />
              {Array.from({ length: 72 }, (_, i) => {
                const angle = (i * 5 * Math.PI) / 180;
                const rIn = 100;
                const rOut = i % 2 === 0 ? 112 : 108;
                const p1 = {
                  x: TICK.cx + rIn * Math.cos(angle),
                  y: TICK.cy + rIn * Math.sin(angle),
                };
                const p2 = {
                  x: TICK.cx + rOut * Math.cos(angle),
                  y: TICK.cy + rOut * Math.sin(angle),
                };

                return (
                  <line
                    key={`knurl-${i}`}
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={i % 2 === 0 ? "#707A88" : "#C4CAD4"}
                    strokeWidth="1.15"
                    strokeLinecap="round"
                  />
                );
              })}
              <circle
                cx={TICK.cx}
                cy={TICK.cy}
                r={113}
                fill="none"
                stroke="#6E7886"
                strokeWidth="0.55"
                opacity="0.85"
              />
            </svg>

            {/* Knob shadow on recessed track */}
            <div className="absolute w-[108px] h-[108px] rounded-full pointer-events-none z-[1] bg-[radial-gradient(circle,rgba(0,0,0,0.16)_0%,transparent_68%)] translate-y-[3px]" />

            {/* Raised center cap with grip groove */}
            <div className="absolute dial-brushed-knob flex items-center justify-center pointer-events-none">
              <div className="absolute w-[76%] h-[5px] rounded-full bg-gradient-to-r from-transparent via-[#8A929E]/55 to-transparent top-[46%]" />
              <div className="absolute w-[18px] h-[18px] rounded-full border border-white/70 bg-gradient-to-br from-[#F0F3F8] to-[#98A2B0] shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(50,58,70,0.2)]" />
            </div>
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
            className={`relative w-full h-full overflow-hidden rounded-r-lg transition-[box-shadow,border-color] duration-150 border-y border-r backdrop-blur-[2px] ${
              syncEffect
                ? "shadow-[inset_0_0_0_2px_rgba(0,87,255,0.55),0_0_20px_rgba(0,87,255,0.22)] border-[#0057FF]/75"
                : isSceneSynced
                  ? "shadow-[inset_0_0_0_1.5px_rgba(0,87,255,0.4),0_0_10px_rgba(0,87,255,0.1)] border-[#0057FF]/55"
                  : "shadow-[inset_0_1px_6px_rgba(0,87,255,0.08)] border-[#0057FF]/35"
            }`}
            style={{
              background: syncEffect
                ? `linear-gradient(90deg, ${SCOUTER.fillStrong} 0%, rgba(0,200,255,0.12) 100%)`
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
                      background:
                        "linear-gradient(90deg, transparent 0%, rgba(0,87,255,0.12) 30%, rgba(0,200,255,0.55) 50%, rgba(0,87,255,0.12) 70%, transparent 100%)",
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
                      background:
                        "linear-gradient(90deg, transparent, rgba(180,240,255,0.95) 48%, rgba(0,200,255,0.9) 50%, rgba(180,240,255,0.95) 52%, transparent)",
                      boxShadow: "0 0 14px rgba(0,200,255,0.65), 0 0 28px rgba(0,87,255,0.35)",
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
                    className="absolute inset-y-1 w-[2px] origin-center bg-[#00C8FF] pointer-events-none"
                    style={{
                      boxShadow: "0 0 10px #00C8FF, 0 0 20px rgba(0,87,255,0.8)",
                    }}
                  />
                  <motion.div
                    key="scan-flash"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0, 0.55, 0] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.44, ease: "easeOut", times: [0, 0.72, 0.86, 1] }}
                    className="absolute inset-0 bg-[#00C8FF]/20 rounded-r-lg pointer-events-none"
                  />
                </>
              )}
            </AnimatePresence>

            {/* Right edge = outer tick ring */}
            <div className="absolute inset-y-2 right-0 w-px bg-[#0057FF]/40 pointer-events-none" />
            <div
              className={`absolute inset-y-2 left-4 right-2 border-y border-dashed pointer-events-none ${
                isSceneSynced ? "border-[#0057FF]/30" : "border-[#0057FF]/18"
              }`}
            />

            {/* Hub pin (left) */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-[78%] bg-[#0057FF]/50 rounded-full pointer-events-none" />

            {/* Number on tick ring — slightly left of channel end */}
            <div
              className="absolute top-1/2 -translate-y-1/2 z-10"
              style={{ left: SLOT_NUMBER_LEFT }}
            >
              <motion.span
                key={`frame-${frameNumber}`}
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
                className={`relative font-mono tabular-nums leading-none ${
                  syncEffect || isSceneSynced
                    ? "text-[13px] font-extrabold text-[#0057FF] drop-shadow-[0_0_8px_rgba(0,87,255,0.4)]"
                    : "text-[13px] font-bold text-[#0057FF]/50"
                }`}
              >
                {frameNumber}
                <AnimatePresence>
                  {syncEffect && (
                    <motion.span
                      key="sync-badge"
                      initial={{ opacity: 0, y: 3, scale: 0.8 }}
                      animate={{ opacity: [0, 1, 0], y: [3, -2, -5], scale: [0.8, 1, 0.9] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute -top-2.5 right-0 text-[5px] font-bold tracking-widest text-[#00C8FF] whitespace-nowrap"
                    >
                      LOCK
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.span>
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
                  background:
                    "linear-gradient(90deg, rgba(0,87,255,0.32) 0%, rgba(0,200,255,0.14) 45%, transparent 100%)",
                  boxShadow: "0 0 22px rgba(0,87,255,0.12)",
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
