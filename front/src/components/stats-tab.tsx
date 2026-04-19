import React from "react";
import type { NavbarStats } from "./navbar";
import { SMETA, RANK_COLORS } from "@/lib/constants";

interface StatsTabProps {
  stats: NavbarStats;
}

const StatBar: React.FC<{
  label: string;
  icon: string;
  value: number;
  max: number;
  color: string;
}> = ({ label, icon, value, max, color }) => {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between items-center mb-1.5">
        <span
          className="text-[11px] tracking-[1px] uppercase opacity-70"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          {icon} {label}
        </span>
        <span
          className="text-[12px] font-bold tabular-nums"
          style={{ color, fontFamily: "'Cinzel', serif" }}
        >
          {value} / {max}
        </span>
      </div>
      <div className="w-full h-2.5 bg-background/50 rounded-full overflow-hidden border border-border/30">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}44`,
          }}
        />
      </div>
    </div>
  );
};

export const StatsTab: React.FC<StatsTabProps> = ({ stats }) => {
  const rankColor = RANK_COLORS[stats.rank] || "#9ca3af";

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:py-8">
      <div className="max-w-md mx-auto flex flex-col gap-5">
        {/* Header: Rank badge + Identity */}
        <div
          className="relative bg-gradient-to-b from-card/90 to-card/60 border border-border/30 rounded-xl p-6 text-center overflow-hidden"
          style={{ borderBottomColor: rankColor + "40" }}
        >
          {/* Decorative corners */}
          {(["tl", "tr", "bl", "br"] as const).map((p) => (
            <span
              key={p}
              className="absolute text-[8px] opacity-20 select-none"
              style={{
                top: p[0] === "t" ? 6 : undefined,
                bottom: p[0] === "b" ? 6 : undefined,
                left: p[1] === "l" ? 8 : undefined,
                right: p[1] === "r" ? 8 : undefined,
              }}
            >
              ❧
            </span>
          ))}

          {/* Rank Circle */}
          <div
            className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center"
            style={{
              background: `radial-gradient(circle, ${rankColor}16, transparent)`,
              border: `2px solid ${rankColor}`,
              boxShadow: `0 0 20px ${rankColor}30`,
            }}
          >
            <span
              className="text-2xl font-black"
              style={{
                color: rankColor,
                textShadow: `0 0 12px ${rankColor}66`,
                fontFamily: "'Cinzel', serif",
              }}
            >
              {stats.rank}
            </span>
          </div>

          {/* Name & Level */}
          <div
            className="text-base text-amber-200 tracking-wide"
            style={{ fontFamily: "'Cinzel Decorative', serif" }}
          >
            Élysia
          </div>
          <div
            className="text-[9px] opacity-50 tracking-[3px] uppercase mt-1"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Niveau {stats.level}
          </div>
        </div>

        {/* Vital Bars: HP, Mana, XP */}
        <div
          className="bg-gradient-to-b from-card/90 to-card/60 border border-border/30 rounded-xl p-5"
        >
          <div
            className="text-[8px] opacity-50 tracking-[3px] uppercase text-center mb-4"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            ✦ VITALS ✦
          </div>
          <StatBar
            label="PV"
            icon="❤️"
            value={stats.hp}
            max={stats.hpMax}
            color="var(--destructive)"
          />
          <StatBar
            label="Mana"
            icon="💧"
            value={stats.mana}
            max={stats.manaMax}
            color="var(--chart-2)"
          />
          <StatBar
            label="XP"
            icon="⭐"
            value={stats.xp}
            max={stats.xpMax}
            color="#d4a843"
          />
        </div>

        {/* Attributes Grid */}
        <div
          className="bg-gradient-to-b from-card/90 to-card/60 border border-border/30 rounded-xl p-5"
        >
          <div
            className="text-[8px] opacity-50 tracking-[3px] uppercase text-center mb-4"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            ✦ ATTRIBUTS ✦
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
            {SMETA.map((s) => {
              const val = stats[s.key];
              return (
                <div
                  key={s.key}
                  className="rounded-lg p-2 md:p-3 text-center transition-all duration-300 hover:scale-105 min-w-0"
                  style={{
                    background: s.color + "08",
                    border: `1px solid ${s.color}1e`,
                  }}
                >
                  <div className="text-lg mb-1">{s.icon}</div>
                  <div
                    className="text-xl font-bold leading-none"
                    style={{
                      color: s.color,
                      fontFamily: "'Cinzel', serif",
                    }}
                  >
                    {val}
                  </div>
                  <div
                    className="text-[8px] md:text-[9px] opacity-50 mt-1.5 leading-tight break-words"
                    style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.3px", textTransform: "uppercase" }}
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