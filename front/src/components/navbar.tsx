import React from "react";

export interface NavbarStats {
  rank: string;
  level: number;
  hp: number;
  hpMax: number;
  mana: number;
  manaMax: number;
}

export interface NavbarTheme {
  accent: string;
  glow: string;
  hb: string;
  tb: string;
  name: string;
  bg1?: string;
  bg2?: string;
}

export interface NavbarTab {
  id: string;
  icon: string;
  label: string;
}

export const NAV_TABS: NavbarTab[] = [
  { id: "game", icon: "📜", label: "Récit" },
  { id: "stats", icon: "⚔️", label: "Stats" },
  { id: "spells", icon: "🔮", label: "Sorts" },
  { id: "inventory", icon: "🎒", label: "Besace" },
  { id: "npcs", icon: "👥", label: "Perso." },
];

export const DEFAULT_STATS: NavbarStats = {
  rank: "F",
  level: 1,
  hp: 100,
  hpMax: 100,
  mana: 80,
  manaMax: 80,
};

export const DEFAULT_THEME: NavbarTheme = {
  accent: "#a87c4f",
  glow: "#c4933a",
  hb: "rgba(168,124,79,.28)",
  tb: "rgba(168,124,79,.13)",
  name: "Académie",
};

interface NavbarProps {
  stats: NavbarStats;
  theme: NavbarTheme;
  currentTab: string;
  setTab: (id: string) => void;
  tabs: NavbarTab[];
  onReset?: () => void;
  onToggleFS?: () => void;
  isFS?: boolean;
  dream?: boolean;
  npcsCount?: number;
}

const RC: Record<string, string> = {
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

const RG: Record<string, string> = {
  F: "#6b7280",
  E: "#4ade80",
  D: "#22d3ee",
  C: "#60a5fa",
  B: "#a78bfa",
  A: "#f59e0b",
  S: "#ea580c",
  SS: "#dc2626",
  SSS: "#d946ef",
  DIVIN: "#fde047",
};

const Bar: React.FC<{
  value: number;
  max: number;
  color: string;
  glow: string;
}> = ({ value, max, color, glow }) => (
  <div
    style={{
      height: 5,
      background: "rgba(0,0,0,.45)",
      borderRadius: 3,
      overflow: "hidden",
    }}
  >
    <div
      style={{
        height: "100%",
        width: `${Math.min(100, Math.round((value / max) * 100))}%`,
        borderRadius: 3,
        background: `linear-gradient(90deg,${color}55,${color})`,
        boxShadow: `0 0 5px ${glow}`,
        transition: "width .9s ease",
      }}
    />
  </div>
);

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  theme,
  currentTab,
  setTab,
  tabs,
  onReset,
  onToggleFS,
  isFS = false,
  dream = false,
  npcsCount = 0,
}) => {
  const rc = RC[stats.rank] || "#9ca3af";
  const rg = RG[stats.rank] || "#6b7280";

  return (
    <div className="flex flex-col flex-shrink-0 relative z-20 w-full">
      {/* HEADER */}
      <div
        style={{
          background: "linear-gradient(180deg,rgba(8,4,1,.99),rgba(10,5,1,.97))",
          borderBottom: `1px solid ${theme.hb}`,
          transition: "border-color 1.8s",
        }}
        className="px-3 py-1.5 flex items-center justify-between shadow-[0_2px_13px_rgba(0,0,0,0.8)]"
      >
        <div className="flex items-center gap-2">
          <div
            style={{
              background: `${theme.accent}16`,
              border: `1px solid ${theme.accent}42`,
            }}
            className="w-8 h-8 rounded flex items-center justify-center text-base"
          >
            📖
          </div>
          <div>
            <div
              style={{
                color: dream ? "#c8a0ff" : theme.glow,
                transition: "color 1.8s",
                fontFamily: "'Cinzel Decorative', serif",
              }}
              className="text-[9px] tracking-[1.5px]"
            >
              CHRONIQUES D'ARCANIS
            </div>
            <div
              style={{ color: `${theme.accent}77` }}
              className="text-[6px] tracking-[2px]"
            >
              {theme.name.toUpperCase()} · RPG TEXTUEL
            </div>
          </div>
        </div>

        <div className="flex gap-1.5 items-center">
          <div className="text-center">
            <div
              style={{ color: `${theme.accent}77` }}
              className="text-[6px] tracking-widest"
            >
              RANG
            </div>
            <div
              style={{
                color: rc,
                textShadow: `0 0 8px ${rg}`,
                fontFamily: "'Cinzel', serif",
              }}
              className="text-xs font-black"
            >
              {stats.rank}
            </div>
          </div>

          <div
            style={{ background: `${theme.accent}20` }}
            className="w-px h-[22px]"
          />

          <div className="text-center">
            <div
              style={{ color: `${theme.accent}77` }}
              className="text-[6px] tracking-widest"
            >
              NIV
            </div>
            <div
              style={{ fontFamily: "'Cinzel', serif" }}
              className="text-xs font-bold text-[#c9a96e]"
            >
              {stats.level}
            </div>
          </div>

          <div
            style={{ background: `${theme.accent}20` }}
            className="w-px h-[22px]"
          />

          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <span className="text-[8px]">❤️</span>
              <div className="w-11">
                <Bar
                  value={stats.hp}
                  max={stats.hpMax}
                  color="#ef4444"
                  glow="rgba(239,68,68,0.5)"
                />
              </div>
              <span
                style={{ fontFamily: "'Cinzel', serif" }}
                className="text-[7px] text-[#ef4444] min-w-[20px]"
              >
                {stats.hp}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[8px]">💧</span>
              <div className="w-11">
                <Bar
                  value={stats.mana}
                  max={stats.manaMax}
                  color="#60a5fa"
                  glow="rgba(96,165,250,0.5)"
                />
              </div>
              <span
                style={{ fontFamily: "'Cinzel', serif" }}
                className="text-[7px] text-[#60a5fa] min-w-[20px]"
              >
                {stats.mana}
              </span>
            </div>
          </div>

          {onReset && (
            <button
              onClick={onReset}
              title="Nouvelle partie"
              className="w-6.5 h-6.5 rounded bg-[rgba(239,68,68,0.07)] border border-[rgba(239,68,68,0.2)] text-[rgba(239,68,68,0.7)] cursor-pointer flex items-center justify-center text-[11px] shrink-0 hover:bg-[rgba(239,68,68,0.18)] transition-colors"
            >
              🗑️
            </button>
          )}
          {onToggleFS && (
            <button
              onClick={onToggleFS}
              title={isFS ? "Quitter" : "Plein écran"}
              style={{
                background: `${theme.accent}10`,
                border: `1px solid ${theme.accent}28`,
                color: theme.accent,
              }}
              className="w-6.5 h-6.5 rounded cursor-pointer flex items-center justify-center text-xs shrink-0 hover:bg-[opacity-22] transition-colors"
            >
              {isFS ? "⊠" : "⊡"}
            </button>
          )}
        </div>
      </div>

      {/* TABS */}
      <div
        style={{
          background: "rgba(8,4,1,.98)",
          borderBottom: `1px solid ${theme.tb}`,
          transition: "border-color 1.8s",
        }}
        className="h-9 flex overflow-x-auto overflow-y-hidden scrollbar-none"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              borderBottom:
                currentTab === t.id
                  ? `2px solid ${theme.accent}`
                  : "2px solid transparent",
              color: currentTab === t.id ? theme.glow : "#4a3220",
              transition: "color .2s, border-color 1.8s",
              fontFamily: "'Cinzel', serif",
            }}
            className="shrink-0 h-full px-2.5 bg-none border-none cursor-pointer text-[9px] tracking-wider flex items-center gap-1 whitespace-nowrap"
          >
            <span className="text-[11px]">{t.icon}</span>
            <span>{t.label}</span>
            {t.id === "npcs" && npcsCount > 0 && (
              <span
                style={{
                  background: `${theme.accent}20`,
                  border: `1px solid ${theme.accent}30`,
                  color: theme.accent,
                }}
                className="text-[7px] rounded-[9px] px-1"
              >
                {npcsCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Navbar;
