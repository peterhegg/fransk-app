import { useState, useRef } from "react";
import { shuffle, logGameSession, logSentenceAnswer, loadUserProfile } from "../utils.jsx";
import { PROXY_URL, APP_TOKEN } from "../constants.js";
import { getActiveLang } from "../languages/index.js";
import BottomNav from "../components/BottomNav.jsx";
import { GameHeader, GameProgress, GameResult, LoadingState, Chip, Dock, PrimaryButton, GhostButton } from "../components/GameUI.jsx";
import AiFeedback from "../components/AiFeedback.jsx";

function levelInstructions(level) {
  const l = level || "A1/A2";
  if (l === "A1") return "Maks 5 ord per setning. Kun presens, enkle pronomen.";
  if (l === "A1/A2") return "Maks 7 ord per setning. Presens, enkel negasjon.";
  if (l === "A2") return "Maks 8 ord. Presens og passé composé.";
  return "7-10 ord. Passé composé og enkle konjunksjoner.";
}

async function fetchBuildSentences(words, grammarWords, direction = "no-fr") {
  const lang = getActiveLang();
  const allWords = [...words, ...grammarWords];
  if (!allWords.length) return null;
  const sample = shuffle([...allWords]).slice(0, 30);
  const wordList = sample.map(w => `${w.fr}=${w.no}`).join(", ");
  const profile = loadUserProfile();
  const lvl = profile.level || "A1/A2";
  const count = 7;
  const buildFrench = direction === "no-fr";

  const prompt = `${lang.nameEn} sentence-building exercise for Norwegian ${lvl} learner${profile.dysleksi ? " (dyslexia)" : ""}.
WORDS: ${wordList}
Make ${count} sentences (${levelInstructions(lvl)}).
${buildFrench
  ? `The learner is shown the Norwegian sentence and builds the ${lang.nameEn.toUpperCase()} translation. For each sentence add 2-3 ${lang.nameEn.toUpperCase()} distractor words: wrong conjugations, wrong gender forms, or near-synonyms that don't fit.`
  : `The learner is shown the ${lang.nameEn} sentence and builds the NORWEGIAN translation. For each sentence add 2-3 NORWEGIAN distractor words: wrong inflections or near-synonyms that don't fit the sentence. Example: if sentence uses "spiser", add "spiste" or "drikker".`}
JSON only, no markdown:
[{"no":"Norwegian sentence","fr":"${lang.nameEn} sentence","distractors":["wrong1","wrong2","wrong3"]}]`;

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
  const [phase, setPhase] = useState("mode");
  const [direction, setDirection] = useState("no-fr");
  const [sentences, setSentences] = useState([]);
  const [idx, setIdx] = useState(0);
  const [tiles, setTiles] = useState([]);
  const [placed, setPlaced] = useState([]);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const dragRef = useRef(null);

  const lang = getActiveLang();
  const buildFrench = direction === "no-fr";
  const nav = <BottomNav screen={screen} showWords={showWords} onNav={onNav} />;

  async function load(dir) {
    setPhase("loading");
    setSentences([]);
    setIdx(0);
    setScore(0);
    try {
      const result = await fetchBuildSentences(words, grammarWords || [], dir);
      if (!result || result.length < 2) { setPhase("error"); return; }
      setSentences(result);
      initRound(result, 0, dir);
      setPhase("play");
    } catch {
      setPhase("error");
    }
  }

  const chooseDirection = (dir) => {
    setDirection(dir);
    load(dir);
  };

  function initRound(sents, i, dir = direction) {
    const s = sents[i];
    if (!s) return;
    const target = dir === "no-fr" ? s.fr : s.no;
    const correctWords = tokenize(target);
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
  const sourceText = current ? (buildFrench ? current.no : current.fr) : "";
  const targetText = current ? (buildFrench ? current.fr : current.no) : "";
  const placedTiles = placed.map(id => tiles.find(t => t.id === id)).filter(Boolean);
  const unplacedTiles = tiles.filter(t => !placed.includes(t.id));
  const builtSentence = placedTiles.map(t => t.word).join(" ");

  const handlePlace = (tile) => {
    if (checked) return;
    setPlaced(p => [...p, tile.id]);
  };

  const handleRemoveByIndex = (placedIdx) => {
    if (checked) return;
    setPlaced(p => p.filter((_, i) => i !== placedIdx));
  };

  // Drag-to-reorder placed tiles (pointer-based, works on touch).
  const handleTilePointerDown = (e, placedIdx) => {
    if (checked) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    dragRef.current = { fromIdx: placedIdx, startX: e.clientX, startY: e.clientY, moved: false };
  };

  const handleTilePointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    if (!d.moved && Math.abs(e.clientX - d.startX) < 8 && Math.abs(e.clientY - d.startY) < 8) return;
    d.moved = true;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const tileEl = el?.closest?.("[data-placed-idx]");
    if (!tileEl) return;
    const overIdx = parseInt(tileEl.dataset.placedIdx, 10);
    if (isNaN(overIdx) || overIdx === d.fromIdx) return;
    setPlaced(p => {
      const next = [...p];
      const [moved] = next.splice(d.fromIdx, 1);
      next.splice(overIdx, 0, moved);
      return next;
    });
    d.fromIdx = overIdx;
  };

  const handleTilePointerUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (d && !d.moved) handleRemoveByIndex(d.fromIdx);
  };

  const handleCheck = () => {
    if (!placed.length) return;
    const correct = normalize(builtSentence) === normalize(targetText);
    setIsCorrect(correct);
    setChecked(true);
    if (correct) { setScore(s => s + 1); logSentenceAnswer(); }
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

  const restart = async () => { await load(direction); };

  // ── Mode selector ─────────────────────────────────────────────────────────
  if (phase === "mode") return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <GameHeader onBack={onBack} backLabel="Tilbake" title="Bygg setningen" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 28px", gap: 16 }}>
        <div style={{ fontSize: 52 }}>🏗️</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, color: "var(--text)", textAlign: "center" }}>Hva vil du oversette fra?</div>

        <button onClick={() => chooseDirection("no-fr")} className="press" style={{
          width: "100%", maxWidth: 340,
          background: "var(--surface)", border: "1px solid var(--cream)", borderRadius: 18,
          padding: "20px 22px", textAlign: "left", cursor: "pointer",
        }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 500, color: "var(--cream)", marginBottom: 4 }}>🇳🇴 → 🇫🇷 Fra norsk</div>
          <div style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)", lineHeight: 1.6 }}>Se den norske setningen, bygg den {lang.label.toLowerCase()}.</div>
        </button>

        <button onClick={() => chooseDirection("fr-no")} className="press" style={{
          width: "100%", maxWidth: 340,
          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18,
          padding: "20px 22px", textAlign: "left", cursor: "pointer",
        }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 500, color: "var(--text)", marginBottom: 4 }}>🇫🇷 → 🇳🇴 Fra fransk</div>
          <div style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)", lineHeight: 1.6 }}>Se den {lang.label.toLowerCase()} setningen, bygg den norske.</div>
        </button>
      </div>
      {nav}
    </div>
  );

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
        secondary={{ label: "Bytt språk", onClick: () => setPhase("mode") }}
        tertiary={{ label: "Hjem", onClick: onBack }}
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

      {/* Source prompt */}
      <div style={{ padding: "0 20px 16px" }}>
        <div style={{ fontSize: 11, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "var(--font-body)", marginBottom: 8 }}>
          {buildFrench ? `Bygg på ${lang.label.toLowerCase()}:` : "Bygg på norsk:"}
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.2px", lineHeight: 1.4 }}>
            {sourceText}
          </div>
          {!buildFrench && (
            <button onClick={() => speak(current.fr, 0.8)} className="press" style={{ flexShrink: 0, background: "none", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 12px", fontSize: 16, cursor: "pointer", color: "var(--cream)" }}>🔊</button>
          )}
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
            <span
              key={tile.id}
              data-placed-idx={i}
              onPointerDown={checked ? undefined : e => handleTilePointerDown(e, i)}
              onPointerMove={checked ? undefined : handleTilePointerMove}
              onPointerUp={checked ? undefined : handleTilePointerUp}
              style={{ display: "inline-flex", touchAction: "none" }}
            >
              <Chip
                tone={checked ? (isCorrect ? "correct" : "wrong") : "active"}
                style={{ cursor: checked ? "default" : "grab" }}
              >
                {tile.word}
              </Chip>
            </span>
          ))}
        </div>
        {!checked && placedTiles.length > 1 && (
          <div style={{ fontSize: 11, color: "var(--text-subtle)", fontFamily: "var(--font-body)", marginTop: 6, fontStyle: "italic" }}>
            Dra for å flytte ord · trykk for å fjerne
          </div>
        )}

        {checked && (
          <div style={{ marginTop: 10, padding: "10px 14px", background: isCorrect ? "var(--color-success-bg)" : "var(--color-error-bg)", borderRadius: 12, border: `1px solid ${isCorrect ? "var(--color-success-border)" : "var(--color-error-border)"}` }}>
            <div style={{ fontSize: 13, color: isCorrect ? "var(--color-success)" : "var(--color-error)", fontFamily: "var(--font-body)", fontWeight: 600 }}>
              {isCorrect ? "✓ Riktig!" : "✗ Feil"}
            </div>
            {!isCorrect && (
              <div style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)", marginTop: 4 }}>
                Riktig: <span style={{ color: "var(--text)" }}>{targetText}</span>
              </div>
            )}
          </div>
        )}

        {checked && !isCorrect && (
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            <AiFeedback
              isOnline={isOnline}
              resetKey={`bygg-${idx}`}
              buildPrompt={() => buildFrench
                ? `Norsk elev bygde en ${lang.label.toLowerCase()} setning feil.\nNorsk: "${current?.no}"\nKorrekt ${lang.label.toLowerCase()}: "${current?.fr}"\nEleven bygde: "${builtSentence}"\n\nForklar på norsk (2 korte setninger) SPESIFIKT hva som er galt — feil ordstilling, bøying eller ordvalg for akkurat denne setningen. Gi én huskeregel knyttet til strukturen her.\nSvar KUN som JSON: {"forklaring":"...","huskeregel":"..."}`
                : `Norsk elev oversatte en ${lang.label.toLowerCase()} setning til norsk feil.\n${lang.label}: "${current?.fr}"\nKorrekt norsk: "${current?.no}"\nEleven bygde: "${builtSentence}"\n\nForklar på norsk (2 korte setninger) SPESIFIKT hva som er galt med oversettelsen — feil ordstilling, bøying eller ordvalg. Gi én huskeregel knyttet til denne setningen.\nSvar KUN som JSON: {"forklaring":"...","huskeregel":"..."}`}
            />
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
