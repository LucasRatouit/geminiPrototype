import axios from "axios";
import { API_URL } from "./config";
import { getActionPrompt, getOpeningHookPrompt, getSuggestionsPrompt } from "../lib/game-prompts";
import type { Spell } from "../lib/constants";
import type { InventoryItem } from "../lib/constants";
import type { NPC } from "../lib/constants";
import type { GameStats } from "@/hooks/useGameState";

export const fetchOpeningHook = async (spells?: Spell[], inventory?: InventoryItem[], npcs?: NPC[], stats?: GameStats) => {
  const prompt = getOpeningHookPrompt(spells, inventory, npcs, stats);
  const res = await axios.post(`${API_URL}/ai/generate/gemini`, { prompt });
  return res.data?.text;
};

export const fetchGeminiResponse = async (
  userMessage: string,
  history: string[],
  spells?: Spell[],
  inventory?: InventoryItem[],
  npcs?: NPC[],
  stats?: GameStats,
) => {
  const prompt = getActionPrompt(userMessage, history, spells, inventory, npcs, stats);
  const res = await axios.post(`${API_URL}/ai/generate/gemini`, {
    prompt,
    userMessage,
  });
  return res.data?.text;
};

export const fetchGeminiSuggestions = async (
  history: string[],
  spells?: Spell[],
  inventory?: InventoryItem[],
  npcs?: NPC[],
  stats?: GameStats,
): Promise<string[]> => {
  const prompt = getSuggestionsPrompt(history, spells, inventory, npcs, stats);
  const res = await axios.post(`${API_URL}/ai/generate/gemini/suggestions`, { prompt });
  return res.data?.suggestions ?? [];
};