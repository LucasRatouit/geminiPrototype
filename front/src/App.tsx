import { useState, useEffect } from "react";
import { useGameState } from "@/hooks/useGameState";
import { useAI, type GenerationMode } from "@/hooks/useAI";
import { Navbar, NAV_TABS } from "@/components/navbar";
import { StoryMessages } from "@/components/game/StoryMessages";
import { GameInput } from "@/components/game/GameInput";
import { ModeSelector } from "@/components/game/ModeSelector";
import { StatsTab } from "@/components/stats-tab";
import { SpellsTab } from "@/components/spells-tab";
import { BesaceTab } from "@/components/besace-tab";
import { PersoTab } from "@/components/perso-tab";
import { Toasts } from "@/components/ui/Toasts";
import { LevelUpModal } from "@/components/ui/LevelUpModal";
import { MagicParticles } from "@/components/effects/MagicParticles";

function App() {
  const [generationMode, setGenerationMode] = useState<GenerationMode>("ollama-stream");

  const {
    messageList, setMessageList,
    stats,
    spells, addSpell,
    inventory, addItem, removeItem,
    npcs, addNPC, updateNPC,
    theme, tab, setTab,
    isFS, setIsFS,
    xpToast, hpToast, manaToast,
    lvlModal, lvlMode, setLvlMode,
    prevLevelRef,
    loadSavedState, updateLastMessage,
    updateXP, updateHP, updateMana,
    doLevelAll, doLevelPick,
    toggleFS, resetGame,
  } = useGameState();

  const {
    isPrompting, prompt, setPrompt,
    hookGeneratedRef, generateOpeningHook,
    handleAction,
  } = useAI(
    generationMode,
    messageList,
    setMessageList,
    updateLastMessage,
    updateXP, updateHP, updateMana,
    spells, addSpell,
    inventory, addItem, removeItem,
    npcs, addNPC, updateNPC,
    stats,
  );

  useEffect(() => {
    if (stats.level > prevLevelRef.current) {
      // Level-up detection handled by useGameState internally,
      // but we need to show the modal from App level
      // Setting lvlModal is handled in useGameState
    }
    prevLevelRef.current = stats.level;
  }, [stats.level, prevLevelRef]);

  useEffect(() => {
    const fn = () => setIsFS(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", fn);
    return () => document.removeEventListener("fullscreenchange", fn);
  }, [setIsFS]);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const hasHistory = await loadSavedState();
      if (cancelled || hasHistory || hookGeneratedRef.current) return;
      generateOpeningHook();
    };
    init();
    return () => { cancelled = true; };
  }, [loadSavedState, generateOpeningHook, hookGeneratedRef]);

  const handleReset = () => resetGame(generateOpeningHook);

  return (
    <div
      className="w-screen h-screen flex flex-col overflow-hidden relative"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #12101a 0%, #08060d 70%)" }}
    >
      <MagicParticles />

      <Navbar
        stats={stats}
        theme={theme}
        currentTab={tab}
        setTab={setTab}
        tabs={NAV_TABS}
        onReset={handleReset}
        onToggleFS={toggleFS}
        isFS={isFS}
        npcsCount={npcs.length}
      />

      <Toasts xpToast={xpToast} hpToast={hpToast} manaToast={manaToast} />

      {lvlModal && (
        <LevelUpModal
          stats={stats}
          lvlMode={lvlMode}
          setLvlMode={setLvlMode}
          doLevelAll={doLevelAll}
          doLevelPick={doLevelPick}
        />
      )}

      <div className="flex-1 sm:w-4/6 w-full mx-auto py-2 px-1 flex flex-col justify-between items-center overflow-hidden relative z-10">
        {tab === "game" ? (
          <>
            <StoryMessages
              messages={messageList}
              onChoiceClick={(choice) => setPrompt(choice)}
            />
            <div className="w-full flex flex-col gap-2">
              <ModeSelector mode={generationMode} setMode={setGenerationMode} />
              <GameInput
                prompt={prompt}
                setPrompt={setPrompt}
                onSubmit={handleAction}
                isLoading={isPrompting}
                placeholder="Décrivez l'action d'Élysia..."
              />
            </div>
          </>
        ) : tab === "stats" ? (
          <StatsTab stats={stats} />
        ) : tab === "spells" ? (
          <SpellsTab spells={spells} stats={stats} />
        ) : tab === "inventory" ? (
          <BesaceTab inventory={inventory} stats={stats} />
        ) : tab === "npcs" ? (
          <PersoTab npcs={npcs} />
        ) : null}
      </div>
    </div>
  );
}

export default App;