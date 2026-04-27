import { Zap, Globe, Sparkles, Check } from "lucide-react";
import type { GenerationMode } from "@/hooks/useAI";

interface ModelSelectorTabProps {
  mode: GenerationMode;
  setMode: (m: GenerationMode) => void;
}

interface ProviderInfo {
  id: GenerationMode;
  name: string;
  model: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const PROVIDERS: ProviderInfo[] = [
  {
    id: "ollama-stream",
    name: "Ollama",
    model: "qwen3.5:9b",
    icon: <Zap size={24} />,
    description:
      "Modèle local via Ollama. Réponses rapides, 100% offline. Idéal pour les sessions sans connexion.",
    color: "#22c55e",
  },
  {
    id: "openrouter-stream",
    name: "OpenRouter",
    model: "nvidia/nemotron-3-super-120b-a12b:free",
    icon: <Globe size={24} />,
    description:
      "Accès au modèle Nemotron 3 Super (120B) via OpenRouter. Qualité narrative élevée, gratuit.",
    color: "#f97316",
  },
  {
    id: "gemini",
    name: "Gemini API",
    model: "gemini-3-flash",
    icon: <Sparkles size={24} />,
    description:
      "Google Gemini Flash. Réponses structurées en JSON natif. Stable et rapide.",
    color: "#3b82f6",
  },
];

export function ModelSelectorTab({ mode, setMode }: ModelSelectorTabProps) {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">
      <div className="text-center space-y-1">
        <h2
          className="text-sm font-black tracking-[2px] uppercase gold-shimmer-text"
          style={{ fontFamily: "'Cinzel Decorative', serif" }}
        >
          Oracle des Modèles
        </h2>
        <p className="text-[10px] text-parchment-dim/60 tracking-wider uppercase">
          Choisissez l'entité qui guidera votre récit
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {PROVIDERS.map((provider) => {
          const isActive = mode === provider.id;
          return (
            <button
              key={provider.id}
              onClick={() => setMode(provider.id)}
              className="group relative text-left w-full rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden"
              style={{
                background: isActive
                  ? `linear-gradient(135deg, ${provider.color}12, ${provider.color}06)`
                  : "rgba(255,255,255,0.02)",
                borderColor: isActive
                  ? `${provider.color}50`
                  : "rgba(255,255,255,0.06)",
                boxShadow: isActive
                  ? `0 0 20px ${provider.color}15`
                  : "none",
              }}
            >
              <div className="flex items-start gap-4 p-4">
                <div
                  className="flex items-center justify-center w-12 h-12 rounded-lg shrink-0 transition-all duration-300"
                  style={{
                    background: isActive
                      ? `${provider.color}20`
                      : "rgba(255,255,255,0.04)",
                    color: isActive ? provider.color : "rgba(201,162,39,0.5)",
                    boxShadow: isActive
                      ? `0 0 12px ${provider.color}25`
                      : "none",
                  }}
                >
                  {provider.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-bold tracking-wide"
                      style={{
                        color: isActive
                          ? provider.color
                          : "var(--parchment)",
                        fontFamily: "'Cinzel', serif",
                      }}
                    >
                      {provider.name}
                    </span>
                    {isActive && (
                      <div
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider"
                        style={{
                          background: `${provider.color}20`,
                          color: provider.color,
                          border: `1px solid ${provider.color}40`,
                        }}
                      >
                        <Check size={8} />
                        Actif
                      </div>
                    )}
                  </div>

                  <code
                    className="block text-[9px] font-mono mb-1.5 truncate"
                    style={{
                      color: isActive
                        ? `${provider.color}cc`
                        : "rgba(201,162,39,0.5)",
                    }}
                  >
                    {provider.model}
                  </code>

                  <p className="text-[10px] leading-relaxed text-parchment-dim/70">
                    {provider.description}
                  </p>
                </div>
              </div>

              {isActive && (
                <div
                  className="absolute left-0 top-0 bottom-0 w-[3px]"
                  style={{
                    background: `linear-gradient(180deg, ${provider.color}, ${provider.color}80)`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div
        className="text-center text-[9px] text-parchment-dim/40 tracking-wider uppercase"
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        Le choix est sauvegardé automatiquement
      </div>
    </div>
  );
}
