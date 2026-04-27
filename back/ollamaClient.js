import { Ollama } from 'ollama'

const ollama = new Ollama({
    host: 'http://host.docker.internal:11434', // URL de l'API Ollama
})

const SUGGESTIONS_SYSTEM_INSTRUCTION = `
Tu es un narrateur de RPG expert pour l'univers de l'Académie des Voiles Éternelles.

RÈGLES STRICTES :
1. Réponds UNIQUEMENT par un objet JSON valide.
2. N'ajoute AUCUN texte avant ou après le JSON (pas de markdown, pas de commentaires).
3. Le JSON doit suivre ce format EXACT et NON NÉGOCIABLE :
{
  "suggestions": ["texte 1", "texte 2", "texte 3"]
}
4. INTERDIT ABSOLU : pas d'objets imbriqués, pas de tableaux dans des tableaux, pas de clés autres que "suggestions". Chaque élément du tableau DOIT être une chaîne de caractères simple.
5. EXEMPLE INTERDIT (ne JAMAIS faire cela) : {"suggestions": [{"suggestions": [...]}]} ou {"suggestions": [["texte"]]}

CONSIGNE : Propose 2 ou 3 suggestions d'actions/suites d'histoire courtes (1-2 phrases chacune) pour la protagoniste Élysia. Les suggestions doivent être immersives, variées et pertinentes par rapport au contexte fourni. Ne dépasse pas 3 suggestions.
`;

export async function generateText(prompt, onTokenCallback) {
const systemInstruction = `
Tu es un narrateur de RPG expert pour l'univers de l'Académie des Voiles Éternelles.

RÈGLES STRICTES :
1. Réponds UNIQUEMENT par un objet JSON valide.
2. N'ajoute AUCUN texte avant ou après le JSON (pas de markdown, pas de commentaires).
3. Le JSON doit suivre ce format exact :
{
  "story": "Texte narratif. Utilise \\n pour les sauts de ligne. Inclus les tags [NOUVEAU_SORT:...], [NOUVEAU_OBJET:...], [OBJET_UTILISE:...], [NOUVEAU_PERSO:...], [MAJ_PERSO:...] directement dans le texte narratif si applicable.",
  "actions": [],
  "xp": 0,
  "hp": 0,
  "mana": 0,
  "personnages": [],
  "majPersonnages": []
}

Format du tableau "personnages" : [{"name": "Nom (obligatoire, utiliser \"???\" si inconnu)", "role": "Role (optionnel)", "relation": "allié|neutre|ennemi|mentor|inconnu|joueur (optionnel)", "description": "Description (optionnelle)"}]
Format du tableau "majPersonnages" : [{"name": "Nom", "role": "Nouveau role (optionnel)", "relation": "allié|neutre|ennemi|mentor|inconnu|joueur (optionnel)", "description": "Nouvelle description (optionnel)"}]

IMPORTANT : Élysia est le personnage JOUEUR. Ne JAMAIS la tagger avec [NOUVEAU_PERSO] ou [MAJ_PERSO]. Elle n'est PAS un PNJ.
`;

  try {
    const response = await ollama.chat({
        model: process.env.OLLAMA_MODEL || 'qwen3.5:9b',
        messages: [
            {role: 'system', content: systemInstruction},
            {role: 'user', content: prompt},
        ],
        json: true,
        think: false,
        stream: true
    })

    let fullResponse = '';
    let lastSentLength = 0;

    for await (const fragment of response) {
      const token = fragment.message.content;
      fullResponse += token;

      // Extraction du contenu de "story" via regex pour le streaming
      // Cette regex capture ce qui est entre les guillemets du champ story, en gérant les échappements
      const storyMatch = fullResponse.match(/"story":\s*"((?:[^"\\]|\\.)*)/);
      
      if (storyMatch && storyMatch[1]) {
        const currentStoryContent = storyMatch[1];
        // On n'envoie que le nouveau fragment de texte (le delta)
        const delta = currentStoryContent.substring(lastSentLength);
        
        if (delta) {
          onTokenCallback(delta);
          lastSentLength = currentStoryContent.length;
        }
      }
    }

    return JSON.parse(fullResponse);

  } catch (error) {
    console.error("Erreur Ollama ou Parsing:", error);
    return {
      story: "Une perturbation magique empêche la vision de se former correctement... (Erreur de l'oracle)",
      actions: [],
      xp: 0,
      hp: 0,
      mana: 0,
      personnages: [],
      majPersonnages: []
    };
  }
}

function normalizeSuggestions(parsed) {
  const results = [];
  function walk(value) {
    if (typeof value === "string") {
      results.push(value);
    } else if (Array.isArray(value)) {
      for (const item of value) walk(item);
    } else if (value && typeof value === "object") {
      for (const v of Object.values(value)) walk(v);
    }
  }
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    if (Array.isArray(parsed.suggestions)) {
      walk(parsed.suggestions);
    } else {
      walk(parsed);
    }
  } else if (Array.isArray(parsed)) {
    walk(parsed);
  }
  return results.slice(0, 3);
}

export async function generateSuggestions(prompt) {
  try {
    const response = await ollama.chat({
        model: process.env.OLLAMA_MODEL || 'qwen3.5:9b',
        messages: [
            {role: 'system', content: SUGGESTIONS_SYSTEM_INSTRUCTION},
            {role: 'user', content: prompt},
        ],
        json: true,
        think: false,
        stream: false
    });

    const rawText = response.message.content;
    const parsed = JSON.parse(rawText);
    return normalizeSuggestions(parsed);
  } catch (error) {
    console.error("Erreur Ollama Suggestions:", error);
    return [];
  }
}
