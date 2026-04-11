import { useState, useRef, useEffect } from "react";

const PROXY_URL = import.meta.env.VITE_PROXY_URL;

const SYSTEM_PROMPT = `Du er en tålmodig fransktutor for en norsk nybegynner (A1/A2) med dysleksi. Eleven har to bøker: en roman av Houellebecq og en bok om kulturlivet i Paris på 1920-tallet.

KOMMUNIKASJON:
- Norsk som hovedspråk — innfør gradvis mer fransk i takt med elevens fremgang
- Aldri mer fransk enn eleven mestrer
- Forklar grammatikk gjennom eksempler, aldri lange regelforklaringer
- Korte avsnitt og tydelig struktur
- Kort, oppmuntrende tilbakemelding — ikke overdrevet

UTTALE:
- Skriv alltid fonetisk uttale på norsk i parentes etter nye ord: bonjour (bånsjur)
- Minn jevnlig eleven på å si ordene høyt

PROGRESJON:
- Bygg alltid videre på det eleven kan fra før
- Gjenta og test tidligere lært stoff jevnlig
- Bruk ord og temaer fra Houellebecq og Paris på 1920-tallet aktivt
- Målet er at eleven skal kunne lese disse bøkene på egenhånd

MUNTLIG: Gi én kort norsk setning eleven skal oversette til fransk. Ved riktig svar: ✓ LÆRT: [fr] = [no] ([uttale]) — gi neste setning. Ved feil: ✗ FEIL: [riktig versjon med fonetikk] — vent på nytt forsøk, ikke gå videre.
GRAMMATIKK: Undervis progressiv fransk grammatikk én regel om gangen. Rekkefølge: 1) être (jeg er/du er/han er…) 2) avoir (jeg har…) 3) Kjønn — le/la/un/une 4) Enkle setninger med adjektiv 5) -er verb 6) Negasjon ne…pas 7) Spørsmål 8) Passé composé 9) Adjektivbøying 10) Futur proche. For hvert emne: forklar regelen kort på norsk → vis eksempler med fonetikk → gi én konkret øvingsoppgave → vent på svar → gi tilbakemelding. Bruk ordbanken aktivt — bygg eksempler rundt ord eleven allerede kan. Merk lærte strukturer med ✓ LÆRT: [struktur] = [forklaring]. Avslutt alltid med FORSLAG: [svar1] | [svar2] | [svar3].
TEKSTHJELP: Eleven limer inn tekst på fransk — alt fra én setning til en hel artikkel. Bruk skjønn: Er det én setning eller et par ord, bryt ned ord for ord med oversettelse og enkel grammatikk. Er det en lengre tekst: gi norsk sammendrag (2-3 setninger), oversett avsnitt for avsnitt, plukk ut 2-3 grammatiske mønstre. Avslutt alltid med FORSLAG: [svar1] | [svar2] | [svar3].
FRI: Svar fritt på spørsmål om fransk. Kan også spille franskmannen Pierre hvis eleven vil — start da på norsk og innfør gradvis mer fransk, bruk *kursiv* for handlinger. Avslutt gjerne med FORSLAG: [svar1] | [svar2] | [svar3].`;

const BOOK_EXCERPTS = [
  { book: "Houellebecq", hint: "Om en enkel dag", text: "Il faisait beau, le ciel était bleu." },
  { book: "Houellebecq", hint: "En filosofisk observasjon", text: "La vie est simple quand on ne pense pas trop." },
  { book: "Paris 1920", hint: "Kunstnernes møtesteder", text: "Les artistes se retrouvaient dans les cafés de Montparnasse." },
  { book: "Paris 1920", hint: "Paris som kunstnerby", text: "Paris était la capitale du monde de l'art dans les années vingt." },
  { book: "Paris 1920", hint: "Jazzens ankomst", text: "Le jazz américain est arrivé à Paris après la guerre." },
];

const VOCAB_LIST = [
  // Hilsener og grunnleggende
  { fr: "bonjour", no: "hallo / god dag", phonetic: "bånsjur" },
  { fr: "bonsoir", no: "god kveld", phonetic: "bånswår" },
  { fr: "au revoir", no: "ha det bra", phonetic: "o rəvwår" },
  { fr: "merci", no: "takk", phonetic: "merssi" },
  { fr: "s'il vous plaît", no: "vær så snill", phonetic: "sil vu plæ" },
  { fr: "oui", no: "ja", phonetic: "wi" },
  { fr: "non", no: "nei", phonetic: "nån" },
  { fr: "pardon", no: "unnskyld", phonetic: "pardån" },
  { fr: "de rien", no: "ingen årsak", phonetic: "də rjæn" },
  // Pronomen
  { fr: "je", no: "jeg", phonetic: "sjø" },
  { fr: "tu", no: "du", phonetic: "ty" },
  { fr: "il", no: "han", phonetic: "il" },
  { fr: "elle", no: "hun", phonetic: "æl" },
  { fr: "nous", no: "vi", phonetic: "nu" },
  { fr: "vous", no: "dere / De", phonetic: "vu" },
  // Vanlige verb
  { fr: "être", no: "å være", phonetic: "ætr" },
  { fr: "avoir", no: "å ha", phonetic: "avwår" },
  { fr: "aller", no: "å gå / dra", phonetic: "alæ" },
  { fr: "venir", no: "å komme", phonetic: "vənir" },
  { fr: "voir", no: "å se", phonetic: "vwår" },
  { fr: "parler", no: "å snakke", phonetic: "parlæ" },
  { fr: "manger", no: "å spise", phonetic: "månsjæ" },
  { fr: "boire", no: "å drikke", phonetic: "bwår" },
  { fr: "lire", no: "å lese", phonetic: "lir" },
  { fr: "écrire", no: "å skrive", phonetic: "ekrir" },
  { fr: "aimer", no: "å like / elske", phonetic: "emæ" },
  { fr: "savoir", no: "å vite", phonetic: "savwår" },
  { fr: "faire", no: "å gjøre / lage", phonetic: "fær" },
  { fr: "habiter", no: "å bo", phonetic: "abitæ" },
  // Steder – Paris
  { fr: "Paris", no: "Paris", phonetic: "pari" },
  { fr: "café", no: "kafé", phonetic: "kafæ" },
  { fr: "rue", no: "gate", phonetic: "ry" },
  { fr: "ville", no: "by", phonetic: "vil" },
  { fr: "quartier", no: "bydel / nabolag", phonetic: "kartjæ" },
  { fr: "musée", no: "museum", phonetic: "myzæ" },
  { fr: "gare", no: "togstasjon", phonetic: "går" },
  { fr: "hôtel", no: "hotell", phonetic: "otæl" },
  { fr: "restaurant", no: "restaurant", phonetic: "rEstorån" },
  { fr: "bibliothèque", no: "bibliotek", phonetic: "biblijotæk" },
  { fr: "la Seine", no: "Seinen (elven)", phonetic: "la sæn" },
  // Tid
  { fr: "aujourd'hui", no: "i dag", phonetic: "osjurdwi" },
  { fr: "demain", no: "i morgen", phonetic: "dəmæn" },
  { fr: "hier", no: "i går", phonetic: "jær" },
  { fr: "maintenant", no: "nå", phonetic: "mæntnå" },
  { fr: "toujours", no: "alltid", phonetic: "tusjur" },
  { fr: "jamais", no: "aldri", phonetic: "sjamæ" },
  { fr: "souvent", no: "ofte", phonetic: "suvån" },
  // Adjektiver
  { fr: "beau / belle", no: "vakker", phonetic: "bo / bæl" },
  { fr: "grand / grande", no: "stor", phonetic: "grå / grågd" },
  { fr: "petit / petite", no: "liten", phonetic: "pəti / pətit" },
  { fr: "bon / bonne", no: "god / bra", phonetic: "bån / bOn" },
  { fr: "nouveau / nouvelle", no: "ny", phonetic: "nuvo / nuvæl" },
  { fr: "vieux / vieille", no: "gammel", phonetic: "vjø / vjæj" },
  { fr: "simple", no: "enkel", phonetic: "sæmpl" },
  // Kunst og kultur (1920-tallet)
  { fr: "artiste", no: "kunstner", phonetic: "artist" },
  { fr: "peintre", no: "maler", phonetic: "pæntr" },
  { fr: "écrivain", no: "forfatter", phonetic: "ekriven" },
  { fr: "roman", no: "roman", phonetic: "romån" },
  { fr: "livre", no: "bok", phonetic: "livr" },
  { fr: "tableau", no: "maleri", phonetic: "tablo" },
  { fr: "jazz", no: "jazz", phonetic: "dsjaz" },
  { fr: "musique", no: "musikk", phonetic: "myzik" },
  { fr: "guerre", no: "krig", phonetic: "gær" },
  { fr: "étranger", no: "utlending / fremmed", phonetic: "etrånsjæ" },
  { fr: "époque", no: "epoke / tid", phonetic: "epok" },
  // Mat og drikke
  { fr: "pain", no: "brød", phonetic: "pæn" },
  { fr: "vin", no: "vin", phonetic: "væn" },
  { fr: "eau", no: "vann", phonetic: "o" },
  { fr: "fromage", no: "ost", phonetic: "fromåsj" },
  { fr: "bière", no: "øl", phonetic: "bjær" },
  // Verden og natur
  { fr: "soleil", no: "sol", phonetic: "solæj" },
  { fr: "ciel", no: "himmel / sky", phonetic: "sjæl" },
  { fr: "vie", no: "liv", phonetic: "vi" },
  { fr: "monde", no: "verden", phonetic: "månd" },
  { fr: "homme", no: "mann / menneske", phonetic: "Om" },
  { fr: "femme", no: "kvinne", phonetic: "fam" },
  { fr: "ami / amie", no: "venn / venninne", phonetic: "ami" },
  { fr: "temps", no: "tid / vær", phonetic: "tå" },
  { fr: "année", no: "år", phonetic: "anæ" },
];

function normalizeAnswer(s) {
  return s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
}
// Strip leading particles/articles so "komme" matches "å komme", "venn" matches "en venn"
function stripParticles(s) {
  return s.replace(/^(a |le |la |les |l |un |une |en |et |de |du |des )/i, "").trim();
}
function levenshtein(a, b) {
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  return dp[a.length][b.length];
}
// Generate 4 answer options: 1 correct + 3 distractors from word bank
function getQuizOptions(card, bank = []) {
  const correct = card.no.split(/\s*\/\s*/)[0];
  const pool = bank
    .filter(v => v.no !== card.no && v.fr !== card.fr)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(w => w.no.split(/\s*\/\s*/)[0]);
  return [...pool, correct].sort(() => Math.random() - 0.5);
}

// Returns "correct" | "close" | "wrong"
function checkQuizAnswer(input, card, reverse = false) {
  const inp = normalizeAnswer(input);
  const field = reverse ? card.fr : card.no;
  const variants = field.split(/\s*\/\s*/).map(normalizeAnswer);
  if (variants.some(v => v === inp)) return "correct";
  // Also try with leading particles stripped (handles "komme" → "å komme")
  const inpStripped = stripParticles(inp);
  if (inpStripped.length > 1 && variants.some(v => stripParticles(v) === inpStripped)) return "correct";
  // Levenshtein — try both with and without particles, take minimum distance
  const minDist = Math.min(...variants.map(v =>
    Math.min(levenshtein(inp, v), levenshtein(inpStripped, stripParticles(v)))
  ));
  const maxLen = Math.max(...variants.map(v => v.length));
  const threshold = Math.max(2, Math.floor(maxLen / 4));
  return minDist <= threshold ? "close" : "wrong";
}

const EXIT_PHRASES = [
  "Er du sikker på at du vil avslutte?",
  "Êtes-vous sûr de vouloir quitter?",
  "Allerede ferdig for i dag?",
  "Déjà fini pour aujourd'hui?",
  "Vil du virkelig forlate Pierre?",
  "Vous voulez vraiment quitter Pierre?",
  "Vi savner deg allerede!",
  "On va vous manquer!",
  "Husker du at du skal lese Houellebecq på fransk én dag?",
  "N'oubliez pas — Houellebecq vous attend en français!",
  "Sikker? Du var så nær fremgang!",
  "Sûr? Vous étiez si proche du progrès!",
  "Et lite franskord til før du går?",
  "Encore un petit mot français avant de partir?",
  "Au revoir betyr ikke for alltid.",
  "Au revoir ne veut pas dire pour toujours.",
  "Ta gjerne med deg noen franske ord ut i verden!",
  "Emportez quelques mots français dans le monde!",
  "Kom tilbake snart — Pierre venter.",
  "Revenez vite — Pierre vous attend.",
];

const MODES = [
  { id: "dagens", label: "Dagens øvelse", icon: "◆", desc: "5 nye ord + 10 produksjonsoppgaver" },
  { id: "quiz", label: "Glosekort", icon: "◈", desc: "Nye ord + repeter det du har lært" },
  { id: "grammatikk", label: "Grammatikk", icon: "◑", desc: "Setningsoppbygging trinn for trinn" },
  { id: "muntlig", label: "Muntlig", icon: "◎", desc: "Snakk fransk — få direkte korreksjon" },
  { id: "teksthjelp", label: "Teksthjelp", icon: "◫", desc: "Lim inn setning eller tekst på fransk" },
  { id: "fri", label: "Spør fritt", icon: "✦", desc: "Still spørsmål eller snakk med Pierre" },
];

const STARTER = {
  quiz: "Vil du øve på hverdagsord, mat og drikke, Paris på 1920-tallet, eller skal jeg velge?",
  grammatikk: "La oss lære fransk grammatikk trinn for trinn.\n\nVi starter helt fra bunnen: hvordan man sier «jeg er», «du er», «han er» på fransk — og hvordan det henger sammen med resten av setningen.",
  muntlig: "La oss øve på å snakke! Jeg gir deg en norsk setning — du oversetter og sier den på fransk. Trykk på mikrofonen og si svaret høyt.\n\nFørste setning: «Jeg heter Peter og jeg bor i Norge.»",
  teksthjelp: "Lim inn en setning eller lengre tekst på fransk — jeg tilpasser meg automatisk.\n\nDu kan også velge en setning fra bøkene dine nedenfor.",
  fri: "Hva lurer du på om fransk? Du kan også skrive «Pierre» hvis du vil øve med en virtuell franskmann.",
};

const SPEECH_LANG = { fri: "fr-FR", muntlig: "fr-FR" };
const SR_INTERVALS = [1, 2, 4, 8, 16, 32];
const WORDS_KEY = "fransk-laering-ord-v2";
const STREAK_KEY = "fransk-streak";
const DAGENS_KEY = "fransk-dagens-ovelse";
const SESSION_KEY = "fransk-session-msgs";

function todayStr() { return new Date().toISOString().split("T")[0]; }
function getTodaysWords(words) {
  try {
    const saved = JSON.parse(localStorage.getItem(DAGENS_KEY) || "{}");
    if (saved.date === todayStr()) return saved;
  } catch {}
  const learnedFr = new Set(words.map(w => w.fr));
  const newVocab = VOCAB_LIST.filter(v => !learnedFr.has(v.fr)).slice(0, 5);
  const due = getDue(words).slice(0, Math.max(0, 5 - newVocab.length));
  const selected = [...newVocab, ...due].slice(0, 5);
  const exercise = { date: todayStr(), words: selected, phase1done: false, phase2done: false };
  localStorage.setItem(DAGENS_KEY, JSON.stringify(exercise));
  return exercise;
}

const gold = "#c8783a", dark = "#f5f0e6", cream = "#1a1210", card = "#ffffff", brd = "rgba(0,0,0,0.09)", grn = "#3a8a50", red = "#c83a3a";

// --- Storage helpers ---
function loadWords() {
  try {
    const s = localStorage.getItem(WORDS_KEY);
    if (s) return JSON.parse(s);
    const old = localStorage.getItem("fransk-laering-ord");
    if (old) {
      const arr = JSON.parse(old);
      if (Array.isArray(arr)) return arr.map((w, i) => ({ id: Date.now() + i, fr: w, no: "", phonetic: "", level: 0, nextReview: Date.now(), added: Date.now() }));
    }
    return [];
  } catch { return []; }
}
function saveWords(w) { try { localStorage.setItem(WORDS_KEY, JSON.stringify(w)); } catch {} }

function loadStreak() {
  try { const s = localStorage.getItem(STREAK_KEY); return s ? JSON.parse(s) : { current: 0, lastDate: null }; }
  catch { return { current: 0, lastDate: null }; }
}
function touchStreak() {
  const today = new Date().toISOString().split("T")[0];
  const s = loadStreak();
  if (s.lastDate === today) return s.current;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const current = s.lastDate === yesterday ? s.current + 1 : 1;
  try { localStorage.setItem(STREAK_KEY, JSON.stringify({ current, lastDate: today })); } catch {}
  return current;
}

function getDue(words) { return words.filter(w => w.nextReview <= Date.now()); }
function scheduleNext(level, correct) {
  const newLevel = correct ? Math.min(level + 1, SR_INTERVALS.length - 1) : 0;
  return { level: newLevel, nextReview: Date.now() + SR_INTERVALS[newLevel] * 86400000 };
}
function parseLearnLine(line) {
  const m1 = line.match(/✓ LÆRT:\s*(.+?)\s*=\s*(.+?)\s*\((.+?)\)/);
  if (m1) return { fr: m1[1].trim(), no: m1[2].trim(), phonetic: m1[3].trim() };
  const m2 = line.match(/✓ LÆRT:\s*(.+?)\s*\((.+?)\)/);
  if (m2) return { fr: m2[1].trim(), no: "", phonetic: m2[2].trim() };
  return { fr: line.replace(/✓ LÆRT:\s*/, "").trim(), no: "", phonetic: "" };
}

function parseInline(text) {
  const parts = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2]) parts.push(<strong key={m.index}>{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={m.index} style={{ fontStyle: "italic", opacity: 0.75 }}>{m[3]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function extractSuggestions(text) {
  const m = text.match(/FORSLAG:\s*(.+)/);
  if (!m) return [];
  return m[1].split("|").map(s => s.trim()).filter(Boolean);
}

function stripSuggestions(text) {
  return text.replace(/\nFORSLAG:.*$/s, "").trimEnd();
}

function renderMessage(text) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("✓ LÆRT:")) return <div key={i} style={{ color: grn, fontWeight: "bold", margin: "4px 0", fontSize: 14 }}>{parseInline(line)}</div>;
    if (line.startsWith("✗ FEIL:")) return <div key={i} style={{ color: red, fontWeight: "bold", margin: "4px 0", fontSize: 14 }}>{parseInline(line)}</div>;
    if (line.startsWith("GLOSE:")) return <div key={i} style={{ background: "rgba(200,120,58,0.08)", borderLeft: `3px solid ${gold}`, padding: "6px 10px", margin: "6px 0", borderRadius: "0 8px 8px 0", fontSize: 14 }}>{parseInline(line)}</div>;
    if (line === "---") return <hr key={i} style={{ border: "none", borderTop: `1px solid ${brd}`, margin: "8px 0" }} />;
    return <div key={i} style={{ minHeight: line === "" ? 10 : "auto" }}>{parseInline(line)}</div>;
  });
}

const CHAT_MODES = ["muntlig", "grammatikk", "teksthjelp", "fri"];
const SESSION_SCREEN_KEY = "fransk-session-screen";

export default function App() {
  const [screen, setScreen] = useState(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION_SCREEN_KEY) || "null");
      return s?.screen === "chat" && CHAT_MODES.includes(s?.modeId) ? "chat" : "home";
    } catch { return "home"; }
  });
  const [mode, setMode] = useState(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION_SCREEN_KEY) || "null");
      if (s?.screen === "chat" && s?.modeId) return MODES.find(m => m.id === s.modeId) || null;
    } catch {}
    return null;
  });
  const [messages, setMessages] = useState(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION_SCREEN_KEY) || "null");
      if (s?.screen === "chat" && s?.modeId && CHAT_MODES.includes(s.modeId)) {
        return [{ role: "assistant", content: STARTER[s.modeId] || "", mode: s.modeId }];
      }
    } catch {}
    return [];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [words, setWords] = useState(loadWords);
  const [streak, setStreak] = useState(() => loadStreak().current);
  const [showWords, setShowWords] = useState(false);
  const [showBooks, setShowBooks] = useState(false);
  const [sessionMsgs, setSessionMsgs] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY) || "{}");
      return s.date === todayStr() ? (s.count || 0) : 0;
    } catch { return 0; }
  });
  const [copied, setCopied] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [listening, setListening] = useState(false);
  const [noWordsMsg, setNoWordsMsg] = useState(false);
  // Review state
  // Dagens øvelse state
  const [dagensPhase, setDagensPhase] = useState(0); // 1=fase1, 2=fase2, 3=ferdig
  const [dagensWords, setDagensWords] = useState([]);
  const [dagensQueue, setDagensQueue] = useState([]);
  const [dagensCard, setDagensCard] = useState(null);
  const [dagensInput, setDagensInput] = useState("");
  const [dagensChecked, setDagensChecked] = useState(false);
  const [dagensResult, setDagensResult] = useState("");
  const [dagensStats, setDagensStats] = useState({ correct: 0, wrong: 0 });
  // Local quiz state
  const [quizQueue, setQuizQueue] = useState([]);
  const [quizCard, setQuizCard] = useState(null);
  const [quizInput, setQuizInput] = useState("");
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizResult, setQuizResult] = useState("");
  const [quizStats, setQuizStats] = useState({ correct: 0, wrong: 0 });
  const [quizOptions, setQuizOptions] = useState([]);
  const [quizMode, setQuizMode] = useState("choice"); // "input" | "choice"
  // Manual word adding
  const [addWordOpen, setAddWordOpen] = useState(false);
  const [addWordFr, setAddWordFr] = useState("");
  const [addWordNo, setAddWordNo] = useState("");
  const [addWordPhonetic, setAddWordPhonetic] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState(null);
  // Recent lesehjelp texts
  const [recentTexts, setRecentTexts] = useState(() => { try { return JSON.parse(localStorage.getItem("fransk-recent-texts") || "[]"); } catch { return []; } });
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [exitPhraseIdx, setExitPhraseIdx] = useState(0);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const screenRef = useRef(screen);
  const showWordsRef = useRef(showWords);
  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { showWordsRef.current = showWords; }, [showWords]);

  useEffect(() => { saveWords(words); }, [words]);
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_SCREEN_KEY, JSON.stringify({ screen, modeId: mode?.id || null }));
    } catch {}
  }, [screen, mode]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  useEffect(() => {
    // Push a #nav entry so Android back button has something to pop
    window.location.hash = "nav";
    const handleHashChange = () => {
      if (window.location.hash !== "#nav") {
        // Back was pressed — re-add hash so next press also works
        window.location.hash = "nav";
        if (showWordsRef.current) {
          setShowWords(false);
        } else if (screenRef.current !== "home") {
          setScreen("home");
        } else {
          setExitPhraseIdx(i => (i + 1) % EXIT_PHRASES.length);
          setShowExitDialog(true);
        }
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const WORD_SAVE_MODES = ["muntlig", "grammatikk"];
  useEffect(() => {
    messages.forEach(msg => {
      if (msg.role === "assistant" && WORD_SAVE_MODES.includes(msg.mode)) {
        [...msg.content.matchAll(/✓ LÆRT: .+/g)].forEach(m => {
          const parsed = parseLearnLine(m[0]);
          setWords(prev => {
            if (prev.some(w => w.fr === parsed.fr)) return prev;
            const newWord = { id: Date.now() + Math.random(), ...parsed, level: 0, nextReview: Date.now() + SR_INTERVALS[0] * 86400000, added: Date.now() };
            const updated = [...prev, newWord];
            saveWords(updated);
            return updated;
          });
        });
      }
    });
  }, [messages]);

  const [speaking, setSpeaking] = useState(false);

  const speak = (text, rate = 0.85) => {
    if (!window.speechSynthesis) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }

    const cleanLine = t => t
      .replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')
      .replace(/[✓✗].*?:/g, '').replace(/GLOSE:/g, '').trim();

    const detectLang = line => {
      if (/[øå]/.test(line)) return "nb-NO";
      if (/[éèêëàâùûôîœç]/i.test(line)) return "fr-FR";
      if (/\b(jeg|og|er|til|av|for|men|ikke|her|fra|med|har|som|når|deg|meg|vil|kan|skal|det|disse|norsk|hva|hvem|hvor)\b/i.test(line)) return "nb-NO";
      return "fr-FR";
    };

    const lines = text.split('\n')
      .map(l => ({ text: cleanLine(l), lang: detectLang(l) }))
      .filter(l => l.text.length > 1);

    if (!lines.length) return;
    setSpeaking(true);
    lines.forEach((l, i) => {
      const utt = new SpeechSynthesisUtterance(l.text);
      utt.lang = l.lang;
      utt.rate = rate;
      if (i === lines.length - 1) { utt.onend = () => setSpeaking(false); utt.onerror = () => setSpeaking(false); }
      window.speechSynthesis.speak(utt);
    });
  };

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Nettleseren din støtter ikke talegjenkjenning. Prøv Chrome."); return; }
    const recognition = new SR();
    recognition.lang = SPEECH_LANG[mode?.id] || "nb-NO";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e) => { setListening(false); send(e.results[0][0].transcript); };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false); };

  const startMode = async (m) => {
    if (m.id === "dagens") {
      const ex = getTodaysWords(words);
      if (ex.words.length === 0) { setNoWordsMsg(true); setTimeout(() => setNoWordsMsg(false), 3000); return; }
      const phase = ex.phase2done ? 3 : ex.phase1done ? 2 : 1;
      setDagensWords(ex.words);
      setDagensStats({ correct: 0, wrong: 0 });
      setDagensInput(""); setDagensChecked(false); setDagensResult("");
      if (phase === 1) {
        setDagensQueue([...ex.words]);
        setDagensCard(ex.words[0]);
      } else if (phase === 2) {
        const bankFill = words.filter(w => !ex.words.some(d => d.fr === w.fr)).sort(() => Math.random() - 0.5).slice(0, 5);
        const p2 = [...ex.words, ...bankFill].map(w => ({ ...w, reverse: true }));
        setDagensQueue(p2);
        setDagensCard(p2[0]);
      }
      setDagensPhase(phase);
      setScreen("dagens");
      return;
    }
    if (m.id === "quiz") {
      const due = getDue(words);
      const notDue = words.filter(w => !due.some(d => d.id === w.id));
      const queue = [...due, ...notDue].slice(0, 20);
      if (queue.length === 0) { setNoWordsMsg(true); setTimeout(() => setNoWordsMsg(false), 3000); return; }
      setQuizQueue(queue);
      setQuizCard(queue[0]);
      setQuizOptions(getQuizOptions(queue[0], words));
      setQuizMode(Math.random() < 0.5 ? "input" : "choice");
      setQuizInput("");
      setQuizChecked(false);
      setQuizResult("");
      setQuizStats({ correct: 0, wrong: 0 });
      setScreen("quiz");
      return;
    }
setMode(m); setScreen("chat"); setShowBooks(false);

    // For modes that use progression, fetch a personalized opener from Claude
    if (["muntlig", "grammatikk", "fri"].includes(m.id) && words.length > 0) {
      setLoading(true);
      setMessages([]);
      const wordCtx = `\n\nElevens ordbank (${words.length} ord lagret på enheten):\n` +
        words.map(w => `- ${w.fr}${w.no ? ` = ${w.no}` : ""}${w.phonetic ? ` (${w.phonetic})` : ""} [nivå ${w.level}]`).join("\n") +
        `\n\nDisse ordene KAN eleven. Ikke re-introduser dem som nye. Bygg heller setninger, spørsmål og samtaler der disse ordene inngår naturlig. Introduser nye ord gradvis VED SIDEN AV det kjente.`;
      try {
        const res = await fetch(PROXY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 600,
            system: SYSTEM_PROMPT + wordCtx + `\nModus: ${m.label.toUpperCase()}`,
            messages: [{ role: "user", content: `Start en ny økt. Eleven har ${words.length} ord i ordbanken. Ønsker dem velkommen tilbake, nevn kort hva de kan (bruk noen av de kjente ordene), og start direkte med neste steg i læringen.` }],
          }),
        });
        const data = await res.json();
        const reply = data.content?.find(b => b.type === "text")?.text || STARTER[m.id];
        setMessages([{ role: "assistant", content: reply, mode: m.id }]);
      } catch {
        setMessages([{ role: "assistant", content: STARTER[m.id] }]);
      }
      setLoading(false);
    } else {
      setMessages([{ role: "assistant", content: STARTER[m.id] }]);
    }
  };

  const send = async (override) => {
    const text = (override || input).trim();
    if (!text || loading) return;
    setInput("");
    if (sessionMsgs === 0) setStreak(touchStreak());
    const next = [...messages, { role: "user", content: text }];
    setMessages(next); setLoading(true); setSessionMsgs(s => {
      const next = s + 1;
      try { localStorage.setItem(SESSION_KEY, JSON.stringify({ date: todayStr(), count: next })); } catch {}
      return next;
    });
    const wordCtx = words.length > 0
      ? `\n\nElevens ordbank (${words.length} ord lagret på enheten):\n` +
        words.map(w => `- ${w.fr}${w.no ? ` = ${w.no}` : ""}${w.phonetic ? ` (${w.phonetic})` : ""} [nivå ${w.level}]`).join("\n") +
        `\n\nDisse ordene KAN eleven. Ikke re-introduser dem som nye. Bygg heller setninger, spørsmål og samtaler der disse ordene inngår naturlig. Introduser nye ord gradvis VED SIDEN AV det kjente.`
      : "";
    try {
      const res = await fetch(PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 800,
          system: SYSTEM_PROMPT + wordCtx + `\nModus: ${mode?.label?.toUpperCase()}`,
          messages: next.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const budgetHit = data.error?.message?.toLowerCase().includes("budget") || data.error?.message?.toLowerCase().includes("daily");
      const reply = data.content?.find(b => b.type === "text")?.text ||
        (budgetHit ? "Daglig grense er nådd. Appen åpner igjen ved midnatt (UTC). Kom tilbake i morgen!" :
          data.error ? `Feil: ${data.error.message}` : "Noe gikk galt.");
      if (mode?.id === "teksthjelp" && text) {
        setRecentTexts(prev => {
          const next2 = [text, ...prev.filter(t => t !== text)].slice(0, 5);
          localStorage.setItem("fransk-recent-texts", JSON.stringify(next2));
          return next2;
        });
      }
      setMessages([...next, { role: "assistant", content: reply, mode: mode?.id }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Kunne ikke koble til. Prøv igjen." }]);
    }
    setLoading(false);
  };


  const clearWords = () => { setWords([]); localStorage.removeItem(WORDS_KEY); localStorage.removeItem("fransk-laering-ord"); };
  const importWords = (text) => {
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    let added = 0;
    setWords(prev => {
      let updated = [...prev];
      for (const line of lines) {
        const clean = line.replace(/^[✓✗•\-*]\s*/, "").trim();
        const eqIdx = clean.indexOf(" = ");
        if (eqIdx === -1) continue;
        const fr = clean.slice(0, eqIdx).trim();
        if (!fr) continue;
        let rest = clean.slice(eqIdx + 3).trim();
        const phoneticMatch = rest.match(/\(([^)]+)\)\s*$/);
        const phonetic = phoneticMatch ? phoneticMatch[1].trim() : "";
        const no = phoneticMatch ? rest.slice(0, phoneticMatch.index).trim() : rest;
        if (!fr) continue;
        if (updated.some(w => w.fr === fr)) continue;
        updated.push({ id: Date.now() + Math.random(), fr, no, phonetic, level: 0, nextReview: Date.now() + SR_INTERVALS[0] * 86400000, added: Date.now() });
        added++;
      }
      return updated;
    });
    return added;
  };
  const addWordManually = () => {
    if (!addWordFr.trim()) return;
    const newWord = { id: Date.now() + Math.random(), fr: addWordFr.trim(), no: addWordNo.trim(), phonetic: addWordPhonetic.trim(), level: 0, nextReview: Date.now() + SR_INTERVALS[0] * 86400000, added: Date.now() };
    setWords(prev => prev.some(w => w.fr === newWord.fr) ? prev : [...prev, newWord]);
    setAddWordFr(""); setAddWordNo(""); setAddWordPhonetic(""); setAddWordOpen(false);
  };
  const copyWords = () => {
    if (!words.length) return;
    navigator.clipboard.writeText("Mine franske ord:\n" + words.map(w => `✓ ${w.fr}${w.no ? ` = ${w.no}` : ""}${w.phonetic ? ` (${w.phonetic})` : ""}`).join("\n"))
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  };

  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };
  const dueCount = getDue(words).length;

  const offlineBanner = !isOnline && (
    <div style={{ background: "#3a2a10", borderBottom: `1px solid ${gold}44`, padding: "8px 16px", fontSize: 13, color: gold, textAlign: "center", letterSpacing: 1 }}>
      Ingen internettforbindelse — Claude er ikke tilgjengelig
    </div>
  );

  const micBtn = (
    <button onClick={listening ? stopListening : startListening}
      style={{ background: listening ? gold : "none", border: `1px solid ${listening ? gold : brd}`, borderRadius: 10, color: listening ? dark : cream, fontSize: 18, padding: "10px 14px", cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }}>
      {listening ? "⏹" : "🎙"}
    </button>
  );

  const S = {
    page: { display: "flex", flexDirection: "column", height: "100dvh", background: dark, fontFamily: "'Jost', sans-serif", color: cream, paddingBottom: 66 },
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${brd}`, background: card, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
    backBtn: { background: "none", border: "none", color: gold, fontSize: 14, cursor: "pointer", fontFamily: "'Jost', sans-serif" },
    title: { display: "flex", alignItems: "center", gap: 8, fontSize: 16, letterSpacing: 2 },
    badge: { background: "none", border: `1px solid ${gold}44`, borderRadius: 20, color: gold, fontSize: 12, padding: "4px 12px", cursor: "pointer", fontFamily: "'Jost', sans-serif", letterSpacing: 1 },
    msgs: { flex: 1, overflowY: "auto", padding: "20px 16px 24px", display: "flex", flexDirection: "column", gap: 16 },
    ai: { alignSelf: "flex-start", maxWidth: "88%", background: card, border: `0.5px solid ${brd}`, borderRadius: "4px 18px 18px 18px", padding: "12px 16px", boxShadow: "0 4px 20px rgba(0,0,0,0.07)" },
    user: { alignSelf: "flex-end", maxWidth: "80%", background: "rgba(200,120,58,0.1)", border: `1px solid ${gold}44`, borderRadius: "18px 4px 18px 18px", padding: "12px 16px", fontSize: 15, lineHeight: 1.6 },
    aiLabel: { fontSize: 10, color: gold, letterSpacing: 2, marginBottom: 6, textTransform: "uppercase", display: "flex", justifyContent: "space-between", alignItems: "center" },
    bubbleTxt: { fontSize: 15, lineHeight: 1.75, color: cream },
    inputArea: { display: "flex", gap: 10, padding: "12px 16px", borderTop: `1px solid ${brd}`, background: card, alignItems: "flex-end" },
    textarea: { flex: 1, background: dark, border: `0.5px solid ${brd}`, borderRadius: 10, color: cream, fontFamily: "'Jost', sans-serif", fontSize: 15, padding: "10px 14px", resize: "none", outline: "none", lineHeight: 1.5 },
    sendBtn: (d) => ({ background: d ? `rgba(200,120,58,0.3)` : `linear-gradient(135deg, #d98a4a, ${gold})`, border: "none", borderRadius: 14, color: d ? `${cream}88` : dark, fontFamily: "'Jost', sans-serif", fontWeight: "500", fontSize: 14, padding: "10px 18px", cursor: d ? "default" : "pointer", letterSpacing: 1, whiteSpace: "nowrap" }),
  };

  const BottomNav = () => {
    const tabs = [
      { id: "home",    label: "Hjem",    sym: "⌂" },
      { id: "quiz",    label: "Øv",      sym: "◈" },
      { id: "fri",     label: "Snakk",   sym: "◉" },
      { id: "words",   label: "Ordbank", sym: "◎" },
    ];
    const activeId = showWords ? "words"
      : screen === "home" ? "home"
      : (screen === "quiz" || screen === "dagens") ? "quiz"
      : screen === "chat" && mode?.id === "fri" ? "fri"
      : null;
    const handleNav = (id) => {
      if (id === "words")   { setShowWords(true); setScreen("home"); }
      else if (id === "home")    { setShowWords(false); setScreen("home"); }
      else if (id === "quiz")    { setShowWords(false); startMode(MODES.find(m => m.id === "quiz")); }
      else if (id === "fri") { setShowWords(false); startMode(MODES.find(m => m.id === "fri")); }
    };
    return (
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#ffffff", borderTop: `0.5px solid ${brd}`, display: "flex", alignItems: "stretch", height: 66, zIndex: 200, boxShadow: "0 -4px 20px rgba(0,0,0,0.06)" }}>
        {tabs.map(t => {
          const active = activeId === t.id;
          return (
            <button key={t.id} onClick={() => handleNav(t.id)}
              style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, color: active ? gold : "rgba(26,18,16,0.3)", fontFamily: "'Jost', sans-serif", padding: "8px 4px", transition: "color 0.2s ease" }}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>{t.sym}</span>
              <span style={{ fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: active ? "500" : "400" }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  // --- Words screen ---
  if (showWords) return (
    <div style={S.page}>
      <div style={S.header}>
        <button onClick={() => setShowWords(false)} style={S.backBtn}>← Tilbake</button>
        <div style={S.title}><span style={{ color: gold }}>◈</span> Ordsamlingen din</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => { setImportOpen(o => !o); setAddWordOpen(false); }} style={{ background: importOpen ? gold : "none", border: `1px solid ${gold}66`, borderRadius: 8, color: importOpen ? dark : gold, fontSize: 13, padding: "4px 12px", cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>↑ Importer</button>
          <button onClick={() => { setAddWordOpen(o => !o); setImportOpen(false); }} style={{ background: addWordOpen ? gold : "none", border: `1px solid ${gold}66`, borderRadius: 8, color: addWordOpen ? dark : gold, fontSize: 13, padding: "4px 12px", cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>+ Legg til</button>
        </div>
      </div>
      {importOpen && (
        <div style={{ background: "#F0E8D5", borderBottom: `1px solid ${brd}`, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, color: `rgba(29,22,16,0.55)`, lineHeight: 1.5 }}>Lim inn ord på formatet:<br /><em>✓ bonjour = hallo (bånsjur)</em></div>
          <textarea
            placeholder={"✓ bonjour = hallo (bånsjur)\n✓ merci = takk (merssi)\n..."}
            value={importText}
            onChange={e => { setImportText(e.target.value); setImportResult(null); }}
            rows={6}
            style={{ background: dark, border: `1px solid ${brd}`, borderRadius: 8, color: cream, fontFamily: "'Jost', sans-serif", fontSize: 13, padding: "10px 12px", outline: "none", resize: "vertical" }}
          />
          {importResult !== null && (
            <div style={{ fontSize: 13, color: importResult > 0 ? grn : gold, fontWeight: "bold" }}>
              {importResult > 0 ? `✓ ${importResult} ord lagt til!` : "Ingen nye ord funnet — sjekk formatet."}
            </div>
          )}
          <button
            onClick={() => { const n = importWords(importText); setImportResult(n); if (n > 0) { setImportText(""); setTimeout(() => { setImportOpen(false); setImportResult(null); }, 1800); } }}
            disabled={!importText.trim()}
            className={importText.trim() ? "btn-shine" : ""}
            style={{ background: importText.trim() ? `linear-gradient(135deg, #d98a4a, ${gold})` : `rgba(200,120,58,0.25)`, border: "none", borderRadius: 14, color: dark, fontFamily: "'Jost', sans-serif", fontWeight: "500", fontSize: 14, padding: "10px", cursor: importText.trim() ? "pointer" : "default" }}>
            Importer ord
          </button>
        </div>
      )}
      {addWordOpen && (
        <div style={{ background: "#F0E8D5", borderBottom: `1px solid ${brd}`, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          <input placeholder="Fransk ord *" value={addWordFr} onChange={e => setAddWordFr(e.target.value)} style={{ background: dark, border: `1px solid ${brd}`, borderRadius: 8, color: cream, fontFamily: "'Jost', sans-serif", fontSize: 14, padding: "8px 12px", outline: "none" }} />
          <input placeholder="Norsk oversettelse" value={addWordNo} onChange={e => setAddWordNo(e.target.value)} style={{ background: dark, border: `1px solid ${brd}`, borderRadius: 8, color: cream, fontFamily: "'Jost', sans-serif", fontSize: 14, padding: "8px 12px", outline: "none" }} />
          <input placeholder="Uttale (f.eks. bånsjur)" value={addWordPhonetic} onChange={e => setAddWordPhonetic(e.target.value)} onKeyDown={e => e.key === "Enter" && addWordManually()} style={{ background: dark, border: `1px solid ${brd}`, borderRadius: 8, color: cream, fontFamily: "'Jost', sans-serif", fontSize: 14, padding: "8px 12px", outline: "none" }} />
          <button onClick={addWordManually} disabled={!addWordFr.trim()} className={addWordFr.trim() ? "btn-shine" : ""} style={{ background: addWordFr.trim() ? `linear-gradient(135deg, #d98a4a, ${gold})` : `rgba(200,120,58,0.25)`, border: "none", borderRadius: 14, color: dark, fontFamily: "'Jost', sans-serif", fontWeight: "500", fontSize: 14, padding: "10px", cursor: addWordFr.trim() ? "pointer" : "default" }}>Lagre ord</button>
        </div>
      )}
      <div style={{ padding: "24px 16px", flex: 1, overflowY: "auto" }}>
        {words.length === 0
          ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "50vh" }}>
              <div style={{ fontSize: 40, opacity: 0.3, marginBottom: 16 }}>◎</div>
              <p style={{ color: "rgba(29,22,16,0.4)", textAlign: "center", lineHeight: 1.9 }}>Ingen ord lagret ennå.<br />Øv på Glosekort, så lagres ordene automatisk her.</p>
            </div>
          : <>
              <div style={{ display: "flex", gap: 16, marginBottom: 16, fontSize: 11, color: `${gold}88`, letterSpacing: 1, textTransform: "uppercase" }}>
                <span><span style={{ color: grn }}>●</span> Mestret ({words.filter(w => w.level >= 3).length})</span>
                <span><span style={{ color: gold }}>●</span> I læring ({words.filter(w => w.level > 0 && w.level < 3).length})</span>
                <span><span style={{ color: `${cream}44` }}>●</span> Ny ({words.filter(w => w.level === 0).length})</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {words.map((w, i) => {
                  const statusColor = w.level >= 3 ? grn : w.level > 0 ? gold : `${cream}44`;
                  const statusLabel = w.level >= 3 ? "mestret" : w.level > 0 ? "i læring" : "ny";
                  return (
                    <div key={i} style={{ background: card, border: `1px solid ${brd}`, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ color: grn, marginRight: 6 }}>✓</span>
                        <span style={{ fontSize: 14 }}>{w.fr}</span>
                        {w.no && <span style={{ color: `${cream}66`, fontSize: 13 }}> = {w.no}</span>}
                        {w.phonetic && <span style={{ color: `${gold}88`, fontSize: 12 }}> ({w.phonetic})</span>}
                      </div>
                      <div style={{ fontSize: 10, color: statusColor, letterSpacing: 1, textTransform: "uppercase" }}>{statusLabel}</div>
                    </div>
                  );
                })}
              </div>
            </>
        }
      </div>
      {words.length > 0 && (
        <div style={{ padding: "0 16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={copyWords} style={{ background: copied ? grn : "none", border: `1px solid ${copied ? grn : gold}88`, borderRadius: 8, color: copied ? dark : gold, fontFamily: "'Jost', sans-serif", fontSize: 13, padding: "12px 20px", cursor: "pointer", width: "100%", transition: "all 0.3s", fontWeight: copied ? "bold" : "normal" }}>
            {copied ? "✓ Kopiert!" : "Kopier ordlisten min"}
          </button>
          <button onClick={clearWords} style={{ background: "none", border: `1px solid ${red}55`, borderRadius: 8, color: red, fontFamily: "'Jost', sans-serif", fontSize: 13, padding: "10px 20px", cursor: "pointer", width: "100%" }}>
            Nullstill ordliste
          </button>
        </div>
      )}
      <BottomNav />
    </div>
  );

  // --- Dagens øvelse screen ---
  if (screen === "dagens") {
    const totalCards = dagensPhase === 1 ? dagensWords.length : dagensWords.length + 5;
    const done = totalCards - dagensQueue.length;
    const isReverse = dagensCard?.reverse;

    const submitDagens = () => {
      if (!dagensInput.trim()) return;
      const result = checkQuizAnswer(dagensInput, dagensCard, isReverse);
      const passed = result !== "wrong";
      setDagensChecked(true);
      setDagensResult(result);
      setDagensStats(s => ({ correct: s.correct + (passed ? 1 : 0), wrong: s.wrong + (passed ? 0 : 1) }));
      if (dagensCard.id) {
        const { level: newLevel, nextReview } = scheduleNext(dagensCard.level, passed);
        setWords(prev => prev.map(w => w.id === dagensCard.id ? { ...w, level: newLevel, nextReview } : w));
      } else if (passed) {
        const nw = { id: Date.now() + Math.random(), fr: dagensCard.fr, no: dagensCard.no, phonetic: dagensCard.phonetic, level: 1, nextReview: Date.now() + SR_INTERVALS[1] * 86400000, added: Date.now() };
        setWords(prev => prev.some(w => w.fr === nw.fr) ? prev : [...prev, nw]);
      }
    };

    const nextDagens = () => {
      const remaining = dagensQueue.slice(1);
      setDagensInput(""); setDagensChecked(false); setDagensResult("");
      if (remaining.length === 0) {
        const saved = JSON.parse(localStorage.getItem(DAGENS_KEY) || "{}");
        if (dagensPhase === 1) {
          localStorage.setItem(DAGENS_KEY, JSON.stringify({ ...saved, phase1done: true }));
          const bankFill = words.filter(w => !dagensWords.some(d => d.fr === w.fr)).sort(() => Math.random() - 0.5).slice(0, 5);
          const p2 = [...dagensWords, ...bankFill].map(w => ({ ...w, reverse: true }));
          setDagensQueue(p2);
          setDagensCard(p2[0]);
          setDagensPhase(2);
          setDagensStats({ correct: 0, wrong: 0 });
        } else {
          localStorage.setItem(DAGENS_KEY, JSON.stringify({ ...saved, phase2done: true }));
          setDagensPhase(3);
          setStreak(touchStreak());
        }
        return;
      }
      setDagensQueue(remaining);
      setDagensCard(remaining[0]);
    };

    if (dagensPhase === 3) return (
      <div style={S.page}>
        <div style={S.header}>
          <button onClick={() => setScreen("home")} style={S.backBtn}>← Tilbake</button>
          <div style={S.title}><span style={{ color: gold }}>◆</span> Dagens øvelse</div>
          <div style={{ fontSize: 11, color: `${gold}88`, letterSpacing: 1 }}>Fullført ✦</div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", gap: 20, textAlign: "center" }}>
          <div style={{ fontSize: 48 }}>✦</div>
          <div style={{ fontSize: 22, color: gold, fontStyle: "italic" }}>Dagens øvelse fullført!</div>
          <div style={{ fontSize: 14, color: `${cream}88`, lineHeight: 1.8 }}>Du har øvd på {dagensWords.length} ord i begge retninger.<br />Kom tilbake i morgen for 5 nye ord.</div>
          <div style={{ background: card, border: `1px solid ${brd}`, borderRadius: 12, padding: "16px 24px", marginTop: 8 }}>
            {dagensWords.map((w, i) => (
              <div key={i} style={{ fontSize: 14, color: cream, padding: "4px 0", borderBottom: i < dagensWords.length - 1 ? `1px solid ${brd}` : "none" }}>
                <span style={{ color: grn }}>✓</span> <strong>{w.fr}</strong> = {w.no}
                {w.phonetic && <span style={{ color: `${gold}88`, fontSize: 12 }}> ({w.phonetic})</span>}
              </div>
            ))}
          </div>
          <button onClick={() => setScreen("home")} className="btn-shine" style={{ background: `linear-gradient(135deg, #d98a4a, ${gold})`, border: "none", borderRadius: 14, color: dark, fontFamily: "'Jost', sans-serif", fontWeight: "500", fontSize: 15, padding: "14px 40px", cursor: "pointer", marginTop: 8 }}>Tilbake til hjem</button>
        </div>
        <BottomNav />
      </div>
    );

    const phaseLabel = dagensPhase === 1 ? "Del 1 — gjenkjenning (fr → no)" : "Del 2 — produksjon (no → fr)";
    const prompt = isReverse ? dagensCard?.no : dagensCard?.fr;
    const phonetic = !isReverse && dagensCard?.phonetic;

    return (
      <div style={S.page}>
        <div style={S.header}>
          <button onClick={() => setScreen("home")} style={S.backBtn}>← Tilbake</button>
          <div style={S.title}><span style={{ color: gold }}>◆</span> Dagens øvelse</div>
          <div style={{ fontSize: 11, color: `${gold}88`, letterSpacing: 1 }}>{done}/{totalCards}</div>
        </div>
        <div style={{ height: 3, background: brd }}><div style={{ height: "100%", background: gold, width: `${(done / totalCards) * 100}%`, transition: "width 0.3s" }} /></div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", gap: 20 }}>
          <div style={{ fontSize: 10, color: `${gold}66`, letterSpacing: 2, textTransform: "uppercase", textAlign: "center" }}>{phaseLabel}</div>
          <div style={{ background: card, border: `1px solid ${brd}`, borderRadius: 16, padding: "28px 36px", textAlign: "center", width: "100%", maxWidth: 340 }}>
            <div style={{ fontSize: 11, color: `${gold}88`, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
              {isReverse ? "Skriv på fransk:" : "Hva betyr dette?"}
            </div>
            <div style={{ fontSize: 32, color: cream, fontStyle: isReverse ? "normal" : "italic", marginBottom: 8, fontFamily: isReverse ? "'Jost', sans-serif" : "'Playfair Display', Georgia, serif" }}>{prompt}</div>
            {phonetic && <div style={{ fontSize: 14, color: gold, opacity: 0.7, marginBottom: 8 }}>({phonetic})</div>}
            {!isReverse && <button onClick={() => speak(dagensCard.fr)} style={{ background: "none", border: "none", color: `${gold}66`, fontSize: 20, cursor: "pointer" }}>🔊</button>}
          </div>

          {!dagensChecked
            ? <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 340 }}>
                <input value={dagensInput} onChange={e => setDagensInput(e.target.value)} onKeyDown={e => e.key === "Enter" && submitDagens()}
                  placeholder={isReverse ? "Skriv det franske ordet..." : "Skriv norsk oversettelse..."}
                  className="input-glow"
                  style={{ background: dark, border: `0.5px solid ${brd}`, borderRadius: 10, color: cream, fontFamily: "'Jost', sans-serif", fontSize: 16, padding: "14px 16px", outline: "none", textAlign: "center" }} autoFocus />
                <button onClick={submitDagens} disabled={!dagensInput.trim()} className={dagensInput.trim() ? "btn-shine" : ""} style={{ background: dagensInput.trim() ? `linear-gradient(135deg, #d98a4a, ${gold})` : `rgba(200,120,58,0.25)`, border: "none", borderRadius: 14, color: dark, fontFamily: "'Jost', sans-serif", fontWeight: "500", fontSize: 15, padding: "14px", cursor: dagensInput.trim() ? "pointer" : "default" }}>Sjekk svar</button>
              </div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 340, alignItems: "center" }}>
                {dagensResult === "correct" && <div style={{ background: "rgba(76,175,122,0.12)", border: `1px solid ${grn}55`, borderRadius: 12, padding: "14px 20px", textAlign: "center", width: "100%", fontSize: 16, color: grn, fontWeight: "bold" }}>✓ Riktig!</div>}
                {dagensResult === "close" && (
                  <div style={{ background: "rgba(201,168,76,0.1)", border: `1px solid ${gold}55`, borderRadius: 12, padding: "14px 20px", textAlign: "center", width: "100%" }}>
                    <div style={{ fontSize: 15, color: gold, fontWeight: "bold", marginBottom: 4 }}>~ Nesten!</div>
                    <div style={{ fontSize: 13, color: `${cream}88`, marginBottom: 4 }}>Du svarte: <em>{dagensInput}</em></div>
                    <div style={{ fontSize: 14, color: cream }}>Riktig: <strong>{isReverse ? dagensCard.fr : dagensCard.no}</strong></div>
                    {dagensCard.phonetic && <div style={{ fontSize: 12, color: `${gold}88`, marginTop: 4 }}>{dagensCard.phonetic}</div>}
                  </div>
                )}
                {dagensResult === "wrong" && (
                  <div style={{ background: "rgba(196,122,90,0.1)", border: `1px solid ${red}55`, borderRadius: 12, padding: "14px 20px", textAlign: "center", width: "100%" }}>
                    <div style={{ fontSize: 14, color: red, marginBottom: 6 }}>Ikke helt — riktig svar:</div>
                    <div style={{ fontSize: 13, color: `${cream}88`, marginBottom: 4 }}>Du svarte: <em>{dagensInput}</em></div>
                    <div style={{ fontSize: 18, color: cream, fontWeight: "bold" }}>{isReverse ? dagensCard.fr : dagensCard.no}</div>
                    {dagensCard.phonetic && <div style={{ fontSize: 13, color: gold, marginTop: 4 }}>({dagensCard.phonetic}) — si det høyt!</div>}
                  </div>
                )}
                <button onClick={nextDagens} className="btn-shine" style={{ background: `linear-gradient(135deg, #d98a4a, ${gold})`, border: "none", borderRadius: 14, color: dark, fontFamily: "'Jost', sans-serif", fontWeight: "500", fontSize: 15, padding: "14px 40px", cursor: "pointer" }}>
                  {dagensQueue.length <= 1 && dagensPhase === 2 ? "Fullfør!" : dagensQueue.length <= 1 ? "Del 2 →" : "Neste →"}
                </button>
              </div>
          }

          <div style={{ display: "flex", gap: 6 }}>
            {Array.from({ length: totalCards }).map((_, i) => (
              <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: i < dagensStats.correct ? grn : i < done ? red : brd }} />
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // --- Local quiz screen ---
  if (screen === "quiz" && quizCard) {
    const total = quizStats.correct + quizStats.wrong + quizQueue.length;
    const done = quizStats.correct + quizStats.wrong;
    const isFromBank = !!quizCard.id;

    const submitQuiz = () => {
      if (!quizInput.trim()) return;
      const result = checkQuizAnswer(quizInput, quizCard);
      const passed = result !== "wrong";
      setQuizChecked(true);
      setQuizResult(result);
      setQuizStats(s => ({ correct: s.correct + (passed ? 1 : 0), wrong: s.wrong + (passed ? 0 : 1) }));
      if (isFromBank) {
        const { level: newLevel, nextReview } = scheduleNext(quizCard.level, passed);
        setWords(prev => prev.map(w => w.id === quizCard.id ? { ...w, level: newLevel, nextReview } : w));
      } else {
        const newWord = { id: Date.now() + Math.random(), fr: quizCard.fr, no: quizCard.no, phonetic: quizCard.phonetic, level: passed ? 1 : 0, nextReview: Date.now() + SR_INTERVALS[passed ? 1 : 0] * 86400000, added: Date.now() };
        setWords(prev => prev.some(w => w.fr === newWord.fr) ? prev : [...prev, newWord]);
      }
    };

    const nextQuiz = () => {
      const remaining = quizQueue.slice(1);
      if (remaining.length === 0) { setScreen("home"); return; }
      setQuizQueue(remaining);
      setQuizCard(remaining[0]);
      setQuizOptions(getQuizOptions(remaining[0], words));
      setQuizMode(Math.random() < 0.5 ? "input" : "choice");
      setQuizInput("");
      setQuizChecked(false);
      setQuizResult("");
    };

    return (
      <div style={S.page}>
        <div style={S.header}>
          <button onClick={() => setScreen("home")} style={S.backBtn}>← Tilbake</button>
          <div style={S.title}><span style={{ color: gold }}>◈</span> Glosekort</div>
          <div style={{ fontSize: 11, color: `${gold}88`, letterSpacing: 1 }}>{done}/{total}</div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", gap: 20 }}>
          <div style={{ fontSize: 10, color: `${gold}55`, letterSpacing: 2, textTransform: "uppercase" }}>
            {isFromBank ? `Repetisjon · niv. ${quizCard.level}` : "Nytt ord"}
          </div>
          <div style={{ background: card, border: `1px solid ${brd}`, borderRadius: 16, padding: "32px 40px", textAlign: "center", width: "100%", maxWidth: 340 }}>
            <div style={{ fontSize: 11, color: `${gold}88`, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Hva betyr dette på norsk?</div>
            <div style={{ fontSize: 34, color: cream, fontStyle: "italic", marginBottom: 8, fontFamily: "'Playfair Display', Georgia, serif" }}>{quizCard.fr}</div>
            {quizCard.phonetic && <div style={{ fontSize: 14, color: gold, opacity: 0.7, marginBottom: 8 }}>({quizCard.phonetic})</div>}
            <div style={{ display: "flex", gap: 16, marginTop: 4, justifyContent: "center", alignItems: "center" }}>
              <button onClick={() => speak(quizCard.fr)} title="Normal hastighet" style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", opacity: speaking ? 1 : 0.6, lineHeight: 1 }}>🔊</button>
              <button onClick={() => speak(quizCard.fr, 0.4)} title="Sakte" style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", opacity: speaking ? 1 : 0.6, lineHeight: 1 }}>🐢</button>
            </div>
          </div>

          {!quizChecked
            ? quizMode === "choice"
              ? <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", maxWidth: 340 }}>
                    {quizOptions.map((opt, i) => (
                      <button key={i} onClick={() => setQuizInput(opt)}
                        style={{ background: quizInput === opt ? "rgba(200,120,58,0.12)" : card, border: `${quizInput === opt ? 2 : 1}px solid ${quizInput === opt ? gold : brd}`, borderRadius: 14, padding: "16px 10px", cursor: "pointer", color: cream, fontFamily: "'Jost', sans-serif", fontSize: 14, lineHeight: 1.3, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", textAlign: "center", transition: "all 0.15s ease" }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                  <button onClick={submitQuiz} disabled={!quizInput.trim()} className={quizInput.trim() ? "btn-shine" : ""}
                    style={{ background: quizInput.trim() ? `linear-gradient(135deg, #d98a4a, ${gold})` : "rgba(200,120,58,0.2)", border: "none", borderRadius: 14, color: quizInput.trim() ? dark : `${cream}55`, fontFamily: "'Jost', sans-serif", fontWeight: "500", fontSize: 15, padding: "16px", cursor: quizInput.trim() ? "pointer" : "default", width: "100%", maxWidth: 340 }}>
                    Bekreft svar
                  </button>
                </>
              : <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 340 }}>
                  <input
                    value={quizInput}
                    onChange={e => setQuizInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && submitQuiz()}
                    placeholder="Skriv norsk oversettelse..."
                    className="input-glow"
                    style={{ background: dark, border: `0.5px solid ${brd}`, borderRadius: 10, color: cream, fontFamily: "'Jost', sans-serif", fontSize: 16, padding: "14px 16px", outline: "none", textAlign: "center" }}
                    autoFocus
                  />
                  <button onClick={submitQuiz} disabled={!quizInput.trim()} className={quizInput.trim() ? "btn-shine" : ""} style={{ background: quizInput.trim() ? `linear-gradient(135deg, #d98a4a, ${gold})` : `rgba(200,120,58,0.25)`, border: "none", borderRadius: 14, color: dark, fontFamily: "'Jost', sans-serif", fontWeight: "500", fontSize: 15, padding: "14px", cursor: quizInput.trim() ? "pointer" : "default" }}>Sjekk svar</button>
                </div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 340, alignItems: "center" }}>
                {quizResult === "correct" && (
                  <div style={{ background: "rgba(76,175,122,0.12)", border: `1px solid ${grn}55`, borderRadius: 12, padding: "16px 24px", textAlign: "center", width: "100%" }}>
                    <div style={{ fontSize: 16, color: grn, fontWeight: "bold", marginBottom: 4 }}>✓ Riktig!</div>
                    {!isFromBank && <div style={{ fontSize: 12, color: `${grn}aa`, marginTop: 4 }}>Lagt til i ordbanken din ✦</div>}
                  </div>
                )}
                {quizResult === "close" && (
                  <div style={{ background: "rgba(201,168,76,0.1)", border: `1px solid ${gold}55`, borderRadius: 12, padding: "16px 24px", textAlign: "center", width: "100%" }}>
                    <div style={{ fontSize: 16, color: gold, fontWeight: "bold", marginBottom: 6 }}>~ Nesten riktig!</div>
                    <div style={{ fontSize: 13, color: `${cream}88`, marginBottom: 4 }}>Du svarte: <em>{quizInput}</em></div>
                    <div style={{ fontSize: 15, color: cream }}>Riktig stavemåte: <strong>{quizCard.no}</strong></div>
                    {quizCard.phonetic && <div style={{ fontSize: 13, color: gold, opacity: 0.8, marginTop: 6 }}>Uttale: {quizCard.phonetic} — si det høyt!</div>}
                    {!isFromBank && <div style={{ fontSize: 11, color: `${gold}88`, marginTop: 6 }}>Lagt til i ordbanken ✦</div>}
                  </div>
                )}
                {quizResult === "wrong" && (
                  <div style={{ background: "rgba(196,122,90,0.1)", border: `1px solid ${red}55`, borderRadius: 12, padding: "16px 24px", textAlign: "center", width: "100%" }}>
                    <div style={{ fontSize: 16, color: red, fontWeight: "bold", marginBottom: 6 }}>Ikke helt — prøv igjen neste gang</div>
                    <div style={{ fontSize: 13, color: `${cream}66`, marginBottom: 6 }}>Du svarte: <em>{quizInput}</em></div>
                    <div style={{ fontSize: 18, color: cream, marginBottom: 4 }}>{quizCard.no}</div>
                    {quizCard.phonetic && <div style={{ fontSize: 13, color: gold, opacity: 0.8, marginBottom: 6 }}>({quizCard.phonetic})</div>}
                    <div style={{ fontSize: 12, color: `${cream}55`, fontStyle: "italic" }}>Si det høyt et par ganger — det hjelper!</div>
                  </div>
                )}
                <button onClick={nextQuiz} className="btn-shine" style={{ background: `linear-gradient(135deg, #d98a4a, ${gold})`, border: "none", borderRadius: 14, color: dark, fontFamily: "'Jost', sans-serif", fontWeight: "500", fontSize: 15, padding: "14px 40px", cursor: "pointer", letterSpacing: 1 }}>
                  {quizQueue.length <= 1 ? "Ferdig!" : "Neste ord →"}
                </button>
              </div>
          }

          <div style={{ display: "flex", gap: 8 }}>
            {Array.from({ length: Math.min(total, 20) }).map((_, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i < quizStats.correct ? grn : i < done ? red : brd }} />
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // --- Chat screen ---
  if (screen === "chat") return (
    <div style={S.page}>
      <div style={S.header}>
        <button onClick={() => setScreen("home")} style={S.backBtn}>← Tilbake</button>
        <div style={S.title}><span style={{ color: gold }}>{mode?.icon}</span><span>{mode?.label}</span></div>
        <button onClick={() => setShowWords(true)} style={S.badge}>◈ {words.length}</button>
      </div>
      {offlineBanner}
      {mode?.id === "teksthjelp" && (
        <button onClick={() => setShowBooks(b => !b)} style={{ background: "rgba(201,168,76,0.06)", border: "none", borderBottom: `1px solid ${brd}`, color: gold, fontFamily: "'Jost', sans-serif", fontSize: 13, padding: "10px 16px", cursor: "pointer", textAlign: "left", letterSpacing: 1, width: "100%" }}>
          {showBooks ? "▲ Lukk boksamling" : "▼ Velg setning fra bøkene dine"}
        </button>
      )}
      {showBooks && (
        <div style={{ background: card, borderBottom: `1px solid ${brd}`, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto" }}>
          {recentTexts.length > 0 && (
            <>
              <div style={{ fontSize: 10, color: `${gold}88`, letterSpacing: 2, textTransform: "uppercase" }}>Nylig brukt</div>
              {recentTexts.map((t, i) => (
                <button key={`r${i}`} onClick={() => { setInput(t); setShowBooks(false); }} style={{ background: dark, border: `1px solid ${gold}33`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", textAlign: "left", fontFamily: "'Jost', sans-serif", outline: "none" }}>
                  <div style={{ fontSize: 13, color: cream, fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>"{t}"</div>
                </button>
              ))}
              <div style={{ height: 1, background: brd, margin: "4px 0" }} />
            </>
          )}
          {BOOK_EXCERPTS.map((ex, i) => (
            <button key={i} onClick={() => { setInput(ex.text); setShowBooks(false); }} style={{ background: dark, border: `1px solid ${brd}`, borderRadius: 8, padding: "10px 14px", cursor: "pointer", textAlign: "left", fontFamily: "'Jost', sans-serif", outline: "none" }}>
              <div style={{ fontSize: 11, color: gold, letterSpacing: 1, marginBottom: 4, opacity: 0.8 }}>{ex.book} · {ex.hint}</div>
              <div style={{ fontSize: 14, color: cream, fontStyle: "italic" }}>"{ex.text}"</div>
            </button>
          ))}
        </div>
      )}
      {mode?.id === "muntlig" && (
        <div style={{ background: "rgba(201,168,76,0.06)", borderBottom: `1px solid ${brd}`, padding: "10px 16px", fontSize: 12, color: gold, letterSpacing: 1, textAlign: "center" }}>
          🎙 Trykk på mikrofonen og si svaret på fransk
        </div>
      )}
      <div style={S.msgs}>
        {messages.map((msg, i) => (
          <div key={i} style={msg.role === "user" ? S.user : msg.content.includes("✓ LÆRT:") ? { ...S.ai, border: `1px solid ${grn}66`, background: "rgba(76,175,122,0.08)" } : S.ai}>
            {msg.role === "assistant" && (
              <div style={S.aiLabel}>
                <span>Claude ✦</span>
                <button onClick={() => speak(stripSuggestions(msg.content))} style={{ background: "none", border: "none", color: speaking ? gold : `${gold}88`, fontSize: 14, cursor: "pointer", padding: 0 }}>{speaking ? "⏹" : "🔊"}</button>
              </div>
            )}
            <div style={S.bubbleTxt}>{renderMessage(msg.role === "assistant" ? stripSuggestions(msg.content) : msg.content)}</div>
          </div>
        ))}
        {loading && <div style={S.ai}><div style={S.aiLabel}><span>Claude ✦</span></div><div style={{ display: "flex", gap: 6, fontSize: 28, color: gold, opacity: 0.5 }}><span>·</span><span>·</span><span>·</span></div></div>}
        <div ref={bottomRef} />
      </div>
      {(() => {
        const last = [...messages].reverse().find(m => m.role === "assistant");
        const suggestions = last && !loading ? extractSuggestions(last.content) : [];
        if (!suggestions.length) return null;
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "8px 16px 0", background: card, borderTop: `1px solid ${brd}` }}>
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => send(s)} className="suggestion-chip" style={{ background: "none", border: `1px solid ${gold}55`, borderRadius: 20, color: gold, fontFamily: "'Jost', sans-serif", fontSize: 13, padding: "6px 14px", cursor: "pointer", letterSpacing: 0.5 }}>{s}</button>
            ))}
          </div>
        );
      })()}
      <div style={S.inputArea}>
        {micBtn}
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey} placeholder={listening ? "Lytter..." : "Skriv eller snakk..."} className="input-glow" style={{ ...S.textarea, borderColor: listening ? gold : brd }} rows={2} />
        <button onClick={() => send()} disabled={loading || !input.trim()} style={S.sendBtn(loading || !input.trim())}>Send</button>
      </div>
      <BottomNav />
    </div>
  );

  // --- Home screen ---
  return (
    <div style={{ minHeight: "100dvh", background: dark, color: cream, fontFamily: "'Jost', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", padding: 0 }}>
      {showExitDialog && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: card, border: `1px solid ${gold}55`, borderRadius: 20, padding: "32px 28px", maxWidth: 320, width: "100%", textAlign: "center", boxShadow: "0 8px 40px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🗼</div>
            <div style={{ fontSize: 17, color: cream, lineHeight: 1.5, marginBottom: 24, fontStyle: exitPhraseIdx % 2 === 1 ? "italic" : "normal" }}>
              {EXIT_PHRASES[exitPhraseIdx]}
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setShowExitDialog(false)} className="btn-shine" style={{ background: `linear-gradient(135deg, #d98a4a, ${gold})`, border: "none", borderRadius: 14, color: dark, fontFamily: "'Jost', sans-serif", fontWeight: "500", fontSize: 15, padding: "12px 24px", cursor: "pointer" }}>Bli værende</button>
              <button onClick={() => { setShowExitDialog(false); history.back(); }} style={{ background: "none", border: `1px solid ${red}55`, borderRadius: 14, color: red, fontFamily: "'Jost', sans-serif", fontSize: 15, padding: "12px 24px", cursor: "pointer" }}>Avslutt</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ width: "100%", height: 4, background: "linear-gradient(to right, #002395 33.33%, #ffffff 33.33%, #ffffff 66.66%, #ED2939 66.66%)", flexShrink: 0 }} />
      {offlineBanner}
      <div style={{ width: "100%", background: "linear-gradient(150deg, #c8935a 0%, #7a3e18 100%)", padding: "52px 16px 44px", textAlign: "center", color: "white" }}>
        <div style={{ fontSize: 11, letterSpacing: 7, marginBottom: 18, opacity: 0.75, textTransform: "uppercase", fontWeight: 300 }}>Paris · Aujourd'hui</div>
        <h1 style={{ fontSize: 48, fontWeight: "normal", letterSpacing: 5, color: "white", margin: "0 0 8px", fontStyle: "italic", fontFamily: "'Playfair Display', Georgia, serif" }}>Mon Français</h1>
        <p style={{ fontSize: 12, letterSpacing: 4, textTransform: "uppercase", margin: 0, opacity: 0.8, fontWeight: 300 }}>Lær fransk på din måte</p>
      </div>
      <div style={{ padding: "0 16px 80px", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>

      <div style={{ display: "flex", alignItems: "center", background: card, border: `0.5px solid ${brd}`, borderRadius: 18, padding: "12px 24px", marginBottom: 24, gap: 0, width: "100%", maxWidth: 420, marginTop: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
        <button onClick={() => setShowWords(true)} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "center", flex: 1, padding: 0 }}>
          <div style={{ fontSize: 26, color: gold, fontStyle: "italic" }}>{words.length}</div>
          <div style={{ fontSize: 11, color: "rgba(29,22,16,0.45)", letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>ord lært</div>
        </button>
        <div style={{ width: 1, height: 36, background: brd }} />
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 26, color: gold, fontStyle: "italic" }}>{streak}</div>
          <div style={{ fontSize: 11, color: "rgba(29,22,16,0.45)", letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>🔥 dager</div>
        </div>
        <div style={{ width: 1, height: 36, background: brd }} />
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 26, color: gold, fontStyle: "italic" }}>{sessionMsgs}</div>
          <div style={{ fontSize: 11, color: "rgba(29,22,16,0.45)", letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>svar i dag</div>
        </div>
      </div>

      <div className="fade-stagger" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", maxWidth: 420, marginBottom: 20 }}>
        {(() => {
          const dagensDone = (() => { try { const s = JSON.parse(localStorage.getItem(DAGENS_KEY) || "{}"); return s.date === todayStr() && s.phase2done; } catch { return false; } })();
          const modeColors = {
            dagens:     "#7a4828",
            quiz:       "#3d5a35",
            grammatikk: "#2a4848",
            muntlig:    "#2a3d60",
            teksthjelp: "#4a5828",
            fri:        "#7a3828",
          };
          return MODES.map((m, idx) => {
            const bg = modeColors[m.id] || gold;
            return (
              <button key={m.id} onClick={() => startMode(m)}
                className="mode-card-hover btn-shine"
                style={{ background: bg, border: "none", borderRadius: 18, padding: "20px 16px 18px", cursor: "pointer", textAlign: "left", color: "white", fontFamily: "'Jost', sans-serif", outline: "none", display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start", position: "relative", boxShadow: "0 6px 24px rgba(0,0,0,0.18)", minHeight: 132, gridColumn: idx === MODES.length - 1 && MODES.length % 2 !== 0 ? "1 / -1" : undefined }}>
                <div style={{ fontSize: 22, lineHeight: 1, opacity: 0.65, marginBottom: 2 }}>{m.icon}</div>
                <div style={{ fontSize: 17, fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontWeight: "normal", lineHeight: 1.2, flex: 1 }}>{m.label}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.4, fontWeight: 300, marginTop: 2 }}>{m.desc}</div>
                {m.id === "quiz" && dueCount > 0 && <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,0.25)", color: "white", borderRadius: 10, fontSize: 10, fontWeight: "bold", padding: "2px 7px" }}>{dueCount}</div>}
                {m.id === "dagens" && dagensDone && <div style={{ position: "absolute", top: 10, right: 10, color: "rgba(255,255,255,0.8)", fontSize: 14 }}>✓</div>}
              </button>
            );
          });
        })()}
      </div>

      {noWordsMsg && (
        <div style={{ color: `${cream}88`, fontSize: 13, textAlign: "center", marginBottom: 12 }}>
          Alle ord er mestret! Kom tilbake i morgen for neste runde.
        </div>
      )}

      <div style={{ textAlign: "center", width: "100%", maxWidth: 420, marginTop: 8 }}>
        <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${brd}, transparent)`, marginBottom: 14 }} />
        <p style={{ fontSize: 11, letterSpacing: 4, color: `${gold}66`, textTransform: "uppercase", margin: 0 }}>1920 · Paris · Maintenant</p>
      </div>
      </div>
      <BottomNav />
    </div>
  );
}
