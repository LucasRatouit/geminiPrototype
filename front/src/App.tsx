import { useEffect, useState, useCallback, useRef } from "react";
import {
  Navbar,
  NAV_TABS,
  DEFAULT_STATS,
  DEFAULT_THEME,
  type NavbarStats,
  type NavbarTheme,
} from "./components/navbar";
import { GameInput } from "./components/game-input";
import { StoryMessages } from "./components/story-messages";
import { cleanNarrativeText } from "./components/story-messages";
import { Sparkles, Zap } from "lucide-react";

// API Services
import { fetchMessages, resetMessages } from "./api/messages";
import { fetchGeminiResponse, fetchOpeningHook } from "./api/gemini";
import { streamOllamaResponse, streamOpeningHook } from "./api/ollama";

type Sender = "player" | "narrator";
type AIMessage = { story: string; actions?: string[]; xp?: number };
type MessageContent = string | AIMessage;
interface Message {
  sender: Sender;
  content: MessageContent;
}
type GenerationMode = "gemini" | "ollama-stream";

const SMETA = [
  { key: "strength" as const, label: "Force", icon: "⚔️", color: "#ef4444" },
  {
    key: "intelligence" as const,
    label: "Intelligence",
    icon: "🔮",
    color: "#818cf8",
  },
  { key: "spirit" as const, label: "Esprit", icon: "✨", color: "#c084fc" },
  { key: "agility" as const, label: "Agilité", icon: "🌬️", color: "#4ade80" },
  { key: "charisma" as const, label: "Charisme", icon: "💬", color: "#fbbf24" },
];

const XP_MAX_PER_TURN = 25;

function parseXpFromText(text: string): { xp: number; title?: string }[] {
  const results: { xp: number; title?: string }[] = [];
  const questRegex = /\[QUETE_TERMINEE:([^|]+)\|(\d+)\]/g;
  let match;
  while ((match = questRegex.exec(text)) !== null) {
    results.push({
      title: match[1].trim(),
      xp: Math.min(parseInt(match[2]), XP_MAX_PER_TURN),
    });
  }
  const xpRegex = /\[XP:(\d+)\]/g;
  while ((match = xpRegex.exec(text)) !== null) {
    results.push({ xp: Math.min(parseInt(match[1]), XP_MAX_PER_TURN) });
  }
  return results;
}

const extractText = (content: MessageContent): string =>
  typeof content === "string" ? content : content.story;

function App() {
  const [isPrompting, setIsPrompting] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messageList, setMessageList] = useState<Message[]>([]);
  const [generationMode, setGenerationMode] =
    useState<GenerationMode>("ollama-stream");
  const eventSourceRef = useRef<EventSource | null>(null);
  const hookGeneratedRef = useRef(false);

  const [xpToast, setXpToast] = useState<{ title?: string; xp: number } | null>(
    null,
  );
  const [lvlModal, setLvlModal] = useState(false);
  const [lvlMode, setLvlMode] = useState<"all" | "pick" | null>(null);
  const prevLevelRef = useRef(DEFAULT_STATS.level);

  // Navbar States
  const [stats, setStats] = useState<NavbarStats>(DEFAULT_STATS);
  const [theme, setTheme] = useState<NavbarTheme>(DEFAULT_THEME);
  const [tab, setTab] = useState("game");
  const [isFS, setIsFS] = useState(false);
  const [dream] = useState(false);

  const updateLastMessage = useCallback((content: MessageContent) => {
    setMessageList((prev) => {
      const newList = [...prev];
      newList[newList.length - 1] = { ...newList[newList.length - 1], content };
      return newList;
    });
  }, []);

  const getMessages = useCallback(async () => {
    try {
      const messages = await fetchMessages();
      if (messages.length > 0) {
        setMessageList(messages);
        hookGeneratedRef.current = true;
        return true;
      }
    } catch (error) {
      console.error("Erreur historique:", error);
    }
    return false;
  }, []);

  const updateXP = useCallback((gain: number, title?: string) => {
    if (!gain || gain <= 0) return;
    const cappedGain = Math.min(gain, XP_MAX_PER_TURN);

    setXpToast({ title, xp: cappedGain });
    setTimeout(() => setXpToast(null), 4000);

    setStats((prev) => {
      let newXp = prev.xp + cappedGain;
      let newLevel = prev.level;
      let newXpMax = prev.xpMax;
      let newHpMax = prev.hpMax;
      let newManaMax = prev.manaMax;

      while (newXp >= newXpMax) {
        newXp -= newXpMax;
        newLevel++;
        newXpMax = Math.floor(newXpMax * 1.2);
        newHpMax += 15;
        newManaMax += 10;
      }

      return {
        ...prev,
        xp: newXp,
        xpMax: newXpMax,
        level: newLevel,
        hpMax: newHpMax,
        hp: Math.min(prev.hp, newHpMax),
        manaMax: newManaMax,
      };
    });
  }, []);

  useEffect(() => {
    if (stats.level > prevLevelRef.current) {
      setLvlModal(true);
    }
    prevLevelRef.current = stats.level;
  }, [stats.level]);

  const doLevelAll = useCallback(() => {
    setStats((prev) => ({
      ...prev,
      hp: prev.hpMax + 15,
      hpMax: prev.hpMax + 15,
      mana: prev.manaMax + 10,
      manaMax: prev.manaMax + 10,
      strength: prev.strength + 2,
      intelligence: prev.intelligence + 2,
      spirit: prev.spirit + 2,
      agility: prev.agility + 2,
      charisma: prev.charisma + 2,
    }));
    setLvlModal(false);
    setLvlMode(null);
  }, []);

  const doLevelPick = useCallback((key: string) => {
    setStats((prev) => {
      const validKeys = [
        "strength",
        "intelligence",
        "spirit",
        "agility",
        "charisma",
      ] as const;
      if (!validKeys.includes(key as any)) return prev;
      return {
        ...prev,
        [key]: (prev as unknown as Record<string, number>)[key] + 5,
      };
    });
    setLvlModal(false);
    setLvlMode(null);
  }, []);

  const processXpFromResponse = useCallback(
    (text: string) => {
      const xpResults = parseXpFromText(text);
      for (const { xp, title } of xpResults) {
        updateXP(xp, title);
      }
    },
    [updateXP],
  );

  const generateOpeningHook = useCallback(async () => {
    setIsPrompting(true);

    if (generationMode === "ollama-stream") {
      setMessageList((prev) => [...prev, { sender: "narrator", content: "" }]);

      if (eventSourceRef.current) eventSourceRef.current.close();

      eventSourceRef.current = streamOpeningHook({
        onUpdate: (fullText) => updateLastMessage(fullText),
        onDone: (data) => {
          if (data.response) {
            updateLastMessage(data.response);
          }
          setIsPrompting(false);
          hookGeneratedRef.current = true;
        },
        onError: (err) => {
          console.error("Flux Ollama rompu (hook):", err);
          setIsPrompting(false);
          updateLastMessage("L'oracle s'est déconnecté...");
          hookGeneratedRef.current = true;
        },
      });
    } else {
      try {
        const hook = await fetchOpeningHook();
        if (hook) {
          setMessageList((prev) => [
            ...prev,
            { sender: "narrator", content: hook },
          ]);
        }
      } catch (error) {
        console.error("Erreur hook d'ouverture:", error);
        setMessageList((prev) => [
          ...prev,
          {
            sender: "narrator",
            content:
              "Une perturbation magique empêche la vision de se former...",
          },
        ]);
      } finally {
        setIsPrompting(false);
        hookGeneratedRef.current = true;
      }
    }
  }, [generationMode, updateLastMessage]);

  const generateGemini = async () => {
    if (!prompt) return;

    const userMessage = prompt;
    setPrompt("");
    setIsPrompting(true);
    setMessageList((prev) => [
      ...prev,
      { sender: "player", content: userMessage },
    ]);

    try {
      const history = messageList.map((m) => extractText(m.content));
      const text = await fetchGeminiResponse(userMessage, history);
      if (text) {
        setMessageList((prev) => [
          ...prev,
          { sender: "narrator", content: text },
        ]);
        const rawText =
          typeof text === "string" ? text : (text as AIMessage).story || "";
        processXpFromResponse(rawText);
        if (typeof text === "object" && text !== null && "xp" in text) {
          const xpVal = (text as AIMessage).xp;
          if (xpVal && xpVal > 0) updateXP(Math.min(xpVal, XP_MAX_PER_TURN));
        }
      }
    } catch (error) {
      console.error("Erreur Gemini:", error);
      setMessageList((prev) => [
        ...prev,
        { sender: "narrator", content: "Le grimoire est scellé..." },
      ]);
    } finally {
      setIsPrompting(false);
    }
  };

  const generateOllamaStream = async () => {
    if (!prompt || isPrompting) return;

    const userMessage = prompt;
    setPrompt("");
    setIsPrompting(true);

    setMessageList((prev) => [
      ...prev,
      { sender: "player", content: userMessage },
      { sender: "narrator", content: "" },
    ]);
    const history = messageList.map((m) => extractText(m.content));

    if (eventSourceRef.current) eventSourceRef.current.close();

    eventSourceRef.current = streamOllamaResponse(userMessage, history, {
      onUpdate: (fullText) => updateLastMessage(fullText),
      onDone: (data) => {
        if (data.response) {
          updateLastMessage(data.response);
          const responseText =
            typeof data.response === "string"
              ? data.response
              : data.response.story || "";
          processXpFromResponse(responseText);
          if (
            typeof data.response === "object" &&
            data.response !== null &&
            "xp" in data.response
          ) {
            const xpVal = data.response.xp;
            if (xpVal && xpVal > 0) updateXP(Math.min(xpVal, XP_MAX_PER_TURN));
          }
        }
        setIsPrompting(false);
      },
      onError: (err) => {
        console.error("Flux Ollama rompu:", err);
        setIsPrompting(false);
        updateLastMessage("L'oracle s'est déconnecté...");
      },
    });
  };

  const handleAction = () => {
    generationMode === "ollama-stream"
      ? generateOllamaStream()
      : generateGemini();
  };

  const resetGame = async () => {
    if (window.confirm("Recommencer l'aventure ?")) {
      eventSourceRef.current?.close();
      await resetMessages();
      setMessageList([]);
      hookGeneratedRef.current = false;
      setStats(DEFAULT_STATS);
      setLvlModal(false);
      setLvlMode(null);
      setXpToast(null);
      prevLevelRef.current = DEFAULT_STATS.level;
      generateOpeningHook();
    }
  };

  const toggleFS = () => {
    !document.fullscreenElement
      ? document.documentElement.requestFullscreen()
      : document.exitFullscreen();
  };

  useEffect(() => {
    const fn = () => setIsFS(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", fn);
    return () => {
      document.removeEventListener("fullscreenchange", fn);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const hasHistory = await getMessages();
      if (cancelled || hasHistory || hookGeneratedRef.current) return;

      generateOpeningHook();
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [getMessages, generateOpeningHook]);

  return (
    <div className="w-screen h-screen bg-background text-secondary-foreground flex flex-col overflow-hidden">
      <Navbar
        stats={stats}
        theme={theme}
        currentTab={tab}
        setTab={setTab}
        tabs={NAV_TABS}
        onReset={resetGame}
        onToggleFS={toggleFS}
        isFS={isFS}
        dream={dream}
        npcsCount={0}
      />

      {/* XP Toast */}
      {xpToast && (
        <div className="fixed bottom-4 right-4 z-[500] animate-in slide-in-from-right-5 fade-in duration-400">
          <div className="bg-gradient-to-br from-amber-950/95 to-yellow-950/95 border border-amber-500/40 rounded-xl px-4 py-3 shadow-2xl shadow-amber-500/10 max-w-[260px] backdrop-blur-sm">
            <div
              className="text-[8px] tracking-[2px] text-amber-600 font-bold uppercase mb-1"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              ✦ {xpToast.title ? "QUÊTE ACCOMPLIE" : "EXPÉRIENCE GAGNÉE"} ✦
            </div>
            {xpToast.title && (
              <div
                className="text-[13px] text-amber-200 font-semibold mb-1"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {xpToast.title}
              </div>
            )}
            <div className="text-[13px] text-yellow-300 font-bold">
              +{xpToast.xp} XP ⭐
            </div>
          </div>
        </div>
      )}

      {/* Level Up Modal */}
      {lvlModal && (
        <div className="fixed inset-0 z-[600] bg-black/88 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-b from-amber-950/98 to-yellow-950/98 border border-amber-400/38 rounded-xl p-6 max-w-[360px] w-full text-center shadow-2xl shadow-amber-400/14 animate-in zoom-in-95 duration-300">
            <div className="text-4xl mb-3 animate-bounce">⭐</div>
            <div
              className="text-base text-amber-200 tracking-[2px] mb-1"
              style={{ fontFamily: "'Cinzel Decorative', serif" }}
            >
              NIVEAU {stats.level} !
            </div>
            <div
              className="text-[11px] text-amber-700 italic mb-5"
              style={{ fontFamily: "'IM Fell English', serif" }}
            >
              Élysia grandit en puissance.
            </div>

            {!lvlMode && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={doLevelAll}
                  className="py-3 px-4 bg-gradient-to-br from-amber-400/13 to-yellow-600/7 border border-amber-400/32 rounded-lg text-amber-200 cursor-pointer font-bold text-[10px] tracking-[1px] transition-all hover:from-amber-400/20 hover:border-amber-400/50"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  ✦ Améliorer toutes les stats (+2 chacune, +15 PV, +10 Mana)
                </button>
                <button
                  onClick={() => setLvlMode("pick")}
                  className="py-3 px-4 bg-gradient-to-br from-purple-400/11 to-violet-600/6 border border-purple-400/28 rounded-lg text-purple-300 cursor-pointer font-bold text-[10px] tracking-[1px] transition-all hover:from-purple-400/18 hover:border-purple-400/40"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  ✦ Choisir une stat à spécialiser (+5)
                </button>
              </div>
            )}

            {lvlMode === "pick" && (
              <div>
                <div
                  className="text-[9px] text-amber-700 tracking-[1px] mb-3 uppercase"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Choisir une stat
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SMETA.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => doLevelPick(s.key)}
                      className="py-3 px-2 rounded-lg cursor-pointer text-[10px] flex items-center justify-center gap-1.5 transition-all hover:scale-105"
                      style={{
                        fontFamily: "'Cinzel', serif",
                        background: s.color + "12",
                        border: `1px solid ${s.color}38`,
                        color: s.color,
                      }}
                    >
                      {s.icon} {s.label}{" "}
                      <span className="opacity-55 text-[8px]">+5</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setLvlMode(null)}
                  className="mt-3 bg-transparent border-none text-amber-800 cursor-pointer text-[10px] italic"
                  style={{ fontFamily: "'IM Fell English', serif" }}
                >
                  ← Retour
                </button>
              </div>
            )}

            {lvlMode === "all" && (
              <div>
                <div
                  className="text-[9px] text-amber-700 tracking-[1px] mb-3 uppercase"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  Gains
                </div>
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {[
                    { icon: "❤️", label: "PV max", val: "+15" },
                    { icon: "💧", label: "Mana", val: "+10" },
                    ...SMETA.map((s) => ({
                      icon: s.icon,
                      label: s.label,
                      val: "+2",
                    })),
                  ].map((r, i) => (
                    <div
                      key={i}
                      className="bg-amber-400/5 border border-amber-400/13 rounded px-2 py-1.5 flex justify-between items-center"
                    >
                      <span
                        className="text-[10px] text-amber-700"
                        style={{ fontFamily: "'Cinzel', serif" }}
                      >
                        {r.icon} {r.label}
                      </span>
                      <span
                        className="text-[10px] text-amber-200 font-bold"
                        style={{ fontFamily: "'Cinzel', serif" }}
                      >
                        {r.val}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={doLevelAll}
                  className="w-full py-2.5 bg-gradient-to-br from-amber-400/17 to-yellow-600/9 border border-amber-400/36 rounded-lg text-amber-200 cursor-pointer font-bold text-[10px] tracking-[1px] transition-all hover:from-amber-400/25"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  ✦ Confirmer
                </button>
                <button
                  onClick={() => setLvlMode(null)}
                  className="mt-2 bg-transparent border-none text-amber-800 cursor-pointer text-[9px] italic block mx-auto"
                  style={{ fontFamily: "'IM Fell English', serif" }}
                >
                  ← Retour
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 sm:w-4/6 w-full px-2 mx-auto py-2 flex flex-col justify-between items-center overflow-hidden">
        {tab === "game" ? (
          <>
            <StoryMessages messages={messageList} />

            <div className="w-full flex flex-col gap-2">
              <div className="flex justify-center gap-2 mb-1">
                {[
                  {
                    id: "ollama-stream",
                    icon: Zap,
                    label: "Ollama Stream",
                    color: "amber",
                  },
                  {
                    id: "gemini",
                    icon: Sparkles,
                    label: "Gemini Flash",
                    color: "primary",
                  },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setGenerationMode(mode.id as GenerationMode)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      generationMode === mode.id
                        ? `bg-${mode.color === "primary" ? "primary" : "amber-500"}/20 border-${mode.color === "primary" ? "primary" : "amber-500"}/50 text-${mode.color === "primary" ? "primary" : "amber-500"}`
                        : "bg-card/40 border-white/5 text-muted-foreground hover:bg-card/60"
                    }`}
                  >
                    <mode.icon size={12} />
                    {mode.label}
                  </button>
                ))}
              </div>

              <GameInput
                prompt={prompt}
                setPrompt={setPrompt}
                onSubmit={handleAction}
                isLoading={isPrompting}
                placeholder="Décrivez l'action d'Élysia..."
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground italic text-center px-4">
            Développement en cours...
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
