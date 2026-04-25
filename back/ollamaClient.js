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
      "story": "Texte narratif ici. Utilise \\n pour les sauts de ligne. Inclus les tags [NOUVEAU_SORT:...], [NOUVEAU_OBJET:...], [OBJET_UTILISE:...], [NOUVEAU_PERSO:...], [MAJ_PERSO:...] directement dans le texte narratif si applicable.",
      "actions": [],
      "xp": 0,
      "hp": 0,
      "mana": 0,
      "personnages": [],
      "majPersonnages": []
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

    BESACE D'ÉLYSIA :
    - Élysia possède une besace contenant des objets consommables (potions, artefacts, etc.).
    - Objets de départ : Potion de Soin (hp +10), Potion de Mana (mana +15).
    - Quand Élysia utilise un objet par son nom dans son action, décris l'effet narratif de façon immersive et ajoute le tag [OBJET_UTILISE:Nom] dans le champ "story". L'objet est alors consommé et retiré de la besace.
    - L'effet de l'objet est automatiquement appliqué via les tags [VIE:+montant] ou [MANA:+montant] existants. Par exemple, une Potion de Soin donne [VIE:+10], une Potion de Mana donne [MANA:+15].
    - Si le joueur tente d'utiliser un objet qu'il ne possède pas, décris une recherche vaine dans la besace.
    - Si l'histoire justifie qu'Élysia trouve ou reçoive un nouvel objet (butin, récompense, découverte), inclus le tag [NOUVEAU_OBJET:Nom|TypeEffet|Valeur|Description] dans le champ "story". TypeEffet est "hp" ou "mana". Exemple : [NOUVEAU_OBJET:Fiole de Lune|mana|20|Un liquide argenté qui restaura l'énergie arcanique avec une douceur surnaturelle.]. N'accorde un nouvel objet que pour un événement narratif significatif.

    PERSONNAGES :
    - OBLIGATOIRE : Chaque fois qu'un personnage nommé apparaît pour la première fois dans l'histoire, inclus IMMÉDIATEMENT le tag [NOUVEAU_PERSO:...] dans le champ "story" ET ajoute une entrée dans le tableau "personnages" du JSON. Tu peux utiliser des formats partiels : [NOUVEAU_PERSO:Nom] si tu connais juste le nom, [NOUVEAU_PERSO:Nom|Role], [NOUVEAU_PERSO:Nom|Role|Relation], ou le format complet [NOUVEAU_PERSO:Nom|Role|Relation|Description]. Si le nom est inconnu, utilise [NOUVEAU_PERSO:???|Role|Relation|Description]. N'attends PAS qu'un personnage soit « significatif » — enregistre-le dès sa première apparition.
    - Si un personnage déjà connu révèle de nouvelles informations, inclus le tag [MAJ_PERSO:Nom|NouveauRole|NouvelleRelation|NouvelleDescription] (ou partiel : [MAJ_PERSO:Nom|NouvelleDescription]) dans le champ "story" ET ajoute une entrée dans le tableau "majPersonnages" du JSON. Les champs fournis remplacent les anciens.
    - Format du tableau "personnages" : [{"name": "Nom (obligatoire, utiliser \"???\" si inconnu)", "role": "Role (optionnel)", "relation": "allié|neutre|ennemi|mentor|inconnu (optionnel)", "description": "Description (optionnelle)"}]
    - Format du tableau "majPersonnages" : [{"name": "Nom", "role": "Nouveau role (optionnel)", "relation": "allié|neutre|ennemi|mentor|inconnu (optionnel)", "description": "Nouvelle description (optionnel)"}]
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
