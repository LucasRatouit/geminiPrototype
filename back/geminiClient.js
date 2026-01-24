import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function generateText(prompt, messageList) {
  const systemInstruction = `
    Tu es un narrateur de RPG.
    Continue cette histoire en 2 ou 3 phrases.
    Respecte strictement la cohérence de l'histoire en prenant en compte les précédents messages [${messageList.join(", ")}].
    (En sachant que les messages impairés sont des actions du joueur et les messages pairs sont des actions du narrateur).
  `;

  const res = await genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.9, // Ajustez la température selon vos besoins - plus élevée = plus créatif - plus basse = plus conservateur
      topP: 0.95, // Ajustez la topP selon vos besoins - plus haute = plus créatif - plus basse = plus conservateur
      topK: 40, // Ajustez la topK selon vos besoins - plus haute = plus creatif - plus basse = plus conservateur
    },
    contents: prompt
  });

  return res.candidates[0].content.parts[0].text;
}
