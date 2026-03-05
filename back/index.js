import "dotenv/config";
import express from "express";
import cors from "cors";
import { generateText } from "./geminiClient.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const messageList = [];

app.get("/ai/messages", (req, res) => {
  res.json({ messages: messageList });
});

app.post("/ai/generate", async (req, res) => {
  const userMessage = req.body.prompt;
  if (!userMessage) {
    return res.status(400).send("Prompt is required.");
  }

  try {
    const aiResponse = await generateText(userMessage);
    // On peut logger ici si besoin pour le debug
    res.json({ text: aiResponse });
  } catch (error) {
    console.error("Error generating text:", error);
    res.status(500).send("Error generating text.");
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
