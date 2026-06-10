import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Network, Gamepad2, Globe, Sparkles, Binary, Compass, ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ChamberProps {
  isActive: boolean;
  onSelectChamber: (index: number) => void;
}

export default function Chamber03Ecosystem({ isActive, onSelectChamber }: ChamberProps) {
  const { t, i18n } = useTranslation();
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<string>("ghub");

  const nodes = useMemo(
    () =>
      (
        [
          { id: "game", icon: Gamepad2, targetChamber: 3, color: "#0057FF", coords: { x: "20%", y: "30%" } },
          { id: "trans", icon: Globe, targetChamber: 4, color: "#00C8FF", coords: { x: "80%", y: "45%" } },
          { id: "future", icon: Sparkles, targetChamber: 7, color: "#111111", coords: { x: "42%", y: "82%" } },
        ] as const
      ).map((node) => ({
        ...node,
        title: t(`chamber03.nodes.${node.id}.title`),
        desc: t(`chamber03.nodes.${node.id}.desc`),
      })),
    [t, i18n.language]
  );

  const systemDetails = useMemo(() => {
    const ids = ["ghub", "game", "trans", "future"] as const;
    return Object.fromEntries(
      ids.map((id) => [
        id,
        {
          subtitle: t(`chamber03.systems.${id}.subtitle`),
          core: t(`chamber03.systems.${id}.core`),
          details: t(`chamber03.systems.${id}.details`, { returnObjects: true }) as string[],
        },
      ])
    ) as Record<string, { subtitle: string; core: string; details: string[] }>;
  }, [t, i18n.language]);

  const activeSystemInfo = systemDetails[selectedSystem] || systemDetails.ghub;

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 md:p-20 overflow-hidden bg-transparent">
      {/* Dynamic Background Network SVG Grid overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-20" viewBox="0 0 1000 600" preserveAspectRatio="none">
        {/* Core cables converging at G.Hub center (500, 300) */}
        <g stroke="#111111" strokeWidth="0.5" fill="none" strokeDasharray="3 4">
          <line x1="200" y1="180" x2="500" y2="300" />
          <line x1="800" y1="270" x2="500" y2="300" />
          <line x1="420" y1="492" x2="500" y2="300" />
        </g>

        {/* Pulsing light packets animating along connection pathways */}
        <motion.circle
          r="4"
          fill="#0057FF"
          className="shadow-premium"
          animate={{
            cx: [200, 500],
            cy: [180, 300],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.circle
          r="4"
          fill="#00C8FF"
          animate={{
            cx: [800, 500],
            cy: [270, 300],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.circle
          r="3"
          fill="#111111"
          animate={{
            cx: [420, 500],
            cy: [492, 300],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </svg>

      {/* Top Header Information */}
      <div className="z-10 flex justify-between items-start font-mono text-[9px] tracking-widest text-[#111111]/60">
        <div>{t("chamber03.headerLeft")}</div>
        <div>{t("chamber03.headerRight")}</div>
      </div>

      {/* Main Neural Network Presentation Stage */}
      <div className="z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto">
        
        {/* Left Side: System Telemetry Board */}
        <div className="lg:col-span-5 flex flex-col gap-5 glass-panel p-6 md:p-8 rounded-2xl border border-neutral-300/30 shadow-premium pointer-events-auto">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-[#0057FF] animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest text-[#0057FF] font-semibold">
              {t("chamber03.systemDirectory")}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] text-[#0057FF] tracking-widest font-bold">
              {activeSystemInfo.subtitle}
            </span>
            <h2 className="font-display font-light text-3xl text-neutral-900 tracking-tight capitalize">
              {selectedSystem === "ghub" ? t("chamber03.centralCore") : selectedSystem}
            </h2>
          </div>

          <p className="text-xs text-neutral-500 font-sans font-light leading-relaxed">
            {activeSystemInfo.core}
          </p>

          <div className="border-t border-neutral-200/50 pt-4 flex flex-col gap-2 font-mono text-[9px] text-neutral-600">
            {activeSystemInfo.details.map((detail, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-[#F6F6F4] px-2.5 py-1.5 rounded border border-neutral-200">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00C8FF]" />
                <span>{detail}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              if (selectedSystem === "ghub") return;
              const target = nodes.find(n => n.id === selectedSystem);
              if (target) onSelectChamber(target.targetChamber);
            }}
            disabled={selectedSystem === "ghub"}
            className={`mt-2 px-5 py-3 rounded-lg font-mono text-[10px] tracking-wider flex items-center justify-between transition-all duration-300 ${
              selectedSystem === "ghub"
                ? "bg-neutral-100 text-neutral-400 border border-neutral-200"
                : "bg-neutral-900 hover:bg-[#0057FF] text-white shadow-premium cursor-pointer"
            }`}
          >
            <span>{t("chamber03.activateGateway")}</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Side: Virtual Neural nodes workspace */}
        <div className="lg:col-span-7 relative h-[360px] flex items-center justify-center pointer-events-auto">
          
          {/* Central Reactor Node: G.Hub */}
          <motion.button
            onClick={() => setSelectedSystem("ghub")}
            whileHover={{ scale: 1.05 }}
            className={`absolute z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-300 ${
              selectedSystem === "ghub"
                ? "bg-white border-[#0057FF] shadow-[0_0_15px_rgba(0,87,255,0.25)]"
                : "bg-white border-neutral-200 shadow-premium"
            }`}
          >
            <Binary className="w-5 h-5 text-[#0057FF] mb-1" />
            <span className="font-display font-semibold text-xs tracking-wider text-neutral-800">G.Hub</span>
            <span className="text-[7px] font-mono text-neutral-400 tracking-widest mt-0.5">0x00</span>
          </motion.button>

          {/* Connected Children Nodes orbiting */}
          {nodes.map((node) => {
            const IsSelected = selectedSystem === node.id;
            const NodeIcon = node.icon;
            
            return (
              <motion.button
                key={node.id}
                onClick={() => setSelectedSystem(node.id)}
                onMouseEnter={() => setHoverNode(node.id)}
                onMouseLeave={() => setHoverNode(null)}
                style={{
                  left: node.coords.x,
                  top: node.coords.y,
                  transform: "translate(-50%, -50%)",
                }}
                whileHover={{ scale: 1.08 }}
                className={`absolute z-20 p-4 rounded-2xl flex flex-col items-start gap-2.5 max-w-[170px] text-left border-1 backdrop-blur-md transition-all duration-300 ${
                  IsSelected
                    ? "bg-white border-[#00C8FF] shadow-[0_0_20px_rgba(0,200,255,0.2)]"
                    : "bg-white/80 hover:bg-white border-neutral-200 shadow-premium"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    style={{ backgroundColor: `${node.color}15`, color: node.color }}
                    className="p-1.5 rounded-lg flex items-center justify-center"
                  >
                    <NodeIcon className="w-4 h-4 stroke-[1.5]" />
                  </div>
                  <Compass className="w-3.5 h-3.5 text-neutral-300 animate-spin-slow duration-1000" />
                </div>

                <div className="flex flex-col">
                  <span className="font-display font-medium text-xs text-neutral-800 tracking-tight">
                    {node.title}
                  </span>
                  <span className="text-[7px] font-mono text-neutral-400 mt-0.5">
                    CHAMBER_KEY_0{node.targetChamber + 1}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Bottom Footer Details */}
      <div className="z-10 flex justify-between items-end font-mono text-[9px] tracking-widest text-[#111111]/40">
        <div>{t("chamber03.footerStatus")}</div>
        <div>{t("chamber03.footerStation")}</div>
      </div>
    </div>
  );
}
