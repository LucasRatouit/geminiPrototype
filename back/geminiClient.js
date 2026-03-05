import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function generateText(prompt) {
  const systemInstruction = `
    Tu es un narrateur de RPG expert pour l'univers de l'Académie des Voiles Éternelles.
    
    RÈGLES STRICTES :
    1. Réponds UNIQUEMENT par un objet JSON valide.
    2. N'ajoute AUCUN texte avant ou après le JSON (pas de 'Voici le JSON', pas de markdown).
    3. Le JSON doit suivre ce format exact :
    {
      "story": "Texte narratif ici. Utilise \\n pour les sauts de ligne.",
      "actions": []
    }
  `;

  try {
    const res = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 2000, // Augmenté pour éviter la coupure du JSON
        responseMimeType: "application/json",
        thinkingConfig: {
          thinkingLevel: "low"
        }
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    let rawText = res.candidates[0].content.parts[0].text;
    return JSON.parse(rawText);

  } catch (error) {
    console.error("Erreur Gemini ou Parsing:", error);
    // En cas d'erreur, on renvoie un objet valide par défaut pour ne pas casser le front
    return {
      story: "Une perturbation magique empêche la vision de se former correctement... (Erreur de l'oracle)",
      actions: []
    };
  }
}
