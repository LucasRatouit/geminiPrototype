import React from "react";
import type { GameStats } from "@/hooks/useGameState";
import { SMETA, RANK_COLORS } from "@/lib/constants";

interface StatsTabProps {
  stats: GameStats;
}

const STAT_BAR_COLORS: Record<string, { main: string; light: string; dark: string }> = {
  hp: { main: "#e04040", light: "#ef4444", dark: "#991b1b" },
  mana: { main: "#4a90d9", light: "#60a5fa", dark: "#1e40af" },
  xp: { main: "#c9a227", light: "#d4a843", dark: "#92710a" },
};

const StatBar: React.FC<{
  label: string;
  icon: string;
  value: number;
  max: number;
  colorKey: string;
}> = ({ label, icon, value, max, colorKey }) => {
  const c = STAT_BAR_COLORS[colorKey] || STAT_BAR_COLORS.xp;
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between items-center mb-1.5">
        <span
          className="text-[10px] tracking-[1.5px] uppercase text-parchment-dim/60"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {icon} {label}
        </span>
        <span
          className="text-[12px] font-bold tabular-nums"
          style={{ color: c.light, fontFamily: "'Cinzel', serif" }}
        >
          {value} / {max}
        </span>
      </div>
      <div
        className="w-full h-3 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${c.main}40` }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(180deg, ${c.light} 0%, ${c.main} 100%)`,
            boxShadow: `0 0 10px ${c.main}55`,
          }}
        />
      </div>
    </div>
  );
};

export const StatsTab: React.FC<StatsTabProps> = ({ stats }) => {
  const rankColor = RANK_COLORS[stats.rank] || "#9ca3af";

  return (
    <div className="flex-1 overflow-y-auto px-3 py-5 md:py-8 scrollbar-none">
      <div className="max-w-md mx-auto flex flex-col gap-5">

        <div
          className="relative rounded-2xl p-6 text-center overflow-hidden"
          style={{
            background: "linear-gradient(160deg, rgba(14,12,22,0.9), rgba(8,6,13,0.95))",
            border: "1px solid rgba(201,162,39,0.15)",
            borderBottomColor: `${rankColor}30`,
            boxShadow: "0 4px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(201,162,39,0.05)",
          }}
        >
          {(["tl", "tr", "bl", "br"] as const).map((p) => (
            <span
              key={p}
              className="absolute text-[10px] opacity-[0.12] select-none"
              style={{
                color: "var(--gold)",
                top: p[0] === "t" ? 8 : undefined,
                bottom: p[0] === "b" ? 8 : undefined,
                left: p[1] === "l" ? 10 : undefined,
                right: p[1] === "r" ? 10 : undefined,
              }}
            >
              ❧
            </span>
          ))}

          <div
            className="w-18 h-18 mx-auto mb-3 rounded-full flex items-center justify-center"
            style={{
              width: "72px",
              height: "72px",
              background: `radial-gradient(circle, ${rankColor}10, transparent)`,
              border: `2px solid ${rankColor}`,
              boxShadow: `0 0 25px ${rankColor}25`,
            }}
          >
            <span
              className="text-2xl font-black"
              style={{
                color: rankColor,
                textShadow: `0 0 15px ${rankColor}66`,
                fontFamily: "'Cinzel', serif",
              }}
            >
              {stats.rank}
            </span>
          </div>

          <div className="gold-shimmer-text text-lg tracking-wider" style={{ fontFamily: "'Cinzel Decorative', serif" }}>
            Élysia
          </div>
          <div
            className="text-[9px] opacity-40 tracking-[3px] uppercase mt-1 text-parchment-dim"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Niveau {stats.level}
          </div>
        </div>

        <div
          className="rounded-2xl p-5"
          style={{
            background: "linear-gradient(160deg, rgba(14,12,22,0.7), rgba(8,6,13,0.85))",
            border: "1px solid rgba(201,162,39,0.1)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          }}
        >
          <div
            className="text-[8px] tracking-[3px] uppercase text-center mb-4 text-parchment-dim/50"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            ✦ VITAUX ✦
          </div>
          <StatBar label="PV" icon="❤️" value={stats.hp} max={stats.hpMax} colorKey="hp" />
          <StatBar label="Mana" icon="💧" value={stats.mana} max={stats.manaMax} colorKey="mana" />
          <StatBar label="XP" icon="⭐" value={stats.xp} max={stats.xpMax} colorKey="xp" />
        </div>

        <div
          className="rounded-2xl p-5"
          style={{
            background: "linear-gradient(160deg, rgba(14,12,22,0.7), rgba(8,6,13,0.85))",
            border: "1px solid rgba(201,162,39,0.1)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          }}
        >
          <div
            className="text-[8px] tracking-[3px] uppercase text-center mb-4 text-parchment-dim/50"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            ✦ ATTRIBUTS ✦
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
            {SMETA.map((s) => {
              const val = stats[s.key as keyof GameStats] as number;
              return (
                <div
                  key={s.key}
                  className="rounded-xl p-2.5 md:p-3 text-center transition-all duration-300 hover:scale-105 cursor-default min-w-0"
                  style={{
                    background: `${s.color}06`,
                    border: `1px solid ${s.color}18`,
                    boxShadow: `0 0 12px ${s.color}08`,
                  }}
                >
                  <div className="text-lg mb-1">{s.icon}</div>
                  <div
                    className="text-xl font-bold leading-none"
                    style={{
                      color: s.color,
                      fontFamily: "'Cinzel', serif",
                      textShadow: `0 0 10px ${s.color}33`,
                    }}
                  >
                    {val}
                  </div>
                  <div
                    className="text-[8px] md:text-[9px] opacity-50 mt-1.5 leading-tight break-words uppercase"
                    style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.5px" }}
                  >
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsTab;