import axios from "axios";
import { API_URL } from "./config";
import type { Spell, InventoryItem, NPC } from "@/lib/constants";

export interface CharacterData {
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
  spells?: Spell[];
  inventory?: InventoryItem[];
  npcs?: NPC[];
}

export const fetchCharacter = async (): Promise<CharacterData> => {
  const res = await axios.get(`${API_URL}/ai/character`);
  return res.data;
};

export const updateCharacter = async (
  data: Partial<CharacterData>,
): Promise<CharacterData> => {
  const res = await axios.patch(`${API_URL}/ai/character`, data);
  return res.data;
};

export const resetCharacter = async (): Promise<CharacterData> => {
  const res = await axios.delete(`${API_URL}/ai/character`);
  return res.data;
};