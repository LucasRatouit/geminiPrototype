import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

// 3. Fonction simple d’appel
export async function generateText(prompt) {
  const res = await genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return res.candidates[0].content.parts[0].text;
}
