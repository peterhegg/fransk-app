import { useState, useRef, useEffect } from "react";
import { PROXY_URL, APP_TOKEN } from "../constants.js";
import { shuffle, loadUserProfile, logGrammarSession } from "../utils.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { useVoiceRecognition } from "../hooks/useVoiceRecognition.jsx";

function buildPrompt(words, grammarWords) {
  const allWords = [...words, ...grammarWords];
  if (!allWords.length) return null;
  const sample = shuffle([...allWords]).slice(0, 40);
  const wordList = sample.map(w => `${w.fr} = ${w.no}`).join(", ");
  const count = Math.min(8, Math.max(2, Math.floor(allWords.length / 5)));
  const profile = loadUserProfile();
  return `Du er en fransktutor som lager uttalelsesoppgaver for en norsk A1/A2-elev${profile.dysleksi ? " med dysleksi" : ""}.

ORDBANK (bruk KUN disse franske ordene): ${wordList}

Lag nøyaktig ${count} norske setninger som eleven skal si høyt på fransk.

KRAV:
- KRITISK: Den franske oversettelsen MÅ KUN bruke ord fra ordbanken + konjugerte former av disse + grunnleggende funksjonsord: je, tu, il, elle, nous, vous, ils, elles, le, la, les, l', un, une, des, du, de, et, ou, ne, pas, que, qui, à, en, dans, sur, avec, très, bien, aussi, est, sont, suis, es
- Maks 8 ord per setning, A1/A2-nivå
- Enkle setninger som er lette å uttale

Svar KUN med en gyldig JSON-array, ingen markdown:
[{"no":"norsk setning","fr":"korrekt fransk oversettelse"}]`;
}

function normalizeSentence(s) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,!?;:«»"""]/g, " ")
    .replace(/[''`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function matchSentence(recognized, correctFr) {
  if (!recognized || !correctFr) return { matched: false, score: 0 };
  const corWords = normalizeSentence(correctFr).split(" ").filter(Boolean);
  if (!corWords.length) return { matched: false, score: 0 };
  const tol = (w) => Math.max(1, Math.floor(w.length / 4));

  // Check all alternatives (pipe-separated from recognition engine)
  let bestScore = 0;
  for (const alt of recognized.split("|")) {
    const recWords = normalizeSentence(alt).split(" ").filter(Boolean);
    if (!recWords.length) continue;
    const matched = corWords.filter(cw =>
      recWords.some(rw => rw === cw || levenshtein(rw, cw) <= tol(cw))
    ).length;
    const s = matched / corWords.length;
    if (s > bestScore) bestScore = s;
  }
  return { matched: bestScore >= 0.65, score: bestScore };
}

export default function SaySentenceScreen({ words, grammarWords, isOnline, onBack, speak, speaking, screen, showWords, onNav }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sentences, setSentences] = useState([]);
  const [idx, setIdx] = useState(0);
  const [result, setResult] = useState(null); // null | "correct" | "incorrect"
  const [heard, setHeard] = useState("");
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });
  const [history, setHistory] = useState([]);
  const hasSpoken = useRef(false);
  const abortRef = useRef(null);
  const { status, startListening } = useVoiceRecognition();

  const current = sentences[idx] || null;

  useEffect(() => {
    const allWords = [...(words || []), ...(grammarWords || [])];
    if (!allWords.length) { setLoading(false); setError("no-words"); return; }
    if (!isOnline) { setLoading(false); setError("offline"); return; }
    fetchSentences();
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (current && !hasSpoken.current && !loading) {
      hasSpoken.current = true;
      setTimeout(() => speak(current.fr, 0.8), 400);
    }
  }, [idx, loading, current]);

  const fetchSentences = async () => {
    const prompt = buildPrompt(words || [], grammarWords || []);
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

  const handleListen = () => {
    setResult(null);
    setHeard("");
    startListening((transcript) => {
      const firstAlt = transcript.split("|")[0];
      setHeard(firstAlt);
      const { matched } = matchSentence(transcript, current.fr);
      setResult(matched ? "correct" : "incorrect");
      if (result === null) {
        if (matched) {
          setStats(st => ({ correct: st.correct + 1, wrong: st.wrong }));
          setHistory(h => [...h, "correct"]);
        } else {
          setStats(st => ({ correct: st.correct, wrong: st.wrong + 1 }));
          setHistory(h => [...h, "wrong"]);
        }
      }
    }, {
      continuous: true,
      timeoutMs: 10000,
    });
  };

  const next = () => {
    hasSpoken.current = false;
    setResult(null);
    setHeard("");
    if (idx + 1 >= sentences.length) {
      logGrammarSession();
      setDone(true);
      return;
    }
    setIdx(i => i + 1);
  };

  const isListening = status === "listening";

  const header = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "var(--text)" }}><MicIcon /> Si setningen!</div>
      <div style={{ width: 60 }} />
    </div>
  );

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 66 }}>
      {header}
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
      {header}
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
      {header}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", gap: 20 }}>
        <div style={{ fontSize: 48 }}>🗣️</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: "var(--text)" }}>Bra jobba!</div>
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
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "var(--text)" }}><MicIcon /> Si setningen!</div>
        <div style={{ fontSize: 11, color: "rgba(46,107,230,0.55)", letterSpacing: 1 }}>{idx + 1}/{sentences.length}</div>
      </div>

      <div style={{ height: 3, background: "var(--border)" }}>
        <div style={{ height: "100%", background: "linear-gradient(to right, var(--accent), var(--accent-light))", width: `${((idx + 1) / sentences.length) * 100}%`, transition: "width 0.3s" }} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", gap: 24 }}>
        <div style={{ fontSize: 10, color: "rgba(46,107,230,0.45)", letterSpacing: 2, textTransform: "uppercase" }}>
          Si denne setningen på fransk
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "32px 36px", textAlign: "center", width: "100%", maxWidth: 360, boxShadow: "var(--shadow-md)" }}>
          <div style={{ fontSize: 22, color: "var(--text)", fontFamily: "var(--font-display)", lineHeight: 1.4, marginBottom: 16 }}>{current?.no}</div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={() => speak(current.fr, 0.8)} title="Hør setningen"
              style={{ background: speaking ? "var(--accent-bg)" : "var(--bg)", border: `1.5px solid ${speaking ? "var(--accent)" : "var(--border)"}`, borderRadius: 12, padding: "10px 16px", cursor: "pointer", fontSize: 13, color: "var(--text)", fontFamily: "var(--font-body)", fontWeight: 500 }}>
              🔊 Hør
            </button>
            <button onClick={() => speak(current.fr, 0.4)} title="Sakte"
              style={{ background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: 12, padding: "10px 16px", cursor: "pointer", fontSize: 13, color: "var(--text)", fontFamily: "var(--font-body)", fontWeight: 500 }}>
              🐢 Sakte
            </button>
          </div>
        </div>

        {/* Feedback */}
        {result === "correct" && (
          <div style={{ background: "rgba(34,197,94,0.12)", border: "1.5px solid rgba(34,197,94,0.4)", borderRadius: 14, padding: "14px 24px", textAlign: "center", width: "100%", maxWidth: 360 }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>✅</div>
            <div style={{ fontSize: 15, color: "var(--text)", fontWeight: 600 }}>Riktig uttale!</div>
            {heard && <div style={{ fontSize: 13, color: "var(--text-subtle)", marginTop: 4 }}>Hørte: «{heard}»</div>}
          </div>
        )}
        {result === "incorrect" && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1.5px solid rgba(239,68,68,0.35)", borderRadius: 14, padding: "16px 24px", textAlign: "center", width: "100%", maxWidth: 360 }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>❌</div>
            {heard
              ? <div style={{ fontSize: 13, color: "var(--text-subtle)", marginBottom: 8 }}>Hørte: «{heard}»</div>
              : <div style={{ fontSize: 13, color: "var(--text-subtle)", marginBottom: 8 }}>Ingenting ble fanget opp — si det litt høyere</div>
            }
            <div style={{ fontSize: 14, color: "var(--text)", marginBottom: 4, fontStyle: "italic" }}>{current?.fr}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "center" }}>
              <button onClick={() => speak(current.fr, 0.6)}
                style={{ background: "none", border: "1px solid var(--accent)", borderRadius: 10, padding: "7px 14px", color: "var(--accent)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                🔊 Hør igjen
              </button>
              <button onClick={next}
                style={{ background: "none", border: "1px solid var(--border)", borderRadius: 10, padding: "7px 14px", color: "var(--text-subtle)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)" }}>
                {idx >= sentences.length - 1 ? "Avslutt →" : "Gå videre →"}
              </button>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {result === "correct" ? (
          <button onClick={next} className="btn-shine"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", border: "none", borderRadius: 14, color: "white", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 16, padding: "16px 48px", cursor: "pointer", boxShadow: "0 4px 16px rgba(34,197,94,0.35)" }}>
            {idx >= sentences.length - 1 ? "Ferdig 🎉" : "Neste setning →"}
          </button>
        ) : (
          <button
            onClick={handleListen}
            disabled={isListening}
            style={{
              background: isListening
                ? "rgba(46,107,230,0.15)"
                : "linear-gradient(135deg, var(--accent), var(--accent-light))",
              border: isListening ? "2px solid var(--accent)" : "none",
              borderRadius: 14,
              color: isListening ? "var(--accent)" : "white",
              fontFamily: "var(--font-body)",
              fontWeight: "500",
              fontSize: 16,
              padding: "16px 48px",
              cursor: isListening ? "default" : "pointer",
              boxShadow: isListening ? "none" : "0 4px 16px rgba(46,107,230,0.35)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}>
            {isListening ? (
              <><PulsingDot /> Hører på deg...</>
            ) : (
              <>{result === "incorrect" ? "🎙 Prøv igjen" : "🎙 Si setningen"}</>
            )}
          </button>
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

function PulsingDot() {
  return (
    <span style={{
      display: "inline-block",
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: "var(--accent)",
      animation: "pulse 1s ease-in-out infinite",
    }} />
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="8" y1="22" x2="16" y2="22"/>
    </svg>
  );
}
