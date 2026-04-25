import { API_URL } from "./config";
import { getActionPrompt, getOpeningHookPrompt } from "../lib/game-prompts";
import type { Spell } from "../lib/constants";
import type { InventoryItem } from "../lib/constants";

interface StreamCallbacks {
  onUpdate: (fullText: string) => void;
  onDone: (data: any) => void;
  onError: (err: any) => void;
}

export const streamOpeningHook = ({
  onUpdate,
  onDone,
  onError,
  spells,
  inventory,
}: StreamCallbacks & { spells?: Spell[]; inventory?: InventoryItem[] }) => {
  const fullPrompt = getOpeningHookPrompt(spells, inventory);
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

export const streamOllamaResponse = (
  userMessage: string,
  history: string[],
  spells: Spell[],
  inventory: InventoryItem[],
  { onUpdate, onDone, onError }: StreamCallbacks
) => {
  const fullPrompt = getActionPrompt(userMessage, history, spells, inventory);
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