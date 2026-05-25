import { useState, useEffect, useRef } from "react";
import { shuffle, logGameSession } from "../utils.jsx";
import { VOCAB_CAT_MAP } from "../constants.js";
import BottomNav from "../components/BottomNav.jsx";

const MIN_WORDS_PER_CAT = 3;
const WORDS_PER_CAT = 4;
const MAX_CATS = 4;

function getCategory(word) {
  const raw = word.fr.replace(/^(le |la |les |l')/i, "").trim().toLowerCase();
  return VOCAB_CAT_MAP[raw] || VOCAB_CAT_MAP[word.fr.toLowerCase()] || null;
}

function buildGame(words) {
  const byCategory = {};
  for (const w of words) {
    const cat = getCategory(w);
    if (!cat) continue;
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(w);
  }
  const eligible = Object.entries(byCategory)
    .filter(([, ws]) => ws.length >= MIN_WORDS_PER_CAT)
    .sort(() => Math.random() - 0.5)
    .slice(0, MAX_CATS);

  if (eligible.length < 2) return null;

  const categories = eligible.map(([cat]) => cat);
  const gameWords = eligible.flatMap(([cat, ws]) =>
    shuffle(ws).slice(0, WORDS_PER_CAT).map(w => ({ ...w, category: cat }))
  );
  return { categories, queue: shuffle(gameWords) };
}

const CAT_COLORS = ["#fbbf24", "#818cf8", "#34d399", "#f87171"];

export default function KategorisorteringScreen({ words, grammarWords, onBack, speak, speaking, screen, showWords, onNav }) {
  const allWords = [...words, ...(grammarWords || [])];
  const [game, setGame] = useState(() => buildGame(allWords));
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null); // null | { correct: bool, correctCat: string }
  const [done, setDone] = useState(false);
  const [wrong, setWrong] = useState(0);
  const lockedRef = useRef(false);

  if (!game) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, gap: 20 }}>
        <div style={{ fontSize: 48 }}>📚</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--text)", textAlign: "center" }}>Trenger flere gloser</div>
        <div style={{ fontSize: 14, color: "var(--text-subtle)", fontFamily: "var(--font-body)", textAlign: "center", lineHeight: 1.6 }}>
          Du trenger minst {MIN_WORDS_PER_CAT * 2} ord fra to ulike kategorier.<br />Øv mer gloser for å låse opp dette spillet.
        </div>
        <button onClick={onBack} style={{ padding: "14px 28px", background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 14, fontSize: 15, cursor: "pointer", fontFamily: "var(--font-body)" }}>Tilbake</button>
        <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
      </div>
    );
  }

  const { categories, queue } = game;
  const current = queue[idx] || null;
  const total = queue.length;

  const handleAnswer = (cat) => {
    if (lockedRef.current || feedback) return;
    lockedRef.current = true;
    const correct = cat === current.category;
    if (correct) setScore(s => s + 1);
    else setWrong(w => w + 1);
    setFeedback({ correct, correctCat: current.category });

    setTimeout(() => {
      setFeedback(null);
      lockedRef.current = false;
      if (idx + 1 >= total) {
        logGameSession(total);
        setDone(true);
      } else {
        setIdx(i => i + 1);
      }
    }, 900);
  };

  const restart = () => {
    const newGame = buildGame(allWords);
    setGame(newGame);
    setIdx(0);
    setScore(0);
    setWrong(0);
    setFeedback(null);
    setDone(false);
    lockedRef.current = false;
  };

  if (done) {
    const pct = Math.round((score / total) * 100);
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", gap: 24 }}>
          <div style={{ fontSize: 56 }}>{pct >= 80 ? "🗂️" : pct >= 50 ? "👍" : "🔄"}</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 500, color: "var(--text)", textAlign: "center", letterSpacing: "-0.4px" }}>
            {pct >= 80 ? "Glimrende sortering!" : pct >= 50 ? "Bra jobbet!" : "Øv mer på kategorier!"}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { label: "Riktige", val: score, color: "#34d399" },
              { label: "Feil", val: wrong, color: "#f87171" },
              { label: "Prosent", val: `${pct}%`, color: "var(--cream)" },
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
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", paddingBottom: 96 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "56px 20px 12px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>
          ← Avslutt
        </button>
        <span style={{ fontSize: 13, color: "#34d399", fontFamily: "var(--font-body)", fontWeight: 600 }}>{score}/{total}</span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: "var(--border)", margin: "0 20px 20px" }}>
        <div style={{ height: "100%", width: `${(idx / total) * 100}%`, background: "var(--cream)", borderRadius: 2, transition: "width 0.3s ease" }} />
      </div>

      {/* Word card */}
      <div style={{ padding: "0 20px 28px" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 24, padding: "32px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "var(--font-body)", marginBottom: 14 }}>
            Hvilken kategori?
          </div>
          <button
            onClick={() => current && speak(current.fr, 0.8)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <div style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.5px" }}>
              {current?.fr}
            </div>
            {current?.p && (
              <div style={{ fontSize: 14, color: "var(--text-subtle)", fontFamily: "var(--font-body)", marginTop: 6, fontStyle: "italic" }}>
                /{current.p}/
              </div>
            )}
          </button>
          <div style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)", marginTop: 10 }}>
            {current?.no}
          </div>
        </div>
      </div>

      {/* Category buttons */}
      <div style={{ padding: "0 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {categories.map((cat, i) => {
          const color = CAT_COLORS[i % CAT_COLORS.length];
          const isCorrect = feedback && cat === feedback.correctCat;
          const isWrong = feedback && !feedback.correct && cat !== feedback.correctCat;
          return (
            <button
              key={cat}
              onClick={() => handleAnswer(cat)}
              style={{
                padding: "18px 12px",
                borderRadius: 18,
                border: isCorrect
                  ? `2px solid ${color}`
                  : isWrong
                  ? "2px solid var(--border)"
                  : `2px solid ${color}22`,
                background: isCorrect
                  ? `${color}22`
                  : "var(--surface)",
                color: isCorrect ? color : isWrong ? "var(--text-subtle)" : color,
                fontSize: cat.length > 16 ? 12 : 14,
                fontFamily: "var(--font-body)",
                fontWeight: 600,
                cursor: feedback ? "default" : "pointer",
                textAlign: "center",
                lineHeight: 1.3,
                transition: "all 0.15s ease",
                opacity: isWrong ? 0.4 : 1,
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {feedback && (
        <div style={{ padding: "16px 20px 0", textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: feedback.correct ? "#34d399" : "#f87171", fontFamily: "var(--font-body)" }}>
            {feedback.correct ? "✓ Riktig!" : `✗ Det var «${feedback.correctCat}»`}
          </div>
        </div>
      )}

      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}
