import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";

type AIMessage = { story: string; actions?: string[]; xp?: number; hp?: number; mana?: number };
type MessageContent = string | AIMessage;
interface Message {
  sender: "player" | "narrator";
  content: MessageContent;
}

interface StoryMessagesProps {
  messages: Message[];
  onChoiceClick?: (choice: string) => void;
}

const extractRaw = (content: MessageContent): string =>
  typeof content === "string" ? content : content.story;

export const cleanNarrativeText = (text: string): string =>
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
    .replace(/\[VIE:[+-]?\d+\]/g, "")
    .replace(/\[MANA:[+-]?\d+\]/g, "")
    .replace(/\[NOUVEAU_PERSO:[^\]]+\]/g, "")
    .replace(/\[MAJ_PERSO:[^\]]+\]/g, "")
    .replace(/\[THEME:[^\]]+\]/g, "")
    .replace(/\[REP:[^\]]+\]/g, "")
    .replace(/\[PAROLE:([^\]]+)\]([\s\S]*?)\[\/PAROLE\]/g, "$2")
    .trim();

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\])/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**"))
          return <strong key={i} className="text-primary/90">{part.slice(2, -2)}</strong>;
        if (part.startsWith("*") && part.endsWith("*"))
          return <em key={i} className="text-parchment/70">{part.slice(1, -1)}</em>;
        if (part.startsWith("[") && part.endsWith("]"))
          return <span key={i} className="text-primary/60 italic">✦ {part.slice(1, -1)} ✦</span>;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function NarrativeBlock({ text, onChoiceClick }: { text: string; onChoiceClick?: (c: string) => void }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        const choiceMatch = trimmed.match(/^(\d+)[.)]\s*(.+)/);
        if (choiceMatch) {
          const num = choiceMatch[1];
          const choiceText = choiceMatch[2];
          return (
            <button
              key={i}
              onClick={() => onChoiceClick?.(choiceText)}
              className="group flex items-start gap-2.5 w-full text-left py-1.5 px-3 rounded-md transition-all duration-200 cursor-pointer"
              style={{
                background: "linear-gradient(90deg, rgba(201,162,39,0.06), transparent)",
                borderLeft: "2px solid rgba(201,162,39,0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(90deg, rgba(201,162,39,0.12), transparent)";
                e.currentTarget.style.borderLeftColor = "rgba(201,162,39,0.7)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(90deg, rgba(201,162,39,0.06), transparent)";
                e.currentTarget.style.borderLeftColor = "rgba(201,162,39,0.3)";
              }}
            >
              <span
                className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold mt-0.5"
                style={{
                  background: "rgba(201,162,39,0.1)",
                  border: "1px solid rgba(201,162,39,0.3)",
                  color: "var(--gold)",
                }}
              >
                {num}
              </span>
              <span className="text-[13px] leading-relaxed text-parchment/85 italic" style={{ fontFamily: "'IM Fell English', serif" }}>
                <RichText text={choiceText} />
              </span>
            </button>
          );
        }

        const isAllCaps = /^[A-ZÀÂÇÉÈÊËÎÏÔÛÙÜŸÆŒ]{4,}$/.test(trimmed);
        if (isAllCaps) {
          return (
            <span key={i} className="text-primary/80 font-bold tracking-wider text-[11px]" style={{ fontFamily: "'Cinzel', serif" }}>
              {trimmed}
            </span>
          );
        }

        return (
          <p key={i} className="text-[13px] leading-[1.85] text-parchment/80" style={{ fontFamily: "'IM Fell English', serif" }}>
            <RichText text={trimmed} />
          </p>
        );
      })}
    </div>
  );
}

export function StoryMessages({ messages, onChoiceClick }: StoryMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const filteredMessages = messages.filter((message) => {
    const text = cleanNarrativeText(extractRaw(message.content));
    return text && text.trim().length > 0;
  });

  return (
    <div
      ref={scrollRef}
      className="w-full flex-1 overflow-y-auto mb-3 px-1 sm:px-4 scrollbar-none mask-fade-out"
    >
      <div className="flex flex-col gap-5 py-2 sm:py-4 pb-8">
        {filteredMessages.map((message, index) => {
          const isPlayer = message.sender === "player";
          const displayText = cleanNarrativeText(extractRaw(message.content));

          if (isPlayer) {
            return (
              <div key={index} className="flex justify-end message-reveal">
                <div className="flex gap-2 max-w-[85%] sm:max-w-[70%] flex-row-reverse">
                  <div
                    className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center border mt-1"
                    style={{ background: "rgba(201,162,39,0.08)", borderColor: "rgba(201,162,39,0.2)" }}
                  >
                    <span className="text-[11px]">🌸</span>
                  </div>
                  <div
                    className="relative px-4 py-3 rounded-2xl rounded-tr-sm text-[13px] leading-relaxed shadow-lg"
                    style={{
                      background: "linear-gradient(135deg, rgba(201,162,39,0.1), rgba(201,162,39,0.04))",
                      border: "1px solid rgba(201,162,39,0.18)",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(201,162,39,0.08)",
                    }}
                  >
                    <span
                      className="block text-[8px] uppercase tracking-[2px] font-bold mb-1 text-right opacity-40"
                      style={{ fontFamily: "'Cinzel', serif", color: "var(--gold)" }}
                    >
                      ✦ ÉLYSIA ✦
                    </span>
                    <p className="whitespace-pre-wrap text-parchment/90 italic" style={{ fontFamily: "'IM Fell English', serif" }}>
                      {displayText}
                    </p>
                    <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(201,162,39,0.06), transparent)" }} />
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={index} className="flex justify-start message-reveal">
              <div className="flex gap-2.5 max-w-[90%] sm:max-w-[78%]">
                <div
                  className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center border mt-1"
                  style={{
                    background: "rgba(201,162,39,0.12)",
                    borderColor: "rgba(201,162,39,0.25)",
                    boxShadow: "0 0 10px rgba(201,162,39,0.15)",
                  }}
                >
                  <Sparkles size={12} style={{ color: "var(--gold)", filter: "drop-shadow(0 0 3px rgba(201,162,39,0.5))" }} />
                </div>
                <div
                  className="relative px-4 py-3 rounded-2xl rounded-tl-sm text-[13px] leading-relaxed shadow-xl"
                  style={{
                    background: "linear-gradient(160deg, rgba(12,10,20,0.95), rgba(8,6,13,0.98))",
                    border: "1px solid rgba(201,162,39,0.12)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,162,39,0.06), 0 0 40px rgba(201,162,39,0.03)",
                  }}
                >
                  <span className="absolute top-2 left-3 text-[8px] opacity-25" style={{ color: "var(--gold)" }}>❧</span>
                  <span className="absolute top-2 right-3 text-[8px] opacity-25" style={{ color: "var(--gold)" }}>❧</span>
                  <div
                    className="text-[7px] uppercase tracking-[3px] font-bold mb-2.5 text-center opacity-60"
                    style={{ fontFamily: "'Cinzel', serif", color: "var(--gold)" }}
                  >
                    ✦ Le Conteur ✦
                  </div>
                  <NarrativeBlock text={displayText} onChoiceClick={onChoiceClick} />
                </div>
              </div>
            </div>
          );
        })}

        {messages.length === 0 && (
          <div className="h-40 flex flex-col items-center justify-center gap-3">
            <Sparkles className="animate-pulse" size={32} style={{ color: "var(--gold)", filter: "drop-shadow(0 0 8px rgba(201,162,39,0.4))" }} />
            <p className="text-parchment-dim/40 italic text-sm tracking-wide" style={{ fontFamily: "'IM Fell English', serif" }}>
              L'écheveau du destin attend votre premier mot...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export { extractRaw };
export type { Message as StoryMessage, AIMessage, MessageContent };