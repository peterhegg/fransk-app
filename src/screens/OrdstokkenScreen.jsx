import { useState, useEffect, useRef, useCallback } from "react";
import { shuffle, logGameSession, logSentenceAnswer } from "../utils.jsx";
import { getActiveLang } from "../languages/index.js";
import BottomNav from "../components/BottomNav.jsx";

const ROUNDS = 10;
const MIN_LEN = 4;
const MAX_LEN = 11;

const ARTICLE_RE = {
  fr:     /^(le |la |les |l'|un |une )/i,
  "de-CH": /^(der |die |das |ein |eine )/i,
};
const WORD_CHAR_RE = {
  fr:     /^[a-záàâäéèêëíìîïóòôöúùûüç]+$/,
  "de-CH": /^[a-zäöüß]+$/,
};

function getBase(fr, langId) {
  return fr.replace(ARTICLE_RE[langId] || ARTICLE_RE.fr, "").trim();
}

function eligible(word, langId) {
  const base = getBase(word.fr, langId);
  return (
    !base.includes(" ") && !base.includes("/") &&
    base.length >= MIN_LEN && base.length <= MAX_LEN &&
    (WORD_CHAR_RE[langId] || WORD_CHAR_RE.fr).test(base.toLowerCase())
  );
}

function scramble(word) {
  const letters = word.split("");
  let result;
  let tries = 0;
  do {
    result = shuffle([...letters]);
    tries++;
  } while (result.join("") === word && tries < 20);
  return result;
}

function buildRounds(words, langId) {
  const pool = words.filter(w => eligible(w, langId));
  if (pool.length < 3) return null;
  const chosen = shuffle(pool).slice(0, ROUNDS);
  return chosen.map((w, i) => {
    const base = getBase(w.fr, langId);
    return {
      id: i,
      word: w,
      base,
      letters: scramble(base).map((ch, j) => ({ id: `${i}-${j}`, ch })),
    };
  });
}

export default function OrdstokkenScreen({ words, grammarWords, onBack, speak, speaking, screen, showWords, onNav }) {
  const langId = getActiveLang().id;
  const allWords = [...words, ...(grammarWords || [])];
  const [rounds] = useState(() => buildRounds(allWords, langId));
  const [idx, setIdx] = useState(0);
  const [placed, setPlaced] = useState([]); // letter ids in order
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [shake, setShake] = useState(false);

  const current = rounds ? rounds[idx] : null;

  useEffect(() => {
    setPlaced([]);
    setChecked(false);
    setIsCorrect(false);
  }, [idx]);

  // Auto-check when all letters are placed
  useEffect(() => {
    if (!current || checked) return;
    if (placed.length === current.base.length) {
      const built = placed.map(id => current.letters.find(l => l.id === id)?.ch || "").join("");
      const correct = built.toLowerCase() === current.base.toLowerCase();
      setIsCorrect(correct);
      setChecked(true);
      if (correct) {
        setScore(s => s + 1);
        speak(current.word.fr, 0.8);
        logSentenceAnswer();
      } else {
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    }
  }, [placed, current, checked]);

  const handlePlace = (letter) => {
    if (checked) return;
    setPlaced(p => [...p, letter.id]);
  };

  const handleRemove = (letterId) => {
    if (checked) return;
    setPlaced(p => p.filter(id => id !== letterId));
  };

  const handleNext = () => {
    if (idx + 1 >= rounds.length) {
      logGameSession(rounds.length);
      setDone(true);
    } else {
      setIdx(i => i + 1);
    }
  };

  const handleSkip = () => {
    setIsCorrect(false);
    setChecked(true);
    speak(current.word.fr, 0.8);
  };

  const restart = () => {
    // re-shuffle same rounds
    setIdx(0);
    setScore(0);
    setPlaced([]);
    setChecked(false);
    setIsCorrect(false);
    setDone(false);
  };

  if (!rounds) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, gap: 20 }}>
        <div style={{ fontSize: 48 }}>🔤</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--text)", textAlign: "center" }}>Trenger flere gloser</div>
        <div style={{ fontSize: 14, color: "var(--text-subtle)", fontFamily: "var(--font-body)", textAlign: "center", lineHeight: 1.6 }}>
          Øv mer gloser for å låse opp Ordstokken.
        </div>
        <button onClick={onBack} style={{ padding: "14px 28px", background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 14, fontSize: 15, cursor: "pointer", fontFamily: "var(--font-body)" }}>Tilbake</button>
        <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
      </div>
    );
  }

  if (done) {
    const pct = Math.round((score / rounds.length) * 100);
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", gap: 24 }}>
          <div style={{ fontSize: 56 }}>{pct >= 80 ? "🏆" : pct >= 50 ? "🔤" : "📝"}</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 500, color: "var(--text)", textAlign: "center", letterSpacing: "-0.4px" }}>
            {pct >= 80 ? "Ordstokkmester!" : pct >= 50 ? "Bra stava!" : "Øv mer på stavemåten!"}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {[
              { label: "Riktige", val: score, color: "#34d399" },
              { label: "Totalt", val: rounds.length, color: "var(--cream)" },
              { label: "Prosent", val: `${pct}%`, color: "#818cf8" },
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

  const placedLetters = placed.map(id => current.letters.find(l => l.id === id)).filter(Boolean);
  const unplacedLetters = current.letters.filter(l => !placed.includes(l.id));

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", paddingBottom: 104 }}>
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-6px)}
          40%{transform:translateX(6px)}
          60%{transform:translateX(-4px)}
          80%{transform:translateX(4px)}
        }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "56px 20px 12px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>
          ← Avslutt
        </button>
        <span style={{ fontSize: 13, color: "#34d399", fontFamily: "var(--font-body)", fontWeight: 600 }}>{score}/{rounds.length}</span>
      </div>

      {/* Progress */}
      <div style={{ height: 3, background: "var(--border)", margin: "0 20px 20px" }}>
        <div style={{ height: "100%", width: `${(idx / rounds.length) * 100}%`, background: "var(--cream)", borderRadius: 2, transition: "width 0.3s ease" }} />
      </div>

      {/* Clue card */}
      <div style={{ padding: "0 20px 20px" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 22, padding: "24px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "var(--font-body)", marginBottom: 10 }}>
            Stav det franske ordet for…
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.3px" }}>
            {current?.word.no.split("/")[0].trim()}
          </div>
          {current?.word.p && (
            <div style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)", marginTop: 6, fontStyle: "italic" }}>
              Uttale: /{current.word.p}/
            </div>
          )}
        </div>
      </div>

      {/* Answer zone */}
      <div style={{ padding: "0 20px 16px" }}>
        <div style={{
          minHeight: 60,
          borderRadius: 16,
          border: `2px solid ${checked ? (isCorrect ? "#34d399" : "#f87171") : "var(--border)"}`,
          background: checked ? (isCorrect ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)") : "rgba(230,211,168,0.04)",
          padding: "10px 12px",
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          alignItems: "center",
          transition: "border-color 0.2s, background 0.2s",
          animation: shake ? "shake 0.4s ease" : "none",
        }}>
          {placedLetters.length === 0 && !checked && (
            <span style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)", fontStyle: "italic" }}>Trykk bokstaver nedenfor…</span>
          )}
          {placedLetters.map((letter, i) => (
            <button
              key={letter.id}
              onClick={() => handleRemove(letter.id)}
              style={{
                width: 36, height: 40, borderRadius: 8, border: "none",
                background: checked ? (isCorrect ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)") : "rgba(230,211,168,0.15)",
                color: checked ? (isCorrect ? "#34d399" : "#f87171") : "var(--cream)",
                fontSize: 18, fontFamily: "var(--font-body)", fontWeight: 700,
                cursor: checked ? "default" : "pointer",
              }}
            >
              {letter.ch}
            </button>
          ))}
        </div>

        {checked && (
          <div style={{ marginTop: 10, padding: "10px 14px", background: isCorrect ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)", borderRadius: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: isCorrect ? "#34d399" : "#f87171", fontFamily: "var(--font-body)" }}>
              {isCorrect ? `✓ Riktig! — ${current.word.fr}` : `✗ Riktig svar: ${current.word.fr}`}
            </div>
          </div>
        )}
      </div>

      {/* Letter tiles */}
      <div style={{ padding: "0 20px", display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        {unplacedLetters.map(letter => (
          <button
            key={letter.id}
            onClick={() => handlePlace(letter)}
            style={{
              width: 44, height: 48, borderRadius: 10,
              border: "2px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: 20, fontFamily: "var(--font-body)", fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.12s ease",
            }}
          >
            {letter.ch}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div style={{ position: "fixed", bottom: 92, left: 0, right: 0, padding: "0 20px", zIndex: 190, display: "flex", gap: 10 }}>
        {!checked ? (
          <button
            onClick={handleSkip}
            style={{ flex: 1, padding: "15px", background: "var(--surface)", color: "var(--text-subtle)", border: "1px solid var(--border)", borderRadius: 14, fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}
          >
            Gi opp
          </button>
        ) : (
          <button
            onClick={handleNext}
            style={{ flex: 1, padding: "15px", background: "var(--cream)", color: "#1a1209", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
          >
            {idx + 1 >= rounds.length ? "Se resultat" : "Neste →"}
          </button>
        )}
      </div>

      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}
