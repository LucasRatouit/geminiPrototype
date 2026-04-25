import React from "react";
import type { NPC } from "@/lib/constants";
import { RELATION_META } from "@/lib/constants";

interface PersoTabProps {
  npcs: NPC[];
}

export const PersoTab: React.FC<PersoTabProps> = ({ npcs }) => {
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
            ✦ Rencontres ✦
          </div>
          <div className="gold-shimmer-text text-lg tracking-wider">
            Personnages
          </div>
          <div
            className="text-[9px] opacity-35 mt-1.5 italic leading-relaxed px-6"
            style={{ fontFamily: "'IM Fell English', serif" }}
          >
            Mentionnez un personnage par son nom pour interagir avec lui
          </div>
        </div>

        {npcs.length === 0 ? (
          <div
            className="text-center py-12 opacity-30 italic"
            style={{ fontFamily: "'IM Fell English', serif" }}
          >
            Aucun personnage rencontré... pour l'instant.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {npcs.map((npc, i) => {
              const meta = RELATION_META[npc.relation] || RELATION_META.inconnu;
              const isUnknown = npc.name === "???";
              const hasDescription = npc.description && npc.description.trim().length > 0;
              const hasRole = npc.role && npc.role !== "Inconnu" && npc.role.trim().length > 0;

              return (
                <div
                  key={npc.name + i}
                  className="relative rounded-2xl overflow-hidden"
                  style={{
                    animation: "revealUp 0.6s ease-out forwards",
                    animationDelay: `${i * 0.1}s`,
                    opacity: 0,
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
                      background: `linear-gradient(180deg, ${meta.color}80, ${meta.color}20)`,
                    }}
                  />

                  <div className="relative p-5 pl-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {hasRole && (
                            <span
                              className="text-[9px] font-bold tracking-[2px] uppercase opacity-40"
                              style={{ fontFamily: "'Cinzel', serif" }}
                            >
                              {npc.role}
                            </span>
                          )}
                        </div>
                        {isUnknown ? (
                          <h3
                            className="text-base font-black tracking-wider"
                            style={{
                              fontFamily: "'Cinzel', serif",
                              color: meta.color,
                              textShadow: `0 0 20px ${meta.glow}`,
                            }}
                          >
                            <span className="italic">???</span>
                            <span
                              className="inline-block ml-1 text-[10px] opacity-60 question-pulse"
                              style={{ animation: "questionPulse 2s ease-in-out infinite" }}
                            >
                              ?
                            </span>
                          </h3>
                        ) : (
                          <h3
                            className="text-base font-black tracking-wide"
                            style={{
                              fontFamily: "'Cinzel', serif",
                              color: meta.color,
                              textShadow: `0 0 20px ${meta.glow}`,
                            }}
                          >
                            {npc.name}
                          </h3>
                        )}
                      </div>

                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                        style={{
                          background: `${meta.color}15`,
                          border: `1px solid ${meta.color}30`,
                        }}
                      >
                        <span className="text-[11px]">{meta.icon}</span>
                        <span
                          className="text-[9px] font-bold tracking-wider uppercase"
                          style={{
                            color: meta.color,
                            fontFamily: "'Cinzel', serif",
                          }}
                        >
                          {meta.label}
                        </span>
                      </div>
                    </div>

                    {hasDescription ? (
                      <p
                        className="text-[13px] leading-relaxed opacity-65"
                        style={{ fontFamily: "'IM Fell English', serif" }}
                      >
                        {npc.description}
                      </p>
                    ) : (
                      <p
                        className="text-[13px] leading-relaxed opacity-30 italic"
                        style={{ fontFamily: "'IM Fell English', serif" }}
                      >
                        Aucune information connue...
                      </p>
                    )}
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
            L'aventure peut révéler de nouveaux personnages — ils apparaîtront ici
          </div>
        </div>
      </div>

      <style>{`
        @keyframes questionPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
};

export default PersoTab;