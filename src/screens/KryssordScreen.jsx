import { useState, useEffect, useRef, useCallback } from "react";
import { logDailyAnswer, logGameSession } from "../utils.jsx";
import BottomNav from "../components/BottomNav.jsx";

const GRID_SIZE = 15;

// ── Crossword builder ────────────────────────────────────────────────────────

function emptyGrid() {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => ({ letter: "", wordIds: [], black: true }))
  );
}

function canPlace(grid, word, row, col, dir) {
  const len = word.length;
  // Check bounds
  if (dir === "across") {
    if (col < 0 || col + len > GRID_SIZE) return false;
    if (row < 0 || row >= GRID_SIZE) return false;
  } else {
    if (row < 0 || row + len > GRID_SIZE) return false;
    if (col < 0 || col >= GRID_SIZE) return false;
  }

  for (let i = 0; i < len; i++) {
    const r = dir === "across" ? row : row + i;
    const c = dir === "across" ? col + i : col;
    const cell = grid[r][c];

    if (!cell.black) {
      // Cell already has a letter — must match
      if (cell.letter !== word[i]) return false;
    } else {
      // Cell is black — check adjacency: no parallel neighbor word
      if (dir === "across") {
        // Check above and below (unless this is the crossing point)
        if (r > 0 && !grid[r - 1][c].black && grid[r - 1][c].letter !== "") return false;
        if (r < GRID_SIZE - 1 && !grid[r + 1][c].black && grid[r + 1][c].letter !== "") return false;
      } else {
        if (c > 0 && !grid[r][c - 1].black && grid[r][c - 1].letter !== "") return false;
        if (c < GRID_SIZE - 1 && !grid[r][c + 1].black && grid[r][c + 1].letter !== "") return false;
      }
    }
  }

  // Check cells immediately before and after the word
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
  const word = fr;
  for (let i = 0; i < word.length; i++) {
    const r = dir === "across" ? row : row + i;
    const c = dir === "across" ? col + i : col;
    grid[r][c] = {
      letter: word[i],
      wordIds: [...(grid[r][c].wordIds || []), id],
      black: false,
    };
  }
}

function buildCrossword(candidates) {
  // candidates = [{ fr, no }] — short, no-space French words
  if (!candidates.length) return null;

  const grid = emptyGrid();
  const placed = [];
  let nextId = 0;

  // Place first word horizontally in center
  const first = candidates[0];
  const startCol = Math.floor((GRID_SIZE - first.fr.length) / 2);
  const startRow = Math.floor(GRID_SIZE / 2);
  const firstEntry = { id: nextId++, fr: first.fr, no: first.no, row: startRow, col: startCol, dir: "across" };
  placeWord(grid, firstEntry);
  placed.push(firstEntry);

  // Try to place remaining words
  for (let k = 1; k < candidates.length && placed.length < 8; k++) {
    const cand = candidates[k];
    const word = cand.fr;
    let foundEntry = null;

    // Try crossing with each placed word at shared letters
    for (const p of placed) {
      if (foundEntry) break;
      const oppDir = p.dir === "across" ? "down" : "across";

      for (let pi = 0; pi < p.fr.length; pi++) {
        if (foundEntry) break;
        for (let wi = 0; wi < word.length; wi++) {
          if (word[wi] !== p.fr[pi]) continue;

          // Compute placement position
          let row, col;
          if (p.dir === "across") {
            // p is horizontal; new word is vertical crossing at (p.row, p.col+pi)
            row = p.row - wi;
            col = p.col + pi;
          } else {
            // p is vertical; new word is horizontal crossing at (p.row+pi, p.col)
            row = p.row + pi;
            col = p.col - wi;
          }

          if (canPlace(grid, word, row, col, oppDir)) {
            foundEntry = { id: nextId++, fr: word, no: cand.no, row, col, dir: oppDir };
            break;
          }
        }
      }
    }

    if (foundEntry) {
      placeWord(grid, foundEntry);
      placed.push(foundEntry);
    }
  }

  if (placed.length < 2) return null;

  // Trim grid to bounding box + 1 padding
  let minR = GRID_SIZE, maxR = 0, minC = GRID_SIZE, maxC = 0;
  for (const p of placed) {
    minR = Math.min(minR, p.row);
    maxR = Math.max(maxR, p.dir === "across" ? p.row : p.row + p.fr.length - 1);
    minC = Math.min(minC, p.col);
    maxC = Math.max(maxC, p.dir === "across" ? p.col + p.fr.length - 1 : p.col);
  }
  minR = Math.max(0, minR - 1);
  minC = Math.max(0, minC - 1);
  maxR = Math.min(GRID_SIZE - 1, maxR + 1);
  maxC = Math.min(GRID_SIZE - 1, maxC + 1);

  const trimmed = grid.slice(minR, maxR + 1).map(row => row.slice(minC, maxC + 1));

  // Adjust word coords to trimmed grid
  const adjusted = placed.map(p => ({ ...p, row: p.row - minR, col: p.col - minC }));

  // Assign numbers (top-to-bottom, left-to-right)
  const numberedCells = [];
  for (let r = 0; r < trimmed.length; r++) {
    for (let c = 0; c < trimmed[0].length; c++) {
      const cell = trimmed[r][c];
      if (cell.black) continue;
      const startsAcross = adjusted.some(p => p.dir === "across" && p.row === r && p.col === c);
      const startsDown = adjusted.some(p => p.dir === "down" && p.row === r && p.col === c);
      if (startsAcross || startsDown) numberedCells.push({ r, c });
    }
  }
  const numberedWords = adjusted.map(p => {
    const idx = numberedCells.findIndex(nc => nc.r === p.row && nc.c === p.col);
    return { ...p, number: idx + 1 };
  });

  return { grid: trimmed, words: numberedWords };
}

// ── Word picker ───────────────────────────────────────────────────────────────

function pickWords(bankWords) {
  const candidates = bankWords
    .map(w => {
      // Strip article prefix
      const fr = (w.fr || "").replace(/^(le |la |les |l'|un |une )/i, "").trim().toLowerCase();
      return { fr, no: w.no || "" };
    })
    .filter(w => w.fr.length >= 3 && w.fr.length <= 10 && !/\s/.test(w.fr) && /^[a-záàâäéèêëíìîïóòôöúùûüç]+$/.test(w.fr));

  // Shuffle and deduplicate
  const seen = new Set();
  const unique = [];
  for (const w of candidates.sort(() => Math.random() - 0.5)) {
    if (!seen.has(w.fr)) { seen.add(w.fr); unique.push(w); }
    if (unique.length >= 14) break;
  }
  return unique;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function KryssordScreen({ words, onBack, screen, showWords, onNav, onGameComplete }) {
  const [crossword, setCrossword] = useState(null);
  const [filled, setFilled] = useState({});   // wordId → string
  const [selected, setSelected] = useState(null); // wordId
  const [phase, setPhase] = useState("play"); // "play" | "checked"
  const [results, setResults] = useState({});  // wordId → "correct" | "wrong"
  const [emptyBank, setEmptyBank] = useState(false);
  const inputRef = useRef(null);

  const generate = useCallback(() => {
    const candidates = pickWords(words);
    if (candidates.length < 3) { setEmptyBank(true); return; }
    const cw = buildCrossword(candidates);
    if (!cw) {
      // retry with different shuffle
      const cw2 = buildCrossword(pickWords(words));
      if (!cw2) { setEmptyBank(true); return; }
      setCrossword(cw2);
    } else {
      setCrossword(cw);
    }
    setFilled({});
    setSelected(null);
    setPhase("play");
    setResults({});
    setEmptyBank(false);
  }, [words]);

  useEffect(() => { generate(); }, [generate]);

  const selectWord = (wordId) => {
    if (phase === "checked") return;
    setSelected(wordId);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleInput = (e) => {
    if (!selected || phase === "checked") return;
    const w = crossword.words.find(ww => ww.id === selected);
    if (!w) return;
    const val = e.target.value.toLowerCase().replace(/[^a-záàâäéèêëíìîïóòôöúùûüç]/g, "");
    const clamped = val.slice(0, w.fr.length);
    setFilled(prev => ({ ...prev, [selected]: clamped }));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Backspace" && !filled[selected]) {
      // deselect on empty backspace
    }
    if (e.key === "Enter") checkAnswers();
  };

  const checkAnswers = () => {
    if (!crossword) return;
    const res = {};
    let correctCount = 0;
    for (const w of crossword.words) {
      const typed = (filled[w.id] || "").toLowerCase();
      const ok = typed === w.fr;
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

  const across = crossword?.words.filter(w => w.dir === "across").sort((a, b) => a.number - b.number) || [];
  const down   = crossword?.words.filter(w => w.dir === "down").sort((a, b) => a.number - b.number) || [];

  const allCorrect = phase === "checked" && crossword?.words.every(w => results[w.id] === "correct");

  // ── Render ────────────────────────────────────────────────────────────────

  if (emptyBank) return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 32 }}>
      <div style={{ fontSize: 52 }}>📚</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--text)", textAlign: "center" }}>Trenger flere ord</div>
      <div style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)", textAlign: "center", lineHeight: 1.7 }}>Legg til minst 8–10 ord i ordbanken<br />for å spille Kryssord.</div>
      <button onClick={onBack} style={{ marginTop: 8, padding: "12px 28px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, fontSize: 14, color: "var(--text)", cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  if (!crossword) return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--cream)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)" }}>Bygger kryssordet…</div>
    </div>
  );

  const { grid, words: cwWords } = crossword;
  const cols = grid[0]?.length || 1;
  const cellSize = Math.min(34, Math.floor((Math.min(window.innerWidth, 500) - 44) / cols));

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      {/* Hidden input for mobile keyboard */}
      <input
        ref={inputRef}
        value={filled[selected] || ""}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 1, height: 1 }}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
      />

      {/* Header */}
      <div style={{ padding: "52px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)", padding: 0 }}>← Tilbake</button>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.3px" }}>
          {allCorrect ? "🎉 Perfekt!" : "Kryssord"}
        </div>
        <button onClick={generate} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)", padding: 0 }}>Nytt ↺</button>
      </div>

      {/* Grid */}
      <div style={{ display: "flex", justifyContent: "center", padding: "0 22px 18px", overflowX: "auto" }}>
        <div style={{ display: "inline-flex", flexDirection: "column", gap: 2, border: "1px solid var(--border)", borderRadius: 10, padding: 6, background: "var(--surface)" }}>
          {grid.map((row, r) => (
            <div key={r} style={{ display: "flex", gap: 2 }}>
              {row.map((cell, c) => {
                if (cell.black) return (
                  <div key={c} style={{ width: cellSize, height: cellSize, background: "var(--bg)", borderRadius: 3 }} />
                );

                // Which word(s) does this cell belong to?
                const cellWords = cwWords.filter(w => {
                  if (w.dir === "across") return w.row === r && c >= w.col && c < w.col + w.fr.length;
                  return w.col === c && r >= w.row && r < w.row + w.fr.length;
                });
                const isSelected = cellWords.some(w => w.id === selected);
                const wordNumber = cwWords.find(w => w.row === r && w.col === c)?.number;

                // Compute displayed letter
                let displayLetter = "";
                for (const w of cellWords) {
                  const idx = w.dir === "across" ? c - w.col : r - w.row;
                  const typed = filled[w.id] || "";
                  if (typed[idx]) { displayLetter = typed[idx]; break; }
                }

                // Color
                let bg = isSelected ? "rgba(230,211,168,0.22)" : "var(--bg)";
                let borderColor = isSelected ? "var(--cream)" : "var(--border)";
                if (phase === "checked") {
                  const correctWords = cellWords.filter(w => results[w.id] === "correct");
                  const wrongWords   = cellWords.filter(w => results[w.id] === "wrong");
                  if (wrongWords.length)   { bg = "rgba(248,113,113,0.15)"; borderColor = "rgba(248,113,113,0.5)"; }
                  if (correctWords.length && !wrongWords.length) { bg = "rgba(94,154,111,0.15)"; borderColor = "rgba(94,154,111,0.5)"; }
                }

                return (
                  <button
                    key={c}
                    onClick={() => {
                      if (phase === "checked") return;
                      // Cycle between words at this cell
                      const ids = cellWords.map(w => w.id);
                      const cur = ids.indexOf(selected);
                      const next = ids[(cur + 1) % ids.length];
                      selectWord(next ?? ids[0]);
                    }}
                    style={{
                      width: cellSize, height: cellSize,
                      background: bg,
                      border: `1.5px solid ${borderColor}`,
                      borderRadius: 4,
                      padding: 0,
                      cursor: "pointer",
                      position: "relative",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "background 0.15s",
                    }}
                  >
                    {wordNumber && (
                      <span style={{ position: "absolute", top: 1, left: 2, fontSize: 7, color: "var(--text-subtle)", lineHeight: 1, fontFamily: "var(--font-body)", fontWeight: 600 }}>{wordNumber}</span>
                    )}
                    <span style={{ fontSize: cellSize * 0.48, color: "var(--text)", fontFamily: "var(--font-body)", fontWeight: 600, textTransform: "uppercase", lineHeight: 1 }}>
                      {displayLetter}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Selected word hint */}
      {selected && phase === "play" && (() => {
        const w = cwWords.find(ww => ww.id === selected);
        return w ? (
          <div style={{ textAlign: "center", padding: "0 22px 10px", fontSize: 13, color: "var(--cream)", fontFamily: "var(--font-body)" }}>
            {w.number}{w.dir === "across" ? "→" : "↓"} · {w.no} · {w.fr.length} bokstaver
          </div>
        ) : null;
      })()}

      {/* Clues */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 22px 180px", display: "flex", flexDirection: "column", gap: 18 }}>
        {[["→ Bortover", across], ["↓ Nedover", down]].map(([label, list]) => (
          <div key={label}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-subtle)", letterSpacing: 1, textTransform: "uppercase", fontFamily: "var(--font-body)", marginBottom: 8 }}>{label}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {list.map(w => {
                const isSel = w.id === selected;
                const res = results[w.id];
                return (
                  <button
                    key={w.id}
                    onClick={() => selectWord(w.id)}
                    style={{
                      textAlign: "left", background: isSel ? "rgba(230,211,168,0.1)" : "var(--surface)",
                      border: `1px solid ${isSel ? "var(--cream)" : res === "correct" ? "rgba(94,154,111,0.4)" : res === "wrong" ? "rgba(248,113,113,0.4)" : "var(--border)"}`,
                      borderRadius: 12, padding: "10px 14px", cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-subtle)", fontFamily: "var(--font-body)" }}>{w.number}. </span>
                    <span style={{ fontSize: 14, color: "var(--text)", fontFamily: "var(--font-body)" }}>{w.no}</span>
                    {phase === "checked" && res === "wrong" && (
                      <span style={{ fontSize: 12, color: "#ef4444", fontFamily: "var(--font-body)", marginLeft: 8 }}>({w.fr})</span>
                    )}
                    {phase === "checked" && res === "correct" && (
                      <span style={{ fontSize: 12, color: "#5e9a6f", fontFamily: "var(--font-body)", marginLeft: 8 }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom actions */}
      <div style={{ position: "fixed", bottom: 84, left: 0, right: 0, padding: "12px 22px", background: "linear-gradient(to top, var(--bg) 80%, transparent)", zIndex: 190 }}>
        {phase === "play" ? (
          <button
            onClick={checkAnswers}
            style={{ width: "100%", padding: "15px", background: "var(--cream)", color: "#1a1209", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}
          >
            Sjekk svar
          </button>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={generate} style={{ flex: 1, padding: "14px", background: "var(--cream)", color: "#1a1209", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>Nytt kryssord</button>
            <button onClick={onBack} style={{ flex: 1, padding: "14px", background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 14, fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>Tilbake</button>
          </div>
        )}
      </div>

      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}
