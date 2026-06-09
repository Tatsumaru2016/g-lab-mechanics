import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DIAL_SCENE_CLEARANCE } from "./JogDial";
import { SHUTTER } from "../shutterTiming";

interface ChamberLayoutProps {
  currentChamber: number;
  children: (displayedChamber: number) => React.ReactNode;
  navigation?: React.ReactNode;
  /** Incremented each time the jog dial locks on a detent */
  dialLockPulse?: number;
}

type ShutterState = "idle" | "closing" | "closed" | "opening" | "fading";

const closeEase = [0.62, 0, 0.85, 1] as const;
const openTimes = [0, 0.9, 1] as const;

function playDoorHaltClunk() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const now = ctx.currentTime;

    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = "sine";
    thud.frequency.setValueAtTime(92, now);
    thud.frequency.exponentialRampToValueAtTime(42, now + 0.09);
    thudGain.gain.setValueAtTime(0.22, now);
    thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    thud.connect(thudGain);
    thudGain.connect(ctx.destination);
    thud.start(now);
    thud.stop(now + 0.13);

    const clank = ctx.createOscillator();
    const clankGain = ctx.createGain();
    const clankF = ctx.createBiquadFilter();
    clank.type = "square";
    clank.frequency.setValueAtTime(380, now + 0.018);
    clank.frequency.exponentialRampToValueAtTime(120, now + 0.05);
    clankF.type = "bandpass";
    clankF.frequency.value = 280;
    clankF.Q.value = 4;
    clankGain.gain.setValueAtTime(0.06, now + 0.018);
    clankGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    clank.connect(clankF);
    clankF.connect(clankGain);
    clankGain.connect(ctx.destination);
    clank.start(now + 0.018);
    clank.stop(now + 0.075);
  } catch {
    // Audio fallback
  }
}

export default function ChamberLayout({
  currentChamber,
  children,
  navigation,
  dialLockPulse = 0,
}: ChamberLayoutProps) {
  const [displayedChamber, setDisplayedChamber] = useState(currentChamber);
  const [shutterState, setShutterState] = useState<ShutterState>("idle");
  const previousChamberRef = useRef(currentChamber);

  const closeDoneRef = useRef(false);
  const lockReadyRef = useRef(false);
  const openPanelsDoneRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
  }, []);

  useEffect(() => {
    if (currentChamber === previousChamberRef.current) return;

    clearTimers();
    closeDoneRef.current = false;
    lockReadyRef.current = false;
    openPanelsDoneRef.current = 0;
    setShutterState("closing");

    schedule(() => {
      setDisplayedChamber(currentChamber);
      closeDoneRef.current = true;
      if (lockReadyRef.current) {
        openPanelsDoneRef.current = 0;
        setShutterState("opening");
      } else {
        setShutterState("closed");
      }
    }, SHUTTER.closeMs);

    schedule(() => {
      if (!lockReadyRef.current) {
        lockReadyRef.current = true;
        openPanelsDoneRef.current = 0;
        setShutterState((s) => (s === "closed" || s === "closing" ? "opening" : s));
      }
    }, SHUTTER.closeMs + SHUTTER.lockFallbackMs);

    return clearTimers;
  }, [currentChamber, clearTimers, schedule]);

  useEffect(() => {
    if (dialLockPulse === 0) return;
    lockReadyRef.current = true;
    if (closeDoneRef.current) {
      setShutterState((s) => {
        if (s === "closed") {
          openPanelsDoneRef.current = 0;
          return "opening";
        }
        return s;
      });
    }
  }, [dialLockPulse]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const handleDoorOpenComplete = () => {
    openPanelsDoneRef.current += 1;
    if (openPanelsDoneRef.current < 2) return;
    openPanelsDoneRef.current = 0;
    playDoorHaltClunk();
    setShutterState("fading");
    schedule(() => {
      setShutterState("idle");
      previousChamberRef.current = currentChamber;
    }, SHUTTER.fadeMs);
  };

  const isTransitioning = shutterState !== "idle";
  const isClosing = shutterState === "closing";
  const isOpening = shutterState === "opening" || shutterState === "fading";

  const leftDoorX = isClosing ? "0%" : isOpening ? ["0%", "-104%", "-100%"] : "-100%";
  const rightDoorX = isClosing ? "0%" : isOpening ? ["0%", "104%", "100%"] : "100%";

  const doorTransition = isClosing
    ? { duration: SHUTTER.closeMs / 1000, ease: closeEase }
    : isOpening
      ? { duration: SHUTTER.openMs / 1000, times: openTimes, ease: [0.14, 0.82, 0.24, 1] as const }
      : { duration: 0.01 };

  return (
    <div className="relative w-full h-full bg-[#F6F6F4] overflow-hidden">
      <div className={`w-full h-full relative z-10 select-none ${DIAL_SCENE_CLEARANCE}`}>
        {children(displayedChamber)}
      </div>

      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            key="shutter-stage"
            initial={{ opacity: 1 }}
            animate={{ opacity: shutterState === "fading" ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: SHUTTER.fadeMs / 1000, ease: "easeOut" }}
            className="absolute inset-0 z-[15] pointer-events-auto flex overflow-hidden"
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: leftDoorX }}
              transition={doorTransition}
              onAnimationComplete={() => {
                if (shutterState === "opening") handleDoorOpenComplete();
              }}
              className="shutter-door-panel shutter-door-left w-1/2 h-full flex flex-col justify-between items-end p-8 select-none"
            >
              <div className="text-[9px] font-mono tracking-widest text-neutral-500/50 text-right mt-14 hidden md:block">
                <div>G.LAB MECHANICS // LEFT_SHUTTER</div>
                <div>MASS: 420kg // HYDRAULIC_LOCK</div>
              </div>
              <div className="my-auto mr-[-28px] md:mr-[-40px] z-20 flex items-center shutter-door-bolt px-3 md:px-4 py-2.5 md:py-3 rounded-lg">
                <span className="font-mono text-[10px] text-[#0057FF] font-bold tracking-wider select-none pr-3 border-r border-neutral-400/40">
                  GATE_01L
                </span>
              </div>
              <div className="text-[8px] font-mono text-neutral-500/45 text-right w-full mb-14 hidden md:block">
                <div>BEARING TORQUE: MAX</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: rightDoorX }}
              transition={doorTransition}
              onAnimationComplete={() => {
                if (shutterState === "opening") handleDoorOpenComplete();
              }}
              className="shutter-door-panel shutter-door-right w-1/2 h-full flex flex-col justify-between items-start p-8 select-none"
            >
              <div className="text-[9px] font-mono tracking-widest text-neutral-500/50 text-left mt-14 hidden md:block">
                <div>G.LAB MECHANICS // RIGHT_SHUTTER</div>
                <div>MASS: 420kg // HYDRAULIC_LOCK</div>
              </div>
              <div className="my-auto ml-[-28px] md:ml-[-40px] z-20 flex items-center shutter-door-bolt px-3 md:px-4 py-2.5 md:py-3 rounded-lg">
                <span className="font-mono text-[10px] text-[#00C8FF] font-bold tracking-wider select-none pl-3 border-l border-neutral-400/40">
                  GATE_02R
                </span>
              </div>
              <div className="text-[8px] font-mono text-neutral-500/45 text-left w-full mb-14 hidden md:block">
                <div>BEARING TORQUE: MAX</div>
              </div>
            </motion.div>

            {shutterState === "closed" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.35, 0] }}
                transition={{ duration: 0.28 }}
                className="absolute inset-0 bg-neutral-600/10 pointer-events-none z-30"
              />
            )}

            {shutterState === "opening" && (
              <motion.div
                initial={{ opacity: 0, scaleX: 0.6 }}
                animate={{ opacity: [0, 0.5, 0], scaleX: [0.6, 1.05, 1.2] }}
                transition={{ duration: SHUTTER.openMs / 1000, ease: "easeOut" }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-neutral-400/30 pointer-events-none z-30"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {navigation}
    </div>
  );
}
