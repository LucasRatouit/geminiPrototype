import React from "react";
import { Maximize2, Menu, Minimize2, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { RANK_COLORS } from "@/lib/constants";
import type { GameStats, GameTheme } from "@/hooks/useGameState";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
  { id: "settings", icon: "⚙️", label: "Modèle" },
];

const BAR_COLORS = {
  hp: { main: "#e04040", light: "#ef4444", dark: "#991b1b" },
  mana: { main: "#4a90d9", light: "#60a5fa", dark: "#1e40af" },
  xp: { main: "#c9a227", light: "#d4a843", dark: "#92710a" },
};

const ProgressBar: React.FC<{
  value: number;
  max: number;
  colorKey: "hp" | "mana" | "xp";
  icon: string;
}> = ({ value, max, colorKey, icon }) => {
  const pct = Math.min(100, (value / max) * 100);
  const c = BAR_COLORS[colorKey];
  return (
    <div className="flex items-center gap-1.5 min-w-[90px] flex-1 sm:flex-initial">
      <span className="text-[10px] opacity-80">{icon}</span>
      <div className="flex-1 relative">
        <div
          className="h-[9px] rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${c.main}40` }}
        >
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(180deg, ${c.light} 0%, ${c.main} 100%)`,
              boxShadow: `0 0 8px ${c.main}66`,
            }}
          />
        </div>
      </div>
      <span
        className="text-[9px] font-bold tabular-nums w-8 text-right"
        style={{ color: c.light, fontFamily: "'Cinzel', serif" }}
      >
        {value}
      </span>
    </div>
  );
};

interface NavbarProps {
  stats: GameStats;
  theme: GameTheme;
  currentTab: string;
  setTab: (id: string) => void;
  tabs: NavbarTab[];
  onReset?: () => void;
  onToggleFS?: () => void;
  isFS?: boolean;
  npcsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  theme,
  currentTab,
  setTab,
  tabs,
  onReset,
  onToggleFS,
  isFS = false,
  npcsCount = 0,
}) => {
  const rankColor = RANK_COLORS[stats.rank] || "#9ca3af";

  return (
    <Sheet>
      <nav className="relative z-50 flex flex-col w-full select-none">
        <div
          className="absolute inset-0 backdrop-blur-xl border-b"
          style={{
            background: "linear-gradient(180deg, rgba(8,6,13,0.92) 0%, rgba(8,6,13,0.85) 100%)",
            borderBottomColor: `${rankColor}20`,
          }}
        />

        <div className="relative px-3 py-2 sm:px-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center group transition-transform duration-300 hover:scale-110">
              <Sparkles
                size={18}
                className="text-primary"
                style={{ filter: "drop-shadow(0 0 6px rgba(201,162,39,0.5))" }}
              />
            </div>
            <div className="hidden sm:block leading-tight">
              <h1
                className="text-[11px] font-black tracking-[2.5px] uppercase whitespace-nowrap gold-shimmer-text"
                style={{ fontFamily: "'Cinzel Decorative', serif" }}
              >
                Chroniques d'Arcanis
              </h1>
              <p className="text-[7px] font-bold opacity-35 uppercase tracking-[3px] text-parchment-dim mt-0.5">
                {theme.name} · RPG Narratif
              </p>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center gap-4 max-w-2xl">
            <div
              className="flex items-center rounded-full px-3 py-1 gap-3 shrink-0 border"
              style={{
                background: "rgba(201,162,39,0.06)",
                borderColor: `${rankColor}30`,
                boxShadow: `0 0 12px ${rankColor}10`,
              }}
            >
              <div className="flex flex-col items-center leading-none">
                <span className="text-[6px] opacity-35 font-bold uppercase tracking-tighter text-parchment-dim">Niv</span>
                <span className="text-[11px] font-bold text-parchment" style={{ fontFamily: "'Cinzel', serif" }}>{stats.level}</span>
              </div>
              <div className="w-px h-4" style={{ background: `${rankColor}30` }} />
              <div className="flex flex-col items-center leading-none">
                <span className="text-[6px] opacity-35 font-bold uppercase tracking-tighter text-parchment-dim">Rang</span>
                <span
                  className="text-[11px] font-black"
                  style={{ color: rankColor, fontFamily: "'Cinzel', serif", textShadow: `0 0 10px ${rankColor}55` }}
                >
                  {stats.rank}
                </span>
              </div>
            </div>

            <div className="hidden md:flex flex-1 items-center gap-5 max-w-md">
              <ProgressBar value={stats.hp} max={stats.hpMax} colorKey="hp" icon="❤️" />
              <ProgressBar value={stats.mana} max={stats.manaMax} colorKey="mana" icon="💧" />
              <ProgressBar value={stats.xp} max={stats.xpMax} colorKey="xp" icon="⭐" />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <SheetTrigger asChild>
              <button
                className="p-2 rounded-lg hover:bg-accent/20 text-parchment-dim hover:text-parchment transition-all duration-300 cursor-pointer md:hidden"
                title="Menu"
              >
                <Menu size={15} />
              </button>
            </SheetTrigger>
            {onReset && (
              <button
                onClick={onReset}
                className="p-2 rounded-lg hover:bg-destructive/15 text-destructive/70 hover:text-destructive transition-all duration-300 cursor-pointer"
                title="Réinitialiser l'aventure"
              >
                <RotateCcw size={15} />
              </button>
            )}
            {onToggleFS && (
              <button
                onClick={onToggleFS}
                className="p-2 rounded-lg hover:bg-accent/20 text-parchment-dim hover:text-parchment transition-all duration-300 cursor-pointer"
                title={isFS ? "Quitter le plein écran" : "Plein écran"}
              >
                {isFS ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
            )}
          </div>
        </div>

        <div className="relative md:hidden px-4 pb-2 flex flex-col gap-1.5">
          <div className="flex gap-4">
            <ProgressBar value={stats.hp} max={stats.hpMax} colorKey="hp" icon="❤️" />
            <ProgressBar value={stats.mana} max={stats.manaMax} colorKey="mana" icon="💧" />
          </div>
          <ProgressBar value={stats.xp} max={stats.xpMax} colorKey="xp" icon="⭐" />
        </div>

        <div className="relative border-t px-2 hidden md:block" style={{ borderColor: "rgba(201,162,39,0.1)" }}>
          <div className="flex items-center overflow-x-auto scrollbar-none gap-0.5 py-1">
            {tabs.map((t) => {
              const isActive = currentTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "group relative px-3.5 py-1.5 transition-all duration-300 cursor-pointer flex items-center gap-1.5 whitespace-nowrap rounded-md",
                    isActive
                      ? "text-primary"
                      : "text-parchment-dim/60 hover:text-parchment/80"
                  )}
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  <span className={cn(
                    "text-xs transition-transform duration-300",
                    isActive ? "scale-110" : "group-hover:scale-110"
                  )}>
                    {t.icon}
                  </span>
                  <span className="text-[9px] font-bold tracking-wider uppercase">
                    {t.label}
                  </span>
                  {isActive && (
                    <div
                      className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                      style={{
                        background: "linear-gradient(90deg, transparent, var(--gold), transparent)",
                        boxShadow: "0 0 8px rgba(201,162,39,0.4)",
                      }}
                    />
                  )}
                  {t.id === "npcs" && npcsCount > 0 && (
                    <span className="px-1 py-0 rounded-full text-[7px] font-black border"
                      style={{
                        background: "rgba(201,162,39,0.12)",
                        borderColor: "rgba(201,162,39,0.3)",
                        color: "var(--gold)",
                      }}
                    >
                      {npcsCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
      <SheetContent
        side="bottom"
        className="bg-[#0a0810]/95 backdrop-blur-xl border-t border-[rgba(201,162,39,0.15)] rounded-t-xl"
      >
        <SheetHeader className="mb-4">
          <SheetTitle
            className="text-sm font-black tracking-[2px] uppercase text-center gold-shimmer-text"
            style={{ fontFamily: "'Cinzel Decorative', serif" }}
          >
            Navigation
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-1 pb-6">
          {tabs.map((t) => {
            const isActive = currentTab === t.id;
            return (
              <SheetClose asChild key={t.id}>
                <button
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 cursor-pointer",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-parchment-dim/70 hover:text-parchment hover:bg-white/5 border border-transparent"
                  )}
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  <span className={cn(
                    "text-base transition-transform duration-300",
                    isActive ? "scale-110" : ""
                  )}>
                    {t.icon}
                  </span>
                  <span className="text-xs font-bold tracking-wider uppercase flex-1 text-left">
                    {t.label}
                  </span>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(201,162,39,0.6)]" />
                  )}
                  {t.id === "npcs" && npcsCount > 0 && (
                    <span
                      className="px-1.5 py-0.5 rounded-full text-[9px] font-black border"
                      style={{
                        background: "rgba(201,162,39,0.12)",
                        borderColor: "rgba(201,162,39,0.3)",
                        color: "var(--gold)",
                      }}
                    >
                      {npcsCount}
                    </span>
                  )}
                </button>
              </SheetClose>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Navbar;