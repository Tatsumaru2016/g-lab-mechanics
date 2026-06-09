import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Globe, RefreshCw, Send, CheckCircle, Languages, AlertCircle } from "lucide-react";

interface ChamberProps {
  isActive: boolean;
}

const MORPH_DICTIONARY: Record<string, Record<string, string>> = {
  "Hello World": {
    Japanese: "こんにちは世界 (Konnichiwa Sekai)",
    German: "Hallo Welt",
    French: "Bonjour le monde",
    Spanish: "Hola Mundo",
    Chinese: "你好，世界 (Nǐ hǎo, shìjiè)",
    Korean: "안녕, 세상 (Annyeong, sesang)",
    Italian: "Ciao Mondo",
  },
  "Where ideas become reality.": {
    Japanese: "アイデアが現実になる場所 (Aidea ga genjitsu ni naru basho)",
    German: "Wo Ideen Wirklichkeit werden.",
    French: "Là où les idées deviennent réalité.",
    Spanish: "Donde las ideas se hacen realidad.",
    Chinese: "点子变成现实的地方 (Diǎnzi biàn chéng xiànshí dì dìfāng)",
    Korean: "생각이 현실이 되는 곳 (Saenggagi hyeonsiri doeneun got)",
    Italian: "Dove le idee diventano realtà.",
  },
  "The future starts here.": {
    Japanese: "未来はここから始まる (Mirai wa koko kara hajimaru)",
    German: "Die Zukunft beginnt hier.",
    French: "L'avenir commence ici.",
    Spanish: "El futuro comienza aquí.",
    Chinese: "未来从这里开始 (Wèilái cóng zhèlǐ kāishǐ)",
    Korean: "미래는 여기서 시작된다 (Miraeneun yeogiseo sijakdoenda)",
    Italian: "Il futuro inizia qui.",
  }
};

const RANDOM_FLOATING_STRANDS = [
  { text: "Communication", lang: "EN" },
  { text: "コミュニケーション", lang: "JA" },
  { text: "Kommunikation", lang: "DE" },
  { text: "Comunicación", lang: "ES" },
  { text: "交流", lang: "ZH" },
  { text: "소통", lang: "KO" },
  { text: "Communication Beyond Language", lang: "EN" },
  { text: "言語を超えたコミュニケーション", lang: "JA" },
  { text: "La communication au-delà des langues", lang: "FR" },
];

export default function Chamber05Trans({ isActive }: ChamberProps) {
  const [inputText, setInputText] = useState("Where ideas become reality.");
  const [targetLang, setTargetLang] = useState("Japanese");
  const [outputText, setOutputText] = useState("アイデアが現実になる場所");
  const [isTranslating, setIsTranslating] = useState(false);
  const [animatedStrandIndex, setAnimatedStrandIndex] = useState(0);

  // Auto morph backgroud language strands at regular intervals
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedStrandIndex(prev => (prev + 1) % RANDOM_FLOATING_STRANDS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const handleTranslate = () => {
    if (!inputText.trim()) return;

    setIsTranslating(true);
    
    // Smooth translation morph simulation with a haptic feel
    setTimeout(() => {
      const matchKey = Object.keys(MORPH_DICTIONARY).find(
        key => key.toLowerCase().includes(inputText.toLowerCase()) || inputText.toLowerCase().includes(key.toLowerCase())
      );

      if (matchKey && MORPH_DICTIONARY[matchKey][targetLang]) {
        setOutputText(MORPH_DICTIONARY[matchKey][targetLang]);
      } else {
        // Generative mock mapping fallback if the phrase isn't the direct match
        const defaultTranslations: Record<string, string> = {
          Japanese: "言語の境界を破る (Gengo no kyōkai o yaburu)",
          German: "Echtzeit-Sprachsynthese",
          French: "Traduction instantanée par réseau",
          Spanish: "Transformación lingüística fluida",
          Chinese: "打破语言屏障 (Dǎpò yǔyán píngzhàng)",
          Korean: "언어의 제약을 뛰어넘다 (Eonoeui jeyageul ttwieoneomda)",
          Italian: "Comunicazione fluida senza parole",
        };
        setOutputText(defaultTranslations[targetLang] || "Synthesizing linguistic response...");
      }
      setIsTranslating(false);
    }, 1200);
  };

  useEffect(() => {
    handleTranslate();
  }, [targetLang]);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 md:p-20 overflow-hidden bg-[#F6F6F4]">
      
      {/* Floating Language Strands Layer in Background */}
      <div className="absolute inset-x-0 top-1/4 h-1/2 pointer-events-none opacity-20 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={animatedStrandIndex}
            initial={{ opacity: 0, scale: 0.85, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 0.6, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.1, y: -30, filter: "blur(10px)" }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="flex flex-col items-center gap-2 cursor-default"
          >
            <span className="font-display font-light text-5xl md:text-7xl lg:text-8xl text-[#0057FF] tracking-tight text-center">
              {RANDOM_FLOATING_STRANDS[animatedStrandIndex].text}
            </span>
            <span className="font-mono text-xs tracking-widest text-[#111111]/40">
              LOCATED DIALECT STRING: [ {RANDOM_FLOATING_STRANDS[animatedStrandIndex].lang} ]
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Top Header */}
      <div className="z-10 flex justify-between items-start font-mono text-[9px] tracking-widest text-[#111111]/60">
        <div>TRANSLATOR: L-05 // LINGUISTIC CODES</div>
        <div>MODEL: COGNITIVE TRANS ENGINE V2.4</div>
      </div>

      {/* Main Translation Portal Workspace */}
      <div className="z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto">
        
        {/* Left Typography Block */}
        <div className="lg:col-span-5 flex flex-col items-start gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-neutral-200 shadow-premium rounded-full text-[10px] text-[#00C8FF] font-mono font-bold">
            <Languages className="w-3.5 h-3.5" />
            <span>G.TRANS // COGNITIVE MORPH ENGINE</span>
          </div>

          <h2 className="font-display font-light text-5xl tracking-tighter text-[#111111] leading-none">
            Communication <br />
            Beyond Language<span className="text-[#00C8FF]">.</span>
          </h2>

          <p className="text-xs text-neutral-500 font-sans font-light leading-relaxed max-w-sm">
            We operate an ultra-low-latency pipeline that compiles verbal and symbolic intent into standardized semantic coordinates before rebuilding local dialects on the client interface in real-time.
          </p>

          <div className="bg-[#111111]/5 border border-[#111111]/10 rounded-lg p-3 flex items-start gap-2 max-w-sm mt-2">
            <AlertCircle className="w-4 h-4 text-[#0057FF] shrink-0 mt-0.5" />
            <div className="font-mono text-[8px] text-neutral-500 tracking-wider">
              SUGGESTED EXAMPLES: <br />
              - "Hello World" <br />
              - "Where ideas become reality." <br />
              - "The future starts here."
            </div>
          </div>
        </div>

        {/* Right Interactive Translation Machine Widget */}
        <div className="lg:col-span-7 flex flex-col bg-white border border-neutral-300/40 shadow-premium p-5 rounded-2xl md:p-6 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3.5 mb-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#0057FF] animate-spin-slow" />
              <span className="font-mono text-[9px] text-neutral-900 tracking-widest font-bold">
                L-05 STREAM COGNITION CAPTURE
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 font-mono text-[8px] text-neutral-400 bg-neutral-100 px-2 py-1 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span>MUTUAL CORRELATION: 99.8%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
            {/* Input Segment */}
            <div className="md:col-span-5 flex flex-col gap-1.5 text-left">
              <label className="font-mono text-[8px] text-neutral-400 tracking-widest">
                SOURCE INPUT TEXT [ ENGLISH ]
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type variable phrase here (e.g. 'Hello World')..."
                className="w-full h-24 p-3 bg-neutral-50 border border-neutral-200 hover:border-neutral-300 focus:border-[#0057FF] focus:bg-white text-xs text-neutral-800 rounded-lg outline-none font-sans font-light resize-none transition-all"
              />
            </div>

            {/* Transformer Control segment */}
            <div className="md:col-span-1 flex flex-col items-center justify-center">
              <button
                onClick={handleTranslate}
                disabled={isTranslating}
                className="p-2.5 bg-neutral-100 hover:bg-[#0057FF] hover:text-white rounded-full text-neutral-500 border border-neutral-200 transition-all cursor-pointer shadow-premium"
                title="Force dialect synthesis"
              >
                <RefreshCw className={`w-4 h-4 ${isTranslating ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Output Dialect selection segment */}
            <div className="md:col-span-5 flex flex-col gap-1.5 text-left">
              <div className="flex justify-between items-center">
                <label className="font-mono text-[8px] text-neutral-400 tracking-widest">
                  SYNTHESIZED TERMINATION DIALECT
                </label>
                
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="font-mono text-[9px] bg-neutral-50 text-[#0057FF] border border-neutral-200 rounded px-1.5 py-0.5 outline-none "
                >
                  <option value="Japanese">JAPANESE (JA)</option>
                  <option value="German">GERMAN (DE)</option>
                  <option value="French">FRENCH (FR)</option>
                  <option value="Spanish">SPANISH (ES)</option>
                  <option value="Chinese">CHINESE (ZH)</option>
                  <option value="Korean">KOREAN (KO)</option>
                  <option value="Italian">ITALIAN (IT)</option>
                </select>
              </div>

              {/* Text Out with Morph Effect */}
              <div className="w-full h-24 p-3 bg-neutral-900 border border-neutral-800 text-neutral-100 rounded-lg font-sans font-normal text-xs flex items-center justify-center relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {isTranslating ? (
                    <motion.div
                      key="trans_state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div className="w-4 h-4 rounded-full border-2 border-neutral-300 border-t-[#00C8FF] animate-spin" />
                      <span className="font-mono text-[8px] tracking-widest text-[#00C8FF]">MORPHING SEGMENTS...</span>
                    </motion.div>
                  ) : (
                    <motion.p
                      key={outputText}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-left w-full h-full font-display font-medium text-[13px] text-neutral-200 flex items-center"
                    >
                      {outputText}
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className="absolute bottom-2 right-2 border border-neutral-700/50 rounded font-mono text-[7px] tracking-wider text-neutral-500 px-1 py-0.5 bg-neutral-800">
                  <span>OUT: {targetLang.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="z-10 flex justify-between items-end font-mono text-[9px] tracking-widest text-[#111111]/40">
        <div>CORE PIPELINE ENCODING: UTF-8 BASE64 SYMETRICS</div>
        <div>STATION: L-05 // DIALECT_ENGINE</div>
      </div>
    </div>
  );
}
