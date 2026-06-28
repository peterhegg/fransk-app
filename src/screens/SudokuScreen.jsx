import { useState, useRef, useCallback, useEffect } from "react";
import { logDailyAnswer, logGameSession } from "../utils.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { PrimaryButton, GhostButton } from "../components/GameUI.jsx";
import { getActiveLang } from "../languages/index.js";

// ── Persistence ───────────────────────────────────────────────────────────────
const SAVE_KEY = "sudoku-save";
function saveGame(s) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch {} }
function loadSave() { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || "null"); } catch { return null; } }
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch {} }

// ── Number ranges by language ─────────────────────────────────────────────────
const RANGES_BY_LANG = {
  fr: [
    { id: "1-9",     label: "1–9",     desc: "un, deux, trois…",       base: 1,   words: ["un","deux","trois","quatre","cinq","six","sept","huit","neuf"] },
    { id: "11-19",   label: "11–19",   desc: "onze, douze…",            base: 11,  words: ["onze","douze","treize","quatorze","quinze","seize","dix-sept","dix-huit","dix-neuf"] },
    { id: "21-29",   label: "21–29",   desc: "vingt et un…",            base: 21,  words: ["vingt et un","vingt-deux","vingt-trois","vingt-quatre","vingt-cinq","vingt-six","vingt-sept","vingt-huit","vingt-neuf"] },
    { id: "31-39",   label: "31–39",   desc: "trente et un…",           base: 31,  words: ["trente et un","trente-deux","trente-trois","trente-quatre","trente-cinq","trente-six","trente-sept","trente-huit","trente-neuf"] },
    { id: "41-49",   label: "41–49",   desc: "quarante et un…",         base: 41,  words: ["quarante et un","quarante-deux","quarante-trois","quarante-quatre","quarante-cinq","quarante-six","quarante-sept","quarante-huit","quarante-neuf"] },
    { id: "51-59",   label: "51–59",   desc: "cinquante et un…",        base: 51,  words: ["cinquante et un","cinquante-deux","cinquante-trois","cinquante-quatre","cinquante-cinq","cinquante-six","cinquante-sept","cinquante-huit","cinquante-neuf"] },
    { id: "61-69",   label: "61–69",   desc: "soixante et un…",         base: 61,  words: ["soixante et un","soixante-deux","soixante-trois","soixante-quatre","soixante-cinq","soixante-six","soixante-sept","soixante-huit","soixante-neuf"] },
    { id: "71-79",   label: "71–79",   desc: "soixante et onze…",       base: 71,  words: ["soixante et onze","soixante-douze","soixante-treize","soixante-quatorze","soixante-quinze","soixante-seize","soixante-dix-sept","soixante-dix-huit","soixante-dix-neuf"] },
    { id: "81-89",   label: "81–89",   desc: "quatre-vingt-un…",        base: 81,  words: ["quatre-vingt-un","quatre-vingt-deux","quatre-vingt-trois","quatre-vingt-quatre","quatre-vingt-cinq","quatre-vingt-six","quatre-vingt-sept","quatre-vingt-huit","quatre-vingt-neuf"] },
    { id: "91-99",   label: "91–99",   desc: "quatre-vingt-onze…",      base: 91,  words: ["quatre-vingt-onze","quatre-vingt-douze","quatre-vingt-treize","quatre-vingt-quatorze","quatre-vingt-quinze","quatre-vingt-seize","quatre-vingt-dix-sept","quatre-vingt-dix-huit","quatre-vingt-dix-neuf"] },
    { id: "10-90",   label: "10–90",   desc: "dix, vingt, trente…",     base: 10,  step: 10,  words: ["dix","vingt","trente","quarante","cinquante","soixante","soixante-dix","quatre-vingts","quatre-vingt-dix"] },
    { id: "100-900", label: "100–900", desc: "cent, deux cents…",       base: 100, step: 100, words: ["cent","deux cents","trois cents","quatre cents","cinq cents","six cents","sept cents","huit cents","neuf cents"] },
  ],
  "de-CH": [
    { id: "1-9",     label: "1–9",     desc: "eins, zwei, drei…",       base: 1,   words: ["eins","zwei","drei","vier","fünf","sechs","sieben","acht","neun"] },
    { id: "11-19",   label: "11–19",   desc: "elf, zwölf…",              base: 11,  words: ["elf","zwölf","dreizehn","vierzehn","fünfzehn","sechzehn","siebzehn","achtzehn","neunzehn"] },
    { id: "21-29",   label: "21–29",   desc: "einundzwanzig…",           base: 21,  words: ["einundzwanzig","zweiundzwanzig","dreiundzwanzig","vierundzwanzig","fünfundzwanzig","sechsundzwanzig","siebenundzwanzig","achtundzwanzig","neunundzwanzig"] },
    { id: "31-39",   label: "31–39",   desc: "einunddreissig…",          base: 31,  words: ["einunddreissig","zweiunddreissig","dreiunddreissig","vierunddreissig","fünfunddreissig","sechsunddreissig","siebenunddreissig","achtunddreissig","neununddreissig"] },
    { id: "41-49",   label: "41–49",   desc: "einundvierzig…",           base: 41,  words: ["einundvierzig","zweiundvierzig","dreiundvierzig","vierundvierzig","fünfundvierzig","sechsundvierzig","siebenundvierzig","achtundvierzig","neunundvierzig"] },
    { id: "51-59",   label: "51–59",   desc: "einundfünfzig…",           base: 51,  words: ["einundfünfzig","zweiundfünfzig","dreiundfünfzig","vierundfünfzig","fünfundfünfzig","sechsundfünfzig","siebenundfünfzig","achtundfünfzig","neunundfünfzig"] },
    { id: "61-69",   label: "61–69",   desc: "einundsechzig…",           base: 61,  words: ["einundsechzig","zweiundsechzig","dreiundsechzig","vierundsechzig","fünfundsechzig","sechsundsechzig","siebenundsechzig","achtundsechzig","neunundsechzig"] },
    { id: "71-79",   label: "71–79",   desc: "einundsiebzig…",           base: 71,  words: ["einundsiebzig","zweiundsiebzig","dreiundsiebzig","vierundsiebzig","fünfundsiebzig","sechsundsiebzig","siebenundsiebzig","achtundsiebzig","neunundsiebzig"] },
    { id: "81-89",   label: "81–89",   desc: "einundachtzig…",           base: 81,  words: ["einundachtzig","zweiundachtzig","dreiundachtzig","vierundachtzig","fünfundachtzig","sechsundachtzig","siebenundachtzig","achtundachtzig","neunundachtzig"] },
    { id: "91-99",   label: "91–99",   desc: "einundneunzig…",           base: 91,  words: ["einundneunzig","zweiundneunzig","dreiundneunzig","vierundneunzig","fünfundneunzig","sechsundneunzig","siebenundneunzig","achtundneunzig","neunundneunzig"] },
    { id: "10-90",   label: "10–90",   desc: "zehn, zwanzig…",           base: 10,  step: 10,  words: ["zehn","zwanzig","dreissig","vierzig","fünfzig","sechzig","siebzig","achtzig","neunzig"] },
    { id: "100-900", label: "100–900", desc: "hundert, zweihundert…",    base: 100, step: 100, words: ["hundert","zweihundert","dreihundert","vierhundert","fünfhundert","sechshundert","siebenhundert","achthundert","neunhundert"] },
  ],
};
function getRanges(langId) { return RANGES_BY_LANG[langId] || RANGES_BY_LANG.fr; }

// ── Sudoku puzzles ────────────────────────────────────────────────────────────
const PUZZLES = [
  {
    clues: [
      5,3,0, 0,7,0, 0,0,0,
      6,0,0, 1,9,5, 0,0,0,
      0,9,8, 0,0,0, 0,6,0,
      8,0,0, 0,6,0, 0,0,3,
      4,0,0, 8,0,3, 0,0,1,
      7,0,0, 0,2,0, 0,0,6,
      0,6,0, 0,0,0, 2,8,0,
      0,0,0, 4,1,9, 0,0,5,
      0,0,0, 0,8,0, 0,7,9,
    ],
    solution: [
      5,3,4, 6,7,8, 9,1,2,
      6,7,2, 1,9,5, 3,4,8,
      1,9,8, 3,4,2, 5,6,7,
      8,5,9, 7,6,1, 4,2,3,
      4,2,6, 8,5,3, 7,9,1,
      7,1,3, 9,2,4, 8,5,6,
      9,6,1, 5,3,7, 2,8,4,
      2,8,7, 4,1,9, 6,3,5,
      3,4,5, 2,8,6, 1,7,9,
    ],
  },
  {
    clues: [
      0,0,3, 0,2,0, 6,0,0,
      9,0,0, 3,0,5, 0,0,1,
      0,0,1, 8,0,6, 4,0,0,
      0,0,8, 1,0,2, 9,0,0,
      7,0,0, 0,0,0, 0,0,8,
      0,0,6, 7,0,8, 2,0,0,
      0,0,2, 6,0,9, 5,0,0,
      8,0,0, 2,0,3, 0,0,9,
      0,0,5, 0,1,0, 3,0,0,
    ],
    solution: [
      4,8,3, 9,2,1, 6,5,7,
      9,6,7, 3,4,5, 8,2,1,
      2,5,1, 8,7,6, 4,9,3,
      5,4,8, 1,3,2, 9,7,6,
      7,2,9, 5,6,4, 1,3,8,
      1,3,6, 7,9,8, 2,4,5,
      3,7,2, 6,8,9, 5,1,4,
      8,1,4, 2,5,3, 7,6,9,
      6,9,5, 4,1,7, 3,8,2,
    ],
  },
  {
    clues: [
      0,2,0, 0,0,0, 0,0,0,
      0,0,0, 6,0,0, 0,0,3,
      0,7,4, 0,8,0, 0,0,0,
      0,0,0, 0,0,3, 0,0,2,
      0,8,0, 0,4,0, 0,1,0,
      6,0,0, 5,0,0, 0,0,0,
      0,0,0, 0,1,0, 7,8,0,
      5,0,0, 0,0,9, 0,0,0,
      0,0,0, 0,0,0, 0,4,0,
    ],
    solution: [
      1,2,6, 4,3,7, 9,5,8,
      8,9,5, 6,2,1, 4,7,3,
      3,7,4, 9,8,5, 1,2,6,
      4,5,7, 1,9,3, 8,6,2,
      9,8,3, 2,4,6, 5,1,7,
      6,1,2, 5,7,8, 3,9,4,
      2,4,9, 3,1,6, 7,8,5,
      5,6,8, 7,2,9, 2,3,1,
      7,3,1, 8,5,2, 6,4,9,
    ],
  },
];

// ── Difficulty ────────────────────────────────────────────────────────────────
const DIFF_LABELS = { lett: "Lett", middels: "Middels", vanskelig: "Vanskelig" };

// Deterministic LCG shuffle
function lcgShuffle(arr, seed) {
  const a = [...arr];
  let s = Math.abs(seed) || 42;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0x7FFFFFFF;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Returns 81-element clue array for the given difficulty
function generateClues(puzzle, difficulty, seed) {
  if (difficulty === "middels") return [...puzzle.clues];

  const originalGiven = new Set(puzzle.clues.map((v, i) => v !== 0 ? i : -1).filter(i => i >= 0));

  if (difficulty === "lett") {
    // Add ~8 more cells from the solution (→ ~37 givens, 44 to fill)
    const notGiven = lcgShuffle(
      Array.from({ length: 81 }, (_, i) => i).filter(i => !originalGiven.has(i)),
      seed
    );
    const extra = new Set(notGiven.slice(0, 8));
    return puzzle.solution.map((v, i) => (originalGiven.has(i) || extra.has(i)) ? v : 0);
  }

  if (difficulty === "vanskelig") {
    // Remove ~9 cells from the original (→ ~20 givens, 61 to fill)
    const toRemove = new Set(lcgShuffle([...originalGiven], seed).slice(0, 9));
    return puzzle.solution.map((v, i) => (originalGiven.has(i) && !toRemove.has(i)) ? v : 0);
  }

  return [...puzzle.clues];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function normalizeWord(str) {
  return (str || "").toLowerCase().trim().replace(/\s+/g, " ")
    .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[-\s]+/g, " ").trim();
}
function matchesWord(input, word) { return normalizeWord(input) === normalizeWord(word); }

function isConflict(board, row, col, val) {
  for (let c = 0; c < 9; c++) { if (c !== col && board[row * 9 + c] === val) return true; }
  for (let r = 0; r < 9; r++) { if (r !== row && board[r * 9 + col] === val) return true; }
  const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) for (let c = bc; c < bc + 3; c++) {
    if ((r !== row || c !== col) && board[r * 9 + c] === val) return true;
  }
  return false;
}

function computeConflicts(board) {
  const set = new Set();
  for (let idx = 0; idx < 81; idx++) {
    if (!board[idx]) continue;
    if (isConflict(board, Math.floor(idx / 9), idx % 9, board[idx])) set.add(idx);
  }
  return set;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SudokuScreen({ onBack, screen, showWords, onNav, onGameComplete }) {
  const RANGES = getRanges(getActiveLang().id);
  const [difficulty, setDifficulty] = useState("middels");
  const [rangeId, setRangeId]       = useState(null);
  const [puzzleIdx, setPuzzleIdx]   = useState(0);
  const [board, setBoard]           = useState(null);
  const [clues, setClues]           = useState(null);
  const [selected, setSelected]     = useState(null);
  const [inputVal, setInputVal]     = useState("");
  const [shake, setShake]           = useState(false);
  const [conflicts, setConflicts]   = useState(new Set());
  const [completed, setCompleted]   = useState(false);
  const [showRef, setShowRef]       = useState(true);
  const inputRef = useRef(null);

  const range = RANGES.find(r => r.id === rangeId);

  // ── Persist board ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!rangeId || !board || !clues) return;
    if (completed) { clearSave(); return; }
    saveGame({ rangeId, puzzleIdx, difficulty, board, clues });
  }, [board, completed]);

  // ── Start / resume ─────────────────────────────────────────────────────────
  const startGame = useCallback((rId, pIdx, diff) => {
    const puzzle = PUZZLES[pIdx % PUZZLES.length];
    const seed = pIdx * 100 + RANGES.findIndex(r => r.id === rId) + 1;
    const generatedClues = generateClues(puzzle, diff, seed);
    setRangeId(rId);
    setPuzzleIdx(pIdx);
    setDifficulty(diff);
    setClues(generatedClues);
    setBoard(generatedClues);
    setSelected(null);
    setInputVal("");
    setConflicts(new Set());
    setCompleted(false);
  }, []);

  const resumeGame = () => {
    const s = loadSave();
    if (!s) return;
    setRangeId(s.rangeId);
    setPuzzleIdx(s.puzzleIdx);
    setDifficulty(s.difficulty || "middels");
    setClues(s.clues);
    setBoard(s.board);
    setSelected(null);
    setInputVal("");
    setConflicts(computeConflicts(s.board));
    setCompleted(false);
  };

  const selectCell = (idx) => {
    if (clues[idx] !== 0) return;
    setSelected(idx);
    setInputVal("");
    setTimeout(() => inputRef.current?.focus(), 40);
  };

  const submitInput = () => {
    if (selected === null || !range) return;
    const trimmed = inputVal.trim();
    if (!trimmed) return;

    let matchedVal = null;
    for (let i = 0; i < 9; i++) {
      if (matchesWord(trimmed, range.words[i])) { matchedVal = i + 1; break; }
    }
    if (matchedVal === null) { triggerShake(); return; }

    const newBoard = [...board];
    newBoard[selected] = matchedVal;
    const newConflicts = computeConflicts(newBoard);

    setBoard(newBoard);
    setConflicts(newConflicts);
    setInputVal("");
    setSelected(null);
    logDailyAnswer("vocab");

    const puzzle = PUZZLES[puzzleIdx % PUZZLES.length];
    const allCorrect = newBoard.every((v, i) => v === puzzle.solution[i]);
    if (allCorrect) {
      clearSave();
      logGameSession(81 - puzzle.clues.filter(v => v !== 0).length);
      if (onGameComplete) onGameComplete();
      setCompleted(true);
    }
  };

  const clearCell = () => {
    if (selected === null || clues[selected] !== 0) return;
    const newBoard = [...board];
    newBoard[selected] = 0;
    setBoard(newBoard);
    setConflicts(computeConflicts(newBoard));
    setInputVal("");
  };

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 500); };

  // ── Range selector ─────────────────────────────────────────────────────────
  if (!rangeId) {
    const save = loadSave();
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "52px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)", padding: 0 }}>← Tilbake</button>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 500, color: "var(--text)" }}>Tallsudoku</div>
          <div style={{ width: 60 }} />
        </div>

        <div style={{ padding: "0 22px 12px" }}>
          <div style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)", lineHeight: 1.7, marginBottom: 14 }}>
            Velg tallrekke og vanskelighetsgrad. Skriv tallene på fransk.
          </div>

          {/* Difficulty tabs */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {["lett", "middels", "vanskelig"].map(d => (
              <button key={d} onClick={() => setDifficulty(d)} className="press" style={{
                flex: 1, padding: "10px 4px",
                background: difficulty === d ? "var(--cream)" : "var(--surface)",
                color: difficulty === d ? "var(--on-accent)" : "var(--text-subtle)",
                border: `1px solid ${difficulty === d ? "var(--cream)" : "var(--border)"}`,
                borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600,
                fontFamily: "var(--font-body)",
              }}>
                {DIFF_LABELS[d]}
              </button>
            ))}
          </div>

          {/* Saved game banner */}
          {save && (
            <button onClick={resumeGame} className="press" style={{
              width: "100%", marginBottom: 10, padding: "14px 18px",
              background: "var(--accent-bg)", border: "1px solid var(--cream)",
              borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "space-between",
              cursor: "pointer",
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--cream)", fontFamily: "var(--font-body)" }}>Fortsett der du slapp</div>
                <div style={{ fontSize: 11, color: "var(--text-subtle)", fontFamily: "var(--font-body)", marginTop: 2 }}>
                  {RANGES.find(r => r.id === save.rangeId)?.label} · {DIFF_LABELS[save.difficulty || "middels"]}
                </div>
              </div>
              <span style={{ fontSize: 18 }}>→</span>
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 22px 100px", display: "flex", flexDirection: "column", gap: 8 }}>
          {RANGES.map((r, i) => (
            <button key={r.id} onClick={() => startGame(r.id, Math.floor(Math.random() * PUZZLES.length), difficulty)} className="press"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "14px 18px", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 500, color: "var(--text)" }}>{r.label}</div>
                <div style={{ fontSize: 12, color: "var(--text-subtle)", fontFamily: "var(--font-body)", marginTop: 2 }}>{r.desc}</div>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-subtle)", fontFamily: "var(--font-body)" }}>
                {i === 0 ? "✓ Start her" : i <= 1 ? "Lett" : i <= 5 ? "Middels" : "Avansert"}
              </div>
            </button>
          ))}
        </div>
        <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
      </div>
    );
  }

  // ── Game ───────────────────────────────────────────────────────────────────
  const selRow  = selected !== null ? Math.floor(selected / 9) : -1;
  const selCol  = selected !== null ? selected % 9 : -1;
  const selBoxR = selRow >= 0 ? Math.floor(selRow / 3) : -1;
  const selBoxC = selCol >= 0 ? Math.floor(selCol / 3) : -1;
  const selectedVal = selected !== null ? board[selected] : 0;

  const cellSize = Math.min(38, Math.floor((Math.min(window.innerWidth, 440) - 44 - 8) / 9));

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-6px)} 40%,80%{transform:translateX(6px)} }
        @keyframes pop   { 0%{transform:scale(1)} 50%{transform:scale(1.18)} 100%{transform:scale(1)} }
      `}</style>

      {/* Header */}
      <div style={{ padding: "48px 20px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => setRangeId(null)} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)", padding: 0 }}>← Bytt</button>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 500, color: "var(--text)", textAlign: "center" }}>
          {completed ? "🎉 Fullført!" : `${range?.label} · ${DIFF_LABELS[difficulty]}`}
        </div>
        <button onClick={() => setShowRef(v => !v)} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)", padding: 0 }}>
          {showRef ? "Skjul fasit" : "Vis fasit"}
        </button>
      </div>

      {/* Reference card */}
      {showRef && range && (
        <div style={{ margin: "0 16px 8px", background: "var(--surface)", borderRadius: 12, padding: "10px 12px", border: "1px solid var(--border)", overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 8, width: "max-content" }}>
            {range.words.map((w, i) => (
              <div key={i} style={{ textAlign: "center", minWidth: 44 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--cream)", fontFamily: "var(--font-body)" }}>{range.base + i * (range.step || 1)}</div>
                <div style={{ fontSize: 9, color: "var(--text-subtle)", fontFamily: "var(--font-body)", lineHeight: 1.3, maxWidth: 56 }}>{w}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      <div style={{ display: "flex", justifyContent: "center", padding: "4px 22px 8px" }}>
        <div style={{ display: "inline-flex", flexDirection: "column", gap: 1, border: "2px solid var(--text-subtle)", borderRadius: 8 }}>
          {Array.from({ length: 9 }, (_, r) => (
            <div key={r} style={{ display: "flex", gap: 1, borderTop: r > 0 && r % 3 === 0 ? "2px solid var(--text-subtle)" : undefined }}>
              {Array.from({ length: 9 }, (_, c) => {
                const idx    = r * 9 + c;
                const val    = board[idx];
                const isGiven      = clues[idx] !== 0;
                const isSel        = idx === selected;
                const inSameGroup  = r === selRow || c === selCol || (Math.floor(r / 3) === selBoxR && Math.floor(c / 3) === selBoxC);
                const isSameValue  = !isSel && selectedVal !== 0 && val !== 0 && val === selectedVal;
                const hasConflict  = conflicts.has(idx);
                const puzzle       = PUZZLES[puzzleIdx % PUZZLES.length];
                const isCorrect    = val !== 0 && val === puzzle.solution[idx];

                let bg = "var(--bg)";
                if (isSel)          bg = "rgba(230,211,168,0.28)";
                else if (isSameValue) bg = "rgba(230,211,168,0.20)";
                else if (inSameGroup) bg = "rgba(230,211,168,0.07)";
                if (hasConflict)    bg = "var(--color-error-bg)";
                if (completed && isCorrect) bg = "var(--color-success-bg)";

                const displayNum = val ? range.base + (val - 1) * (range.step || 1) : "";

                return (
                  <button key={c} onClick={() => selectCell(idx)} style={{
                    width: cellSize, height: cellSize,
                    background: bg,
                    border: `1px solid ${hasConflict ? "var(--color-error-bg)" : "var(--border)"}`,
                    borderRight: c < 8 && (c + 1) % 3 === 0 ? "2px solid var(--text-subtle)" : undefined,
                    padding: 0, cursor: isGiven ? "default" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.1s",
                    animation: isSel && shake ? "shake 0.5s ease" : undefined,
                  }}>
                    {val !== 0 && (
                      <span style={{
                        fontSize: cellSize * 0.4,
                        fontWeight: isGiven || isSameValue ? 700 : 500,
                        color: isGiven ? "var(--text)" : hasConflict ? "var(--color-error)" : isSameValue ? "var(--text)" : "var(--cream)",
                        fontFamily: "var(--font-body)",
                        lineHeight: 1,
                        animation: !isGiven && val !== 0 ? "pop 0.25s ease" : undefined,
                      }}>
                        {displayNum}
                      </span>
                    )}
                    {isSel && val === 0 && (
                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--cream)", display: "block" }} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Input panel */}
      {!completed && (
        <div style={{ padding: "8px 22px 0", display: "flex", flexDirection: "column", gap: 8 }}>
          {selected !== null ? (
            <>
              <div style={{ fontSize: 12, color: "var(--text-subtle)", fontFamily: "var(--font-body)", textAlign: "center" }}>
                Skriv et tall ({range?.label}) på fransk:
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  ref={inputRef}
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") submitInput(); if (e.key === "Escape") { setSelected(null); setInputVal(""); } }}
                  placeholder={`f.eks. ${range?.words[Math.floor(Math.random() * 3)] || ""}…`}
                  style={{ flex: 1, background: "var(--surface)", border: `1px solid ${shake ? "var(--color-error-bg)" : "var(--border)"}`, borderRadius: 12, padding: "12px 14px", fontSize: 14, color: "var(--text)", fontFamily: "var(--font-body)", outline: "none", animation: shake ? "shake 0.5s ease" : undefined }}
                  autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false}
                />
                <button onClick={submitInput} className="press" style={{ padding: "12px 18px", background: inputVal.trim() ? "var(--cream)" : "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 16, cursor: "pointer", color: inputVal.trim() ? "var(--on-accent)" : "var(--text-subtle)", transition: "all 0.15s" }}>→</button>
                <button onClick={clearCell} className="press" style={{ padding: "12px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 14, cursor: "pointer", color: "var(--text-subtle)" }}>✕</button>
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)", textAlign: "center", lineHeight: 1.6 }}>
              Trykk på en tom rute for å fylle inn
            </div>
          )}
        </div>
      )}

      {/* Completed */}
      {completed && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 28px", gap: 16 }}>
          <div style={{ fontSize: 60, animation: "celebrate 0.5s var(--ease-spring) both" }}>🎉</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 500, color: "var(--cream)", textAlign: "center" }}>Sudoku fullført!</div>
          <div style={{ display: "flex", gap: 10 }}>
            <PrimaryButton onClick={() => startGame(rangeId, puzzleIdx + 1, difficulty)}>Ny puzzle</PrimaryButton>
            <GhostButton onClick={() => setRangeId(null)}>Bytt tallrekke</GhostButton>
          </div>
        </div>
      )}

      <div style={{ flex: completed ? 0 : 1 }} />
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}
