import React, { useRef, useEffect, useState } from "react";
import { motion } from "motion/react";
import { Lightbulb, Layers, FileText, Cpu, Package } from "lucide-react";

interface ChamberProps {
  isActive: boolean;
}

// Particle class for our thinking engine
class ThoughtParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  currentType: "dot" | "sketch" | "blueprint" | "product";
  targetX: number;
  targetY: number;

  constructor(width: number, height: number, type: "dot" | "sketch" | "blueprint" | "product") {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = (Math.random() - 0.5) * 1.5;
    this.radius = Math.random() * 2.5 + 1.2;
    this.opacity = Math.random() * 0.5 + 0.3;
    this.currentType = type;
    this.targetX = this.x;
    this.targetY = this.y;
  }

  update(width: number, height: number) {
    this.x += this.vx;
    this.y += this.vy;

    // bounce off wall boundaries
    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;
  }
}

export default function Chamber02Thinking({ isActive }: ChamberProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Pipeline stage control
  const [pipelineState, setPipelineState] = useState<"particles" | "sketches" | "blueprints" | "products">("particles");
  const [ideasTriggered, setIdeasTriggered] = useState(0);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dynamic sizing based on canvas bounding container
    const resizeCanvas = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Seed initial thought particles
    const particles: ThoughtParticle[] = [];
    const count = 70;
    for (let i = 0; i < count; i++) {
      particles.push(new ThoughtParticle(canvas.width, canvas.height, "dot"));
    }

    let animationFrameId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw standard blueprint backing grid
      ctx.strokeStyle = "rgba(17,17,17,0.03)";
      ctx.lineWidth = 0.6;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw mathematical core vectors
      ctx.strokeStyle = "rgba(0, 87, 255, 0.08)";
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 120, 0, Math.PI * 2);
      ctx.stroke();

      // Track connecting nodes
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.update(canvas.width, canvas.height);

        // Render point particles style
        ctx.fillStyle = pipelineState === "particles" 
          ? `rgba(17, 17, 17, ${p1.opacity})` 
          : pipelineState === "blueprints"
            ? `rgba(0, 87, 255, ${p1.opacity + 0.2})`
            : `rgba(0, 200, 255, ${p1.opacity})`;
            
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fill();

        // DRAW SKETCH / BLUEPRINT LINES: Connect nearby particles if close enough
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const connectLimit = pipelineState === "particles" ? 65 : pipelineState === "sketches" ? 110 : 160;

          if (dist < connectLimit) {
            const opacityFactor = (1 - dist / connectLimit) * 0.15;
            
            if (pipelineState === "particles") {
              ctx.strokeStyle = `rgba(17, 17, 17, ${opacityFactor})`;
              ctx.lineWidth = 0.5;
            } else if (pipelineState === "sketches") {
              // Raw pencil sketch feeling with slight jitter
              ctx.strokeStyle = `rgba(100, 100, 100, ${opacityFactor * 1.5})`;
              ctx.lineWidth = 0.6;
            } else if (pipelineState === "blueprints") {
              // High precision cyan & blue vector blueprint line
              ctx.strokeStyle = `rgba(0, 87, 255, ${opacityFactor * 2})`;
              ctx.lineWidth = 0.8;
            } else {
              // Product meshes: connection matrix with solid facets
              ctx.strokeStyle = `rgba(0, 190, 240, ${opacityFactor * 2.5})`;
              ctx.lineWidth = 1;
              if (dist < 60 && Math.random() < 0.05) {
                ctx.fillStyle = `rgba(0, 87, 255, 0.015)`;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.lineTo(canvas.width / 2 + (Math.random() - 0.5) * 10, canvas.height / 2 + (Math.random() - 0.5) * 10);
                ctx.closePath();
                ctx.fill();
              }
            }
            
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw holographic blueprints overlaid on active state
      if (pipelineState === "blueprints" || pipelineState === "products") {
        ctx.strokeStyle = "rgba(0,87,255,0.4)";
        ctx.lineWidth = 0.8;
        ctx.strokeRect(canvas.width / 2 - 140, canvas.height / 2 - 140, 280, 280);
        
        // Target scope axes
        ctx.strokeStyle = "rgba(0,87,255,0.15)";
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, canvas.height / 2 - 180);
        ctx.lineTo(canvas.width / 2, canvas.height / 2 + 180);
        ctx.moveTo(canvas.width / 2 - 180, canvas.height / 2);
        ctx.lineTo(canvas.width / 2 + 180, canvas.height / 2);
        ctx.stroke();
        
        // Calibration values
        ctx.fillStyle = "#0057FF";
        ctx.font = "8px monospace";
        ctx.fillText("ALIGN_LOCK: ON", canvas.width / 2 - 130, canvas.height / 2 - 146);
        ctx.fillText("MATRIX: 339x485", canvas.width / 2 + 60, canvas.height / 2 - 146);
      }

      // Products representation (wireframe complex geometric cube rotating)
      if (pipelineState === "products") {
        const time = Date.now() * 0.0006;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const size = 65;

        // Simple 3D cube vertex rotation projection
        const vertices = [
          { x: -1, y: -1, z: -1 }, { x: 1, y: -1, z: -1 },
          { x: 1, y: 1, z: -1 }, { x: -1, y: 1, z: -1 },
          { x: -1, y: -1, z: 1 }, { x: 1, y: -1, z: 1 },
          { x: 1, y: 1, z: 1 }, { x: -1, y: 1, z: 1 }
        ];

        const projected = vertices.map(v => {
          // rotate Z
          let x = v.x * Math.cos(time) - v.y * Math.sin(time);
          let y = v.x * Math.sin(time) + v.y * Math.cos(time);
          let z = v.z;
          // rotate X
          let y2 = y * Math.cos(time * 0.6) - z * Math.sin(time * 0.6);
          let z2 = y * Math.sin(time * 0.6) + z * Math.cos(time * 0.6);
          
          const depth = 2.5 + z2 * 0.4;
          return {
            x: cx + (x * size) / depth,
            y: cy + (y2 * size) / depth,
            z: z2
          };
        });

        // Face connection rendering
        const faces = [
          [0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4],
          [2, 3, 7, 6], [0, 3, 7, 4], [1, 2, 6, 5]
        ];

        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.strokeStyle = "#0057FF";
        ctx.lineWidth = 1.2;

        faces.forEach(f => {
          ctx.beginPath();
          ctx.moveTo(projected[f[0]].x, projected[f[0]].y);
          ctx.lineTo(projected[f[1]].x, projected[f[1]].y);
          ctx.lineTo(projected[f[2]].x, projected[f[2]].y);
          ctx.lineTo(projected[f[3]].x, projected[f[3]].y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [pipelineState]);

  // Click on canvas to spawn immediate idea sparks
  const handlePulseTrigger = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    setIdeasTriggered(prev => prev + 1);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 md:p-20 overflow-hidden bg-[#F6F6F4]">
      {/* Absolute canvas node container */}
      <div 
        ref={containerRef}
        onClick={handlePulseTrigger}
        className="absolute inset-0 z-0 cursor-crosshair active:scale-[0.99] transition-transform duration-200"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Top Header Information */}
      <div className="z-10 flex justify-between items-start font-mono text-[9px] tracking-widest text-[#111111]/60">
        <div>CHAMBER: THINKING ENGINE</div>
        <div className="text-right">
          <div>PIPELINE STATE: {pipelineState.toUpperCase()}</div>
          <div>ACTIVE NODES: 70 // FORCE SPARKED: {ideasTriggered}</div>
        </div>
      </div>

      {/* Main Content Stage */}
      <div className="z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center my-auto">
        <div className="lg:col-span-5 flex flex-col items-start gap-4 bg-white/70 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-neutral-300/30 shadow-premium">
          <div className="text-[10px] font-mono tracking-widest text-[#0057FF] font-semibold uppercase">
            IDEA EVOLUTION PIPELINE
          </div>
          
          <h2 className="font-display font-light text-4xl leading-tight text-[#111111] tracking-tight">
            Crystallizing <br/>
            Abstract Idea streams.
          </h2>

          <p className="text-xs text-neutral-500 leading-relaxed font-sans font-light">
            In our lab, thoughts undergo rigorous automated crystallization. Watch the network state adapt in real time as simple floating node lines expand, blueprint parameters lock, and physical products emerge.
          </p>

          {/* Interactive Pipeline State Controllers */}
          <div className="flex flex-col gap-2 w-full mt-4 border-t border-neutral-200/50 pt-4">
            <div className="text-[9px] font-mono tracking-widest text-neutral-400 mb-1">
              SELECT ASSEMBLY DEPTH:
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "particles", label: "01. RAW THOUGHTS", icon: Lightbulb, color: "#111111" },
                { id: "sketches", label: "02. CAD SKETCHES", icon: Layers, color: "#646464" },
                { id: "blueprints", label: "03. VECTOR SCHEMAS", icon: FileText, color: "#0057FF" },
                { id: "products", label: "04. PRODUCT CORE", icon: Package, color: "#00C8FF" },
              ].map((stage) => {
                const ActiveIcon = stage.icon;
                const isSelected = pipelineState === stage.id;
                return (
                  <button
                    key={stage.id}
                    onClick={() => setPipelineState(stage.id as any)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 text-left rounded-lg border font-mono text-[9px] tracking-wider transition-all duration-300 ${
                      isSelected
                        ? "bg-[#111111] text-white border-neutral-900 shadow-premium"
                        : "bg-white hover:bg-[#F6F6F4] text-neutral-600 border-neutral-200"
                    }`}
                  >
                    <ActiveIcon className={`w-3.5 h-3.5 ${isSelected ? "text-[#00C8FF]" : "text-neutral-400"}`} />
                    <span>{stage.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col items-center justify-center relative min-h-[140px] pointer-events-none">
          {/* Animated floating prompt instructions */}
          <div className="glass-panel text-[10px] font-mono tracking-wider px-4 py-2.5 rounded-lg border border-neutral-200 text-[#0057FF] flex items-center gap-2 bg-white/90 shadow-premium animate-bounce max-w-xs text-center">
            <span>[CLICK STAGE TO SPARK LOCAL ATTRACTIONS]</span>
          </div>
        </div>
      </div>

      {/* Bottom Footer Details */}
      <div className="z-10 flex justify-between items-end font-mono text-[9px] tracking-widest text-[#111111]/40">
        <div>DIETER RAMS GRID MAPPING: 1.0</div>
        <div>STATION: L-02 // CORE_MINDSET</div>
      </div>
    </div>
  );
}
