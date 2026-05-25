import { useState, useEffect, useRef, useCallback } from "react";
import { shuffle, getQuizOptions, logGameSession } from "../utils.jsx";
import BottomNav from "../components/BottomNav.jsx";

const DURATION = 60;
const HIGH_SCORE_KEY = "fransk-tidspress-highscore";

function loadHighScore() {
  try { return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || "0", 10); } catch { return 0; }
}
function saveHighScore(s) {
  try { localStorage.setItem(HIGH_SCORE_KEY, String(s)); } catch {}
}

function buildQueue(words) {
  return shuffle([...words]);
}

export default function TidspressScreen({ words, onBack, speak, speaking, screen, showWords, onNav }) {
  const allWords = [...words];
  const [queue, setQueue] = useState(() => buildQueue(allWords));
  const [idx, setIdx] = useState(0);
  const [options, setOptions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [selected, setSelected] = useState(null);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [highScore, setHighScore] = useState(loadHighScore);
  const timerRef = useRef(null);
  const lockedRef = useRef(false);

  const card = queue[idx % queue.length] || null;

  const buildOptions = useCallback((c) => {
    if (!c) return [];
    return getQuizOptions(c, allWords, true);
  }, [allWords.length]);

  useEffect(() => {
    if (card) setOptions(buildOptions(card));
  }, [idx, card?.fr]);

  useEffect(() => {
    if (!started || done) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setDone(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [started, done]);

  useEffect(() => {
    if (done) {
      logGameSession(answered);
      const hs = loadHighScore();
      if (score > hs) saveHighScore(score);
      setHighScore(Math.max(score, hs));
    }
  }, [done]);

  const handleAnswer = (opt) => {
    if (!started || done || lockedRef.current || selected !== null) return;
    lockedRef.current = true;
    setSelected(opt);

    const correct = card.fr.split(/\s*\/\s*/)[0].trim();
    const isCorrect = opt === correct;

    if (isCorrect) {
      const newStreak = streak + 1;
      const multiplier = newStreak >= 5 ? 1.5 : 1;
      const pts = Math.round(10 * multiplier);
      setScore(s => s + pts);
      setStreak(newStreak);
    } else {
      setStreak(0);
      setWrong(w => w + 1);
    }
    setAnswered(a => a + 1);

    setTimeout(() => {
      setSelected(null);
      setIdx(i => i + 1);
      lockedRef.current = false;
    }, 400);
  };

  const restart = () => {
    clearInterval(timerRef.current);
    setQueue(buildQueue(allWords));
    setIdx(0);
    setTimeLeft(DURATION);
    setScore(0);
    setStreak(0);
    setAnswered(0);
    setWrong(0);
    setSelected(null);
    setStarted(false);
    setDone(false);
    lockedRef.current = false;
  };

  const timerPct = (timeLeft / DURATION) * 100;
  const timerColor = timeLeft > 20 ? "#34d399" : timeLeft > 10 ? "#fbbf24" : "#f87171";
  const isNewHigh = done && score > loadHighScore() - 1 && score >= highScore;

  if (!started) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", gap: 24 }}>
          <div style={{ fontSize: 56 }}>⚡</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.5px" }}>Tidspress</div>
            <div style={{ fontSize: 14, color: "var(--text-subtle)", marginTop: 8, fontFamily: "var(--font-body)", lineHeight: 1.5 }}>
              Vis norsk ord — velg riktig fransk på 60 sekunder.<br />5 riktige på rad gir 1,5× poeng.
            </div>
          </div>
          {highScore > 0 && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "10px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 1 }}>Rekord</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "var(--cream)", fontFamily: "var(--font-body)" }}>{highScore}</div>
            </div>
          )}
          <button onClick={() => setStarted(true)} style={{ padding: "16px 48px", background: "var(--cream)", color: "#1a1209", border: "none", borderRadius: 16, fontSize: 17, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", letterSpacing: 0.3 }}>
            Start!
          </button>
          <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>Tilbake</button>
        </div>
        <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
      </div>
    );
  }

  if (done) {
    const newHigh = score >= highScore && score > 0;
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", gap: 24 }}>
          <div style={{ fontSize: 56 }}>{newHigh ? "🏆" : "⏱️"}</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 500, color: "var(--text)", textAlign: "center", letterSpacing: "-0.5px" }}>
            {newHigh ? "Ny rekord!" : "Tid ute!"}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { label: "Poeng", val: score, color: "var(--cream)" },
              { label: "Riktige", val: answered - wrong, color: "#34d399" },
              { label: "Feil", val: wrong, color: "#f87171" },
            ].map(s => (
              <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "16px 18px", textAlign: "center", minWidth: 80 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: "var(--font-body)" }}>{s.val}</div>
                <div style={{ fontSize: 11, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {newHigh && (
            <div style={{ fontSize: 13, color: "var(--cream)", fontFamily: "var(--font-body)" }}>
              Forrige rekord: {loadHighScore()} → {score}
            </div>
          )}
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={restart} style={{ padding: "14px 28px", background: "var(--cream)", color: "#1a1209", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}>
              Prøv igjen
            </button>
            <button onClick={onBack} style={{ padding: "14px 28px", background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 14, fontSize: 15, cursor: "pointer", fontFamily: "var(--font-body)" }}>
              Hjem
            </button>
          </div>
        </div>
        <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
      </div>
    );
  }

  const correct = card ? card.fr.split(/\s*\/\s*/)[0].trim() : "";

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      {/* Timer bar */}
      <div style={{ height: 4, background: "var(--border)", flexShrink: 0 }}>
        <div style={{ height: "100%", width: `${timerPct}%`, background: timerColor, transition: "width 1s linear, background 0.3s ease" }} />
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 8px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>
          ← Avslutt
        </button>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {streak >= 3 && (
            <span style={{ fontSize: 13, color: "#fbbf24", fontFamily: "var(--font-body)", fontWeight: 600 }}>
              🔥 {streak}
            </span>
          )}
          <span style={{ fontSize: 20, fontWeight: 700, color: timerColor, fontFamily: "var(--font-body)", minWidth: 28, textAlign: "right" }}>
            {timeLeft}
          </span>
        </div>
      </div>

      {/* Score */}
      <div style={{ padding: "0 20px 4px", display: "flex", gap: 16, alignItems: "baseline" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 500, color: "var(--cream)", letterSpacing: "-1px" }}>{score}</span>
        <span style={{ fontSize: 12, color: "var(--text-subtle)", fontFamily: "var(--font-body)" }}>{answered} svar</span>
        {streak >= 5 && <span style={{ fontSize: 12, color: "#fbbf24", fontFamily: "var(--font-body)" }}>×1.5</span>}
      </div>

      {/* Question */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px 20px", gap: 16 }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "28px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "var(--font-body)", marginBottom: 12 }}>
            Hva er fransk for…
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.3px" }}>
            {card?.no.split("/")[0].trim()}
          </div>
        </div>

        {/* Options */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {options.map(opt => {
            const isSelected = selected === opt;
            const correctOpt = opt === correct;
            const showResult = isSelected;
            return (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                style={{
                  padding: "16px 12px",
                  borderRadius: 16,
                  border: showResult
                    ? correctOpt ? "2px solid #34d399" : "2px solid #f87171"
                    : "2px solid var(--border)",
                  background: showResult
                    ? correctOpt ? "rgba(52,211,153,0.15)" : "rgba(248,113,113,0.15)"
                    : "var(--surface)",
                  color: showResult ? (correctOpt ? "#34d399" : "#f87171") : "var(--text)",
                  fontSize: opt.length > 14 ? 13 : 15,
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  textAlign: "center",
                  lineHeight: 1.3,
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}
