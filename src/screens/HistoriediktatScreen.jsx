import { useState, useRef, useEffect, useCallback } from "react";
import { PROXY_URL, APP_TOKEN } from "../constants.js";
import { loadUserProfile, getActiveGoal, loadGoalOrder, logDailyAnswer, logGameSession } from "../utils.jsx";
import BottomNav from "../components/BottomNav.jsx";

function normalize(str) {
  return (str || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]/g, "");
}

async function fetchStory(words, profile) {
  const goal = getActiveGoal(words, loadGoalOrder());
  const sampleWords = words
    .slice()
    .sort(() => Math.random() - 0.5)
    .slice(0, 12)
    .map(w => w.fr)
    .join(", ");

  const system = `You are a French language teacher creating dictation exercises for a Norwegian A1/A2 learner${profile.dysleksi ? " with dyslexia" : ""}.`;
  const prompt = `Write a short French story (4–5 sentences, 50–70 words total) at A1/A2 level. Topic: ${goal.label}. Try to use some of these words where they fit naturally: ${sampleWords}.

Then select 5–7 important words (nouns, verbs, adjectives — not articles or short particles) to blank out.

Return ONLY valid JSON, no markdown:
{"full":"La fille mange une pomme rouge dans le jardin...","segments":[{"text":"La fille ","blank":false},{"text":"mange","blank":true},{"text":" une pomme rouge dans le ","blank":false},{"text":"jardin","blank":true},{"text":".","blank":false}],"answers":["mange","jardin"]}

Rules:
- segments must reconstruct the full story exactly when concatenated
- answers must be in order of appearance
- blanked words must be exactly as they appear in the story`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-App-Token": APP_TOKEN },
      body: JSON.stringify({
        max_tokens: 900,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${data.error || data.message || JSON.stringify(data)}`);
    const text = data.content?.find(b => b.type === "text")?.text || "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) continue;
    try {
      const parsed = JSON.parse(match[0]);
      if (parsed.full && Array.isArray(parsed.segments) && Array.isArray(parsed.answers)) {
        return parsed;
      }
    } catch {}
  }
  throw new Error("parse");
}

export default function HistoriediktatScreen({ words, onBack, speak, screen, showWords, onNav, onGameComplete }) {
  const [mode, setMode]   = useState(null);       // null | "easy" | "hard"
  const [phase, setPhase] = useState("mode");      // mode | loading | listen | fill | result
  const [story, setStory] = useState(null);
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [inputs, setInputs]   = useState([]);
  const [results, setResults] = useState([]);
  const [playing, setPlaying] = useState(false);
  const inputRefs = useRef([]);
  const profile = loadUserProfile();

  const load = useCallback(async () => {
    setPhase("loading");
    setError(false);
    setErrorMsg("");
    setStory(null);
    try {
      const s = await fetchStory(words, profile);
      setStory(s);
      setInputs(s.answers.map(() => ""));
      setResults([]);
      setPhase("listen");
    } catch (e) {
      setErrorMsg(e?.message || "Ukjent feil");
      setError(true);
      setPhase("loading");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words]);

  const startMode = (m) => {
    setMode(m);
    setPhase("loading");
    load();
  };

  const playStory = () => {
    if (!story) return;
    setPlaying(true);
    const utt = new SpeechSynthesisUtterance(story.full);
    utt.lang = "fr-FR";
    utt.rate = 0.78;
    const frVoice = window.speechSynthesis.getVoices().find(v => v.lang === "fr-FR")
                 || window.speechSynthesis.getVoices().find(v => v.lang.startsWith("fr"));
    if (frVoice) utt.voice = frVoice;
    utt.onend = () => setPlaying(false);
    utt.onerror = () => setPlaying(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utt);
  };

  const stopPlay = () => { window.speechSynthesis.cancel(); setPlaying(false); };

  const handleInputChange = (idx, val) => {
    const next = [...inputs];
    next[idx] = val.toLowerCase();
    setInputs(next);
    const answer = story.answers[idx] || "";
    if (next[idx].length >= answer.length) {
      setTimeout(() => inputRefs.current[idx + 1]?.focus(), 80);
    }
  };

  const checkAnswers = () => {
    if (!story) return;
    const res = story.answers.map((ans, i) =>
      normalize(inputs[i]) === normalize(ans) ? "correct" : "wrong"
    );
    setResults(res);
    setPhase("result");
    stopPlay();
    const correct = res.filter(r => r === "correct").length;
    logGameSession(story.answers.length);
    for (let i = 0; i < correct; i++) logDailyAnswer("vocab");
    if (onGameComplete) onGameComplete();
  };

  const score = results.filter(r => r === "correct").length;

  // ── Mode selector ─────────────────────────────────────────────────────────
  if (phase === "mode") return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "52px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)", padding: 0 }}>← Tilbake</button>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.3px" }}>Historiediktat</div>
        <div style={{ width: 60 }} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 28px", gap: 16 }}>
        <div style={{ fontSize: 52 }}>📖</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, color: "var(--text)", textAlign: "center" }}>Velg vanskelighetsgrad</div>

        <button onClick={() => startMode("easy")} style={{
          width: "100%", maxWidth: 340,
          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18,
          padding: "20px 22px", textAlign: "left", cursor: "pointer",
        }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 500, color: "var(--text)", marginBottom: 4 }}>📝 Enkel</div>
          <div style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)", lineHeight: 1.6 }}>Historien er synlig med tomme felt.<br />Fyll inn ordene som mangler.</div>
        </button>

        <button onClick={() => startMode("hard")} style={{
          width: "100%", maxWidth: 340,
          background: "var(--surface)", border: "1px solid var(--cream)", borderRadius: 18,
          padding: "20px 22px", textAlign: "left", cursor: "pointer",
        }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 500, color: "var(--cream)", marginBottom: 4 }}>🎧 Avansert — ekte diktat</div>
          <div style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)", lineHeight: 1.6 }}>Historien er skjult. Hør den så mange<br />ganger du trenger, skriv ordene fra hukommelsen.</div>
        </button>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  // ── Loading ───────────────────────────────────────────────────────────────
  if (phase === "loading") return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {error ? (
        <>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <div style={{ fontSize: 14, color: "var(--text-subtle)", fontFamily: "var(--font-body)" }}>Kunne ikke laste historien</div>
          {errorMsg && <div style={{ fontSize: 11, color: "var(--text-subtle)", fontFamily: "monospace", background: "var(--surface)", padding: "6px 10px", borderRadius: 8, maxWidth: 320, wordBreak: "break-all" }}>{errorMsg}</div>}
          <button onClick={load} style={{ padding: "12px 28px", background: "var(--cream)", color: "var(--on-accent)", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>Prøv igjen</button>
          <button onClick={onBack} style={{ padding: "10px 20px", background: "none", border: "none", color: "var(--text-subtle)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
        </>
      ) : (
        <>
          <span style={{ fontSize: 52 }}>📖</span>
          <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--cream)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <div style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)" }}>Lager historien…</div>
        </>
      )}
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  // ── Listen ────────────────────────────────────────────────────────────────
  if (phase === "listen") return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <style>{`@keyframes wave{0%,100%{transform:scaleY(0.4)}50%{transform:scaleY(1)}}`}</style>

      <div style={{ padding: "52px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => { stopPlay(); setPhase("mode"); setMode(null); }} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)", padding: 0 }}>← Tilbake</button>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.3px" }}>
          {mode === "hard" ? "🎧 Ekte diktat" : "📝 Enkel"}
        </div>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 32px", gap: 24 }}>
        <div style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)", textAlign: "center", lineHeight: 1.7 }}>
          {mode === "hard"
            ? "Historien er skjult. Lytt nøye — du skal huske\nde blanke ordene."
            : "Lytt til historien. Du kan høre den så mange ganger du vil."}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 5, height: 48 }}>
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} style={{
              width: 5, height: 36, borderRadius: 3,
              background: playing ? "var(--cream)" : "var(--border)",
              animation: playing ? `wave 0.9s ${i * 0.12}s ease-in-out infinite` : "none",
              transformOrigin: "center",
            }} />
          ))}
        </div>

        <button
          onClick={playing ? stopPlay : playStory}
          style={{
            width: 88, height: 88, borderRadius: "50%",
            background: playing ? "rgba(230,211,168,0.15)" : "var(--cream)",
            border: playing ? "2px solid var(--cream)" : "none",
            color: playing ? "var(--cream)" : "var(--on-accent)",
            fontSize: 32, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          {playing ? "⏹" : "▶"}
        </button>

        <div style={{ fontSize: 12, color: "var(--text-subtle)", fontFamily: "var(--font-body)" }}>
          {playing ? "Spiller…" : "Trykk for å høre"}
        </div>

        {/* Show story text only in easy mode */}
        {mode === "easy" && story && (
          <div style={{ width: "100%", maxWidth: 380, background: "var(--surface)", borderRadius: 18, padding: "18px 20px", border: "1px solid var(--border)", fontSize: 14, color: "var(--text-subtle)", fontFamily: "var(--font-body)", lineHeight: 1.8, fontStyle: "italic" }}>
            {story.segments.map((seg, i) => (
              seg.blank
                ? <span key={i} style={{ color: "var(--cream)", fontWeight: 700 }}>____</span>
                : <span key={i}>{seg.text}</span>
            ))}
          </div>
        )}

        {mode === "hard" && (
          <div style={{ fontSize: 12, color: "var(--text-subtle)", fontFamily: "var(--font-body)", textAlign: "center", maxWidth: 280, lineHeight: 1.6 }}>
            Du skal skrive {story?.answers.length} ord fra historien.
          </div>
        )}

        <button
          onClick={() => { stopPlay(); setPhase("fill"); }}
          style={{ width: "100%", maxWidth: 320, padding: "15px", background: "var(--cream)", color: "var(--on-accent)", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}
        >
          Klar til å fylle inn →
        </button>
      </div>

      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  // ── Fill (Easy) ───────────────────────────────────────────────────────────
  if (phase === "fill" && mode === "easy") {
    let blankIdx = 0;
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "52px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => { stopPlay(); setPhase("listen"); }} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)", padding: 0 }}>← Lytt igjen</button>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.3px" }}>Fyll inn ordene</div>
          <button onClick={playing ? stopPlay : playStory} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 20, cursor: "pointer", padding: 0 }}>{playing ? "⏹" : "▶"}</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 22px 180px" }}>
          <div style={{ background: "var(--surface)", borderRadius: 20, padding: "22px 20px", border: "1px solid var(--border)", fontSize: 16, color: "var(--text)", fontFamily: "var(--font-body)", lineHeight: 2.4 }}>
            {story.segments.map((seg, si) => {
              if (!seg.blank) return <span key={si}>{seg.text}</span>;
              const idx = blankIdx++;
              const answer = story.answers[idx] || "";
              const inputWidth = Math.max(4, answer.length + 1);
              return (
                <span key={si} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", verticalAlign: "middle", margin: "0 2px" }}>
                  <span style={{ fontSize: 9, color: "var(--text-subtle)", fontFamily: "var(--font-body)", lineHeight: 1, marginBottom: 1 }}>{idx + 1}</span>
                  <input
                    ref={el => { inputRefs.current[idx] = el; }}
                    value={inputs[idx] || ""}
                    onChange={e => handleInputChange(idx, e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); inputRefs.current[idx + 1]?.focus() || checkAnswers(); } }}
                    style={{ width: `${inputWidth}ch`, borderBottom: "2px solid var(--cream)", borderTop: "none", borderLeft: "none", borderRight: "none", background: "transparent", color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 16, textAlign: "center", outline: "none", padding: "0 2px", lineHeight: 1.4 }}
                    autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
                  />
                </span>
              );
            })}
          </div>
        </div>

        <div style={{ position: "fixed", bottom: 84, left: 0, right: 0, padding: "12px 22px", background: "linear-gradient(to top, var(--bg) 80%, transparent)", zIndex: 190 }}>
          <button onClick={checkAnswers} style={{ width: "100%", padding: "15px", background: "var(--cream)", color: "var(--on-accent)", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>
            Sjekk svar
          </button>
        </div>

        <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
      </div>
    );
  }

  // ── Fill (Hard — hidden story, numbered inputs) ────────────────────────────
  if (phase === "fill" && mode === "hard") {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "52px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => { stopPlay(); setPhase("listen"); }} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)", padding: 0 }}>← Lytt igjen</button>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, color: "var(--cream)", letterSpacing: "-0.3px" }}>🎧 Diktat</div>
          <button onClick={playing ? stopPlay : playStory} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 20, cursor: "pointer", padding: 0 }}>{playing ? "⏹" : "▶"}</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 22px 180px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)", marginBottom: 4, lineHeight: 1.6 }}>
            Skriv de {story.answers.length} ordene du hørte, i riktig rekkefølge:
          </div>
          {story.answers.map((_, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)", fontWeight: 700, minWidth: 22 }}>{idx + 1}.</span>
              <input
                ref={el => { inputRefs.current[idx] = el; }}
                value={inputs[idx] || ""}
                onChange={e => handleInputChange(idx, e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); inputRefs.current[idx + 1]?.focus() || checkAnswers(); } }}
                placeholder={`ord ${idx + 1}`}
                style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "13px 16px", fontSize: 15, color: "var(--text)", fontFamily: "var(--font-body)", outline: "none" }}
                autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
              />
            </div>
          ))}
        </div>

        <div style={{ position: "fixed", bottom: 84, left: 0, right: 0, padding: "12px 22px", background: "linear-gradient(to top, var(--bg) 80%, transparent)", zIndex: 190 }}>
          <button onClick={checkAnswers} style={{ width: "100%", padding: "15px", background: "var(--cream)", color: "var(--on-accent)", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>
            Sjekk svar
          </button>
        </div>

        <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
      </div>
    );
  }

  // ── Result ────────────────────────────────────────────────────────────────
  const total = results.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  let blankIdx2 = 0;
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "52px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)", padding: 0 }}>← Tilbake</button>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.3px" }}>Resultat</div>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 22px 180px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ background: "var(--surface)", borderRadius: 20, padding: "24px 20px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 600, color: pct === 100 ? "var(--color-success)" : pct >= 60 ? "var(--cream)" : "var(--color-error)" }}>
            {score}/{total}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)" }}>
            {pct === 100 ? "🎉 Perfekt!" : pct >= 60 ? "Bra jobbet!" : "Øv mer og prøv igjen"}
          </div>
        </div>

        {/* Story with corrections */}
        <div style={{ background: "var(--surface)", borderRadius: 20, padding: "22px 20px", border: "1px solid var(--border)", fontSize: 15, color: "var(--text)", fontFamily: "var(--font-body)", lineHeight: 2.6 }}>
          {story.segments.map((seg, si) => {
            if (!seg.blank) return <span key={si}>{seg.text}</span>;
            const idx = blankIdx2++;
            const correct = results[idx] === "correct";
            const typed = inputs[idx] || "—";
            const answer = story.answers[idx] || "";
            return (
              <span key={si} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", verticalAlign: "middle", margin: "0 3px", gap: 1 }}>
                <span style={{ fontWeight: 700, color: correct ? "var(--color-success)" : "var(--color-error)", borderBottom: `2px solid ${correct ? "var(--color-success)" : "var(--color-error)"}`, padding: "0 3px", fontSize: 15 }}>
                  {correct ? typed : answer}
                </span>
                {!correct && (
                  <span style={{ fontSize: 10, color: "var(--color-error)", fontFamily: "var(--font-body)", lineHeight: 1 }}>({typed})</span>
                )}
              </span>
            );
          })}
        </div>
      </div>

      <div style={{ position: "fixed", bottom: 84, left: 0, right: 0, padding: "12px 22px", background: "linear-gradient(to top, var(--bg) 80%, transparent)", zIndex: 190, display: "flex", gap: 10 }}>
        <button onClick={load} style={{ flex: 1, padding: "14px", background: "var(--cream)", color: "var(--on-accent)", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>Ny historie</button>
        <button
          onClick={() => { setPhase("fill"); setInputs(story.answers.map(() => "")); setResults([]); }}
          style={{ flex: 1, padding: "14px", background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 14, fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}
        >
          Prøv igjen
        </button>
      </div>

      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}
