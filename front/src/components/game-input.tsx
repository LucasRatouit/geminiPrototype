import { Loader, SendHorizonal } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface GameInputProps {
  prompt: string;
  setPrompt: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  placeholder?: string;
}

/**
 * Composant gérant la saisie utilisateur et l'envoi d'actions.
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

  return (
    <form
      className="w-full flex gap-x-2 justify-center items-center pb-2"
      onSubmit={handleSubmit}
    >
      <Input
        disabled={isLoading}
        className="w-full bg-card"
        placeholder={placeholder}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <Button
        disabled={isLoading || !prompt.trim()}
        className="cursor-pointer"
        type="submit"
      >
        {isLoading ? (
          <Loader className="animate-spin" />
        ) : (
          <SendHorizonal />
        )}
      </Button>
    </form>
  );
}
