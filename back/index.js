import "dotenv/config";
import express from "express";
import cors from "cors";
import { generateText as generateGemini } from "./geminiClient.js";
import { generateText as generateOllama } from "./ollamaClient.js";
import { generateText as generateOpenRouter } from "./openrouterClient.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const messageList = [];

const DEFAULT_CHARACTER = {
  rank: "F",
  level: 1,
  hp: 100,
  hpMax: 100,
  mana: 80,
  manaMax: 80,
  xp: 0,
  xpMax: 100,
  strength: 8,
  intelligence: 12,
  spirit: 10,
  agility: 9,
  charisma: 11,
  spells: [
    {
      name: "Éclat Divin",
      description: "Un éclat de lumière condensée issu de l'aura d'Élysia. Rapide et précis, il frappe la cible et peut l'éblouir brièvement.",
      manaCost: 10,
    },
  ],
  inventory: [
    {
      name: "Potion de Soin",
      description: "Une fiole rougeâtre contenant un liquide viscide qui restaure la vitalité.",
      effectType: "hp",
      effectValue: 10,
    },
    {
      name: "Potion de Mana",
      description: "Une fiole bleuâtre dont le contenu iridescent régénère l'énergie arcanique.",
      effectType: "mana",
      effectValue: 15,
    },
  ],
  npcs: [
    {
      name: "Élysia",
      description: "Apprentie à l'Académie des Voiles Éternelles, réincarnation fragmentée d'une Archimage oubliée. Cheveux roses, yeux bleu cristallin.",
      role: "Apprentie",
      relation: "joueur",
    },
  ],
};

let characterState = { ...DEFAULT_CHARACTER };

app.get("/api/ai/messages", (req, res) => {
  res.json({ messages: messageList });
});

app.delete("/api/ai/messages", (req, res) => {
  messageList.length = 0;
  characterState = { ...DEFAULT_CHARACTER };
  res.json({ success: true });
});

app.get("/api/ai/character", (req, res) => {
  res.json(characterState);
});

app.patch("/api/ai/character", (req, res) => {
  Object.assign(characterState, req.body);
  res.json(characterState);
});

app.delete("/api/ai/character", (req, res) => {
  characterState = { ...DEFAULT_CHARACTER };
  res.json(characterState);
});

// Route pour Gemini (réponse complète)
app.post("/api/ai/generate/gemini", async (req, res) => {
  const { prompt, userMessage } = req.body;
  if (!prompt) {
    return res.status(400).send("Prompt is required.");
  }

  try {
    if (userMessage) {
      messageList.push({ sender: "player", content: userMessage });
    }
    const aiResponse = await generateGemini(prompt);
    messageList.push({ sender: "narrator", content: aiResponse });
    res.json({ text: aiResponse });
  } catch (error) {
    console.error("Error generating text:", error);
    res.status(500).send("Error generating text.");
  }
});

// Route pour Ollama avec streaming (Server-Sent Events)
app.post("/api/ai/generate/ollama/stream", (req, res) => {
  const { prompt, userMessage } = req.body;
  if (!prompt) {
    return res.status(400).send("Prompt is required.");
  }

  if (userMessage) {
    messageList.push({ sender: "player", content: userMessage });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  generateOllama(prompt, (token) => {
    res.write(`data: ${JSON.stringify({ token })}\n\n`);
  })
  .then((finalResponse) => {
    messageList.push({ sender: "narrator", content: finalResponse });
    res.write(`data: ${JSON.stringify({ done: true, response: finalResponse })}\n\n`);
    res.end();
  })
  .catch((error) => {
    console.error("Error in ollama stream:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  });
});

// Route pour OpenRouter avec streaming (Server-Sent Events)
app.post("/api/ai/generate/openrouter/stream", (req, res) => {
  const { prompt, userMessage } = req.body;
  if (!prompt) {
    return res.status(400).send("Prompt is required.");
  }

  if (userMessage) {
    messageList.push({ sender: "player", content: userMessage });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  generateOpenRouter(prompt, (token) => {
    res.write(`data: ${JSON.stringify({ token })}\n\n`);
  })
  .then((finalResponse) => {
    messageList.push({ sender: "narrator", content: finalResponse });
    res.write(`data: ${JSON.stringify({ done: true, response: finalResponse })}\n\n`);
    res.end();
  })
  .catch((error) => {
    console.error("Error in openrouter stream:", error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
