import { useState, useEffect, useRef, useCallback } from "react";
import { logDailyAnswer, logGameSession, loadUserProfile } from "../utils.jsx";
import { getActiveLang } from "../languages/index.js";
import BottomNav from "../components/BottomNav.jsx";
import { GameHeader, LoadingState, Dock, PrimaryButton, GhostButton } from "../components/GameUI.jsx";
import AiFeedback from "../components/AiFeedback.jsx";

const GRID_SIZE = 15;

// ── Crossword builder ────────────────────────────────────────────────────────

function emptyGrid() {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({ letter: "", wordIds: [], black: true }))
  );
}

function canPlace(grid, word, row, col, dir) {
  const len = word.length;
  if (dir === "across") {
    if (col < 0 || col + len > GRID_SIZE || row < 0 || row >= GRID_SIZE) return false;
  } else {
    if (row < 0 || row + len > GRID_SIZE || col < 0 || col >= GRID_SIZE) return false;
  }

  for (let i = 0; i < len; i++) {
    const r = dir === "across" ? row : row + i;
    const c = dir === "across" ? col + i : col;
    const cell = grid[r][c];

    if (!cell.black) {
      if (cell.letter !== word[i]) return false;
    } else {
      if (dir === "across") {
        if (r > 0 && !grid[r - 1][c].black) return false;
        if (r < GRID_SIZE - 1 && !grid[r + 1][c].black) return false;
      } else {
        if (c > 0 && !grid[r][c - 1].black) return false;
        if (c < GRID_SIZE - 1 && !grid[r][c + 1].black) return false;
      }
    }
  }

  if (dir === "across") {
    if (col > 0 && !grid[row][col - 1].black) return false;
    if (col + len < GRID_SIZE && !grid[row][col + len].black) return false;
  } else {
    if (row > 0 && !grid[row - 1][col].black) return false;
    if (row + len < GRID_SIZE && !grid[row + len][col].black) return false;
  }
  return true;
}

function placeWord(grid, wordEntry) {
  const { fr, row, col, dir, id } = wordEntry;
  for (let i = 0; i < fr.length; i++) {
    const r = dir === "across" ? row : row + i;
    const c = dir === "across" ? col + i : col;
    grid[r][c] = { letter: fr[i], wordIds: [...(grid[r][c].wordIds || []), id], black: false };
  }
}

function buildCrossword(candidates) {
  if (!candidates.length) return null;
  const grid = emptyGrid();
  const placed = [];
  let nextId = 0;

  const first = candidates[0];
  const startCol = Math.floor((GRID_SIZE - first.fr.length) / 2);
  const startRow = Math.floor(GRID_SIZE / 2);
  const firstEntry = { id: nextId++, fr: first.fr, no: first.no, row: startRow, col: startCol, dir: "across" };
  placeWord(grid, firstEntry);
  placed.push(firstEntry);

  for (let k = 1; k < candidates.length && placed.length < 8; k++) {
    const cand = candidates[k];
    const word = cand.fr;
    let foundEntry = null;

    for (const p of placed) {
      if (foundEntry) break;
      const oppDir = p.dir === "across" ? "down" : "across";
      for (let pi = 0; pi < p.fr.length; pi++) {
        if (foundEntry) break;
        for (let wi = 0; wi < word.length; wi++) {
          if (word[wi] !== p.fr[pi]) continue;
          let row, col;
          if (p.dir === "across") { row = p.row - wi; col = p.col + pi; }
          else { row = p.row + pi; col = p.col - wi; }
          if (canPlace(grid, word, row, col, oppDir)) {
            foundEntry = { id: nextId++, fr: word, no: cand.no, row, col, dir: oppDir };
            break;
          }
        }
      }
    }
    if (foundEntry) { placeWord(grid, foundEntry); placed.push(foundEntry); }
  }

  if (placed.length < 2) return null;

  let minR = GRID_SIZE, maxR = 0, minC = GRID_SIZE, maxC = 0;
  for (const p of placed) {
    minR = Math.min(minR, p.row);
    maxR = Math.max(maxR, p.dir === "across" ? p.row : p.row + p.fr.length - 1);
    minC = Math.min(minC, p.col);
    maxC = Math.max(maxC, p.dir === "across" ? p.col + p.fr.length - 1 : p.col);
  }
  minR = Math.max(0, minR - 1); minC = Math.max(0, minC - 1);
  maxR = Math.min(GRID_SIZE - 1, maxR + 1); maxC = Math.min(GRID_SIZE - 1, maxC + 1);

  const trimmed = grid.slice(minR, maxR + 1).map(row => row.slice(minC, maxC + 1));
  const adjusted = placed.map(p => ({ ...p, row: p.row - minR, col: p.col - minC }));

  // Number cells top-to-bottom, left-to-right
  const numberedCells = [];
  for (let r = 0; r < trimmed.length; r++) {
    for (let c = 0; c < trimmed[0].length; c++) {
      if (trimmed[r][c].black) continue;
      const startsAcross = adjusted.some(p => p.dir === "across" && p.row === r && p.col === c);
      const startsDown   = adjusted.some(p => p.dir === "down"   && p.row === r && p.col === c);
      if (startsAcross || startsDown) numberedCells.push({ r, c });
    }
  }
  const numberedWords = adjusted.map(p => {
    const idx = numberedCells.findIndex(nc => nc.r === p.row && nc.c === p.col);
    return { ...p, number: idx + 1 };
  });

  return { grid: trimmed, words: numberedWords };
}

const ARTICLE_RE_CW = {
  fr:      /^(le |la |les |l'|un |une )/i,
  "de-CH": /^(der |die |das |ein |eine )/i,
};
const WORD_CHAR_RE_CW = {
  fr:      /^[a-záàâäéèêëíìîïóòôöúùûüç]+$/,
  "de-CH": /^[a-zäöüß]+$/,
};

function pickWords(bankWords, langId) {
  const articleRe = ARTICLE_RE_CW[langId] || ARTICLE_RE_CW.fr;
  const wordCharRe = WORD_CHAR_RE_CW[langId] || WORD_CHAR_RE_CW.fr;
  const candidates = bankWords
    .map(w => {
      const fr = (w.fr || "").replace(articleRe, "").trim().toLowerCase();
      return { fr, no: w.no || "" };
    })
    .filter(w => w.fr.length >= 3 && w.fr.length <= 10 && !/\s/.test(w.fr) && wordCharRe.test(w.fr));

  const seen = new Set();
  const unique = [];
  for (const w of candidates.sort(() => Math.random() - 0.5)) {
    if (!seen.has(w.fr)) { seen.add(w.fr); unique.push(w); }
    if (unique.length >= 14) break;
  }
  return unique;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function KryssordScreen({ words, onBack, isOnline, screen, showWords, onNav, onGameComplete }) {
  const langId = getActiveLang().id;
  const [crossword, setCrossword] = useState(null);
  const [typed, setTyped]         = useState({});   // wordId → string (what user typed so far)
  const [selected, setSelected]   = useState(null); // wordId
  const [phase, setPhase]         = useState("play");
  const [results, setResults]     = useState({});
  const [emptyBank, setEmptyBank] = useState(false);
  const inputRef = useRef(null);

  const generate = useCallback(() => {
    const candidates = pickWords(words, langId);
    if (candidates.length < 3) { setEmptyBank(true); return; }
    let cw = buildCrossword(candidates);
    if (!cw) cw = buildCrossword(pickWords(words, langId));
    if (!cw) { setEmptyBank(true); return; }
    setCrossword(cw);
    setTyped({});
    setSelected(null);
    setPhase("play");
    setResults({});
    setEmptyBank(false);
  }, [words]);

  useEffect(() => { generate(); }, [generate]);

  // Focus input when word is selected
  useEffect(() => {
    if (selected !== null) setTimeout(() => inputRef.current?.focus(), 80);
  }, [selected]);

  const selectWord = (wordId) => {
    if (phase === "checked") return;
    setSelected(wordId === selected ? null : wordId);
  };

  const checkAnswers = () => {
    if (!crossword) return;
    const res = {};
    let correctCount = 0;
    for (const w of crossword.words) {
      const t = (typed[w.id] || "").toLowerCase().trim();
      const ok = t === w.fr;
      res[w.id] = ok ? "correct" : "wrong";
      if (ok) correctCount++;
    }
    setResults(res);
    setPhase("checked");
    setSelected(null);
    logGameSession(crossword.words.length);
    for (let i = 0; i < correctCount; i++) logDailyAnswer("vocab");
    if (onGameComplete) onGameComplete();
  };

  const selectedWord = crossword?.words.find(w => w.id === selected);
  const across = crossword?.words.filter(w => w.dir === "across").sort((a, b) => a.number - b.number) || [];
  const down   = crossword?.words.filter(w => w.dir === "down").sort((a, b) => a.number - b.number) || [];
  const allCorrect = phase === "checked" && crossword?.words.every(w => results[w.id] === "correct");

  const nav = <BottomNav screen={screen} showWords={showWords} onNav={onNav} />;

  if (emptyBank) return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 32 }}>
      <div style={{ fontSize: 52 }}>📚</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--text)", textAlign: "center" }}>Trenger flere ord</div>
      <div style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)", textAlign: "center", lineHeight: 1.7 }}>Legg til minst 8–10 ord i ordbanken<br />for å spille Kryssord.</div>
      <GhostButton onClick={onBack} style={{ marginTop: 8 }}>← Tilbake</GhostButton>
      {nav}
    </div>
  );

  if (!crossword) return <LoadingState label="Bygger kryssordet…" bottomNav={nav} />;

  const { grid, words: cwWords } = crossword;
  const cols = grid[0]?.length || 1;
  const cellSize = Math.min(36, Math.floor((Math.min(window.innerWidth, 500) - 48) / cols));

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>

      <GameHeader
        onBack={onBack}
        backLabel="Tilbake"
        title={allCorrect ? "🎉 Perfekt!" : "Kryssord"}
        right={
          <button onClick={generate} className="press" style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)", padding: "4px 0" }}>
            Nytt ↺
          </button>
        }
      />

      {/* Grid */}
      <div style={{ display: "flex", justifyContent: "center", padding: "6px 22px 10px", overflowX: "auto" }}>
        <div style={{ display: "inline-flex", flexDirection: "column", gap: 2, border: "1px solid var(--border)", borderRadius: 10, padding: 6, background: "var(--surface)" }}>
          {grid.map((row, r) => (
            <div key={r} style={{ display: "flex", gap: 2 }}>
              {row.map((cell, c) => {
                if (cell.black) return (
                  <div key={c} style={{ width: cellSize, height: cellSize, background: "var(--bg)", borderRadius: 3 }} />
                );

                // Which words contain this cell?
                const cellWords = cwWords.filter(w => {
                  if (w.dir === "across") return w.row === r && c >= w.col && c < w.col + w.fr.length;
                  return w.col === c && r >= w.row && r < w.row + w.fr.length;
                });
                const isSelected = cellWords.some(w => w.id === selected);
                const wordNumber = cwWords.find(w => w.row === r && w.col === c)?.number;

                // Get the typed letter for this cell position
                let displayLetter = "";
                for (const w of cellWords) {
                  const idx = w.dir === "across" ? c - w.col : r - w.row;
                  const t = typed[w.id] || "";
                  if (t[idx]) { displayLetter = t[idx]; break; }
                }

                // Correct letter (for checked phase)
                const letterFromGrid = cell.letter;

                let bg = "var(--bg)";
                let borderColor = "var(--border)";
                if (isSelected) { bg = "rgba(230,211,168,0.22)"; borderColor = "var(--cream)"; }
                if (phase === "checked") {
                  const wCorrect = cellWords.some(w => results[w.id] === "correct");
                  const wWrong   = cellWords.some(w => results[w.id] === "wrong");
                  if (wWrong) { bg = "var(--color-error-bg)"; borderColor = "var(--color-error-bg)"; }
                  if (wCorrect && !wWrong) { bg = "var(--color-success-bg)"; borderColor = "var(--color-success-bg)"; }
                }

                const shownLetter = phase === "checked" ? letterFromGrid : displayLetter;

                return (
                  <button
                    key={c}
                    onClick={() => {
                      if (phase === "checked") return;
                      const ids = cellWords.map(w => w.id);
                      if (ids.length === 0) return;
                      if (ids.includes(selected)) {
                        const cur = ids.indexOf(selected);
                        setSelected(ids[(cur + 1) % ids.length]);
                      } else {
                        setSelected(ids[0]);
                      }
                    }}
                    style={{
                      width: cellSize, height: cellSize,
                      background: bg, border: `1.5px solid ${borderColor}`,
                      borderRadius: 4, padding: 0, cursor: "pointer",
                      position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {wordNumber && (
                      <span style={{ position: "absolute", top: 1, left: 2, fontSize: 7, color: "var(--text-subtle)", lineHeight: 1, fontFamily: "var(--font-body)", fontWeight: 600 }}>{wordNumber}</span>
                    )}
                    <span style={{ fontSize: cellSize * 0.46, color: phase === "checked" ? "var(--text)" : isSelected ? "var(--cream)" : "var(--text)", fontFamily: "var(--font-body)", fontWeight: 600, textTransform: "uppercase", lineHeight: 1 }}>
                      {shownLetter}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Input panel — shows when a word is selected */}
      {selected !== null && phase === "play" && selectedWord && (
        <div style={{ margin: "0 20px 10px", background: "var(--surface)", borderRadius: 16, padding: "14px 16px", border: "1px solid var(--cream)" }}>
          <div style={{ fontSize: 12, color: "var(--cream)", fontFamily: "var(--font-body)", fontWeight: 700, marginBottom: 8 }}>
            {selectedWord.number}{selectedWord.dir === "across" ? " →" : " ↓"} · {selectedWord.no} · {selectedWord.fr.length} bokstaver
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              ref={inputRef}
              value={typed[selected] || ""}
              onChange={e => {
                const val = e.target.value.toLowerCase().replace(/[^a-záàâäéèêëíìîïóòôöúùûüç]/g, "");
                const clamped = val.slice(0, selectedWord.fr.length);
                setTyped(prev => ({ ...prev, [selected]: clamped }));
              }}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  // Move to next unfilled word
                  const all = [...across, ...down];
                  const curIdx = all.findIndex(w => w.id === selected);
                  const next = all[(curIdx + 1) % all.length];
                  setSelected(next?.id ?? null);
                }
              }}
              placeholder={`Skriv på fransk…`}
              style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "11px 14px", fontSize: 15, color: "var(--text)", fontFamily: "var(--font-body)", outline: "none" }}
              autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
            />
            <button
              onClick={() => {
                // Move to next word on →
                const all = [...across, ...down];
                const curIdx = all.findIndex(w => w.id === selected);
                setSelected(all[(curIdx + 1) % all.length]?.id ?? null);
              }}
              style={{ padding: "11px 14px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 16, cursor: "pointer", color: "var(--text-subtle)" }}
            >→</button>
          </div>
        </div>
      )}

      {/* Clue lists */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 200px", display: "flex", flexDirection: "column", gap: 14 }}>
        {[["→ Bortover", across], ["↓ Nedover", down]].map(([label, list]) => (
          <div key={label}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-subtle)", letterSpacing: 1, textTransform: "uppercase", fontFamily: "var(--font-body)", marginBottom: 6 }}>{label}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {list.map(w => {
                const isSel = w.id === selected;
                const res = results[w.id];
                const userTyped = typed[w.id] || "";
                return (
                  <button
                    key={w.id}
                    onClick={() => selectWord(w.id)}
                    style={{
                      textAlign: "left",
                      background: isSel ? "rgba(230,211,168,0.1)" : "var(--surface)",
                      border: `1px solid ${isSel ? "var(--cream)" : res === "correct" ? "var(--color-success-bg)" : res === "wrong" ? "var(--color-error-bg)" : "var(--border)"}`,
                      borderRadius: 12, padding: "10px 14px", cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-subtle)", fontFamily: "var(--font-body)" }}>{w.number}. </span>
                        <span style={{ fontSize: 14, color: "var(--text)", fontFamily: "var(--font-body)" }}>{w.no}</span>
                      </span>
                      <span style={{ fontSize: 12, fontFamily: "var(--font-body)", color: res === "correct" ? "var(--color-success)" : res === "wrong" ? "var(--color-error)" : "var(--text-subtle)" }}>
                        {res === "correct" ? `✓ ${w.fr}` : res === "wrong" ? `✗ (${w.fr})` : userTyped ? `"${userTyped}"` : `${w.fr.length} bokst.`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {phase === "checked" && !allCorrect && (
          <AiFeedback
            isOnline={isOnline}
            resetKey={crossword?.words.map(w => w.id).join("-")}
            style={{ maxWidth: "100%" }}
            buildPrompt={() => {
              const wrongList = crossword.words
                .filter(w => results[w.id] === "wrong")
                .map(w => `riktig "${w.fr}" (${w.no}) — eleven skrev "${typed[w.id] || "—"}"`)
                .join("; ");
              const lvl = loadUserProfile().level || "A1/A2";
              return `Norsk ${lvl}-elev løste et fransk kryssord og stavet noen ord feil.\nFeil: ${wrongList}\n\nForklar på norsk (2-3 korte setninger) SPESIFIKT hva som er galt med stavingen for akkurat disse ordene. Gi én huskeregel for å huske riktig staving.\nSvar KUN som JSON: {"forklaring":"...","huskeregel":"..."}`;
            }}
          />
        )}
      </div>

      <Dock>
        {phase === "play" ? (
          <PrimaryButton onClick={checkAnswers} style={{ flex: 1 }}>Sjekk svar</PrimaryButton>
        ) : (
          <>
            <PrimaryButton onClick={generate} style={{ flex: 1 }}>Nytt kryssord</PrimaryButton>
            <GhostButton onClick={onBack} style={{ flex: 1 }}>Tilbake</GhostButton>
          </>
        )}
      </Dock>

      {nav}
    </div>
  );
}
