import { Loader, SendHorizonal, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameInputProps {
  prompt: string;
  setPrompt: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  placeholder?: string;
  onSuggest?: () => void;
  isSuggesting?: boolean;
}

export function GameInput({
  prompt,
  setPrompt,
  onSubmit,
  isLoading,
  placeholder = "Décrivez une action...",
  onSuggest,
  isSuggesting,
}: GameInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSubmit();
  };

  const isDisabled = isLoading || !prompt.trim();
  const showSuggest = !prompt.trim() && !isLoading && onSuggest;

  return (
    <div
      className="w-full relative p-1 rounded-xl shadow-2xl"
      style={{
        background: "linear-gradient(135deg, rgba(201,162,39,0.08), rgba(8,6,13,0.6), rgba(201,162,39,0.08))",
        border: "1px solid rgba(201,162,39,0.15)",
        boxShadow: "0 0 30px rgba(0,0,0,0.4), 0 0 15px rgba(201,162,39,0.05)",
      }}
    >
      <form className="w-full flex gap-x-2 items-center" onSubmit={handleSubmit}>
        {showSuggest && (
          <button
            type="button"
            onClick={onSuggest}
            disabled={isSuggesting}
            className={cn(
              "h-10 w-10 shrink-0 rounded-lg transition-all duration-500 flex items-center justify-center",
              isSuggesting && "animate-pulse"
            )}
            style={{
              background: "linear-gradient(135deg, rgba(201,162,39,0.12), rgba(201,162,39,0.2))",
              border: "1px solid rgba(201,162,39,0.3)",
              boxShadow: "0 0 15px rgba(201,162,39,0.1), inset 0 1px 0 rgba(255,255,255,0.08)",
              color: "var(--gold-bright)",
            }}
            title="Demander une inspiration au conteur"
          >
            {isSuggesting ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Lightbulb className="h-4 w-4" />
            )}
          </button>
        )}
        <div className="relative flex-1">
          <input
            disabled={isLoading}
            className={cn(
              "w-full h-11 px-4 text-sm transition-all duration-300 rounded-lg outline-none",
              "bg-black/40 border border-transparent",
              "text-parchment placeholder:text-parchment-dim/40",
              "focus:border-primary/30 focus:bg-black/50",
              "focus:shadow-[0_0_20px_rgba(201,162,39,0.08)]",
              isLoading && "opacity-60 cursor-not-allowed"
            )}
            style={{ fontFamily: "'IM Fell English', serif" }}
            placeholder={placeholder}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={(e) => {
              setTimeout(() => {
                e.target.scrollIntoView({ behavior: "smooth", block: "end" });
              }, 300);
            }}
          />
          {!isLoading && prompt.length > 0 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-parchment-dim/30 font-mono tabular-nums">
              {prompt.length}
            </div>
          )}
        </div>

        <button
          disabled={isDisabled}
          type="submit"
          className={cn(
            "h-10 w-10 shrink-0 rounded-lg transition-all duration-500 flex items-center justify-center cursor-pointer",
            isDisabled
              ? "bg-muted/20 opacity-30 cursor-not-allowed"
              : "cursor-pointer hover:scale-105 active:scale-95"
          )}
          style={
            !isDisabled
              ? {
                  background: "linear-gradient(135deg, rgba(201,162,39,0.2), rgba(201,162,39,0.35))",
                  border: "1px solid rgba(201,162,39,0.4)",
                  boxShadow: "0 0 15px rgba(201,162,39,0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
                  color: "var(--gold-bright)",
                }
              : {
                  border: "1px solid rgba(201,162,39,0.08)",
                  color: "rgba(201,162,39,0.3)",
                }
          }
        >
          {isLoading ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <SendHorizonal className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  );
}