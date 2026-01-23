import "dotenv/config";
import express from "express";
import cors from "cors";
import { generateText } from "./geminiClient.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const messageList = [];

const promptContextTest = `
Tu es un narrateur de RPG.
Continue cette histoire en 3 phrases,
en prenant en compte les précédents messages [${messageList.join(", ")}]
(En sachant que les messages impairés sont des actions du joueur
et les messages pairs sont des actions du narrateur). :
`;

app.get("/ai/messages", (req, res) => {
  res.json({ messages: messageList });
});

app.post("/ai/generate", async (req, res) => {
  const userMessage = req.body.prompt;
  if (!userMessage) {
    return
  }
  const prompt = `${promptContextTest} ${userMessage}`;
  if (!prompt) {
    return res.status(400).send("Prompt query parameter is required.");
  }

  try {
    const text = await generateText(prompt);
    messageList.push(userMessage);
    messageList.push(text);
    res.json({ text });
  } catch (error) {
    console.error("Error generating text:", error);
    res.status(500).send("Error generating text.");
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
