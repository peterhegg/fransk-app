import { SpeakButton } from "../components/AudioControls.jsx";
import { useState, useRef, useEffect } from "react";
import { PROXY_URL, APP_TOKEN } from "../constants.js";
import { shuffle, logDailyAnswer, loadUserProfile } from "../utils.jsx";
import BottomNav from "../components/BottomNav.jsx";

function levelInstructions(level) {
  const l = level || "A1/A2";
  if (l === "A1") return "Maks 6 ord per setning. Kun presens, enkle pronomen, ingen negasjon.";
  if (l === "A1/A2") return "Maks 8 ord per setning. Presens, enkel negasjon, vanlige pronomen.";
  if (l === "A2") return "Maks 9 ord. Presens og passé composé, negasjon, spørsmål.";
  if (l === "A2/B1") return "10-12 ord. Bruk passé composé, imparfait og enkle konjunksjoner som parce que/mais.";
  if (l === "B1") return "10-14 ord. Bruk imparfait, futur simple, pronominale verb og objektpronomen (le/la/les/lui/leur).";
  if (l === "B1/B2") return "12-15 ord. Bruk futur antérieur, kondisjonalis, relativsetninger med qui/que/dont.";
  if (l === "B2") return "Komplekse setninger. Subjonctif, kondisjonalis, passiv, indirekte tale.";
  return "14+ ord. Avansert grammatikk: subjonctif, passiv, inversjon, litterær stil.";
}

function buildSentencePrompt(words, grammarWords) {
  const allWords = [...words, ...grammarWords];
  if (!allWords.length) return null;
  const sample = shuffle([...allWords]).slice(0, 40);
  const wordList = sample.map(w => `${w.fr} = ${w.no}`).join(", ");
  const count = Math.min(10, Math.max(2, Math.floor(allWords.length / 5)));
  const profile = loadUserProfile();
  const lvl = profile.level || "A1/A2";
  const lvlInstr = levelInstructions(lvl);
  return `Du er en fransktutor som lager oversettelsesoppgaver for en norsk ${lvl}-elev${profile.dysleksi ? " med dysleksi" : ""}.

ORDBANK (bruk KUN disse franske ordene + konjugerte former + funksjonsord): ${wordList}

Lag nøyaktig ${count} norske setninger som eleven skal oversette til fransk.

NIVÅKRAV (${lvl}): ${lvlInstr}
- Naturlige, korrekte norske og franske setninger
- Varier setningstyper (påstand, spørsmål, negasjon)

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

function wordLevenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function checkSentenceAnswer(input, correctFr) {
  const inp = normalizeSentence(input);
  const cor = normalizeSentence(correctFr);

  if (inp === cor) return { result: "correct", explanation: "" };

  const inpWords = inp.split(" ").filter(Boolean);
  const corWords = cor.split(" ").filter(Boolean);
  const tol = (w) => Math.max(1, Math.floor(w.length / 5));

  const missing = corWords.filter(cw => !inpWords.some(iw => iw === cw || wordLevenshtein(iw, cw) <= tol(cw)));
  const extra = inpWords.filter(iw => !corWords.some(cw => iw === cw || wordLevenshtein(iw, cw) <= tol(cw)));
  const matchRatio = (corWords.length - missing.length) / Math.max(corWords.length, 1);

  const parts = [];
  if (missing.length) parts.push(`Mangler: «${missing.join(" ")}»`);
  if (extra.length) parts.push(`Ekstra ord: «${extra.join(" ")}»`);
  if (!parts.length) parts.push("Feil rekkefølge på ordene");
  const explanation = parts.join(" · ");

  if (matchRatio >= 0.85) return { result: "close", explanation };
  return { result: "wrong", explanation };
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
  const [explanation, setExplanation] = useState("");
  const [aiHint, setAiHint] = useState(null);
  const [aiHintLoading, setAiHintLoading] = useState(false);
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });
  const [history, setHistory] = useState([]);
  const [done, setDone] = useState(false);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const hintAbortRef = useRef(null);

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

  const fetchAiHint = async (noSentence, frSentence, userInput, wordDiff) => {
    if (!isOnline) return;
    hintAbortRef.current?.abort();
    const controller = new AbortController();
    hintAbortRef.current = controller;
    setAiHintLoading(true);
    setAiHint(null);
    try {
      const res = await fetch(PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-App-Token": APP_TOKEN },
        signal: controller.signal,
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 250,
          system: "You are a French tutor. Respond only with a valid JSON object, no markdown.",
          messages: [{ role: "user", content: (() => {
            const profile = loadUserProfile();
            return `Norsk ${profile.level || "A1/A2"}-elev oversatte en setning feil.\nNorsk: "${noSentence}"\nKorrekt fransk: "${frSentence}"\nEleven svarte: "${userInput}"${wordDiff ? `\nFeil: ${wordDiff}` : ""}\n\nForklar på norsk (2 korte setninger) SPESIFIKT hva som er galt for akkurat disse ordene — ikke generelle regler. Gi én huskeregel knyttet til akkurat disse ordene/strukturen i denne setningen.\nSvar KUN som JSON: {"forklaring":"...","huskeregel":"..."}`;
          })() }],
        }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      const match = text.match(/\{[\s\S]*?\}/);
      if (match) setAiHint(JSON.parse(match[0]));
    } catch {}
    setAiHintLoading(false);
  };

  const submit = () => {
    if (!input.trim() || !current) return;
    const { result: res, explanation: exp } = checkSentenceAnswer(input, current.fr);
    const passed = res !== "wrong";
    setChecked(true); setResult(res); setCorrectFr(current.fr); setExplanation(exp);
    setStats(s => ({ correct: s.correct + (passed ? 1 : 0), wrong: s.wrong + (passed ? 0 : 1) }));
    setHistory(h => [...h, passed ? "correct" : "wrong"]);
    logDailyAnswer("grammar");
  };

  const next = () => {
    if (idx + 1 >= sentences.length) { setDone(true); return; }
    setIdx(i => i + 1);
    setInput(""); setChecked(false); setResult(""); setCorrectFr(""); setExplanation(""); setAiHint(null); setAiHintLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 0 }}>
      <Header onBack={onBack} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 32, opacity: 0.4 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--cream)" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="16" y2="12"/><line x1="3" y1="18" x2="19" y2="18"/>
          </svg>
        </div>
        <div style={{ fontSize: 15, color: "var(--text-subtle)" }}>Genererer setninger fra ordbanken din…</div>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 0 }}>
      <Header onBack={onBack} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 14, color: "var(--text-subtle)", lineHeight: 1.8 }}>
          {error === "no-words" ? "Ingen ord i ordbanken ennå. Gjør Dagens øvelse – glose for å lære dine første ord."
            : error === "offline" ? "Ingen internettforbindelse — Claude er ikke tilgjengelig."
            : "Kunne ikke hente setninger. Prøv igjen."}
        </div>
        <button onClick={onBack} style={{ background: "rgba(230,211,168,0.1)", border: "1px solid rgba(230,211,168,0.3)", borderRadius: 12, color: "var(--cream)", fontSize: 13, padding: "10px 20px", cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  if (done) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 0 }}>
      <Header onBack={onBack} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", gap: 20 }}>
        <div style={{ fontSize: 48 }}>📝</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: "var(--text)" }}>Runden er ferdig!</div>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ background: "rgba(0,184,148,0.10)", border: "1px solid rgba(0,184,148,0.35)", borderRadius: 16, padding: "18px 24px", textAlign: "center", minWidth: 90 }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: "var(--color-success)" }}>{stats.correct}</div>
            <div style={{ fontSize: 11, color: "var(--text-subtle)", letterSpacing: 1, marginTop: 4 }}>Riktige</div>
          </div>
          <div style={{ background: "rgba(225,112,85,0.08)", border: "1px solid rgba(225,112,85,0.3)", borderRadius: 16, padding: "18px 24px", textAlign: "center", minWidth: 90 }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: "var(--color-error)" }}>{stats.wrong}</div>
            <div style={{ fontSize: 11, color: "var(--text-subtle)", letterSpacing: 1, marginTop: 4 }}>Feil</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
          {history.map((h, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: h === "correct" ? "var(--color-success)" : "var(--color-error)" }} />
          ))}
        </div>
        <button onClick={onBack} className="btn-shine"
          style={{ background: "var(--cream)", border: "none", borderRadius: 14, color: "#1a1410", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 15, padding: "14px 40px", cursor: "pointer", marginTop: 8 }}>
          Tilbake til hjem
        </button>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--cream-deep)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "var(--text)" }}>
          <SentenceIcon /> Oversett setningen
        </div>
        <div style={{ fontSize: 11, color: "var(--text-subtle)", letterSpacing: 1 }}>{idx + 1}/{sentences.length}</div>
      </div>

      <div style={{ height: 3, background: "var(--border)" }}>
        <div style={{ height: "100%", background: "var(--cream)", width: `${((idx + 1) / sentences.length) * 100}%`, transition: "width 0.3s" }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", gap: 20 }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 2 }}>
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
            <button onClick={submit} disabled={!input.trim()} className="btn-shine"
              style={{ background: "var(--cream)", opacity: input.trim() ? 1 : 0.4, border: "none", borderRadius: 14, color: "#1a1410", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 15, padding: "14px", cursor: input.trim() ? "pointer" : "default" }}>
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
              <div style={{ background: "rgba(230,211,168,0.06)", border: "1px solid rgba(230,211,168,0.18)", borderRadius: 12, padding: "14px 20px", textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: 15, color: "var(--amber)", fontWeight: "bold", marginBottom: 6 }}>~ Nesten riktig!</div>
                {explanation ? <div style={{ fontSize: 13, color: "var(--cream-deep)", marginBottom: 6, fontWeight: 500 }}>{explanation}</div> : null}
                <div style={{ fontSize: 13, color: "var(--text-subtle)", marginBottom: 4 }}>Du svarte: <em>{input}</em></div>
                <div style={{ fontSize: 14, color: "var(--text)" }}>Fasit: <strong>{correctFr}</strong></div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8, marginBottom: 8 }}>
                  <button onClick={() => speak(correctFr)} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 18, cursor: "pointer" }}>🔊</button>
                  <button onClick={() => speak(correctFr, 0.4)} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 18, cursor: "pointer" }}>🐢</button>
                </div>
                {!aiHint && !aiHintLoading && <button onClick={() => fetchAiHint(current?.no, correctFr, input, explanation)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 10, padding: "7px 14px", fontSize: 12, color: "var(--text-subtle)", cursor: "pointer", fontFamily: "var(--font-body)", marginBottom: 8 }}>💡 Få tilbakemelding</button>}
                <AiHintBlock loading={aiHintLoading} hint={aiHint} />
              </div>
            )}
            {result === "wrong" && (
              <div style={{ background: "rgba(225,112,85,0.08)", border: "1px solid rgba(225,112,85,0.3)", borderRadius: 12, padding: "14px 20px", textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: 15, color: "var(--color-error)", fontWeight: "bold", marginBottom: 6 }}>Feil svar</div>
                {explanation ? <div style={{ fontSize: 13, color: "var(--color-error)", marginBottom: 6, fontWeight: 500 }}>{explanation}</div> : null}
                <div style={{ fontSize: 13, color: "var(--text-subtle)", marginBottom: 4 }}>Du svarte: <em>{input}</em></div>
                <div style={{ fontSize: 14, color: "var(--text)", marginBottom: 4 }}>Fasit: <strong>{correctFr}</strong></div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 8 }}>
                  <button onClick={() => speak(correctFr)} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 18, cursor: "pointer" }}>🔊</button>
                  <button onClick={() => speak(correctFr, 0.4)} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 18, cursor: "pointer" }}>🐢</button>
                </div>
                {!aiHint && !aiHintLoading && <button onClick={() => fetchAiHint(current?.no, correctFr, input, explanation)} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 10, padding: "7px 14px", fontSize: 12, color: "var(--text-subtle)", cursor: "pointer", fontFamily: "var(--font-body)", marginBottom: 8 }}>💡 Få tilbakemelding</button>}
                <AiHintBlock loading={aiHintLoading} hint={aiHint} />
              </div>
            )}
            <button onClick={next} className="btn-shine"
              style={{ background: "var(--cream)", border: "none", borderRadius: 14, color: "#1a1410", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 15, padding: "14px 40px", cursor: "pointer" }}>
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

function AiHintBlock({ loading, hint }) {
  if (!loading && !hint) return null;
  return (
    <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)", textAlign: "left" }}>
      {loading ? (
        <div style={{ fontSize: 12, color: "var(--text-subtle)", opacity: 0.7, textAlign: "center" }}>🤔 Analyserer feilen…</div>
      ) : hint ? (
        <>
          {hint.forklaring && (
            <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.65, marginBottom: 8 }}>{hint.forklaring}</div>
          )}
          {hint.huskeregel && (
            <>
              <div style={{ fontSize: 10, color: "var(--cream-deep)", letterSpacing: 2, marginBottom: 4 }}>Huskeregel</div>
              <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.65, fontStyle: "italic" }}>{hint.huskeregel}</div>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}

function Header({ onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--cream-deep)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "var(--text)" }}><SentenceIcon /> Oversett setningen</div>
      <div style={{ width: 60 }} />
    </div>
  );
}

function SentenceIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--cream)" strokeWidth="2.2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="16" y2="12"/><line x1="3" y1="18" x2="19" y2="18"/>
    </svg>
  );
}
