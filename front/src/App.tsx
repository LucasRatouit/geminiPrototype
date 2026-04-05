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
import { Sparkles, Zap } from "lucide-react";

// API Services
import { fetchMessages } from "./api/messages";
import { fetchGeminiResponse } from "./api/gemini";
import { streamOllamaResponse } from "./api/ollama";

type AIMessage = { story: string; actions?: string[]; xp?: number };
type Message = string | AIMessage;
type GenerationMode = "gemini" | "ollama-stream";

function App() {
  const [isPrompting, setIsPrompting] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messageList, setMessageList] = useState<Message[]>([]);
  const [generationMode, setGenerationMode] =
    useState<GenerationMode>("ollama-stream");
  const eventSourceRef = useRef<EventSource | null>(null);

  // Navbar States
  const [stats, setStats] = useState<NavbarStats>(DEFAULT_STATS);
  const [theme, setTheme] = useState<NavbarTheme>(DEFAULT_THEME);
  const [tab, setTab] = useState("game");
  const [isFS, setIsFS] = useState(false);
  const [dream] = useState(false); // Suppression de setDream si inutilisé

  const updateLastMessage = useCallback((content: Message) => {
    setMessageList((prev) => {
      const newList = [...prev];
      newList[newList.length - 1] = content;
      return newList;
    });
  }, []);

  const getMessages = useCallback(async () => {
    try {
      const messages = await fetchMessages();
      setMessageList(messages);
    } catch (error) {
      console.error("Erreur historique:", error);
    }
  }, []);

  const generateGemini = async () => {
    if (!prompt) return;

    const userMessage = prompt;
    setPrompt("");
    setIsPrompting(true);
    setMessageList((prev) => [...prev, userMessage]);

    try {
      const history = messageList.map((m) =>
        typeof m === "string" ? m : m.story,
      );
      const text = await fetchGeminiResponse(userMessage, history);
      if (text) setMessageList((prev) => [...prev, text]);
    } catch (error) {
      console.error("Erreur Gemini:", error);
      setMessageList((prev) => [...prev, "Le grimoire est scellé..."]);
    } finally {
      setIsPrompting(false);
    }
  };

  const generateOllamaStream = async () => {
    if (!prompt || isPrompting) return;

    const userMessage = prompt;
    setPrompt("");
    setIsPrompting(true);

    setMessageList((prev) => [...prev, userMessage, ""]);
    const history = messageList.map((m) =>
      typeof m === "string" ? m : m.story,
    );

    if (eventSourceRef.current) eventSourceRef.current.close();

    eventSourceRef.current = streamOllamaResponse(userMessage, history, {
      onUpdate: (fullText) => updateLastMessage(fullText),
      onDone: (data) => {
        if (data.response) {
          updateLastMessage(data.response);
          if (data.response.xp) {
            setStats((prev) => ({ ...prev, xp: prev.xp + data.response.xp }));
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

  const resetGame = () => {
    if (window.confirm("Recommencer l'aventure ?")) {
      setMessageList([]);
      setStats(DEFAULT_STATS);
    }
  };

  const toggleFS = () => {
    !document.fullscreenElement
      ? document.documentElement.requestFullscreen()
      : document.exitFullscreen();
  };

  useEffect(() => {
    getMessages();
    const fn = () => setIsFS(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", fn);
    return () => {
      document.removeEventListener("fullscreenchange", fn);
      eventSourceRef.current?.close();
    };
  }, [getMessages]);

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
