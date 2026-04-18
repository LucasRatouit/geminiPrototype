import "dotenv/config";
import express from "express";
import cors from "cors";
import { generateText as generateGemini } from "./geminiClient.js";
import { generateText as generateOllama } from "./ollamaClient.js";

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
app.get("/api/ai/generate/ollama/stream", (req, res) => {
  const prompt = req.query.prompt;
  const userMessage = req.query.userMessage;
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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
