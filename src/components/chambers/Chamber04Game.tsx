import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Gamepad2, Play, Shuffle, Eye, Layers, Stars, CircleDot, Bomb } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ChamberProps {
  isActive: boolean;
}

interface Tile {
  type: "empty" | "ground" | "water" | "lava" | "crystal";
  color: string;
}

export default function Chamber04Game({ isActive }: ChamberProps) {
  const { t } = useTranslation();
  const [renderMode, setRenderMode] = useState<"textured" | "wireframe" | "isometric">("isometric");
  const [activeConcept, setActiveConcept] = useState<string>("level_schema");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Interactive 8x8 Level Grid Map Builder
  const [gridMap, setGridMap] = useState<Tile[]>(() => {
    return Array.from({ length: 64 }).map((_, i) => {
      const isBoundary = i < 8 || i >= 56 || i % 8 === 0 || i % 8 === 7;
      if (isBoundary) return { type: "ground", color: "#111111" };
      const rand = Math.random();
      if (rand < 0.2) return { type: "water", color: "#0057FF" };
      if (rand < 0.3) return { type: "crystal", color: "#00C8FF" };
      return { type: "empty", color: "transparent" };
    });
  });

  const generateRandomTerrain = () => {
    setGridMap(Array.from({ length: 64 }).map((_, i) => {
      const isEdge = i < 8 || i >= 56 || i % 8 === 0 || i % 8 === 7;
      if (isEdge && Math.random() < 0.8) return { type: "ground", color: "#111111" };
      const r = Math.random();
      if (r < 0.25) return { type: "water", color: "#0057FF" };
      if (r < 0.35) return { type: "lava", color: "#FF5E00" };
      if (r < 0.45) return { type: "crystal", color: "#00C8FF" };
      return { type: "empty", color: "transparent" };
    }));
  };

  // Interact with tile grid paint
  const handleTileClick = (index: number) => {
    const cycle: Record<string, { next: Tile["type"]; color: string }> = {
      empty: { next: "ground", color: "#111111" },
      ground: { next: "water", color: "#0057FF" },
      water: { next: "crystal", color: "#00C8FF" },
      crystal: { next: "empty", color: "transparent" },
    };
    
    setGridMap(prev => {
      const clone = [...prev];
      const current = clone[index].type;
      const step = cycle[current];
      clone[index] = { type: step.next, color: step.color };
      return clone;
    });
  };

  // High-performance canvas particle synthesis inspired by retro particle systems
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 300;

    let particles: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number }> = [];
    let animationFrameId: number;

    const render = () => {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw mathematical viewport crosshairs
      ctx.strokeStyle = "rgba(17,17,17,0.05)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Continuous voxel particle sparks
      if (Math.random() < 0.4) {
        particles.push({
          x: canvas.width / 2 + (Math.random() - 0.5) * 60,
          y: canvas.height - 20,
          vx: (Math.random() - 0.5) * 3,
          vy: -Math.random() * 4 - 2,
          color: Math.random() < 0.6 ? "#0057FF" : "#00C8FF",
          life: 60,
        });
      }

      particles.forEach((p, index) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // subtle game gravity
        p.life--;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 60;
        
        // Draw pixel squares
        ctx.fillRect(p.x, p.y, 4, 4);

        if (p.life <= 0) {
          particles.splice(index, 1);
        }
      });
      ctx.globalAlpha = 1.0;

      // Draw a sleek holographic wireframe map in the background of the renderer
      if (renderMode === "wireframe") {
        ctx.strokeStyle = "rgba(0,190,255,0.2)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let idx = 0; idx < 10; idx++) {
          ctx.arc(canvas.width / 2, canvas.height / 2, idx * 25, 0, Math.PI * 2);
        }
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [renderMode]);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 md:p-20 overflow-hidden bg-transparent">
      {/* Grid mapping background design details */}
      <div className="absolute top-0 right-0 p-6 opacity-30 text-right font-mono text-[8px] tracking-widest text-[#111111] pointer-events-none select-none">
        <div>{t("chamber04.rendererCore")}</div>
        <div>{t("chamber04.shader")}</div>
        <div>{t("chamber04.buffer")}</div>
      </div>

      {/* Top Header */}
      <div className="z-10 flex justify-between items-start font-mono text-[9px] tracking-widest text-[#111111]/60">
        <div>{t("chamber04.headerLeft")}</div>
        <div>{t("chamber04.headerRight")}</div>
      </div>

      {/* Main split dashboard stage */}
      <div className="z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto">
        
        {/* Left Hand: Typography and Game CTAs */}
        <div className="lg:col-span-5 flex flex-col items-start gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 glass-chip shadow-premium rounded-full text-[10px] text-[#0057FF] font-mono font-bold">
            <Gamepad2 className="w-3.5 h-3.5 animate-bounce" />
            <span>{t("chamber04.badge")}</span>
          </div>

          <h2 className="font-display font-light text-5xl tracking-tighter text-[#111111] leading-none">
            {t("chamber04.titleLine1")} <br />
            {t("chamber04.titleLine2")}
          </h2>

          <p className="text-xs text-neutral-500 font-sans font-light leading-relaxed max-w-sm">
            {t("chamber04.body")}
          </p>

          <div className="flex flex-col gap-2.5 w-full mt-2">
            <div className="text-[9px] font-mono tracking-widest text-neutral-400">
              {t("chamber04.conceptsLabel")}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {(["level_schema", "particle_engine"] as const).map((conceptId) => (
                <button
                  key={conceptId}
                  onClick={() => setActiveConcept(conceptId)}
                  className={`px-4 py-3 rounded-lg border text-left font-mono text-[9px] tracking-wider transition-all duration-300 flex-1 min-w-[170px] ${
                    activeConcept === conceptId
                      ? "bg-white text-[#0057FF] border-[#0057FF] shadow-premium"
                      : "bg-white/60 hover:bg-white text-neutral-500 border-neutral-200"
                  }`}
                >
                  <div className="font-semibold">{t(`chamber04.concepts.${conceptId}.label`)}</div>
                  <div className="text-[7.5px] opacity-70 mt-1">{t(`chamber04.concepts.${conceptId}.detail`)}</div>
                </button>
              ))}
            </div>
          </div>

          <a
            href="https://ai.studio/build"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 text-white bg-neutral-900 border border-neutral-800 hover:bg-[#0057FF] hover:border-[#0057FF] px-6 py-3.5 rounded-lg font-mono text-xs tracking-wider flex items-center gap-3 shadow-premium transition-all duration-300 group"
          >
            <span>{t("chamber04.enterNetwork")}</span>
            <Play className="w-4 h-4 fill-white text-white group-hover:translate-x-1.5 transition-transform" />
          </a>
        </div>

        {/* Right Hand: Fully interactive visual sandbox game simulator */}
        <div className="lg:col-span-7 flex flex-col glass-panel p-5 rounded-2xl md:p-6 pointer-events-auto">
          
          <div className="flex justify-between items-center border-b border-neutral-100 pb-3 mb-4">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00C8FF]" />
              <span className="font-mono text-[9px] text-[#111111] tracking-widest font-bold">
                {t("chamber04.renderView")}
              </span>
            </div>

            {/* Simulated hardware controls for concept screen */}
            <div className="flex gap-1 bg-[#F6F6F4] p-1 rounded-lg border border-neutral-200 font-mono text-[8px] tracking-wider text-neutral-500">
              {["isometric", "wireframe", "textured"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setRenderMode(mode as any)}
                  className={`px-2 py-1 rounded transition-all ${
                    renderMode === mode ? "bg-white text-[#111111] shadow" : "hover:text-neutral-800"
                  }`}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Render container based on active concepts tab selection */}
          <div className="h-[260px] flex items-center justify-center bg-[#FDFDFD] rounded-xl border border-neutral-200/50 overflow-hidden relative">
            <AnimatePresence mode="wait">
              {activeConcept === "level_schema" ? (
                <motion.div
                  key="isometric_terrain"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative flex flex-col items-center justify-center p-4 w-full"
                >
                  {/* Grid Renderer styled as 3D block projections depending on choice */}
                  <div className={`grid grid-cols-8 gap-1.5 p-3.5 bg-neutral-100/40 border border-neutral-200/60 rounded-xl ${
                    renderMode === "isometric" ? "transform rotate-x-[45deg] rotate-z-[-45deg] scale-90" : ""
                  } transition-transform duration-500`}>
                    {gridMap.map((tile, i) => (
                      <button
                        key={i}
                        onClick={() => handleTileClick(i)}
                        style={{
                          backgroundColor: tile.type === "empty" ? "#FFFFFF" : tile.color,
                          boxShadow: tile.type !== "empty" && renderMode === "isometric"
                            ? "3px 3px 0px rgba(0,0,0,0.15), inset 1px 1px 0px rgba(255,255,255,0.2)"
                            : "none"
                        }}
                        className={`w-6 h-6 md:w-8 md:h-8 rounded-[3px] border border-neutral-200/50 transition-all duration-200 hover:scale-[1.1] active:translate-y-[2px]`}
                        title="Click to repaint tile block"
                      />
                    ))}
                  </div>

                  {/* Level generation controls */}
                  <div className="absolute bottom-3 left-4 right-4 flex justify-between items-center font-mono text-[8px] tracking-wider text-neutral-400">
                    <button
                      onClick={generateRandomTerrain}
                      className="px-3 py-1.5 bg-white border border-neutral-200 text-[#0057FF] rounded hover:bg-neutral-100 transition-colors flex items-center gap-1 shadow-premium cursor-pointer"
                    >
                      <Shuffle className="w-3 h-3" />
                      <span>{t("chamber04.reseed")}</span>
                    </button>
                    <span className="hidden md:inline">{t("chamber04.paintMode")}</span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="physics_engine"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full flex flex-col items-center justify-center"
                >
                  {/* Performance Voxel spark loop */}
                  <canvas ref={canvasRef} className="w-full h-full block" />
                  <div className="absolute top-4 left-4 font-mono text-[8.5px] text-neutral-400">
                    <span>{t("chamber04.gravity")}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom Footer Details */}
      <div className="z-10 flex justify-between items-end font-mono text-[9px] tracking-widest text-[#111111]/40">
        <div>{t("chamber04.footerCore")}</div>
        <div>{t("chamber04.footerStation")}</div>
      </div>
    </div>
  );
}
