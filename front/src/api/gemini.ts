import axios from "axios";
import { API_URL } from "./config";
import { getActionPrompt } from "../lib/game-prompts";

/**
 * Appel à l'API Gemini pour générer une réponse classique (sans stream)
 */
export const fetchGeminiResponse = async (userMessage: string, history: string[]) => {
  const prompt = getActionPrompt(userMessage, history);
  const res = await axios.post(`${API_URL}/ai/generate/gemini`, { 
    prompt 
  });
  return res.data?.text;
};
