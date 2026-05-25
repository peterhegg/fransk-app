import { useState, useEffect, useRef, useCallback } from "react";
import { shuffle, selectExerciseWords, logGameSession } from "../utils.jsx";
import BottomNav from "../components/BottomNav.jsx";

const PAIR_COUNT = 8;
const FLIP_DELAY = 900;

function buildCards(words) {
  const pool = selectExerciseWords(words);
  const chosen = shuffle(pool).slice(0, PAIR_COUNT);
  const cards = [];
  chosen.forEach((w, i) => {
    cards.push({ id: `fr-${i}`, pairId: i, side: "fr", text: w.fr, word: w });
    cards.push({ id: `no-${i}`, pairId: i, side: "no", text: w.no, word: w });
  });
  return shuffle(cards);
}

export default function MemoryMatchScreen({ words, onBack, speak, screen, showWords, onNav }) {
  const [cards, setCards] = useState(() => buildCards(words));
  const [flipped, setFlipped] = useState(new Set());
  const [matched, setMatched] = useState(new Set());
  const [selected, setSelected] = useState([]);
  const [locked, setLocked] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [done, setDone] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const timerRef = useRef(null);
  const startedRef = useRef(false);

  const totalPairs = cards.length / 2;

  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!done) setSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [done]);

  const checkDone = useCallback((newMatched) => {
    if (newMatched.size === totalPairs) {
      clearInterval(timerRef.current);
      setDone(true);
      logGameSession(totalPairs);
    }
  }, [totalPairs]);

  const handleFlip = (card) => {
    if (locked || done) return;
    if (flipped.has(card.id) || matched.has(card.pairId)) return;
    if (selected.length === 1 && selected[0].id === card.id) return;

    if (!startedRef.current) startedRef.current = true;

    const newFlipped = new Set(flipped).add(card.id);
    setFlipped(newFlipped);

    if (selected.length === 0) {
      setSelected([card]);
      return;
    }

    const first = selected[0];
    setSelected([]);

    if (first.pairId === card.pairId && first.side !== card.side) {
      const newMatched = new Set(matched).add(card.pairId);
      setMatched(newMatched);
      setSelected([]);
      checkDone(newMatched);
    } else {
      setMistakes(m => m + 1);
      setLocked(true);
      setTimeout(() => {
        setFlipped(prev => {
          const n = new Set(prev);
          n.delete(first.id);
          n.delete(card.id);
          return n;
        });
        setLocked(false);
      }, FLIP_DELAY);
    }
  };

  const restart = () => {
    clearInterval(timerRef.current);
    setCards(buildCards(words));
    setFlipped(new Set());
    setMatched(new Set());
    setSelected([]);
    setLocked(false);
    setSeconds(0);
    setDone(false);
    setMistakes(0);
    startedRef.current = false;
  };

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const score = done ? Math.max(0, totalPairs * 100 - mistakes * 10) : 0;

  if (done) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", gap: 24 }}>
          <div style={{ fontSize: 64 }}>🎉</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 500, color: "var(--text)", textAlign: "center", letterSpacing: "-0.5px" }}>
            Fullført!
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {[
              { label: "Poeng", val: score, color: "var(--cream)" },
              { label: "Tid", val: fmt(seconds), color: "#34d399" },
              { label: "Feil", val: mistakes, color: "#f87171" },
            ].map(s => (
              <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "16px 20px", textAlign: "center", minWidth: 80 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: "var(--font-body)" }}>{s.val}</div>
                <div style={{ fontSize: 11, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button onClick={restart} style={{ padding: "14px 28px", background: "var(--cream)", color: "#1a1209", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}>
              Spill igjen
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

  const cols = 4;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "56px 20px 12px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 14, cursor: "pointer", padding: "4px 0", fontFamily: "var(--font-body)" }}>
          ← Tilbake
        </button>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#34d399", fontFamily: "var(--font-body)", fontWeight: 600 }}>
            {matched.size}/{totalPairs} par
          </span>
          <span style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)" }}>
            {fmt(seconds)}
          </span>
        </div>
      </div>

      {/* Title */}
      <div style={{ padding: "0 20px 20px" }}>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.4px" }}>
          Memory
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)" }}>
          Match norsk og fransk — {totalPairs} par
        </p>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, padding: "0 16px 16px", display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 8,
          width: "100%",
          maxWidth: 420,
        }}>
          {cards.map(card => {
            const isFlipped = flipped.has(card.id);
            const isMatched = matched.has(card.pairId);
            const isSelected = selected.length > 0 && selected[0].id === card.id;
            const isFr = card.side === "fr";

            return (
              <button
                key={card.id}
                onClick={() => handleFlip(card)}
                style={{
                  aspectRatio: "1",
                  borderRadius: 12,
                  border: isMatched
                    ? "2px solid #34d399"
                    : isSelected
                    ? "2px solid var(--cream)"
                    : isFlipped
                    ? "2px solid rgba(230,211,168,0.4)"
                    : "2px solid var(--border)",
                  background: isMatched
                    ? "rgba(52,211,153,0.12)"
                    : isFlipped
                    ? isFr ? "rgba(129,140,248,0.15)" : "rgba(251,191,36,0.13)"
                    : "var(--surface)",
                  cursor: isMatched ? "default" : "pointer",
                  transition: "all 0.18s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 6,
                  transform: isSelected ? "scale(0.95)" : "scale(1)",
                }}
              >
                {isFlipped || isMatched ? (
                  <span style={{
                    fontSize: card.text.length > 10 ? 11 : card.text.length > 6 ? 13 : 15,
                    color: isMatched ? "#34d399" : isFr ? "#818cf8" : "#fbbf24",
                    fontFamily: "var(--font-body)",
                    fontWeight: 600,
                    textAlign: "center",
                    lineHeight: 1.2,
                    wordBreak: "break-word",
                    hyphens: "auto",
                  }}>
                    {card.text}
                  </span>
                ) : (
                  <span style={{ fontSize: 20, opacity: 0.3 }}>?</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}
