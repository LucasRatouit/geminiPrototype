import axios from "axios";
import { useState, useRef, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "/api";

const INITIAL_LOG = [
  {
    type: "system",
    text: "⚙️ SYSTÈME — Bienvenue à l'Académie des Voiles Éternelles. Ton arme liée sommeille. Ton héritage est scellé. L'histoire commence maintenant.",
  },
  {
    type: "narration",
    text: "La calèche s'immobilise dans un craquement de bois et de cuir. Par la vitre poussiéreuse, les flèches de pierre grise de l'Académie des Voiles Éternelles percent le ciel plombé comme des aiguilles plantées dans un nuage. Élysia observe les bâtiments en silence — hauts, solennels, indifférents. L'odeur de pluie froide et de pierre mouillée filtre par l'interstice de la portière. Autour d'elle, d'autres élèves descendent des calèches voisines, serrant leurs bagages contre eux, les yeux écarquillés ou les mâchoires crispées. Personne ne lui adresse la parole. Personne ne semble remarquer l'imperceptible vacillement de son aura... pour l'instant.",
  },
];

const INITIAL_CHAR = {
  name: "Élysia",
  title: "L'Écho de l'Aube Brisée",
  classe: "Héritière Scellée",
  rang: "F",
  level: 1,
  xp: 90,
  xpNext: 100,
  hp: 75,
  hpMax: 75,
  mana: 110,
  manaMax: 110,
  stats: {
    "⚔️ Force": 8,
    "🧠 Intelligence": 16,
    "✨ Esprit": 19,
    "🏃 Agilité": 13,
    "💬 Charisme": 17,
  },
  facette: "☀️ Lumineuse",
  spells: [
    {
      name: "Éclat Rosé",
      cost: 10,
      detail: "2d6 dégâts arcaniques",
      rang: "F",
      type: "Attaque",
      element: "🌸 Lumière",
      portee: "20m",
      description:
        "Élysia projette un éclat de lumière condensée issu de son aura naturelle. Rapide et précis, il ne peut pas être dévié par des boucliers physiques ordinaires. Inflige 2d6 dégâts et peut aveugler brièvement une cible fragile.",
      lore: "Ce sort est né spontanément la première fois qu'Élysia a pleuré de colère. Elle avait 9 ans. Un mur entier s'était effondré.",
    },
    {
      name: "Voile de Sérénité",
      cost: 18,
      detail: "Absorbe 30 dégâts",
      rang: "F",
      type: "Défense",
      element: "🔵 Arcane",
      portee: "Soi-même",
      description:
        "Un bouclier d'énergie douce enveloppe Élysia, absorbant jusqu'à 30 points de dégâts avant de se dissiper. Dure jusqu'à la fin de la scène ou jusqu'à saturation. Une fois par rencontre.",
      lore: "Instinctivement développé pour protéger les autres. Élysia ne l'a d'abord utilisé que pour couvrir ses camarades — jamais elle-même.",
    },
    {
      name: "Murmure des Abysses",
      cost: 28,
      detail: "3d8 + drain d'énergie",
      rang: "F",
      type: "Attaque sombre",
      element: "🌑 Ombre",
      portee: "15m",
      description:
        "La facette sombre d'Élysia affleure. Elle invoque une onde d'obscurité ancienne qui draine l'énergie vitale d'une cible. Inflige 3d8 dégâts et réduit temporairement l'agilité de l'ennemi. Déclenche parfois un changement de facette.",
      lore: "Ce sort n'a pas été appris. Il était là, gravé quelque part dans son sang, attendant d'être découvert. Il porte l'empreinte d'une magie bien plus ancienne qu'Élysia elle-même.",
    },
  ],
  weapon: {
    name: "???",
    type: "Scellée",
    rang: "???",
    description:
      "Une présence. Pas encore une forme. Quelque chose sommeille en toi — ou peut-être en dehors de toi, quelque part à l'Académie. Tu ne sais pas encore ce que c'est.",
    eveille: false,
  },
  inventory: [
    {
      name: "Tenue académique",
      qty: 1,
      rang: "F",
      desc: "Uniforme standard de l'Académie",
    },
    {
      name: "Grimoire vierge",
      qty: 1,
      rang: "F",
      desc: "Pages blanches. Attend d'être rempli.",
    },
    { name: "Fiole de mana", qty: 2, rang: "F", desc: "Restaure 40 mana" },
    {
      name: "Médaillon inconnu",
      qty: 1,
      rang: "?",
      desc: "Héritage maternel. Chaud au toucher.",
    },
    { name: "Or", qty: 40, rang: "-", desc: "Monnaie courante" },
  ],
  status: [],
  quests: [
    {
      titre: "Premier Jour",
      desc: "Rejoindre la cérémonie d'accueil de l'Académie",
      progression: "En cours",
    },
  ],
  backstory:
    "Élysia ignore presque tout de ses origines. Sa mère — une femme douce et secrète — est morte quand elle avait 6 ans, lui laissant un médaillon et des silences. Ce que personne ne sait encore : Élysia est la réincarnation fragmentée d'une Archimage oubliée, la fondatrice disparue de l'Académie des Voiles Éternelles elle-même. Son âme s'est brisée en deux lors d'un sacrifice ancien — une facette lumineuse, une facette sombre — et s'est réincarnée des siècles plus tard dans ce corps de 17 ans. L'Académie qu'elle croit découvrir... elle l'a peut-être construite.",
};

const generateSpellText = async (char, log, spell) => {
  const prompt = `
  CONTEXTE : Univers de l'Académie des Voiles Éternelles.
  PERSONNAGE : ${char.name} (${char.classe}), Facette : ${char.facette}.
  
  DERNIERS ÉVÉNEMENTS :
  ${log
    .slice(0, 2)
    .map((e) => e.text)
    .join("\n")}

  ACTION : Lancer le sort "${spell.name}".
  DESCRIPTION DU SORT : ${spell.description}
  EFFET ATTENDU : ${spell.detail}

  CONSIGNE : Décris l'incantation et la manifestation visuelle de la magie (3 phrases). 
  Le ton doit être épique et refléter l'élément ${spell.element}.
`;

  try {
    const res = await axios.post(`${API_URL}/ai/generate`, { prompt });
    return res.data.text;
  } catch (error) {
    console.error("Spell AI failed:", error);
    return { story: `${spell.name} jaillit dans un éclat de lumière brute.` };
  }
};

const generateActionText = async (char, log, action) => {
  const prompt = `
  CONTEXTE : RPG à l'Académie des Voiles Éternelles.
  PERSONNAGE : ${char.name}, Facette : ${char.facette}.
  
  DERNIERS ÉVÉNEMENTS DU JOURNAL :
  ${log
    .slice(-3)
    .map((e) => e.text)
    .join("\n")}

  ACTION DU JOUEUR : "${action}"

  CONSIGNE : Décris la suite immédiate de cette action (3-5 phrases). 
  Réagis à ce que fait le joueur, décris l'environnement ou les réactions des PNJ si nécessaire.
  Maintiens une atmosphère mystérieuse et académique.
`;

  try {
    const res = await axios.post(`${API_URL}/ai/generate`, { prompt });
    return res.data.text;
  } catch (error) {
    console.error("Action AI failed:", error);
    return {
      story: "Le monde semble attendre ton prochain mouvement en silence.",
    };
  }
};

const generateContinueStory = async (char, log) => {
  const prompt = `
  CONTEXTE : RPG à l'Académie des Voiles Éternelles.
  PERSONNAGE : ${char.name}, Facette : ${char.facette}.
  
  DERNIERS ÉVÉNEMENTS DU JOURNAL :
  ${log
    .slice(-3)
    .map((e) => e.text)
    .join("\n")}

  CONSIGNE : Le joueur demande de continuer l'histoire sans action spécifique. 
  Décris la progression naturelle de la scène (3-5 phrases). 
  Introduis un petit événement, un changement d'ambiance, ou l'intervention d'un PNJ pour relancer l'intrigue.
  Le ton doit être immersif et mystérieux.
`;

  try {
    const res = await axios.post(`${API_URL}/ai/generate`, { prompt });
    return res.data.text;
  } catch (error) {
    console.error("Continue AI failed:", error);
    return {
      story:
        "Un silence pesant s'installe, comme si le temps lui-même hésitait à s'écouler.",
    };
  }
};

function StatBar({ value, max, color, label }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "#c9b08a",
          marginBottom: 3,
        }}
      >
        <span>{label}</span>
        <span style={{ fontWeight: "bold" }}>
          {value} / {max}
        </span>
      </div>
      <div
        style={{
          background: "#1a1208",
          borderRadius: 3,
          height: 9,
          border: "1px solid #3d2e10",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: pct + "%",
            height: "100%",
            background: color,
            borderRadius: 3,
            transition: "width 0.6s ease",
          }}
        />
      </div>
    </div>
  );
}

function RangBadge({ rang }) {
  const colors = {
    F: "#6a4a20",
    E: "#4a6a20",
    D: "#20506a",
    C: "#5a2080",
    B: "#80402a",
    A: "#c0a020",
    S: "#c06020",
    SS: "#e04040",
    SSS: "#e040e0",
    DIVIN: "#ffffff",
    "?": "#404040",
    "???": "#303030",
  };
  const c = colors[rang] || "#6a4a20";
  return (
    <span
      style={{
        fontSize: 9,
        color: c,
        border: "1px solid " + c,
        borderRadius: 3,
        padding: "1px 5px",
        marginLeft: 5,
      }}
    >
      {rang}
    </span>
  );
}

function Card({ title, accent, children }) {
  return (
    <div
      style={{
        background: "#110e06",
        border: "1px solid " + (accent || "#3d2e10"),
        borderRadius: 6,
        padding: 14,
        marginBottom: 14,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: accent || "#6a4a20",
          letterSpacing: 3,
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function SpellCard({ spell, onCast, canCast }) {
  const [open, setOpen] = useState(false);
  const rangColors = {
    F: "#6a4a20",
    E: "#4a6a20",
    D: "#20506a",
    C: "#5a2080",
    B: "#80402a",
    A: "#c0a020",
  };
  const rc = rangColors[spell.rang] || "#6a4a20";
  const isDark = spell.element.includes("Ombre");
  return (
    <div style={{ borderBottom: "1px solid #1e1608" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 0",
        }}
      >
        <div
          style={{ flex: 1, cursor: "pointer" }}
          onClick={() => setOpen(!open)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span
              style={{ fontSize: 13, color: isDark ? "#c080e0" : "#e8d5a3" }}
            >
              {spell.name}
            </span>
            <RangBadge rang={spell.rang} />
            <span
              style={{
                fontSize: 10,
                color: "#4a3020",
                display: "inline-block",
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.2s",
              }}
            >
              ▾
            </span>
          </div>
          <div style={{ fontSize: 10, color: "#6a4a20", marginTop: 2 }}>
            {spell.element} · {spell.detail} · {spell.cost} mana
          </div>
        </div>
        <button
          onClick={() => onCast(spell)}
          disabled={!canCast}
          style={{
            background: canCast ? (isDark ? "#200d30" : "#1a103a") : "#1a1208",
            border:
              "1px solid " +
              (canCast ? (isDark ? "#8040c0" : "#7050c0") : "#3d2e10"),
            color: canCast ? (isDark ? "#c080e0" : "#c090f0") : "#4a3820",
            padding: "4px 10px",
            borderRadius: 4,
            cursor: canCast ? "pointer" : "not-allowed",
            fontSize: 11,
            fontFamily: "inherit",
            marginLeft: 8,
            flexShrink: 0,
          }}
        >
          Lancer
        </button>
      </div>
      {open && (
        <div
          style={{
            background: "#0d0a04",
            border: "1px solid #2a1e08",
            borderRadius: 4,
            padding: 12,
            marginBottom: 8,
            fontSize: 11,
            lineHeight: 1.7,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 4,
              marginBottom: 10,
            }}
          >
            <div>
              <span style={{ color: "#6a4a20" }}>Type : </span>
              <span style={{ color: "#c9b08a" }}>{spell.type}</span>
            </div>
            <div>
              <span style={{ color: "#6a4a20" }}>Portée : </span>
              <span style={{ color: "#c9b08a" }}>{spell.portee}</span>
            </div>
            <div>
              <span style={{ color: "#6a4a20" }}>Coût : </span>
              <span style={{ color: "#6060e0" }}>{spell.cost} mana</span>
            </div>
            <div>
              <span style={{ color: "#6a4a20" }}>Élément : </span>
              <span style={{ color: "#c9b08a" }}>{spell.element}</span>
            </div>
          </div>
          <div style={{ color: "#a08050", marginBottom: 8 }}>
            {spell.description}
          </div>
          <div
            style={{
              borderTop: "1px solid #2a1e08",
              paddingTop: 8,
              color: "#5a3a18",
              fontStyle: "italic",
            }}
          >
            📖 {spell.lore}
          </div>
        </div>
      )}
    </div>
  );
}

function JournalEntry({ entry, isLatest }) {
  const isAction = entry.type === "action";
  const isSystem = entry.type === "system";
  const isNarration = entry.type === "narration";

  return (
    <div
      style={{
        padding: "12px 16px",
        marginBottom: 12,
        borderRadius: 8,
        background: isSystem
          ? "rgba(13, 20, 30, 0.4)"
          : isAction
            ? "rgba(15, 25, 10, 0.4)"
            : "transparent",
        borderLeft: isLatest
          ? `3px solid ${isSystem ? "#6090c0" : isAction ? "#90c060" : "#c07820"}`
          : "1px solid rgba(232, 213, 163, 0.1)",
        fontSize: 14,
        lineHeight: 1.7,
        color: isSystem ? "#70a0d0" : isAction ? "#a0d070" : "#e8d5a3",
        fontStyle: isNarration ? "italic" : "normal",
        opacity: isLatest ? 1 : 0.7,
        transition: "all 0.5s ease",
        transform: isLatest ? "translateX(0)" : "translateX(0)",
        boxShadow:
          isLatest && !isNarration ? `0 0 15px rgba(0,0,0,0.3)` : "none",
      }}
    >
      {isSystem && (
        <span style={{ marginRight: 8, fontSize: 10 }}>[SYSTEM]</span>
      )}
      {isAction && (
        <span style={{ marginRight: 8, fontSize: 10 }}>[ACTION]</span>
      )}
      {entry.text}
    </div>
  );
}

export default function CharacterSheet() {
  const [char, setChar] = useState(INITIAL_CHAR);
  const [log, setLog] = useState(INITIAL_LOG);
  const [weaponOpen, setWeaponOpen] = useState(false);
  const [playerInput, setPlayerInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const logEndRef = useRef(null);
  const prevLevelRef = useRef(char.level);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [log]);

  useEffect(() => {
    if (char.level > prevLevelRef.current) {
      addLog({
        type: "system",
        text: `🎊 NIVEAU SUPÉRIEUR ! Élysia atteint le niveau ${char.level}. Son aura s'intensifie.`,
      });
    }
    prevLevelRef.current = char.level;
  }, [char.level]);

  function addLog(entry) {
    setLog(function (prev) {
      return prev.concat([entry]).slice(-30);
    });
  }

  function updateXP(gain) {
    if (!gain || gain <= 0) return;

    addLog({ type: "system", text: `✨ Gain d'expérience : +${gain} XP` });

    setChar(function (prev) {
      let newXp = prev.xp + gain;
      let newLevel = prev.level;
      let newXpNext = prev.xpNext;

      while (newXp >= newXpNext) {
        newXp -= newXpNext;
        newLevel++;
        newXpNext = Math.floor(newXpNext * 1.2);
      }

      return Object.assign({}, prev, {
        xp: newXp,
        level: newLevel,
        xpNext: newXpNext,
      });
    });
  }

  async function handleSendAction() {
    if (!playerInput.trim() || isGenerating) return;

    const actionText = playerInput.trim();
    setPlayerInput("");
    setIsGenerating(true);

    addLog({ type: "action", text: actionText });

    try {
      const res = await generateActionText(char, log, actionText);
      addLog({ type: "narration", text: res.story });
      if (res.xp) updateXP(res.xp);
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleContinueStory() {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const res = await generateContinueStory(char, log);
      addLog({ type: "narration", text: res.story });
      if (res.xp) updateXP(res.xp);
    } catch (error) {
      console.error("Continue failed:", error);
    } finally {
      setIsGenerating(false);
    }
  }

  async function castSpell(spell) {
    if (char.mana < spell.cost || isGenerating) {
      if (char.mana < spell.cost) {
        addLog({
          type: "narration",
          text:
            "Élysia puise dans sa réserve... le vide. Il ne reste plus assez de mana pour invoquer " +
            spell.name +
            ". Un léger vertige la saisit.",
        });
      }
      return;
    }

    setIsGenerating(true);
    const isDark = spell.element.includes("Ombre");
    setChar(function (c) {
      const newStatus =
        isDark && !c.status.includes("🌑 Facette sombre active")
          ? c.status.concat(["🌑 Facette sombre active"])
          : c.status;
      const newFacette = isDark ? "🌙 Sombre" : c.facette;
      return Object.assign({}, c, {
        mana: c.mana - spell.cost,
        status: newStatus,
        facette: newFacette,
      });
    });

    try {
      const res = await generateSpellText(char, log, spell);
      addLog({ type: "narration", text: "✨ " + res.story });
      if (res.xp) updateXP(res.xp);
    } catch (error) {
      console.error("Spell failed:", error);
    } finally {
      setIsGenerating(false);
    }
  }

  function drinkMana() {
    const potion = char.inventory.find(function (i) {
      return i.name === "Fiole de mana" && i.qty > 0;
    });
    if (!potion) {
      addLog({
        type: "narration",
        text: "Élysia fouille sa besace... plus aucune fiole. Ses doigts ne trouvent que le tissu froid de sa tenue académique.",
      });
      return;
    }
    setChar(function (c) {
      return Object.assign({}, c, {
        mana: Math.min(c.manaMax, c.mana + 40),
        inventory: c.inventory.map(function (i) {
          return i.name === "Fiole de mana"
            ? Object.assign({}, i, { qty: i.qty - 1 })
            : i;
        }),
      });
    });
    addLog({
      type: "action",
      text: "Élysia débouche discrètement une fiole de mana et la vide d'un geste élégant. La chaleur arcanique se diffuse dans ses veines. (+40 mana)",
    });
  }

  function takeDmg(n) {
    setChar(function (c) {
      return Object.assign({}, c, { hp: Math.max(0, c.hp - n) });
    });
    addLog({
      type: "narration",
      text:
        "Un impact. La douleur irradie — brève, réelle, humiliante. Élysia serre les dents. (−" +
        n +
        " HP)",
    });
  }

  function heal(n) {
    setChar(function (c) {
      return Object.assign({}, c, { hp: Math.min(c.hpMax, c.hp + n) });
    });
    addLog({
      type: "narration",
      text:
        "Une chaleur douce parcourt le corps d'Élysia. Ses blessures se referment lentement, comme apaisées. (+" +
        n +
        " HP)",
    });
  }

  const hpPct = char.hp / char.hpMax;
  const hpColor =
    hpPct > 0.5 ? "#4caf50" : hpPct > 0.25 ? "#ff9800" : "#f44336";
  const isSombre = char.facette.includes("Sombre");
  const accentColor = isSombre ? "#8040c0" : "#c07820";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0a04",
        backgroundImage: isSombre
          ? "radial-gradient(ellipse at 30% 20%, #1a0828 0%, #0d0a04 70%)"
          : "radial-gradient(ellipse at 30% 20%, #1f1408 0%, #0d0a04 70%)",
        fontFamily: "'Palatino Linotype', Palatino, Georgia, serif",
        color: "#e8d5a3",
        padding: "20px 16px",
        boxSizing: "border-box",
        transition: "background 1s ease",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          borderBottom: "2px solid " + accentColor,
          paddingBottom: 16,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: 5,
            color: accentColor,
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          ✦ Fiche de Personnage ✦
        </div>
        <div
          style={{
            fontSize: 30,
            fontWeight: "bold",
            color: isSombre ? "#d080f0" : "#f0c0d0",
            textShadow: "0 0 20px " + (isSombre ? "#8040c050" : "#e08090_50"),
            letterSpacing: 2,
          }}
        >
          {char.name}
        </div>
        <div
          style={{
            fontSize: 12,
            color: isSombre ? "#9060b0" : "#b07880",
            fontStyle: "italic",
            marginTop: 2,
          }}
        >
          {char.title}
        </div>
        <div style={{ fontSize: 12, color: "#9a7040", marginTop: 4 }}>
          {char.classe} · Niveau {char.level} · Rang{" "}
          <RangBadge rang={char.rang} />
        </div>
        <div
          style={{
            marginTop: 6,
            display: "inline-block",
            padding: "2px 14px",
            borderRadius: 12,
            background: isSombre ? "#200d30" : "#200d10",
            border: "1px solid " + accentColor,
            fontSize: 11,
            color: accentColor,
          }}
        >
          {char.facette}
        </div>
        <div style={{ maxWidth: 280, margin: "10px auto 0" }}>
          <div style={{ fontSize: 10, color: "#5a3a10", marginBottom: 3 }}>
            ✨ XP : {char.xp} / {char.xpNext}
          </div>
          <div
            style={{
              background: "#1a1208",
              borderRadius: 2,
              height: 5,
              border: "1px solid #3d2e10",
            }}
          >
            <div
              style={{
                width: (char.xp / char.xpNext) * 100 + "%",
                height: "100%",
                background:
                  "linear-gradient(90deg, " +
                  (isSombre ? "#8040c0, #c060f0" : "#c06080, #f090b0") +
                  ")",
                borderRadius: 2,
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto items-start">
        {/* LEFT - Combat (Order 1 mobile, Col 1 desktop) */}
        <div className="order-1 lg:col-span-5">
          <Card title="⚔ Combat" accent={accentColor}>
            <StatBar
              value={char.hp}
              max={char.hpMax}
              color={hpColor}
              label="💚 HP"
            />
            <StatBar
              value={char.mana}
              max={char.manaMax}
              color={isSombre ? "#8040c0" : "#6080e0"}
              label="💙 Mana"
            />
          </Card>
        </div>

        {/* RIGHT - Journal (Order 2 mobile, Col 2 desktop, Sticky) */}
        <div className="flex flex-col h-[70vh] lg:h-[85vh] order-2 lg:col-span-7 lg:row-span-2 lg:sticky lg:top-8">
          <div
            style={{
              background: "#110e06",
              border: "1px solid " + accentColor,
              borderRadius: 8,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: accentColor,
                letterSpacing: 4,
                textTransform: "uppercase",
                marginBottom: 20,
                textAlign: "center",
                borderBottom: "1px solid rgba(192, 120, 32, 0.2)",
                paddingBottom: 10,
              }}
            >
              📜 Journal d'Aventure
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                paddingRight: 10,
                marginBottom: 20,
                scrollBehavior: "smooth",
              }}
            >
              {log.map(function (entry, i) {
                return (
                  <JournalEntry
                    key={i}
                    entry={entry}
                    isLatest={i === log.length - 1}
                  />
                );
              })}
              <div ref={logEndRef} />
            </div>

            {/* Bouton Continuer séparé */}
            <button
              onClick={handleContinueStory}
              disabled={isGenerating}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: 12,
                background: "rgba(192, 120, 32, 0.05)",
                border: "1px dashed rgba(192, 120, 32, 0.3)",
                borderRadius: 8,
                color: isGenerating ? "#4a3820" : "#c9b08a",
                cursor: isGenerating ? "not-allowed" : "pointer",
                fontSize: 11,
                fontWeight: "bold",
                fontFamily: "inherit",
                textTransform: "uppercase",
                transition: "all 0.2s",
                opacity: 0.8,
              }}
            >
              {isGenerating
                ? "L'oracle travaille..."
                : "✨ Continuer l'histoire"}
            </button>

            {/* Input d'action intégré au journal */}
            <div
              style={{
                display: "flex",
                background: "rgba(0,0,0,0.3)",
                border:
                  "1px solid " +
                  (isGenerating ? "#4a3010" : "rgba(192, 120, 32, 0.4)"),
                borderRadius: 8,
                overflow: "hidden",
                minHeight: 50,
                transition: "all 0.3s ease",
              }}
            >
              <textarea
                value={playerInput}
                onChange={(e) => setPlayerInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendAction();
                  }
                }}
                placeholder={
                  isGenerating
                    ? "L'oracle réfléchit..."
                    : "Que fait Élysia ?..."
                }
                disabled={isGenerating}
                rows={1}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  padding: "12px 16px",
                  color: isGenerating ? "#4a3820" : "#e8d5a3",
                  fontFamily: "inherit",
                  fontSize: 14,
                  outline: "none",
                  resize: "none",
                }}
              />
              <button
                onClick={handleSendAction}
                disabled={!playerInput.trim() || isGenerating}
                style={{
                  background: isGenerating
                    ? "transparent"
                    : "rgba(192, 120, 32, 0.1)",
                  border: "none",
                  borderLeft: "1px solid rgba(192, 120, 32, 0.2)",
                  color:
                    playerInput.trim() && !isGenerating
                      ? accentColor
                      : "#4a3820",
                  padding: "0 20px",
                  cursor:
                    playerInput.trim() && !isGenerating
                      ? "pointer"
                      : "not-allowed",
                  fontSize: 12,
                  fontWeight: "bold",
                  fontFamily: "inherit",
                  textTransform: "uppercase",
                  transition: "all 0.2s",
                }}
              >
                {isGenerating ? "..." : "Agir"}
              </button>
            </div>
          </div>
        </div>

        {/* LEFT - Autres Statistiques et Capacités (Order 3 mobile, Col 1 desktop) */}
        <div className="space-y-4 order-3 lg:col-span-5">
          <Card title="📊 Statistiques" accent={accentColor}>
            <div className="grid grid-cols-2 gap-x-6">
              {Object.entries(char.stats).map(function (e) {
                const stat = e[0];
                const val = e[1];
                const isKey =
                  stat.includes("Esprit") || stat.includes("Intelligence");
                return (
                  <div
                    key={stat}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      padding: "6px 0",
                      borderBottom: "1px solid rgba(30, 22, 8, 0.5)",
                    }}
                  >
                    <span style={{ color: "#9a7040" }}>{stat}</span>
                    <span
                      style={{
                        color: isKey
                          ? isSombre
                            ? "#c080e0"
                            : "#f090b0"
                          : "#e8d5a3",
                        fontWeight: isKey ? "bold" : "normal",
                      }}
                    >
                      {val}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="✨ Sorts & Capacités" accent={accentColor}>
            {char.spells.map(function (spell) {
              return (
                <SpellCard
                  key={spell.name}
                  spell={spell}
                  onCast={castSpell}
                  canCast={char.mana >= spell.cost}
                />
              );
            })}
          </Card>

          {/* Arme */}
          <div
            style={{
              background: "#110e06",
              border:
                "1px solid " + (char.weapon.eveille ? "#c0a020" : "#2a1e08"),
              borderRadius: 6,
              padding: 14,
              cursor: "pointer",
            }}
            onClick={() => setWeaponOpen(!weaponOpen)}
          >
            <div
              style={{
                fontSize: 10,
                color: char.weapon.eveille ? "#c0a020" : "#4a3010",
                letterSpacing: 3,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              ⚔️ Arme Liée {char.weapon.eveille ? "✦" : "🔒"}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 14,
                    color: char.weapon.eveille ? "#f0d060" : "#4a3820",
                    fontStyle: char.weapon.eveille ? "normal" : "italic",
                  }}
                >
                  {char.weapon.name}
                </div>
                <div style={{ fontSize: 10, color: "#4a3010", marginTop: 2 }}>
                  {char.weapon.type} · Rang {char.weapon.rang}
                </div>
              </div>
              <span style={{ fontSize: 10, color: "#4a3020" }}>
                {weaponOpen ? "▲" : "▼"}
              </span>
            </div>
            {weaponOpen && (
              <div
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: "1px solid #2a1e08",
                  fontSize: 11,
                  color: "#5a4020",
                  fontStyle: "italic",
                  lineHeight: 1.7,
                }}
              >
                {char.weapon.description}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card title="🎒 Inventaire" accent={accentColor}>
              {char.inventory.map(function (item) {
                return (
                  <div
                    key={item.name}
                    style={{
                      padding: "5px 0",
                      borderBottom: "1px solid rgba(30, 22, 8, 0.5)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                      }}
                    >
                      <span style={{ color: "#9a7040" }}>
                        {item.name} <RangBadge rang={item.rang} />
                      </span>
                      <span>×{item.qty}</span>
                    </div>
                  </div>
                );
              })}
            </Card>

            <Card title="🎯 Quêtes" accent={accentColor}>
              {char.quests.map(function (q, i) {
                return (
                  <div
                    key={i}
                    style={{
                      padding: "6px 0",
                    }}
                  >
                    <div style={{ fontSize: 12, color: "#c9b08a" }}>
                      {q.titre}
                    </div>
                    <div
                      style={{ fontSize: 10, color: "#4a7030", marginTop: 2 }}
                    >
                      ↳ {q.progression}
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        </div>
      </div>

      {/* Origine — repliée */}
      <div
        style={{ maxWidth: "6xl", margin: "24px auto 0" }}
        className="max-w-6xl"
      >
        <Card title="📖 Origine — [Confidentiel]" accent="#4a3010">
          <div
            style={{
              fontSize: 11,
              color: "#5a4020",
              fontStyle: "italic",
              lineHeight: 1.8,
              opacity: 0.6,
            }}
          >
            {char.backstory}
          </div>
        </Card>
      </div>
    </div>
  );
}
