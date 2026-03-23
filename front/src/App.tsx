import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
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
import { getActionPrompt } from "./lib/game-prompts";
import { Sparkles, Zap } from "lucide-react";

// Définition du type Message pour gérer les réponses JSON d'Ollama
type AIMessage = { story: string; actions?: string[]; xp?: number };
type Message = string | AIMessage;
type GenerationMode = "gemini" | "ollama-stream";

function App() {
  const [isPrompting, setIsPrompting] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messageList, setMessageList] = useState<Message[]>([]);
  const [generationMode, setGenerationMode] = useState<GenerationMode>("ollama-stream");
  const eventSourceRef = useRef<EventSource | null>(null);

  // Navbar States
  const [stats, setStats] = useState<NavbarStats>(DEFAULT_STATS);
  const [theme, setTheme] = useState<NavbarTheme>(DEFAULT_THEME);
  const [tab, setTab] = useState("game");
  const [isFS, setIsFS] = useState(false);
  const [dream, setDream] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const getMessages = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/ai/messages`);
      setMessageList(res.data.messages);
    } catch (error) {
      console.error("Erreur lors de la récupération des messages:", error);
    }
  }, [API_URL]);

  /**
   * Génère le texte via Gemini (mode classique sans stream)
   */
  const generateGemini = async () => {
    const userMessage = prompt;
    if (!userMessage) return;
    
    setPrompt("");
    setIsPrompting(true);
    setMessageList((prev) => [...prev, userMessage]);

    try {
      const textHistory = messageList.map(m => (typeof m === 'string' ? m : m.story));
      const res = await axios.post(`${API_URL}/ai/generate/gemini`, { 
        prompt: getActionPrompt(userMessage, textHistory) 
      });
      
      if (res.data?.text) {
        setMessageList((prev) => [...prev, res.data.text]);
      }
    } catch (error) {
      console.error("Erreur lors de la génération Gemini:", error);
      setMessageList((prev) => [...prev, "Le grimoire de Gemini semble scellé..."]);
    } finally {
      setIsPrompting(false);
    }
  };

  /**
   * Génère le texte en mode streaming via l'API Ollama (SSE)
   */
  const generateOllamaStream = async () => {
    const userMessage = prompt;
    if (!userMessage || isPrompting) return;

    setPrompt("");
    setIsPrompting(true);

    // Ajout local immédiat du message joueur
    setMessageList((prev) => [...prev, userMessage]);
    
    // On prépare un message IA vide qui sera rempli au fil de l'eau
    setMessageList((prev) => [...prev, ""]);

    // Préparation de l'historique textuel pour le prompt
    const textHistory = messageList.map(m => (typeof m === 'string' ? m : m.story));
    const fullPrompt = getActionPrompt(userMessage, textHistory);
    
    // Fermeture d'une éventuelle connexion précédente
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `${API_URL}/ai/generate/ollama/stream?prompt=${encodeURIComponent(fullPrompt)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    let currentStory = "";

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.token) {
          currentStory += data.token;
          setMessageList((prev) => {
            const newList = [...prev];
            newList[newList.length - 1] = currentStory;
            return newList;
          });
        }

        if (data.done) {
          if (data.response) {
            setMessageList((prev) => {
              const newList = [...prev];
              newList[newList.length - 1] = data.response;
              return newList;
            });
            
            // Mise à jour éventuelle des stats (ex: XP)
            if (data.response.xp) {
              setStats(prev => ({ ...prev, xp: prev.xp + data.response.xp }));
            }
          }
          es.close();
          setIsPrompting(false);
        }
        
        if (data.error) {
          throw new Error(data.error);
        }
      } catch (err) {
        console.error("Erreur lors du traitement du flux:", err);
        es.close();
        setIsPrompting(false);
      }
    };

    es.onerror = (err) => {
      console.error("EventSource failed:", err);
      es.close();
      setIsPrompting(false);
      setMessageList((prev) => {
        const newList = [...prev];
        if (newList[newList.length - 1] === "") {
          newList[newList.length - 1] = "L'oracle s'est déconnecté de la toile du destin...";
        }
        return newList;
      });
    };
  };

  const handleAction = () => {
    if (generationMode === "ollama-stream") {
      generateOllamaStream();
    } else {
      generateGemini();
    }
  };

  const resetGame = () => {
    if (window.confirm("Voulez-vous vraiment recommencer l'aventure ?")) {
      setMessageList([]);
      setStats(DEFAULT_STATS);
    }
  };

  const toggleFS = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    getMessages();
    const fn = () => setIsFS(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", fn);
    return () => {
      document.removeEventListener("fullscreenchange", fn);
      if (eventSourceRef.current) eventSourceRef.current.close();
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
              {/* Toggle de mode de génération */}
              <div className="flex justify-center gap-2 mb-1">
                <button
                  onClick={() => setGenerationMode("ollama-stream")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    generationMode === "ollama-stream"
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-500"
                      : "bg-card/40 border-white/5 text-muted-foreground hover:bg-card/60"
                  }`}
                >
                  <Zap size={12} />
                  Ollama Stream
                </button>
                <button
                  onClick={() => setGenerationMode("gemini")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    generationMode === "gemini"
                      ? "bg-primary/20 border-primary/50 text-primary"
                      : "bg-card/40 border-white/5 text-muted-foreground hover:bg-card/60"
                  }`}
                >
                  <Sparkles size={12} />
                  Gemini Flash
                </button>
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
            Contenu de l'onglet "{NAV_TABS.find((t) => t.id === tab)?.label}" en
            cours de développement...
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

