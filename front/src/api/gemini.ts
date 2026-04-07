import axios from "axios";
import { API_URL } from "./config";
import { getActionPrompt, getOpeningHookPrompt } from "../lib/game-prompts";

/**
 * Génère la phrase d'accroche narrative d'ouverture via Gemini.
 */
export const fetchOpeningHook = async () => {
  const prompt = getOpeningHookPrompt();
  const res = await axios.post(`${API_URL}/ai/generate/gemini`, { prompt });
  return res.data?.text;
};

/**
 * Appel à l'API Gemini pour générer une réponse classique (sans stream)
 */
export const fetchGeminiResponse = async (
  userMessage: string,
  history: string[],
) => {
  const prompt = getActionPrompt(userMessage, history);
  const res = await axios.post(`${API_URL}/ai/generate/gemini`, {
    prompt,
    userMessage,
  });
  return res.data?.text;
};
