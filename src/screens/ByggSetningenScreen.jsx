import { useState, useEffect, useRef } from "react";
import { shuffle, logGameSession, loadUserProfile } from "../utils.jsx";
import { PROXY_URL, APP_TOKEN } from "../constants.js";
import BottomNav from "../components/BottomNav.jsx";

function levelInstructions(level) {
  const l = level || "A1/A2";
  if (l === "A1") return "Maks 5 ord per setning. Kun presens, enkle pronomen.";
  if (l === "A1/A2") return "Maks 7 ord per setning. Presens, enkel negasjon.";
  if (l === "A2") return "Maks 8 ord. Presens og passé composé.";
  return "7-10 ord. Passé composé og enkle konjunksjoner.";
}

async function fetchBuildSentences(words, grammarWords) {
  const allWords = [...words, ...grammarWords];
  if (!allWords.length) return null;
  const sample = shuffle([...allWords]).slice(0, 40);
  const wordList = sample.map(w => `${w.fr} = ${w.no}`).join(", ");
  const profile = loadUserProfile();
  const lvl = profile.level || "A1/A2";
  const count = 10;
  const prompt = `Du er en fransktutor som lager setningsbyggøvelser for en norsk ${lvl}-elev${profile.dysleksi ? " med dysleksi" : ""}.

ORDBANK: ${wordList}

Lag nøyaktig ${count} franske setninger (NIVÅ ${lvl}: ${levelInstructions(lvl)}).
Setningene skal egne seg for å stykkes opp i enkeltord.
Svar KUN med gyldig JSON-array, ingen markdown:
[{"no":"norsk setning","fr":"korrekt fransk setning"}]`;

  const res = await fetch(PROXY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-App-Token": APP_TOKEN },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: "You are a French sentence generator. Respond only with valid JSON array, no markdown.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  const text = data.content?.find(b => b.type === "text")?.text || "";
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return null;
  const parsed = JSON.parse(match[0]);
  return Array.isArray(parsed) ? parsed.filter(s => s.no && s.fr) : null;
}

function tokenize(fr) {
  return fr.match(/[^\s]+/g) || [];
}

function normalize(s) {
  return s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[.,!?;:«»"""''`]/g, "").replace(/\s+/g, " ").trim();
}

export default function ByggSetningenScreen({ words, grammarWords, onBack, speak, speaking, isOnline, screen, showWords, onNav }) {
  const [phase, setPhase] = useState("loading"); // "loading" | "play" | "done" | "error"
  const [sentences, setSentences] = useState([]);
  const [idx, setIdx] = useState(0);
  const [tiles, setTiles] = useState([]); // { id, word, placed }
  const [placed, setPlaced] = useState([]); // tile ids in order
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const abortRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await fetchBuildSentences(words, grammarWords || []);
        if (cancelled) return;
        if (!result || result.length < 2) { setPhase("error"); return; }
        setSentences(result);
        initRound(result, 0);
        setPhase("play");
      } catch {
        if (!cancelled) setPhase("error");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  function initRound(sents, i) {
    const s = sents[i];
    if (!s) return;
    const words = tokenize(s.fr);
    const shuffled = shuffle(words.map((w, j) => ({ id: `${i}-${j}`, word: w })));
    setTiles(shuffled);
    setPlaced([]);
    setChecked(false);
    setIsCorrect(false);
  }

  const current = sentences[idx] || null;
  const placedTiles = placed.map(id => tiles.find(t => t.id === id)).filter(Boolean);
  const unplacedTiles = tiles.filter(t => !placed.includes(t.id));
  const builtSentence = placedTiles.map(t => t.word).join(" ");

  const handlePlace = (tile) => {
    if (checked) return;
    setPlaced(p => [...p, tile.id]);
  };

  const handleRemove = (tileId, placedIdx) => {
    if (checked) return;
    setPlaced(p => p.filter((_, i) => i !== placedIdx));
  };

  const handleCheck = () => {
    if (!placed.length) return;
    const correct = normalize(builtSentence) === normalize(current.fr);
    setIsCorrect(correct);
    setChecked(true);
    if (correct) setScore(s => s + 1);
    speak(current.fr, 0.8);
  };

  const handleNext = () => {
    const nextIdx = idx + 1;
    if (nextIdx >= sentences.length) {
      logGameSession(sentences.length);
      setPhase("done");
    } else {
      setIdx(nextIdx);
      initRound(sentences, nextIdx);
    }
  };

  const handleSkip = () => {
    setChecked(true);
    setIsCorrect(false);
    speak(current.fr, 0.8);
  };

  const restart = async () => {
    setPhase("loading");
    setSentences([]);
    setIdx(0);
    setScore(0);
    try {
      const result = await fetchBuildSentences(words, grammarWords || []);
      if (!result || result.length < 2) { setPhase("error"); return; }
      setSentences(result);
      initRound(result, 0);
      setPhase("play");
    } catch {
      setPhase("error");
    }
  };

  if (phase === "loading") {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ width: 40, height: 40, border: "3px solid var(--border)", borderTopColor: "var(--cream)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize: 14, color: "var(--text-subtle)", fontFamily: "var(--font-body)" }}>Lager setninger…</div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 24 }}>
        <div style={{ fontSize: 48 }}>📡</div>
        <div style={{ fontSize: 16, color: "var(--text)", fontFamily: "var(--font-display)", textAlign: "center" }}>Kunne ikke laste setninger</div>
        <div style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)", textAlign: "center" }}>Sjekk nettverkstilkoblingen og prøv igjen.</div>
        <button onClick={restart} style={{ padding: "14px 28px", background: "var(--cream)", color: "#1a1209", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}>Prøv igjen</button>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>Tilbake</button>
      </div>
    );
  }

  if (phase === "done") {
    const pct = Math.round((score / sentences.length) * 100);
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", gap: 24 }}>
          <div style={{ fontSize: 56 }}>{pct >= 80 ? "🏗️" : pct >= 50 ? "🧩" : "🔧"}</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 500, color: "var(--text)", textAlign: "center", letterSpacing: "-0.5px" }}>
            {pct >= 80 ? "Mester-bygger!" : pct >= 50 ? "Bra bygget!" : "Fortsett å øv!"}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { label: "Riktige", val: score, color: "#34d399" },
              { label: "Totalt", val: sentences.length, color: "var(--cream)" },
              { label: "Prosent", val: `${pct}%`, color: "#818cf8" },
            ].map(s => (
              <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "16px 18px", textAlign: "center", minWidth: 80 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: "var(--font-body)" }}>{s.val}</div>
                <div style={{ fontSize: 11, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={restart} style={{ padding: "14px 28px", background: "var(--cream)", color: "#1a1209", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}>Spill igjen</button>
            <button onClick={onBack} style={{ padding: "14px 28px", background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 14, fontSize: 15, cursor: "pointer", fontFamily: "var(--font-body)" }}>Hjem</button>
          </div>
        </div>
        <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "56px 20px 12px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>
          ← Avslutt
        </button>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#34d399", fontFamily: "var(--font-body)", fontWeight: 600 }}>{score}/{sentences.length}</span>
        </div>
      </div>

      {/* Progress */}
      <div style={{ display: "flex", gap: 4, padding: "0 20px 16px", justifyContent: "center" }}>
        {sentences.map((_, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i < idx ? "#34d399" : i === idx ? "var(--cream)" : "var(--border)", transition: "background 0.2s" }} />
        ))}
      </div>

      {/* Norwegian prompt */}
      <div style={{ padding: "0 20px 16px" }}>
        <div style={{ fontSize: 11, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "var(--font-body)", marginBottom: 8 }}>
          Bygg på fransk:
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "18px 20px" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.2px", lineHeight: 1.4 }}>
            {current?.no}
          </div>
        </div>
      </div>

      {/* Build zone */}
      <div style={{ padding: "0 20px 12px" }}>
        <div style={{
          minHeight: 56,
          background: checked
            ? isCorrect ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)"
            : "rgba(230,211,168,0.05)",
          border: `2px solid ${checked ? (isCorrect ? "#34d399" : "#f87171") : "var(--border)"}`,
          borderRadius: 16,
          padding: "10px 12px",
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          alignItems: "center",
          minHeight: 56,
          transition: "border-color 0.2s, background 0.2s",
        }}>
          {placedTiles.length === 0 && !checked && (
            <span style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)", fontStyle: "italic" }}>Trykk ord nedenfor…</span>
          )}
          {placedTiles.map((tile, i) => (
            <button
              key={tile.id}
              onClick={() => handleRemove(tile.id, i)}
              style={{
                padding: "7px 12px",
                borderRadius: 10,
                border: "none",
                background: checked ? (isCorrect ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)") : "rgba(230,211,168,0.15)",
                color: checked ? (isCorrect ? "#34d399" : "#f87171") : "var(--cream)",
                fontSize: 14,
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                cursor: checked ? "default" : "pointer",
              }}
            >
              {tile.word}
            </button>
          ))}
        </div>

        {/* Feedback */}
        {checked && (
          <div style={{ marginTop: 10, padding: "10px 14px", background: isCorrect ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)", borderRadius: 12 }}>
            <div style={{ fontSize: 13, color: isCorrect ? "#34d399" : "#f87171", fontFamily: "var(--font-body)", fontWeight: 600 }}>
              {isCorrect ? "��� Riktig!" : "✗ Feil"}
            </div>
            {!isCorrect && (
              <div style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)", marginTop: 4 }}>
                Riktig: <span style={{ color: "var(--text)" }}>{current?.fr}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Word tiles */}
      <div style={{ flex: 1, padding: "0 20px 8px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {unplacedTiles.map(tile => (
            <button
              key={tile.id}
              onClick={() => handlePlace(tile)}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "2px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: 15,
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tile.word}
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: "8px 20px 8px", display: "flex", gap: 10 }}>
        {!checked ? (
          <>
            <button
              onClick={handleCheck}
              disabled={placed.length === 0}
              style={{ flex: 1, padding: "15px", background: placed.length ? "var(--cream)" : "var(--surface)", color: placed.length ? "#1a1209" : "var(--text-subtle)", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: placed.length ? "pointer" : "not-allowed", fontFamily: "var(--font-body)", transition: "all 0.2s" }}
            >
              Sjekk
            </button>
            <button
              onClick={handleSkip}
              style={{ padding: "15px 18px", background: "var(--surface)", color: "var(--text-subtle)", border: "1px solid var(--border)", borderRadius: 14, fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}
            >
              Gi opp
            </button>
          </>
        ) : (
          <button onClick={handleNext} style={{ flex: 1, padding: "15px", background: "var(--cream)", color: "#1a1209", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>
            {idx + 1 >= sentences.length ? "Se resultat" : "Neste →"}
          </button>
        )}
      </div>

      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}
