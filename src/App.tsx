import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import JogDial from "./components/JogDial";
import ChamberLayout from "./components/ChamberLayout";
import { CHAMBERS } from "./types";

// Import individual Chambers
import Chamber01Entry from "./components/chambers/Chamber01Entry";
import Chamber02Thinking from "./components/chambers/Chamber02Thinking";
import Chamber03Ecosystem from "./components/chambers/Chamber03Ecosystem";
import Chamber04Game from "./components/chambers/Chamber04Game";
import Chamber05Trans from "./components/chambers/Chamber05Trans";
import Chamber06Engine from "./components/chambers/Chamber06Engine";
import Chamber07Showcase from "./components/chambers/Chamber07Showcase";
import Chamber08Future from "./components/chambers/Chamber08Future";
import Chamber09Contact from "./components/chambers/Chamber09Contact";

import { Info, HelpCircle, X, Compass, ChevronDown, CheckCircle, Shield, Radio, Sparkles } from "lucide-react";

export default function App() {
  const [currentChamber, setCurrentChamber] = useState(0);
  const [dialLockPulse, setDialLockPulse] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Keyboard navigation support: arrow up/down shifts chambers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCollapsed) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        setCurrentChamber((prev) => Math.min(CHAMBERS.length - 1, prev + 1));
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        setCurrentChamber((prev) => Math.max(0, prev - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCollapsed]);

  // Touch Swipe coordinates for mobile gesture controllers
  const touchStartY = React.useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isCollapsed) return;
    const touchEndY = e.changedTouches[0].clientY;
    const diffY = touchStartY.current - touchEndY;

    if (Math.abs(diffY) > 80) {
      if (diffY > 0) {
        // Swiped UP => deeper chambers
        setCurrentChamber((prev) => Math.min(CHAMBERS.length - 1, prev + 1));
      } else {
        // Swiped DOWN => backward
        setCurrentChamber((prev) => Math.max(0, prev - 1));
      }
    }
  };

  // Render proper chamber component mapping
  const renderActiveChamber = (chamberIndex: number) => {
    switch (chamberIndex) {
      case 0:
        return (
          <Chamber01Entry
            isActive={currentChamber === 0}
            onNext={() => setCurrentChamber(1)}
          />
        );
      case 1:
        return <Chamber02Thinking isActive={currentChamber === 1} />;
      case 2:
        return (
          <Chamber03Ecosystem
            isActive={currentChamber === 2}
            onSelectChamber={(index) => setCurrentChamber(index)}
          />
        );
      case 3:
        return <Chamber04Game isActive={currentChamber === 3} />;
      case 4:
        return <Chamber05Trans isActive={currentChamber === 4} />;
      case 5:
        return <Chamber06Engine isActive={currentChamber === 5} />;
      case 6:
        return <Chamber07Showcase isActive={currentChamber === 6} />;
      case 7:
        return <Chamber08Future isActive={currentChamber === 7} />;
      case 8:
        return (
          <Chamber09Contact
            isActive={currentChamber === 8}
            onCollapseToggle={() => setIsCollapsed(true)}
          />
        );
      default:
        return <Chamber01Entry isActive={currentChamber === 0} onNext={() => setCurrentChamber(1)} />;
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative w-screen h-screen select-none overflow-hidden transition-colors duration-1000 ${
        isCollapsed ? "bg-[#111111]" : "bg-[#F6F6F4]"
      }`}
    >
      {/* Noise textures layer */}
      <div className="noise-overlay" />

      <AnimatePresence mode="wait">
        {isCollapsed ? (
          /* COLLAPSED SINGULARITY SHUTDOWN VIEW */
          <motion.div
            key="collapsed_stage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#111111] z-[999]"
          >
            {/* Spinning vector ring matrices */}
            <div className="relative w-[280px] h-[280px] flex items-center justify-center pointer-events-auto">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-dashed border-neutral-700/50"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                className="absolute inset-[15%] rounded-full border border-double border-neutral-800"
              />

              {/* Pulsing Central Glowing blue LED Dot core */}
              <button
                onClick={() => setIsCollapsed(false)}
                className="w-20 h-20 rounded-full bg-black border-2 border-[#0057FF] flex items-center justify-center shadow-[0_0_35px_rgba(0,87,255,0.7)] hover:shadow-[0_0_55px_rgba(0,200,255,0.9)] hover:scale-105 active:scale-95 transition-all outline-none cursor-pointer duration-300"
                title="RE-INFLATE G.LAB MACHINE"
              >
                <div className="w-5 h-5 rounded-full bg-[#0057FF] animate-ping duration-1000" />
                <div className="absolute w-3 h-3 rounded-full bg-[#00C8FF]" />
              </button>
            </div>

            {/* Status alerts */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center text-center gap-1.5 mt-8 font-mono select-none"
            >
              <span className="text-[10px] tracking-widest text-[#0057FF] font-extrabold animate-pulse">
                G.LAB ENGINE COLLAPSED SPEC
              </span>
              <span className="text-[8.5px] text-neutral-500 tracking-wider uppercase max-w-sm leading-normal">
                All physical chambers folded back into singular coordinate system core segment. Click central illuminated transmitter to expand laboratory.
              </span>
            </motion.div>
          </motion.div>
        ) : (
          /* ACTIVE G.LAB PORTAL INTERFACE VIEW */
          <motion.div
            key="active_stage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex relative"
          >
            {/* Standard Margins, micro logo, and About Button */}
            <div className="absolute top-6 right-6 z-40 flex items-center gap-3">
              <button
                onClick={() => setIsAboutOpen(true)}
                className="px-4 py-2.5 bg-white hover:bg-[#F6F6F4] text-neutral-800 rounded-lg shadow-premium border border-neutral-200 font-mono text-[9px] tracking-widest flex items-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#0057FF]" />
                <span>LAB_MANUAL.md</span>
              </button>
            </div>

            <ChamberLayout
              currentChamber={currentChamber}
              dialLockPulse={dialLockPulse}
              navigation={
                <JogDial
                  currentChamber={currentChamber}
                  onChamberChange={(idx) => setCurrentChamber(idx)}
                  onSceneLocked={() => setDialLockPulse((p) => p + 1)}
                />
              }
            >
              {(displayedChamber) => renderActiveChamber(displayedChamber)}
            </ChamberLayout>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lab Manual Informational Side Drawer */}
      <AnimatePresence>
        {isAboutOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-md flex justify-end pointer-events-auto"
          >
            {/* Drawer Sliding body */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="w-full max-w-md h-full bg-white border-l border-neutral-200 shadow-2xl p-8 flex flex-col justify-between text-left"
            >
              <div className="flex flex-col gap-6">
                {/* Header title */}
                <div className="flex justify-between items-center border-b border-neutral-100 pb-4">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-[#0057FF] animate-spin-slow" />
                    <span className="font-mono text-[10px] tracking-widest text-[#111111] font-bold uppercase">
                      G.LAB OPERATIONAL REGISTRY
                    </span>
                  </div>
                  <button
                    onClick={() => setIsAboutOpen(false)}
                    className="p-1.5 hover:bg-neutral-100 border border-neutral-200 rounded-lg text-neutral-500 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Substantive operational text details */}
                <div className="flex flex-col gap-5 overflow-y-auto max-h-[70vh] pr-2 scrollbar-none font-sans text-xs text-neutral-600 leading-relaxed font-light">
                  <div>
                    <h3 className="font-display font-medium text-sm text-neutral-900 mb-1.5 uppercase tracking-wide">
                      A Living Invention Studio
                    </h3>
                    <p>
                      Welcome to G.Lab, a high-precision experimental digital workspace operating at the boundaries of visual design and functional computing. This platform acts as a sensory portal connecting abstract products (G.Game, G.Trans) into one physical layout loop.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-display font-medium text-sm text-neutral-900 mb-1.5 uppercase tracking-wide">
                      Mechanical Navigation Guide
                    </h3>
                    <ul className="list-disc pl-4 flex flex-col gap-1.5 mt-1">
                      <li>
                        <strong>The Jog Dial</strong>: Located permanently in the left margin. Spin or drag it up/down to rotate and select chambers.
                      </li>
                      <li>
                        <strong>Mouse Wheel Support</strong>: Scroll anywhere on screen with your scroll wheel to easily hop chambers.
                      </li>
                      <li>
                        <strong>Indicators</strong>: Code symbols (L-01 to L-09) represent exact spatial layout chambers inside the laboratory machine.
                      </li>
                      <li>
                        <strong>Keyboard Anchors</strong>: Press your keyboard Arrow Keys (Up/Down/Left/Right) for fluid travel.
                      </li>
                    </ul>
                  </div>

                  <div className="border-t border-neutral-100 pt-4 font-mono text-[9px] text-neutral-500 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      <span>COGNITIVE ACCELERATION: ACTIVE</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-[#0057FF]" />
                      <span>CRYSTALLIZED SECURITIES: LOCKED</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer bottom actions */}
              <div className="border-t border-neutral-100 pt-4 flex justify-between items-center">
                <span className="font-mono text-[8px] text-neutral-400">VERSION: G.LAB SYSTEM CORE 1.0.4</span>
                <button
                  onClick={() => setIsAboutOpen(false)}
                  className="px-4 py-2.5 bg-neutral-900 hover:bg-[#0057FF] text-white rounded-lg font-mono text-[9px] tracking-wider transition-colors cursor-pointer"
                >
                  DISMISS OPERATIONAL REGISTRY
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
