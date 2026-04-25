import { useState, useEffect, useRef } from "react";
import { shuffle } from "../utils.jsx";
import BottomNav from "../components/BottomNav.jsx";

// Show a French word + phonetic. User listens and confirms by pressing "Neste".
// No scoring. Randomly cycles through learned words.
export default function SayWordScreen({ words, onBack, speak, speaking, screen, showWords, onNav }) {
  const [queue] = useState(() => {
    if (!words.length) return [];
    return shuffle([...words]).slice(0, 20);
  });
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const hasSpoken = useRef(false);

  const card = queue[idx] || null;

  useEffect(() => {
    if (card && !hasSpoken.current) {
      hasSpoken.current = true;
      setTimeout(() => speak(card.fr, 0.8), 400);
    }
  }, [idx]);

  const next = () => {
    hasSpoken.current = false;
    if (idx + 1 >= queue.length) { setDone(true); return; }
    setIdx(i => i + 1);
  };

  if (!words.length || !card) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 66 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "var(--text)" }}>
          <MicIcon /> Si ordet
        </div>
        <div style={{ width: 60 }} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", gap: 16 }}>
        <div style={{ fontSize: 36, opacity: 0.3 }}>🎙</div>
        <p style={{ color: "var(--text-subtle)", lineHeight: 1.9 }}>Ingen ord i ordbanken ennå.<br />Gjør Dagens øvelse – glose for å lære dine første ord.</p>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  if (done) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 66 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "var(--text)" }}><MicIcon /> Si ordet</div>
        <div style={{ width: 60 }} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", gap: 20 }}>
        <div style={{ fontSize: 48 }}>🗣️</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: "var(--text)" }}>Bra jobba!</div>
        <div style={{ fontSize: 14, color: "var(--text-subtle)" }}>Du har øvd på {queue.length} ord.</div>
        <button onClick={onBack} className="btn-shine"
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
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "var(--text)" }}><MicIcon /> Si ordet</div>
        <div style={{ fontSize: 11, color: "rgba(46,107,230,0.55)", letterSpacing: 1 }}>{idx + 1}/{queue.length}</div>
      </div>

      <div style={{ height: 3, background: "var(--border)" }}>
        <div style={{ height: "100%", background: "linear-gradient(to right, var(--accent), var(--accent-light))", width: `${((idx + 1) / queue.length) * 100}%`, transition: "width 0.3s" }} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", gap: 28 }}>
        <div style={{ fontSize: 10, color: "rgba(46,107,230,0.45)", letterSpacing: 2, textTransform: "uppercase" }}>
          Si dette ordet høyt
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 20, padding: "40px 48px", textAlign: "center", width: "100%", maxWidth: 340, boxShadow: "var(--shadow-md)" }}>
          <div style={{ fontSize: 42, fontStyle: "italic", color: "var(--text)", fontFamily: "var(--font-display)", marginBottom: 14, lineHeight: 1.2 }}>{card.fr}</div>
          {card.phonetic && (
            <div style={{ fontSize: 18, color: "var(--accent)", opacity: 0.75, marginBottom: 16 }}>({card.phonetic})</div>
          )}
          <div style={{ fontSize: 15, color: "var(--text-subtle)", marginBottom: 20 }}>{card.no}</div>
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <button onClick={() => speak(card.fr, 0.8)} title="Hør normal hastighet"
              style={{ background: speaking ? "var(--accent-bg)" : "var(--bg)", border: `1.5px solid ${speaking ? "var(--accent)" : "var(--border)"}`, borderRadius: 14, padding: "14px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text)", fontFamily: "var(--font-body)", fontWeight: 500 }}>
              🔊 Hør
            </button>
            <button onClick={() => speak(card.fr, 0.4)} title="Sakte"
              style={{ background: "var(--bg)", border: "1.5px solid var(--border)", borderRadius: 14, padding: "14px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text)", fontFamily: "var(--font-body)", fontWeight: 500 }}>
              🐢 Sakte
            </button>
          </div>
        </div>

        <button onClick={next} className="btn-shine"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-light))", border: "none", borderRadius: 14, color: "white", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 16, padding: "16px 48px", cursor: "pointer", boxShadow: "0 4px 16px rgba(46,107,230,0.35)" }}>
          {idx >= queue.length - 1 ? "Ferdig 🎉" : "Neste ord →"}
        </button>

        <div style={{ fontSize: 12, color: "var(--text-subtle)", textAlign: "center", maxWidth: 280, lineHeight: 1.7 }}>
          Ingen poeng her — bare øv på uttalen.<br />Trykk «Hør» for å høre riktig uttale.
        </div>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}

function MicIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="8" y1="22" x2="16" y2="22"/>
    </svg>
  );
}
