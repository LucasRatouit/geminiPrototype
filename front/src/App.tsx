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

function App() {
  const [isPrompting, setIsPrompting] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messageList, setMessageList] = useState<Message[]>([]);
  const [generationMode, setGenerationMode] =
    useState<GenerationMode>("ollama-stream");
  const eventSourceRef = useRef<EventSource | null>(null);
  const hookGeneratedRef = useRef(false);

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

  const extractText = (content: MessageContent): string =>
    typeof content === "string" ? content : content.story;

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
            content: "Une perturbation magique empêche la vision de se former...",
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
      if (text)
        setMessageList((prev) => [
          ...prev,
          { sender: "narrator", content: text },
        ]);
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

  const resetGame = async () => {
    if (window.confirm("Recommencer l'aventure ?")) {
      eventSourceRef.current?.close();
      await resetMessages();
      setMessageList([]);
      hookGeneratedRef.current = false;
      setStats(DEFAULT_STATS);
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
