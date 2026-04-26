const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

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

export async function generateText(prompt, onTokenCallback) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free';

  if (!apiKey) {
    console.error("OPENROUTER_API_KEY is not set");
    return {
      story: "La clé OpenRouter n'est pas configurée... (Erreur de configuration)",
      actions: [],
      xp: 0,
      hp: 0,
      mana: 0,
      personnages: [],
      majPersonnages: []
    };
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        reasoning: { enabled: false },
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${errorBody}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let fullResponse = '';
    let lastSentLength = 0;
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            fullResponse += content;

            const storyMatch = fullResponse.match(/"story":\s*"((?:[^"\\]|\\.)*)/);

            if (storyMatch && storyMatch[1]) {
              const currentStoryContent = storyMatch[1];
              const delta = currentStoryContent.substring(lastSentLength);

              if (delta) {
                onTokenCallback(delta);
                lastSentLength = currentStoryContent.length;
              }
            }
          }
        } catch {
          // Ignore malformed JSON chunks during streaming
        }
      }
    }

    let parsed;
    try {
      parsed = JSON.parse(fullResponse);
    } catch {
      console.error("OpenRouter: réponse non-JSON brute :", fullResponse.slice(0, 200));
      return {
        story: "La réponse de l'oracle est illisible... (Erreur de parsing)",
        actions: [],
        xp: 0,
        hp: 0,
        mana: 0,
        personnages: [],
        majPersonnages: []
      };
    }

    if (!parsed || typeof parsed.story !== 'string') {
      console.error("OpenRouter: réponse inattendue :", JSON.stringify(parsed).slice(0, 200));
      return {
        story: typeof parsed?.story === 'string' ? parsed.story : "L'oracle n'a pas transmis de vision... (Réponse invalide)",
        actions: Array.isArray(parsed?.actions) ? parsed.actions : [],
        xp: typeof parsed?.xp === 'number' ? parsed.xp : 0,
        hp: typeof parsed?.hp === 'number' ? parsed.hp : 0,
        mana: typeof parsed?.mana === 'number' ? parsed.mana : 0,
        personnages: Array.isArray(parsed?.personnages) ? parsed.personnages : [],
        majPersonnages: Array.isArray(parsed?.majPersonnages) ? parsed.majPersonnages : []
      };
    }

    return parsed;

  } catch (error) {
    console.error("Erreur OpenRouter ou Parsing:", error);
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