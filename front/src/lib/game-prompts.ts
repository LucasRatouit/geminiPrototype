import type { Spell } from "./constants";
import type { InventoryItem } from "./constants";
import type { NPC } from "./constants";
import { NPC_LIMIT } from "./constants";
import type { GameStats } from "@/hooks/useGameState";

const NARRATIVE_CONTEXT = `
PERSONNAGE : Élysia (17 ans, cheveux roses, yeux bleu cristallin).
CONTEXTE : Apprentie à l'Académie des Voiles Éternelles. Elle est la réincarnation fragmentée d'une Archimage oubliée.
IMPORTANT : Élysia est le personnage JOUEUR. Ne JAMAIS la tagger avec [NOUVEAU_PERSO] ou [MAJ_PERSO]. Elle n'est PAS un PNJ — elle est déjà connue et ne doit jamais apparaître dans les tags de personnages.
COHÉRENCE : Avant de décrire toute action d'Élysia, vérifie TOUJOURS :
- Si le joueur demande de lancer un sort : le sort est-il dans la liste SORTS CONNUS ? Le mana actuel est-il suffisant ? Si le mana est insuffisant, décris un échec magique — le sort ne se lance PAS.
- Si le joueur demande d'utiliser un objet : l'objet est-il dans la BESACE ? Si l'objet n'y figure pas, décris que la besace ne contient pas cet objet — il n'est PLUS disponible.
- Si les PV d'Élysia sont bas, décris sa fatigue et ses blessures dans la narration.
- Si le mana d'Élysia est bas, décris son épuisement magique et ses sortilèges qui faiblissent.
TON : Mystérieux, poétique, immersif (5 sens).
XP : Si Élysia mérite de l'expérience (action notable, découverte, combat gagné, progression narrative), ajoute [XP:montant] à la fin (montant entre 5 et 25, jamais plus). Pour un événement majeur (quête terminée, rituel accompli), utilise [QUETE_TERMINEE:Nom|montant]. Pas d'XP pour les échecs ou actions triviales.
VIE : Si Élysia subit des dégâts, ajoute [VIE:-montant] (5-15 mineur, 15-30 sérieux, 30-50 critique). Si elle est soignée ou se repose, ajoute [VIE:+montant] (5-10 repos, 10-25 soin magique). Pas de tag si pas de changement.
MANA : Si Élysia lance un sort, ajoute [MANA:-montant] (5-15 sort mineur, 15-25 sort majeur). Si elle récupère du mana (méditation, potion), ajoute [MANA:+montant] (5-15). Pas de tag si pas de changement.
NOUVEAU_SORT : Si l'histoire justifie qu'Élysia apprenne ou découvre un nouveau sort (révélation, enseignement, évolution magique), ajoute le tag [NOUVEAU_SORT:Nom|CoûtMana|Description] dans ta réponse. Exemple : [NOUVEAU_SORT:Aura Flamboyante|15|Une aura de feu enveloppe les poings d'Élysia, infligeant des dégâts brûlants au contact.]. N'accorde un nouveau sort que pour un événement narratif significatif, pas pour une action triviale.
OBJET : Si Élysia utilise un objet de sa besace par son nom dans son action, décris l'effet narratif de façon immersive et ajoute le tag [OBJET_UTILISE:Nom] dans ta réponse. L'objet est consommé et retiré de la besace. L'effet est appliqué via les tags [VIE:+montant] ou [MANA:+montant] existants. IMPORTANT : Ne JAMAIS utiliser un objet qui n'est pas listé dans la section BESACE ci-dessous. Si la besace est vide ou ne contient pas l'objet demandé, décris une recherche vaine dans le sac — l'objet n'est plus disponible.
NOUVEAU_OBJET : Si l'histoire justifie qu'Élysia trouve ou reçoive un nouvel objet (butin, récompense, découverte), ajoute le tag [NOUVEAU_OBJET:Nom|TypeEffet|Valeur|Description] dans ta réponse. TypeEffet est "hp" ou "mana". Exemple : [NOUVEAU_OBJET:Fiole de Lune|mana|20|Un liquide argenté qui restaure l'énergie arcanique avec une douceur surnaturelle.]. N'accorde un nouvel objet que pour un événement narratif significatif.
NOUVEAU_PERSO : OBLIGATOIRE. Chaque fois qu'un personnage nommé apparaît pour la première fois dans l'histoire, inclus IMMÉDIATEMENT un tag [NOUVEAU_PERSO:...] dans ta réponse. Tu peux utiliser des formats partiels : [NOUVEAU_PERSO:Nom] (seul le nom), [NOUVEAU_PERSO:Nom|Role], [NOUVEAU_PERSO:Nom|Role|Relation], ou le format complet [NOUVEAU_PERSO:Nom|Role|Relation|Description]. Si le nom du personnage est inconnu, utilise ??? comme nom. Les champs manquants seront remplis automatiquement. Exemples : [NOUVEAU_PERSO:Barl] si tu connais juste le nom, [NOUVEAU_PERSO:???|ennemi|Une silhouette sombre dans l'ombre] si le nom est inconnu, [NOUVEAU_PERSO:Maître Aldric|Archiviste|mentor|Un vieil homme aux yeux d'argent] pour un personnage complet. N'attends PAS qu'un personnage soit « significatif » — enregistre-le dès sa première apparition. EXCEPTION : Ne JAMAIS tagger Élysia avec [NOUVEAU_PERSO] ou [MAJ_PERSO]. C'est le personnage joueur, pas un PNJ.
MAJ_PERSO : Si un personnage déjà connu révèle de nouvelles informations (changement d'allégeance, révélation, évolution), ajoute le tag [MAJ_PERSO:Nom|NouveauRole|NouvelleRelation|NouvelleDescription] dans ta réponse. Tu peux aussi utiliser le format partiel [MAJ_PERSO:Nom|NouvelleDescription] pour mettre à jour uniquement la description. La mise à jour remplace les champs fournis et conserve les autres. EXCEPTION : Ne JAMAIS tagger Élysia avec [MAJ_PERSO].`;

export const getSpellListContext = (spells: Spell[], currentMana?: number): string => {
  if (spells.length === 0) return "\nSORTS CONNUS D'ÉLYSIA :\nAucun sort connu. Élysia ne peut lancer aucun sort.\n";
  const spellLines = spells.map((s) => {
    const affordable = currentMana !== undefined ? s.manaCost <= currentMana : true;
    return `- ${s.name} (${s.manaCost} mana)${!affordable ? " — ⚠️ MANA INSUFFISANT" : ""} : ${s.description}`;
  }).join("\n");
  let manaNote = "";
  if (currentMana !== undefined) {
    const unaffordable = spells.filter(s => s.manaCost > currentMana);
    if (unaffordable.length > 0) {
      manaNote = `\nATTENTION : Élysia n'a que ${currentMana} mana. Les sorts marqués ⚠️ ne peuvent PAS être lancés. Si le joueur tente un sort inaccessible, décris un échec ou une manifestation instable.`;
    }
  }
  return `\nSORTS CONNUS D'ÉLYSIA :\n${spellLines}${manaNote}\nSi le joueur mentionne un sort par son nom dans son action, vérifie d'abord que le mana actuel est suffisant. Si oui, décris l'effet narratif du sort et ajoute [MANA:-coût]. Si le mana est insuffisant, décris un échec ou une manifestation magique instable. Si le joueur tente d'utiliser un sort inconnu, décris un échec magique.\n`;
};

export const getStatsContext = (stats: GameStats, spells: Spell[], inventory: InventoryItem[]): string => {
  const hpPercent = Math.round((stats.hp / stats.hpMax) * 100);
  const manaPercent = Math.round((stats.mana / stats.manaMax) * 100);
  let hpWarning = "";
  if (hpPercent <= 25) hpWarning = " ⚠️ CRITIQUE — Élysia est gravement blessée, elle peine à rester debout.";
  else if (hpPercent <= 50) hpWarning = " ⚠️ Élysia est blessée, elle montre des signes de fatigue.";
  let manaWarning = "";
  if (manaPercent <= 0) manaWarning = " ⚠️ ÉPUISE — Élysia n'a plus aucune réserve de mana, elle ne peut lancer aucun sort.";
  else if (manaPercent <= 25) manaWarning = " ⚠️ Les réserves de mana d'Élysia sont presque épuisées, seuls les sorts les moins coûteux sont possibles.";

  const affordableSpells = spells.filter(s => s.manaCost <= stats.mana);
  const unaffordableSpells = spells.filter(s => s.manaCost > stats.mana);

  let spellAvailability = "";
  if (affordableSpells.length > 0) {
    spellAvailability = `\nSorts lançables maintenant : ${affordableSpells.map(s => `${s.name} (${s.manaCost} mana)`).join(", ")}.`;
  }
  if (unaffordableSpells.length > 0) {
    spellAvailability += `\nSorts NON lançables (mana insuffisant) : ${unaffordableSpells.map(s => `${s.name} (coût ${s.manaCost} mana > mana actuel ${stats.mana})`).join(", ")}.`;
  }

  let itemAvailability = "";
  if (inventory.length > 0) {
    itemAvailability = `\nObjets disponibles : ${inventory.map(i => i.name).join(", ")}.`;
  } else {
    itemAvailability = "\nLa besace est VIDE — aucun objet disponible.";
  }

  return `\nÉTAT ACTUEL D'ÉLYSIA :
- Niveau ${stats.level} (Rang ${stats.rank})
- PV : ${stats.hp}/${stats.hpMax}${hpWarning}
- Mana : ${stats.mana}/${stats.manaMax}${manaWarning}
- XP : ${stats.xp}/${stats.xpMax}
- Force : ${stats.strength} | Intelligence : ${stats.intelligence} | Esprit : ${stats.spirit} | Agilité : ${stats.agility} | Charisme : ${stats.charisma}
${spellAvailability}${itemAvailability}
VÉRIFICATION OBLIGATOIRE AVANT CHAQUE ACTION :
1) Si le joueur demande de lancer un sort : vérifie que le sort est dans la liste SORTS CONNUS ET que le mana actuel est suffisant. Si mana insuffisant, décris un échec ou une manifestation magique instable — ne lance PAS le sort.
2) Si le joueur demande d'utiliser un objet : vérifie que l'objet est dans la BESACE ci-dessus. Si l'objet n'y figure pas, décris que la besace ne contient pas cet objet — l'objet n'est PLUS disponible.
3) Si les PV d'Élysia sont bas, décris sa fatigue et ses blessures dans la narration.
4) Si le mana d'Élysia est bas, décris son épuisement magique.
`;
};

export const getInventoryListContext = (items: InventoryItem[]): string => {
  if (items.length === 0) return "\nBESACE D'ÉLYSIA :\n(vide)\nIMPORTANT : La besace d'Élysia est VIDE. Elle ne possède AUCUN objet. Ne fais PAS utiliser de potion ou d'objet dans ta réponse. Si le joueur demande d'utiliser un objet, décris qu'elle fouille son sac mais ne trouve rien — l'objet n'existe pas.\n";
  const itemLines = items.map((i) => `- ${i.name} (${i.effectType === "hp" ? "+HP" : "+Mana"} ${i.effectValue > 0 ? "+" : ""}${i.effectValue} ${i.effectType === "hp" ? "PV" : "mana"}) : ${i.description}`).join("\n");
  return `\nBESACE D'ÉLYSIA :\n${itemLines}\nLISTE EXHAUSTIVE : Seuls les objets listés ci-dessus sont disponibles. Tout objet NON listé n'existe PAS dans la besace et ne peut PAS être utilisé. Si le joueur mentionne un objet par son nom dans son action, vérifie d'abord qu'il figure dans cette liste. Si l'objet n'est pas listé, décris une recherche vaine dans le sac — l'objet n'est plus disponible. Si l'objet est listé, décris son effet narratif, ajoute le tag [OBJET_UTILISE:Nom] et applique l'effet avec [VIE:+montant] ou [MANA:+montant] selon le type de l'objet.\n`;
};

export const getNPCListContext = (npcs: NPC[]): string => {
  const filteredNpcs = npcs.filter((n) => n.relation !== "joueur");
  if (filteredNpcs.length === 0) return "\nPERSONNAGES CONNUS :\nAucun PNJ rencontré pour l'instant. Si un NOUVEAU personnage apparaît, ajoute IMMÉDIATEMENT un tag [NOUVEAU_PERSO:...]. EXCEPTION : Ne JAMAIS tagger Élysia (le personnage joueur) avec [NOUVEAU_PERSO] ou [MAJ_PERSO].\n";
  const recentNpcs = filteredNpcs.slice(-NPC_LIMIT);
  const npcLines = recentNpcs.map((n) => `- ${n.name} (${n.role}, ${n.relation}) : ${n.description}`).join("\n");
  return `\nPERSONNAGES CONNUS :\n${npcLines}\nSi un de ces personnages réapparaît dans l'histoire, reste cohérent avec sa description et sa relation avec Élysia. Si un personnage connu subit un changement, utilise [MAJ_PERSO:Nom|NouveauRole|NouvelleRelation|NouvelleDescription] (ou partiel : [MAJ_PERSO:Nom|NouvelleDescription]). Si un NOUVEAU personnage apparaît et n'est PAS dans cette liste, AJOUTE IMMÉDIATEMENT un tag [NOUVEAU_PERSO:...]. IMPORTANT : Élysia est le personnage joueur — ne JAMAIS la tagger avec [NOUVEAU_PERSO] ou [MAJ_PERSO].\n`;
};

export const getOpeningHookPrompt = (spells?: Spell[], inventory?: InventoryItem[], npcs?: NPC[], stats?: GameStats) => `
${NARRATIVE_CONTEXT}${getSpellListContext(spells ?? [], stats?.mana)}${getInventoryListContext(inventory ?? [])}${getNPCListContext(npcs ?? [])}${stats ? getStatsContext(stats, spells ?? [], inventory ?? []) : ""}

CONSIGNE : Tu es le narrateur. Génère une scène d'ouverture immersive (2-4 phrases) pour commencer l'aventure.
Décris Élysia qui s'éveille dans sa chambre à l'Académie des Voiles Éternelles, au petit matin.
Inclus des détails sensoriels (lumière, sons, odeurs) et un élément mystérieux qui donne envie de continuer.
Mentionne subtilement que le premier sort d'Élysia, Éclat Divin, palpite dans son aura — comme une promesse de puissance encore endormie.
Termine par une invitation implicite à l'action.
`;

export const getActionPrompt = (action: string, history: string[], spells?: Spell[], inventory?: InventoryItem[], npcs?: NPC[], stats?: GameStats) => `
${NARRATIVE_CONTEXT}${getSpellListContext(spells ?? [], stats?.mana)}${getInventoryListContext(inventory ?? [])}${getNPCListContext(npcs ?? [])}${stats ? getStatsContext(stats, spells ?? [], inventory ?? []) : ""}

DERNIERS ÉVÉNEMENTS :
${history.slice(-10).join("\n")}

ACTION DU JOUEUR : "${action}"

CONSIGNE : Décris la suite (3-5 phrases). Réagis à l'action et décris l'environnement. Si le joueur mentionne un sort par son nom, vérifie d'abord que le sort est connu ET que le mana est suffisant. Si le mana est insuffisant, décris un échec magique au lieu de lancer le sort. Si le joueur utilise un objet de sa besace, vérifie d'abord que l'objet est dans la liste ci-dessus. Si l'objet n'est pas dans la besace, décris une recherche vaine. OBLIGATOIRE : Si la scène introduit un personnage qui n'est pas encore dans la liste des personnages connus, inclus IMMÉDIATEMENT un tag [NOUVEAU_PERSO:Nom] minimum. Même si tu ne connais que le nom, écris [NOUVEAU_PERSO:Nom]. Si le nom est inconnu, utilise [NOUVEAU_PERSO:???|...]. Si un personnage connu change, inclus [MAJ_PERSO:Nom|...].
`;

export const getContinuePrompt = (history: string[], spells?: Spell[], inventory?: InventoryItem[], npcs?: NPC[], stats?: GameStats) => `
${NARRATIVE_CONTEXT}${getSpellListContext(spells ?? [], stats?.mana)}${getInventoryListContext(inventory ?? [])}${getNPCListContext(npcs ?? [])}${stats ? getStatsContext(stats, spells ?? [], inventory ?? []) : ""}

DERNIERS ÉVÉNEMENTS :
${history.slice(-10).join("\n")}

CONSIGNE : Continue l'histoire naturellement (3-5 phrases). Introduis un petit événement ou un PNJ. OBLIGATOIRE : Si tu introduis un personnage qui n'est pas dans la liste des personnages connus, inclus IMMÉDIATEMENT un tag [NOUVEAU_PERSO:Nom] minimum. Même si tu ne connais que le nom, écris [NOUVEAU_PERSO:Nom]. Si le nom est inconnu, utilise [NOUVEAU_PERSO:???|...]. Si un personnage connu change, inclus [MAJ_PERSO:Nom|...].
`;

export const getSuggestionsPrompt = (history: string[], spells?: Spell[], inventory?: InventoryItem[], npcs?: NPC[], stats?: GameStats) => `
${NARRATIVE_CONTEXT}${getSpellListContext(spells ?? [], stats?.mana)}${getInventoryListContext(inventory ?? [])}${getNPCListContext(npcs ?? [])}${stats ? getStatsContext(stats, spells ?? [], inventory ?? []) : ""}

DERNIERS ÉVÉNEMENTS :
${history.slice(-10).join("\n")}

CONSIGNE : Tu es le narrateur. Propose 2 ou 3 suggestions d'actions ou de suites d'histoire pour la protagoniste Élysia.
Chaque suggestion doit être courte (1-2 phrases), immersive, et offrir une direction narrative intéressante et distincte des autres.
Ne propose pas plus de 3 suggestions. Réponds UNIQUEMENT en JSON avec ce format exact :
{
  "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3 (optionnelle)"]
}
`;


export function parseNewSpellsFromText(text: string): Spell[] {
  const regex = /\[NOUVEAU_SORT:([^|]+)\|(\d+)\|([^\]]+)\]/g;
  const spells: Spell[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    spells.push({
      name: match[1].trim(),
      manaCost: parseInt(match[2]),
      description: match[3].trim(),
    });
  }
  return spells;
}

export function parseNewItemsFromText(text: string): InventoryItem[] {
  const regex = /\[NOUVEAU_OBJET:([^|]+)\|([^|]+)\|(\d+)\|([^\]]+)\]/g;
  const items: InventoryItem[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const effectType = match[2].trim().toLowerCase();
    if (effectType === "hp" || effectType === "mana") {
      items.push({
        name: match[1].trim(),
        effectType,
        effectValue: parseInt(match[3]),
        description: match[4].trim(),
      });
    }
  }
  return items;
}

export function parseUsedItemsFromText(text: string): string[] {
  const regex = /\[OBJET_UTILISE:([^\]]+)\]/g;
  const names: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    names.push(match[1].trim());
  }
  return names;
}

const VALID_RELATIONS = ["joueur", "allié", "neutre", "ennemi", "mentor", "inconnu"];

const NPC_DEFAULTS: { role: string; relation: NPC["relation"]; description: string } = {
  role: "Inconnu",
  relation: "inconnu",
  description: "",
};

export function parseNewNPCsFromText(text: string): NPC[] {
  const npcs: NPC[] = [];
  const fullRegex = /\[NOUVEAU_PERSO:([^|\]]+)\|([^|\]]+)\|([^|\]]+)\|([^\]]+)\]/g;
  let match;
  while ((match = fullRegex.exec(text)) !== null) {
    const relation = match[3].trim().toLowerCase();
    npcs.push({
      name: match[1].trim(),
      role: match[2].trim() || NPC_DEFAULTS.role,
      relation: VALID_RELATIONS.includes(relation) ? relation as NPC["relation"] : NPC_DEFAULTS.relation,
      description: match[4].trim() || NPC_DEFAULTS.description,
    });
  }
  const partialRegex = /\[NOUVEAU_PERSO:([^|\]]+)(?:\|([^|\]]+))?(?:\|([^|\]]+))?\](?!\[)/g;
  while ((match = partialRegex.exec(text)) !== null) {
    const name = match[1].trim();
    if (npcs.some((n) => n.name === name)) continue;
    const field2 = match[2]?.trim() || "";
    const field3 = match[3]?.trim() || "";
    const isValidRelation = VALID_RELATIONS.includes(field2.toLowerCase());
    const isValidRelation3 = VALID_RELATIONS.includes(field3.toLowerCase());
    if (field3 && isValidRelation3) {
      npcs.push({
        name,
        role: field2 || NPC_DEFAULTS.role,
        relation: field3.toLowerCase() as NPC["relation"],
        description: NPC_DEFAULTS.description,
      });
    } else if (field2 && isValidRelation) {
      npcs.push({
        name,
        role: NPC_DEFAULTS.role,
        relation: field2.toLowerCase() as NPC["relation"],
        description: NPC_DEFAULTS.description,
      });
    } else if (field2) {
      npcs.push({
        name,
        role: field2,
        relation: NPC_DEFAULTS.relation,
        description: NPC_DEFAULTS.description,
      });
    } else {
      npcs.push({
        name,
        role: NPC_DEFAULTS.role,
        relation: NPC_DEFAULTS.relation,
        description: NPC_DEFAULTS.description,
      });
    }
  }
  return npcs;
}

export interface NPCUpdate {
  name: string;
  role?: string;
  relation?: NPC["relation"];
  description?: string;
}

export function parseUpdatedNPCsFromText(text: string): NPCUpdate[] {
  const updates: NPCUpdate[] = [];
  const fullRegex = /\[MAJ_PERSO:([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g;
  let match;
  while ((match = fullRegex.exec(text)) !== null) {
    const relation = match[3].trim().toLowerCase();
    updates.push({
      name: match[1].trim(),
      role: match[2].trim(),
      relation: VALID_RELATIONS.includes(relation) ? relation as NPC["relation"] : undefined,
      description: match[4].trim(),
    });
  }
  const partialRegex = /\[MAJ_PERSO:([^|]+)\|([^\]]+)\]/g;
  while ((match = partialRegex.exec(text)) !== null) {
    const name = match[1].trim();
    if (updates.some((u) => u.name === name)) continue;
    updates.push({
      name,
      description: match[2].trim(),
    });
  }
  return updates;
}