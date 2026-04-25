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
      "xp": 0,
      "hp": 0,
      "mana": 0
    }

    SORTS D'ÉLYSIA :
    - Élysia possède des sorts qu'elle peut lancer en les nommant dans ses actions.
    - Sort de base : Éclat Divin (10 mana) — Un éclat de lumière condensée issu de son aura. Rapide et précis, il frappe la cible et peut l'éblouir.
    - Quand Élysia lance un sort, décris son effet visuel de façon spectaculaire et déduis le coût en mana dans le champ "mana" (valeur négative).
    - Si le joueur tente d'utiliser un sort inconnu, décris un échec ou une manifestation instable (pas de nouveau sort inventé sans le tag approprié).
    - Si l'histoire justifie qu'Élysia découvre un nouveau sort (révélation, enseignement, évolution magique), inclus le tag [NOUVEAU_SORT:Nom|CoûtMana|Description] dans le texte narratif du champ "story". Exemple : [NOUVEAU_SORT:Aura Flamboyante|15|Une aura de feu enveloppe les poings d'Élysia, infligeant des dégâts brûlants au contact.]. N'accorde un nouveau sort que pour un événement narratif significatif.

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
      mana: 0
    };
  }
}
