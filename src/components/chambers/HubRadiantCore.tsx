import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";

interface HubRadiantCoreProps {
  isActive: boolean;
  mouseX: number;
  mouseY: number;
}

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  hue: number;
};

const LABEL_BASE =
  "absolute top-1/2 font-mono text-[7px] tracking-widest whitespace-nowrap text-neutral-600/80 pointer-events-none";

const SPOKES = [
  {
    angle: 0,
    tilt: 14,
    labelKey: "chamber01.hubPicture" as const,
    labelClass: `${LABEL_BASE} left-6`,
    color: "#0057FF",
    tone: "blue" as const,
    z: 36,
  },
  { angle: 60, tilt: -10, labelKey: "chamber01.hubDesign" as const, color: "#00C8FF", tone: "cyan" as const, z: 18 },
  { angle: 120, tilt: 20, labelKey: "chamber01.hubHistory" as const, color: "#7C3AED", tone: "violet" as const, z: 42 },
  {
    angle: 180,
    tilt: -16,
    labelKey: "chamber01.hubLab" as const,
    color: "#F59E0B",
    tone: "amber" as const,
    z: 8,
  },
  { angle: 240, tilt: 12, labelKey: "chamber01.hubTools" as const, color: "#10B981", tone: "emerald" as const, z: 28 },
  { angle: 300, tilt: -8, labelKey: "chamber01.hubGames" as const, color: "#F43F5E", tone: "rose" as const, z: 14 },
] as const;

const SPHERE_RADIUS_REM = 0.45;
const LABEL_GAP_REM = 0.55;

function spokeLabelClass(_spoke: (typeof SPOKES)[number]): string {
  return `${LABEL_BASE} left-1/2`;
}

function spokeLabelStyle(spoke: (typeof SPOKES)[number]): React.CSSProperties {
  const rot = `rotateZ(${-spoke.angle}deg)`;
  const sphereEdge = SPHERE_RADIUS_REM + LABEL_GAP_REM;
  const offset =
    "labelClass" in spoke && spoke.labelClass ? sphereEdge + 0.15 : sphereEdge;

  // Offset along the spoke (away from hub). At 180° that reads as screen-left.
  return {
    transform: `translate(${offset}rem, -50%) ${rot}`,
  };
}

function spawnParticle(cx: number, cy: number): Particle {
  const a = Math.random() * Math.PI * 2;
  const speed = 0.35 + Math.random() * 1.1;
  return {
    x: cx,
    y: cy,
    vx: Math.cos(a) * speed,
    vy: Math.sin(a) * speed,
    life: 0,
    maxLife: 55 + Math.random() * 70,
    hue: Math.random() > 0.55 ? 215 : 195,
  };
}

function SpokeScanBeams({
  scanOut,
  scanIn,
  delayMs,
}: {
  scanOut: boolean;
  scanIn: boolean;
  delayMs: number;
}) {
  if (!scanOut && !scanIn) return null;
  return (
    <>
      {scanOut && (
        <div
          className="hub-scan-beam hub-scan-beam--out hub-scan-beam--active"
          style={{ animationDelay: `${delayMs}ms` }}
        />
      )}
      {scanIn && (
        <div
          className="hub-scan-beam hub-scan-beam--in hub-scan-beam--active"
          style={{ animationDelay: `${delayMs}ms` }}
        />
      )}
    </>
  );
}

export default function HubRadiantCore({ isActive, mouseX, mouseY }: HubRadiantCoreProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const [hoverCore, setHoverCore] = useState(false);
  const [hoveredSpokeAngle, setHoveredSpokeAngle] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles: Particle[] = [];
    let pulse = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      pulse += isActive ? 0.018 : 0.004;
      const wave = (Math.sin(pulse) + 1) * 0.5;

      if (isActive) {
        for (let r = 0; r < 3; r++) {
          const phase = (pulse * 0.55 + r * 0.85) % 1;
          const radius = 28 + phase * Math.min(w, h) * 0.38;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 87, 255, ${(1 - phase) * 0.22})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        if (particles.length < 90 && Math.random() > 0.35) {
          particles.push(spawnParticle(cx, cy));
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;
        const t = p.life / p.maxLife;
        const alpha = (1 - t) * 0.55;

        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * 3, p.y - p.vy * 3);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = `hsla(${p.hue}, 88%, 52%, ${alpha})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 62%, ${alpha * 0.9})`;
        ctx.fill();

        if (p.life >= p.maxLife) particles.splice(i, 1);
      }

      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.22);
      glow.addColorStop(0, `rgba(0, 87, 255, ${isActive ? 0.14 + wave * 0.08 : 0.06})`);
      glow.addColorStop(0.45, "rgba(0, 200, 255, 0.04)");
      glow.addColorStop(1, "rgba(0, 87, 255, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
    };
  }, [isActive]);

  const rotX = mouseY * -26;
  const rotY = mouseX * 26;

  const sphereHover = { scale: 1.55, z: 36 } as const;
  const coreHover = { scale: 1.22, z: 64 } as const;
  const hoverSpring = { type: "spring" as const, stiffness: 380, damping: 20 };

  const coreScanning = hoverCore || hoveredSpokeAngle !== null;

  return (
    <div className="relative w-full h-full min-h-[280px] md:min-h-[360px] flex items-center justify-center select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden />

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0.4, scale: 0.95 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-[min(92vw,380px)] h-[min(92vw,380px)] max-w-[380px] max-h-[380px] pointer-events-auto"
        style={{ perspective: 1100 }}
      >
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            transformStyle: "preserve-3d",
            rotateX: rotX,
            rotateY: rotY,
          }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        >
          <motion.div
            animate={{ rotateZ: 360 }}
            transition={{ repeat: Infinity, duration: 48, ease: "linear" }}
            className="absolute inset-[6%] rounded-full border border-dashed border-neutral-300/55"
            style={{ transform: "rotateX(72deg)", transformStyle: "preserve-3d" }}
          />

          <motion.div
            animate={{ rotateZ: -360 }}
            transition={{ repeat: Infinity, duration: 32, ease: "linear" }}
            className="absolute inset-[14%] rounded-full border border-neutral-300/35"
            style={{ transform: "rotateX(58deg) rotateY(12deg)", transformStyle: "preserve-3d" }}
          />

          {SPOKES.map((spoke, i) => {
            const armLen = 38 + (i % 3) * 4;
            const isHoveredNode = hoveredSpokeAngle === spoke.angle;
            const scanOut = hoverCore || isHoveredNode;
            const scanIn = isHoveredNode;

            return (
              <div
                key={spoke.angle}
                className="absolute left-1/2 top-1/2 hub-spoke-arm"
                style={{
                  width: `${armLen}%`,
                  height: 2,
                  marginTop: -1,
                  transformOrigin: "0% 50%",
                  transform: `rotateZ(${spoke.angle}deg) rotateY(${spoke.tilt}deg) translateZ(${spoke.z}px)`,
                  transformStyle: "preserve-3d",
                }}
              >
                <div
                  className="h-full w-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${spoke.color} 0%, ${spoke.color}88 35%, transparent 100%)`,
                    boxShadow: `0 0 10px ${spoke.color}33`,
                  }}
                />
                <SpokeScanBeams scanOut={scanOut} scanIn={scanIn} delayMs={hoverCore ? i * 90 : 0} />

                <motion.div
                  whileHover={sphereHover}
                  transition={hoverSpring}
                  onMouseEnter={() => {
                    setHoveredSpokeAngle(spoke.angle);
                    setHoverCore(false);
                  }}
                  onMouseLeave={() => setHoveredSpokeAngle(null)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 pointer-events-auto cursor-pointer z-10"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <div
                    className="relative flex items-center justify-center p-2 -m-2"
                    aria-label={t(spoke.labelKey)}
                  >
                    <div
                      className={`hub-node-sphere hub-node-sphere--${spoke.tone} ${
                        hoverCore || isHoveredNode ? "hub-node-sphere--scan-pulse" : ""
                      }`}
                    />
                    <span className={spokeLabelClass(spoke)} style={spokeLabelStyle(spoke)}>
                      {t(spoke.labelKey)}
                    </span>
                  </div>
                </motion.div>
              </div>
            );
          })}

          <motion.div
            whileHover={coreHover}
            transition={hoverSpring}
            onMouseEnter={() => {
              setHoverCore(true);
              setHoveredSpokeAngle(null);
            }}
            onMouseLeave={() => setHoverCore(false)}
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hub-radiant-core pointer-events-auto cursor-pointer z-20 ${
              coreScanning ? "hub-radiant-core--scanning" : ""
            }`}
            style={{ transformStyle: "preserve-3d", translateZ: 52 }}
          >
            <div className="hub-radiant-core__ring hub-radiant-core__ring--outer" />
            <div className="hub-radiant-core__ring hub-radiant-core__ring--inner" />
            <div className="hub-radiant-core__sphere">
              <span className="font-display text-[11px] font-semibold tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,35,120,0.45)]">
                G<span className="text-white/90">.</span>Hub
              </span>
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
              className="absolute inset-[-18%] rounded-full border border-[#0057FF]/20 border-t-[#0057FF]/55"
            />
          </motion.div>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 font-mono text-[7px] tracking-[0.2em] text-neutral-400/80 uppercase pointer-events-none">
        {t("chamber01.axis")}
      </div>
    </div>
  );
}
