import axios from "axios";
import { API_URL } from "./config";
import { getActionPrompt, getOpeningHookPrompt } from "../lib/game-prompts";
import type { Spell } from "../lib/constants";

export const fetchOpeningHook = async (spells?: Spell[]) => {
  const prompt = getOpeningHookPrompt(spells);
  const res = await axios.post(`${API_URL}/ai/generate/gemini`, { prompt });
  return res.data?.text;
};

export const fetchGeminiResponse = async (
  userMessage: string,
  history: string[],
  spells?: Spell[],
) => {
  const prompt = getActionPrompt(userMessage, history, spells);
  const res = await axios.post(`${API_URL}/ai/generate/gemini`, {
    prompt,
    userMessage,
  });
  return res.data?.text;
};
