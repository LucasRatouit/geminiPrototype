export interface Spell {
  name: string;
  description: string;
  manaCost: number;
}

export const BASE_SPELLS: Spell[] = [
  {
    name: "Éclat Divin",
    description:
      "Un éclat de lumière condensée issu de l'aura d'Élysia. Rapide et précis, il frappe la cible et peut l'éblouir brièvement.",
    manaCost: 10,
  },
];

export interface InventoryItem {
  name: string;
  description: string;
  effectType: "hp" | "mana";
  effectValue: number;
}

export interface NPC {
  name: string;
  description: string;
  role: string;
  relation: "joueur" | "allié" | "neutre" | "ennemi" | "mentor" | "inconnu";
}

export const BASE_INVENTORY: InventoryItem[] = [
  {
    name: "Potion de Soin",
    description:
      "Une fiole rougeâtre contenant un liquide viscide qui restaure la vitalité.",
    effectType: "hp",
    effectValue: 10,
  },
  {
    name: "Potion de Mana",
    description:
      "Une fiole bleuâtre dont le contenu iridescent régénère l'énergie arcanique.",
    effectType: "mana",
    effectValue: 15,
  },
];

export const SMETA = [
  { key: "strength" as const, label: "Force", icon: "⚔️", color: "#ef4444" },
  {
    key: "intelligence" as const,
    label: "Intelligence",
    icon: "🔮",
    color: "#818cf8",
  },
  { key: "spirit" as const, label: "Esprit", icon: "✨", color: "#c084fc" },
  { key: "agility" as const, label: "Agilité", icon: "🌬️", color: "#4ade80" },
  { key: "charisma" as const, label: "Charisme", icon: "💬", color: "#fbbf24" },
];

export const NPC_LIMIT = 15;

export const BASE_NPCS: NPC[] = [
  {
    name: "Élysia",
    description: "Apprentie à l'Académie des Voiles Éternelles, réincarnation fragmentée d'une Archimage oubliée. Cheveux roses, yeux bleu cristallin.",
    role: "Apprentie",
    relation: "joueur",
  },
];

export const RELATION_META: Record<NPC["relation"], { label: string; icon: string; color: string; glow: string }> = {
  joueur: { label: "Joueur", icon: "⭐", color: "#fbbf24", glow: "rgba(251,191,36,0.3)" },
  allié: { label: "Allié", icon: "🛡️", color: "#4ade80", glow: "rgba(74,222,128,0.3)" },
  neutre: { label: "Neutre", icon: "⚖️", color: "#9ca3af", glow: "rgba(156,163,175,0.3)" },
  ennemi: { label: "Ennemi", icon: "⚔️", color: "#ef4444", glow: "rgba(239,68,68,0.3)" },
  mentor: { label: "Mentor", icon: "📖", color: "#c084fc", glow: "rgba(192,132,252,0.3)" },
  inconnu: { label: "Inconnu", icon: "❓", color: "#fbbf24", glow: "rgba(251,191,36,0.3)" },
};

export const RANK_COLORS: Record<string, string> = {
  F: "#9ca3af",
  E: "#86efac",
  D: "#67e8f9",
  C: "#93c5fd",
  B: "#c4b5fd",
  A: "#fde68a",
  S: "#fb923c",
  SS: "#f87171",
  SSS: "#e879f9",
  DIVIN: "#fef9c3",
};