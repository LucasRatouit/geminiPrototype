import type { Spell } from "./constants";
import type { InventoryItem } from "./constants";

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
`;

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

export const getOpeningHookPrompt = (spells?: Spell[], inventory?: InventoryItem[]) => `
${NARRATIVE_CONTEXT}${spells ? getSpellListContext(spells) : ""}${inventory && inventory.length > 0 ? getInventoryListContext(inventory) : ""}

CONSIGNE : Tu es le narrateur. Génère une scène d'ouverture immersive (2-4 phrases) pour commencer l'aventure.
Décris Élysia qui s'éveille dans sa chambre à l'Académie des Voiles Éternelles, au petit matin.
Inclus des détails sensoriels (lumière, sons, odeurs) et un élément mystérieux qui donne envie de continuer.
Mentionne subtilement que le premier sort d'Élysia, Éclat Divin, palpite dans son aura — comme une promesse de puissance encore endormie.
Termine par une invitation implicite à l'action.
`;

export const getActionPrompt = (action: string, history: string[], spells?: Spell[], inventory?: InventoryItem[]) => `
${NARRATIVE_CONTEXT}${spells ? getSpellListContext(spells) : ""}${inventory && inventory.length > 0 ? getInventoryListContext(inventory) : ""}

DERNIERS ÉVÉNEMENTS :
${history.slice(-5).join("\n")}

ACTION DU JOUEUR : "${action}"

CONSIGNE : Décris la suite (3-5 phrases). Réagis à l'action et décris l'environnement. Si le joueur mentionne un sort par son nom, décris son effet visuel et narratif de façon spectaculaire, et ajoute [MANA:-coût] correspondant. Si le joueur utilise un objet de sa besace, ajoute [OBJET_UTILISE:Nom] et l'effet avec [VIE:+montant] ou [MANA:+montant].
`;

export const getContinuePrompt = (history: string[], spells?: Spell[], inventory?: InventoryItem[]) => `
${NARRATIVE_CONTEXT}${spells ? getSpellListContext(spells) : ""}${inventory && inventory.length > 0 ? getInventoryListContext(inventory) : ""}

DERNIERS ÉVÉNEMENTS :
${history.slice(-5).join("\n")}

CONSIGNE : Continue l'histoire naturellement (3-5 phrases). Introduis un petit événement ou un PNJ.
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