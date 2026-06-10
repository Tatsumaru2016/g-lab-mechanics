import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, X, Info, Layers, Compass } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ChamberProps {
  isActive: boolean;
}

interface Project {
  id: string;
  name: string;
  category: string;
  description: string;
  releaseDate: string;
  specs: string[];
  schematicText: string;
}

const PROJECT_META = [
  { id: "TE-01", key: "TE01", releaseDate: "Q3 2026" },
  { id: "GC-09", key: "GC09", releaseDate: "Q4 2026" },
  { id: "GT-12", key: "GT12", releaseDate: "Q1 2027" },
] as const;

export default function Chamber07Showcase({ isActive }: ChamberProps) {
  const { t, i18n } = useTranslation();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const projects: Project[] = useMemo(
    () =>
      PROJECT_META.map((meta) => ({
        id: meta.id,
        releaseDate: meta.releaseDate,
        name: t(`chamber07.projects.${meta.key}.name`),
        category: t(`chamber07.projects.${meta.key}.category`),
        description: t(`chamber07.projects.${meta.key}.description`),
        specs: t(`chamber07.projects.${meta.key}.specs`, { returnObjects: true }) as string[],
        schematicText: t(`chamber07.projects.${meta.key}.schematic`),
      })),
    [t, i18n.language]
  );

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 md:p-20 overflow-hidden bg-transparent">
      
      {/* Background Architectural Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="0" y1="30" x2="100" y2="30" stroke="#111111" strokeWidth="0.05" />
          <line x1="0" y1="70" x2="100" y2="70" stroke="#111111" strokeWidth="0.05" />
          <line x1="30" y1="0" x2="30" y2="100" stroke="#111111" strokeWidth="0.05" />
          <line x1="70" y1="0" x2="70" y2="100" stroke="#111111" strokeWidth="0.05" />
        </svg>
      </div>

      {/* Top Header */}
      <div className="z-10 flex justify-between items-start font-mono text-[9px] tracking-widest text-[#111111]/60">
        <div>{t("chamber07.headerLeft")}</div>
        <div>{t("chamber07.headerRight", { count: projects.length })}</div>
      </div>

      {/* Main split stage */}
      <div className="z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto">
        
        {/* Left Typography Block */}
        <div className="lg:col-span-5 flex flex-col items-start gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 glass-chip shadow-premium rounded-full text-[10px] text-[#0057FF] font-mono font-bold">
            <Layers className="w-3.5 h-3.5" />
            <span>{t("chamber07.badge")}</span>
          </div>

          <h2 className="font-display font-light text-5xl tracking-tighter text-[#111111] leading-none">
            {t("chamber07.titleLine1")} <br />
            {t("chamber07.titleLine2")}<span className="text-[#0057FF]">.</span>
          </h2>

          <p className="text-xs text-neutral-500 font-sans font-light leading-relaxed max-w-sm">
            {t("chamber07.body")}
          </p>

          <div className="flex items-center gap-1.5 font-mono text-[9px] text-neutral-400 bg-neutral-100/50 border border-neutral-200 px-3 py-1.5 rounded-lg">
            <Compass className="w-3.5 h-3.5 text-[#0057FF] animate-spin-slow" />
            <span>{t("chamber07.clickCards")}</span>
          </div>
        </div>

        {/* Right side self-assembling cards list */}
        <div className="lg:col-span-7 flex flex-col md:flex-row gap-5 items-center justify-center relative min-h-[300px] pointer-events-auto">
          <AnimatePresence mode="popLayout">
            {projects.map((proj, idx) => (
              <motion.button
                key={proj.id}
                initial={{ opacity: 0, scale: 0.8, y: 100, rotateY: 20 }}
                animate={isActive ? { 
                  opacity: 1, 
                  scale: 1, 
                  y: 0, 
                  rotateY: 0,
                  transition: { delay: idx * 0.18, duration: 0.8, type: "spring", stiffness: 100 }
                } : {}}
                whileHover={{ 
                  scale: 1.04, 
                  y: -10,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.06)",
                  transition: { duration: 0.3 }
                }}
                onClick={() => setSelectedProject(proj)}
                className="w-full md:w-[190px] h-[280px] rounded-2xl glass-panel p-5 text-left flex flex-col justify-between border border-white hover:border-[#0057FF]/40 cursor-pointer shadow-premium relative overflow-hidden group"
              >
                {/* Visual Glass highlights */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white via-transparent to-white/60 pointer-events-none" />

                <div className="flex justify-between items-start z-10">
                  <span className="font-mono text-[9px] text-[#0057FF] font-bold bg-[#0057FF]/10 px-2.5 py-1 rounded-md">
                    {proj.id}
                  </span>
                  <span className="font-mono text-[8px] text-neutral-400">
                    {proj.releaseDate}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 z-10">
                  <span className="font-mono text-[8px] text-neutral-400 tracking-wider">
                    {proj.category.toUpperCase()}
                  </span>
                  <h3 className="font-display font-medium text-lg text-neutral-900 leading-tight group-hover:text-[#0057FF] transition-colors">
                    {proj.name}
                  </h3>
                </div>

                <div className="flex justify-between items-center z-10 border-t border-neutral-100 pt-3">
                  <span className="font-mono text-[8.5px] text-neutral-500 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    DETAILS <ArrowRight className="w-3 h-3 text-[#0057FF]" />
                  </span>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Blue Prints Expandable Modal Drawer */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-neutral-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-10 pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden border border-neutral-200 shadow-premium flex flex-col md:flex-row max-h-[90vh] md:max-h-none text-left"
            >
              {/* Left Side: Technical Blueprint drawing */}
              <div className="flex-1 bg-[#111111] text-neutral-100 p-6 flex flex-col justify-between border-r border-neutral-800 font-mono select-none relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-white opacity-5 pointer-events-none" />
                
                <div className="flex justify-between items-start text-[8px] tracking-wider text-neutral-500 z-10">
                  <span>{t("chamber07.specDrawing", { id: selectedProject.id })}</span>
                  <span>{t("chamber07.cadScale")}</span>
                </div>

                <div className="my-10 flex flex-col items-center justify-center relative z-10">
                  <svg className="w-32 h-32 text-[#0057FF]" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8">
                    <rect x="15" y="15" width="70" height="70" rx="6" strokeDasharray="1 1" />
                    <circle cx="50" cy="50" r="28" strokeDasharray="3 4" x-speed="2" className="animate-[spin_20s_linear_infinite]" />
                    <line x1="50" y1="5" x2="50" y2="95" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                    <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                  </svg>
                  <span className="text-[7.5px] text-[#00C8FF] tracking-widest uppercase mt-4 text-center px-4 leading-normal">
                    {selectedProject.schematicText}
                  </span>
                </div>

                <div className="text-[7.5px] text-neutral-400 tracking-wider flex justify-between z-10">
                  <span>{t("chamber07.tolerances")}</span>
                  <span>{t("chamber07.patents")}</span>
                </div>
              </div>

              {/* Right Side: Design parameters summary and checklist */}
              <div className="flex-1 p-6 md:p-8 flex flex-col justify-between bg-white text-neutral-800">
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-mono text-[9px] text-[#0057FF] tracking-widest font-bold">
                        {selectedProject.category.toUpperCase()}
                      </span>
                      <h2 className="font-display font-medium text-2xl text-neutral-900 leading-tight">
                        {selectedProject.name}
                      </h2>
                    </div>
                    
                    <button
                      onClick={() => setSelectedProject(null)}
                      className="p-1.5 hover:bg-neutral-100 rounded-full border border-neutral-200 text-neutral-600 transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-neutral-500 font-sans font-light leading-relaxed mt-2">
                    {selectedProject.description}
                  </p>

                  <div className="border-t border-neutral-100 pt-4 flex flex-col gap-2 font-mono text-[9px]">
                    <span className="text-[8px] text-neutral-400 tracking-widest uppercase">
                      {t("chamber07.hardwareParams")}
                    </span>
                    {selectedProject.specs.map((spec, i) => (
                      <div key={i} className="flex items-center gap-2 bg-[#F6F6F4] px-2.5 py-1.5 rounded border border-neutral-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0057FF]" />
                        <span>{spec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 border-t border-neutral-100 pt-4 flex justify-between items-center text-xs">
                  <span className="font-mono text-[9px] text-neutral-400">
                    {t("chamber07.statusDev", { date: selectedProject.releaseDate })}
                  </span>
                  <button
                    onClick={() => setSelectedProject(null)}
                    className="px-4 py-2 bg-[#111111] hover:bg-[#0057FF] text-white rounded-lg font-mono text-[9px] tracking-wider transition-colors cursor-pointer"
                  >
                    {t("chamber07.closeSpec")}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Footer Details */}
      <div className="z-10 flex justify-between items-end font-mono text-[9px] tracking-widest text-[#111111]/40">
        <div>{t("chamber07.footerProd")}</div>
        <div>{t("chamber07.footerStation")}</div>
      </div>
    </div>
  );
}
