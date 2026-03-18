/**
 * Système de prompts simplifié pour l'aventure d'Élysia.
 * Se concentre uniquement sur le contexte narratif et l'historique.
 */

const NARRATIVE_CONTEXT = `
PERSONNAGE : Élysia (17 ans, cheveux roses, yeux bleu cristallin).
CONTEXTE : Apprentie à l'Académie des Voiles Éternelles. Elle est la réincarnation fragmentée d'une Archimage oubliée.
TON : Mystérieux, poétique, immersif (5 sens).
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
