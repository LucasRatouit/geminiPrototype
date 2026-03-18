import { useEffect, useState, useCallback } from "react";
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

function App() {
  const [isPrompting, setIsPrompting] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messageList, setMessageList] = useState<string[]>([]);

  // Navbar States
  const [stats, setStats] = useState<NavbarStats>(DEFAULT_STATS);
  const [theme, setTheme] = useState<NavbarTheme>(DEFAULT_THEME);
  const [tab, setTab] = useState("game");
  const [isFS, setIsFS] = useState(false);
  const [dream, setDream] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "/api";

  const getMessages = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/ai/messages`);
      setMessageList(res.data.messages);
    } catch (error) {
      console.error("Erreur lors de la récupération des messages:", error);
    }
  }, [API_URL]);

  const generateText = async () => {
    if (!prompt.trim()) return;
    setIsPrompting(true);
    try {
      const res = await axios.post(`${API_URL}/ai/generate`, { prompt });
      setMessageList((prev) => [...prev, prompt, res.data.text]);
      setPrompt("");
    } catch (error) {
      console.error("Erreur lors de la génération:", error);
    } finally {
      setIsPrompting(false);
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
    return () => document.removeEventListener("fullscreenchange", fn);
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
            <GameInput
              prompt={prompt}
              setPrompt={setPrompt}
              onSubmit={generateText}
              isLoading={isPrompting}
              placeholder="Décrivez l'action d'Élysia..."
            />
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
