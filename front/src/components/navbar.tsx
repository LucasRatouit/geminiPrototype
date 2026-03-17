import React from "react";
import { Maximize2, Minimize2, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";

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
  accent: "var(--primary)",
  glow: "var(--ring)",
  hb: "var(--border)",
  tb: "var(--border)",
  name: "Académie",
};

const RANK_COLORS: Record<string, string> = {
  F: "#9ca3af", E: "#86efac", D: "#67e8f9", C: "#93c5fd", B: "#c4b5fd",
  A: "#fde68a", S: "#fb923c", SS: "#f87171", SSS: "#e879f9", DIVIN: "#fef9c3",
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

const ProgressBar: React.FC<{
  value: number;
  max: number;
  color: string;
  icon: string;
}> = ({ value, max, color, icon }) => (
  <div className="flex items-center gap-1.5 min-w-[100px] flex-1 sm:flex-initial">
    <span className="text-[10px] opacity-80">{icon}</span>
    <div className="flex-1 h-1.5 bg-background/40 rounded-full overflow-hidden border border-border/20">
      <div
        className="h-full transition-all duration-1000 ease-out rounded-full"
        style={{
          width: `${Math.min(100, (value / max) * 100)}%`,
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}44`,
        }}
      />
    </div>
    <span 
      className="text-[9px] font-bold tabular-nums w-8 text-right"
      style={{ color, fontFamily: "'Cinzel', serif" }}
    >
      {value}
    </span>
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
  const rankColor = RANK_COLORS[stats.rank] || "#9ca3af";

  return (
    <nav className="relative z-50 flex flex-col w-full select-none">
      {/* Background with Glassmorphism */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md border-b border-border transition-colors duration-1000" 
           style={{ borderBottomColor: theme.hb }} />

      {/* Main Header Row */}
      <div className="relative px-3 py-2 sm:px-4 flex items-center justify-between gap-4">
        
        {/* Brand/Title Section */}
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-card border border-border shadow-inner group transition-all"
            style={{ borderColor: `${theme.accent}44` }}
          >
            <Sparkles 
              size={18} 
              className="transition-transform group-hover:scale-110" 
              style={{ color: dream ? "var(--chart-3)" : theme.glow }}
            />
          </div>
          <div className="hidden sm:block leading-tight">
            <h1 
              className="text-[11px] font-black tracking-[2px] uppercase whitespace-nowrap"
              style={{ color: dream ? "var(--chart-3)" : theme.glow, fontFamily: "'Cinzel Decorative', serif" }}
            >
              Chroniques d'Arcanis
            </h1>
            <p className="text-[7px] font-bold opacity-40 uppercase tracking-[3px] text-foreground">
              {theme.name} • RPG Narratif
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="flex flex-1 items-center justify-center gap-4 max-w-2xl">
          {/* Level & Rank Pill */}
          <div className="flex items-center bg-muted rounded-full px-3 py-1 border border-border gap-3 shrink-0">
            <div className="flex flex-col items-center leading-none">
              <span className="text-[6px] opacity-40 font-bold uppercase tracking-tighter text-foreground">Niv</span>
              <span className="text-[11px] font-bold text-secondary-foreground font-cinzel">{stats.level}</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex flex-col items-center leading-none">
              <span className="text-[6px] opacity-40 font-bold uppercase tracking-tighter text-foreground">Rang</span>
              <span className="text-[11px] font-black font-cinzel" style={{ color: rankColor, textShadow: `0 0 8px ${rankColor}44` }}>
                {stats.rank}
              </span>
            </div>
          </div>

          {/* Health & Mana Bars */}
          <div className="hidden md:flex flex-1 items-center gap-6 max-w-md">
            <ProgressBar value={stats.hp} max={stats.hpMax} color="var(--destructive)" icon="❤️" />
            <ProgressBar value={stats.mana} max={stats.manaMax} color="var(--chart-2)" icon="💧" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onReset && (
            <button
              onClick={onReset}
              className="p-2 rounded-lg hover:bg-destructive/10 text-destructive hover:text-destructive transition-all cursor-pointer"
              title="Réinitialiser l'aventure"
            >
              <RotateCcw size={16} />
            </button>
          )}
          {onToggleFS && (
            <button
              onClick={onToggleFS}
              className="p-2 rounded-lg hover:bg-accent text-accent-foreground hover:text-foreground transition-all cursor-pointer"
              title={isFS ? "Quitter le plein écran" : "Plein écran"}
            >
              {isFS ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Stats Row (Visible only on mobile) */}
      <div className="relative md:hidden px-4 pb-2 flex gap-4">
        <ProgressBar value={stats.hp} max={stats.hpMax} color="var(--destructive)" icon="❤️" />
        <ProgressBar value={stats.mana} max={stats.manaMax} color="var(--chart-2)" icon="💧" />
      </div>

      {/* Tabs Navigation */}
      <div className="relative border-t border-border px-2">
        <div className="flex items-center overflow-x-auto no-scrollbar gap-1 py-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "group relative px-4 py-2 rounded-md transition-all duration-300 cursor-pointer flex items-center gap-2 whitespace-nowrap",
                currentTab === t.id 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <span className={cn(
                "text-xs transition-transform duration-300",
                currentTab === t.id ? "scale-110" : "group-hover:scale-110"
              )}>
                {t.icon}
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase">
                {t.label}
              </span>
              
              {/* Active Indicator Line */}
              {currentTab === t.id && (
                <div 
                  className="absolute bottom-1 left-4 right-4 h-[2px] rounded-full transition-colors duration-1000"
                  style={{ backgroundColor: theme.accent }}
                />
              )}

              {/* Special Badge for NPCs */}
              {t.id === "npcs" && npcsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-chart-4/20 text-chart-4 text-[8px] font-black border border-chart-4/30">
                  {npcsCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
