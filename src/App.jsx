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

QUIZ: Format: GLOSE: [fr] = [no] ([uttale]). Still spørsmål, gi tilbakemelding. Ved riktig svar: ✓ LÆRT: [fr] = [no] ([uttale]) — gi neste ord. Ved feil: ✗ FEIL: [riktig svar] — vent på nytt forsøk, ikke gå videre.
SAMTALE: Spill franskmannen Pierre. Start på norsk, innfør gradvis mer og mer fransk.
LESEHJELP: Bryt ned setningen ord for ord med oversettelse og enkel grammatikk.
MUNTLIG: Gi én kort norsk setning eleven skal oversette til fransk. Ved riktig svar: ✓ LÆRT: [fr] = [no] ([uttale]) — gi neste setning. Ved feil: ✗ FEIL: [riktig versjon med fonetikk] — vent på nytt forsøk, ikke gå videre.`;

const BOOK_EXCERPTS = [
  { book: "Houellebecq", hint: "Om en enkel dag", text: "Il faisait beau, le ciel était bleu." },
  { book: "Houellebecq", hint: "En filosofisk observasjon", text: "La vie est simple quand on ne pense pas trop." },
  { book: "Paris 1920", hint: "Kunstnernes møtesteder", text: "Les artistes se retrouvaient dans les cafés de Montparnasse." },
  { book: "Paris 1920", hint: "Paris som kunstnerby", text: "Paris était la capitale du monde de l'art dans les années vingt." },
  { book: "Paris 1920", hint: "Jazzens ankomst", text: "Le jazz américain est arrivé à Paris après la guerre." },
];

const MODES = [
  { id: "quiz", label: "Glosekort", icon: "◈", desc: "Test deg selv på ord og fraser" },
  { id: "samtale", label: "Samtale", icon: "◉", desc: "Øv med en virtuell franskmann" },
  { id: "muntlig", label: "Muntlig", icon: "◎", desc: "Snakk fransk — få direkte korreksjon" },
  { id: "lesehjelp", label: "Lesehjelp", icon: "◫", desc: "Forstå setninger fra bøkene dine" },
  { id: "fri", label: "Spør fritt", icon: "✦", desc: "Still spørsmål om fransk" },
  { id: "repetisjon", label: "Repetisjon", icon: "↻", desc: "Øv på ord du er i ferd med å glemme" },
];

const STARTER = {
  quiz: "Vil du øve på hverdagsord, mat og drikke, Paris på 1920-tallet, eller skal jeg velge?",
  samtale: "Bonjour! (bånsjur) Jeg er Pierre. Vi starter på norsk, men jeg innfører gradvis mer fransk. Fortell meg litt om deg selv!",
  muntlig: "La oss øve på å snakke! Jeg gir deg en norsk setning — du oversetter og sier den på fransk. Trykk på mikrofonen og si svaret høyt.\n\nFørste setning: «Jeg heter Peter og jeg bor i Norge.»",
  lesehjelp: "Lim inn en setning fra en av bøkene dine, eller velg en fra boksamlingen nedenfor.",
  fri: "Hva lurer du på om fransk?",
};

const SPEECH_LANG = { samtale: "fr-FR", muntlig: "fr-FR" };
const SR_INTERVALS = [1, 2, 4, 8, 16, 32];
const WORDS_KEY = "fransk-laering-ord-v2";
const STREAK_KEY = "fransk-streak";

const gold = "#C9A84C", dark = "#0F0E0B", cream = "#F5F0E8", card = "#1A1810", brd = "#2E2B22", grn = "#4CAF7A", red = "#C47A5A";

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

function renderMessage(text) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("✓ LÆRT:")) return <div key={i} style={{ color: grn, fontWeight: "bold", margin: "4px 0", fontSize: 14 }}>{line}</div>;
    if (line.startsWith("✗ FEIL:")) return <div key={i} style={{ color: red, fontWeight: "bold", margin: "4px 0", fontSize: 14 }}>{line}</div>;
    if (line.startsWith("GLOSE:")) return <div key={i} style={{ background: "rgba(201,168,76,0.08)", borderLeft: `3px solid ${gold}`, padding: "6px 10px", margin: "6px 0", borderRadius: "0 8px 8px 0", fontSize: 14 }}>{line}</div>;
    return <div key={i} style={{ minHeight: line === "" ? 10 : "auto" }}>{line}</div>;
  });
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [mode, setMode] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [words, setWords] = useState(loadWords);
  const [streak, setStreak] = useState(() => loadStreak().current);
  const [showWords, setShowWords] = useState(false);
  const [showBooks, setShowBooks] = useState(false);
  const [sessionMsgs, setSessionMsgs] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [listening, setListening] = useState(false);
  const [noWordsMsg, setNoWordsMsg] = useState(false);
  // Review state
  const [reviewQueue, setReviewQueue] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [cardRevealed, setCardRevealed] = useState(false);
  const [reviewStats, setReviewStats] = useState({ correct: 0, wrong: 0 });
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => { saveWords(words); }, [words]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  useEffect(() => {
    messages.forEach(msg => {
      if (msg.role === "assistant") {
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

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "fr-FR";
    utt.rate = 0.85;
    window.speechSynthesis.speak(utt);
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

  const startMode = (m) => {
    if (m.id === "repetisjon") {
      const due = getDue(words);
      if (due.length === 0) { setNoWordsMsg(true); setTimeout(() => setNoWordsMsg(false), 3000); return; }
      setReviewQueue(due);
      setCurrentCard(due[0]);
      setCardRevealed(false);
      setReviewStats({ correct: 0, wrong: 0 });
      setScreen("review");
      return;
    }
    setMode(m); setMessages([{ role: "assistant", content: STARTER[m.id] }]); setScreen("chat"); setShowBooks(false);
  };

  const send = async (override) => {
    const text = (override || input).trim();
    if (!text || loading) return;
    setInput("");
    if (sessionMsgs === 0) setStreak(touchStreak());
    const next = [...messages, { role: "user", content: text }];
    setMessages(next); setLoading(true); setSessionMsgs(s => s + 1);
    const wordCtx = words.length > 0 ? `\nKan allerede: ${words.map(w => w.fr).join(", ")}` : "";
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
      const reply = data.content?.find(b => b.type === "text")?.text || (data.error ? `Feil: ${data.error.message}` : "Noe gikk galt.");
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Kunne ikke koble til. Prøv igjen." }]);
    }
    setLoading(false);
  };

  const answerCard = (correct) => {
    const { level: newLevel, nextReview } = scheduleNext(currentCard.level, correct);
    setWords(prev => prev.map(w => w.id === currentCard.id ? { ...w, level: newLevel, nextReview } : w));
    const newStats = { correct: reviewStats.correct + (correct ? 1 : 0), wrong: reviewStats.wrong + (correct ? 0 : 1) };
    setReviewStats(newStats);
    if (sessionMsgs === 0 && newStats.correct + newStats.wrong === 1) setStreak(touchStreak());
    const remaining = reviewQueue.slice(1);
    if (remaining.length === 0) { setScreen("home"); return; }
    setReviewQueue(remaining);
    setCurrentCard(remaining[0]);
    setCardRevealed(false);
  };

  const clearWords = () => { setWords([]); localStorage.removeItem(WORDS_KEY); localStorage.removeItem("fransk-laering-ord"); };
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
    page: { display: "flex", flexDirection: "column", height: "100dvh", background: dark, fontFamily: "'Georgia', serif", color: cream },
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${brd}`, background: card },
    backBtn: { background: "none", border: "none", color: gold, fontSize: 14, cursor: "pointer", fontFamily: "'Georgia', serif" },
    title: { display: "flex", alignItems: "center", gap: 8, fontSize: 16, letterSpacing: 2 },
    badge: { background: "none", border: `1px solid ${gold}44`, borderRadius: 20, color: gold, fontSize: 12, padding: "4px 12px", cursor: "pointer", fontFamily: "'Georgia', serif", letterSpacing: 1 },
    msgs: { flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 },
    ai: { alignSelf: "flex-start", maxWidth: "88%", background: card, border: `1px solid ${brd}`, borderRadius: "4px 16px 16px 16px", padding: "12px 16px" },
    user: { alignSelf: "flex-end", maxWidth: "80%", background: "#1E1C12", border: `1px solid ${gold}33`, borderRadius: "16px 4px 16px 16px", padding: "12px 16px", fontSize: 15, lineHeight: 1.6 },
    aiLabel: { fontSize: 10, color: gold, letterSpacing: 2, marginBottom: 6, textTransform: "uppercase", display: "flex", justifyContent: "space-between", alignItems: "center" },
    bubbleTxt: { fontSize: 15, lineHeight: 1.75, color: cream },
    inputArea: { display: "flex", gap: 10, padding: "12px 16px", borderTop: `1px solid ${brd}`, background: card, alignItems: "flex-end" },
    textarea: { flex: 1, background: dark, border: `1px solid ${brd}`, borderRadius: 10, color: cream, fontFamily: "'Georgia', serif", fontSize: 15, padding: "10px 14px", resize: "none", outline: "none", lineHeight: 1.5 },
    sendBtn: (d) => ({ background: gold, border: "none", borderRadius: 10, color: dark, fontFamily: "'Georgia', serif", fontWeight: "bold", fontSize: 14, padding: "10px 18px", cursor: d ? "default" : "pointer", letterSpacing: 1, whiteSpace: "nowrap", opacity: d ? 0.4 : 1 }),
  };

  // --- Words screen ---
  if (showWords) return (
    <div style={S.page}>
      <div style={S.header}>
        <button onClick={() => setShowWords(false)} style={S.backBtn}>← Tilbake</button>
        <div style={S.title}><span style={{ color: gold }}>◈</span> Ordsamlingen din</div>
        <div style={{ fontSize: 11, color: `${gold}88`, letterSpacing: 1 }}>{words.length} ord</div>
      </div>
      <div style={{ padding: "24px 16px", flex: 1, overflowY: "auto" }}>
        {words.length === 0
          ? <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "50vh" }}>
              <div style={{ fontSize: 40, opacity: 0.3, marginBottom: 16 }}>◎</div>
              <p style={{ color: "rgba(245,240,232,0.35)", textAlign: "center", lineHeight: 1.9 }}>Ingen ord lagret ennå.<br />Øv på Glosekort, så lagres ordene automatisk her.</p>
            </div>
          : <>
              <p style={{ fontSize: 12, color: `${gold}88`, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>Lagret på denne enheten ✦</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {words.map((w, i) => (
                  <div key={i} style={{ background: card, border: `1px solid ${brd}`, borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ color: grn, marginRight: 6 }}>✓</span>
                      <span style={{ fontSize: 14 }}>{w.fr}</span>
                      {w.no && <span style={{ color: `${cream}66`, fontSize: 13 }}> = {w.no}</span>}
                      {w.phonetic && <span style={{ color: `${gold}88`, fontSize: 12 }}> ({w.phonetic})</span>}
                    </div>
                    <div style={{ fontSize: 10, color: `${gold}55`, letterSpacing: 1 }}>niv. {w.level}</div>
                  </div>
                ))}
              </div>
            </>
        }
      </div>
      {words.length > 0 && (
        <div style={{ padding: "0 16px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={copyWords} style={{ background: copied ? grn : "none", border: `1px solid ${copied ? grn : gold}88`, borderRadius: 8, color: copied ? dark : gold, fontFamily: "'Georgia', serif", fontSize: 13, padding: "12px 20px", cursor: "pointer", width: "100%", transition: "all 0.3s", fontWeight: copied ? "bold" : "normal" }}>
            {copied ? "✓ Kopiert!" : "Kopier ordlisten min"}
          </button>
          <button onClick={clearWords} style={{ background: "none", border: `1px solid ${red}55`, borderRadius: 8, color: red, fontFamily: "'Georgia', serif", fontSize: 13, padding: "10px 20px", cursor: "pointer", width: "100%" }}>
            Nullstill ordliste
          </button>
        </div>
      )}
    </div>
  );

  // --- Review screen ---
  if (screen === "review" && currentCard) {
    const total = reviewStats.correct + reviewStats.wrong + reviewQueue.length;
    const done = reviewStats.correct + reviewStats.wrong;
    return (
      <div style={S.page}>
        <div style={S.header}>
          <button onClick={() => setScreen("home")} style={S.backBtn}>← Tilbake</button>
          <div style={S.title}><span style={{ color: gold }}>↻</span> Repetisjon</div>
          <div style={{ fontSize: 11, color: `${gold}88`, letterSpacing: 1 }}>{done}/{total}</div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", gap: 20 }}>
          <div style={{ fontSize: 11, color: `${gold}66`, letterSpacing: 2, textTransform: "uppercase" }}>
            {currentCard.no ? "Hva er norsk for:" : "Hva betyr:"}
          </div>
          <div style={{ background: card, border: `1px solid ${brd}`, borderRadius: 16, padding: "32px 40px", textAlign: "center", width: "100%", maxWidth: 340 }}>
            <div style={{ fontSize: 32, color: cream, fontStyle: "italic", marginBottom: 8 }}>{currentCard.fr}</div>
            {currentCard.phonetic && <div style={{ fontSize: 14, color: gold, opacity: 0.7 }}>({currentCard.phonetic})</div>}
            <button onClick={() => speak(currentCard.fr)} style={{ background: "none", border: "none", color: `${gold}88`, fontSize: 18, cursor: "pointer", marginTop: 8 }}>🔊</button>
          </div>

          {!cardRevealed
            ? <button onClick={() => setCardRevealed(true)} style={{ background: "none", border: `1px solid ${gold}66`, borderRadius: 10, color: gold, fontFamily: "'Georgia', serif", fontSize: 15, padding: "14px 40px", cursor: "pointer", letterSpacing: 1 }}>
                Vis svar
              </button>
            : <>
                <div style={{ background: "#1a2a1a", border: `1px solid ${grn}44`, borderRadius: 12, padding: "16px 24px", textAlign: "center", width: "100%", maxWidth: 340 }}>
                  <div style={{ fontSize: 13, color: grn, letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>Svar</div>
                  <div style={{ fontSize: 22, color: cream }}>{currentCard.no || "—"}</div>
                </div>
                <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 340 }}>
                  <button onClick={() => answerCard(false)} style={{ flex: 1, background: "none", border: `1px solid ${red}88`, borderRadius: 10, color: red, fontFamily: "'Georgia', serif", fontSize: 15, padding: "14px", cursor: "pointer" }}>✗ Feil</button>
                  <button onClick={() => answerCard(true)} style={{ flex: 1, background: grn, border: "none", borderRadius: 10, color: dark, fontFamily: "'Georgia', serif", fontSize: 15, padding: "14px", cursor: "pointer", fontWeight: "bold" }}>✓ Riktig</button>
                </div>
              </>
          }

          <div style={{ display: "flex", gap: 8 }}>
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i < reviewStats.correct ? grn : i < done ? red : `${brd}` }} />
            ))}
          </div>
        </div>
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
      {mode?.id === "lesehjelp" && (
        <button onClick={() => setShowBooks(b => !b)} style={{ background: "rgba(201,168,76,0.06)", border: "none", borderBottom: `1px solid ${brd}`, color: gold, fontFamily: "'Georgia', serif", fontSize: 13, padding: "10px 16px", cursor: "pointer", textAlign: "left", letterSpacing: 1, width: "100%" }}>
          {showBooks ? "▲ Lukk boksamling" : "▼ Velg setning fra bøkene dine"}
        </button>
      )}
      {showBooks && (
        <div style={{ background: card, borderBottom: `1px solid ${brd}`, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflowY: "auto" }}>
          {BOOK_EXCERPTS.map((ex, i) => (
            <button key={i} onClick={() => { setInput(ex.text); setShowBooks(false); }} style={{ background: dark, border: `1px solid ${brd}`, borderRadius: 8, padding: "10px 14px", cursor: "pointer", textAlign: "left", fontFamily: "'Georgia', serif", outline: "none" }}>
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
          <div key={i} style={msg.role === "user" ? S.user : S.ai}>
            {msg.role === "assistant" && (
              <div style={S.aiLabel}>
                <span>Claude ✦</span>
                <button onClick={() => speak(msg.content)} style={{ background: "none", border: "none", color: `${gold}88`, fontSize: 14, cursor: "pointer", padding: 0 }}>🔊</button>
              </div>
            )}
            <div style={S.bubbleTxt}>{renderMessage(msg.content)}</div>
          </div>
        ))}
        {loading && <div style={S.ai}><div style={S.aiLabel}><span>Claude ✦</span></div><div style={{ display: "flex", gap: 6, fontSize: 28, color: gold, opacity: 0.5 }}><span>·</span><span>·</span><span>·</span></div></div>}
        <div ref={bottomRef} />
      </div>
      <div style={S.inputArea}>
        {micBtn}
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey} placeholder={listening ? "Lytter..." : "Skriv eller snakk..."} style={{ ...S.textarea, borderColor: listening ? gold : brd }} rows={2} />
        <button onClick={() => send()} disabled={loading || !input.trim()} style={S.sendBtn(loading || !input.trim())}>Send</button>
      </div>
    </div>
  );

  // --- Home screen ---
  return (
    <div style={{ minHeight: "100dvh", background: dark, color: cream, fontFamily: "'Georgia', serif", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 16px 40px", position: "relative", overflow: "hidden" }}>
      {offlineBanner}
      <div style={{ position: "fixed", top: -100, right: -100, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -80, left: -80, width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ textAlign: "center", paddingTop: 48, paddingBottom: 32 }}>
        <div style={{ color: gold, fontSize: 14, letterSpacing: 8, marginBottom: 16, opacity: 0.7 }}>✦ ✦ ✦</div>
        <h1 style={{ fontSize: 44, fontWeight: "normal", letterSpacing: 6, color: cream, margin: "0 0 10px", fontStyle: "italic" }}>Mon Français</h1>
        <p style={{ fontSize: 13, color: gold, letterSpacing: 3, textTransform: "uppercase", margin: "0 0 24px", opacity: 0.85 }}>Lær fransk på din måte</p>
        <div style={{ width: 120, height: 1, background: `linear-gradient(to right, transparent, ${gold}, transparent)`, margin: "0 auto" }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", background: card, border: `1px solid ${brd}`, borderRadius: 12, padding: "12px 24px", marginBottom: 24, gap: 0, width: "100%", maxWidth: 420 }}>
        <button onClick={() => setShowWords(true)} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "center", flex: 1, padding: 0 }}>
          <div style={{ fontSize: 26, color: gold, fontStyle: "italic" }}>{words.length}</div>
          <div style={{ fontSize: 11, color: "rgba(245,240,232,0.4)", letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>ord lært</div>
        </button>
        <div style={{ width: 1, height: 36, background: brd }} />
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 26, color: gold, fontStyle: "italic" }}>{streak}</div>
          <div style={{ fontSize: 11, color: "rgba(245,240,232,0.4)", letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>🔥 dager</div>
        </div>
        <div style={{ width: 1, height: 36, background: brd }} />
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 26, color: gold, fontStyle: "italic" }}>{sessionMsgs}</div>
          <div style={{ fontSize: 11, color: "rgba(245,240,232,0.4)", letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>svar i dag</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, width: "100%", maxWidth: 420, marginBottom: 20 }}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => startMode(m)} style={{ background: card, border: `1px solid ${m.id === "repetisjon" && dueCount > 0 ? gold + "88" : brd}`, borderRadius: 12, padding: "22px 16px", cursor: "pointer", textAlign: "center", color: cream, fontFamily: "'Georgia', serif", outline: "none", display: "flex", flexDirection: "column", gap: 8, alignItems: "center", position: "relative" }}>
            <div style={{ fontSize: 28, color: gold, lineHeight: 1 }}>{m.icon}</div>
            <div style={{ fontSize: 15, fontWeight: "bold", letterSpacing: 1 }}>{m.label}</div>
            <div style={{ fontSize: 12, color: "rgba(245,240,232,0.5)", lineHeight: 1.4 }}>{m.desc}</div>
            {m.id === "repetisjon" && dueCount > 0 && (
              <div style={{ position: "absolute", top: 10, right: 10, background: gold, color: dark, borderRadius: 10, fontSize: 10, fontWeight: "bold", padding: "2px 6px" }}>{dueCount}</div>
            )}
          </button>
        ))}
      </div>

      {noWordsMsg && (
        <div style={{ color: `${cream}88`, fontSize: 13, textAlign: "center", marginBottom: 12 }}>
          Ingen ord til repetisjon ennå — øv på Glosekort først
        </div>
      )}

      <div style={{ textAlign: "center", width: "100%", maxWidth: 420, marginTop: 8 }}>
        <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${brd}, transparent)`, marginBottom: 14 }} />
        <p style={{ fontSize: 11, letterSpacing: 4, color: "rgba(201,168,76,0.3)", textTransform: "uppercase", margin: 0 }}>Paris · 1920 · Aujourd'hui</p>
      </div>
    </div>
  );
}
