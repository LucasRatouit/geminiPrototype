interface ToastData {
  xpToast: { title?: string; xp: number } | null;
  hpToast: { delta: number } | null;
  manaToast: { delta: number } | null;
}

export function Toasts({ xpToast, hpToast, manaToast }: ToastData) {
  return (
    <div className="fixed bottom-4 right-4 z-[500] flex flex-col-reverse gap-2.5 items-end">
      {xpToast && (
        <div
          className="toast-enter rounded-lg px-4 py-3 w-[220px]"
          style={{
            background: "linear-gradient(135deg, rgba(12,10,20,0.95), rgba(16,14,24,0.95))",
            border: "1px solid rgba(201,162,39,0.25)",
            borderLeft: "3px solid var(--gold)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4), 0 0 15px rgba(201,162,39,0.1)",
          }}
        >
          <div
            className="text-[8px] tracking-[2.5px] font-bold uppercase mb-0.5"
            style={{ color: "var(--gold)", fontFamily: "'Cinzel', serif" }}
          >
            ✦ {xpToast.title ? "QUÊTE ACCOMPLIE" : "EXPÉRIENCE GAGNÉE"} ✦
          </div>
          {xpToast.title && (
            <div
              className="text-[11px] text-parchment/70 font-semibold mb-0.5"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {xpToast.title}
            </div>
          )}
          <div className="text-sm gold-shimmer-text font-bold" style={{ fontFamily: "'Cinzel', serif" }}>
            +{xpToast.xp} XP
          </div>
        </div>
      )}
      {hpToast && (
        <div
          className="toast-enter rounded-lg px-4 py-3 w-[220px]"
          style={{
            background: "linear-gradient(135deg, rgba(12,10,20,0.95), rgba(16,14,24,0.95))",
            border: "1px solid rgba(220,38,38,0.2)",
            borderLeft: `3px solid ${hpToast.delta > 0 ? "#4ade80" : "#ef4444"}`,
            boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 15px ${hpToast.delta > 0 ? "rgba(74,222,128,0.08)" : "rgba(239,68,68,0.08)"}`,
          }}
        >
          <div
            className="text-[8px] tracking-[2.5px] font-bold uppercase mb-0.5"
            style={{ color: hpToast.delta > 0 ? "#4ade80" : "#ef4444", fontFamily: "'Cinzel', serif" }}
          >
            ✦ {hpToast.delta > 0 ? "SOIN" : "DÉGÂTS"} ✦
          </div>
          <div className="text-sm font-bold" style={{ color: hpToast.delta > 0 ? "#86efac" : "#fca5a5", fontFamily: "'Cinzel', serif" }}>
            {hpToast.delta > 0 ? "+" : ""}{hpToast.delta} PV {hpToast.delta > 0 ? "❤️‍🩹" : "❤️"}
          </div>
        </div>
      )}
      {manaToast && (
        <div
          className="toast-enter rounded-lg px-4 py-3 w-[220px]"
          style={{
            background: "linear-gradient(135deg, rgba(12,10,20,0.95), rgba(16,14,24,0.95))",
            border: "1px solid rgba(79,126,181,0.2)",
            borderLeft: `3px solid ${manaToast.delta > 0 ? "#60a5fa" : "#818cf8"}`,
            boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 15px ${manaToast.delta > 0 ? "rgba(96,165,250,0.08)" : "rgba(129,140,248,0.08)"}`,
          }}
        >
          <div
            className="text-[8px] tracking-[2.5px] font-bold uppercase mb-0.5"
            style={{ color: manaToast.delta > 0 ? "#60a5fa" : "#818cf8", fontFamily: "'Cinzel', serif" }}
          >
            ✦ {manaToast.delta > 0 ? "RÉCUPÉRATION" : "DÉPENSE"} ✦
          </div>
          <div className="text-sm font-bold" style={{ color: manaToast.delta > 0 ? "#93c5fd" : "#c4b5fd", fontFamily: "'Cinzel', serif" }}>
            {manaToast.delta > 0 ? "+" : ""}{manaToast.delta} Mana 💧
          </div>
        </div>
      )}
    </div>
  );
}