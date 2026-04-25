import React from "react";
import type { Spell } from "@/lib/constants";
import type { GameStats } from "@/hooks/useGameState";

interface SpellsTabProps {
  spells: Spell[];
  stats: GameStats;
}

const MANA_COLORS = {
  low: { main: "#ef4444", light: "#f87171", glow: "rgba(239,68,68,0.3)" },
  mid: { main: "#c084fc", light: "#d8b4fe", glow: "rgba(192,132,252,0.3)" },
  ok: { main: "#60a5fa", light: "#93c5fd", glow: "rgba(96,165,250,0.3)" },
};

function getManaTier(mana: number, cost: number) {
  if (mana < cost) return "low";
  if (mana < cost * 2) return "mid";
  return "ok";
}

export const SpellsTab: React.FC<SpellsTabProps> = ({ spells, stats }) => {
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
            ✦ Codex Magique ✦
          </div>
          <div className="gold-shimmer-text text-lg tracking-wider">
            Grimoire
          </div>
          <div
            className="text-[9px] opacity-35 mt-1.5 italic leading-relaxed px-6"
            style={{ fontFamily: "'IM Fell English', serif" }}
          >
            Mentionnez un sort par son nom dans vos actions pour le lancer
          </div>
        </div>

        {spells.length === 0 ? (
          <div
            className="text-center py-12 opacity-30 italic"
            style={{ fontFamily: "'IM Fell English', serif" }}
          >
            Aucun sort connu... pour l'instant.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {spells.map((spell, i) => {
              const tier = getManaTier(stats.mana, spell.manaCost);
              const colors = MANA_COLORS[tier];
              const canCast = stats.mana >= spell.manaCost;
              const manaPct = Math.min(100, (stats.mana / spell.manaCost) * 100);
              const isNew = i >= 1;

              return (
                <div
                  key={spell.name}
                  className="relative rounded-2xl overflow-hidden"
                  style={{
                    animation: isNew ? "revealUp 0.6s ease-out forwards" : undefined,
                    animationDelay: isNew ? `${i * 0.1}s` : undefined,
                    opacity: isNew ? 0 : 1,
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
                      background: `linear-gradient(180deg, ${colors.main}80, ${colors.main}20)`,
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
                            Sort
                          </span>
                          {i === 0 && (
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
                            color: colors.light,
                            textShadow: `0 0 20px ${colors.glow}`,
                          }}
                        >
                          {spell.name}
                        </h3>
                      </div>

                      <div
                        className="flex flex-col items-center px-3 py-2 rounded-xl"
                        style={{
                          background: canCast
                            ? "rgba(96,165,250,0.08)"
                            : "rgba(239,68,68,0.08)",
                          border: `1px solid ${canCast ? "rgba(96,165,250,0.2)" : "rgba(239,68,68,0.2)"}`,
                        }}
                      >
                        <span className="text-[7px] tracking-[1.5px] uppercase opacity-40"
                          style={{ fontFamily: "'Cinzel', serif" }}
                        >
                          Coût
                        </span>
                        <div className="flex items-baseline gap-0.5 mt-0.5">
                          <span
                            className="text-lg font-bold"
                            style={{
                              color: colors.main,
                              fontFamily: "'Cinzel', serif",
                              textShadow: `0 0 8px ${colors.glow}`,
                            }}
                          >
                            {spell.manaCost}
                          </span>
                          <span className="text-[10px] opacity-50">💧</span>
                        </div>
                      </div>
                    </div>

                    <p
                      className="text-[13px] leading-relaxed opacity-65 mb-4"
                      style={{ fontFamily: "'IM Fell English', serif" }}
                    >
                      {spell.description}
                    </p>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 relative">
                        <div
                          className="h-[6px] rounded-full overflow-hidden"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: `1px solid ${colors.main}20`,
                          }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                              width: `${canCast ? 100 : manaPct}%`,
                              background: canCast
                                ? `linear-gradient(90deg, ${colors.main}, ${colors.light})`
                                : `linear-gradient(90deg, ${colors.main}, ${colors.main}60)`,
                              boxShadow: canCast ? `0 0 8px ${colors.glow}` : "none",
                            }}
                          />
                        </div>
                      </div>
                      <span
                        className="text-[10px] tabular-nums font-bold whitespace-nowrap"
                        style={{
                          color: canCast ? colors.light : "#f87171",
                          fontFamily: "'Cinzel', serif",
                        }}
                      >
                        {canCast ? (
                          <>Prêt</>
                        ) : (
                          <>Mana insuffisant</>
                        )}
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
            L'aventure peut révéler de nouveaux sorts — ils apparaîtront ici
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpellsTab;