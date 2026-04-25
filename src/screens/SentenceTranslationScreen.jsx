import { useState, useRef, useEffect } from "react";
import { PROXY_URL, APP_TOKEN } from "../constants.js";
import { shuffle, checkQuizAnswer, logDailyAnswer, loadUserProfile } from "../utils.jsx";
import BottomNav from "../components/BottomNav.jsx";

function buildSentencePrompt(words, grammarWords) {
  const allWords = [...words, ...grammarWords];
  if (!allWords.length) return null;
  const sample = shuffle([...allWords]).slice(0, 40);
  const wordList = sample.map(w => `${w.fr} = ${w.no}`).join(", ");
  const count = Math.min(10, Math.max(2, Math.floor(allWords.length / 5)));
  const profile = loadUserProfile();
  return `Du er en fransktutor som lager oversettelsesoppgaver for en norsk A1/A2-elev${profile.dysleksi ? " med dysleksi" : ""}.

Elevens ordbank (bruk ord herfra): ${wordList}

Lag nøyaktig ${count} setninger på norsk som eleven skal oversette til fransk. Krav:
- Bruk kun ord fra ordbanken over + grunnleggende grammatikk eleven kan
- Maks 12 ord per setning
- Naturlige, korrekte norske og franske setninger
- Nivå: A1/A2 — enkle, tydelige setninger
- Varier setningstyper (påstand, spørsmål, negasjon)

Svar KUN med en gyldig JSON-array, ingen markdown:
[{"no":"norsk setning","fr":"korrekt fransk oversettelse"}]`;
}

export default function SentenceTranslationScreen({
  words, grammarWords, isOnline, onBack, speak, speaking, screen, showWords, onNav,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sentences, setSentences] = useState([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState(false);
  const [result, setResult] = useState("");
  const [correctFr, setCorrectFr] = useState("");
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });
  const [history, setHistory] = useState([]);
  const [done, setDone] = useState(false);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    const allWords = [...(words || []), ...(grammarWords || [])];
    if (!allWords.length) { setLoading(false); setError("no-words"); return; }
    if (!isOnline) { setLoading(false); setError("offline"); return; }
    fetchSentences(allWords);
    return () => abortRef.current?.abort();
  }, []);

  const fetchSentences = async (allWords) => {
    const prompt = buildSentencePrompt(words || [], grammarWords || []);
    if (!prompt) { setLoading(false); setError("no-words"); return; }
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch(PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-App-Token": APP_TOKEN },
        signal: controller.signal,
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 600,
          system: "You are a French sentence generator. Respond only with a valid JSON array, no markdown.",
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed) && parsed.length) {
          setSentences(parsed.filter(s => s.no && s.fr));
          setLoading(false);
          return;
        }
      }
      setLoading(false); setError("parse");
    } catch (err) {
      if (err.name !== "AbortError") { setLoading(false); setError("network"); }
    }
  };

  const handleFocus = () => {
    setTimeout(() => inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
  };

  const current = sentences[idx];

  const submit = () => {
    if (!input.trim() || !current) return;
    const mockCard = { fr: current.fr, no: current.no };
    const res = checkQuizAnswer(input, mockCard, true);
    const passed = res !== "wrong";
    setChecked(true); setResult(res); setCorrectFr(current.fr);
    setStats(s => ({ correct: s.correct + (passed ? 1 : 0), wrong: s.wrong + (passed ? 0 : 1) }));
    setHistory(h => [...h, passed ? "correct" : "wrong"]);
    logDailyAnswer();
  };

  const next = () => {
    if (idx + 1 >= sentences.length) { setDone(true); return; }
    setIdx(i => i + 1);
    setInput(""); setChecked(false); setResult(""); setCorrectFr("");
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 66 }}>
      <Header onBack={onBack} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 32, opacity: 0.4 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="16" y2="12"/><line x1="3" y1="18" x2="19" y2="18"/>
          </svg>
        </div>
        <div style={{ fontSize: 15, color: "var(--text-subtle)" }}>Genererer setninger fra ordbanken din…</div>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 66 }}>
      <Header onBack={onBack} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 14, color: "var(--text-subtle)", lineHeight: 1.8 }}>
          {error === "no-words" ? "Ingen ord i ordbanken ennå. Gjør Dagens øvelse – glose for å lære dine første ord."
            : error === "offline" ? "Ingen internettforbindelse — Claude er ikke tilgjengelig."
            : "Kunne ikke hente setninger. Prøv igjen."}
        </div>
        <button onClick={onBack} style={{ background: "var(--accent-bg)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--accent)", fontSize: 13, padding: "10px 20px", cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  if (done) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 66 }}>
      <Header onBack={onBack} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", gap: 20 }}>
        <div style={{ fontSize: 48 }}>📝</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: "var(--text)" }}>Runden er ferdig!</div>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ background: "rgba(0,184,148,0.10)", border: "1px solid rgba(0,184,148,0.35)", borderRadius: 16, padding: "18px 24px", textAlign: "center", minWidth: 90 }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: "var(--color-success)" }}>{stats.correct}</div>
            <div style={{ fontSize: 11, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 1, marginTop: 4 }}>Riktige</div>
          </div>
          <div style={{ background: "rgba(225,112,85,0.08)", border: "1px solid rgba(225,112,85,0.3)", borderRadius: 16, padding: "18px 24px", textAlign: "center", minWidth: 90 }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: "var(--color-error)" }}>{stats.wrong}</div>
            <div style={{ fontSize: 11, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 1, marginTop: 4 }}>Feil</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
          {history.map((h, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: h === "correct" ? "var(--color-success)" : "var(--color-error)" }} />
          ))}
        </div>
        <button onClick={onBack} className="btn-shine"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-light))", border: "none", borderRadius: 14, color: "white", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 15, padding: "14px 40px", cursor: "pointer", marginTop: 8 }}>
          Tilbake til hjem
        </button>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 66 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "var(--text)" }}>
          <SentenceIcon /> Oversett setningen
        </div>
        <div style={{ fontSize: 11, color: "rgba(46,107,230,0.55)", letterSpacing: 1 }}>{idx + 1}/{sentences.length}</div>
      </div>

      <div style={{ height: 3, background: "var(--border)" }}>
        <div style={{ height: "100%", background: "linear-gradient(to right, var(--accent), var(--accent-light))", width: `${((idx + 1) / sentences.length) * 100}%`, transition: "width 0.3s" }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", gap: 20 }}>
        <div style={{ fontSize: 10, color: "rgba(46,107,230,0.45)", letterSpacing: 2, textTransform: "uppercase" }}>
          Oversett til fransk
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 32px", textAlign: "center", width: "100%", maxWidth: 360, boxShadow: "var(--shadow-md)" }}>
          <div style={{ fontSize: 24, color: "var(--text)", fontFamily: "var(--font-display)", lineHeight: 1.4 }}>{current?.no}</div>
        </div>

        {!checked ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 360 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              onFocus={handleFocus}
              placeholder="Skriv den franske setningen her..."
              className="input-glow"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 15, padding: "14px 16px", outline: "none", textAlign: "center" }}
            />
            <button onClick={submit} disabled={!input.trim()} className={input.trim() ? "btn-shine" : ""}
              style={{ background: input.trim() ? "linear-gradient(135deg, var(--accent), var(--accent-light))" : "var(--accent-bg)", border: "none", borderRadius: 14, color: input.trim() ? "white" : "var(--text-subtle)", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 15, padding: "14px", cursor: input.trim() ? "pointer" : "default" }}>
              Sjekk svar
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 360, alignItems: "center" }}>
            {result === "correct" && (
              <div style={{ background: "rgba(0,184,148,0.10)", border: "1px solid rgba(0,184,148,0.35)", borderRadius: 12, padding: "14px 20px", textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: 15, color: "var(--color-success)", fontWeight: "bold" }}>✓ Riktig!</div>
              </div>
            )}
            {result === "close" && (
              <div style={{ background: "rgba(46,107,230,0.07)", border: "1px solid rgba(46,107,230,0.2)", borderRadius: 12, padding: "14px 20px", textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: 15, color: "var(--accent)", fontWeight: "bold", marginBottom: 6 }}>~ Nesten riktig!</div>
                <div style={{ fontSize: 13, color: "var(--text-subtle)", marginBottom: 4 }}>Du svarte: <em>{input}</em></div>
                <div style={{ fontSize: 14, color: "var(--text)" }}>Fasit: <strong>{correctFr}</strong></div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8 }}>
                  <button onClick={() => speak(correctFr)} style={{ background: "none", border: "none", color: "rgba(46,107,230,0.55)", fontSize: 18, cursor: "pointer" }}>🔊</button>
                </div>
              </div>
            )}
            {result === "wrong" && (
              <div style={{ background: "rgba(225,112,85,0.08)", border: "1px solid rgba(225,112,85,0.3)", borderRadius: 12, padding: "14px 20px", textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: 15, color: "var(--color-error)", fontWeight: "bold", marginBottom: 6 }}>Prøv igjen neste gang</div>
                <div style={{ fontSize: 13, color: "var(--text-subtle)", marginBottom: 4 }}>Du svarte: <em>{input}</em></div>
                <div style={{ fontSize: 14, color: "var(--text)", marginBottom: 4 }}>Fasit: <strong>{correctFr}</strong></div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button onClick={() => speak(correctFr)} style={{ background: "none", border: "none", color: "rgba(46,107,230,0.55)", fontSize: 18, cursor: "pointer" }}>🔊</button>
                  <button onClick={() => speak(correctFr, 0.4)} style={{ background: "none", border: "none", color: "rgba(46,107,230,0.55)", fontSize: 18, cursor: "pointer" }}>🐢</button>
                </div>
              </div>
            )}
            <button onClick={next} className="btn-shine"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-light))", border: "none", borderRadius: 14, color: "white", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 15, padding: "14px 40px", cursor: "pointer" }}>
              {idx >= sentences.length - 1 ? "Se resultat" : "Neste setning →"}
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
          {history.map((h, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: h === "correct" ? "var(--color-success)" : "var(--color-error)" }} />
          ))}
        </div>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}

function Header({ onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "var(--text)" }}><SentenceIcon /> Oversett setningen</div>
      <div style={{ width: 60 }} />
    </div>
  );
}

function SentenceIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="16" y2="12"/><line x1="3" y1="18" x2="19" y2="18"/>
    </svg>
  );
}
