import { API_URL } from "./config";
import { getActionPrompt, getOpeningHookPrompt, getSuggestionsPrompt } from "../lib/game-prompts";
import type { Spell } from "../lib/constants";
import type { InventoryItem } from "../lib/constants";
import type { NPC } from "../lib/constants";
import type { GameStats, MessageContent } from "@/hooks/useGameState";

interface StreamCallbacks {
  onUpdate: (fullText: string) => void;
  onDone: (data: { done?: boolean; response?: MessageContent }) => void;
  onError: (err: Error) => void;
}

async function fetchEventSource(
  url: string,
  body: { prompt: string; userMessage?: string },
  callbacks: StreamCallbacks
): Promise<void> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok || !response.body) {
      callbacks.onError(new Error(`HTTP ${response.status}: ${response.statusText}`));
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let accumulated = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const data = trimmed.slice(6);
        try {
          const parsed = JSON.parse(data);

          if (parsed.token) {
            accumulated += parsed.token;
            callbacks.onUpdate(accumulated);
          }

          if (parsed.done) {
            callbacks.onDone(parsed);
            return;
          }

          if (parsed.error) {
            callbacks.onError(new Error(parsed.error));
            return;
          }
        } catch {
          // ignore malformed JSON chunks
        }
      }
    }
  } catch (err) {
    callbacks.onError(err);
  }
}

const createStreamCallbacks = (callbacks: StreamCallbacks): StreamCallbacks => {
  return {
    onUpdate: (fullText: string) => {
      callbacks.onUpdate(fullText);
    },
    onDone: (data: { done?: boolean; response?: MessageContent }) => {
      callbacks.onDone(data);
    },
    onError: (err: Error) => {
      callbacks.onError(err);
    },
  };
};

export const streamOpeningHook = ({
  onUpdate,
  onDone,
  onError,
  spells,
  inventory,
  npcs,
  stats,
}: StreamCallbacks & { spells?: Spell[]; inventory?: InventoryItem[]; npcs?: NPC[]; stats?: GameStats }) => {
  const fullPrompt = getOpeningHookPrompt(spells, inventory, npcs, stats);
  const wrappedCallbacks = createStreamCallbacks({ onUpdate, onDone, onError });

  fetchEventSource(`${API_URL}/ai/generate/ollama/stream`, { prompt: fullPrompt }, wrappedCallbacks);

  return { close: () => {} };
};

export const streamOllamaResponse = (
  userMessage: string,
  history: string[],
  spells: Spell[],
  inventory: InventoryItem[],
  npcs: NPC[],
  { onUpdate, onDone, onError }: StreamCallbacks,
  stats?: GameStats,
) => {
  const fullPrompt = getActionPrompt(userMessage, history, spells, inventory, npcs, stats);
  const wrappedCallbacks = createStreamCallbacks({ onUpdate, onDone, onError });

  fetchEventSource(`${API_URL}/ai/generate/ollama/stream`, { prompt: fullPrompt, userMessage }, wrappedCallbacks);

  return { close: () => {} };
};

export const fetchOllamaSuggestions = async (
  history: string[],
  spells?: Spell[],
  inventory?: InventoryItem[],
  npcs?: NPC[],
  stats?: GameStats,
): Promise<string[]> => {
  const prompt = getSuggestionsPrompt(history, spells, inventory, npcs, stats);
  const res = await fetch(`${API_URL}/ai/generate/ollama/suggestions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data?.suggestions ?? [];
};