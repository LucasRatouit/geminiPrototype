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