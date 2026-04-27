import { useState, useCallback, useRef } from "react";
import { fetchGeminiResponse, fetchOpeningHook, fetchGeminiSuggestions } from "@/api/gemini";
import { streamOllamaResponse, streamOpeningHook, fetchOllamaSuggestions } from "@/api/ollama";
import { streamOpenRouterResponse, streamOpenRouterOpeningHook, fetchOpenRouterSuggestions } from "@/api/openrouter";
import { parseNewSpellsFromText, parseNewItemsFromText, parseUsedItemsFromText, parseNewNPCsFromText, parseUpdatedNPCsFromText, type NPCUpdate } from "@/lib/game-prompts";
import type { Message, MessageContent, AIMessage } from "./useGameState";
import type { GameStats } from "./useGameState";
import type { Spell } from "@/lib/constants";
import type { InventoryItem } from "@/lib/constants";
import type { NPC } from "@/lib/constants";

const VALID_RELATIONS = ["allié", "neutre", "ennemi", "mentor", "inconnu"];
const NPC_DEFAULTS = { role: "Inconnu", relation: "inconnu" as NPC["relation"], description: "" };

function extractNPCsFromJSON(data: AIMessage): NPC[] {
  if (!data.personnages || !Array.isArray(data.personnages)) return [];
  return data.personnages
    .filter((p) => p && typeof p.name === "string")
    .map((p) => ({
      name: p.name || "???",
      role: (typeof p.role === "string" && p.role) || NPC_DEFAULTS.role,
      relation: VALID_RELATIONS.includes(typeof p.relation === "string" ? p.relation.toLowerCase() : "") ? (p.relation as NPC["relation"]) : NPC_DEFAULTS.relation,
      description: (typeof p.description === "string" && p.description) || NPC_DEFAULTS.description,
    }));
}

function extractUpdatedNPCsFromJSON(data: AIMessage): NPCUpdate[] {
  if (!data.majPersonnages || !Array.isArray(data.majPersonnages)) return [];
  return data.majPersonnages
    .filter((p) => p && typeof p.name === "string")
    .map((p) => ({
      name: p.name,
      role: typeof p.role === "string" ? p.role : undefined,
      relation: VALID_RELATIONS.includes(typeof p.relation === "string" ? p.relation.toLowerCase() : "") ? (p.relation as NPC["relation"]) : undefined,
      description: typeof p.description === "string" ? p.description : undefined,
    }));
}

export type GenerationMode = "gemini" | "ollama-stream" | "openrouter-stream";

const XP_MAX_PER_TURN = 25;

function parseXpFromText(text: string): { xp: number; title?: string }[] {
  const results: { xp: number; title?: string }[] = [];
  const questRegex = /\[QUETE_TERMINEE:([^|]+)\|(\d+)\]/g;
  let match;
  while ((match = questRegex.exec(text)) !== null) {
    results.push({ title: match[1].trim(), xp: Math.min(parseInt(match[2]), XP_MAX_PER_TURN) });
  }
  const xpRegex = /\[XP:(\d+)\]/g;
  while ((match = xpRegex.exec(text)) !== null) {
    results.push({ xp: Math.min(parseInt(match[1]), XP_MAX_PER_TURN) });
  }
  return results;
}

function parseHpManaFromText(text: string): { hpDelta: number; manaDelta: number } {
  let hpDelta = 0;
  let manaDelta = 0;
  const hpRegex = /\[VIE:([+-]?\d+)\]/g;
  let match;
  while ((match = hpRegex.exec(text)) !== null) {
    hpDelta += parseInt(match[1]);
  }
  const manaRegex = /\[MANA:([+-]?\d+)\]/g;
  while ((match = manaRegex.exec(text)) !== null) {
    manaDelta += parseInt(match[1]);
  }
  return { hpDelta, manaDelta };
}

const extractText = (content: MessageContent): string =>
  typeof content === "string" ? content : (content?.story ?? String(content ?? ""));

const buildLabeledHistory = (messages: Message[]): string[] =>
  messages.map((m) => {
    const text = extractText(m.content);
    return m.sender === "player" ? `[JOUEUR] ${text}` : `[NARRATEUR] ${text}`;
  });

export function useAI(
  generationMode: GenerationMode,
  messageList: Message[],
  setMessageList: React.Dispatch<React.SetStateAction<Message[]>>,
  updateLastMessage: (content: MessageContent) => void,
  updateXP: (gain: number, title?: string) => void,
  updateHP: (delta: number) => void,
  updateMana: (delta: number) => void,
  spells: Spell[],
  addSpell: (spell: Spell) => void,
  inventory: InventoryItem[],
  addItem: (item: InventoryItem) => void,
  removeItem: (name: string) => void,
  npcs: NPC[],
  addNPC: (npc: NPC) => void,
  updateNPC: (name: string, updates: { role?: string; relation?: NPC["relation"]; description?: string }) => void,
  stats: GameStats,
) {
  const [isPrompting, setIsPrompting] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const eventSourceRef = useRef<{ close: () => void } | null>(null);
  const hookGeneratedRef = useRef(false);

  const spellsRef = useRef(spells);
  spellsRef.current = spells;
  const addSpellRef = useRef(addSpell);
  addSpellRef.current = addSpell;

  const inventoryRef = useRef(inventory);
  inventoryRef.current = inventory;
  const addItemRef = useRef(addItem);
  addItemRef.current = addItem;
  const removeItemRef = useRef(removeItem);
  removeItemRef.current = removeItem;

  const npcsRef = useRef(npcs);
  npcsRef.current = npcs;
  const addNPCRef = useRef(addNPC);
  addNPCRef.current = addNPC;
  const updateNPCRef = useRef(updateNPC);
  updateNPCRef.current = updateNPC;

  const statsRef = useRef(stats);
  statsRef.current = stats;

  const processXpFromResponse = useCallback((text: string) => {
    const xpResults = parseXpFromText(text);
    for (const { xp, title } of xpResults) {
      updateXP(xp, title);
    }
  }, [updateXP]);

  const processHpManaFromResponse = useCallback((text: string) => {
    const { hpDelta, manaDelta } = parseHpManaFromText(text);
    if (hpDelta) updateHP(hpDelta);
    if (manaDelta) updateMana(manaDelta);
  }, [updateHP, updateMana]);

  const processNewSpellsFromResponse = useCallback((text: string) => {
    const newSpells = parseNewSpellsFromText(text);
    for (const spell of newSpells) {
      addSpellRef.current(spell);
    }
  }, []);

  const processNewItemsFromResponse = useCallback((text: string) => {
    const newItems = parseNewItemsFromText(text);
    for (const item of newItems) {
      addItemRef.current(item);
    }
  }, []);

  const processUsedItemsFromResponse = useCallback((text: string) => {
    const usedNames = parseUsedItemsFromText(text);
    for (const name of usedNames) {
      removeItemRef.current(name);
    }
  }, []);

  const processNewNPCsFromResponse = useCallback((text: string) => {
    const newNpcs = parseNewNPCsFromText(text);
    for (const npc of newNpcs) {
      addNPCRef.current(npc);
    }
  }, []);

  const processUpdatedNPCsFromResponse = useCallback((text: string) => {
    const updates = parseUpdatedNPCsFromText(text);
    for (const update of updates) {
      updateNPCRef.current(update.name, update);
    }
  }, []);

  const generateOpeningHook = useCallback(async () => {
    setIsPrompting(true);

    if (generationMode === "ollama-stream" || generationMode === "openrouter-stream") {
      setMessageList((prev) => [...prev, { sender: "narrator", content: "" }]);

      if (eventSourceRef.current) eventSourceRef.current.close();

      const streamHook = generationMode === "openrouter-stream"
        ? streamOpenRouterOpeningHook
        : streamOpeningHook;

      eventSourceRef.current = streamHook({
        onUpdate: (fullText) => updateLastMessage(fullText),
        onDone: (data) => {
          if (data.response) {
            updateLastMessage(data.response);
            const respText = typeof data.response === "string" ? data.response : (data.response as AIMessage).story || "";
            processNewSpellsFromResponse(respText);
            processNewItemsFromResponse(respText);
            processUsedItemsFromResponse(respText);
            processNewNPCsFromResponse(respText);
            processUpdatedNPCsFromResponse(respText);
            if (typeof data.response === "object" && data.response !== null) {
              const jsonNpcs = extractNPCsFromJSON(data.response as AIMessage);
              for (const npc of jsonNpcs) addNPCRef.current(npc);
              const jsonUpdates = extractUpdatedNPCsFromJSON(data.response as AIMessage);
              for (const u of jsonUpdates) updateNPCRef.current(u.name, u);
            }
          }
          setIsPrompting(false);
          hookGeneratedRef.current = true;
        },
        onError: () => {
          setIsPrompting(false);
          updateLastMessage("L'oracle s'est déconnecté...");
          hookGeneratedRef.current = true;
        },
      });
    } else {
      try {
        const hook = await fetchOpeningHook(spellsRef.current, inventoryRef.current, npcsRef.current, statsRef.current);
        if (hook) {
          setMessageList((prev) => [...prev, { sender: "narrator", content: hook }]);
          const rawText = typeof hook === "string" ? hook : (hook as AIMessage).story || "";
          processNewSpellsFromResponse(rawText);
          processNewItemsFromResponse(rawText);
          processUsedItemsFromResponse(rawText);
          processNewNPCsFromResponse(rawText);
          processUpdatedNPCsFromResponse(rawText);
          if (typeof hook === "object" && hook !== null) {
            const jsonNpcs = extractNPCsFromJSON(hook as AIMessage);
            for (const npc of jsonNpcs) addNPCRef.current(npc);
            const jsonUpdates = extractUpdatedNPCsFromJSON(hook as AIMessage);
            for (const u of jsonUpdates) updateNPCRef.current(u.name, u);
          }
        }
      } catch {
        setMessageList((prev) => [...prev, { sender: "narrator", content: "Une perturbation magique empêche la vision de se former..." }]);
      } finally {
        setIsPrompting(false);
        hookGeneratedRef.current = true;
      }
    }
  }, [generationMode, updateLastMessage, setMessageList, processNewSpellsFromResponse, processNewItemsFromResponse, processUsedItemsFromResponse, processNewNPCsFromResponse, processUpdatedNPCsFromResponse]);

  const generateGemini = useCallback(async () => {
    if (!prompt) return;
    const userMessage = prompt;
    setPrompt("");
    setIsPrompting(true);
    setMessageList((prev) => [...prev, { sender: "player", content: userMessage }]);

    try {
      const history = buildLabeledHistory(messageList);
      const text = await fetchGeminiResponse(userMessage, history, spellsRef.current, inventoryRef.current, npcsRef.current, statsRef.current);
      if (text) {
        setMessageList((prev) => [...prev, { sender: "narrator", content: text }]);
        const rawText = typeof text === "string" ? text : (text as AIMessage).story || "";
        processXpFromResponse(rawText);
        processHpManaFromResponse(rawText);
        processNewSpellsFromResponse(rawText);
        processNewItemsFromResponse(rawText);
        processUsedItemsFromResponse(rawText);
        processNewNPCsFromResponse(rawText);
        processUpdatedNPCsFromResponse(rawText);
        if (typeof text === "object" && text !== null) {
          const xpVal = (text as AIMessage).xp;
          if (xpVal && xpVal > 0) updateXP(Math.min(xpVal, XP_MAX_PER_TURN));
          const hpVal = (text as AIMessage).hp;
          if (hpVal) updateHP(hpVal);
          const manaVal = (text as AIMessage).mana;
          if (manaVal) updateMana(manaVal);
          const jsonNpcs = extractNPCsFromJSON(text as AIMessage);
          for (const npc of jsonNpcs) addNPCRef.current(npc);
          const jsonUpdates = extractUpdatedNPCsFromJSON(text as AIMessage);
          for (const u of jsonUpdates) updateNPCRef.current(u.name, u);
        }
      }
    } catch {
      setMessageList((prev) => [...prev, { sender: "narrator", content: "Le grimoire est scellé..." }]);
    } finally {
      setIsPrompting(false);
    }
  }, [prompt, messageList, setMessageList, processXpFromResponse, processHpManaFromResponse, processNewSpellsFromResponse, processNewItemsFromResponse, processUsedItemsFromResponse, processNewNPCsFromResponse, processUpdatedNPCsFromResponse, updateXP, updateHP, updateMana]);

  const generateOllamaStream = useCallback(async () => {
    if (!prompt || isPrompting) return;
    const userMessage = prompt;
    setPrompt("");
    setIsPrompting(true);

    setMessageList((prev) => [
      ...prev,
      { sender: "player", content: userMessage },
      { sender: "narrator", content: "" },
    ]);
    const history = buildLabeledHistory(messageList);

    if (eventSourceRef.current) eventSourceRef.current.close();

    eventSourceRef.current = streamOllamaResponse(userMessage, history, spellsRef.current, inventoryRef.current, npcsRef.current, {
      onUpdate: (fullText) => updateLastMessage(fullText),
      onDone: (data) => {
        if (data.response) {
          updateLastMessage(data.response);
          const responseText =
            typeof data.response === "string"
              ? data.response
              : data.response.story || "";
          processXpFromResponse(responseText);
          processHpManaFromResponse(responseText);
          processNewSpellsFromResponse(responseText);
          processNewItemsFromResponse(responseText);
          processUsedItemsFromResponse(responseText);
          processNewNPCsFromResponse(responseText);
          processUpdatedNPCsFromResponse(responseText);
          if (
            typeof data.response === "object" &&
            data.response !== null
          ) {
            const xpVal = data.response.xp;
            if (xpVal && xpVal > 0) updateXP(Math.min(xpVal, XP_MAX_PER_TURN));
            const hpVal = data.response.hp;
            if (hpVal) updateHP(hpVal);
            const manaVal = data.response.mana;
            if (manaVal) updateMana(manaVal);
            const jsonNpcs = extractNPCsFromJSON(data.response as AIMessage);
            for (const npc of jsonNpcs) addNPCRef.current(npc);
            const jsonUpdates = extractUpdatedNPCsFromJSON(data.response as AIMessage);
            for (const u of jsonUpdates) updateNPCRef.current(u.name, u);
          }
        }
        setIsPrompting(false);
      },
      onError: () => {
        setIsPrompting(false);
        updateLastMessage("L'oracle s'est déconnecté...");
      },
    }, statsRef.current);
  }, [prompt, isPrompting, messageList, setMessageList, updateLastMessage, processXpFromResponse, processHpManaFromResponse, processNewSpellsFromResponse, processNewItemsFromResponse, processUsedItemsFromResponse, processNewNPCsFromResponse, processUpdatedNPCsFromResponse, updateXP, updateHP, updateMana]);

  const generateOpenRouterStream = useCallback(async () => {
    if (!prompt || isPrompting) return;
    const userMessage = prompt;
    setPrompt("");
    setIsPrompting(true);

    setMessageList((prev) => [
      ...prev,
      { sender: "player", content: userMessage },
      { sender: "narrator", content: "" },
    ]);
    const history = buildLabeledHistory(messageList);

    if (eventSourceRef.current) eventSourceRef.current.close();

    eventSourceRef.current = streamOpenRouterResponse(userMessage, history, spellsRef.current, inventoryRef.current, npcsRef.current, {
      onUpdate: (fullText) => updateLastMessage(fullText),
      onDone: (data) => {
        if (data.response) {
          updateLastMessage(data.response);
          const responseText =
            typeof data.response === "string"
              ? data.response
              : data.response.story || "";
          processXpFromResponse(responseText);
          processHpManaFromResponse(responseText);
          processNewSpellsFromResponse(responseText);
          processNewItemsFromResponse(responseText);
          processUsedItemsFromResponse(responseText);
          processNewNPCsFromResponse(responseText);
          processUpdatedNPCsFromResponse(responseText);
          if (
            typeof data.response === "object" &&
            data.response !== null
          ) {
            const xpVal = data.response.xp;
            if (xpVal && xpVal > 0) updateXP(Math.min(xpVal, XP_MAX_PER_TURN));
            const hpVal = data.response.hp;
            if (hpVal) updateHP(hpVal);
            const manaVal = data.response.mana;
            if (manaVal) updateMana(manaVal);
            const jsonNpcs = extractNPCsFromJSON(data.response as AIMessage);
            for (const npc of jsonNpcs) addNPCRef.current(npc);
            const jsonUpdates = extractUpdatedNPCsFromJSON(data.response as AIMessage);
            for (const u of jsonUpdates) updateNPCRef.current(u.name, u);
          }
        }
        setIsPrompting(false);
      },
      onError: () => {
        setIsPrompting(false);
        updateLastMessage("L'oracle s'est déconnecté...");
      },
    }, statsRef.current);
  }, [prompt, isPrompting, messageList, setMessageList, updateLastMessage, processXpFromResponse, processHpManaFromResponse, processNewSpellsFromResponse, processNewItemsFromResponse, processUsedItemsFromResponse, processNewNPCsFromResponse, processUpdatedNPCsFromResponse, updateXP, updateHP, updateMana]);

  const handleAction = useCallback(() => {
    if (generationMode === "ollama-stream") {
      generateOllamaStream();
    } else if (generationMode === "openrouter-stream") {
      generateOpenRouterStream();
    } else {
      generateGemini();
    }
  }, [generationMode, generateOllamaStream, generateOpenRouterStream, generateGemini]);

  const generateSuggestions = useCallback(async () => {
    if (isSuggesting || isPrompting) return;
    setIsSuggesting(true);
    try {
      const history = buildLabeledHistory(messageList);
      let result: string[] = [];
      if (generationMode === "gemini") {
        result = await fetchGeminiSuggestions(history, spellsRef.current, inventoryRef.current, npcsRef.current, statsRef.current);
      } else if (generationMode === "ollama-stream") {
        result = await fetchOllamaSuggestions(history, spellsRef.current, inventoryRef.current, npcsRef.current, statsRef.current);
      } else if (generationMode === "openrouter-stream") {
        result = await fetchOpenRouterSuggestions(history, spellsRef.current, inventoryRef.current, npcsRef.current, statsRef.current);
      }
      const cleanSuggestions = result.filter((s): s is string => typeof s === "string");
      if (cleanSuggestions.length === 0) {
        setSuggestions([
          "Explorer les alentours avec prudence et observer ce qui se passe autour d'Élysia.",
          "Interagir avec le premier personnage ou élément mystérieux que la narration a mentionné.",
          "Utiliser un sort connu pour faire la lumière sur la situation actuelle.",
        ]);
      } else {
        setSuggestions(cleanSuggestions.slice(0, 3));
      }
    } catch {
      setSuggestions([
        "Explorer les alentours avec prudence et observer ce qui se passe autour d'Élysia.",
        "Interagir avec le premier personnage ou élément mystérieux que la narration a mentionné.",
        "Utiliser un sort connu pour faire la lumière sur la situation actuelle.",
      ]);
    } finally {
      setIsSuggesting(false);
    }
  }, [generationMode, isSuggesting, isPrompting, messageList]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    isPrompting,
    prompt,
    setPrompt,
    hookGeneratedRef,
    generateOpeningHook,
    handleAction,
    isSuggesting,
    suggestions,
    generateSuggestions,
    clearSuggestions,
  };
}