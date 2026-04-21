import { useState, useCallback, useRef } from "react";
import { fetchGeminiResponse, fetchOpeningHook } from "@/api/gemini";
import { streamOllamaResponse, streamOpeningHook } from "@/api/ollama";
import type { Message, MessageContent, AIMessage } from "./useGameState";

export type GenerationMode = "gemini" | "ollama-stream";

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
  typeof content === "string" ? content : content.story;

export function useAI(
  generationMode: GenerationMode,
  messageList: Message[],
  setMessageList: React.Dispatch<React.SetStateAction<Message[]>>,
  updateLastMessage: (content: MessageContent) => void,
  updateXP: (gain: number, title?: string) => void,
  updateHP: (delta: number) => void,
  updateMana: (delta: number) => void,
) {
  const [isPrompting, setIsPrompting] = useState(false);
  const [prompt, setPrompt] = useState("");
  const eventSourceRef = useRef<EventSource | null>(null);
  const hookGeneratedRef = useRef(false);

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

  const generateOpeningHook = useCallback(async () => {
    setIsPrompting(true);

    if (generationMode === "ollama-stream") {
      setMessageList((prev) => [...prev, { sender: "narrator", content: "" }]);

      if (eventSourceRef.current) eventSourceRef.current.close();

      eventSourceRef.current = streamOpeningHook({
        onUpdate: (fullText) => updateLastMessage(fullText),
        onDone: (data) => {
          if (data.response) {
            updateLastMessage(data.response);
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
        const hook = await fetchOpeningHook();
        if (hook) {
          setMessageList((prev) => [...prev, { sender: "narrator", content: hook }]);
        }
      } catch {
        setMessageList((prev) => [...prev, { sender: "narrator", content: "Une perturbation magique empêche la vision de se former..." }]);
      } finally {
        setIsPrompting(false);
        hookGeneratedRef.current = true;
      }
    }
  }, [generationMode, updateLastMessage, setMessageList]);

  const generateGemini = useCallback(async () => {
    if (!prompt) return;
    const userMessage = prompt;
    setPrompt("");
    setIsPrompting(true);
    setMessageList((prev) => [...prev, { sender: "player", content: userMessage }]);

    try {
      const history = messageList.map((m) => extractText(m.content));
      const text = await fetchGeminiResponse(userMessage, history);
      if (text) {
        setMessageList((prev) => [...prev, { sender: "narrator", content: text }]);
        const rawText = typeof text === "string" ? text : (text as AIMessage).story || "";
        processXpFromResponse(rawText);
        processHpManaFromResponse(rawText);
        if (typeof text === "object" && text !== null) {
          const xpVal = (text as AIMessage).xp;
          if (xpVal && xpVal > 0) updateXP(Math.min(xpVal, XP_MAX_PER_TURN));
          const hpVal = (text as AIMessage).hp;
          if (hpVal) updateHP(hpVal);
          const manaVal = (text as AIMessage).mana;
          if (manaVal) updateMana(manaVal);
        }
      }
    } catch {
      setMessageList((prev) => [...prev, { sender: "narrator", content: "Le grimoire est scellé..." }]);
    } finally {
      setIsPrompting(false);
    }
  }, [prompt, messageList, setMessageList, processXpFromResponse, processHpManaFromResponse, updateXP, updateHP, updateMana]);

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
    const history = messageList.map((m) => extractText(m.content));

    if (eventSourceRef.current) eventSourceRef.current.close();

    eventSourceRef.current = streamOllamaResponse(userMessage, history, {
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
          }
        }
        setIsPrompting(false);
      },
      onError: () => {
        setIsPrompting(false);
        updateLastMessage("L'oracle s'est déconnecté...");
      },
    });
  }, [prompt, isPrompting, messageList, setMessageList, updateLastMessage, processXpFromResponse, processHpManaFromResponse, updateXP, updateHP, updateMana]);

  const handleAction = useCallback(() => {
    if (generationMode === "ollama-stream") {
      generateOllamaStream();
    } else {
      generateGemini();
    }
  }, [generationMode, generateOllamaStream, generateGemini]);

  return {
    isPrompting,
    prompt,
    setPrompt,
    hookGeneratedRef,
    generateOpeningHook,
    handleAction,
  };
}