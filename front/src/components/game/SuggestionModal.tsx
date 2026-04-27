import { Lightbulb, X, Sparkles } from "lucide-react";
import { useEffect } from "react";

interface SuggestionModalProps {
  suggestions: string[];
  isLoading: boolean;
  onSelect: (suggestion: string) => void;
  onClose: () => void;
}

export function SuggestionModal({
  suggestions,
  isLoading,
  onSelect,
  onClose,
}: SuggestionModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(8, 6, 13, 0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-300"
        style={{
          background: "linear-gradient(160deg, rgba(18, 16, 26, 0.98), rgba(12, 10, 20, 0.98))",
          border: "1px solid rgba(201, 162, 39, 0.2)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 60px rgba(201,162,39,0.06), inset 0 1px 0 rgba(201,162,39,0.1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(201, 162, 39, 0.12)",
                border: "1px solid rgba(201, 162, 39, 0.25)",
                boxShadow: "0 0 12px rgba(201,162,39,0.15)",
              }}
            >
              <Lightbulb size={16} style={{ color: "var(--gold)", filter: "drop-shadow(0 0 4px rgba(201,162,39,0.5))" }} />
            </div>
            <div>
              <h3
                className="text-sm font-bold tracking-wider"
                style={{ fontFamily: "'Cinzel', serif", color: "var(--gold)" }}
              >
                L'INSPIRATION DU CONTEUR
              </h3>
              <p className="text-[11px] text-parchment-dim/50 mt-0.5" style={{ fontFamily: "'IM Fell English', serif" }}>
                Choisissez une piste narrative...
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{
              background: "rgba(201, 162, 39, 0.06)",
              border: "1px solid rgba(201, 162, 39, 0.12)",
              color: "rgba(201, 162, 39, 0.5)",
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="relative">
              <Sparkles size={28} className="animate-pulse" style={{ color: "var(--gold)", filter: "drop-shadow(0 0 8px rgba(201,162,39,0.4))" }} />
              <div
                className="absolute inset-0 rounded-full animate-ping"
                style={{ background: "rgba(201,162,39,0.1)", transform: "scale(1.8)" }}
              />
            </div>
            <p className="text-parchment-dim/50 text-sm italic" style={{ fontFamily: "'IM Fell English', serif" }}>
              Le conteur réfléchit aux possibilités...
            </p>
          </div>
        )}

        {/* Suggestions list */}
        {!isLoading && suggestions.length > 0 && (
          <div className="flex flex-col gap-3">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSelect(suggestion)}
                className="group text-left w-full p-4 rounded-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: "linear-gradient(135deg, rgba(201,162,39,0.04), rgba(201,162,39,0.01))",
                  border: "1px solid rgba(201, 162, 39, 0.1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(201,162,39,0.1), rgba(201,162,39,0.03))";
                  e.currentTarget.style.borderColor = "rgba(201, 162, 39, 0.25)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(201,162,39,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(201,162,39,0.04), rgba(201,162,39,0.01))";
                  e.currentTarget.style.borderColor = "rgba(201, 162, 39, 0.1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                    style={{
                      background: "rgba(201,162,39,0.1)",
                      border: "1px solid rgba(201,162,39,0.25)",
                      color: "var(--gold)",
                    }}
                  >
                    {index + 1}
                  </span>
                  <p
                    className="text-[13px] leading-relaxed text-parchment/80 group-hover:text-parchment/95 transition-colors"
                    style={{ fontFamily: "'IM Fell English', serif" }}
                  >
                    {suggestion}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && suggestions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <p className="text-parchment-dim/40 text-sm italic" style={{ fontFamily: "'IM Fell English', serif" }}>
              Aucune inspiration n'a filtré à travers le voile...
            </p>
          </div>
        )}

        {/* Footer hint */}
        <div className="mt-5 pt-4 text-center" style={{ borderTop: "1px solid rgba(201,162,39,0.06)" }}>
          <p className="text-[10px] text-parchment-dim/30 tracking-wide" style={{ fontFamily: "'Cinzel', serif" }}>
            CLIQUEZ SUR UNE SUGGESTION POUR L'ADAPTER
          </p>
        </div>
      </div>
    </div>
  );
}
