import { useState, useCallback, useRef, useEffect } from "react";
import { fetchMessages, resetMessages } from "@/api/messages";
import { fetchCharacter, updateCharacter, resetCharacter } from "@/api/character";
import { BASE_SPELLS, BASE_INVENTORY, BASE_NPCS, type Spell, type InventoryItem, type NPC } from "@/lib/constants";

export type Sender = "player" | "narrator";
export type AIMessage = { story: string; actions?: string[]; xp?: number; hp?: number; mana?: number; personnages?: { name: string; role?: string; relation?: string; description?: string }[]; majPersonnages?: { name: string; role?: string; relation?: string; description?: string }[] };
export type MessageContent = string | AIMessage;

export interface Message {
  sender: Sender;
  content: MessageContent;
}

export interface GameStats {
  rank: string;
  level: number;
  hp: number;
  hpMax: number;
  mana: number;
  manaMax: number;
  xp: number;
  xpMax: number;
  strength: number;
  intelligence: number;
  spirit: number;
  agility: number;
  charisma: number;
}

export interface GameTheme {
  accent: string;
  glow: string;
  hb: string;
  tb: string;
  name: string;
  bg1?: string;
  bg2?: string;
}

export const DEFAULT_STATS: GameStats = {
  rank: "F",
  level: 1,
  hp: 100,
  hpMax: 100,
  mana: 80,
  manaMax: 80,
  xp: 0,
  xpMax: 100,
  strength: 8,
  intelligence: 12,
  spirit: 10,
  agility: 9,
  charisma: 11,
};

export const DEFAULT_THEME: GameTheme = {
  accent: "var(--primary)",
  glow: "var(--ring)",
  hb: "var(--border)",
  tb: "var(--border)",
  name: "Académie",
};

const XP_MAX_PER_TURN = 25;

export function useGameState() {
  const [messageList, setMessageList] = useState<Message[]>([]);
  const [stats, setStats] = useState<GameStats>(DEFAULT_STATS);
  const [spells, setSpells] = useState<Spell[]>(BASE_SPELLS);
  const [inventory, setInventory] = useState<InventoryItem[]>(BASE_INVENTORY);
  const [npcs, setNpcs] = useState<NPC[]>(BASE_NPCS);
  const [theme, setTheme] = useState<GameTheme>(DEFAULT_THEME);
  const [tab, setTab] = useState("game");
  const [isFS, setIsFS] = useState(false);
  const [dream] = useState(false);

  const [xpToast, setXpToast] = useState<{ title?: string; xp: number } | null>(null);
  const [hpToast, setHpToast] = useState<{ delta: number } | null>(null);
  const [manaToast, setManaToast] = useState<{ delta: number } | null>(null);
  const [lvlModal, setLvlModal] = useState(false);
  const [lvlMode, setLvlMode] = useState<"all" | "pick" | null>(null);

  const prevLevelRef = useRef(DEFAULT_STATS.level);
  const isLoadedRef = useRef(false);

  const updateLastMessage = useCallback((content: MessageContent) => {
    setMessageList((prev) => {
      const newList = [...prev];
      newList[newList.length - 1] = { ...newList[newList.length - 1], content };
      return newList;
    });
  }, []);

  const loadSavedState = useCallback(async () => {
    try {
      const [messages, character] = await Promise.all([
        fetchMessages(),
        fetchCharacter(),
      ]);
      if (messages.length > 0) {
        setMessageList(messages);
      }
      if (character) {
        setStats(character);
        prevLevelRef.current = character.level;
      }
      if (character && (character as GameStats & { spells?: Spell[] }).spells) {
        setSpells((character as GameStats & { spells?: Spell[] }).spells!);
      }
      if (character && (character as GameStats & { inventory?: InventoryItem[] }).inventory) {
        setInventory((character as GameStats & { inventory?: InventoryItem[] }).inventory!);
      }
      if (character && (character as GameStats & { npcs?: NPC[] }).npcs) {
        setNpcs((character as GameStats & { npcs?: NPC[] }).npcs!);
      }
      return messages.length > 0;
    } catch (error) {
      console.error("Erreur historique:", error);
    } finally {
      isLoadedRef.current = true;
    }
    return false;
  }, []);

  const updateXP = useCallback((gain: number, title?: string) => {
    if (!gain || gain <= 0) return;
    const cappedGain = Math.min(gain, XP_MAX_PER_TURN);

    setXpToast({ title, xp: cappedGain });
    setTimeout(() => setXpToast(null), 5000);

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

      const next = {
        ...prev,
        xp: newXp,
        xpMax: newXpMax,
        level: newLevel,
        hpMax: newHpMax,
        hp: Math.min(prev.hp, newHpMax),
        manaMax: newManaMax,
      };
      return next;
    });
  }, []);

  const updateHP = useCallback((delta: number) => {
    if (!delta) return;
    setHpToast({ delta });
    setTimeout(() => setHpToast(null), 5000);
    setStats((prev) => {
      const newHp = Math.max(0, Math.min(prev.hp + delta, prev.hpMax));
      return { ...prev, hp: newHp };
    });
  }, []);

  const updateMana = useCallback((delta: number) => {
    if (!delta) return;
    setManaToast({ delta });
    setTimeout(() => setManaToast(null), 5000);
    setStats((prev) => {
      const newMana = Math.max(0, Math.min(prev.mana + delta, prev.manaMax));
      return { ...prev, mana: newMana };
    });
  }, []);

  const addSpell = useCallback((spell: Spell) => {
    setSpells((prev) => {
      if (prev.some((s) => s.name === spell.name)) return prev;
      return [...prev, spell];
    });
  }, []);

  const addItem = useCallback((item: InventoryItem) => {
    setInventory((prev) => {
      if (prev.some((i) => i.name === item.name)) return prev;
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((name: string) => {
    setInventory((prev) => {
      const next = prev.filter((i) => i.name !== name);
      if (next.length === prev.length) return prev;
      return next;
    });
  }, []);

  const addNPC = useCallback((npc: NPC) => {
    if (npc.name === "Élysia") return;
    setNpcs((prev) => {
      const existingIdx = prev.findIndex((n) => n.name === npc.name);
      if (existingIdx !== -1) {
        const updated = { ...prev[existingIdx] };
        if (npc.name && npc.name !== "???" && updated.name === "???") updated.name = npc.name;
        if (npc.role && npc.role !== "Inconnu") updated.role = npc.role;
        if (npc.relation && npc.relation !== "inconnu") updated.relation = npc.relation;
        if (npc.description) updated.description = npc.description;
        const next = [...prev];
        next[existingIdx] = updated;
        return next;
      }
      return [...prev, npc];
    });
  }, []);

  const updateNPC = useCallback((name: string, updates: { role?: string; relation?: NPC["relation"]; description?: string }) => {
    if (name === "Élysia") return;
    setNpcs((prev) => {
      const idx = prev.findIndex((n) => n.name === name);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        ...(updates.role && updates.role !== "Inconnu" ? { role: updates.role } : {}),
        ...(updates.relation ? { relation: updates.relation } : {}),
        ...(updates.description ? { description: updates.description } : {}),
      };
      return next;
    });
  }, []);

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
    const validKeys = ["strength", "intelligence", "spirit", "agility", "charisma"] as const;
    type ValidKey = (typeof validKeys)[number];
    if (!validKeys.includes(key as ValidKey)) return;
    setStats((prev) => ({
      ...prev,
      [key]: (prev as unknown as Record<string, number>)[key] + 5,
    }));
    setLvlModal(false);
    setLvlMode(null);
  }, []);

  const toggleFS = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const resetGame = useCallback(async (generateOpeningHook: () => void) => {
    if (!window.confirm("Recommencer l'aventure ?")) return;
    const [resetChar] = await Promise.all([
      resetCharacter(),
      resetMessages(),
    ]);
    setMessageList([]);
    if (resetChar) {
      setStats(resetChar);
      prevLevelRef.current = resetChar.level;
    } else {
      setStats(DEFAULT_STATS);
      prevLevelRef.current = DEFAULT_STATS.level;
    }
    setSpells(BASE_SPELLS);
    setInventory(BASE_INVENTORY);
    setNpcs(BASE_NPCS);
    setLvlModal(false);
    setLvlMode(null);
    setXpToast(null);
    setHpToast(null);
    setManaToast(null);
    generateOpeningHook();
  }, []);

  useEffect(() => {
    if (!isLoadedRef.current) return;
    const timer = setTimeout(() => {
      updateCharacter({ ...stats, spells, inventory, npcs }).catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [stats, spells, inventory, npcs]);

  return {
    messageList, setMessageList,
    stats, setStats,
    spells, addSpell,
    inventory, addItem, removeItem,
    npcs, addNPC, updateNPC,
    theme, setTheme,
    tab, setTab,
    isFS, setIsFS,
    dream,
    xpToast, hpToast, manaToast,
    lvlModal, setLvlModal,
    lvlMode, setLvlMode,
    prevLevelRef,
    updateLastMessage,
    loadSavedState,
    updateXP, updateHP, updateMana,
    doLevelAll, doLevelPick,
    toggleFS, resetGame,
  };
}