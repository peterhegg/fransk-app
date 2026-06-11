import { useState, useEffect, useRef } from "react";
import { shuffle, logGameSession, logDailyAnswer, loadUserProfile } from "../utils.jsx";
import { PROXY_URL, APP_TOKEN } from "../constants.js";
import BottomNav from "../components/BottomNav.jsx";
import { GameHeader, GameProgress, GameResult, LoadingState, Chip, Dock, PrimaryButton, GhostButton } from "../components/GameUI.jsx";

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
  const sample = shuffle([...allWords]).slice(0, 30);
  const wordList = sample.map(w => `${w.fr}=${w.no}`).join(", ");
  const profile = loadUserProfile();
  const lvl = profile.level || "A1/A2";
  const count = 7;

  const prompt = `French sentence-building exercise for Norwegian ${lvl} learner${profile.dysleksi ? " (dyslexia)" : ""}.
WORDS: ${wordList}
Make ${count} sentences (${levelInstructions(lvl)}).
For each sentence add 2-3 distractor words: wrong conjugations, wrong gender forms, or near-synonyms that don't fit. Example: if sentence uses "est", add "sont" or "était"; if "grande" add "grand" or "gros".
JSON only, no markdown:
[{"no":"Norwegian","fr":"French sentence","distractors":["wrong1","wrong2","wrong3"]}]`;

  const attempt = async () => {
    const res = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-App-Token": APP_TOKEN },
      body: JSON.stringify({
        max_tokens: 1000,
        system: "Respond only with a valid JSON array. No markdown, no explanation.",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    const text = data.content?.find(b => b.type === "text")?.text || "";
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed.filter(s => s.no && s.fr) : null;
  };

  try { return await attempt(); } catch { /* fall through */ }
  try { return await attempt(); } catch { return null; }
}

function tokenize(fr) {
  return (fr.match(/[^\s]+/g) || []).map(w => w.replace(/^[«""''`]+|[.!?,;:»""''`]+$/g, "")).filter(Boolean);
}

function normalize(s) {
  return s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[.,!?;:«»"""''`]/g, "").replace(/\s+/g, " ").trim();
}

export default function ByggSetningenScreen({ words, grammarWords, onBack, speak, speaking, isOnline, screen, showWords, onNav }) {
  const [phase, setPhase] = useState("loading");
  const [sentences, setSentences] = useState([]);
  const [idx, setIdx] = useState(0);
  const [tiles, setTiles] = useState([]);
  const [placed, setPlaced] = useState([]);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);

  const nav = <BottomNav screen={screen} showWords={showWords} onNav={onNav} />;

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
    const correctWords = tokenize(s.fr);
    const distractors = (s.distractors || [])
      .map(d => d.replace(/^[«""''`]+|[.!?,;:»""''`]+$/g, "").trim())
      .filter(Boolean)
      .slice(0, 3);
    const allTiles = [
      ...correctWords.map((w, j) => ({ id: `${i}-c${j}`, word: w.toLowerCase(), distractor: false })),
      ...distractors.map((w, j) => ({ id: `${i}-d${j}`, word: w.toLowerCase(), distractor: true })),
    ];
    setTiles(shuffle(allTiles));
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
    if (correct) { setScore(s => s + 1); logDailyAnswer("vocab"); }
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

  // ── Loading ───────────────────────────────────────────────────────────────
  if (phase === "loading") return <LoadingState label="Lager setninger…" bottomNav={nav} />;

  // ── Error ─────────────────────────────────────────────────────────────────
  if (phase === "error") return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 24 }}>
      <div style={{ fontSize: 48 }}>📡</div>
      <div style={{ fontSize: 16, color: "var(--text)", fontFamily: "var(--font-display)", textAlign: "center" }}>Kunne ikke laste setninger</div>
      <div style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)", textAlign: "center" }}>Sjekk nettverkstilkoblingen og prøv igjen.</div>
      <PrimaryButton onClick={restart}>Prøv igjen</PrimaryButton>
      <GhostButton onClick={onBack} style={{ fontSize: 13, padding: "10px 20px" }}>Tilbake</GhostButton>
    </div>
  );

  // ── Done ──────────────────────────────────────────────────────────────────
  if (phase === "done") {
    const pct = Math.round((score / sentences.length) * 100);
    return (
      <GameResult
        icon={pct >= 80 ? "🏗️" : pct >= 50 ? "🧩" : "🔧"}
        title={pct >= 80 ? "Mester-bygger!" : pct >= 50 ? "Bra bygget!" : "Fortsett å øv!"}
        stats={[
          { label: "Riktige", value: score,             tone: "success" },
          { label: "Totalt",  value: sentences.length,  tone: "accent"  },
          { label: "Prosent", value: `${pct}%`,         tone: "neutral" },
        ]}
        primary={{ label: "Spill igjen", onClick: restart }}
        secondary={{ label: "Hjem", onClick: onBack }}
        bottomNav={nav}
      />
    );
  }

  // ── Play ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <GameHeader
        onBack={onBack}
        backLabel="Avslutt"
        title="Bygg setningen"
        right={<span style={{ fontSize: 13, color: "var(--color-success)", fontFamily: "var(--font-body)", fontWeight: 600 }}>{score}/{sentences.length}</span>}
      />

      <GameProgress total={sentences.length} current={idx} />

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
            ? isCorrect ? "var(--color-success-bg)" : "var(--color-error-bg)"
            : "rgba(230,211,168,0.05)",
          border: `2px solid ${checked ? (isCorrect ? "var(--color-success-border)" : "var(--color-error-border)") : "var(--border)"}`,
          borderRadius: 16,
          padding: "10px 12px",
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          alignItems: "center",
          transition: "border-color 0.2s, background 0.2s",
        }}>
          {placedTiles.length === 0 && !checked && (
            <span style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)", fontStyle: "italic" }}>Trykk ord nedenfor…</span>
          )}
          {placedTiles.map((tile, i) => (
            <Chip
              key={tile.id}
              tone={checked ? (isCorrect ? "correct" : "wrong") : "active"}
              onClick={() => handleRemove(tile.id, i)}
              style={{ cursor: checked ? "default" : "pointer" }}
            >
              {tile.word}
            </Chip>
          ))}
        </div>

        {checked && (
          <div style={{ marginTop: 10, padding: "10px 14px", background: isCorrect ? "var(--color-success-bg)" : "var(--color-error-bg)", borderRadius: 12, border: `1px solid ${isCorrect ? "var(--color-success-border)" : "var(--color-error-border)"}` }}>
            <div style={{ fontSize: 13, color: isCorrect ? "var(--color-success)" : "var(--color-error)", fontFamily: "var(--font-body)", fontWeight: 600 }}>
              {isCorrect ? "✓ Riktig!" : "✗ Feil"}
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
      <div style={{ padding: "0 20px 120px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {unplacedTiles.map(tile => (
            <Chip key={tile.id} tone="idle" onClick={() => handlePlace(tile)}>
              {tile.word}
            </Chip>
          ))}
        </div>
      </div>

      {/* Action dock */}
      <Dock>
        {!checked ? (
          <>
            <PrimaryButton onClick={handleCheck} disabled={placed.length === 0} style={{ flex: 1 }}>
              Sjekk
            </PrimaryButton>
            <GhostButton onClick={handleSkip} style={{ padding: "15px 18px" }}>
              Gi opp
            </GhostButton>
          </>
        ) : (
          <PrimaryButton onClick={handleNext} style={{ flex: 1 }}>
            {idx + 1 >= sentences.length ? "Se resultat" : "Neste →"}
          </PrimaryButton>
        )}
      </Dock>

      {nav}
    </div>
  );
}
