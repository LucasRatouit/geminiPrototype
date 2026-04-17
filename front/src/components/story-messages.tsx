import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { User, Sparkles } from "lucide-react";

type AIMessage = { story: string; actions?: string[]; xp?: number };
type MessageContent = string | AIMessage;
interface Message {
  sender: "player" | "narrator";
  content: MessageContent;
}

interface StoryMessagesProps {
  messages: Message[];
}

const extractRaw = (content: MessageContent): string =>
  typeof content === "string" ? content : content.story;

const cleanNarrativeText = (text: string): string =>
  text
    .replace(/\[HUD_START\][\s\S]*?\[HUD_END\]/g, "")
    .replace(/\[NPC_START\][\s\S]*?\[NPC_END\]/g, "")
    .replace(/\[ARME_START\][\s\S]*?\[ARME_END\]/g, "")
    .replace(/\[ITEM_ARME\][\s\S]*?\[\/ITEM_ARME\]/g, "")
    .replace(/\[LIEU_START\][\s\S]*?\[LIEU_END\]/g, "")
    .replace(/\[DÉGÂTS:\d+\]/g, "")
    .replace(/\[RÊVE:(debut|fin)\]/g, "")
    .replace(/\[LEVEL_UP\]/g, "")
    .replace(/\[QUETE_TERMINEE:[^\]]+\]/g, "")
    .replace(/\[XP:\d+\]/g, "")
    .replace(/\[THEME:[^\]]+\]/g, "")
    .replace(/\[REP:[^\]]+\]/g, "")
    .replace(/\[PAROLE:([^\]]+)\]([\s\S]*?)\[\/PAROLE\]/g, "$2")
    .trim();

/**
 * StoryMessages modernisé : bulles immersives, typographie soignée et animations fluides.
 */
export function StoryMessages({ messages }: StoryMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      className="w-full flex-1 space-y-4 overflow-y-auto mb-4 px-2 sm:px-4 scrollbar-none mask-fade-out"
    >
      <div className="flex flex-col gap-5 py-2 sm:py-4">
        {messages
          .filter((message) => {
            const text = cleanNarrativeText(extractRaw(message.content));
            return text && text.trim().length > 0;
          })
          .map((message, index) => {
            const isPlayer = message.sender === "player";
            const displayText = cleanNarrativeText(extractRaw(message.content));

            return (
            <div
              key={index}
              className={cn(
                "flex w-full animate-in fade-in slide-in-from-bottom-3 duration-500",
                isPlayer ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "flex gap-2 sm:gap-3 max-w-[92%] sm:max-w-[75%]",
                  isPlayer ? "flex-row-reverse" : "flex-row",
                )}
              >
                {/* Avatar/Icon discret : plus petit sur mobile */}
                <div
                  className={cn(
                    "h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center shrink-0 border mt-1 shadow-sm",
                    isPlayer
                      ? "bg-primary/10 border-primary/20 text-primary"
                      : "bg-amber-500/10 border-amber-500/20 text-amber-500",
                  )}
                >
                  {isPlayer ? (
                    <User size={12} className="sm:hidden" />
                  ) : (
                    <Sparkles size={12} className="sm:hidden" />
                  )}
                  {isPlayer ? (
                    <User size={14} className="hidden sm:block" />
                  ) : (
                    <Sparkles size={14} className="hidden sm:block" />
                  )}
                </div>

                {/* Bulle de message : padding et taille de texte adaptés */}
                <div
                  className={cn(
                    "relative px-3.5 py-2.5 sm:px-5 sm:py-3.5 rounded-2xl text-[14px] sm:text-[14.5px] leading-relaxed shadow-md transition-all",
                    isPlayer
                      ? "bg-primary text-primary-foreground rounded-tr-none border border-primary/20 shadow-primary/5"
                      : "bg-card/40 backdrop-blur-md text-foreground rounded-tl-none border border-white/5 shadow-black/5",
                  )}
                >
                  {/* Petit tag de rôle : plus compact sur mobile */}
                  <span
                    className={cn(
                      "block text-[9px] sm:text-[10px] uppercase tracking-wider font-bold mb-0.5 sm:mb-1 opacity-50",
                      isPlayer ? "text-right" : "text-left",
                    )}
                  >
                    {isPlayer ? "Élysia" : "Le Conteur"}
                  </span>
                  <p className="whitespace-pre-wrap">
                    {displayText}{" "}
                  </p>{" "}
                  {isPlayer && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none rounded-2xl" />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {messages.length === 0 && (
          <div className="h-40 flex flex-col items-center justify-center text-muted-foreground/30 gap-3">
            <Sparkles className="animate-pulse" size={32} />
            <p className="italic text-sm font-medium tracking-wide">
              L'écheveau du destin attend votre premier mot...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export { cleanNarrativeText, extractRaw };
export type { Message as StoryMessage, AIMessage, MessageContent };
