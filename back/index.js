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

app.get("/ai/messages", (req, res) => {
  res.json({ messages: messageList });
});

// Route pour Gemini (réponse complète)
app.post("/ai/generate/gemini", async (req, res) => {
  const userMessage = req.body.prompt;
  if (!userMessage) {
    return res.status(400).send("Prompt is required.");
  }

  try {
    const aiResponse = await generateGemini(userMessage);
    res.json({ text: aiResponse });
  } catch (error) {
    console.error("Error generating text:", error);
    res.status(500).send("Error generating text.");
  }
});

// Route pour Ollama avec streaming (Server-Sent Events)
app.get("/ai/generate/ollama/stream", (req, res) => {
  const prompt = req.query.prompt;
  if (!prompt) {
    return res.status(400).send("Prompt is required.");
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  generateOllama(prompt, (token) => {
    res.write(`data: ${JSON.stringify({ token })}\n\n`);
  })
  .then((finalResponse) => {
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
