import type { Spell } from "./constants";

const NARRATIVE_CONTEXT = `
PERSONNAGE : Élysia (17 ans, cheveux roses, yeux bleu cristallin).
CONTEXTE : Apprentie à l'Académie des Voiles Éternelles. Elle est la réincarnation fragmentée d'une Archimage oubliée.
TON : Mystérieux, poétique, immersif (5 sens).
XP : Si Élysia mérite de l'expérience (action notable, découverte, combat gagné, progression narrative), ajoute [XP:montant] à la fin (montant entre 5 et 25, jamais plus). Pour un événement majeur (quête terminée, rituel accompli), utilise [QUETE_TERMINEE:Nom|montant]. Pas d'XP pour les échecs ou actions triviales.
VIE : Si Élysia subit des dégâts, ajoute [VIE:-montant] (5-15 mineur, 15-30 sérieux, 30-50 critique). Si elle est soignée ou se repose, ajoute [VIE:+montant] (5-10 repos, 10-25 soin magique). Pas de tag si pas de changement.
MANA : Si Élysia lance un sort, ajoute [MANA:-montant] (5-15 sort mineur, 15-25 sort majeur). Si elle récupère du mana (méditation, potion), ajoute [MANA:+montant] (5-15). Pas de tag si pas de changement.
NOUVEAU_SORT : Si l'histoire justifie qu'Élysia apprenne ou découvre un nouveau sort (révélation, enseignement, évolution magique), ajoute le tag [NOUVEAU_SORT:Nom|CoûtMana|Description] dans ta réponse. Exemple : [NOUVEAU_SORT:Aura Flamboyante|15|Une aura de feu enveloppe les poings d'Élysia, infligeant des dégâts brûlants au contact.]. N'accorde un nouveau sort que pour un événement narratif significatif, pas pour une action triviale.
`;

export const getSpellListContext = (spells: Spell[]): string => {
  if (spells.length === 0) return "";
  const spellLines = spells.map((s) => `- ${s.name} (${s.manaCost} mana) : ${s.description}`).join("\n");
  return `\nSORTS CONNUS D'ÉLYSIA :\n${spellLines}\nSi le joueur mentionne un sort par son nom dans son action, décris l'effet narratif du sort et déduis le coût en mana avec le tag [MANA:-coût]. Si le joueur tente d'utiliser un sort inconnu, décris un échec ou une manifestation magique instable.`;
};

export const getOpeningHookPrompt = (spells?: Spell[]) => `
${NARRATIVE_CONTEXT}${spells ? getSpellListContext(spells) : ""}

CONSIGNE : Tu es le narrateur. Génère une scène d'ouverture immersive (2-4 phrases) pour commencer l'aventure.
Décris Élysia qui s'éveille dans sa chambre à l'Académie des Voiles Éternelles, au petit matin.
Inclus des détails sensoriels (lumière, sons, odeurs) et un élément mystérieux qui donne envie de continuer.
Mentionne subtilement que le premier sort d'Élysia, Éclat Divin, palpite dans son aura — comme une promesse de puissance encore endormie.
Termine par une invitation implicite à l'action.
`;

export const getActionPrompt = (action: string, history: string[], spells?: Spell[]) => `
${NARRATIVE_CONTEXT}${spells ? getSpellListContext(spells) : ""}

DERNIERS ÉVÉNEMENTS :
${history.slice(-5).join("\n")}

ACTION DU JOUEUR : "${action}"

CONSIGNE : Décris la suite (3-5 phrases). Réagis à l'action et décris l'environnement. Si le joueur mentionne un sort par son nom, décris son effet visuel et narratif de façon spectaculaire, et ajoute [MANA:-coût] correspondant.
`;

export const getContinuePrompt = (history: string[], spells?: Spell[]) => `
${NARRATIVE_CONTEXT}${spells ? getSpellListContext(spells) : ""}

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
