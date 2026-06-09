import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, ArrowRight, CornerDownRight } from "lucide-react";

interface ChamberProps {
  isActive: boolean;
  onNext: () => void;
}

export default function Chamber01Entry({ isActive, onNext }: ChamberProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Normalize coordinates (-0.5 to 0.5)
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative w-full h-full flex flex-col justify-between p-8 md:p-20 overflow-hidden bg-[#F6F6F4]"
    >
      {/* Background Soft Shadow Architectural Grid */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute inset-[15%] border border-neutral-300/40 rounded-[2rem] bg-white/30 shadow-premium" />
        <div className="absolute inset-[25%] border border-neutral-300/30 rounded-[1.5rem] bg-white/20" />
        <div className="absolute top-[48%] left-0 w-full h-[0.5px] bg-[#0057FF]/10" />
      </div>

      {/* Top Header Information in Mono layout */}
      <div className="z-10 flex justify-between items-start font-mono text-[9px] tracking-widest text-[#111111]/60">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0057FF] animate-ping" />
          <span>G.LAB // CORE_ENV_INIT [OK]</span>
        </div>
        <div className="text-right hidden md:block">
          <div>LOC: 0x7FFA // LATENCY: 2.1ms</div>
          <div>ESTABLISHED 2026.06.09</div>
        </div>
      </div>

      {/* Main Kinetic Content Stage */}
      <div className="z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-auto">
        <div className="lg:col-span-6 flex flex-col items-start gap-6">
          <div className="flex items-center gap-2 px-3 py-1 bg-white border border-neutral-200 shadow-premium rounded-full text-[10px] font-mono text-[#0057FF] font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>THE LIVING DIGITAL INVENTION STUDIO</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isActive ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col"
          >
            <h1 className="font-display font-light text-7xl md:text-8xl tracking-tighter text-[#111111] leading-none select-none">
              G<span className="text-[#0057FF]">.</span>Lab
            </h1>
            <p className="font-display font-light text-2xl md:text-3xl text-neutral-500 tracking-tight mt-3">
              Where Ideas Become Reality.
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={isActive ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-sm text-neutral-500 max-w-sm font-sans font-light leading-relaxed tracking-wide"
          >
            G.Lab is a living digital laboratory where abstract concepts crystallize. We design, prototype, and build tactile products, communication ecosystems, and pixelated worlds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={isActive ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex items-center gap-4 mt-2"
          >
            <button
              onClick={onNext}
              className="px-6 py-3.5 bg-[#111111] text-white hover:bg-[#0057FF] transition-all duration-300 rounded-lg font-mono text-xs tracking-wider flex items-center gap-3.5 group shadow-premium"
            >
              <span>OPERATE THE JOG DIAL</span>
              <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1.5 transition-transform" />
            </button>
            <div className="hidden md:flex items-center gap-2 font-mono text-[9px] text-[#111111]/40">
              <CornerDownRight className="w-3.5 h-3.5" />
              <span>SPIN THE DIAL TO TRAVEL INWARD</span>
            </div>
          </motion.div>
        </div>

        {/* Floating Kinetic Sculpture responsive to cursor */}
        <div className="lg:col-span-6 flex justify-center items-center h-[300px] md:h-[400px]">
          <motion.div
            style={{
              x: mousePos.x * 40,
              y: mousePos.y * 40,
              rotateX: mousePos.y * -30,
              rotateY: mousePos.x * 30,
              perspective: 1000,
            }}
            className="relative w-[280px] h-[280px] md:w-[350px] md:h-[350px] flex items-center justify-center pointer-events-auto"
          >
            {/* Ambient material ring 1 */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
              className="absolute inset-0 rounded-full border border-dashed border-neutral-300 flex items-center justify-center opacity-70"
            >
              <div className="absolute top-0 w-3 h-3 rounded-full bg-[#0057FF]" />
              <div className="absolute bottom-6 left-6 w-1.5 h-1.5 rounded-full bg-[#111111]" />
            </motion.div>

            {/* Ambient material ring 2 */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
              className="absolute inset-[12%] rounded-full border border-double border-neutral-400 bg-white/40 shadow-premium flex items-center justify-center opacity-85"
            >
              <div className="absolute right-0 w-2 h-2 rounded-full bg-[#00C8FF]" />
              <div className="absolute top-1/4 left-10 text-[7px] font-mono text-[#111111]/50 tracking-widest select-none">
                AXIS: Z
              </div>
            </motion.div>

            {/* Ambient material ring 3 */}
            <motion.div
              animate={{ rotate: 180 }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              className="absolute inset-[26%] rounded-full border-1 border-neutral-300/80 bg-white/80 shadow-dial flex items-center justify-center"
            >
              <div className="absolute bottom-4 left-1/2 w-2.5 h-0.5 bg-[#0057FF]" />
            </motion.div>

            {/* Absolute Center architectural sphere core */}
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-20 h-20 rounded-full bg-white shadow-premium border border-neutral-200 flex items-center justify-center z-10"
            >
              <div className="w-12 h-12 rounded-full border border-dashed border-neutral-400 animate-spin flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-neutral-900 shadow-premium" />
              </div>
            </motion.div>

            {/* Horizontal radar projection vectors (SVG) */}
            <svg className="absolute w-full h-full pointer-events-none opacity-40" viewBox="0 0 100 100">
              <line x1="10" y1="50" x2="90" y2="50" stroke="#111111" strokeWidth="0.1" strokeDasharray="1 2" />
              <line x1="50" y1="10" x2="50" y2="90" stroke="#111111" strokeWidth="0.1" strokeDasharray="1 2" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="#111111" strokeWidth="0.05" />
            </svg>
          </motion.div>
        </div>
      </div>

      {/* Bottom Footer Information */}
      <div className="z-10 flex flex-col md:flex-row justify-between items-start md:items-end font-mono text-[9px] tracking-widest text-[#111111]/50 gap-4 mt-4">
        <div>
          <span>SYSTEM MODE: CONTINUOUS INTENT SYNTHESIS</span>
        </div>
        <div>
          <span>SCROLL WHEEL AND TOUCH SWIPE ENABLED</span>
        </div>
      </div>
    </div>
  );
}
