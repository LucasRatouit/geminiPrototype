import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const SYSTEM_PROMPT = `Tu es le Game Master d'un RPG textuel narratif immersif. Tu es un grimoire vivant et omniscient.

PERSONNAGE : Élysia — 17 ans — cheveux roses, yeux bleu cristallin. Apprentie à l'Académie d'Arcanis.
ARME D'ÉVEIL : révélée au Rituel. Rang F à DIVIN. Peut avoir une conscience.

RÈGLES :
- Pas de saut temporel, 5 sens, cinématographique
- INTERDIT : "PNJ", "Événement inattendu", "Gros plan"
- Rareté : F < E < D < C < B < A << S <<< SS <<< SSS <<<<< DIVIN
- Noms originaux (ÉVITER : Kael, Elara, Lyssandra, Lunara, Sylvara, Eldric)

DIALOGUES :
[PAROLE:NomPersonnage] texte [/PAROLE]
[PAROLE:Élysia] réplique [/PAROLE]

CODEX PERSONNAGES — mettre à jour à chaque interaction significative :
[NPC_START]
NOM:Prénom Nom
TITRE:Rôle
RANG:rang ou ?
RELATION:neutre/allié/hostile/amical/mystérieux
AFFINITE:0 (de -100 hostile à +100 adorateur, évolue selon les choix)
HUMEUR:état émotionnel actuel en 2-3 mots (ex: curieux et méfiant)
OPINION:ce que ce personnage pense vraiment d'Élysia en 1 phrase directe
SECRET:quelque chose qu'il cache — peut être "inconnu" au début
DESCRIPTION:physique + personnalité (2-3 phrases)
LORE:contexte/histoire (1 phrase)
MEMOIRE:liste des moments clés partagés avec Élysia (1 ligne par événement, séparés par §)
[NPC_END]

Règles affinité : +10 à +30 pour action positive envers ce PNJ, -10 à -30 pour action négative.
Toujours réémettre le bloc [NPC_START]...[NPC_END] d'un personnage quand il apparaît ou quand son état change.

SORTS : nom|rang|degats|cout_mana|cout_hp|description

INVENTAIRE — FORMAT ÉTENDU OBLIGATOIRE :
nom|rareté|description|type|passif|actif|STAT1:val|STAT2:val...
- type : arme / armure / consommable / accessoire / quête / divers
- passif : effet permanent ou "Aucun"
- actif : effet utilisable ou "Aucun"
Exemples :
  Dague de l'Aube|E|Lame forgée à l'aube|arme|+2 Agilité|Aucun|ATK:12|VIT:3
  Robe Académique|F|Tenue réglementaire|armure|Aucun|Aucun|DEF:5|MAG:2
  Potion de Vie|D|Restaure les blessures|consommable|Aucun|Soigne 50 PV|HEAL:50
  Anneau de Clarté|C|Concentre la mana|accessoire|+10 Mana max|Aucun|MANA:10|INT:3

THÈME DE SCÈNE (émettre quand l'ambiance change vraiment) :
[THEME:nom] — thèmes disponibles : taverne, combat, mystere, academie, nature, donjon, nuit, reve, danger, calme, triomphe, deuil, magie, ville, marche

SIGNAUX RÉACTIFS (au début de la réponse) :
[DÉGÂTS:XX] — [RÊVE:debut] — [RÊVE:fin] — [LEVEL_UP] — [QUETE_TERMINEE:NomQuête|XP]

TYPOGRAPHIE : MAJUSCULES sons, **gras** important, *italique* ambiance, [crochets] pensées

HUD OBLIGATOIRE EN FIN DE CHAQUE RÉPONSE :
[HUD_START]
NOM:Élysia
NIVEAU:1
RANG:F
HP:100:100
MANA:80:80
XP:0:100
FORCE:8
INTELLIGENCE:12
ESPRIT:10
AGILITE:9
CHARISME:11
EFFETS:aucun
QUETES:Rituel d'Éveil|en cours
INVENTAIRE:Tenue académique|E|Uniforme réglementaire|armure|Aucun|Aucun|DEF:3;Grimoire vierge|F|Notes de cours|quête|Aucun|Aucun|MAG:0
SORTS:aucun
[HUD_END]

ARME LIÉE — quand elle s'éveille ou évolue, émettre :
[ARME_START]
NOM:nom de l'arme (ou ??? si inconnue)
RANG:F/E/D/C/B/A/S/SS/SSS/DIVIN
FORME:description physique courte
ELEMENT:feu/glace/foudre/ombre/lumière/vide/etc
PERSONNALITE:traits de caractère (2-3 mots)
VOIX:comment elle communique (télépathie/sensations/visions/silence)
LIEN:score 0-100 (lien avec Élysia)
SECRET:ce qu'elle cache ou "inconnu"
HISTORIQUE:événements marquants séparés par §
[ARME_END]
Quand l'arme s'éveille pour la première fois → émettre aussi [ITEM_ARME] pour l'ajouter à l'inventaire au format standard.
[ITEM_ARME]nom|rang|description courte|arme|passif de l'arme|actif de l'arme|ATK:val|MAG:val[/ITEM_ARME]

LIEUX DÉCOUVERTS — émettre quand Élysia entre dans un nouveau lieu :
[LIEU_START]
NOM:nom du lieu
TYPE:salle/bâtiment/quartier/donjon/extérieur/autre
AMBIANCE:description courte (1 phrase)
STATUT:sûr/mystérieux/dangereux/interdit/neutre
ICONE:un seul emoji représentatif
[LIEU_END]

RÉPUTATION — émettre quand la réputation change significativement :
[REP:id_faction:delta] où delta est un entier (ex: [REP:academie:+15] ou [REP:ombres:-10])
Factions : academie / ombres / marchands / gardiens / peuple

RYTHME NARRATIF :
- Privilégier le suspens et l'immersion sur la quantité
- Chaque réponse doit former une scène complète avec un début et une fin
- Ne jamais couper une phrase ou un paragraphe en plein milieu
- Si la scène devient longue, conclure proprement avant les choix

Terminer avec 3-4 choix numérotés.`;

const THEMES = {
  academie: {accent:"#a87c4f",glow:"#c4933a",bg1:"rgba(80,40,10,.4)",bg2:"rgba(40,20,5,.28)",hb:"rgba(168,124,79,.28)",tb:"rgba(168,124,79,.13)",mb:"rgba(168,124,79,.2)",name:"Académie"},
  taverne:  {accent:"#b5541e",glow:"#d4621e",bg1:"rgba(100,30,10,.4)",bg2:"rgba(60,15,5,.3)",hb:"rgba(181,84,30,.35)",tb:"rgba(181,84,30,.15)",mb:"rgba(181,84,30,.22)",name:"Taverne"},
  combat:   {accent:"#c92b2b",glow:"#ff4040",bg1:"rgba(120,10,10,.45)",bg2:"rgba(60,5,5,.35)",hb:"rgba(200,43,43,.4)",tb:"rgba(200,43,43,.2)",mb:"rgba(200,43,43,.28)",name:"Combat"},
  mystere:  {accent:"#7c3aed",glow:"#9d5de8",bg1:"rgba(50,10,90,.38)",bg2:"rgba(30,5,60,.28)",hb:"rgba(124,58,237,.35)",tb:"rgba(124,58,237,.15)",mb:"rgba(124,58,237,.22)",name:"Mystère"},
  nature:   {accent:"#2d7d46",glow:"#3da85e",bg1:"rgba(10,60,20,.38)",bg2:"rgba(5,35,12,.28)",hb:"rgba(45,125,70,.32)",tb:"rgba(45,125,70,.14)",mb:"rgba(45,125,70,.2)",name:"Nature"},
  donjon:   {accent:"#4a4a6a",glow:"#6060a0",bg1:"rgba(15,15,40,.45)",bg2:"rgba(8,8,25,.35)",hb:"rgba(74,74,106,.35)",tb:"rgba(74,74,106,.15)",mb:"rgba(74,74,106,.22)",name:"Donjon"},
  nuit:     {accent:"#1e3a6e",glow:"#2a52a0",bg1:"rgba(5,10,40,.5)",bg2:"rgba(3,6,25,.4)",hb:"rgba(30,58,110,.35)",tb:"rgba(30,58,110,.15)",mb:"rgba(30,58,110,.22)",name:"Nuit"},
  reve:     {accent:"#9b2d8f",glow:"#d040c0",bg1:"rgba(80,5,80,.4)",bg2:"rgba(40,3,50,.3)",hb:"rgba(155,45,143,.38)",tb:"rgba(155,45,143,.18)",mb:"rgba(155,45,143,.26)",name:"Rêve"},
  danger:   {accent:"#b84a00",glow:"#ff6600",bg1:"rgba(100,30,5,.45)",bg2:"rgba(60,15,3,.35)",hb:"rgba(184,74,0,.38)",tb:"rgba(184,74,0,.18)",mb:"rgba(184,74,0,.26)",name:"Danger"},
  calme:    {accent:"#3d7a8a",glow:"#4ea0b5",bg1:"rgba(5,40,60,.35)",bg2:"rgba(3,25,40,.25)",hb:"rgba(61,122,138,.3)",tb:"rgba(61,122,138,.12)",mb:"rgba(61,122,138,.18)",name:"Calme"},
  triomphe: {accent:"#c49a00",glow:"#ffd700",bg1:"rgba(80,60,5,.4)",bg2:"rgba(50,35,3,.3)",hb:"rgba(196,154,0,.38)",tb:"rgba(196,154,0,.18)",mb:"rgba(196,154,0,.26)",name:"Triomphe"},
  deuil:    {accent:"#555566",glow:"#8888aa",bg1:"rgba(20,20,30,.5)",bg2:"rgba(12,12,20,.4)",hb:"rgba(85,85,102,.32)",tb:"rgba(85,85,102,.14)",mb:"rgba(85,85,102,.2)",name:"Deuil"},
  magie:    {accent:"#5b21b6",glow:"#8b5cf6",bg1:"rgba(40,8,80,.42)",bg2:"rgba(22,5,50,.32)",hb:"rgba(91,33,182,.36)",tb:"rgba(91,33,182,.16)",mb:"rgba(91,33,182,.24)",name:"Magie"},
  ville:    {accent:"#7a6030",glow:"#aa8840",bg1:"rgba(60,45,15,.38)",bg2:"rgba(38,28,8,.28)",hb:"rgba(122,96,48,.32)",tb:"rgba(122,96,48,.14)",mb:"rgba(122,96,48,.2)",name:"Ville"},
  marche:   {accent:"#8a5c20",glow:"#c47c30",bg1:"rgba(70,40,10,.38)",bg2:"rgba(45,24,6,.28)",hb:"rgba(138,92,32,.32)",tb:"rgba(138,92,32,.14)",mb:"rgba(138,92,32,.2)",name:"Marché"},
};

const RC = {F:"#9ca3af",E:"#86efac",D:"#67e8f9",C:"#93c5fd",B:"#c4b5fd",A:"#fde68a",S:"#fb923c",SS:"#f87171",SSS:"#e879f9",DIVIN:"#fef9c3"};
const RG = {F:"#6b7280",E:"#4ade80",D:"#22d3ee",C:"#60a5fa",B:"#a78bfa",A:"#f59e0b",S:"#ea580c",SS:"#dc2626",SSS:"#d946ef",DIVIN:"#fde047"};
const ITYPE = {arme:"⚔️",armure:"🛡️",consommable:"🧪",accessoire:"💍","quête":"📜",divers:"📦"};
const ISCOLOR = {ATK:"#ef4444",DEF:"#60a5fa",MAG:"#c084fc",VIT:"#4ade80",HEAL:"#34d399",MANA:"#818cf8",INT:"#a78bfa",FOR:"#f87171",AGI:"#86efac",SPR:"#e879f9",DUR:"#fbbf24"};
const NPAL = [
  {bg:"rgba(96,165,250,.1)",border:"rgba(96,165,250,.3)",name:"#93c5fd",bubble:"rgba(20,40,80,.6)"},
  {bg:"rgba(74,222,128,.1)",border:"rgba(74,222,128,.28)",name:"#6ee7b7",bubble:"rgba(10,45,28,.6)"},
  {bg:"rgba(251,146,60,.1)",border:"rgba(251,146,60,.28)",name:"#fdba74",bubble:"rgba(70,30,5,.6)"},
  {bg:"rgba(192,132,252,.1)",border:"rgba(192,132,252,.28)",name:"#d8b4fe",bubble:"rgba(50,15,70,.6)"},
  {bg:"rgba(34,211,238,.1)",border:"rgba(34,211,238,.28)",name:"#67e8f9",bubble:"rgba(5,45,60,.6)"},
  {bg:"rgba(248,113,113,.1)",border:"rgba(248,113,113,.28)",name:"#fca5a5",bubble:"rgba(65,8,8,.6)"},
  {bg:"rgba(251,191,36,.1)",border:"rgba(251,191,36,.28)",name:"#fde68a",bubble:"rgba(70,45,5,.6)"},
];
const TABS = [
  {id:"game",icon:"📜",label:"Récit"},
  {id:"stats",icon:"⚔️",label:"Stats"},
  {id:"spells",icon:"🔮",label:"Sorts"},
  {id:"effects",icon:"✨",label:"Arcanes"},
  {id:"inventory",icon:"🎒",label:"Besace"},
  {id:"weapon",icon:"🗡️",label:"Arme Liée"},
  {id:"map",icon:"🗺️",label:"Carte"},
  {id:"reputation",icon:"⚖️",label:"Réputation"},
  {id:"quests",icon:"📋",label:"Quêtes"},
  {id:"codex",icon:"📖",label:"Codex"},
  {id:"npcs",icon:"👥",label:"Perso."},
];
const RELICON  = {allié:"💚",hostile:"💀",amical:"😊",mystérieux:"❓",neutre:"⚪"};
const RELCOLOR = {allié:"#4ade80",hostile:"#f87171",amical:"#fde68a",mystérieux:"#c084fc",neutre:"#9ca3af"};
const SMETA = [
  {key:"strength",label:"Force",icon:"⚔️",color:"#ef4444"},
  {key:"intelligence",label:"Intelligence",icon:"🔮",color:"#818cf8"},
  {key:"spirit",label:"Esprit",icon:"✨",color:"#c084fc"},
  {key:"agility",label:"Agilité",icon:"🌬️",color:"#4ade80"},
  {key:"charisma",label:"Charisme",icon:"💬",color:"#fbbf24"},
];
const SAVE_KEY = "elysia_chronicles_v4";

const ACTION_PROMPT = (action) => `
CONTEXTE : RPG à l'Académie d'Arcanis.
PERSONNAGE : Élysia.

ACTION DU JOUEUR : "${action}"

CONSIGNE : Décris la suite immédiate de cette action (3-5 phrases). 
Réagis à ce que fait le joueur, décris l'environnement ou les réactions des PNJ si nécessaire.
Maintiens une atmosphère mystérieuse et académique.
`;

const SPELL_PROMPT = (spell) => `
CONTEXTE : Univers de l'Académie d'Arcanis.
PERSONNAGE : Élysia.

ACTION : Lancer le sort "${spell.name}".
DESCRIPTION DU SORT : ${spell.desc}
EFFET ATTENDU : ${spell.dmg}

CONSIGNE : Décris l'incantation et la manifestation visuelle de la magie (3 phrases). 
Le ton doit être épique et refléter l'élément du sort.
`;

const CONTINUE_PROMPT = `
CONTEXTE : RPG à l'Académie d'Arcanis.
PERSONNAGE : Élysia.

CONSIGNE : Le joueur demande de continuer l'histoire sans action spécifique. 
Décris la progression naturelle de la scène (3-5 phrases). 
Introduis un petit événement, un changement d'ambiance, ou l'intervention d'un PNJ pour relancer l'intrigue.
Le ton doit être immersif et mystérieux.
`;

const D_WEAPON = {
  name:"???", rank:"?", awakened:false, personality:"", voice:"",
  bond:0, element:"", form:"", secret:"", history:[],
};
const D_FACTIONS = [
  {id:"academie", name:"Académie d'Arcanis", icon:"🏛️", score:0, desc:"L'institution qui forme les mages"},
  {id:"ombres",   name:"Les Ombres",          icon:"🌑", score:0, desc:"Faction secrète aux motivations inconnues"},
  {id:"marchands",name:"Guilde des Marchands", icon:"💰", score:0, desc:"Réseau commercial influent"},
  {id:"gardiens", name:"Gardiens d'Arcanis",   icon:"⚔️", score:0, desc:"Ordre protecteur de la cité"},
  {id:"peuple",   name:"Le Peuple",            icon:"👥", score:0, desc:"Les habitants ordinaires d'Arcanis"},
];
const D_LOCATIONS = [];
const D_THEME = THEMES.academie;
const D_STATS = {name:"Élysia",level:1,rank:"F",hp:100,hpMax:100,mana:80,manaMax:80,xp:0,xpMax:100,strength:8,intelligence:12,spirit:10,agility:9,charisma:11};
const D_INV = [
  {name:"Tenue académique",rarity:"E",desc:"Uniforme réglementaire",type:"armure",passive:"Aucun",active:"Aucun",stats:{DEF:"3"}},
  {name:"Grimoire vierge",rarity:"F",desc:"Notes de cours",type:"quête",passive:"Aucun",active:"Aucun",stats:{MAG:"0"}},
];

// ══════════════════════════════════════════════
//  PARSERS
// ══════════════════════════════════════════════
function parseHUD(text) {
  const m = text.match(/\[HUD_START\]([\s\S]*?)\[HUD_END\]/);
  if (!m) return null;
  const d = {};
  m[1].trim().split("\n").forEach(l => { const i = l.indexOf(":"); if (i !== -1) d[l.slice(0,i).trim()] = l.slice(i+1).trim(); });
  const sp = (k,def) => (d[k]||def).split(":");
  const stats = {
    name:d.NOM||"Élysia", level:+d.NIVEAU||1, rank:d.RANG||"F",
    hp:+sp("HP","100:100")[0]||100, hpMax:+sp("HP","100:100")[1]||100,
    mana:+sp("MANA","80:80")[0]||80, manaMax:+sp("MANA","80:80")[1]||80,
    xp:+sp("XP","0:100")[0]||0, xpMax:+sp("XP","0:100")[1]||100,
    strength:+d.FORCE||8, intelligence:+d.INTELLIGENCE||12,
    spirit:+d.ESPRIT||10, agility:+d.AGILITE||9, charisma:+d.CHARISME||11,
  };
  const pl = k => (!d[k]||["aucun","vide"].includes(d[k])) ? [] : d[k].split(";").map(s=>s.trim()).filter(Boolean);
  const inventory = pl("INVENTAIRE").map(s => {
    const p = s.split("|");
    const st = {};
    p.slice(6).forEach(rs => { const ci = rs.indexOf(":"); if (ci !== -1) st[rs.slice(0,ci).trim().toUpperCase()] = rs.slice(ci+1).trim(); });
    return {name:p[0]?.trim()||"?",rarity:p[1]?.trim()||"F",desc:p[2]?.trim()||"",type:p[3]?.trim()||"divers",passive:p[4]?.trim()||"Aucun",active:p[5]?.trim()||"Aucun",stats:st};
  });
  const effects = pl("EFFETS");
  const quests  = pl("QUETES").map(s=>{const p=s.split("|");return{title:p[0]?.trim()||s,progress:p[1]?.trim()||""};});
  const spells  = pl("SORTS").map(s=>{const p=s.split("|");return{name:p[0]?.trim()||"?",rank:p[1]?.trim()||"F",dmg:p[2]?.trim()||"—",manaCost:p[3]?.trim()||"0",hpCost:p[4]?.trim()||"0",desc:p[5]?.trim()||""};});
  return {stats,inventory,effects,quests,spells};
}
function parseNPCs(text) {
  const out=[],re=/\[NPC_START\]([\s\S]*?)\[NPC_END\]/g; let m;
  while((m=re.exec(text))!==null){const d={};m[1].trim().split("\n").forEach(l=>{const i=l.indexOf(":");if(i!==-1)d[l.slice(0,i).trim()]=l.slice(i+1).trim();});if(d.NOM)out.push({name:d.NOM,title:d.TITRE||"",rank:d.RANG||"?",relation:(d.RELATION||"neutre").toLowerCase(),description:d.DESCRIPTION||"",lore:d.LORE||""});}
  return out;
}
function parseSpeech(text) {
  const out=[],re=/\[PAROLE:([^\]]+)\]([\s\S]*?)\[\/PAROLE\]/g; let last=0,m;
  while((m=re.exec(text))!==null){if(m.index>last)out.push({type:"narration",text:text.slice(last,m.index)});out.push({type:"speech",speaker:m[1].trim(),text:m[2].trim()});last=m.index+m[0].length;}
  if(last<text.length)out.push({type:"narration",text:text.slice(last)});
  return out;
}
function cleanRaw(t) {
  return t.replace(/\[HUD_START\][\s\S]*?\[HUD_END\]/g,"").replace(/\[NPC_START\][\s\S]*?\[NPC_END\]/g,"")
    .replace(/\[DÉGÂTS:\d+\]/g,"").replace(/\[RÊVE:(debut|fin)\]/g,"").replace(/\[LEVEL_UP\]/g,"")
    .replace(/\[QUETE_TERMINEE:[^\]]+\]/g,"").replace(/\[THEME:[^\]]+\]/g,"").trim();
}
function detectEv(t) {
  const d=t.match(/\[DÉGÂTS:(\d+)\]/),qt=t.match(/\[QUETE_TERMINEE:([^|]+)\|(\d+)\]/),th=t.match(/\[THEME:([a-z_]+)\]/);
  return {damage:d?+d[1]:0,dreamStart:t.includes("[RÊVE:debut]"),dreamEnd:t.includes("[RÊVE:fin]"),levelUp:t.includes("[LEVEL_UP]"),questDone:qt?{title:qt[1].trim(),xp:+qt[2]}:null,theme:th?th[1]:null};
}
function parseWeapon(text) {
  const m=text.match(/\[ARME_START\]([\s\S]*?)\[ARME_END\]/);
  if(!m)return null;
  const d={};m[1].trim().split("\n").forEach(l=>{const i=l.indexOf(":");if(i!==-1)d[l.slice(0,i).trim()]=l.slice(i+1).trim();});
  return {name:d.NOM||"???",rank:d.RANG||"?",form:d.FORME||"",element:d.ELEMENT||"",
    personality:d.PERSONNALITE||"",voice:d.VOIX||"",bond:isNaN(+d.LIEN)?0:+d.LIEN,
    secret:d.SECRET||"",awakened:true,
    history:(d.HISTORIQUE||"").split("§").map(s=>s.trim()).filter(Boolean)};
}
function parseLocations(text) {
  const out=[],re=/\[LIEU_START\]([\s\S]*?)\[LIEU_END\]/g;let m;
  while((m=re.exec(text))!==null){
    const d={};m[1].trim().split("\n").forEach(l=>{const i=l.indexOf(":");if(i!==-1)d[l.slice(0,i).trim()]=l.slice(i+1).trim();});
    if(d.NOM)out.push({name:d.NOM,type:d.TYPE||"lieu",ambiance:d.AMBIANCE||"",statut:(d.STATUT||"neutre").toLowerCase(),icon:d.ICONE||"📍"});
  }
  return out;
}
function parseReputation(text) {
  const out={},re=/\[REP:([a-z_]+):([+-]?\d+)\]/g;let m;
  while((m=re.exec(text))!==null)out[m[1]]=(out[m[1]]||0)+(+m[2]);
  return out;
}
function parseWeaponItem(text) {
  const m=text.match(/\[ITEM_ARME\]([\s\S]*?)\[\/ITEM_ARME\]/);
  if(!m)return null;
  const p=m[1].trim().split("|");
  const st={};p.slice(6).forEach(rs=>{const ci=rs.indexOf(":");if(ci!==-1)st[rs.slice(0,ci).trim().toUpperCase()]=rs.slice(ci+1).trim();});
  return {name:p[0]?.trim()||"???",rarity:p[1]?.trim()||"F",desc:p[2]?.trim()||"",type:"arme",passive:p[4]?.trim()||"Aucun",active:p[5]?.trim()||"Aucun",stats:st};
}

// ══════════════════════════════════════════════
//  ATOMS
// ══════════════════════════════════════════════
const Divider = ({T}) => (
  <div style={{display:"flex",alignItems:"center",gap:8,margin:"8px 0",opacity:.35}}>
    <div style={{flex:1,height:1,background:`linear-gradient(90deg,transparent,${T.accent})`}}/>
    <span style={{color:T.accent,fontSize:10}}>⸙</span>
    <div style={{flex:1,height:1,background:`linear-gradient(90deg,${T.accent},transparent)`}}/>
  </div>
);
const Bar = ({value,max,color,glow}) => (
  <div style={{height:5,background:"rgba(0,0,0,.45)",borderRadius:3,overflow:"hidden"}}>
    <div style={{height:"100%",width:`${Math.min(100,Math.round(value/max*100))}%`,borderRadius:3,background:`linear-gradient(90deg,${color}55,${color})`,boxShadow:`0 0 5px ${glow}`,transition:"width .9s ease"}}/>
  </div>
);
function RichText({text}) {
  return <>{text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\])/g).map((s,i)=>{
    if(s.startsWith("**")&&s.endsWith("**"))return <strong key={i} style={{color:"#e8c87a"}}>{s.slice(2,-2)}</strong>;
    if(s.startsWith("*")&&s.endsWith("*"))return <em key={i} style={{color:"#dfc090"}}>{s.slice(1,-1)}</em>;
    if(s.startsWith("[")&&s.endsWith("]"))return <span key={i} style={{color:"#93c5fd",fontStyle:"italic"}}>✦ {s.slice(1,-1)} ✦</span>;
    return <span key={i}>{s.split(/([A-ZÀÂÇÉÈÊËÎÏÔÛÙÜŸÆŒ]{4,})/g).map((w,j)=>/^[A-ZÀÂÇÉÈÊËÎÏÔÛÙÜŸÆŒ]{4,}$/.test(w)?<span key={j} style={{color:"#fde68a",fontWeight:700,letterSpacing:2}}>{w}</span>:w)}</span>;
  })}</>;
}
const SC = ({k,v}) => { const c=ISCOLOR[k]||"#9ca3af"; return <span style={{display:"inline-flex",alignItems:"center",gap:3,background:`${c}14`,border:`1px solid ${c}33`,borderRadius:20,padding:"2px 7px",marginRight:4,marginBottom:4,fontSize:9,fontFamily:"'Cinzel',serif"}}><span style={{color:c,fontWeight:700}}>{k}</span><span style={{color:"#c8b08a"}}>{v}</span></span>; };

// ══════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════
export default function ElysiaChronicles() {
  const [msgs,     setMsgs]     = useState([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [tab,      setTab]      = useState("game");
  const [stats,    setStats]    = useState(D_STATS);
  const [inv,      setInv]      = useState(D_INV);
  const [eff,      setEff]      = useState([]);
  const [quests,   setQuests]   = useState([{title:"Rituel d'Éveil",progress:"en cours"}]);
  const [spells,   setSpells]   = useState([]);
  const [npcs,     setNpcs]     = useState([]);
  const [npcCols,  setNpcCols]  = useState({});
  const [hitFx,    setHitFx]    = useState(false);
  const [dream,    setDream]    = useState(false);
  const [lvlFx,    setLvlFx]   = useState(false);
  const [shake,    setShake]    = useState(false);
  const [isFS,     setIsFS]     = useState(false);
  const [selNpc,   setSelNpc]   = useState(null);
  const [selItem,  setSelItem]  = useState(null);
  const [theme,    setTheme]    = useState(D_THEME);
  const [thFx,     setThFx]    = useState(false);
  const [lvlModal, setLvlModal] = useState(false);
  const [lvlMode,  setLvlMode]  = useState(null);
  const [qToast,   setQToast]  = useState(null);
  const [saveSt,   setSaveSt]  = useState("idle");

  const [weapon,   setWeapon]   = useState(D_WEAPON);
  const [locations,setLocations]= useState(D_LOCATIONS);
  const [factions, setFactions] = useState(D_FACTIONS);

  const chatRef   = useRef(null);
  const chatEnd   = useRef(null);
  const convoRef  = useRef([]);
  const started   = useRef(false);
  const rootRef   = useRef(null);
  const npcIdx    = useRef(0);
  const scrollPos = useRef(0);
  const prevTab   = useRef("game");
  const lastCnt   = useRef(0);

  // ── STORAGE
  const saveGame = useCallback(async (allMsgs,st,iv,ef,qst,spl,nc,ncols,tname,wp2,locs2,fac2) => {
    try {
      setSaveSt("saving");
      await window.storage.set(SAVE_KEY, JSON.stringify({messages:allMsgs,stats:st,inventory:iv,effects:ef,quests:qst,spells:spl,npcs:nc,npcColors:ncols,themeName:tname,convo:convoRef.current,weapon:wp2,locations:locs2,factions:fac2,ts:Date.now()}));
      setSaveSt("saved"); setTimeout(()=>setSaveSt("idle"),2000);
    } catch(e){ setSaveSt("idle"); }
  },[]);

  const loadGame = useCallback(async () => {
    try {
      const r = await window.storage.get(SAVE_KEY);
      if (!r) return false;
      const s = JSON.parse(r.value);
      if (!s.messages?.length) return false;
      setMsgs(s.messages);
      if(s.stats)     setStats(s.stats);
      if(s.inventory) setInv(s.inventory);
      if(s.effects)   setEff(s.effects);
      if(s.quests)    setQuests(s.quests);
      if(s.spells)    setSpells(s.spells);
      if(s.npcs)      setNpcs(s.npcs);
      if(s.npcColors) { setNpcCols(s.npcColors); npcIdx.current=Object.keys(s.npcColors).length; }
      if(s.themeName&&THEMES[s.themeName]) setTheme(THEMES[s.themeName]);
      if(s.convo)     convoRef.current=s.convo;
      if(s.weapon)    setWeapon(s.weapon);
      if(s.locations) setLocations(s.locations);
      if(s.factions)  setFactions(s.factions);
      lastCnt.current=s.messages.length;
      setSaveSt("loaded"); setTimeout(()=>setSaveSt("idle"),2500);
      return true;
    } catch(e){ return false; }
  },[]);

  const resetGame = useCallback(async () => {
    if (!window.confirm("Effacer la partie et recommencer ?")) return;
    try { await window.storage.delete(SAVE_KEY); } catch(e){}
    setMsgs([]); setStats(D_STATS); setInv(D_INV); setEff([]); setQuests([{title:"Rituel d'Éveil",progress:"en cours"}]);
    setSpells([]); setNpcs([]); setNpcCols({}); setTheme(D_THEME); setWeapon(D_WEAPON); setLocations(D_LOCATIONS); setFactions(D_FACTIONS);
    npcIdx.current=0; convoRef.current=[]; lastCnt.current=0; scrollPos.current=0;
    started.current=false;
    setTimeout(()=>{ if(!started.current){started.current=true;startGame();} },100);
  },[]);

  // ── SCROLL
  useEffect(()=>{
    if(tab==="game"&&prevTab.current!=="game"&&chatRef.current) chatRef.current.scrollTop=scrollPos.current;
    else if(tab!=="game"&&prevTab.current==="game"&&chatRef.current) scrollPos.current=chatRef.current.scrollTop;
    prevTab.current=tab;
  },[tab]);
  useEffect(()=>{
    if(msgs.length>lastCnt.current){ lastCnt.current=msgs.length; setTimeout(()=>{ chatEnd.current?.scrollIntoView({behavior:"smooth"}); if(chatRef.current) scrollPos.current=chatRef.current.scrollHeight; },80); }
  },[msgs]);

  // ── INIT
  useEffect(()=>{ if(started.current)return; started.current=true; loadGame().then(found=>{ if(!found)startGame(); }); },[]);
  useEffect(()=>{ const fn=()=>setIsFS(!!document.fullscreenElement); document.addEventListener("fullscreenchange",fn); return()=>document.removeEventListener("fullscreenchange",fn); },[]);
  const toggleFS = useCallback(()=>{ if(!document.fullscreenElement)rootRef.current?.requestFullscreen().catch(()=>{}); else document.exitFullscreen().catch(()=>{}); },[]);

  const assignColor = useCallback((name)=>{
    setNpcCols(p=>{ if(p[name]!==undefined)return p; const i=npcIdx.current%NPAL.length; npcIdx.current++; return{...p,[name]:i}; });
  },[]);

  // ── HUD
  const applyHUD = useCallback((raw)=>{
    const p=parseHUD(raw); let ns,ni,ne,nq,nsp;
    if(p){ setStats(p.stats); setInv(p.inventory); setEff(p.effects); setQuests(p.quests); setSpells(p.spells); ns=p.stats; ni=p.inventory; ne=p.effects; nq=p.quests; nsp=p.spells; }
    const nn=parseNPCs(raw);
    if(nn.length>0){ setNpcs(prev=>{const u=[...prev];nn.forEach(n=>{const ex=u.find(x=>x.name===n.name);if(!ex)u.push(n);else Object.assign(ex,n);});return u;}); nn.forEach(n=>assignColor(n.name)); }
    const re=/\[PAROLE:([^\]]+)\]/g; let sm; while((sm=re.exec(raw))!==null)assignColor(sm[1].trim());
    const ev=detectEv(raw);
    if(ev.damage>0){setHitFx(true);setShake(true);setTimeout(()=>setHitFx(false),700);setTimeout(()=>setShake(false),500);}
    if(ev.dreamStart)setDream(true); if(ev.dreamEnd)setDream(false);
    if(ev.levelUp){setLvlFx(true);setTimeout(()=>setLvlFx(false),1800);setLvlModal(true);}
    if(ev.questDone){setQToast(ev.questDone);setTimeout(()=>setQToast(null),4000);}
    let tn; if(ev.theme&&THEMES[ev.theme]){setTheme(THEMES[ev.theme]);setThFx(true);setTimeout(()=>setThFx(false),1200);tn=ev.theme;}
    // Weapon
    const wp=parseWeapon(raw);
    if(wp){setWeapon(wp);}
    // Weapon item in inventory
    const wi=parseWeaponItem(raw);
    if(wi){setInv(prev=>{const exists=prev.find(x=>x.name===wi.name);return exists?prev:[...prev,wi];});}
    // Locations
    const locs=parseLocations(raw);
    if(locs.length>0){setLocations(prev=>{const u=[...prev];locs.forEach(l=>{if(!u.find(x=>x.name===l.name))u.push(l);});return u;});}
    // Reputation
    const reps=parseReputation(raw);
    if(Object.keys(reps).length>0){setFactions(prev=>prev.map(f=>reps[f.id]?{...f,score:Math.max(-100,Math.min(100,(f.score||0)+reps[f.id]))}:f));}
    return {cl:cleanRaw(raw),ns,ni,ne,nq,nsp,tn};
  },[assignColor]);

  const callAI = async(messages)=>{
    const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:3000,system:SYSTEM_PROMPT,messages})});
    const d=await r.json(); return d.content?.map(b=>b.text||"").join("")||"";
  };

  const processAI = async (userMsg, aiPrompt) => {
    if (loading) return;
    setLoading(true);
    
    const newM = userMsg ? [...msgs, userMsg] : [...msgs];
    convoRef.current = [...convoRef.current, { role: "user", content: aiPrompt }];
    
    try {
      const raw = await callAI(convoRef.current);
      const { cl, ns, ni, ne, nq, nsp, tn } = applyHUD(raw);
      const aiMsg = { role: "ai", content: cl, raw };
      const allM = [...newM, aiMsg];
      setMsgs(allM);
      convoRef.current = [...convoRef.current, { role: "assistant", content: raw }];
      
      setNpcs(cn => {
        setNpcCols(cc => {
          saveGame(allM, ns || stats, ni || inv, ne || eff, nq || quests, nsp || spells, cn, cc, tn || Object.keys(THEMES).find(k => THEMES[k] === theme) || "academie", weapon, locations, factions);
          return cc;
        });
        return cn;
      });
    } catch (e) {
      setMsgs(p => [...p, { role: "ai", content: "*Une perturbation magique...*", raw: "" }]);
    }
    setLoading(false);
  };

  const startGame = async()=>{
    setLoading(true);
    try{
      const raw=await callAI([{role:"user",content:"Commence l'aventure. Élysia arrive à l'Académie d'Arcanis pour la première fois. Introduis 1-2 personnages. Émets [THEME:academie]."}]);
      const {cl,ns,ni,ne,nq,nsp,tn}=applyHUD(raw);
      const m=[{role:"ai",content:cl,raw}]; setMsgs(m);
      convoRef.current=[{role:"user",content:"Commence l'aventure. Élysia arrive à l'Académie d'Arcanis pour la première fois. Introduis 1-2 personnages. Émets [THEME:academie]."},{role:"assistant",content:raw}];
      await saveGame(m,ns||D_STATS,ni||D_INV,ne||[],nq||[],nsp||[],[],{},tn||"academie",D_WEAPON,D_LOCATIONS,D_FACTIONS);
    }catch(e){setMsgs([{role:"ai",content:"*Le grimoire refuse de s'ouvrir...*",raw:""}]);}
    setLoading(false);
  };

  const send=async()=>{
    if(!input.trim()||loading)return;
    const msg=input.trim(); setInput("");
    await processAI({ role: "user", content: msg }, ACTION_PROMPT(msg));
  };

  const handleContinue = async () => {
    await processAI(null, CONTINUE_PROMPT);
  };

  const handleCastSpell = async (spell) => {
    const cost = parseInt(spell.manaCost) || 0;
    if (stats.mana < cost) {
      setMsgs(p => [...p, { role: "ai", content: "*Élysia puise dans ses réserves... mais le vide lui répond. Pas assez de mana.*", raw: "" }]);
      return;
    }
    await processAI({ role: "user", content: `✨ Élysia lance ${spell.name} !` }, SPELL_PROMPT(spell));
  };

  const doAll=()=>{setStats(s=>({...s,hp:s.hpMax+15,hpMax:s.hpMax+15,mana:s.manaMax+10,manaMax:s.manaMax+10,strength:s.strength+2,intelligence:s.intelligence+2,spirit:s.spirit+2,agility:s.agility+2,charisma:s.charisma+2}));setLvlModal(false);setLvlMode(null);};
  const doPick=(k)=>{setStats(s=>({...s,[k]:s[k]+5}));setLvlModal(false);setLvlMode(null);};

  const T=theme, rc=RC[stats.rank]||"#9ca3af", rg=RG[stats.rank]||"#6b7280";

  // ── Bubble renderer
  const renderBubble=(seg,key)=>{
    const isE=seg.speaker==="Élysia";
    const pal=NPAL[(npcCols[seg.speaker]??0)%NPAL.length];
    if(isE)return(
      <div key={key} style={{display:"flex",justifyContent:"flex-end",margin:"6px 0"}}>
        <div style={{maxWidth:"82%"}}>
          <div style={{fontSize:7,color:T.accent,textAlign:"right",marginBottom:2,letterSpacing:1,fontFamily:"'Cinzel',serif"}}>✦ ÉLYSIA ✦</div>
          <div style={{background:`linear-gradient(135deg,${T.accent}18,${T.accent}09)`,border:`1px solid ${T.accent}44`,borderRadius:"13px 3px 13px 13px",padding:"8px 12px",fontSize:13,color:"#dfc090",fontFamily:"'IM Fell English',serif",fontStyle:"italic",lineHeight:1.65}}><RichText text={seg.text}/></div>
        </div>
        <div style={{width:26,height:26,borderRadius:"50%",background:`${T.accent}22`,border:`1px solid ${T.accent}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0,marginLeft:6,marginTop:4}}>🌸</div>
      </div>
    );
    return(
      <div key={key} style={{display:"flex",alignItems:"flex-start",margin:"6px 0",gap:7}}>
        <div onClick={()=>{const n=npcs.find(x=>x.name===seg.speaker);if(n)setSelNpc(n);}}
          style={{width:26,height:26,borderRadius:"50%",background:pal.bubble,border:`1px solid ${pal.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:pal.name,fontFamily:"'Cinzel',serif",fontWeight:700,flexShrink:0,marginTop:4,cursor:"pointer",transition:"transform .15s"}}
          onMouseEnter={e=>e.currentTarget.style.transform="scale(1.12)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
          {seg.speaker.charAt(0)}
        </div>
        <div style={{maxWidth:"82%"}}>
          <div style={{fontSize:7,color:pal.name,marginBottom:2,letterSpacing:1,fontFamily:"'Cinzel',serif"}}>{seg.speaker.toUpperCase()}</div>
          <div style={{background:pal.bubble,border:`1px solid ${pal.border}`,borderRadius:"3px 13px 13px 13px",padding:"8px 12px",fontSize:13,color:dream?"#e0c0ff":"#d4c4a0",fontFamily:"'IM Fell English',serif",fontStyle:"italic",lineHeight:1.65}}><RichText text={seg.text}/></div>
        </div>
      </div>
    );
  };

  const renderAI=(msg,i)=>{
    const segs=parseSpeech(msg.content);
    return(
      <div key={i} style={{marginBottom:13,animation:"reveal .4s ease"}}>
        <div style={{background:"linear-gradient(160deg,rgba(12,6,2,.97),rgba(8,4,1,.99))",border:`1px solid ${T.mb}`,borderRadius:"2px 11px 11px 11px",padding:"11px 13px",position:"relative",overflow:"hidden",boxShadow:"0 4px 18px rgba(0,0,0,.6)",transition:"border-color 1.8s"}}>
          <div style={{position:"absolute",top:4,left:4,fontSize:8,color:`${T.accent}38`}}>❧</div>
          <div style={{position:"absolute",top:4,right:4,fontSize:8,color:`${T.accent}38`}}>❧</div>
          <div style={{fontSize:7,color:`${T.accent}88`,marginBottom:7,letterSpacing:2,textAlign:"center",fontFamily:"'Cinzel',serif"}}>✦ LE GRIMOIRE PARLE ✦</div>
          {segs.map((seg,j)=>{
            if(seg.type==="speech")return renderBubble(seg,`b${i}-${j}`);
            return <div key={`n${i}-${j}`}>{seg.text.split("\n").map((line,k)=>{
              if(!line.trim())return <div key={k} style={{height:5}}/>;
              if(/^\d+[\.\)]/.test(line.trim())){
                const num=line.match(/^(\d+)/)?.[1],txt=line.replace(/^\d+[\.\)]\s*/,"");
                return <div key={k} onClick={()=>setInput(txt)} style={{marginTop:5,padding:"5px 10px",background:`linear-gradient(90deg,${T.accent}0d,transparent)`,border:`1px solid ${T.accent}22`,borderLeft:`3px solid ${T.accent}55`,borderRadius:"0 6px 6px 0",cursor:"pointer",fontSize:12,color:T.glow,fontFamily:"'IM Fell English',serif",display:"flex",alignItems:"center",gap:7,transition:"all .15s"}} onMouseEnter={e=>{e.currentTarget.style.background=`${T.accent}16`;e.currentTarget.style.borderLeftColor=T.glow;}} onMouseLeave={e=>{e.currentTarget.style.background=`linear-gradient(90deg,${T.accent}0d,transparent)`;e.currentTarget.style.borderLeftColor=`${T.accent}55`;}}>
                  <span style={{width:15,height:15,borderRadius:"50%",background:`${T.accent}20`,border:`1px solid ${T.accent}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:7,fontWeight:700,color:T.accent,flexShrink:0}}>{num}</span>
                  <RichText text={txt}/>
                </div>;
              }
              return <p key={k} style={{margin:"3px 0",fontSize:13,lineHeight:1.8,color:dream?"#e0c0ff":"#c8b08a",fontFamily:"'IM Fell English',Georgia,serif",animation:dream?"dreamText 4s infinite":""}}><RichText text={line}/></p>;
            })}</div>;
          })}
        </div>
      </div>
    );
  };

  const renderMsg=(msg,i)=>{
    if(msg.role==="user")return(
      <div key={i} style={{display:"flex",justifyContent:"flex-end",marginBottom:11}}>
        <div style={{maxWidth:"74%",background:`linear-gradient(135deg,${T.accent}11,${T.accent}06)`,border:`1px solid ${T.accent}2e`,borderRadius:"12px 2px 12px 12px",padding:"7px 12px",fontSize:13,color:"#d4b483",fontFamily:"'IM Fell English',serif",fontStyle:"italic",lineHeight:1.6}}>
          <span style={{fontSize:7,color:`${T.accent}88`,display:"block",marginBottom:2,letterSpacing:1}}>✦ ÉLYSIA ✦</span>{msg.content}
        </div>
      </div>
    );
    return renderAI(msg,i);
  };

  // ── ITEM MODAL
  const ItemModal=()=>{
    if(!selItem)return null;
    const safeStats=(selItem.stats&&typeof selItem.stats==="object"&&!Array.isArray(selItem.stats))?selItem.stats:{};
    const irc=RC[selItem.rarity]||"#9ca3af", se=Object.entries(safeStats);
    return(
      <div onClick={()=>setSelItem(null)} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.82)",display:"flex",alignItems:"center",justifyContent:"center",padding:18}}>
        <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(160deg,rgba(14,7,2,.99),rgba(8,4,1,.99))",border:`1px solid ${irc}44`,borderRadius:12,padding:20,maxWidth:350,width:"100%",position:"relative",boxShadow:`0 0 36px ${irc}22`}}>
          <button onClick={()=>setSelItem(null)} style={{position:"absolute",top:9,right:11,background:"none",border:"none",color:"#6b4f2a",cursor:"pointer",fontSize:16,lineHeight:1}}>✕</button>
          <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:12}}>
            <div style={{width:44,height:44,borderRadius:8,background:`${irc}14`,border:`2px solid ${irc}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{ITYPE[selItem.type]||"📦"}</div>
            <div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:13,color:"#e8c87a",fontWeight:700}}>{selItem.name}</div>
              <div style={{display:"flex",gap:5,marginTop:3}}>
                <span style={{fontSize:8,color:irc,background:`${irc}18`,border:`1px solid ${irc}33`,borderRadius:20,padding:"1px 7px",fontFamily:"'Cinzel',serif"}}>RANG {selItem.rarity}</span>
                <span style={{fontSize:8,color:"#8a6840",background:"rgba(168,124,79,.08)",border:"1px solid rgba(168,124,79,.18)",borderRadius:20,padding:"1px 7px"}}>{(selItem.type||"divers").toUpperCase()}</span>
              </div>
            </div>
          </div>
          <Divider T={T}/>
          <div style={{fontSize:11,color:"#c8b08a",lineHeight:1.7,fontFamily:"'IM Fell English',serif",fontStyle:"italic",marginBottom:se.length?10:0}}>{selItem.desc}</div>
          {se.length>0&&<div style={{marginBottom:10}}><div style={{fontSize:7,color:`${T.accent}88`,letterSpacing:2,marginBottom:6,fontFamily:"'Cinzel',serif"}}>STATISTIQUES</div><div style={{display:"flex",flexWrap:"wrap"}}>{se.map(([k,v])=><SC key={k} k={k} v={v}/>)}</div></div>}
          {selItem.passive&&!/^[Aa]ucun/.test(selItem.passive)&&<div style={{marginBottom:8,background:"rgba(74,222,128,.06)",border:"1px solid rgba(74,222,128,.18)",borderRadius:8,padding:"8px 10px"}}><div style={{fontSize:8,color:"#4ade80",letterSpacing:1,marginBottom:3,fontFamily:"'Cinzel',serif"}}>⚡ PASSIF</div><div style={{fontSize:11,color:"#a0d4b0",fontFamily:"'IM Fell English',serif",fontStyle:"italic"}}>{selItem.passive}</div></div>}
          {selItem.active&&!/^[Aa]ucun/.test(selItem.active)&&<div style={{background:"rgba(96,165,250,.06)",border:"1px solid rgba(96,165,250,.18)",borderRadius:8,padding:"8px 10px"}}><div style={{fontSize:8,color:"#60a5fa",letterSpacing:1,marginBottom:3,fontFamily:"'Cinzel',serif"}}>🔵 ACTIF</div><div style={{fontSize:11,color:"#a0c4f0",fontFamily:"'IM Fell English',serif",fontStyle:"italic"}}>{selItem.active}</div></div>}
        </div>
      </div>
    );
  };

  // ── NPC MODAL
  const NpcModal=()=>{
    if(!selNpc)return null;
    const pal=NPAL[(npcCols[selNpc.name]??0)%NPAL.length], relC=RELCOLOR[selNpc.relation]||"#9ca3af";
    const aff = selNpc.affinity||0;
    const affColor = aff>50?"#4ade80":aff>20?"#86efac":aff>0?"#d4c4a0":aff>-20?"#fbbf24":aff>-50?"#fb923c":"#f87171";
    const affIcon  = aff>60?"🔥":aff>30?"💛":aff>10?"🙂":aff>-10?"😐":aff>-30?"😒":aff>-60?"❄️":"💀";
    const affLabel = aff>60?"Dévoué":aff>30?"Amical":aff>10?"Bienveillant":aff>-10?"Neutre":aff>-30?"Méfiant":aff>-60?"Hostile":"Ennemi";
    const affPct = Math.round((aff+100)/200*100);
    return(
      <div onClick={()=>setSelNpc(null)} style={{position:"fixed",inset:0,zIndex:201,background:"rgba(0,0,0,.85)",display:"flex",alignItems:"center",justifyContent:"center",padding:18,overflowY:"auto"}}>
        <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(160deg,rgba(14,7,2,.99),rgba(8,4,1,.99))",border:`1px solid ${pal.border}`,borderRadius:12,padding:20,maxWidth:380,width:"100%",position:"relative",boxShadow:`0 0 32px ${pal.border}44`,maxHeight:"90vh",overflowY:"auto"}}>
          <button onClick={()=>setSelNpc(null)} style={{position:"absolute",top:9,right:11,background:"none",border:"none",color:"#6b4f2a",cursor:"pointer",fontSize:16,lineHeight:1}}>✕</button>

          {/* Header */}
          <div style={{display:"flex",alignItems:"center",gap:11,marginBottom:10}}>
            <div style={{width:48,height:48,borderRadius:"50%",background:pal.bubble,border:`2px solid ${pal.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:21,color:pal.name,fontFamily:"'Cinzel',serif",fontWeight:700,flexShrink:0}}>{selNpc.name.charAt(0)}</div>
            <div>
              <div style={{fontFamily:"'Cinzel',serif",fontSize:13,color:"#e8c87a",fontWeight:700}}>{selNpc.name}</div>
              {selNpc.title&&<div style={{fontSize:8,color:"#8a6840",letterSpacing:.8,marginTop:1}}>{selNpc.title.toUpperCase()}</div>}
              <div style={{display:"flex",gap:5,marginTop:4,flexWrap:"wrap"}}>
                {selNpc.rank&&selNpc.rank!=="?"&&<span style={{fontSize:8,color:RC[selNpc.rank]||"#9ca3af",background:`${RC[selNpc.rank]||"#9ca3af"}18`,border:`1px solid ${RC[selNpc.rank]||"#9ca3af"}33`,borderRadius:20,padding:"1px 7px",fontFamily:"'Cinzel',serif"}}>RANG {selNpc.rank}</span>}
                <span style={{fontSize:8,color:relC,background:`${relC}18`,border:`1px solid ${relC}33`,borderRadius:20,padding:"1px 7px",fontFamily:"'Cinzel',serif"}}>{RELICON[selNpc.relation]||"⚪"} {selNpc.relation.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Affinity bar */}
          <div style={{marginBottom:12,background:"rgba(0,0,0,.3)",border:"1px solid rgba(168,124,79,.15)",borderRadius:8,padding:"9px 11px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
              <span style={{fontSize:8,color:"#8a6840",fontFamily:"'Cinzel',serif",letterSpacing:1}}>AFFINITÉ ENVERS ÉLYSIA</span>
              <span style={{fontSize:11,color:affColor,fontFamily:"'Cinzel',serif",fontWeight:700}}>{affIcon} {affLabel} ({aff>0?"+":""}{aff})</span>
            </div>
            <div style={{height:6,background:"rgba(0,0,0,.5)",borderRadius:3,overflow:"hidden",position:"relative"}}>
              <div style={{position:"absolute",left:"50%",top:0,width:1,height:"100%",background:"rgba(255,255,255,.15)"}}/>
              <div style={{height:"100%",width:`${affPct}%`,borderRadius:3,background:`linear-gradient(90deg,${affColor}55,${affColor})`,transition:"width 1s ease"}}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
              <span style={{fontSize:7,color:"#6b4f2a"}}>💀 Ennemi</span>
              <span style={{fontSize:7,color:"#6b4f2a"}}>🔥 Dévoué</span>
            </div>
          </div>

          {/* Mood */}
          {selNpc.mood&&<div style={{marginBottom:9,display:"flex",alignItems:"center",gap:7,background:"rgba(168,124,79,.06)",border:"1px solid rgba(168,124,79,.15)",borderRadius:7,padding:"7px 10px"}}>
            <span style={{fontSize:14}}>🎭</span>
            <div><div style={{fontSize:8,color:"#8a6840",letterSpacing:1,marginBottom:1,fontFamily:"'Cinzel',serif"}}>HUMEUR ACTUELLE</div><div style={{fontSize:11,color:"#d4b483",fontFamily:"'IM Fell English',serif",fontStyle:"italic"}}>{selNpc.mood}</div></div>
          </div>}

          <Divider T={T}/>

          {/* Description */}
          {selNpc.description&&<div style={{fontSize:11,color:"#c8b08a",lineHeight:1.75,fontFamily:"'IM Fell English',serif",fontStyle:"italic",marginBottom:10}}>{selNpc.description}</div>}

          {/* Opinion */}
          {selNpc.opinion&&<div style={{marginBottom:10,background:`${pal.bg}`,border:`1px solid ${pal.border}`,borderRadius:8,padding:"9px 11px"}}>
            <div style={{fontSize:8,color:pal.name,letterSpacing:1,marginBottom:4,fontFamily:"'Cinzel',serif"}}>💬 CE QU'IL PENSE D'ÉLYSIA</div>
            <div style={{fontSize:11,color:"#c8b08a",fontFamily:"'IM Fell English',serif",fontStyle:"italic",lineHeight:1.6}}>« {selNpc.opinion} »</div>
          </div>}

          {/* Secret */}
          {selNpc.secret&&selNpc.secret!=="inconnu"&&selNpc.secret!=="Inconnu"&&<div style={{marginBottom:10,background:"rgba(124,58,237,.07)",border:"1px solid rgba(124,58,237,.22)",borderRadius:8,padding:"9px 11px"}}>
            <div style={{fontSize:8,color:"#a78bfa",letterSpacing:1,marginBottom:4,fontFamily:"'Cinzel',serif"}}>🔮 SECRET</div>
            <div style={{fontSize:11,color:"#c4a8f0",fontFamily:"'IM Fell English',serif",fontStyle:"italic",lineHeight:1.6}}>{selNpc.secret}</div>
          </div>}

          {/* Lore */}
          {selNpc.lore&&<div style={{fontSize:10,color:"#8a6840",lineHeight:1.6,fontFamily:"'IM Fell English',serif",fontStyle:"italic",paddingTop:8,borderTop:"1px solid rgba(168,124,79,.13)",marginBottom:selNpc.memory?.length?10:0}}>📖 {selNpc.lore}</div>}

          {/* Memory / Historique */}
          {selNpc.memory?.length>0&&<div style={{marginTop:8}}>
            <div style={{fontSize:8,color:"#8a6840",letterSpacing:1,marginBottom:7,fontFamily:"'Cinzel',serif"}}>📜 MOMENTS PARTAGÉS</div>
            {selNpc.memory.map((m,i)=><div key={i} style={{display:"flex",gap:7,marginBottom:5,alignItems:"flex-start"}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:T.accent,flexShrink:0,marginTop:5,opacity:.6}}/>
              <div style={{fontSize:10,color:"#9a7850",fontFamily:"'IM Fell English',serif",fontStyle:"italic",lineHeight:1.5}}>{m}</div>
            </div>)}
          </div>}
        </div>
      </div>
    );
  };

  // ── LEVEL UP MODAL
  const LvlModal=()=>{
    if(!lvlModal)return null;
    return(
      <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,.88)",display:"flex",alignItems:"center",justifyContent:"center",padding:18}}>
        <div style={{background:"linear-gradient(160deg,rgba(14,9,2,.99),rgba(8,5,1,.99))",border:"1px solid rgba(253,230,138,.38)",borderRadius:14,padding:22,maxWidth:360,width:"100%",textAlign:"center",boxShadow:"0 0 46px rgba(253,230,138,.14)",animation:"lvlIn .5s ease"}}>
          <div style={{fontSize:36,marginBottom:6,animation:"lvlPulse 1s infinite"}}>⭐</div>
          <div style={{fontFamily:"'Cinzel Decorative',serif",fontSize:15,color:"#fde68a",letterSpacing:2,marginBottom:4}}>NIVEAU {stats.level} !</div>
          <div style={{fontSize:11,color:"#a87c4f",marginBottom:16,fontFamily:"'IM Fell English',serif",fontStyle:"italic"}}>Élysia grandit en puissance.</div>
          {!lvlMode&&<div style={{display:"flex",flexDirection:"column",gap:9}}>
            <button onClick={()=>setLvlMode("all")} style={{padding:"10px 16px",background:"linear-gradient(135deg,rgba(253,230,138,.13),rgba(200,160,40,.07))",border:"1px solid rgba(253,230,138,.32)",borderRadius:8,color:"#fde68a",cursor:"pointer",fontFamily:"'Cinzel',serif",fontSize:10,letterSpacing:1}} onMouseEnter={e=>e.currentTarget.style.background="rgba(253,230,138,.2)"} onMouseLeave={e=>e.currentTarget.style.background="linear-gradient(135deg,rgba(253,230,138,.13),rgba(200,160,40,.07))"}>✦ Améliorer toutes les stats (+2 chacune)</button>
            <button onClick={()=>setLvlMode("pick")} style={{padding:"10px 16px",background:"linear-gradient(135deg,rgba(192,132,252,.11),rgba(140,80,200,.06))",border:"1px solid rgba(192,132,252,.28)",borderRadius:8,color:"#d8b4fe",cursor:"pointer",fontFamily:"'Cinzel',serif",fontSize:10,letterSpacing:1}} onMouseEnter={e=>e.currentTarget.style.background="rgba(192,132,252,.18)"} onMouseLeave={e=>e.currentTarget.style.background="linear-gradient(135deg,rgba(192,132,252,.11),rgba(140,80,200,.06))"}>✦ Choisir une stat à spécialiser (+5)</button>
          </div>}
          {lvlMode==="pick"&&<div>
            <div style={{fontSize:9,color:"#8a6840",marginBottom:10,fontFamily:"'Cinzel',serif",letterSpacing:1}}>CHOISIR UNE STAT</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
              {SMETA.map(s=><button key={s.key} onClick={()=>doPick(s.key)} style={{padding:"9px 7px",background:`${s.color}12`,border:`1px solid ${s.color}38`,borderRadius:8,color:s.color,cursor:"pointer",fontFamily:"'Cinzel',serif",fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",gap:5,transition:"all .18s"}} onMouseEnter={e=>{e.currentTarget.style.background=`${s.color}22`;e.currentTarget.style.transform="scale(1.04)";}} onMouseLeave={e=>{e.currentTarget.style.background=`${s.color}12`;e.currentTarget.style.transform="scale(1)";}}>
                {s.icon} {s.label} <span style={{opacity:.55,fontSize:8}}>+5</span>
              </button>)}
            </div>
            <button onClick={()=>setLvlMode(null)} style={{marginTop:10,background:"none",border:"none",color:"#6b4f2a",cursor:"pointer",fontSize:10,fontFamily:"'IM Fell English',serif",fontStyle:"italic"}}>← Retour</button>
          </div>}
          {lvlMode==="all"&&<div>
            <div style={{fontSize:9,color:"#8a6840",marginBottom:9,fontFamily:"'Cinzel',serif",letterSpacing:1}}>GAINS</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:12}}>
              {[{icon:"❤️",label:"PV max",val:"+15"},{icon:"💧",label:"Mana",val:"+10"},...SMETA.map(s=>({icon:s.icon,label:s.label,val:"+2"}))].map((r,i)=><div key={i} style={{background:"rgba(253,230,138,.05)",border:"1px solid rgba(253,230,138,.13)",borderRadius:5,padding:"4px 7px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:10,color:"#a87c4f"}}>{r.icon} {r.label}</span><span style={{fontSize:10,color:"#fde68a",fontWeight:700}}>{r.val}</span></div>)}
            </div>
            <button onClick={doAll} style={{width:"100%",padding:"9px",background:"linear-gradient(135deg,rgba(253,230,138,.17),rgba(200,160,40,.09))",border:"1px solid rgba(253,230,138,.36)",borderRadius:8,color:"#fde68a",cursor:"pointer",fontFamily:"'Cinzel',serif",fontSize:10,letterSpacing:1}}>✦ Confirmer</button>
            <button onClick={()=>setLvlMode(null)} style={{marginTop:7,background:"none",border:"none",color:"#6b4f2a",cursor:"pointer",fontSize:9,fontFamily:"'IM Fell English',serif",fontStyle:"italic"}}>← Retour</button>
          </div>}
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════
  return(
    <div ref={rootRef} style={{minHeight:"100vh",maxHeight:"100vh",overflow:"hidden",background:"#0a0502",color:"#c8b08a",fontFamily:"'IM Fell English',Georgia,serif",display:"flex",flexDirection:"column",position:"relative",animation:shake?"shake .4s ease":"none"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@400;700&display=swap');
        @keyframes reveal   {from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shake    {0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
        @keyframes hitFx    {0%{opacity:.65}100%{opacity:0}}
        @keyframes lvlFx    {0%{opacity:0}20%{opacity:.75}80%{opacity:.45}100%{opacity:0}}
        @keyframes thFx     {0%{opacity:.45}100%{opacity:0}}
        @keyframes dreamS   {0%{filter:hue-rotate(0deg) saturate(1.6)}50%{filter:hue-rotate(180deg) saturate(2.8) brightness(1.1)}100%{filter:hue-rotate(360deg) saturate(1.6)}}
        @keyframes dreamText{0%,100%{color:#e0c0ff}33%{color:#c0f0ff}66%{color:#ffd0ff}}
        @keyframes pulse    {0%,100%{opacity:.3}50%{opacity:.75}}
        @keyframes candle   {0%,100%{box-shadow:0 0 12px rgba(255,140,0,.22)}40%{box-shadow:0 0 20px rgba(255,160,0,.36)}}
        @keyframes dot      {0%,80%,100%{opacity:.3;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}
        @keyframes dreamVig {0%,100%{opacity:.42}50%{opacity:.76}}
        @keyframes lvlIn    {from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
        @keyframes lvlPulse {0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
        @keyframes questIn  {from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:translateX(0)}}
        @keyframes saveIn   {from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:rgba(168,124,79,.16);border-radius:2px}
        textarea:focus{outline:none!important}
        .tbbar::-webkit-scrollbar{display:none}
      `}</style>

      {/* BG */}
      <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",background:dream?"radial-gradient(ellipse at 20% 30%,rgba(180,0,255,.22) 0%,transparent 50%),radial-gradient(ellipse at 80% 70%,rgba(0,200,255,.18) 0%,transparent 50%)":`radial-gradient(ellipse at 30% 20%,${T.bg1} 0%,transparent 60%),radial-gradient(ellipse at 70% 80%,${T.bg2} 0%,transparent 50%)`,transition:"background 2s ease",animation:dream?"dreamS 7s linear infinite":"none"}}/>
      <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",opacity:.03,backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"}}/>
      {dream   &&<div style={{position:"fixed",inset:0,zIndex:1,pointerEvents:"none",background:"radial-gradient(ellipse at 50% 50%,transparent 35%,rgba(120,0,200,.28) 100%)",animation:"dreamVig 3s ease-in-out infinite"}}/>}
      {hitFx   &&<div style={{position:"fixed",inset:0,zIndex:999,pointerEvents:"none",background:"radial-gradient(ellipse at center,rgba(220,0,0,.44) 0%,rgba(180,0,0,.14) 50%,transparent 80%)",animation:"hitFx .7s ease forwards"}}/>}
      {lvlFx   &&<div style={{position:"fixed",inset:0,zIndex:999,pointerEvents:"none",background:"radial-gradient(ellipse at center,rgba(255,215,0,.36) 0%,rgba(200,150,0,.12) 50%,transparent 75%)",animation:"lvlFx 1.8s ease forwards"}}/>}
      {thFx    &&<div style={{position:"fixed",inset:0,zIndex:2,pointerEvents:"none",background:`radial-gradient(ellipse at center,${T.accent}20 0%,transparent 70%)`,animation:"thFx 1.2s ease forwards"}}/>}

      <ItemModal/><NpcModal/><LvlModal/>

      {/* Save indicator */}
      {saveSt==="saving"&&<div style={{position:"fixed",bottom:68,left:12,zIndex:400,background:"rgba(8,4,1,.95)",border:"1px solid rgba(168,124,79,.44)",borderRadius:20,padding:"3px 10px",display:"flex",alignItems:"center",gap:5,animation:"saveIn .3s ease"}}><span style={{fontSize:10}}>💾</span><span style={{fontSize:9,color:"#a87c4f",fontFamily:"'Cinzel',serif",letterSpacing:1}}>Sauvegarde...</span></div>}
      {saveSt==="saved"&&<div style={{position:"fixed",bottom:68,left:12,zIndex:400,background:"rgba(8,4,1,.95)",border:"1px solid rgba(74,222,128,.44)",borderRadius:20,padding:"3px 10px",display:"flex",alignItems:"center",gap:5,animation:"saveIn .3s ease"}}><span style={{fontSize:10}}>✓</span><span style={{fontSize:9,color:"#4ade80",fontFamily:"'Cinzel',serif",letterSpacing:1}}>Sauvegardé</span></div>}
      {saveSt==="loaded"&&<div style={{position:"fixed",bottom:68,left:12,zIndex:400,background:"rgba(8,4,1,.95)",border:"1px solid rgba(96,165,250,.44)",borderRadius:20,padding:"3px 10px",display:"flex",alignItems:"center",gap:5,animation:"saveIn .3s ease"}}><span style={{fontSize:10}}>📂</span><span style={{fontSize:9,color:"#60a5fa",fontFamily:"'Cinzel',serif",letterSpacing:1}}>Partie chargée</span></div>}

      {/* Quest toast */}
      {qToast&&<div style={{position:"fixed",bottom:68,right:12,zIndex:500,background:"linear-gradient(135deg,rgba(14,9,2,.97),rgba(8,5,1,.99))",border:"1px solid rgba(212,168,67,.38)",borderRadius:10,padding:"11px 14px",maxWidth:240,boxShadow:"0 0 20px rgba(212,168,67,.16)",animation:"questIn .4s ease"}}><div style={{fontSize:8,color:"#a87c4f",letterSpacing:2,marginBottom:3,fontFamily:"'Cinzel',serif"}}>✦ QUÊTE ACCOMPLIE ✦</div><div style={{fontSize:11,color:"#e8c87a",fontFamily:"'Cinzel',serif",fontWeight:600,marginBottom:2}}>{qToast.title}</div><div style={{fontSize:11,color:"#fde68a"}}>+{qToast.xp} XP ⭐</div></div>}

      {/* HEADER */}
      <div style={{position:"relative",zIndex:20,flexShrink:0,background:"linear-gradient(180deg,rgba(8,4,1,.99),rgba(10,5,1,.97))",borderBottom:`1px solid ${T.hb}`,padding:"6px 11px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 13px rgba(0,0,0,.8)",transition:"border-color 1.8s"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:32,height:32,borderRadius:4,background:`${T.accent}16`,border:`1px solid ${T.accent}42`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,animation:"candle 3s ease-in-out infinite"}}>📖</div>
          <div><div style={{fontFamily:"'Cinzel Decorative',serif",fontSize:9,color:dream?"#c8a0ff":T.glow,letterSpacing:1.5,transition:"color 1.8s"}}>CHRONIQUES D'ARCANIS</div><div style={{fontSize:6,color:`${T.accent}77`,letterSpacing:2}}>{T.name.toUpperCase()} · RPG TEXTUEL</div></div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <div style={{textAlign:"center"}}><div style={{fontSize:6,color:`${T.accent}77`,letterSpacing:1}}>RANG</div><div style={{fontSize:13,fontWeight:900,color:rc,fontFamily:"'Cinzel',serif",textShadow:`0 0 8px ${rg}`}}>{stats.rank}</div></div>
          <div style={{width:1,height:22,background:`${T.accent}20`}}/>
          <div style={{textAlign:"center"}}><div style={{fontSize:6,color:`${T.accent}77`,letterSpacing:1}}>NIV</div><div style={{fontSize:13,fontWeight:700,color:"#c9a96e",fontFamily:"'Cinzel',serif"}}>{stats.level}</div></div>
          <div style={{width:1,height:22,background:`${T.accent}20`}}/>
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            {[{icon:"❤️",v:stats.hp,m:stats.hpMax,c:"#ef4444",g:"rgba(239,68,68,.5)"},{icon:"💧",v:stats.mana,m:stats.manaMax,c:"#60a5fa",g:"rgba(96,165,250,.5)"}].map((b,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:3}}><span style={{fontSize:8}}>{b.icon}</span><div style={{width:44}}><Bar value={b.v} max={b.m} color={b.c} glow={b.g}/></div><span style={{fontSize:7,color:b.c,minWidth:20,fontFamily:"'Cinzel',serif"}}>{b.v}</span></div>)}
          </div>
          <button onClick={resetGame} title="Nouvelle partie" style={{width:26,height:26,borderRadius:5,background:"rgba(239,68,68,.07)",border:"1px solid rgba(239,68,68,.2)",color:"rgba(239,68,68,.7)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,flexShrink:0}} onMouseEnter={e=>e.currentTarget.style.background="rgba(239,68,68,.18)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(239,68,68,.07)"}>🗑️</button>
          <button onClick={toggleFS} title={isFS?"Quitter":"Plein écran"} style={{width:26,height:26,borderRadius:5,background:`${T.accent}10`,border:`1px solid ${T.accent}28`,color:T.accent,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}} onMouseEnter={e=>e.currentTarget.style.background=`${T.accent}22`} onMouseLeave={e=>e.currentTarget.style.background=`${T.accent}10`}>{isFS?"⊠":"⊡"}</button>
        </div>
      </div>

      {/* TABS */}
      <div className="tbbar" style={{position:"relative",zIndex:20,flexShrink:0,height:36,display:"flex",overflowX:"auto",overflowY:"hidden",background:"rgba(8,4,1,.98)",borderBottom:`1px solid ${T.tb}`,WebkitOverflowScrolling:"touch",scrollbarWidth:"none",transition:"border-color 1.8s"}}>
        {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{flexShrink:0,height:"100%",padding:"0 10px",background:"none",border:"none",borderBottom:tab===t.id?`2px solid ${T.accent}`:"2px solid transparent",cursor:"pointer",color:tab===t.id?T.glow:"#4a3220",fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:.7,display:"flex",alignItems:"center",gap:4,transition:"color .2s,border-color 1.8s",whiteSpace:"nowrap"}}>
          <span style={{fontSize:11}}>{t.icon}</span><span>{t.label}</span>
          {t.id==="npcs"&&npcs.length>0&&<span style={{fontSize:7,background:`${T.accent}20`,border:`1px solid ${T.accent}30`,borderRadius:9,padding:"0 4px",color:T.accent}}>{npcs.length}</span>}
        </button>)}
      </div>

      {/* CONTENT */}
      <div style={{flex:1,overflow:"hidden",position:"relative",zIndex:5,display:"flex",flexDirection:"column",filter:dream?"saturate(1.4)":"none",transition:"filter 1.8s"}}>

        {tab==="game"&&<div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div ref={chatRef} style={{flex:1,overflowY:"auto",padding:"10px 10px 4px"}}>
            {msgs.length===0&&<div style={{textAlign:"center",padding:32,color:"#4a3520"}}><div style={{fontSize:28,marginBottom:10,animation:"pulse 2s infinite"}}>📜</div><div style={{fontFamily:"'Cinzel',serif",fontSize:10,letterSpacing:3}}>LE GRIMOIRE S'ÉVEILLE...</div></div>}
            {msgs.map(renderMsg)}
            {loading&&<div style={{marginBottom:10}}><div style={{display:"inline-flex",flexDirection:"column",gap:4,padding:"6px 11px",background:"rgba(12,6,2,.97)",border:`1px solid ${T.mb}`,borderRadius:"2px 8px 8px 8px",transition:"border-color 1.8s"}}><div style={{fontSize:7,color:`${T.accent}77`,letterSpacing:2,fontFamily:"'Cinzel',serif"}}>LE GRIMOIRE ÉCRIT...</div><div style={{display:"flex",gap:4}}>{[0,1,2,3].map(k=><div key={k} style={{width:4,height:4,borderRadius:"50%",background:T.accent,animation:`dot 1.4s ease-in-out infinite`,animationDelay:`${k*.2}s`}}/>)}</div></div></div>}
            <div ref={chatEnd}/>
          </div>
          <div style={{padding:"0 10px 6px"}}>
            <button onClick={handleContinue} disabled={loading} style={{width:"100%",padding:"6px",background:"rgba(168,124,79,0.05)",border:"1px dashed rgba(168,124,79,0.3)",borderRadius:6,color:loading?"#4a3820":"#c9b08a",cursor:loading?"not-allowed":"pointer",fontSize:10,fontWeight:"bold",fontFamily:"'Cinzel',serif",textTransform:"uppercase",transition:"all 0.2s",opacity:0.8}}>
              {loading ? "Le grimoire travaille..." : "✨ Continuer l'histoire"}
            </button>
          </div>
          <div style={{padding:"6px 10px",background:"rgba(8,4,1,.98)",borderTop:`1px solid ${T.tb}`,display:"flex",gap:6,alignItems:"flex-end",flexShrink:0,transition:"border-color 1.8s"}}>
            <div style={{flex:1,position:"relative"}}>
              <div style={{position:"absolute",top:-6,left:9,fontSize:7,color:`${T.accent}77`,letterSpacing:2,background:"rgba(8,4,1,.98)",padding:"0 3px",fontFamily:"'Cinzel',serif"}}>ACTION D'ÉLYSIA</div>
              <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Que fait Élysia ?" rows={2} style={{width:"100%",boxSizing:"border-box",background:"rgba(12,6,2,.9)",border:`1px solid ${T.accent}28`,borderRadius:6,padding:"7px 10px",color:dream?"#dcc0ff":"#d4b483",fontFamily:"'IM Fell English',serif",fontSize:13,resize:"none",lineHeight:1.5,fontStyle:"italic",transition:"border-color 1.8s",outline:"none"}}/>
            </div>
            <button onClick={send} disabled={loading||!input.trim()} style={{padding:"0 11px",height:43,flexShrink:0,background:loading?`${T.accent}08`:`linear-gradient(135deg,${T.accent}20,${T.accent}10)`,border:`1px solid ${loading?T.accent+"08":T.accent+"32"}`,borderRadius:6,color:loading?`${T.accent}44`:T.glow,cursor:loading?"not-allowed":"pointer",fontSize:15}}>⚡</button>
          </div>
        </div>}

        {tab==="stats"&&<div style={{padding:12,overflowY:"auto",flex:1}}>
          <div style={{maxWidth:420,margin:"0 auto"}}>
            <div style={{background:"linear-gradient(160deg,rgba(13,7,2,.95),rgba(8,4,1,.98))",border:`1px solid ${T.hb}`,borderRadius:8,padding:14,marginBottom:10,textAlign:"center",position:"relative",overflow:"hidden",transition:"border-color 1.8s"}}>
              {["tl","tr","bl","br"].map(p=><div key={p} style={{position:"absolute",[p[0]==="t"?"top":"bottom"]:5,[p[1]==="l"?"left":"right"]:5,fontSize:8,color:`${T.accent}26`}}>❧</div>)}
              <div style={{width:48,height:48,margin:"0 auto 8px",borderRadius:"50%",background:`radial-gradient(circle,${rc}16,transparent)`,border:`2px solid ${rc}`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 0 16px ${rg}44`,fontSize:17,fontFamily:"'Cinzel',serif",fontWeight:900,color:rc}}>{stats.rank}</div>
              <div style={{fontFamily:"'Cinzel Decorative',serif",fontSize:12,color:"#e8c87a",marginBottom:2}}>{stats.name}</div>
              <div style={{fontSize:7,color:`${T.accent}77`,letterSpacing:3}}>NIV {stats.level}</div>
              <Divider T={T}/>
              {[{label:"PV",icon:"❤️",v:stats.hp,m:stats.hpMax,c:"#ef4444",g:"rgba(239,68,68,.5)"},{label:"Mana",icon:"💧",v:stats.mana,m:stats.manaMax,c:"#60a5fa",g:"rgba(96,165,250,.5)"},{label:"XP",icon:"⭐",v:stats.xp,m:stats.xpMax,c:"#d4a843",g:"rgba(212,168,67,.5)"}].map(b=><div key={b.label} style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:8,color:`${T.accent}aa`}}>{b.icon} {b.label}</span><span style={{fontSize:8,color:b.c,fontFamily:"'Cinzel',serif"}}>{b.v}/{b.m}</span></div><Bar value={b.v} max={b.m} color={b.c} glow={b.g}/></div>)}
            </div>
            <div style={{background:"linear-gradient(160deg,rgba(13,7,2,.95),rgba(8,4,1,.98))",border:`1px solid ${T.hb}`,borderRadius:8,padding:11,transition:"border-color 1.8s"}}>
              <div style={{fontSize:7,color:`${T.accent}77`,letterSpacing:3,textAlign:"center",marginBottom:9,fontFamily:"'Cinzel',serif"}}>✦ ATTRIBUTS ✦</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{SMETA.map(s=><div key={s.key} style={{background:`${s.color}07`,border:`1px solid ${s.color}1e`,borderRadius:6,padding:"8px 6px",textAlign:"center"}}><div style={{fontSize:15,marginBottom:2}}>{s.icon}</div><div style={{fontSize:17,fontWeight:700,color:s.color,fontFamily:"'Cinzel',serif",lineHeight:1}}>{stats[s.key]}</div><div style={{fontSize:7,color:`${T.accent}66`,marginTop:2,letterSpacing:1}}>{s.label.toUpperCase()}</div></div>)}</div>
            </div>
          </div>
        </div>}

        {tab==="spells"&&<div style={{padding:12,overflowY:"auto",flex:1}}>
          <div style={{fontSize:7,color:`${T.accent}77`,letterSpacing:3,marginBottom:10,fontFamily:"'Cinzel',serif",textAlign:"center"}}>✦ GRIMOIRE DES SORTS ✦</div>
          {spells.length===0?<div style={{textAlign:"center",padding:30,border:`1px solid ${T.tb}`,borderRadius:8,color:"#4a3520"}}><div style={{fontSize:24,marginBottom:8,opacity:.27}}>🔮</div><div style={{fontSize:10,fontFamily:"'Cinzel',serif",letterSpacing:2}}>Aucun sort appris</div></div>
          :spells.map((sp,i)=>{const src=RC[sp.rank]||"#9ca3af";return <div key={i} style={{background:"linear-gradient(160deg,rgba(13,7,2,.96),rgba(8,4,1,.99))",border:`1px solid ${src}2e`,borderRadius:8,padding:"10px 12px",marginBottom:8,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:src,opacity:.38}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:14}}>🔮</span><div><div style={{fontSize:11,color:"#e8c87a",fontFamily:"'Cinzel',serif",fontWeight:600}}>{sp.name}</div><div style={{fontSize:7,color:src,letterSpacing:1,marginTop:1}}>RANG {sp.rank}</div></div></div>{sp.dmg&&sp.dmg!=="—"&&sp.dmg!=="0"&&<div style={{fontSize:9,color:"#fca5a5",background:"rgba(239,68,68,.07)",border:"1px solid rgba(239,68,68,.16)",borderRadius:20,padding:"2px 7px"}}>⚔️ {sp.dmg}</div>}</div>
            <div style={{display:"flex",gap:5,marginBottom:5,flexWrap:"wrap"}}>{sp.manaCost&&sp.manaCost!=="0"&&<span style={{display:"flex",alignItems:"center",gap:2,background:"rgba(96,165,250,.06)",border:"1px solid rgba(96,165,250,.15)",borderRadius:20,padding:"2px 6px",fontSize:9,color:"#93c5fd"}}>💧 {sp.manaCost} mana</span>}{sp.hpCost&&sp.hpCost!=="0"&&<span style={{display:"flex",alignItems:"center",gap:2,background:"rgba(239,68,68,.06)",border:"1px solid rgba(239,68,68,.15)",borderRadius:20,padding:"2px 6px",fontSize:9,color:"#fca5a5"}}>❤️ {sp.hpCost} PV</span>}</div>
            {sp.desc&&<div style={{fontSize:10,color:"#8a6840",lineHeight:1.6,fontFamily:"'IM Fell English',serif",fontStyle:"italic"}}>{sp.desc}</div>}
            <button onClick={() => handleCastSpell(sp)} disabled={loading || stats.mana < (parseInt(sp.manaCost) || 0)} style={{marginTop:8,width:"100%",padding:"5px",background:loading?"#1a1208":`linear-gradient(135deg,${src}20,${src}10)`,border:`1px solid ${src}44`,borderRadius:4,color:loading?`${src}44`:src,cursor:loading?"not-allowed":"pointer",fontSize:10,fontFamily:"'Cinzel',serif",fontWeight:600}}>LANCER LE SORT</button>
          </div>;})}
        </div>}

        {tab==="effects"&&<div style={{padding:12,overflowY:"auto",flex:1}}>
          <div style={{fontSize:7,color:`${T.accent}77`,letterSpacing:3,marginBottom:10,fontFamily:"'Cinzel',serif",textAlign:"center"}}>✦ ARCANES ACTIFS ✦</div>
          {eff.length===0?<div style={{textAlign:"center",padding:30,border:`1px solid ${T.tb}`,borderRadius:8,color:"#4a3520"}}><div style={{fontSize:22,marginBottom:7,opacity:.24}}>✨</div><div style={{fontSize:10,fontFamily:"'Cinzel',serif",letterSpacing:2}}>Aucune magie active</div></div>
          :eff.map((e,i)=><div key={i} style={{background:"linear-gradient(135deg,rgba(13,7,2,.94),rgba(8,4,1,.97))",border:`1px solid ${T.mb}`,borderRadius:8,padding:"9px 12px",marginBottom:7,display:"flex",alignItems:"center",gap:9,transition:"border-color 1.8s"}}><div style={{fontSize:17}}>{/poison/i.test(e)?"☠️":/béni/i.test(e)?"✨":/force/i.test(e)?"⚔️":/rêve|onir/i.test(e)?"🌙":"🌀"}</div><div style={{fontSize:11,color:"#d4b483",fontFamily:"'Cinzel',serif"}}>{e}</div></div>)}
        </div>}

        {tab==="inventory"&&<div style={{padding:12,overflowY:"auto",flex:1}}>
          <div style={{fontSize:7,color:`${T.accent}77`,letterSpacing:3,marginBottom:10,fontFamily:"'Cinzel',serif",textAlign:"center"}}>✦ BESACE D'ÉLYSIA ({inv.length}) ✦</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
            {inv.map((item,i)=>{
              const safeStats=(item.stats&&typeof item.stats==="object"&&!Array.isArray(item.stats))?item.stats:{};
              const irc=RC[item.rarity]||"#9ca3af", se=Object.entries(safeStats).slice(0,3);
              return <div key={i} onClick={()=>setSelItem({...item,stats:safeStats})} style={{background:"linear-gradient(160deg,rgba(13,7,2,.96),rgba(8,4,1,.99))",border:`1px solid ${irc}2e`,borderRadius:7,padding:"10px",position:"relative",overflow:"hidden",cursor:"pointer",transition:"all .18s"}} onMouseEnter={e=>{e.currentTarget.style.background=`linear-gradient(160deg,${irc}0d,rgba(8,4,1,.99))`;e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow=`0 4px 14px ${irc}20`;}} onMouseLeave={e=>{e.currentTarget.style.background="linear-gradient(160deg,rgba(13,7,2,.96),rgba(8,4,1,.99))";e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:3}}><div style={{fontSize:7,color:irc,letterSpacing:1,fontFamily:"'Cinzel',serif"}}>{item.rarity}</div><span style={{fontSize:12}}>{ITYPE[item.type]||"📦"}</span></div>
                <div style={{fontSize:11,color:"#e8c87a",fontFamily:"'Cinzel',serif",marginBottom:3,fontWeight:600,lineHeight:1.2}}>{item.name}</div>
                <div style={{fontSize:9,color:"#7a5838",lineHeight:1.4,fontFamily:"'IM Fell English',serif",fontStyle:"italic",marginBottom:5}}>{item.desc}</div>
                {se.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:2}}>{se.map(([k,v])=>{const c=ISCOLOR[k]||"#9ca3af";return <span key={k} style={{fontSize:7,color:c,background:`${c}14`,border:`1px solid ${c}28`,borderRadius:12,padding:"1px 5px",fontFamily:"'Cinzel',serif"}}>{k} {v}</span>;})}{Object.keys(safeStats).length>3&&<span style={{fontSize:7,color:"#6b4f2a"}}>+{Object.keys(safeStats).length-3}</span>}</div>}
                <div style={{position:"absolute",top:0,right:0,width:2,height:"100%",background:irc,opacity:.28}}/>
                <div style={{position:"absolute",bottom:3,right:6,fontSize:7,color:`${T.accent}40`,fontFamily:"'Cinzel',serif"}}>détails →</div>
              </div>;
            })}
          </div>
        </div>}

        {tab==="weapon"&&<div style={{padding:12,overflowY:"auto",flex:1}}>
          <div style={{fontSize:7,color:`${T.accent}77`,letterSpacing:3,marginBottom:12,fontFamily:"'Cinzel',serif",textAlign:"center"}}>✦ ARME LIÉE D'ÉLYSIA ✦</div>
          {!weapon.awakened
            ? <div style={{textAlign:"center",padding:36,border:`1px solid ${T.tb}`,borderRadius:10,color:"#4a3520"}}>
                <div style={{fontSize:36,marginBottom:10,opacity:.3,animation:"pulse 2s infinite"}}>🗡️</div>
                <div style={{fontSize:11,fontFamily:"'Cinzel',serif",letterSpacing:2,marginBottom:6}}>L'ARME DORT</div>
                <div style={{fontSize:9,color:"#3a2510",fontFamily:"'IM Fell English',serif",fontStyle:"italic"}}>Son éveil attend le moment choisi...</div>
              </div>
            : <div style={{maxWidth:420,margin:"0 auto"}}>
                {/* Header arme */}
                <div style={{background:"linear-gradient(160deg,rgba(13,7,2,.97),rgba(8,4,1,.99))",border:`1px solid ${RC[weapon.rank]||"#9ca3af"}44`,borderRadius:10,padding:16,marginBottom:10,textAlign:"center",position:"relative",overflow:"hidden",boxShadow:`0 0 28px ${RC[weapon.rank]||"#9ca3af"}11`}}>
                  <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse at 50% 0%,${RC[weapon.rank]||"#9ca3af"}08,transparent 60%)`,pointerEvents:"none"}}/>
                  <div style={{fontSize:32,marginBottom:6,animation:"candle 3s ease-in-out infinite"}}>🗡️</div>
                  <div style={{fontFamily:"'Cinzel Decorative',serif",fontSize:14,color:RC[weapon.rank]||"#9ca3af",letterSpacing:2,marginBottom:3,textShadow:`0 0 12px ${RC[weapon.rank]||"#9ca3af"}66`}}>{weapon.name}</div>
                  <div style={{display:"flex",justifyContent:"center",gap:8,flexWrap:"wrap",marginBottom:8}}>
                    <span style={{fontSize:8,color:RC[weapon.rank]||"#9ca3af",background:`${RC[weapon.rank]||"#9ca3af"}18`,border:`1px solid ${RC[weapon.rank]||"#9ca3af"}33`,borderRadius:20,padding:"2px 9px",fontFamily:"'Cinzel',serif"}}>RANG {weapon.rank}</span>
                    {weapon.element&&<span style={{fontSize:8,color:"#c084fc",background:"rgba(192,132,252,.1)",border:"1px solid rgba(192,132,252,.25)",borderRadius:20,padding:"2px 9px",fontFamily:"'Cinzel',serif"}}>{weapon.element.toUpperCase()}</span>}
                  </div>
                  {/* Bond bar */}
                  <div style={{marginBottom:4}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:7,color:`${T.accent}88`,fontFamily:"'Cinzel',serif",letterSpacing:1}}>LIEN</span><span style={{fontSize:7,color:"#e8c87a",fontFamily:"'Cinzel',serif"}}>{weapon.bond}/100</span></div>
                    <div style={{height:4,background:"rgba(0,0,0,.5)",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${weapon.bond}%`,background:"linear-gradient(90deg,#c084fc55,#e879f9)",borderRadius:3,transition:"width 1s ease",boxShadow:"0 0 6px #e879f944"}}/></div>
                  </div>
                </div>
                {/* Personnalité */}
                {(weapon.personality||weapon.voice)&&<div style={{background:"rgba(13,7,2,.96)",border:`1px solid rgba(192,132,252,.2)`,borderRadius:8,padding:"11px 13px",marginBottom:9}}>
                  {weapon.personality&&<div style={{marginBottom:weapon.voice?7:0}}><div style={{fontSize:7,color:"#a78bfa",letterSpacing:2,marginBottom:3,fontFamily:"'Cinzel',serif"}}>✦ PERSONNALITÉ</div><div style={{fontSize:11,color:"#c8b0f0",fontFamily:"'IM Fell English',serif",fontStyle:"italic"}}>{weapon.personality}</div></div>}
                  {weapon.voice&&<div><div style={{fontSize:7,color:"#a78bfa",letterSpacing:2,marginBottom:3,fontFamily:"'Cinzel',serif"}}>✦ VOIX</div><div style={{fontSize:11,color:"#c8b0f0",fontFamily:"'IM Fell English',serif",fontStyle:"italic"}}>{weapon.voice}</div></div>}
                </div>}
                {/* Forme */}
                {weapon.form&&<div style={{background:"rgba(13,7,2,.96)",border:`1px solid rgba(168,124,79,.18)`,borderRadius:8,padding:"11px 13px",marginBottom:9}}>
                  <div style={{fontSize:7,color:`${T.accent}88`,letterSpacing:2,marginBottom:3,fontFamily:"'Cinzel',serif"}}>✦ FORME</div>
                  <div style={{fontSize:11,color:"#c8b08a",fontFamily:"'IM Fell English',serif",fontStyle:"italic",lineHeight:1.7}}>{weapon.form}</div>
                </div>}
                {/* Secret */}
                {weapon.secret&&weapon.secret!=="inconnu"&&weapon.secret!=="Inconnu"&&<div style={{background:"rgba(124,58,237,.07)",border:"1px solid rgba(124,58,237,.22)",borderRadius:8,padding:"11px 13px",marginBottom:9}}>
                  <div style={{fontSize:7,color:"#a78bfa",letterSpacing:2,marginBottom:3,fontFamily:"'Cinzel',serif"}}>🔮 SECRET</div>
                  <div style={{fontSize:11,color:"#c4a8f0",fontFamily:"'IM Fell English',serif",fontStyle:"italic",lineHeight:1.7}}>{weapon.secret}</div>
                </div>}
                {/* Historique */}
                {weapon.history?.length>0&&<div style={{background:"rgba(13,7,2,.96)",border:`1px solid rgba(168,124,79,.15)`,borderRadius:8,padding:"11px 13px"}}>
                  <div style={{fontSize:7,color:`${T.accent}88`,letterSpacing:2,marginBottom:7,fontFamily:"'Cinzel',serif"}}>📜 MÉMOIRE DE L'ARME</div>
                  {weapon.history.map((h,i)=><div key={i} style={{display:"flex",gap:7,marginBottom:5,alignItems:"flex-start"}}>
                    <div style={{width:5,height:5,borderRadius:"50%",background:"#c084fc",flexShrink:0,marginTop:5,opacity:.6}}/>
                    <div style={{fontSize:10,color:"#9a7870",fontFamily:"'IM Fell English',serif",fontStyle:"italic",lineHeight:1.5}}>{h}</div>
                  </div>)}
                </div>}
              </div>}
        </div>}

        {tab==="map"&&<div style={{padding:12,overflowY:"auto",flex:1}}>
          <div style={{fontSize:7,color:`${T.accent}77`,letterSpacing:3,marginBottom:12,fontFamily:"'Cinzel',serif",textAlign:"center"}}>✦ LIEUX DÉCOUVERTS ✦</div>
          {locations.length===0
            ? <div style={{textAlign:"center",padding:36,border:`1px solid ${T.tb}`,borderRadius:10,color:"#4a3520"}}>
                <div style={{fontSize:30,marginBottom:10,opacity:.28}}>🗺️</div>
                <div style={{fontSize:10,fontFamily:"'Cinzel',serif",letterSpacing:2}}>Le monde s'étend, inexploré...</div>
              </div>
            : <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {locations.map((loc,i)=>{
                  const sColor={sûr:"#4ade80",mystérieux:"#c084fc",dangereux:"#f87171",interdit:"#fb923c",neutre:"#9ca3af"}[loc.statut]||"#9ca3af";
                  return <div key={i} style={{background:"linear-gradient(160deg,rgba(13,7,2,.96),rgba(8,4,1,.99))",border:`1px solid ${sColor}28`,borderRadius:8,padding:"11px 12px",position:"relative",overflow:"hidden"}}>
                    <div style={{position:"absolute",top:0,left:0,width:"100%",height:2,background:`linear-gradient(90deg,${sColor}44,transparent)`}}/>
                    <div style={{fontSize:22,marginBottom:5,textAlign:"center"}}>{loc.icon}</div>
                    <div style={{fontSize:10,color:"#e8c87a",fontFamily:"'Cinzel',serif",fontWeight:600,textAlign:"center",marginBottom:3}}>{loc.name}</div>
                    <div style={{fontSize:7,color:sColor,background:`${sColor}14`,border:`1px solid ${sColor}28`,borderRadius:20,padding:"1px 7px",textAlign:"center",fontFamily:"'Cinzel',serif",marginBottom:5,display:"inline-block",width:"100%",boxSizing:"border-box"}}>{loc.statut.toUpperCase()}</div>
                    {loc.ambiance&&<div style={{fontSize:9,color:"#8a6840",lineHeight:1.5,fontFamily:"'IM Fell English',serif",fontStyle:"italic",textAlign:"center"}}>{loc.ambiance}</div>}
                  </div>;
                })}
              </div>}
        </div>}

        {tab==="reputation"&&<div style={{padding:12,overflowY:"auto",flex:1}}>
          <div style={{fontSize:7,color:`${T.accent}77`,letterSpacing:3,marginBottom:12,fontFamily:"'Cinzel',serif",textAlign:"center"}}>✦ RÉPUTATION D'ÉLYSIA ✦</div>
          <div style={{maxWidth:420,margin:"0 auto",display:"flex",flexDirection:"column",gap:8}}>
            {factions.map((f,i)=>{
              const sc=f.score||0;
              const fColor=sc>50?"#4ade80":sc>20?"#86efac":sc>0?"#d4c4a0":sc>-20?"#fbbf24":sc>-50?"#fb923c":"#f87171";
              const fLabel=sc>60?"Vénérée":sc>30?"Respectée":sc>10?"Appréciée":sc>-10?"Inconnue":sc>-30?"Méfiante":sc>-60?"Hostile":"Ennemie";
              const pct=Math.round((sc+100)/200*100);
              return <div key={f.id} style={{background:"linear-gradient(160deg,rgba(13,7,2,.96),rgba(8,4,1,.99))",border:`1px solid rgba(168,124,79,.18)`,borderRadius:9,padding:"12px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:16}}>{f.icon}</span>
                    <div>
                      <div style={{fontSize:10,color:"#e8c87a",fontFamily:"'Cinzel',serif",fontWeight:600}}>{f.name}</div>
                      <div style={{fontSize:8,color:"#6a5030",fontFamily:"'IM Fell English',serif",fontStyle:"italic"}}>{f.desc}</div>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:9,color:fColor,fontFamily:"'Cinzel',serif",fontWeight:700}}>{fLabel}</div>
                    <div style={{fontSize:7,color:`${fColor}88`}}>{sc>0?"+":""}{sc}</div>
                  </div>
                </div>
                <div style={{height:5,background:"rgba(0,0,0,.5)",borderRadius:3,overflow:"hidden",position:"relative"}}>
                  <div style={{position:"absolute",left:"50%",top:0,width:1,height:"100%",background:"rgba(255,255,255,.1)"}}/>
                  <div style={{height:"100%",width:`${pct}%`,borderRadius:3,background:`linear-gradient(90deg,${fColor}55,${fColor})`,transition:"width 1s ease"}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}>
                  <span style={{fontSize:6,color:"#4a3520"}}>Ennemie</span>
                  <span style={{fontSize:6,color:"#4a3520"}}>Vénérée</span>
                </div>
              </div>;
            })}
          </div>
        </div>}

                {tab==="quests"&&<div style={{padding:12,overflowY:"auto",flex:1}}>
          <div style={{fontSize:7,color:`${T.accent}77`,letterSpacing:3,marginBottom:10,fontFamily:"'Cinzel',serif",textAlign:"center"}}>✦ QUÊTES EN COURS ✦</div>
          {quests.map((q,i)=><div key={i} style={{background:"linear-gradient(160deg,rgba(13,7,2,.94),rgba(8,4,1,.97))",border:`1px solid ${T.mb}`,borderRadius:8,padding:"10px 12px",marginBottom:8,transition:"border-color 1.8s"}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:6}}><span style={{fontSize:12}}>📜</span><div><div style={{fontSize:11,color:"#e8c87a",fontFamily:"'Cinzel',serif",fontWeight:600}}>{q.title}</div>{q.progress&&<div style={{fontSize:8,color:T.accent,marginTop:1,fontFamily:"'IM Fell English',serif",fontStyle:"italic"}}>{q.progress}</div>}</div></div>
            <div style={{height:1,background:`linear-gradient(90deg,${T.accent}25,transparent)`}}/>
            <div style={{marginTop:4,display:"flex",alignItems:"center",gap:4}}><div style={{width:5,height:5,borderRadius:"50%",background:T.accent,animation:"pulse 2s infinite"}}/><span style={{fontSize:7,color:`${T.accent}77`,fontFamily:"'Cinzel',serif",letterSpacing:1}}>EN COURS</span></div>
          </div>)}
        </div>}

        {tab==="codex"&&<div style={{padding:12,overflowY:"auto",flex:1}}>
          <div style={{fontSize:7,color:`${T.accent}77`,letterSpacing:3,marginBottom:10,fontFamily:"'Cinzel',serif",textAlign:"center"}}>✦ CODEX ✦</div>
          {[{title:"Élysia",icon:"👤",type:"Protagoniste",desc:"Cheveux roses, yeux bleu cristallin. Deux essences coexistent en elle."},{title:"Académie d'Arcanis",icon:"🏰",type:"Lieu",desc:"École de magie prestigieuse aux bibliothèques interdites et secrets inavouables."},{title:"Rituel d'Éveil",icon:"⚡",type:"Événement",desc:"Cérémonie initiatique — l'Arme Liée d'Élysia reste inconnue..."},{title:"Arme Liée",icon:"⚔️",type:"Concept",desc:"Arme spirituelle personnelle, rang F à DIVIN, peut avoir une conscience."}].map((e,i)=><div key={i} style={{background:"linear-gradient(160deg,rgba(13,7,2,.94),rgba(8,4,1,.97))",border:`1px solid ${T.tb}`,borderRadius:8,padding:"10px 12px",marginBottom:8,transition:"border-color 1.8s"}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><span style={{fontSize:13}}>{e.icon}</span><div><div style={{fontSize:11,fontFamily:"'Cinzel',serif",color:"#e8c87a",fontWeight:600}}>{e.title}</div><div style={{fontSize:7,color:`${T.accent}66`,letterSpacing:2}}>{e.type.toUpperCase()}</div></div></div><div style={{fontSize:10,color:"#8a6840",lineHeight:1.7,fontFamily:"'IM Fell English',serif",fontStyle:"italic"}}>{e.desc}</div></div>)}
        </div>}

        {tab==="npcs"&&<div style={{padding:12,overflowY:"auto",flex:1}}>
          <div style={{fontSize:7,color:`${T.accent}77`,letterSpacing:3,marginBottom:10,fontFamily:"'Cinzel',serif",textAlign:"center"}}>✦ PERSONNAGES RENCONTRÉS ✦</div>
          {npcs.length===0?<div style={{textAlign:"center",padding:30,border:`1px solid ${T.tb}`,borderRadius:8,color:"#4a3520"}}><div style={{fontSize:24,marginBottom:7,opacity:.24}}>👥</div><div style={{fontSize:10,fontFamily:"'Cinzel',serif",letterSpacing:2}}>Aucun personnage rencontré</div></div>
          :npcs.map((npc,i)=>{
            const pal=NPAL[(npcCols[npc.name]??i)%NPAL.length], relC=RELCOLOR[npc.relation]||"#9ca3af";
            return <div key={i} onClick={()=>setSelNpc(npc)} style={{background:"linear-gradient(160deg,rgba(13,7,2,.95),rgba(8,4,1,.98))",border:`1px solid ${pal.border}`,borderRadius:8,padding:"11px 12px",marginBottom:8,cursor:"pointer",transition:"all .18s"}} onMouseEnter={e=>{e.currentTarget.style.background=`linear-gradient(160deg,${pal.bg},rgba(8,4,1,.98))`;e.currentTarget.style.transform="translateX(2px)";}} onMouseLeave={e=>{e.currentTarget.style.background="linear-gradient(160deg,rgba(13,7,2,.95),rgba(8,4,1,.98))";e.currentTarget.style.transform="translateX(0)";}}>
              <div style={{display:"flex",alignItems:"center",gap:9}}>
                <div style={{position:"relative"}}>
                  <div style={{width:38,height:38,borderRadius:"50%",background:pal.bubble,border:`2px solid ${pal.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,color:pal.name,fontFamily:"'Cinzel',serif",fontWeight:700,flexShrink:0}}>{npc.name.charAt(0)}</div>
                  {npc.affinity!==undefined&&<div style={{position:"absolute",bottom:-2,right:-2,fontSize:10,lineHeight:1}}>{(npc.affinity||0)>60?"🔥":(npc.affinity||0)>20?"💛":(npc.affinity||0)>-20?"😐":(npc.affinity||0)>-60?"❄️":"💀"}</div>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,color:"#e8c87a",fontFamily:"'Cinzel',serif",fontWeight:600}}>{npc.name}</div>
                  {npc.title&&<div style={{fontSize:7,color:"#8a6840",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{npc.title}</div>}
                  {npc.mood&&<div style={{fontSize:8,color:"#9a7060",fontStyle:"italic",marginTop:2,fontFamily:"'IM Fell English',serif"}}>{npc.mood}</div>}
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
                  {npc.rank&&npc.rank!=="?"&&<span style={{fontSize:7,color:RC[npc.rank]||"#9ca3af",fontFamily:"'Cinzel',serif"}}>Rang {npc.rank}</span>}
                  <span style={{fontSize:10,color:relC}}>{RELICON[npc.relation]||"⚪"}</span>
                </div>
              </div>
              {npc.opinion&&<div style={{fontSize:8,color:"#7a5838",lineHeight:1.5,fontFamily:"'IM Fell English',serif",fontStyle:"italic",marginTop:6,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>« {npc.opinion} »</div>}
            </div>;
          })}
        </div>}

      </div>
    </div>
  );
}
