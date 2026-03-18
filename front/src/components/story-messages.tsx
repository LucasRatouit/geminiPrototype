import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface StoryMessagesProps {
  messages: string[];
}

/**
 * Composant affichant le fil de l'histoire (messages de l'IA et actions du joueur).
 */
export function StoryMessages({ messages }: StoryMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas à chaque nouveau message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      className="w-full flex-1 space-y-4 overflow-y-auto mb-4 scrollbar-thin pr-2 transition-all"
    >
      {messages.map((message, index) => {
        const isPlayer = index % 2 === 0;
        return (
          <div
            key={index}
            className={cn(
              "max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-2",
              isPlayer
                ? "bg-primary text-primary-foreground rounded-bl-none border border-primary/20 mr-auto"
                : "bg-muted text-muted-foreground rounded-br-none border border-neutral-700/50 ml-auto",
            )}
          >
            <p className="leading-relaxed">{message.story || message}</p>
          </div>
        );
      })}

      {messages.length === 0 && (
        <div className="h-full flex items-center justify-center text-muted-foreground/40 italic">
          Le silence règne... Commencez votre aventure.
        </div>
      )}
    </div>
  );
}
