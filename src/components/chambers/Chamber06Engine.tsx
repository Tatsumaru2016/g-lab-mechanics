import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cpu, ArrowRight, Settings, Info, Gauge, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ChamberProps {
  isActive: boolean;
}

interface ProcessStep {
  id: string;
  name: string;
  metric: string;
  desc: string;
  rotationalSpeed: number;
  meshTeeth: number;
  specText: string[];
}

const STEP_PHYSICS = [
  { id: "idea", rotationalSpeed: 1, meshTeeth: 24 },
  { id: "research", rotationalSpeed: -0.75, meshTeeth: 32 },
  { id: "design", rotationalSpeed: 0.5, meshTeeth: 48 },
  { id: "prototype", rotationalSpeed: -1.5, meshTeeth: 16 },
  { id: "development", rotationalSpeed: 0.6, meshTeeth: 40 },
  { id: "launch", rotationalSpeed: -1, meshTeeth: 24 },
] as const;

export default function Chamber06Engine({ isActive }: ChamberProps) {
  const { t, i18n } = useTranslation();
  const [activeStep, setActiveStep] = useState<number>(0);
  const [revSpeedMultiplier, setRevSpeedMultiplier] = useState<number>(1);

  const ENGINE_STEPS: ProcessStep[] = useMemo(
    () =>
      STEP_PHYSICS.map((meta) => ({
        ...meta,
        name: t(`chamber06.steps.${meta.id}.name`),
        metric: t(`chamber06.steps.${meta.id}.metric`),
        desc: t(`chamber06.steps.${meta.id}.desc`),
        specText: t(`chamber06.steps.${meta.id}.specs`, { returnObjects: true }) as string[],
      })),
    [t, i18n.language]
  );

  const step = ENGINE_STEPS[activeStep];

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 md:p-20 overflow-hidden bg-transparent">
      
      {/* Background Calibrated Grids */}
      <div className="absolute inset-0 pointer-events-none opacity-30 z-0">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#A3A3A3" strokeWidth="0.05" strokeDasharray="1 3" />
          <circle cx="50" cy="50" r="28" fill="none" stroke="#A3A3A3" strokeWidth="0.05" strokeDasharray="1 4" />
        </svg>
      </div>

      {/* Top Header */}
      <div className="z-10 flex justify-between items-start font-mono text-[9px] tracking-widest text-[#111111]/60">
        <div>{t("chamber06.headerLeft")}</div>
        <div>{t("chamber06.headerRight")}</div>
      </div>

      {/* Main split gear mechanics viewport */}
      <div className="z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto">
        
        {/* Left Side details console panel */}
        <div className="lg:col-span-5 flex flex-col glass-panel p-6 md:p-8 rounded-2xl border border-neutral-300/30 shadow-premium pointer-events-auto">
          <div className="flex justify-between items-center bg-neutral-100 p-2.5 rounded-lg border border-neutral-200 text-[#0057FF] font-mono text-[9.5px] font-bold">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-[#0057FF] animate-spin" />
              <span>{t("chamber06.badge")}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mt-4">
            <span className="font-mono text-[9px] text-[#0057FF] tracking-widest font-extrabold uppercase">
              {step.metric}
            </span>
            <h2 className="font-display font-light text-3xl text-neutral-900 tracking-tight">
              {t("chamber06.processPhase", { name: step.name })}
            </h2>
          </div>

          <p className="text-xs text-neutral-500 font-sans font-light leading-relaxed mt-2.5">
            {step.desc}
          </p>

          <div className="border-t border-neutral-200/50 pt-4 flex flex-col gap-2 font-mono text-[9px] text-neutral-600">
            <div className="text-[9px] font-mono tracking-widest text-neutral-400 mb-1">
              {t("chamber06.phaseSpec")}
            </div>
            {step.specText.map((spec, index) => (
              <div key={index} className="flex items-center gap-2 bg-[#F6F6F4] px-2.5 py-1.5 rounded border border-neutral-200">
                <span className="w-1 to-h-2 bg-[#0057FF] rounded" />
                <span>{spec}</span>
              </div>
            ))}
          </div>

          {/* Core Interactive Gear Speed control */}
          <div className="flex items-center justify-between mt-4 border-t border-neutral-100 pt-4">
            <div className="flex items-center gap-1.5 font-mono text-[8.5px] text-neutral-400">
              <Gauge className="w-3.5 h-3.5 text-neutral-400" />
              <span>{t("chamber06.velocity")}</span>
            </div>
            <div className="flex gap-1.5 bg-neutral-100 p-1 rounded-md border border-neutral-200">
              {[0.5, 1, 2].map((mult) => (
                <button
                  key={mult}
                  onClick={() => setRevSpeedMultiplier(mult)}
                  className={`px-2.5 py-1 rounded font-mono text-[8px] tracking-wider transition-all cursor-pointer ${
                    revSpeedMultiplier === mult ? "bg-white text-[#0057FF] font-bold shadow" : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  {mult}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side Rotating Gears graphics workspace */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative min-h-[350px] pointer-events-auto">
          
          {/* Main Visual SVG Gear Container */}
          <div className="relative w-[340px] h-[340px] md:w-[380px] md:h-[380px] flex items-center justify-center">
            
            {/* Gear 1 (Idea) - Left side */}
            <motion.button
              onClick={() => setActiveStep(0)}
              style={{ top: "35%", left: "15%" }}
              animate={{ rotate: 360 * ENGINE_STEPS[0].rotationalSpeed * revSpeedMultiplier }}
              transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
              className={`absolute w-20 h-20 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                activeStep === 0 ? "border-[#0057FF] bg-white text-[#0057FF]" : "border-neutral-300 bg-white shadow-premium text-neutral-500"
              }`}
            >
              <div className="relative w-full h-full flex items-center justify-center font-mono text-[9px] font-bold select-none">
                <span>{t("chamber06.rotorLabels.idea")}</span>
                {/* SVG Gear ticks nested */}
                <svg className="absolute inset-0 w-full h-full transform scale-105 pointer-events-none select-none opacity-40" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="3 4" />
                </svg>
              </div>
            </motion.button>

            {/* Gear 2 (Research) - Top Left middle */}
            <motion.button
              onClick={() => setActiveStep(1)}
              style={{ top: "12%", left: "42%" }}
              animate={{ rotate: 360 * ENGINE_STEPS[1].rotationalSpeed * revSpeedMultiplier }}
              transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
              className={`absolute w-28 h-28 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                activeStep === 1 ? "border-[#0057FF] bg-white text-[#0057FF]" : "border-neutral-300 bg-white shadow-premium text-neutral-500"
              }`}
            >
              <div className="relative w-full h-full flex items-center justify-center font-mono text-[9.5px] font-bold select-none">
                <span>{t("chamber06.rotorLabels.research")}</span>
                <svg className="absolute inset-0 w-full h-full transform scale-102 pointer-events-none select-none opacity-45" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 6" />
                </svg>
              </div>
            </motion.button>

            {/* Gear 3 (Design) - Right top corner */}
            <motion.button
              onClick={() => setActiveStep(2)}
              style={{ top: "36%", left: "70%" }}
              animate={{ rotate: 360 * ENGINE_STEPS[2].rotationalSpeed * revSpeedMultiplier }}
              transition={{ repeat: Infinity, duration: 32, ease: "linear" }}
              className={`absolute w-24 h-24 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                activeStep === 2 ? "border-[#0057FF] bg-white text-[#0057FF]" : "border-neutral-300 bg-white shadow-premium text-neutral-500"
              }`}
            >
              <div className="relative w-full h-full flex items-center justify-center font-mono text-[9px] font-bold select-none">
                <span>{t("chamber06.rotorLabels.design")}</span>
                <svg className="absolute inset-0 w-full h-full transform scale-104 pointer-events-none select-none opacity-40" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="2 3" />
                </svg>
              </div>
            </motion.button>

            {/* Gear 4 (Prototype) - Bottom left */}
            <motion.button
              onClick={() => setActiveStep(3)}
              style={{ top: "64%", left: "12%" }}
              animate={{ rotate: 360 * ENGINE_STEPS[3].rotationalSpeed * revSpeedMultiplier }}
              transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
              className={`absolute w-16 h-16 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                activeStep === 3 ? "border-[#0057FF] bg-white text-[#0057FF]" : "border-neutral-300 bg-white shadow-premium text-neutral-500"
              }`}
            >
              <div className="relative w-full h-full flex items-center justify-center font-mono text-[8px] font-bold select-none">
                <span>{t("chamber06.rotorLabels.proto")}</span>
                <svg className="absolute inset-0 w-full h-full transform scale-108 pointer-events-none select-none opacity-50" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="41" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                </svg>
              </div>
            </motion.button>

            {/* Gear 5 (Development) - Absolute Center bottom */}
            <motion.button
              onClick={() => setActiveStep(4)}
              style={{ top: "66%", left: "38%" }}
              animate={{ rotate: 360 * ENGINE_STEPS[4].rotationalSpeed * revSpeedMultiplier }}
              transition={{ repeat: Infinity, duration: 28, ease: "linear" }}
              className={`absolute w-32 h-32 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                activeStep === 4 ? "border-[#0057FF] bg-white text-[#0057FF]" : "border-neutral-300 bg-white shadow-premium text-neutral-500"
              }`}
            >
              <div className="relative w-full h-full flex items-center justify-center font-mono text-[10px] font-bold select-none">
                <span>{t("chamber06.rotorLabels.development")}</span>
                <svg className="absolute inset-0 w-full h-full transform scale-103 pointer-events-none select-none opacity-35" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="47" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 7" />
                </svg>
              </div>
            </motion.button>

            {/* Gear 6 (Launch) - Right bottom */}
            <motion.button
              onClick={() => setActiveStep(5)}
              style={{ top: "68%", left: "74%" }}
              animate={{ rotate: 360 * ENGINE_STEPS[5].rotationalSpeed * revSpeedMultiplier }}
              transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
              className={`absolute w-20 h-20 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                activeStep === 5 ? "border-[#0057FF] bg-white text-[#0057FF]" : "border-neutral-300 bg-white shadow-premium text-neutral-500"
              }`}
            >
              <div className="relative w-full h-full flex items-center justify-center font-mono text-[9px] font-bold select-none">
                <span>{t("chamber06.rotorLabels.launch")}</span>
                <svg className="absolute inset-0 w-full h-full transform scale-106 pointer-events-none select-none opacity-45" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="43" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="4 4" />
                </svg>
              </div>
            </motion.button>
          </div>

          {/* Connective gear belt or link lines (SVG) */}
          <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center">
            <div className="text-[10px] font-mono tracking-widest text-[#0057FF]/60 bg-white px-3 py-1.5 border border-[#0057FF]/10 rounded-full shadow-premium flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-[#0057FF] text-[#0057FF]" />
              <span>{t("chamber06.clickRotors")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Details */}
      <div className="z-10 flex justify-between items-end font-mono text-[9px] tracking-widest text-[#111111]/40">
        <div>{t("chamber06.footerTorque")}</div>
        <div>{t("chamber06.footerStation")}</div>
      </div>
    </div>
  );
}
