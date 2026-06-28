import { useState, useRef, useEffect } from "react";
import BottomNav from "../components/BottomNav.jsx";
import { logDailyAnswer, logGrammarSession } from "../utils.jsx";
import { formLabels } from "../content.js";

// French defaults; the active language may override (e.g. German tenses + komp/sup).
const FORM_TYPE_LABELS = formLabels || {
  n: "Singulier",
  np: "Pluriel",
  "adj-f": "Féminin",
  "adj-mp": "Masc. pluriel",
  "adj-fp": "Fém. pluriel",
  pr: "Présent",
  pc: "Passé composé",
  imp: "Imparfait",
  f: "Futur simple",
  c: "Conditionnel",
  impv: "Impératif",
  pp: "Participe passé",
};

// komp/sup are German adjective forms; harmless extras for French (no such forms).
const TYPE_ORDER = ["n", "np", "adj-f", "adj-mp", "adj-fp", "komp", "sup", "pr", "pc", "imp", "f", "c", "impv", "pp"];

function groupForms(forms) {
  const byType = {};
  for (const [form, type] of (forms || [])) {
    if (!byType[type]) byType[type] = [];
    byType[type].push(form);
  }
  return TYPE_ORDER
    .filter(t => byType[t])
    .map(t => ({ type: t, label: FORM_TYPE_LABELS[t] || t, forms: byType[t] }));
}

function normalize(s) {
  return (s || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[''`]/g, "'")
    .replace(/\s+/g, " ");
}

function checkForm(input, expected) {
  if (normalize(input) === normalize(expected)) return "correct";
  return "wrong";
}

function cellKey(type, idx) {
  return `${type}:${idx}`;
}

function WordTypeTag({ groups }) {
  const hasVerb = groups.some(g => ["pr", "pc", "imp", "f", "c", "impv", "pp"].includes(g.type));
  const hasNoun = groups.some(g => ["n", "np"].includes(g.type));
  const hasAdj = groups.some(g => g.type.startsWith("adj-"));
  if (hasVerb) return <span style={{ fontSize: 10, color: "var(--cream-deep)", background: "rgba(130,140,200,0.15)", borderRadius: 4, padding: "1px 6px", letterSpacing: 0.5 }}>verbe</span>;
  if (hasAdj) return <span style={{ fontSize: 10, color: "var(--cream-deep)", background: "rgba(200,160,100,0.15)", borderRadius: 4, padding: "1px 6px", letterSpacing: 0.5 }}>adj.</span>;
  if (hasNoun) return <span style={{ fontSize: 10, color: "var(--cream-deep)", background: "rgba(100,180,150,0.15)", borderRadius: 4, padding: "1px 6px", letterSpacing: 0.5 }}>nom</span>;
  return null;
}

export default function BoyningsTabellScreen({ words, grammarWords = [], onBack, speak, screen, showWords, onNav }) {
  const allWords = [...words, ...grammarWords]
    .filter(w => w.forms?.length > 0)
    .sort((a, b) => (b.forms?.length || 0) - (a.forms?.length || 0));

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [mode, setMode] = useState("learn");
  const [results, setResults] = useState({});
  const [activeCell, setActiveCell] = useState(null);
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState(false);
  const [checkResult, setCheckResult] = useState("");
  const [sessionDone, setSessionDone] = useState(false);
  const inputRef = useRef(null);

  const word = allWords[selectedIdx];
  const groups = word ? groupForms(word.forms) : [];
  const totalCells = groups.reduce((s, g) => s + g.forms.length, 0);
  const correctCount = Object.values(results).filter(r => r === "correct").length;
  const isComplete = mode === "test" && totalCells > 0 && correctCount === totalCells;

  useEffect(() => {
    setResults({});
    setActiveCell(null);
    setInput("");
    setChecked(false);
    setCheckResult("");
    setMode("learn");
    setSessionDone(false);
  }, [selectedIdx]);

  useEffect(() => {
    if (isComplete && !sessionDone) {
      logGrammarSession();
      setSessionDone(true);
    }
  }, [isComplete, sessionDone]);

  useEffect(() => {
    if (activeCell && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [activeCell]);

  const handleCellTap = (type, idx, form) => {
    if (mode === "learn") {
      speak?.(form, 0.85);
      return;
    }
    if (results[cellKey(type, idx)] === "correct") return;
    setActiveCell({ type, idx, expected: form });
    setInput("");
    setChecked(false);
    setCheckResult("");
  };

  const handleSubmit = () => {
    if (!input.trim() || !activeCell || checked) return;
    const res = checkForm(input, activeCell.expected);
    setChecked(true);
    setCheckResult(res);
    setResults(prev => ({ ...prev, [cellKey(activeCell.type, activeCell.idx)]: res }));
    if (res === "correct") logDailyAnswer("grammar");
  };

  const handleNext = () => {
    const allCells = [];
    for (const g of groups) {
      g.forms.forEach((form, i) => allCells.push({ type: g.type, idx: i, expected: form }));
    }
    const updatedResults = { ...results, [cellKey(activeCell.type, activeCell.idx)]: checkResult };
    const remaining = allCells.filter(c => updatedResults[cellKey(c.type, c.idx)] !== "correct");
    if (remaining.length === 0) {
      setActiveCell(null);
      return;
    }
    const next = remaining[0];
    setActiveCell(next);
    setInput("");
    setChecked(false);
    setCheckResult("");
  };

  const startTest = () => {
    setMode("test");
    setResults({});
    setActiveCell(null);
    setInput("");
    setChecked(false);
    setCheckResult("");
    setSessionDone(false);
  };

  if (!word) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 66 }}>
        <div style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--cream-deep)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
          <div style={{ fontSize: 15, fontWeight: 500 }}>Bøyningstabellen</div>
          <div style={{ width: 70 }} />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", gap: 16 }}>
          <div style={{ fontSize: 40, opacity: 0.25 }}>◑</div>
          <div style={{ color: "var(--text-subtle)", lineHeight: 1.9, fontSize: 14 }}>
            Ingen ord med bøyningsformer ennå.<br />
            Gjør Dagens gloser for å lære ord med former.
          </div>
        </div>
        <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: activeCell ? 0 : 66 }}>

      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px" }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--cream-deep)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
          <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text)" }}>Bøyningstabellen</div>
          <div style={{ width: 70 }} />
        </div>

        {/* Word navigation */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 12px 10px", gap: 4 }}>
          <button onClick={() => setSelectedIdx(i => Math.max(0, i - 1))} disabled={selectedIdx === 0}
            style={{ background: "none", border: "none", color: selectedIdx === 0 ? "var(--border)" : "var(--cream)", fontSize: 22, cursor: selectedIdx === 0 ? "default" : "pointer", padding: "4px 6px", lineHeight: 1, flexShrink: 0 }}>‹</button>

          <div style={{ flex: 1, textAlign: "center", padding: "0 4px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 20, color: "var(--text)" }}>{word.fr}</span>
              <WordTypeTag groups={groups} />
            </div>
            <div style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 1 }}>
              {word.no}{word.phonetic ? <> · <em>{word.phonetic}</em></> : ""}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>{selectedIdx + 1} / {allWords.length}</div>
          </div>

          <button onClick={() => setSelectedIdx(i => Math.min(allWords.length - 1, i + 1))} disabled={selectedIdx === allWords.length - 1}
            style={{ background: "none", border: "none", color: selectedIdx === allWords.length - 1 ? "var(--border)" : "var(--cream)", fontSize: 22, cursor: selectedIdx === allWords.length - 1 ? "default" : "pointer", padding: "4px 6px", lineHeight: 1, flexShrink: 0 }}>›</button>
        </div>

        {/* Mode toggle */}
        <div style={{ display: "flex", margin: "0 16px 12px", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
          <button onClick={() => { setMode("learn"); setActiveCell(null); setInput(""); setChecked(false); }}
            style={{ flex: 1, background: mode === "learn" ? "var(--cream)" : "none", border: "none", color: mode === "learn" ? "var(--bg)" : "var(--text-subtle)", fontFamily: "var(--font-body)", fontSize: 13, padding: "9px", cursor: "pointer", fontWeight: mode === "learn" ? 600 : 400 }}>
            📖 Lær
          </button>
          <button onClick={startTest}
            style={{ flex: 1, background: mode === "test" ? "var(--cream)" : "none", border: "none", color: mode === "test" ? "var(--bg)" : "var(--text-subtle)", fontFamily: "var(--font-body)", fontSize: 13, padding: "9px", cursor: "pointer", fontWeight: mode === "test" ? 600 : 400 }}>
            ✏️ Test
          </button>
        </div>

        {/* Progress bar (test mode) */}
        {mode === "test" && totalCells > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 16px 10px" }}>
            <div style={{ flex: 1, height: 4, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(correctCount / totalCells) * 100}%`, background: "var(--color-success, #5e9a6f)", borderRadius: 99, transition: "width 0.3s ease" }} />
            </div>
            <div style={{ fontSize: 11, color: "var(--text-subtle)", flexShrink: 0 }}>{correctCount}/{totalCells}</div>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 20px" }}>
        {mode === "learn" && (
          <div style={{ fontSize: 12, color: "var(--text-subtle)", marginBottom: 12, textAlign: "center" }}>
            Trykk på en form for å høre uttalen
          </div>
        )}
        {mode === "test" && !activeCell && !isComplete && (
          <div style={{ fontSize: 12, color: "var(--text-subtle)", marginBottom: 12, textAlign: "center" }}>
            Trykk på et felt for å teste deg
          </div>
        )}

        {groups.map(group => (
          <div key={group.type} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, color: "var(--cream-deep)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, paddingBottom: 4, borderBottom: "1px solid var(--border)" }}>
              {group.label}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {group.forms.map((form, idx) => {
                const key = cellKey(group.type, idx);
                const res = results[key];
                const isActive = activeCell?.type === group.type && activeCell?.idx === idx;
                const isCorrect = res === "correct";
                const isWrong = res === "wrong" && !isActive;

                let bg = "var(--surface)";
                let border = "var(--border)";
                let textColor = "var(--text)";
                if (isCorrect) { bg = "rgba(94,154,111,0.10)"; border = "rgba(94,154,111,0.35)"; textColor = "#5e9a6f"; }
                else if (isWrong) { bg = "rgba(225,112,85,0.08)"; border = "rgba(225,112,85,0.3)"; textColor = "var(--color-error)"; }
                else if (isActive) { bg = "rgba(230,211,168,0.10)"; border = "rgba(230,211,168,0.4)"; }

                const showForm = mode === "learn" || isCorrect || isWrong || isActive;

                return (
                  <button key={idx} onClick={() => handleCellTap(group.type, idx, form)} disabled={isCorrect}
                    style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "11px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: isCorrect ? "default" : "pointer", fontFamily: "var(--font-body)", textAlign: "left", width: "100%", transition: "all 0.15s" }}>
                    <span style={{ fontSize: 15, fontStyle: "italic", fontFamily: "var(--font-display)", color: textColor, letterSpacing: "-0.1px" }}>
                      {showForm ? form : "· · ·"}
                    </span>
                    <span style={{ fontSize: 14, flexShrink: 0, marginLeft: 8 }}>
                      {mode === "learn"
                        ? <span style={{ color: "var(--cream-deep)", fontSize: 13 }}>🔊</span>
                        : isCorrect ? <span style={{ color: "#5e9a6f" }}>✓</span>
                        : isWrong ? <span style={{ color: "var(--color-error)" }}>✗</span>
                        : isActive ? <span style={{ color: "var(--cream)" }}>✏</span>
                        : <span style={{ color: "var(--border)" }}>○</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {isComplete && (
          <div style={{ textAlign: "center", padding: "28px 0 16px" }}>
            <div style={{ fontSize: 44 }}>🎉</div>
            <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 20, color: "var(--cream)", marginTop: 10 }}>Alle former riktige!</div>
            <div style={{ fontSize: 13, color: "var(--text-subtle)", marginTop: 4 }}>{totalCells} av {totalCells} mestret</div>
            <button onClick={() => setSelectedIdx(i => Math.min(allWords.length - 1, i + 1))}
              style={{ marginTop: 20, background: "var(--cream)", border: "none", borderRadius: 14, color: "var(--bg)", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, padding: "12px 28px", cursor: "pointer" }}>
              Neste ord →
            </button>
          </div>
        )}
      </div>

      {/* Test input panel */}
      {mode === "test" && activeCell && !checked && (
        <div style={{ flexShrink: 0, padding: "12px 16px 20px", background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12, color: "var(--text-subtle)", marginBottom: 6 }}>
            {FORM_TYPE_LABELS[activeCell.type]} — skriv formen:
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSubmit(); }}
              placeholder="Skriv bøyningsformen…"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 14px", fontSize: 15, color: "var(--text)", fontFamily: "var(--font-display)", fontStyle: "italic", outline: "none" }}
            />
            <button onClick={handleSubmit} disabled={!input.trim()}
              style={{ background: input.trim() ? "var(--cream)" : "rgba(230,211,168,0.12)", border: "none", borderRadius: 12, color: input.trim() ? "var(--bg)" : "var(--text-subtle)", padding: "12px 16px", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, cursor: input.trim() ? "pointer" : "default", flexShrink: 0 }}>
              Sjekk
            </button>
          </div>
          <button onClick={() => setActiveCell(null)}
            style={{ marginTop: 8, background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)", padding: 0 }}>
            Avbryt
          </button>
        </div>
      )}

      {mode === "test" && activeCell && checked && (
        <div style={{ flexShrink: 0, padding: "14px 16px 20px", background: checkResult === "correct" ? "rgba(94,154,111,0.10)" : "rgba(225,112,85,0.07)", borderTop: `1px solid ${checkResult === "correct" ? "rgba(94,154,111,0.3)" : "rgba(225,112,85,0.25)"}` }}>
          {checkResult === "correct" ? (
            <div style={{ fontSize: 15, color: "#5e9a6f", fontWeight: 600, marginBottom: 10 }}>✓ Riktig!</div>
          ) : (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: "var(--color-error)", marginBottom: 4 }}>✗ Ikke helt. Riktig form:</div>
              <div style={{ fontSize: 18, fontStyle: "italic", fontFamily: "var(--font-display)", color: "var(--text)" }}>{activeCell.expected}</div>
              {speak && (
                <button onClick={() => speak(activeCell.expected, 0.8)}
                  style={{ marginTop: 6, background: "none", border: "none", color: "var(--cream-deep)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)", padding: 0 }}>
                  🔊 Hør uttalen
                </button>
              )}
            </div>
          )}
          <button onClick={handleNext}
            style={{ width: "100%", background: "var(--cream)", border: "none", borderRadius: 12, color: "var(--bg)", padding: "12px", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Neste →
          </button>
        </div>
      )}

      {!activeCell && <BottomNav screen={screen} showWords={showWords} onNav={onNav} />}
    </div>
  );
}
