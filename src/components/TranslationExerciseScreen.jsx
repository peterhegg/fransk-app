import { useState, useRef, useEffect } from "react";
import { MASTERY_POINTS } from "../constants.js";
import { shuffle, getQuizOptions, checkQuizAnswer, getDue, updateWordPoints, incrementAnswerCount, scheduleNext, logDailyAnswer, logVocabSession, logWordAnswer, loadAnswerCount, touchStreak, selectExerciseWords, getWordTier } from "../utils.jsx";
import BottomNav from "./BottomNav.jsx";
import PointsBadge, { Fireworks, TierPop } from "./PointsBadge.jsx";

function AutoPlayToggle({ autoPlay, onToggle }) {
  if (!onToggle) return <div style={{ width: 60 }} />;
  return (
    <button onClick={onToggle} title={autoPlay ? "Skru av automatisk uttale" : "Skru på automatisk uttale"}
      style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: autoPlay ? "var(--accent)" : "var(--text-subtle)", fontSize: 12, fontFamily: "var(--font-body)", padding: "4px 6px", borderRadius: 8, minWidth: 60, justifyContent: "flex-end" }}>
      <span style={{ fontSize: 18 }}>{autoPlay ? "🔊" : "🔇"}</span>
      <span style={{ fontSize: 10, letterSpacing: 0.5 }}>{autoPlay ? "På" : "Av"}</span>
    </button>
  );
}

// Input-only translation exercise (no multiple choice).
// Used for "Ordoversettelse" (glose bank) and "Oversett grammatikken" (grammar bank).
export default function TranslationExerciseScreen({
  words, setWords, title, icon, emptyMsg,
  onBack, speak, speaking,
  screen, showWords, onNav,
  onFinish, autoPlay, onToggleAutoPlay,
}) {
  const [queue, setQueue] = useState(() => {
    if (!words.length) return [];
    return selectExerciseWords(words).map(w => Math.random() < 0.5 ? { ...w, reverse: true } : w);
  });
  const [card, setCard] = useState(() => queue[0] || null);
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState(false);
  const [result, setResult] = useState("");
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });
  const [history, setHistory] = useState([]);
  const [pointsInfo, setPointsInfo] = useState(null);
  const [fireworksDone, setFireworksDone] = useState(false);
  const [tierPopDone, setTierPopDone] = useState(false);
  const inputRef = useRef(null);

  const total = stats.correct + stats.wrong + queue.length;
  const done = stats.correct + stats.wrong;
  const isReverse = !!card?.reverse;

  useEffect(() => {
    if (!checked && inputRef.current) inputRef.current.focus();
  }, [card, checked]);

  useEffect(() => {
    if (autoPlay && card?.fr && !card.reverse) {
      const t = setTimeout(() => speak(card.fr), 400);
      return () => clearTimeout(t);
    }
  }, [card?.fr, card?.reverse, autoPlay]);

  useEffect(() => {
    if (checked && autoPlay && isReverse && card?.fr && (result === "correct" || result === "close")) {
      const t = setTimeout(() => speak(card.fr), 300);
      return () => clearTimeout(t);
    }
  }, [checked]);

  const handleFocus = () => {
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  };

  const submit = () => {
    if (!input.trim()) return;
    const res = checkQuizAnswer(input, card, isReverse);
    const passed = res !== "wrong";
    setChecked(true); setResult(res);
    setStats(s => ({ correct: s.correct + (passed ? 1 : 0), wrong: s.wrong + (passed ? 0 : 1) }));
    setHistory(h => [...h, passed ? "correct" : "wrong"]);
    logDailyAnswer("vocab");
    const gc = incrementAnswerCount();
    if (card.id) {
      const word = words.find(w => w.id === card.id);
      if (word) {
        const ptsBefore = word.points || 0;
        const updated = updateWordPoints({ ...word }, res, gc);
        const ptsAfter = updated.points || 0;
        setPointsInfo({ pts: ptsAfter, ptsBefore, tierBefore: getWordTier(ptsBefore), tierAfter: getWordTier(ptsAfter), justMastered: ptsAfter >= MASTERY_POINTS && ptsBefore < MASTERY_POINTS });
      }
      setWords(prev => prev.map(w => {
        if (w.id !== card.id) return w;
        const ptsBefore = w.points || 0;
        const updated = updateWordPoints(w, res, gc);
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
    const remaining = queue.slice(1);
    const passed = result !== "wrong";
    if (!passed) {
      const at = Math.min(3, remaining.length);
      const recycled = [...remaining.slice(0, at), { ...card }, ...remaining.slice(at)];
      setQueue(recycled); setCard(recycled[0]);
      setInput(""); setChecked(false); setResult(""); setPointsInfo(null); setFireworksDone(false); setTierPopDone(false);
      return;
    }
    if (!remaining.length) {
      logVocabSession();
      if (onFinish) onFinish();
      else onBack();
      return;
    }
    setQueue(remaining); setCard(remaining[0]);
    setInput(""); setChecked(false); setResult(""); setPointsInfo(null); setFireworksDone(false); setTierPopDone(false);
  };

  if (!card) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 66 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "var(--text)" }}><span style={{ color: "var(--accent)" }}>{icon}</span>{title}</div>
        <AutoPlayToggle autoPlay={autoPlay} onToggle={onToggleAutoPlay} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", gap: 16 }}>
        <div style={{ fontSize: 36, opacity: 0.3 }}>{icon}</div>
        <p style={{ color: "var(--text-subtle)", lineHeight: 1.9 }}>{emptyMsg || "Ingen ord tilgjengelig."}</p>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  return (
  <>
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 66 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "var(--text)" }}><span style={{ color: "var(--accent)" }}>{icon}</span>{title}</div>
        <AutoPlayToggle autoPlay={autoPlay} onToggle={onToggleAutoPlay} />
      </div>

      <div style={{ height: 3, background: "var(--border)" }}>
        <div style={{ height: "100%", background: "linear-gradient(to right, var(--accent), var(--accent-light))", width: `${total > 0 ? (done / total) * 100 : 0}%`, transition: "width 0.3s" }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", gap: 20 }}>
        <div style={{ fontSize: 10, color: "rgba(46,107,230,0.45)", letterSpacing: 2, textTransform: "uppercase" }}>
          {card.id ? `Repetisjon · niv. ${card.level}` : "Nytt ord"}
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "32px 40px", textAlign: "center", width: "100%", maxWidth: 340, boxShadow: "var(--shadow-md)" }}>
          {isReverse ? (
            <>
              <div style={{ fontSize: 11, color: "rgba(46,107,230,0.55)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Oversett til fransk</div>
              <div style={{ fontSize: 34, color: "var(--text)", marginBottom: 8, fontFamily: "var(--font-display)" }}>{card.no}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 11, color: "rgba(46,107,230,0.55)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Oversett til norsk</div>
              <div style={{ fontSize: 34, color: "var(--text)", fontStyle: "italic", marginBottom: 8, fontFamily: "var(--font-display)" }}>{card.fr}</div>
              {card.phonetic && <div style={{ fontSize: 14, color: "var(--accent)", opacity: 0.7, marginBottom: 8 }}>({card.phonetic})</div>}
              <div style={{ display: "flex", gap: 16, marginTop: 4, justifyContent: "center" }}>
                <button onClick={() => speak(card.fr)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: speaking ? "var(--accent)" : "rgba(46,107,230,0.45)" }}>🔊</button>
                <button onClick={() => speak(card.fr, 0.4)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: speaking ? "var(--accent)" : "rgba(46,107,230,0.45)" }}>🐢</button>
              </div>
            </>
          )}
        </div>

        {!checked ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 340 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submit()}
              onFocus={handleFocus}
              placeholder={isReverse ? "Skriv på fransk..." : "Skriv norsk oversettelse..."}
              className="input-glow"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 16, padding: "14px 16px", outline: "none", textAlign: "center" }}
            />
            <button onClick={submit} disabled={!input.trim()} className="btn-shine"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-light))", opacity: input.trim() ? 1 : 0.4, border: "none", borderRadius: 14, color: "white", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 15, padding: "14px", cursor: input.trim() ? "pointer" : "default" }}>
              Sjekk svar
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 340, alignItems: "center" }}>
            {result === "correct" && (
              <div style={{ background: "rgba(0,184,148,0.10)", border: "1px solid rgba(0,184,148,0.35)", borderRadius: 12, padding: "16px 24px", textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: 16, color: "var(--color-success)", fontWeight: "bold", marginBottom: isReverse ? 8 : 0 }}>✓ Riktig!</div>
                {isReverse && (
                  <>
                    <div style={{ fontSize: 22, color: "var(--accent)", fontStyle: "italic", fontFamily: "var(--font-display)", marginBottom: 2 }}>{card.fr}</div>
                    {card.phonetic && <div style={{ fontSize: 13, color: "var(--accent)", opacity: 0.7, marginBottom: 6 }}>({card.phonetic})</div>}
                    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                      <button onClick={() => speak(card.fr)} style={{ background: "none", border: "none", color: "rgba(46,107,230,0.55)", fontSize: 18, cursor: "pointer" }}>🔊</button>
                      <button onClick={() => speak(card.fr, 0.4)} style={{ background: "none", border: "none", color: "rgba(46,107,230,0.55)", fontSize: 18, cursor: "pointer" }}>🐢</button>
                    </div>
                  </>
                )}
                <PointsBadge pointsInfo={pointsInfo} />
              </div>
            )}
            {result === "close" && (
              <div style={{ background: "rgba(46,107,230,0.07)", border: "1px solid rgba(46,107,230,0.2)", borderRadius: 12, padding: "16px 24px", textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: 16, color: "var(--accent)", fontWeight: "bold", marginBottom: 6 }}>~ Nesten riktig!</div>
                <div style={{ fontSize: 13, color: "var(--text-subtle)", marginBottom: 4 }}>Du svarte: <em>{input}</em></div>
                <div style={{ fontSize: 15, color: "var(--text)" }}>Riktig: <strong>{isReverse ? card.fr : card.no}</strong></div>
                {card.phonetic && <div style={{ fontSize: 13, color: "var(--accent)", opacity: 0.8, marginTop: 6 }}>{card.phonetic}</div>}
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8 }}>
                  <button onClick={() => speak(card.fr)} style={{ background: "none", border: "none", color: "rgba(46,107,230,0.55)", fontSize: 18, cursor: "pointer" }}>🔊</button>
                  <button onClick={() => speak(card.fr, 0.4)} style={{ background: "none", border: "none", color: "rgba(46,107,230,0.55)", fontSize: 18, cursor: "pointer" }}>🐢</button>
                </div>
                <PointsBadge pointsInfo={pointsInfo} />
              </div>
            )}
            {result === "wrong" && (
              <div style={{ background: "rgba(225,112,85,0.08)", border: "1px solid rgba(225,112,85,0.3)", borderRadius: 12, padding: "16px 24px", textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: 16, color: "var(--color-error)", fontWeight: "bold", marginBottom: 6 }}>Prøv igjen neste gang</div>
                <div style={{ fontSize: 13, color: "var(--text-subtle)", marginBottom: 6 }}>Du svarte: <em>{input}</em></div>
                <div style={{ fontSize: 18, color: "var(--text)", marginBottom: 4 }}>{isReverse ? card.fr : card.no}</div>
                {card.phonetic && <div style={{ fontSize: 13, color: "var(--accent)", opacity: 0.8, marginBottom: 6 }}>({card.phonetic})</div>}
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 4 }}>
                  <button onClick={() => speak(card.fr)} style={{ background: "none", border: "none", color: "rgba(46,107,230,0.55)", fontSize: 18, cursor: "pointer" }}>🔊</button>
                  <button onClick={() => speak(card.fr, 0.4)} style={{ background: "none", border: "none", color: "rgba(46,107,230,0.55)", fontSize: 18, cursor: "pointer" }}>🐢</button>
                </div>
                <PointsBadge pointsInfo={pointsInfo} />
              </div>
            )}
            <button onClick={next} className="btn-shine"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-light))", border: "none", borderRadius: 14, color: "white", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 15, padding: "14px 40px", cursor: "pointer", boxShadow: "0 4px 16px rgba(46,107,230,0.35)" }}>
              {queue.length <= 1 ? "Ferdig!" : "Neste ord →"}
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {Array.from({ length: Math.min(total, 20) }).map((_, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: history[i] === "correct" ? "var(--color-success)" : history[i] === "wrong" ? "var(--color-error)" : "var(--border)" }} />
          ))}
        </div>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
    {pointsInfo?.justMastered && !fireworksDone && (
      <Fireworks onDone={() => setFireworksDone(true)} />
    )}
    {pointsInfo?.tierAfter !== pointsInfo?.tierBefore && !pointsInfo?.justMastered && !tierPopDone && (
      <TierPop tierAfter={pointsInfo.tierAfter} onDone={() => setTierPopDone(true)} />
    )}
  </>
  );
}
