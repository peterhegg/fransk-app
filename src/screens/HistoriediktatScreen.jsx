import { useState, useRef, useEffect, useCallback } from "react";
import { PROXY_URL, APP_TOKEN } from "../constants.js";
import { loadUserProfile, getActiveGoal, loadGoalOrder } from "../utils.jsx";
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

export default function HistoriediktatScreen({ words, onBack, speak, screen, showWords, onNav }) {
  const [phase, setPhase] = useState("loading"); // loading | listen | fill | result
  const [story, setStory] = useState(null);
  const [error, setError] = useState(false);
  const [inputs, setInputs] = useState([]);       // one string per blank
  const [results, setResults] = useState([]);     // "correct" | "wrong" per blank
  const [playing, setPlaying] = useState(false);
  const inputRefs = useRef([]);
  const profile = loadUserProfile();

  const load = useCallback(async () => {
    setPhase("loading");
    setError(false);
    setStory(null);
    try {
      const s = await fetchStory(words, profile);
      setStory(s);
      setInputs(s.answers.map(() => ""));
      setResults([]);
      setPhase("listen");
    } catch {
      setError(true);
      setPhase("loading");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words]);

  useEffect(() => { load(); }, [load]);

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

  const stopPlay = () => {
    window.speechSynthesis.cancel();
    setPlaying(false);
  };

  const handleInputChange = (idx, val) => {
    const next = [...inputs];
    next[idx] = val.toLowerCase();
    setInputs(next);
    // Auto-advance when length matches answer
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
    window.speechSynthesis.cancel();
    setPlaying(false);
  };

  const score = results.filter(r => r === "correct").length;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (phase === "loading") return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {error ? (
        <>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <div style={{ fontSize: 14, color: "var(--text-subtle)", fontFamily: "var(--font-body)" }}>Kunne ikke laste historien</div>
          <button onClick={load} style={{ padding: "12px 28px", background: "var(--cream)", color: "#1a1209", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>Prøv igjen</button>
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
      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
      `}</style>

      <div style={{ padding: "52px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)", padding: 0 }}>← Tilbake</button>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.3px" }}>Historiediktat</div>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 32px", gap: 28 }}>
        <div style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)", textAlign: "center", lineHeight: 1.7 }}>
          Lytt til historien. Du kan høre den<br />så mange ganger du vil.
        </div>

        {/* Waveform */}
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
            color: playing ? "var(--cream)" : "#1a1209",
            fontSize: 32, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.2s",
          }}
        >
          {playing ? "⏹" : "▶"}
        </button>

        <div style={{ fontSize: 12, color: "var(--text-subtle)", fontFamily: "var(--font-body)" }}>
          {playing ? "Spiller…" : "Trykk for å høre"}
        </div>

        <div style={{ width: "100%", maxWidth: 360, background: "var(--surface)", borderRadius: 18, padding: "18px 20px", border: "1px solid var(--border)", fontSize: 14, color: "var(--text-subtle)", fontFamily: "var(--font-body)", lineHeight: 1.8, fontStyle: "italic" }}>
          Klar? Du skal fylle inn {story.answers.length} ord.
        </div>

        <button
          onClick={() => { stopPlay(); setPhase("fill"); }}
          style={{ width: "100%", maxWidth: 320, padding: "15px", background: "var(--cream)", color: "#1a1209", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}
        >
          Klar til å fylle inn →
        </button>
      </div>

      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  // ── Fill ──────────────────────────────────────────────────────────────────
  if (phase === "fill") {
    let blankIdx = 0;
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "52px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => { stopPlay(); setPhase("listen"); }} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)", padding: 0 }}>← Lytt igjen</button>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.3px" }}>Fyll inn ordene</div>
          <button onClick={playStory} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 20, cursor: "pointer", padding: 0 }}>{playing ? "⏹" : "▶"}</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 22px 180px" }}>
          <div style={{
            background: "var(--surface)", borderRadius: 20, padding: "22px 20px",
            border: "1px solid var(--border)",
            fontSize: 16, color: "var(--text)", fontFamily: "var(--font-body)", lineHeight: 2.2,
          }}>
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
                    style={{
                      width: `${inputWidth}ch`,
                      borderBottom: "2px solid var(--cream)",
                      borderTop: "none", borderLeft: "none", borderRight: "none",
                      background: "transparent",
                      color: "var(--text)",
                      fontFamily: "var(--font-body)",
                      fontSize: 16,
                      textAlign: "center",
                      outline: "none",
                      padding: "0 2px",
                      lineHeight: 1.4,
                    }}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </span>
              );
            })}
          </div>
        </div>

        <div style={{ position: "fixed", bottom: 84, left: 0, right: 0, padding: "12px 22px", background: "linear-gradient(to top, var(--bg) 80%, transparent)", zIndex: 190 }}>
          <button
            onClick={checkAnswers}
            style={{ width: "100%", padding: "15px", background: "var(--cream)", color: "#1a1209", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}
          >
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
        {/* Score */}
        <div style={{ background: "var(--surface)", borderRadius: 20, padding: "24px 20px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 600, color: pct === 100 ? "#5e9a6f" : pct >= 60 ? "var(--cream)" : "#ef4444" }}>
            {score}/{total}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)" }}>
            {pct === 100 ? "🎉 Perfekt!" : pct >= 60 ? "Bra jobbet!" : "Øv mer og prøv igjen"}
          </div>
        </div>

        {/* Story with corrections */}
        <div style={{
          background: "var(--surface)", borderRadius: 20, padding: "22px 20px",
          border: "1px solid var(--border)",
          fontSize: 16, color: "var(--text)", fontFamily: "var(--font-body)", lineHeight: 2.4,
        }}>
          {story.segments.map((seg, si) => {
            if (!seg.blank) return <span key={si}>{seg.text}</span>;
            const idx = blankIdx2++;
            const correct = results[idx] === "correct";
            const typed = inputs[idx] || "—";
            const answer = story.answers[idx] || "";
            return (
              <span key={si} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", verticalAlign: "middle", margin: "0 3px", gap: 1 }}>
                <span style={{
                  fontWeight: 700,
                  color: correct ? "#5e9a6f" : "#ef4444",
                  borderBottom: `2px solid ${correct ? "#5e9a6f" : "#ef4444"}`,
                  padding: "0 3px",
                  fontSize: 15,
                }}>
                  {correct ? typed : answer}
                </span>
                {!correct && (
                  <span style={{ fontSize: 10, color: "#ef4444", fontFamily: "var(--font-body)", lineHeight: 1 }}>
                    ({typed})
                  </span>
                )}
              </span>
            );
          })}
        </div>
      </div>

      <div style={{ position: "fixed", bottom: 84, left: 0, right: 0, padding: "12px 22px", background: "linear-gradient(to top, var(--bg) 80%, transparent)", zIndex: 190, display: "flex", gap: 10 }}>
        <button onClick={load} style={{ flex: 1, padding: "14px", background: "var(--cream)", color: "#1a1209", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>Ny historie</button>
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
