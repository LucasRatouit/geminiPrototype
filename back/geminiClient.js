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
      "xp": 0,
      "hp": 0,
      "mana": 0
    }

    LOGIQUE D'EXPÉRIENCE (XP) :
    - Attribue des XP (champ "xp") uniquement si le joueur réalise une action significative : victoire en combat, découverte d'un secret, résolution d'un puzzle ou utilisation créative de ses sorts.
    - Si l'action est triviale ou purement narrative sans effort particulier, "xp" doit être égal à 0.
    - Échelle suggérée : 5-15 XP pour une action mineure, 20-50 XP pour un accomplissement majeur.

    LOGIQUE DE VIE (HP) :
    - Le champ "hp" représente un delta (changement) : valeur négative = dégâts reçus, valeur positive = soins reçus, 0 = pas de changement.
    - Attribue des dégâts si Élysia est blessée, attaquée, chute, subit un sort ennemi, etc. Échelle : 5-15 pour une blessure mineure, 15-30 pour une blessure sérieuse, 30-50 pour une blessure critique.
    - Attribue des soins si Élysia utilise une potion, reçoit un sort de guérison, ou se repose. Échelle : 5-10 pour un repos partiel, 10-25 pour un soin magique.
    - Si l'action n'implique aucun combat, blessure ou soin, "hp" doit être égal à 0.

    LOGIQUE DE MANA :
    - Le champ "mana" représente un delta : valeur négative = consommation de mana pour un sort, valeur positive = récupération de mana, 0 = pas de changement.
    - Si Élysia lance un sort, consomme du mana. Échelle : 5-15 pour un sort mineur, 15-25 pour un sort majeur.
    - Si Élysia médite, boit une potion de mana ou se repose longtemps, récupère du mana. Échelle : 5-15.
    - Si aucune magie n'est impliquée, "mana" doit être égal à 0.
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
      xp: 0,
      hp: 0,
      mana: 0
    };
  }
}
