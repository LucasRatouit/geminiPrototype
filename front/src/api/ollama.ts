import { API_URL } from "./config";
import { getActionPrompt, getOpeningHookPrompt } from "../lib/game-prompts";

interface StreamCallbacks {
  onUpdate: (fullText: string) => void;
  onDone: (data: any) => void;
  onError: (err: any) => void;
}

/**
 * Génère la phrase d'accroche narrative d'ouverture via Ollama en streaming.
 */
export const streamOpeningHook = ({
  onUpdate,
  onDone,
  onError,
}: StreamCallbacks) => {
  const fullPrompt = getOpeningHookPrompt();
  const url = `${API_URL}/ai/generate/ollama/stream?prompt=${encodeURIComponent(fullPrompt)}`;

  const es = new EventSource(url);
  let accumulatedText = "";

  es.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.token) {
        accumulatedText += data.token;
        onUpdate(accumulatedText);
      }

      if (data.done) {
        onDone(data);
        es.close();
      }

      if (data.error) throw new Error(data.error);
    } catch (err) {
      onError(err);
      es.close();
    }
  };

  es.onerror = (err) => {
    onError(err);
    es.close();
  };

  return es;
};

/**
 * Appel en mode streaming via l'API Ollama (SSE)
 * Gère l'accumulation des tokens pour simplifier l'usage côté composant.
 */
export const streamOllamaResponse = (
  userMessage: string,
  history: string[],
  { onUpdate, onDone, onError }: StreamCallbacks
) => {
  const fullPrompt = getActionPrompt(userMessage, history);
  const url = `${API_URL}/ai/generate/ollama/stream?prompt=${encodeURIComponent(fullPrompt)}&userMessage=${encodeURIComponent(userMessage)}`;
  
  const es = new EventSource(url);
  let accumulatedText = "";

  es.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      if (data.token) {
        accumulatedText += data.token;
        onUpdate(accumulatedText);
      }

      if (data.done) {
        onDone(data);
        es.close();
      }
      
      if (data.error) throw new Error(data.error);
    } catch (err) {
      onError(err);
      es.close();
    }
  };

  es.onerror = (err) => {
    onError(err);
    es.close();
  };

  return es;
};
