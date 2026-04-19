/**
 * Système de prompts simplifié pour l'aventure d'Élysia.
 * Se concentre uniquement sur le contexte narratif et l'historique.
 */

const NARRATIVE_CONTEXT = `
PERSONNAGE : Élysia (17 ans, cheveux roses, yeux bleu cristallin).
CONTEXTE : Apprentie à l'Académie des Voiles Éternelles. Elle est la réincarnation fragmentée d'une Archimage oubliée.
TON : Mystérieux, poétique, immersif (5 sens).
XP : Si Élysia mérite de l'expérience (action notable, découverte, combat gagné, progression narrative), ajoute [XP:montant] à la fin (montant entre 5 et 25, jamais plus). Pour un événement majeur (quête terminée, rituel accompli), utilise [QUETE_TERMINEE:Nom|montant]. Pas d'XP pour les échecs ou actions triviales.
VIE : Si Élysia subit des dégâts, ajoute [VIE:-montant] (5-15 mineur, 15-30 sérieux, 30-50 critique). Si elle est soignée ou se repose, ajoute [VIE:+montant] (5-10 repos, 10-25 soin magique). Pas de tag si pas de changement.
MANA : Si Élysia lance un sort, ajoute [MANA:-montant] (5-15 sort mineur, 15-25 sort majeur). Si elle récupère du mana (méditation, potion), ajoute [MANA:+montant] (5-15). Pas de tag si pas de changement.
`;

/**
 * Génère le prompt pour la phrase d'accroche narrative d'ouverture.
 * Utilisé au chargement initial de l'app pour immerger le joueur immédiatement.
 */
export const getOpeningHookPrompt = () => `
${NARRATIVE_CONTEXT}

CONSIGNE : Tu es le narrateur. Génère une scène d'ouverture immersive (2-4 phrases) pour commencer l'aventure.
Décris Élysia qui s'éveille dans sa chambre à l'Académie des Voiles Éternelles, au petit matin.
Inclus des détails sensoriels (lumière, sons, odeurs) et un élément mystérieux qui donne envie de continuer.
Termine par une invitation implicite à l'action.
`;

/**
 * Génère le prompt minimal pour l'action du joueur.
 */
export const getActionPrompt = (action: string, history: string[]) => `
${NARRATIVE_CONTEXT}

DERNIERS ÉVÉNEMENTS :
${history.slice(-5).join("\n")}

ACTION DU JOUEUR : "${action}"

CONSIGNE : Décris la suite (3-5 phrases). Réagis à l'action et décris l'environnement.
`;

/**
 * Génère le prompt minimal pour continuer l'histoire.
 */
export const getContinuePrompt = (history: string[]) => `
${NARRATIVE_CONTEXT}

DERNIERS ÉVÉNEMENTS :
${history.slice(-5).join("\n")}

CONSIGNE : Continue l'histoire naturellement (3-5 phrases). Introduis un petit événement ou un PNJ.
`;
