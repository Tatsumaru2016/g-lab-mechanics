import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import HubRadiantCore from "./HubRadiantCore";

interface ChamberProps {
  isActive: boolean;
}

export default function Chamber01Entry({ isActive }: ChamberProps) {
  const { t } = useTranslation();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className="relative w-full h-full flex flex-col justify-between p-8 md:p-20 overflow-hidden bg-transparent"
    >
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute inset-[15%] border border-neutral-300/40 rounded-[2rem] bg-white/30 shadow-premium" />
        <div className="absolute inset-[25%] border border-neutral-300/30 rounded-[1.5rem] bg-white/20" />
        <div className="absolute top-[48%] left-0 w-full h-[0.5px] bg-[#0057FF]/10" />
      </div>

      <div className="z-10 flex justify-between items-start font-mono text-[9px] tracking-widest text-[#111111]/60">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0057FF] animate-ping" />
          <span>{t("chamber01.headerInit")}</span>
        </div>
        <div className="text-right hidden md:block">
          <div>{t("chamber01.loc")}</div>
          <div>{t("chamber01.established")}</div>
        </div>
      </div>

      <div className="z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-auto">
        <div className="lg:col-span-6 flex flex-col items-start gap-6">
          <div className="flex items-center gap-2 px-3 py-1 glass-chip shadow-premium rounded-full text-[10px] font-mono text-[#0057FF] font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t("chamber01.badge")}</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isActive ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col"
          >
            <h1 className="font-display font-light text-7xl md:text-8xl tracking-tighter text-[#111111] leading-none select-none">
              G<span className="text-[#0057FF]">.</span>Hub
            </h1>
            <p className="font-display font-light text-2xl md:text-3xl text-neutral-500 tracking-tight mt-3">
              {t("chamber01.subtitle")}
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={isActive ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-sm text-neutral-500 max-w-sm font-sans font-light leading-relaxed tracking-wide"
          >
            {t("chamber01.body")}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={isActive ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-2 font-mono text-xs tracking-wider text-[#111111]/50"
          >
            {t("chamber01.hint")}
          </motion.p>
        </div>

        <div className="lg:col-span-6 flex justify-center items-center h-[300px] md:h-[400px] pointer-events-auto">
          <HubRadiantCore isActive={isActive} mouseX={mousePos.x} mouseY={mousePos.y} />
        </div>
      </div>

      <div className="z-10 flex flex-col md:flex-row justify-between items-start md:items-end font-mono text-[9px] tracking-widest text-[#111111]/50 gap-4 mt-4">
        <div>
          <span>{t("chamber01.footerMode")}</span>
        </div>
        <div>
          <span>{t("chamber01.footerInput")}</span>
        </div>
      </div>
    </div>
  );
}
