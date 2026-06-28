import { SpeakButton } from "../components/AudioControls.jsx";
import { useState, useRef, useEffect } from "react";
import { PROXY_URL, APP_TOKEN } from "../constants.js";
import { shuffle, logDailyAnswer, loadUserProfile } from "../utils.jsx";
import { getActiveLang } from "../languages/index.js";
import BottomNav from "../components/BottomNav.jsx";

function levelInstructions(level) {
  const l = level || "A1/A2";
  if (l === "A1") return "Maks 5 ord. Kun presens, enkle pronomen. Alternativene: bytt kun pronomen eller artikkel.";
  if (l === "A1/A2") return "Maks 7 ord. Presens, negasjon. Alternativene: bytt pronomen, verbform eller artikkel.";
  if (l === "A2") return "8-9 ord. Presens og passé composé. Alternativene: bytt aux (avoir/être), verbform, artikkel.";
  if (l === "A2/B1") return "9-11 ord. Passé composé, imparfait. Alternativene: bytt tidsform, preposisjon, pronomen.";
  if (l === "B1") return "10-13 ord. Imparfait/futur/objektpronomen. Alternativene: bytt tidsform, pronomen (le/lui/y/en).";
  if (l === "B1/B2") return "12-15 ord. Futur antérieur, kondisjonalis, relativsetninger. Alternativene er nesten identiske men med ulik modus/tidsform.";
  if (l === "B2") return "Komplekse setninger med subjonctif, kondisjonalis, passiv. Alternativene er subtile.";
  return "Avansert grammatikk. Alternativene er svært like — kun stil og register skiller dem.";
}

function buildPrompt(words, grammarWords) {
  const lang = getActiveLang();
  const allWords = [...words, ...grammarWords];
  if (!allWords.length) return null;
  const sample = shuffle([...allWords]).slice(0, 40);
  const wordList = sample.map(w => `${w.fr} = ${w.no}`).join(", ");
  const count = Math.min(10, Math.max(4, Math.floor(allWords.length / 5)));
  const profile = loadUserProfile();
  const lvl = profile.level || "A1/A2";
  const lvlInstr = levelInstructions(lvl);
  const n = Math.min(6, count);
  const funcWords = lang.id === "de-CH"
    ? "ich/du/er/sie/es/wir/ihr/sie/der/die/das/ein/eine/und/in/ist/sind/bin/hat/haben/nicht/kein"
    : "je/tu/il/elle/nous/vous/ils/elles/le/la/les/l'/un/une/des/du/de/et/à/en/dans/est/sont/suis/a/ont/ne/pas";
  return `Lag ${n} ${lang.label.toLowerCase()} flervalgsoppgaver for norsk ${lvl}-elev${profile.dysleksi ? " med dysleksi" : ""}.

ORD (bruk KUN disse + funksjonsord: ${funcWords}):
${wordList}

Nivå (${lvl}): ${lvlInstr}

Ca. halvparten type A (norsk→${lang.label.toLowerCase()}) og halvparten type B (${lang.label.toLowerCase()}→norsk).
Alternativene MÅ være nesten identiske — kun ett ord forskjell (pronomen, artikkel, verbform eller preposisjon).

Svar KUN som JSON-array:
[{"prompt":"setningen","correct":"riktig svar","distractors":["nesten-riktig1","nesten-riktig2","nesten-riktig3"],"direction":"no-fr","tip":"spesifikk forklaring"}]

direction er "no-fr" eller "fr-no". tip forklarer akkurat denne forskjellen, ikke generelle regler.`;
}

function FlervalgIcon({ size = 18, opacity = 1 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--cream)" strokeWidth="2.2" strokeLinecap="round" style={{ opacity }}>
      <rect x="3" y="4" width="4" height="4" rx="1" /><line x1="10" y1="6" x2="21" y2="6" />
      <rect x="3" y="10" width="4" height="4" rx="1" /><line x1="10" y1="12" x2="21" y2="12" />
      <rect x="3" y="16" width="4" height="4" rx="1" /><line x1="10" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export default function GenerertFlervalgScreen({
  words, grammarWords, isOnline, onBack, speak, speaking, screen, showWords, onNav,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState("");
  const [checked, setChecked] = useState(false);
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });
  const [history, setHistory] = useState([]);
  const [done, setDone] = useState(false);
  const abortRef = useRef(null);

  const MIN_WORDS = 6;

  useEffect(() => {
    const allWords = [...(words || []), ...(grammarWords || [])];
    if (!allWords.length) { setLoading(false); setError("no-words"); return; }
    if (allWords.length < MIN_WORDS) { setLoading(false); setError("too-few"); return; }
    if (!isOnline) { setLoading(false); setError("offline"); return; }
    fetchQuestions();
    return () => abortRef.current?.abort();
  }, []);

  const fetchQuestions = async () => {
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
          max_tokens: 2500,
          system: `You are a ${getActiveLang().nameEn} exercise generator. Respond only with a valid JSON array, no markdown.`,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed) && parsed.length) {
          const prepared = parsed
            .filter(q => {
              const p = q.prompt || q.no;
              const c = q.correct || q.fr;
              const d = Array.isArray(q.distractors) ? q.distractors : [];
              return p && c && d.length >= 2;
            })
            .map(q => {
              const p = q.prompt || q.no;
              const c = q.correct || q.fr;
              const d = q.distractors || [];
              const dir = q.direction || "no-fr";
              const opts = shuffle([c, ...d.slice(0, 3)]);
              return { prompt: p, correct: c, distractors: d, direction: dir, tip: q.tip || "", options: opts };
            });
          if (prepared.length) { setQuestions(prepared); setLoading(false); return; }
        }
      }
      setLoading(false); setError("parse");
    } catch (err) {
      if (err.name !== "AbortError") { setLoading(false); setError("network"); }
    }
  };

  const current = questions[idx];
  const total = questions.length;

  const submit = () => {
    if (!selected || !current) return;
    const passed = selected === current.correct;
    setChecked(true);
    setStats(s => ({ correct: s.correct + (passed ? 1 : 0), wrong: s.wrong + (passed ? 0 : 1) }));
    setHistory(h => [...h, passed ? "correct" : "wrong"]);
    logDailyAnswer("grammar");
  };

  const next = () => {
    if (idx + 1 >= questions.length) { setDone(true); return; }
    setIdx(i => i + 1);
    setSelected(""); setChecked(false);
  };

  const navBar = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--cream-deep)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "var(--text)" }}>
        <FlervalgIcon /> Generert flervalg
      </div>
      <div style={{ fontSize: 11, color: "var(--text-subtle)", letterSpacing: 1 }}>{loading || !total ? "" : `${idx + 1}/${total}`}</div>
    </div>
  );

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 0 }}>
      {navBar}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 32, textAlign: "center" }}>
        <FlervalgIcon size={32} opacity={0.35} />
        <div style={{ fontSize: 15, color: "var(--text-subtle)" }}>Genererer flervalgsoppgaver…</div>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  if (error) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 0 }}>
      {navBar}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 14, color: "var(--text-subtle)", lineHeight: 1.8 }}>
          {error === "no-words" ? "Ingen ord i ordbanken ennå. Gjør Dagens øvelse – glose for å lære dine første ord."
            : error === "too-few" ? `Du trenger minst ${MIN_WORDS} ord i ordbanken for denne øvelsen. Gjør noen Dagens øvelser først.`
            : error === "offline" ? "Ingen internettforbindelse — Claude er ikke tilgjengelig."
            : error === "parse" ? "Claude klarte ikke å generere oppgaver denne gangen. Prøv igjen — det hjelper av og til å prøve på nytt."
            : "Nettverksfeil. Sjekk forbindelsen og prøv igjen."}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {(error === "parse" || error === "network") && (
            <button onClick={() => { setError(""); setLoading(true); fetchQuestions(); }}
              style={{ background: "var(--cream)", border: "none", borderRadius: 12, color: "var(--bg)", fontSize: 13, padding: "10px 20px", cursor: "pointer", fontFamily: "var(--font-body)" }}>Prøv igjen</button>
          )}
          <button onClick={onBack} style={{ background: "rgba(230,211,168,0.1)", border: "1px solid rgba(230,211,168,0.3)", borderRadius: 12, color: "var(--cream)", fontSize: 13, padding: "10px 20px", cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
        </div>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  if (done) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 0 }}>
      {navBar}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", gap: 20 }}>
        <div style={{ fontSize: 48 }}>🎯</div>
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
          style={{ background: selected ? "var(--cream)" : "rgba(230,211,168,0.08)", border: "none", borderRadius: 14, color: selected ? "var(--bg)" : "var(--text-subtle)", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 15, padding: "14px 40px", cursor: "pointer", marginTop: 8 }}>
          Tilbake til hjem
        </button>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  const passed = checked && selected === current?.correct;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 0 }}>
      {navBar}
      <div style={{ height: 3, background: "var(--border)" }}>
        <div style={{ height: "100%", background: "var(--cream)", width: `${((idx + 1) / total) * 100}%`, transition: "width 0.3s" }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", gap: 20 }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 2 }}>
          {current?.direction === "fr-no" ? "Oversett til norsk" : `Oversett til ${lang.label.toLowerCase()}`}
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 32px", textAlign: "center", width: "100%", maxWidth: 360, boxShadow: "var(--shadow-md)" }}>
          <div style={{ fontSize: 22, color: "var(--text)", fontFamily: "var(--font-display)", lineHeight: 1.45, fontStyle: current?.direction === "fr-no" ? "italic" : "normal" }}>{current?.prompt}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", maxWidth: 360 }}>
          {current?.options.map((opt, i) => {
            let bg = "var(--surface)", border = "1px solid var(--border)", color = "var(--text)";
            if (checked) {
              if (opt === current.correct) { bg = "rgba(0,184,148,0.12)"; border = "2px solid var(--color-success)"; color = "var(--color-success)"; }
              else if (opt === selected) { bg = "rgba(225,112,85,0.10)"; border = "2px solid var(--color-error)"; color = "var(--color-error)"; }
            } else if (selected === opt) {
              bg = "rgba(230,211,168,0.1)"; border = "1.5px solid var(--cream)";
            }
            const isFr = current?.direction !== "fr-no";
            return (
              <button key={i} onClick={() => !checked && setSelected(opt)}
                style={{ background: bg, border, borderRadius: 14, padding: "14px 10px", cursor: checked ? "default" : "pointer", color, fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.35, textAlign: "center", fontStyle: isFr ? "italic" : "normal", transition: "all 0.15s ease" }}>
                {opt}
              </button>
            );
          })}
        </div>

        {!checked ? (
          <button onClick={submit} disabled={!selected} className={selected ? "btn-shine" : ""}
            style={{ background: selected ? "var(--cream)" : "rgba(230,211,168,0.08)", border: "none", borderRadius: 14, color: selected ? "var(--bg)" : "var(--text-subtle)", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 15, padding: "14px", cursor: selected ? "pointer" : "default", width: "100%", maxWidth: 360 }}>
            Bekreft svar
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 360, alignItems: "center" }}>
            <div style={{
              background: passed ? "rgba(0,184,148,0.10)" : "rgba(225,112,85,0.08)",
              border: `1px solid ${passed ? "rgba(0,184,148,0.35)" : "rgba(225,112,85,0.3)"}`,
              borderRadius: 12, padding: "14px 18px", width: "100%", textAlign: "center",
            }}>
              <div style={{ fontSize: 15, color: passed ? "var(--color-success)" : "var(--color-error)", fontWeight: "bold", marginBottom: passed ? 0 : 6 }}>
                {passed ? "✓ Riktig!" : "Feil svar"}
              </div>
              {!passed && (
                <div style={{ fontSize: 13, color: "var(--text-subtle)", marginBottom: 6 }}>
                  Riktig: <strong style={{ color: "var(--text)", fontStyle: current.direction === "fr-no" ? "normal" : "italic" }}>{current.correct}</strong>
                </div>
              )}
              {(() => {
                const frText = current.direction === "fr-no" ? current.prompt : current.correct;
                return (
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: passed ? 8 : 0, marginBottom: current.tip ? 8 : 0 }}>
                    <button onClick={() => speak(frText)} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 18, cursor: "pointer" }}>🔊</button>
                    <button onClick={() => speak(frText, 0.4)} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 18, cursor: "pointer" }}>🐢</button>
                  </div>
                );
              })()}
              {current.tip && (
                <div style={{ marginTop: 4, paddingTop: 8, borderTop: "1px solid var(--border)", textAlign: "left" }}>
                  <div style={{ fontSize: 10, color: "var(--cream-deep)", letterSpacing: 2, marginBottom: 5 }}>Huskeregel</div>
                  <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.65 }}>{current.tip}</div>
                </div>
              )}
            </div>
            <button onClick={next} className="btn-shine"
              style={{ background: selected ? "var(--cream)" : "rgba(230,211,168,0.08)", border: "none", borderRadius: 14, color: selected ? "var(--bg)" : "var(--text-subtle)", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 15, padding: "14px 40px", cursor: "pointer" }}>
              {idx >= questions.length - 1 ? "Se resultat" : "Neste →"}
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
