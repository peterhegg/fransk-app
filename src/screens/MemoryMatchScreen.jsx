import { useState, useEffect, useRef, useCallback } from "react";
import { shuffle, selectExerciseWords, logGameSession } from "../utils.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { GameHeader, GameResult } from "../components/GameUI.jsx";

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
      <GameResult
        icon="🎉"
        title="Fullført!"
        stats={[
          { label: "Poeng", value: score,       tone: "accent"  },
          { label: "Tid",   value: fmt(seconds), tone: "success" },
          { label: "Feil",  value: mistakes,     tone: "error"   },
        ]}
        primary={{ label: "Spill igjen", onClick: restart }}
        secondary={{ label: "Hjem", onClick: onBack }}
        bottomNav={<BottomNav screen={screen} showWords={showWords} onNav={onNav} />}
      />
    );
  }

  const cols = 4;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <GameHeader
        onBack={onBack}
        backLabel="Tilbake"
        title="Memory"
        right={
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "var(--color-success)", fontFamily: "var(--font-body)", fontWeight: 600 }}>{matched.size}/{totalPairs}</span>
            <span style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)" }}>{fmt(seconds)}</span>
          </div>
        }
      />
      <div style={{ padding: "0 20px 12px" }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)" }}>
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
                    ? "2px solid var(--color-success)"
                    : isSelected
                    ? "2px solid var(--cream)"
                    : isFlipped
                    ? "2px solid rgba(230,211,168,0.4)"
                    : "2px solid var(--border)",
                  background: isMatched
                    ? "var(--color-success-bg)"
                    : isFlipped
                    ? isFr ? "var(--color-info-bg)" : "rgba(251,191,36,0.13)"
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
                    color: isMatched ? "var(--color-success)" : isFr ? "var(--color-info)" : "var(--color-streak)",
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
