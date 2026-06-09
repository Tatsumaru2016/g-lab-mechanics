import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Network, Gamepad2, Globe, Sparkles, Binary, Compass, ArrowUpRight } from "lucide-react";

interface ChamberProps {
  isActive: boolean;
  onSelectChamber: (index: number) => void;
}

export default function Chamber03Ecosystem({ isActive, onSelectChamber }: ChamberProps) {
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<string>("glab");

  const nodes = [
    {
      id: "game",
      title: "G.Game",
      desc: "An innovative game development platform, modular rendering engine, and connected player ecosystem.",
      icon: Gamepad2,
      targetChamber: 3, // index 3 is L-04
      color: "#0057FF",
      coords: { x: "20%", y: "30%" },
    },
    {
      id: "trans",
      title: "G.Trans",
      desc: "An AI-powered multilingual communication platform morphing dialects fluidly across borders in actual real-time.",
      icon: Globe,
      targetChamber: 4, // index 4 is L-05
      color: "#00C8FF",
      coords: { x: "80%", y: "45%" },
    },
    {
      id: "future",
      title: "Future Experiments",
      desc: "Uncharted domains, kinetic architecture simulations, spatial compute engines, and virtual intelligence modules.",
      icon: Sparkles,
      targetChamber: 7, // index 7 is L-08
      color: "#111111",
      coords: { x: "42%", y: "82%" },
    },
  ];

  const systemDetails: Record<string, { subtitle: string; core: string; details: string[] }> = {
    glab: {
      subtitle: "SYSTEM CENTRAL HUB",
      core: "The central core coordinates pipeline execution, state tracking, and neural data translation between nodes.",
      details: [
        "Active routing parameters: ENABLED",
        "Inter-node telemetry bandwidth: 10 Gb/s",
        "Decentralized ledger integration: COMPLETED",
      ],
    },
    game: {
      subtitle: "L-04 CREATIVE ENVIRONMENT",
      core: "G.Game is designed from the metal up for hyper-reactive micro-gaming, procedural world generators, and sandbox tools.",
      details: [
        "Render buffer speed: 120 FPS",
        "Physics parameters: FULL MATRIX COMPUTE",
        "Active users: 142,948 SECURE HUBS",
      ],
    },
    trans: {
      subtitle: "L-05 LANGUAGE ENGINE",
      core: "G.Trans translates intent and cognitive speech, preserving tone, cultural reference points, and precise grammatical pacing.",
      details: [
        "Supported dialects: 124 FLUID METAS",
        "Cognitive model: @google/genai core pipeline",
        "Transformation duration: < 12ms",
      ],
    },
    future: {
      subtitle: "L-08 NEXT HORIZONS",
      core: "A secure sandboxed vault hosting experimental, reactive structures, autonomous agent pods, and multi-user environments.",
      details: [
        "Available bandwidth: UNLIMITED",
        "Project status: ACTIVE PROTOTYPES",
        "System state: EVOLVING",
      ],
    },
  };

  const activeSystemInfo = systemDetails[selectedSystem] || systemDetails.glab;

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 md:p-20 overflow-hidden bg-[#F6F6F4]">
      {/* Dynamic Background Network SVG Grid overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-20" viewBox="0 0 1000 600" preserveAspectRatio="none">
        {/* Core cables converging at G.Lab center (500, 300) */}
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
        <div>CHAMBER: ECOSYSTEM TERMINAL</div>
        <div>ACTIVE MATRIX: NEURAL INTEGRATOR 12.01</div>
      </div>

      {/* Main Neural Network Presentation Stage */}
      <div className="z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto">
        
        {/* Left Side: System Telemetry Board */}
        <div className="lg:col-span-5 flex flex-col gap-5 bg-white/80 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-neutral-300/30 shadow-premium pointer-events-auto">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-[#0057FF] animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest text-[#0057FF] font-semibold">
              G.LAB SYSTEM DIRECTORY
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] text-[#0057FF] tracking-widest font-bold">
              {activeSystemInfo.subtitle}
            </span>
            <h2 className="font-display font-light text-3xl text-neutral-900 tracking-tight capitalize">
              {selectedSystem === "glab" ? "Central Core" : selectedSystem}
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
              if (selectedSystem === "glab") return;
              const target = nodes.find(n => n.id === selectedSystem);
              if (target) onSelectChamber(target.targetChamber);
            }}
            disabled={selectedSystem === "glab"}
            className={`mt-2 px-5 py-3 rounded-lg font-mono text-[10px] tracking-wider flex items-center justify-between transition-all duration-300 ${
              selectedSystem === "glab"
                ? "bg-neutral-100 text-neutral-400 border border-neutral-200"
                : "bg-neutral-900 hover:bg-[#0057FF] text-white shadow-premium cursor-pointer"
            }`}
          >
            <span>ACTIVATE SELECTED CHAMBER GATEway</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Side: Virtual Neural nodes workspace */}
        <div className="lg:col-span-7 relative h-[360px] flex items-center justify-center pointer-events-auto">
          
          {/* Central Reactor Node: G.Lab */}
          <motion.button
            onClick={() => setSelectedSystem("glab")}
            whileHover={{ scale: 1.05 }}
            className={`absolute z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-300 ${
              selectedSystem === "glab"
                ? "bg-white border-[#0057FF] shadow-[0_0_15px_rgba(0,87,255,0.25)]"
                : "bg-white border-neutral-200 shadow-premium"
            }`}
          >
            <Binary className="w-5 h-5 text-[#0057FF] mb-1" />
            <span className="font-display font-semibold text-xs tracking-wider text-neutral-800">G.Lab</span>
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
        <div>SYSTEM STATUS: INTELLIGENT INTEGRATION MATRIX</div>
        <div>STATION: L-03 // G_LAB_MATRIX</div>
      </div>
    </div>
  );
}
