import React, { useState } from "react";
import { motion } from "motion/react";
import { Send, CheckCircle, Flame, Mail, ExternalLink, Power, Star, MessageSquare } from "lucide-react";

interface ChamberProps {
  isActive: boolean;
  onCollapseToggle: () => void;
}

export default function Chamber09Contact({ isActive, onCollapseToggle }: ChamberProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setEmail("");
      setMessage("");
    }, 1500);
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 md:p-20 overflow-hidden bg-[#F6F6F4]">
      
      {/* Background Subtle vectors */}
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none flex items-center justify-center">
        <div className="w-[300px] h-[300px] border border-neutral-300 rounded-full animate-pulse flex items-center justify-center">
          <div className="w-[180px] h-[180px] border border-dashed border-neutral-400 rounded-full" />
        </div>
      </div>

      {/* Top Header */}
      <div className="z-10 flex justify-between items-start font-mono text-[9px] tracking-widest text-[#111111]/60">
        <div>TERMINUS: L-09 // GATEWAY ENTRANCE SUMMARY</div>
        <div>STATE: TRANSMISSION SECURE</div>
      </div>

      {/* Main split dashboard stage */}
      <div className="z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center my-auto">
        
        {/* Left Side: Minimal inputs */}
        <div className="lg:col-span-6 flex flex-col items-start gap-4 text-left pointer-events-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-neutral-200 shadow-premium rounded-full text-[10px] text-[#0057FF] font-mono font-bold">
            <Mail className="w-3.5 h-3.5" />
            <span>TRANSMIT SCIENTIFIC INQUIRIES</span>
          </div>

          <h2 className="font-display font-light text-5xl tracking-tighter text-[#111111] leading-none mb-1">
            Initiate Contact<span className="text-[#0057FF]">.</span>
          </h2>

          <p className="text-xs text-neutral-500 font-sans font-light leading-relaxed max-w-sm">
            Input your communication address below to synchronize with our project developments, newsletter updates, and product prototypes.
          </p>

          <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-3 mt-2">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-white border border-green-200 text-green-700 rounded-xl text-xs font-mono tracking-wide flex items-center gap-3 shadow-premium"
              >
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-bold uppercase text-[9px]">DIALECT_PACKET_SENT [OK]</span>
                  <span className="text-neutral-500 opacity-80 mt-0.5">Your email address has been logged in G.Lab.</span>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[8px] text-neutral-400 tracking-wider">COGNITIVE ADDRESS (EMAIL):</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3.5 py-3 bg-white border border-neutral-200 focus:border-[#0057FF] text-xs text-neutral-800 rounded-lg outline-none font-sans font-light transition-all shadow-inner"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[8px] text-neutral-400 tracking-wider">PROJECT INTENT DESCRIPTION (MESSAGE):</span>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Requesting system specs or hardware updates..."
                    className="w-full h-20 p-3 bg-white border border-neutral-200 focus:border-[#0057FF] text-xs text-neutral-800 rounded-lg outline-none font-sans font-light resize-none transition-all shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-3 bg-[#111111] hover:bg-[#0057FF] active:scale-[0.98] transition-all text-white font-mono text-[10px] tracking-wider rounded-lg flex items-center justify-between shadow-premium disabled:opacity-50 cursor-pointer"
                >
                  <span>{isSubmitting ? "TRANSMITTING DATA PACKETS..." : "TRANSMIT COORDINATE ENVELOPE"}</span>
                  <Send className="w-3.5 h-3.5 fill-white text-white" />
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right Side: Network Directory logs */}
        <div className="lg:col-span-6 flex flex-col gap-5 text-left pointer-events-auto bg-white/70 backdrop-blur-md p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-premium">
          <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
            <span className="font-mono text-[9px] text-[#111111]/40 tracking-widest font-bold">DIRECTORY ARCHIVE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#0057FF]" />
          </div>

          <div className="flex flex-col gap-4">
            {/* Social directories */}
            <div>
              <span className="font-mono text-[8px] text-neutral-400 tracking-widest block mb-2">TELEVISION COGNITIVE SOCIALS</span>
              <div className="grid grid-cols-2 gap-2 font-mono text-[9px]">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg text-neutral-700 hover:text-[#0057FF] transition-all group"
                >
                  <span>GITHUB DIR</span>
                  <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-[#0057FF] transition-colors" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg text-neutral-700 hover:text-[#0057FF] transition-all group"
                >
                  <span>TWITTER STACK</span>
                  <ExternalLink className="w-3 h-3 text-neutral-400 group-hover:text-[#0057FF] transition-colors" />
                </a>
              </div>
            </div>

            {/* Micro details panel */}
            <div>
              <span className="font-mono text-[8px] text-neutral-400 tracking-widest block mb-2 font-bold uppercase text-left">CHAMBER METADATA METEOROLOGY</span>
              <div className="bg-[#F6F6F4] p-3 rounded-lg border border-neutral-200 flex flex-col gap-1.5 font-mono text-[8.5px] text-neutral-500">
                <div className="flex justify-between">
                  <span>CONGRUENCE LOCK:</span>
                  <span className="text-neutral-800 font-bold">STABLE 99%</span>
                </div>
                <div className="flex justify-between">
                  <span>ENGINE METRIC:</span>
                  <span className="text-neutral-800 font-bold">COOPER-RAMS 1.0</span>
                </div>
              </div>
            </div>

            {/* Dynamic System Collapse triggers */}
            <div className="border-t border-neutral-100 pt-4 mt-2">
              <span className="font-mono text-[8px] text-neutral-400 tracking-widest block mb-2">LABORATORY EXPERIMENT POWER COMMANDS</span>
              
              <button
                onClick={onCollapseToggle}
                className="w-full flex items-center justify-between px-4 py-3 bg-red-50 hover:bg-red-500 hover:text-white border border-red-200 hover:border-red-500 rounded-xl font-mono text-[10px] text-red-600 transition-all duration-300 group cursor-pointer active:scale-95 shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Power className="w-3.5 h-3.5 text-current" />
                  <span className="font-bold">COLLAPSE LABORATORY COGNITIVE CORES</span>
                </div>
                <span className="bg-white group-hover:bg-red-400 text-red-600 group-hover:text-white font-mono text-[7.5px] px-2 py-0.5 border border-red-200 group-hover:border-red-400 rounded-md transition-colors uppercase font-bold">
                  [SHUTDOWN]
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Details */}
      <div className="z-10 flex justify-between items-end font-mono text-[9px] tracking-widest text-[#111111]/40">
        <div>TERMINATION SECTIONS CONFIRMED: G.LAB OVER</div>
        <div>STATION: L-09 // FINAL_DEPARTURE</div>
      </div>
    </div>
  );
}
