import { Loader, SendHorizonal } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface GameInputProps {
  prompt: string;
  setPrompt: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  placeholder?: string;
}

/**
 * GameInput modernisé avec animations et feedback visuel.
 */
export function GameInput({
  prompt,
  setPrompt,
  onSubmit,
  isLoading,
  placeholder = "Décrivez une action...",
}: GameInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSubmit();
  };

  const isDisabled = isLoading || !prompt.trim();

  return (
    <div className="w-full relative group p-1.5 rounded-xl bg-gradient-to-r from-primary/10 via-transparent to-primary/10 border border-white/5 shadow-2xl backdrop-blur-sm">
      <form
        className="w-full flex gap-x-2 items-center"
        onSubmit={handleSubmit}
      >
        <div className="relative flex-1">
          <Input
            disabled={isLoading}
            className={cn(
              "w-full bg-card/40 border-none h-11 px-4 text-sm transition-all duration-300 ring-0 focus-visible:ring-1 focus-visible:ring-primary/40",
              isLoading && "opacity-70"
            )}
            placeholder={placeholder}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          {/* Indicateur de saisie discret */}
          {!isLoading && prompt.length > 0 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/40 font-mono">
              {prompt.length}
            </div>
          )}
        </div>

        <Button
          disabled={isDisabled}
          variant="secondary"
          size="icon"
          className={cn(
            "h-10 w-10 shrink-0 rounded-lg transition-all duration-500 shadow-lg",
            isDisabled 
              ? "bg-muted/20 opacity-40 cursor-not-allowed" 
              : "bg-primary text-primary-foreground hover:scale-105 active:scale-95 hover:shadow-primary/20 shadow-xl"
          )}
          type="submit"
        >
          {isLoading ? (
            <Loader className="h-5 w-5 animate-spin" />
          ) : (
            <SendHorizonal className={cn(
              "h-5 w-5 transition-transform",
              !isDisabled && "group-hover:translate-x-0.5"
            )} />
          )}
        </Button>
      </form>
    </div>
  );
}
