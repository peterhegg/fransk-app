import { useEffect, useRef } from "react";

const SHOWN_KEY = "fransk-streak-tapt-shown";

export function wasStreakTaptShownToday() {
  try {
    const s = JSON.parse(sessionStorage.getItem(SHOWN_KEY) || "null");
    return s?.date === new Date().toISOString().split("T")[0];
  } catch { return false; }
}

export function markStreakTaptShown() {
  try {
    sessionStorage.setItem(SHOWN_KEY, JSON.stringify({ date: new Date().toISOString().split("T")[0] }));
  } catch {}
}

export default function StreakTaptModal({ lostStreak, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    markStreakTaptShown();
    const t = setTimeout(() => ref.current?.classList.add("streak-tapt-in"), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
        .streak-tapt-wrap {
          position: fixed; inset: 0; z-index: 9000;
          background: rgba(10,4,2,0.97);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 40px 28px;
          opacity: 0; transform: scale(1.04);
          transition: opacity 0.35s ease, transform 0.35s ease;
        }
        .streak-tapt-in { opacity: 1 !important; transform: scale(1) !important; }
        @keyframes crackle {
          0%,100% { transform: rotate(-2deg) scale(1); }
          50% { transform: rotate(2deg) scale(1.05); }
        }
      `}</style>
      <div ref={ref} className="streak-tapt-wrap">
        <div style={{ fontSize: 80, marginBottom: 8, animation: "crackle 1.2s ease infinite", filter: "grayscale(0.3)" }}>💔</div>
        <div style={{ fontSize: 72, fontFamily: "var(--font-display)", fontWeight: 700, color: "#ef4444", letterSpacing: "-2px", lineHeight: 1 }}>
          {lostStreak}
        </div>
        <div style={{ fontSize: 14, color: "#fca5a5", fontFamily: "var(--font-body)", marginTop: 4, letterSpacing: 1.5, textTransform: "uppercase" }}>
          dagers streak tapt
        </div>

        <div style={{ marginTop: 32, textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 500, color: "rgba(255,255,255,0.9)", letterSpacing: "-0.3px" }}>
            Øyeblikket er over.
          </div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", fontFamily: "var(--font-body)", marginTop: 10, lineHeight: 1.7, maxWidth: 280 }}>
            Alle mestere har brutt en streak. Det som skiller dem er at de startet igjen.
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: 48,
            padding: "18px 48px",
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: 18,
            fontSize: 17,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "var(--font-body)",
            letterSpacing: 0.3,
            boxShadow: "0 0 40px rgba(239,68,68,0.4)",
          }}
        >
          Start dag 1 igjen 🔥
        </button>
      </div>
    </>
  );
}
