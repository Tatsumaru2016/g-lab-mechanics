import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Sparkles, Telescope, ArrowRight, CornerRightDown } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ChamberProps {
  isActive: boolean;
}

export default function Chamber08Future({ isActive }: ChamberProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseOffset({ x, y });
  };

  // Live 3D Infinite perspective grids drawing
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 400;

    let time = 0;
    let animationId: number;

    const render = () => {
      ctx.fillStyle = "#F6F6F4";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      time += 0.005;

      const px = canvas.width / 2 + mouseOffset.x * 60;
      const py = canvas.height / 2 + mouseOffset.y * 60;

      // Draw infinite converging perspective lanes
      ctx.strokeStyle = "rgba(0, 87, 255, 0.08)";
      ctx.lineWidth = 0.8;
      
      const lineCount = 36;
      for (let i = 0; i < lineCount; i++) {
        const theta = (i / lineCount) * Math.PI * 2 + time * 0.1;
        const xOuter = canvas.width / 2 + Math.cos(theta) * 1000;
        const yOuter = canvas.height / 2 + Math.sin(theta) * 1000;
        
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(xOuter, yOuter);
        ctx.stroke();
      }

      // Draw expanding concentric structural rings
      const ringCount = 6;
      for (let r = 0; r < ringCount; r++) {
        const progress = ((r + time % 1) / ringCount);
        const radius = progress * 400;
        
        ctx.strokeStyle = `rgba(0, 190, 255, ${0.15 * (1 - progress)})`;
        ctx.lineWidth = 0.5 + (1 - progress) * 1.5;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw a subtle horizon glow element in the center
      const grad = ctx.createRadialGradient(px, py, 2, px, py, 80);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
      grad.addColorStop(0.3, "rgba(0, 200, 255, 0.08)");
      grad.addColorStop(1, "transparent");
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, 80, 0, Math.PI * 2);
      ctx.fill();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [mouseOffset]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-full flex flex-col justify-between p-8 md:p-20 overflow-hidden bg-transparent"
    >
      {/* Perspective horizon drawing canvas */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <canvas ref={canvasRef} className="w-full h-full object-cover" />
      </div>

      {/* Margins design references */}
      <div className="absolute bottom-6 right-6 font-mono text-[8px] text-neutral-400 text-right pointer-events-none mb-10 md:mb-0 select-none">
        <div>{t("chamber08.coordHorizons")}</div>
        <div>{t("chamber08.projectionMap")}</div>
        <div>{t("chamber08.vectorSeams")}</div>
      </div>

      {/* Top Header */}
      <div className="z-10 flex justify-between items-start font-mono text-[9px] tracking-widest text-[#111111]/60">
        <div>{t("chamber08.headerLeft")}</div>
        <div>{t("chamber08.headerRight")}</div>
      </div>

      {/* Main typography stage */}
      <div className="z-10 flex flex-col items-start gap-12 my-auto max-w-4xl text-left">
        <div className="flex flex-col gap-5 items-start">
          <div className="inline-flex items-center gap-2 px-3 py-1 glass-chip shadow-premium rounded-full text-[10px] text-[#0057FF] font-mono font-bold uppercase">
            <Telescope className="w-3.5 h-3.5" />
            <span>{t("chamber08.badge")}</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={isActive ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1.0, ease: "easeOut" }}
            className="flex flex-col"
          >
            <h1 className="font-display font-light text-6xl md:text-8xl tracking-tighter text-[#111111] leading-none select-none">
              {t("chamber08.titleLine1")} <br />
              {t("chamber08.titleLine2")} <br />
              {t("chamber08.titleLine3")}<span className="text-[#0057FF]">.</span>
            </h1>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-6 border-t border-neutral-200/50">
          {(["spatial", "audio", "agent"] as const).map((key, index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 30 }}
              animate={isActive ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.8 }}
              className="group flex flex-col gap-2.5 p-5 glass-panel rounded-2xl border border-neutral-200/50 hover:bg-white/55 hover:border-[#0057FF]/30 hover:shadow-premium transition-all duration-300 relative overflow-hidden text-left"
            >
              <div className="flex justify-between items-center">
                <span className="font-mono text-[8.5px] text-[#0057FF] bg-[#0057FF]/10 px-2 py-0.5 rounded font-bold uppercase">
                  {t(`chamber08.concepts.${key}.tag`)}
                </span>
                <CornerRightDown className="w-3.5 h-3.5 text-neutral-300 group-hover:text-[#0057FF] transition-colors" />
              </div>
              <h3 className="font-display font-medium text-lg text-neutral-900 group-hover:text-[#0057FF] transition-colors">
                {t(`chamber08.concepts.${key}.name`)}
              </h3>
              <p className="text-[11.5px] text-neutral-500 font-sans font-light leading-relaxed">
                {t(`chamber08.concepts.${key}.desc`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Footer Details */}
      <div className="z-10 flex justify-between items-end font-mono text-[9px] tracking-widest text-[#111111]/40">
        <div>{t("chamber08.footerMatrix")}</div>
        <div>{t("chamber08.footerStation")}</div>
      </div>
    </div>
  );
}
