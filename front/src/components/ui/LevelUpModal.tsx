import { SMETA } from "@/lib/constants";
import type { GameStats } from "@/hooks/useGameState";

interface LevelUpModalProps {
  stats: GameStats;
  lvlMode: "all" | "pick" | null;
  setLvlMode: (m: "all" | "pick" | null) => void;
  doLevelAll: () => void;
  doLevelPick: (key: string) => void;
}

export function LevelUpModal({ stats, lvlMode, setLvlMode, doLevelAll, doLevelPick }: LevelUpModalProps) {
  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(8px)" }}>
      <div
        className="max-w-[360px] w-full text-center p-8 rounded-2xl relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, rgba(14,12,22,0.98), rgba(8,6,13,0.99))",
          border: "1px solid rgba(201,162,39,0.3)",
          boxShadow: "0 0 60px rgba(201,162,39,0.1), 0 0 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,162,39,0.1)",
          animation: "levelUpExpand 0.5s ease-out forwards",
        }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, rgba(201,162,39,0.4), transparent 70%)" }}
          />
        </div>

        <div className="relative">
          <div className="text-4xl mb-3" style={{ animation: "goldenPulse 2s ease-in-out infinite" }}>⭐</div>
          <div
            className="text-base tracking-[3px] mb-1 gold-shimmer-text"
            style={{ fontFamily: "'Cinzel Decorative', serif" }}
          >
            NIVEAU {stats.level}
          </div>
          <div
            className="text-[11px] text-parchment-dim/50 italic mb-6"
            style={{ fontFamily: "'IM Fell English', serif" }}
          >
            Élysia grandit en puissance.
          </div>

          {!lvlMode && (
            <div className="flex flex-col gap-3">
              <button
                onClick={doLevelAll}
                className="py-3 px-4 rounded-lg text-parchment font-bold text-[10px] tracking-[1.5px] uppercase cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                style={{
                  fontFamily: "'Cinzel', serif",
                  background: "linear-gradient(135deg, rgba(201,162,39,0.12), rgba(201,162,39,0.06))",
                  border: "1px solid rgba(201,162,39,0.25)",
                  boxShadow: "0 0 15px rgba(201,162,39,0.08)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(201,162,39,0.2), rgba(201,162,39,0.1))";
                  e.currentTarget.style.borderColor = "rgba(201,162,39,0.45)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(201,162,39,0.12), rgba(201,162,39,0.06))";
                  e.currentTarget.style.borderColor = "rgba(201,162,39,0.25)";
                }}
              >
                ✦ Améliorer toutes les stats (+2 chacune, +15 PV, +10 Mana)
              </button>
              <button
                onClick={() => setLvlMode("pick")}
                className="py-3 px-4 rounded-lg text-purple-300/80 font-bold text-[10px] tracking-[1.5px] uppercase cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                style={{
                  fontFamily: "'Cinzel', serif",
                  background: "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.04))",
                  border: "1px solid rgba(139,92,246,0.2)",
                  boxShadow: "0 0 15px rgba(139,92,246,0.05)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(139,92,246,0.18), rgba(139,92,246,0.08))";
                  e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.04))";
                  e.currentTarget.style.borderColor = "rgba(139,92,246,0.2)";
                }}
              >
                ✦ Choisir une stat à spécialiser (+5)
              </button>
            </div>
          )}

          {lvlMode === "pick" && (
            <div>
              <div
                className="text-[8px] tracking-[2px] uppercase mb-3 text-parchment-dim/50"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Choisir une stat
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SMETA.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => doLevelPick(s.key)}
                    className="py-3 px-2 rounded-lg cursor-pointer text-[10px] flex items-center justify-center gap-1.5 transition-all duration-200 hover:scale-105"
                    style={{
                      fontFamily: "'Cinzel', serif",
                      background: `${s.color}0a`,
                      border: `1px solid ${s.color}30`,
                      color: s.color,
                    }}
                  >
                    {s.icon} {s.label}{" "}
                    <span className="opacity-50 text-[8px]">+5</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setLvlMode(null)}
                className="mt-3 text-parchment-dim/40 text-[10px] italic cursor-pointer bg-transparent border-none"
                style={{ fontFamily: "'IM Fell English', serif" }}
              >
                ← Retour
              </button>
            </div>
          )}

          {lvlMode === "all" && (
            <div>
              <div
                className="text-[8px] tracking-[2px] uppercase mb-3 text-parchment-dim/50"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Gains
              </div>
              <div className="grid grid-cols-2 gap-1.5 mb-4">
                {[
                  { icon: "❤️", label: "PV max", val: "+15" },
                  { icon: "💧", label: "Mana", val: "+10" },
                  ...SMETA.map((s) => ({
                    icon: s.icon,
                    label: s.label,
                    val: "+2",
                  })),
                ].map((r, i) => (
                  <div
                    key={i}
                    className="rounded-lg px-2 py-1.5 flex justify-between items-center"
                    style={{
                      background: "rgba(201,162,39,0.04)",
                      border: "1px solid rgba(201,162,39,0.1)",
                    }}
                  >
                    <span className="text-[10px] text-parchment-dim/60" style={{ fontFamily: "'Cinzel', serif" }}>
                      {r.icon} {r.label}
                    </span>
                    <span className="text-[10px] gold-shimmer-text font-bold" style={{ fontFamily: "'Cinzel', serif" }}>
                      {r.val}
                    </span>
                  </div>
                ))}
              </div>
              <button
                onClick={doLevelAll}
                className="w-full py-2.5 rounded-lg text-parchment font-bold text-[10px] tracking-[1.5px] uppercase cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                style={{
                  fontFamily: "'Cinzel', serif",
                  background: "linear-gradient(135deg, rgba(201,162,39,0.15), rgba(201,162,39,0.08))",
                  border: "1px solid rgba(201,162,39,0.3)",
                  boxShadow: "0 0 15px rgba(201,162,39,0.1)",
                }}
              >
                ✦ Confirmer
              </button>
              <button
                onClick={() => setLvlMode(null)}
                className="mt-2 text-parchment-dim/40 text-[9px] italic cursor-pointer bg-transparent border-none block mx-auto"
                style={{ fontFamily: "'IM Fell English', serif" }}
              >
                ← Retour
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}