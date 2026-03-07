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
      "actions": [],
      "xp": 0
    }

    LOGIQUE D'EXPÉRIENCE (XP) :
    - Attribue des XP (champ "xp") uniquement si le joueur réalise une action significative : victoire en combat, découverte d'un secret, résolution d'un puzzle ou utilisation créative de ses sorts.
    - Si l'action est triviale ou purement narrative sans effort particulier, "xp" doit être égal à 0.
    - Échelle suggérée : 5-15 XP pour une action mineure, 20-50 XP pour un accomplissement majeur.
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
      actions: [],
      xp: 0
    };
  }
}
