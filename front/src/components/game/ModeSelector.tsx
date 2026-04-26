import { Sparkles, Zap, Globe } from "lucide-react";
import type { GenerationMode } from "@/hooks/useAI";

interface ModeSelectorProps {
  mode: GenerationMode;
  setMode: (m: GenerationMode) => void;
}

const activeStyle = {
  background: "rgba(201,162,39,0.15)",
  border: "1px solid rgba(201,162,39,0.4)",
  color: "var(--gold)",
  boxShadow: "0 0 12px rgba(201,162,39,0.15)",
};

const inactiveStyle = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "rgba(201,162,39,0.45)",
};

export function ModeSelector({ mode, setMode }: ModeSelectorProps) {
  return (
    <div className="flex justify-center gap-2 mb-1.5">
      <button
        onClick={() => setMode("ollama-stream")}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer"
        style={mode === "ollama-stream" ? activeStyle : inactiveStyle}
      >
        <Zap size={11} />
        Ollama Stream
      </button>
      <button
        onClick={() => setMode("openrouter-stream")}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer"
        style={mode === "openrouter-stream" ? activeStyle : inactiveStyle}
      >
        <Globe size={11} />
        OpenRouter
      </button>
      <button
        onClick={() => setMode("gemini")}
        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer"
        style={mode === "gemini" ? activeStyle : inactiveStyle}
      >
        <Sparkles size={11} />
        Gemini Flash
      </button>
    </div>
  );
}