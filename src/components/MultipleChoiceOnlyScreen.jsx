import { useState } from "react";
import { MASTERY_POINTS } from "../constants.js";
import { shuffle, getQuizOptions, checkQuizAnswer, getDue, updateWordPoints, incrementAnswerCount, scheduleNext, logDailyAnswer, logVocabSession, logWordAnswer, loadAnswerCount, touchStreak } from "../utils.jsx";
import BottomNav from "./BottomNav.jsx";

// Multiple-choice-only exercise with 0.25 pts correct / -2 pts wrong.
// 20 questions: first 10 fr→no, then 10 no→fr (or fewer if bank is small).
export default function MultipleChoiceOnlyScreen({
  words, setWords, title, icon, emptyMsg,
  onBack, speak, speaking,
  screen, showWords, onNav,
  onFinish,
}) {
  const [queue] = useState(() => {
    if (!words.length) return [];
    const due = getDue(words, loadAnswerCount());
    const notDue = words.filter(w => !due.some(d => d.id === w.id));
    const pool = shuffle([...due, ...notDue]);
    const half = Math.min(10, Math.floor(pool.length));
    const frToNo = pool.slice(0, half);
    const noToFr = pool.slice(0, half).map(w => ({ ...w, reverse: true }));
    return shuffle([...frToNo, ...noToFr]);
  });
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState("");
  const [checked, setChecked] = useState(false);
  const [result, setResult] = useState("");
  const [history, setHistory] = useState([]);
  const [options, setOptions] = useState(() => {
    const q = queue;
    if (!q.length) return [];
    return getQuizOptions(q[0], words, !!q[0].reverse);
  });
  const [done, setDone] = useState(false);
  const [finalStats, setFinalStats] = useState({ correct: 0, wrong: 0 });

  const card = queue[idx] || null;
  const isReverse = !!card?.reverse;
  const total = queue.length;
  const progress = idx;

  const submit = () => {
    if (!selected || !card) return;
    const res = checkQuizAnswer(selected, card, isReverse);
    const passed = res === "correct";
    setChecked(true); setResult(res);
    setHistory(h => [...h, passed ? "correct" : "wrong"]);
    setFinalStats(s => ({ correct: s.correct + (passed ? 1 : 0), wrong: s.wrong + (passed ? 0 : 1) }));
    logDailyAnswer();
    const gc = incrementAnswerCount();
    if (card.id) {
      setWords(prev => prev.map(w => {
        if (w.id !== card.id) return w;
        const ptsBefore = w.points || 0;
        const updated = updateWordPoints(w, res, gc, 0.25);
        logWordAnswer(w.fr, w.no, w.phonetic, ptsBefore, updated.points, res);
        const srOverride = updated._srOverride;
        const { _srOverride: _, ...clean } = updated;
        if (srOverride) return { ...clean, ...srOverride };
        if ((clean.points || 0) < MASTERY_POINTS) {
          const { level: nl, nextReview: nr } = scheduleNext(w.level, passed);
          return { ...clean, level: nl, nextReview: nr };
        }
        return clean;
      }));
    }
  };

  const next = () => {
    const nextIdx = idx + 1;
    if (nextIdx >= queue.length) {
      logVocabSession();
      setDone(true);
      return;
    }
    const nextCard = queue[nextIdx];
    setIdx(nextIdx);
    setOptions(getQuizOptions(nextCard, words, !!nextCard.reverse));
    setSelected(""); setChecked(false); setResult("");
  };

  if (!card && !done) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 66 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "var(--text)" }}><span style={{ color: "var(--accent)" }}>{icon}</span>{title}</div>
        <div style={{ width: 60 }} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", gap: 16 }}>
        <div style={{ fontSize: 36, opacity: 0.3 }}>{icon}</div>
        <p style={{ color: "var(--text-subtle)", lineHeight: 1.9 }}>{emptyMsg || "Ingen ord tilgjengelig."}</p>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  if (done) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 66 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "var(--text)" }}><span style={{ color: "var(--accent)" }}>{icon}</span>{title}</div>
        <div style={{ width: 60 }} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", gap: 20 }}>
        <div style={{ fontSize: 48 }}>🎯</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: "var(--text)" }}>Runden er ferdig!</div>
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ background: "rgba(0,184,148,0.10)", border: "1px solid rgba(0,184,148,0.35)", borderRadius: 16, padding: "18px 24px", textAlign: "center", minWidth: 90 }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: "var(--color-success)" }}>{finalStats.correct}</div>
            <div style={{ fontSize: 11, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 1, marginTop: 4 }}>Riktige</div>
          </div>
          <div style={{ background: "rgba(225,112,85,0.08)", border: "1px solid rgba(225,112,85,0.3)", borderRadius: 16, padding: "18px 24px", textAlign: "center", minWidth: 90 }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: "var(--color-error)" }}>{finalStats.wrong}</div>
            <div style={{ fontSize: 11, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 1, marginTop: 4 }}>Feil</div>
          </div>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-subtle)" }}>
          +{(finalStats.correct * 0.25).toFixed(2)} poeng gitt · −{finalStats.wrong * 2} poeng trukket
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
          {history.map((h, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: h === "correct" ? "var(--color-success)" : "var(--color-error)" }} />
          ))}
        </div>
        <button onClick={onFinish || onBack} className="btn-shine"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-light))", border: "none", borderRadius: 14, color: "white", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 15, padding: "14px 40px", cursor: "pointer", marginTop: 8 }}>
          Tilbake til hjem
        </button>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 66 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "var(--text)" }}><span style={{ color: "var(--accent)" }}>{icon}</span>{title}</div>
        <div style={{ fontSize: 11, color: "rgba(46,107,230,0.55)", letterSpacing: 1 }}>{progress}/{total}</div>
      </div>

      <div style={{ height: 3, background: "var(--border)" }}>
        <div style={{ height: "100%", background: "linear-gradient(to right, var(--accent), var(--accent-light))", width: `${total > 0 ? (progress / total) * 100 : 0}%`, transition: "width 0.3s" }} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", gap: 20 }}>
        <div style={{ fontSize: 10, color: "rgba(46,107,230,0.45)", letterSpacing: 2, textTransform: "uppercase" }}>
          Flervalg · {isReverse ? "Norsk → Fransk" : "Fransk → Norsk"}
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "32px 40px", textAlign: "center", width: "100%", maxWidth: 340, boxShadow: "var(--shadow-md)" }}>
          {isReverse ? (
            <div style={{ fontSize: 30, color: "var(--text)", fontFamily: "var(--font-display)" }}>{card.no}</div>
          ) : (
            <>
              <div style={{ fontSize: 11, color: "rgba(46,107,230,0.55)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Hva betyr dette på norsk?</div>
              <div style={{ fontSize: 30, color: "var(--text)", fontStyle: "italic", marginBottom: 8, fontFamily: "var(--font-display)" }}>{card.fr}</div>
              {card.phonetic && <div style={{ fontSize: 13, color: "var(--accent)", opacity: 0.7, marginBottom: 6 }}>({card.phonetic})</div>}
              <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
                <button onClick={() => speak(card.fr)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: speaking ? "var(--accent)" : "rgba(46,107,230,0.45)" }}>🔊</button>
                <button onClick={() => speak(card.fr, 0.4)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: speaking ? "var(--accent)" : "rgba(46,107,230,0.45)" }}>🐢</button>
              </div>
            </>
          )}
        </div>

        {!checked ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", maxWidth: 340 }}>
              {options.map((opt, i) => (
                <button key={i} onClick={() => setSelected(opt)}
                  style={{ background: selected === opt ? "var(--accent-bg)" : "var(--surface)", border: `${selected === opt ? 2 : 1}px solid ${selected === opt ? "var(--accent)" : "var(--border)"}`, borderRadius: 14, padding: "16px 10px", cursor: "pointer", color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.3, textAlign: "center", transition: "all 0.15s ease" }}>
                  {opt}
                </button>
              ))}
            </div>
            <button onClick={submit} disabled={!selected} className={selected ? "btn-shine" : ""}
              style={{ background: selected ? "linear-gradient(135deg, var(--accent), var(--accent-light))" : "var(--accent-bg)", border: "none", borderRadius: 14, color: selected ? "white" : "var(--text-subtle)", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 15, padding: "16px", cursor: selected ? "pointer" : "default", width: "100%", maxWidth: 340 }}>
              Bekreft svar
            </button>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 340, alignItems: "center" }}>
            {result === "correct" ? (
              <div style={{ background: "rgba(0,184,148,0.10)", border: "1px solid rgba(0,184,148,0.35)", borderRadius: 12, padding: "14px 20px", textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: 15, color: "var(--color-success)", fontWeight: "bold" }}>✓ Riktig! +0,25 poeng</div>
              </div>
            ) : (
              <div style={{ background: "rgba(225,112,85,0.08)", border: "1px solid rgba(225,112,85,0.3)", borderRadius: 12, padding: "14px 20px", textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: 15, color: "var(--color-error)", fontWeight: "bold", marginBottom: 4 }}>✗ Feil − 2 poeng</div>
                <div style={{ fontSize: 13, color: "var(--text-subtle)", marginBottom: 4 }}>Du svarte: <em>{selected}</em></div>
                <div style={{ fontSize: 15, color: "var(--text)" }}>Riktig: <strong>{isReverse ? card.fr : card.no}</strong></div>
                {card.phonetic && <div style={{ fontSize: 12, color: "var(--accent)", opacity: 0.8, marginTop: 4 }}>({card.phonetic})</div>}
              </div>
            )}
            <button onClick={next} className="btn-shine"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-light))", border: "none", borderRadius: 14, color: "white", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 15, padding: "14px 40px", cursor: "pointer" }}>
              {idx >= queue.length - 1 ? "Se resultat" : "Neste →"}
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
          {Array.from({ length: Math.min(total, 20) }).map((_, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: history[i] === "correct" ? "var(--color-success)" : history[i] === "wrong" ? "var(--color-error)" : "var(--border)" }} />
          ))}
        </div>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}
