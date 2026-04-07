import { Ollama } from 'ollama'

const ollama = new Ollama({
    host: 'http://host.docker.internal:11434', // URL de l'API Ollama
})

export async function generateText(prompt, onTokenCallback) {
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
    const response = await ollama.chat({
        model: 'qwen3.5:9b',
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
      xp: 0
    };
  }
}
