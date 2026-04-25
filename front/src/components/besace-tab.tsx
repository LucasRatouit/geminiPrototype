import React from "react";
import type { InventoryItem } from "@/lib/constants";
import type { GameStats } from "@/hooks/useGameState";

interface BesaceTabProps {
  inventory: InventoryItem[];
  stats: GameStats;
}

const EFFECT_CONFIG = {
  hp: {
    label: "PV",
    icon: "❤️",
    main: "#ef4444",
    light: "#f87171",
    glow: "rgba(239,68,68,0.3)",
    gradient: "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.04))",
  },
  mana: {
    label: "Mana",
    icon: "💧",
    main: "#60a5fa",
    light: "#93c5fd",
    glow: "rgba(96,165,250,0.3)",
    gradient: "linear-gradient(135deg, rgba(96,165,250,0.12), rgba(96,165,250,0.04))",
  },
};

function getStockWarning(effectType: "hp" | "mana", effectValue: number, stats: GameStats): { canUse: boolean; label: string } {
  if (effectType === "hp") {
    const canUse = stats.hp < stats.hpMax;
    return { canUse, label: canUse ? `+${effectValue} PV` : "PV pleins" };
  }
  const canUse = stats.mana < stats.manaMax;
  return { canUse, label: canUse ? `+${effectValue} Mana` : "Mana plein" };
}

export const BesaceTab: React.FC<BesaceTabProps> = ({ inventory, stats }) => {
  return (
    <div className="flex-1 overflow-y-auto px-3 py-5 md:py-8 scrollbar-none">
      <div className="max-w-md mx-auto flex flex-col gap-5">
        <div
          className="text-center mb-1"
          style={{ fontFamily: "'Cinzel Decorative', serif" }}
        >
          <div
            className="text-[8px] tracking-[4px] uppercase opacity-30 mb-2"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            ✦ Inventaire ✦
          </div>
          <div className="gold-shimmer-text text-lg tracking-wider">
            Besace
          </div>
          <div
            className="text-[9px] opacity-35 mt-1.5 italic leading-relaxed px-6"
            style={{ fontFamily: "'IM Fell English', serif" }}
          >
            Mentionnez un objet par son nom dans vos actions pour l'utiliser
          </div>
        </div>

        {inventory.length === 0 ? (
          <div
            className="text-center py-12 opacity-30 italic"
            style={{ fontFamily: "'IM Fell English', serif" }}
          >
            La besace est vide... pour l'instant.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {inventory.map((item, i) => {
              const cfg = EFFECT_CONFIG[item.effectType];
              const { canUse, label } = getStockWarning(item.effectType, item.effectValue, stats);
              const isBase = item.name === "Potion de Soin" || item.name === "Potion de Mana";

              return (
                <div
                  key={item.name}
                  className="relative rounded-2xl overflow-hidden"
                  style={{
                    animation: !isBase ? "revealUp 0.6s ease-out forwards" : undefined,
                    animationDelay: !isBase ? `${i * 0.1}s` : undefined,
                    opacity: !isBase ? 0 : 1,
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background: "linear-gradient(135deg, rgba(14,12,22,0.95), rgba(8,6,13,0.98))",
                    }}
                  />
                  <div
                    className="absolute top-0 left-0 right-0 h-px"
                    style={{
                      background: "linear-gradient(90deg, transparent, var(--gold)40, transparent)",
                    }}
                  />
                  <div
                    className="absolute bottom-0 left-0 right-0 h-px"
                    style={{
                      background: "linear-gradient(90deg, transparent, var(--gold)20, transparent)",
                    }}
                  />
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{
                      background: `linear-gradient(180deg, ${cfg.main}80, ${cfg.main}20)`,
                    }}
                  />

                  <div className="relative p-5 pl-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-[9px] font-bold tracking-[2px] uppercase opacity-40"
                            style={{ fontFamily: "'Cinzel', serif" }}
                          >
                            Objet
                          </span>
                          {isBase && (
                            <span
                              className="text-[7px] px-1.5 py-0.5 rounded-full font-bold tracking-wider"
                              style={{
                                background: "rgba(201,162,39,0.15)",
                                color: "var(--gold)",
                                border: "1px solid rgba(201,162,39,0.25)",
                                fontFamily: "'Cinzel', serif",
                              }}
                            >
                              ORIGINE
                            </span>
                          )}
                        </div>
                        <h3
                          className="text-base font-black tracking-wide"
                          style={{
                            fontFamily: "'Cinzel', serif",
                            color: cfg.light,
                            textShadow: `0 0 20px ${cfg.glow}`,
                          }}
                        >
                          {item.name}
                        </h3>
                      </div>

                      <div
                        className="flex flex-col items-center px-3 py-2 rounded-xl"
                        style={{
                          background: canUse
                            ? cfg.gradient
                            : "rgba(255,255,255,0.03)",
                          border: `1px solid ${canUse ? `${cfg.main}30` : "rgba(255,255,255,0.06)"}`,
                        }}
                      >
                        <span className="text-[7px] tracking-[1.5px] uppercase opacity-40"
                          style={{ fontFamily: "'Cinzel', serif" }}
                        >
                          Effet
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-lg">{cfg.icon}</span>
                          <span
                            className="text-sm font-bold"
                            style={{
                              color: canUse ? cfg.light : "rgba(255,255,255,0.3)",
                              fontFamily: "'Cinzel', serif",
                            }}
                          >
                            +{item.effectValue}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p
                      className="text-[13px] leading-relaxed opacity-65 mb-4"
                      style={{ fontFamily: "'IM Fell English', serif" }}
                    >
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span
                        className="text-[9px] tracking-[1px] uppercase"
                        style={{
                          color: cfg.main,
                          opacity: 0.6,
                          fontFamily: "'Cinzel', serif",
                        }}
                      >
                        {cfg.label}
                      </span>
                      <span
                        className="text-[10px] font-bold whitespace-nowrap"
                        style={{
                          color: canUse ? cfg.light : "rgba(255,255,255,0.25)",
                          fontFamily: "'Cinzel', serif",
                        }}
                      >
                        {canUse ? label : "✓ Complet"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div
          className="text-center pt-2 pb-4"
          style={{ fontFamily: "'IM Fell English', serif" }}
        >
          <div
            className="text-[10px] opacity-20 italic leading-relaxed max-w-[280px] mx-auto"
          >
            L'aventure peut révéler de nouveaux objets — ils apparaîtront ici
          </div>
        </div>
      </div>
    </div>
  );
};

export default BesaceTab;