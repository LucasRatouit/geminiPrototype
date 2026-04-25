import type { Spell } from "./constants";
import type { InventoryItem } from "./constants";
import type { NPC } from "./constants";
import { NPC_LIMIT } from "./constants";

const NARRATIVE_CONTEXT = `
PERSONNAGE : Élysia (17 ans, cheveux roses, yeux bleu cristallin).
CONTEXTE : Apprentie à l'Académie des Voiles Éternelles. Elle est la réincarnation fragmentée d'une Archimage oubliée.
TON : Mystérieux, poétique, immersif (5 sens).
XP : Si Élysia mérite de l'expérience (action notable, découverte, combat gagné, progression narrative), ajoute [XP:montant] à la fin (montant entre 5 et 25, jamais plus). Pour un événement majeur (quête terminée, rituel accompli), utilise [QUETE_TERMINEE:Nom|montant]. Pas d'XP pour les échecs ou actions triviales.
VIE : Si Élysia subit des dégâts, ajoute [VIE:-montant] (5-15 mineur, 15-30 sérieux, 30-50 critique). Si elle est soignée ou se repose, ajoute [VIE:+montant] (5-10 repos, 10-25 soin magique). Pas de tag si pas de changement.
MANA : Si Élysia lance un sort, ajoute [MANA:-montant] (5-15 sort mineur, 15-25 sort majeur). Si elle récupère du mana (méditation, potion), ajoute [MANA:+montant] (5-15). Pas de tag si pas de changement.
NOUVEAU_SORT : Si l'histoire justifie qu'Élysia apprenne ou découvre un nouveau sort (révélation, enseignement, évolution magique), ajoute le tag [NOUVEAU_SORT:Nom|CoûtMana|Description] dans ta réponse. Exemple : [NOUVEAU_SORT:Aura Flamboyante|15|Une aura de feu enveloppe les poings d'Élysia, infligeant des dégâts brûlants au contact.]. N'accorde un nouveau sort que pour un événement narratif significatif, pas pour une action triviale.
OBJET : Si Élysia utilise un objet de sa besace par son nom dans son action, décris l'effet narratif de façon immersive et ajoute le tag [OBJET_UTILISE:Nom] dans ta réponse. L'objet est consommé et retiré de la besace. L'effet est appliqué via les tags [VIE:+montant] ou [MANA:+montant] existants. Si le joueur tente d'utiliser un objet absent de sa besace, décris une recherche vaine.
NOUVEAU_OBJET : Si l'histoire justifie qu'Élysia trouve ou reçoive un nouvel objet (butin, récompense, découverte), ajoute le tag [NOUVEAU_OBJET:Nom|TypeEffet|Valeur|Description] dans ta réponse. TypeEffet est "hp" ou "mana". Exemple : [NOUVEAU_OBJET:Fiole de Lune|mana|20|Un liquide argenté qui restaure l'énergie arcanique avec une douceur surnaturelle.]. N'accorde un nouvel objet que pour un événement narratif significatif.
NOUVEAU_PERSO : OBLIGATOIRE. Chaque fois qu'un personnage nommé apparaît pour la première fois dans l'histoire, inclus IMMÉDIATEMENT un tag [NOUVEAU_PERSO:...] dans ta réponse. Tu peux utiliser des formats partiels : [NOUVEAU_PERSO:Nom] (seul le nom), [NOUVEAU_PERSO:Nom|Role], [NOUVEAU_PERSO:Nom|Role|Relation], ou le format complet [NOUVEAU_PERSO:Nom|Role|Relation|Description]. Si le nom du personnage est inconnu, utilise ??? comme nom. Les champs manquants seront remplis automatiquement. Exemples : [NOUVEAU_PERSO:Barl] si tu connais juste le nom, [NOUVEAU_PERSO:???|ennemi|Une silhouette sombre dans l'ombre] si le nom est inconnu, [NOUVEAU_PERSO:Maître Aldric|Archiviste|mentor|Un vieil homme aux yeux d'argent] pour un personnage complet. N'attends PAS qu'un personnage soit « significatif » — enregistre-le dès sa première apparition.
MAJ_PERSO : Si un personnage déjà connu révèle de nouvelles informations (changement d'allégeance, révélation, évolution), ajoute le tag [MAJ_PERSO:Nom|NouveauRole|NouvelleRelation|NouvelleDescription] dans ta réponse. Tu peux aussi utiliser le format partiel [MAJ_PERSO:Nom|NouvelleDescription] pour mettre à jour uniquement la description. La mise à jour remplace les champs fournis et conserve les autres. Exemple : [MAJ_PERSO:Barl|Forgeron volant|allié|Barl se révèle être un allié fidèle...] ou [MAJ_PERSO:Barl|Barl révèle qu'il a toujours protégé l'Académie en secret.].`;

export const getSpellListContext = (spells: Spell[]): string => {
  if (spells.length === 0) return "";
  const spellLines = spells.map((s) => `- ${s.name} (${s.manaCost} mana) : ${s.description}`).join("\n");
  return `\nSORTS CONNUS D'ÉLYSIA :\n${spellLines}\nSi le joueur mentionne un sort par son nom dans son action, décris l'effet narratif du sort et déduis le coût en mana avec le tag [MANA:-coût]. Si le joueur tente d'utiliser un sort inconnu, décris un échec ou une manifestation magique instable.`;
};

export const getInventoryListContext = (items: InventoryItem[]): string => {
  if (items.length === 0) return "";
  const itemLines = items.map((i) => `- ${i.name} (${i.effectType === "hp" ? "+HP" : "+Mana"} ${i.effectValue > 0 ? "+" : ""}${i.effectValue} ${i.effectType === "hp" ? "PV" : "mana"}) : ${i.description}`).join("\n");
  return `\nBESACE D'ÉLYSIA :\n${itemLines}\nSi le joueur mentionne un objet par son nom dans son action, décris son effet narratif, ajoute le tag [OBJET_UTILISE:Nom] et applique l'effet avec [VIE:+montant] ou [MANA:+montant] selon le type de l'objet. Si le joueur tente d'utiliser un objet absent de la besace, décris une recherche vaine dans son sac.`;
};

export const getNPCListContext = (npcs: NPC[]): string => {
  if (npcs.length === 0) return "";
  const recentNpcs = npcs.slice(-NPC_LIMIT);
  const npcLines = recentNpcs.map((n) => `- ${n.name} (${n.role}, ${n.relation}) : ${n.description}`).join("\n");
  return `\nPERSONNAGES CONNUS :\n${npcLines}\nSi un de ces personnages réapparaît dans l'histoire, reste cohérent avec sa description et sa relation avec Élysia. Si un personnage connu subit un changement, utilise [MAJ_PERSO:Nom|NouveauRole|NouvelleRelation|NouvelleDescription] (ou partiel : [MAJ_PERSO:Nom|NouvelleDescription]). Si un NOUVEAU personnage apparaît et n'est PAS dans cette liste, AJOUTE IMMÉDIATEMENT un tag [NOUVEAU_PERSO:...].`;
};

export const getOpeningHookPrompt = (spells?: Spell[], inventory?: InventoryItem[], npcs?: NPC[]) => `
${NARRATIVE_CONTEXT}${spells ? getSpellListContext(spells) : ""}${inventory && inventory.length > 0 ? getInventoryListContext(inventory) : ""}${npcs && npcs.length > 0 ? getNPCListContext(npcs) : ""}

CONSIGNE : Tu es le narrateur. Génère une scène d'ouverture immersive (2-4 phrases) pour commencer l'aventure.
Décris Élysia qui s'éveille dans sa chambre à l'Académie des Voiles Éternelles, au petit matin.
Inclus des détails sensoriels (lumière, sons, odeurs) et un élément mystérieux qui donne envie de continuer.
Mentionne subtilement que le premier sort d'Élysia, Éclat Divin, palpite dans son aura — comme une promesse de puissance encore endormie.
Termine par une invitation implicite à l'action.
`;

export const getActionPrompt = (action: string, history: string[], spells?: Spell[], inventory?: InventoryItem[], npcs?: NPC[]) => `
${NARRATIVE_CONTEXT}${spells ? getSpellListContext(spells) : ""}${inventory && inventory.length > 0 ? getInventoryListContext(inventory) : ""}${npcs && npcs.length > 0 ? getNPCListContext(npcs) : ""}

DERNIERS ÉVÉNEMENTS :
${history.slice(-5).join("\n")}

ACTION DU JOUEUR : "${action}"

CONSIGNE : Décris la suite (3-5 phrases). Réagis à l'action et décris l'environnement. Si le joueur mentionne un sort par son nom, décris son effet visuel et narratif de façon spectaculaire, et ajoute [MANA:-coût] correspondant. Si le joueur utilise un objet de sa besace, ajoute [OBJET_UTILISE:Nom] et l'effet avec [VIE:+montant] ou [MANA:+montant]. OBLIGATOIRE : Si la scène introduit un personnage qui n'est pas encore dans la liste des personnages connus, inclus IMMÉDIATEMENT un tag [NOUVEAU_PERSO:Nom] minimum. Même si tu ne connais que le nom, écris [NOUVEAU_PERSO:Nom]. Si le nom est inconnu, utilise [NOUVEAU_PERSO:???|...]. Si un personnage connu change, inclus [MAJ_PERSO:Nom|...].
`;

export const getContinuePrompt = (history: string[], spells?: Spell[], inventory?: InventoryItem[], npcs?: NPC[]) => `
${NARRATIVE_CONTEXT}${spells ? getSpellListContext(spells) : ""}${inventory && inventory.length > 0 ? getInventoryListContext(inventory) : ""}${npcs && npcs.length > 0 ? getNPCListContext(npcs) : ""}

DERNIERS ÉVÉNEMENTS :
${history.slice(-5).join("\n")}

CONSIGNE : Continue l'histoire naturellement (3-5 phrases). Introduis un petit événement ou un PNJ. OBLIGATOIRE : Si tu introduis un personnage qui n'est pas dans la liste des personnages connus, inclus IMMÉDIATEMENT un tag [NOUVEAU_PERSO:Nom] minimum. Même si tu ne connais que le nom, écris [NOUVEAU_PERSO:Nom]. Si le nom est inconnu, utilise [NOUVEAU_PERSO:???|...]. Si un personnage connu change, inclus [MAJ_PERSO:Nom|...].
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

const VALID_RELATIONS = ["allié", "neutre", "ennemi", "mentor", "inconnu"];

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