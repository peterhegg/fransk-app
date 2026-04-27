import { useState, useEffect, useRef } from "react";
import { shuffle } from "../utils.jsx";
import BottomNav from "../components/BottomNav.jsx";
import { useVoiceRecognition } from "../hooks/useVoiceRecognition.jsx";

const FRENCH_ARTICLES = /^(l'|le |la |les |un |une |des )/;

function normalize(s) {
  return s
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`\-.,!?]/g, " ")
    .replace(FRENCH_ARTICLES, "")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesTarget(recognized, target) {
  if (!recognized || !target) return false;
  const e = normalize(target);
  if (!e) return false;
  const maxDist = e.length <= 3 ? 1 : e.length <= 6 ? 2 : 3;
  return recognized.split("|").some((alt) => {
    const r = normalize(alt);
    if (r === e) return true;
    if (r.includes(e) || e.includes(r)) return true;
    if (r.split(" ").some(w => levenshtein(w, e) <= maxDist)) return true;
    return levenshtein(r, e) <= maxDist;
  });
}

function isGoodMatch(recognized, card) {
  if (!recognized) return false;
  // Check against written French word
  if (matchesTarget(recognized, card.fr)) return true;
  // Also check against phonetic — e.g. user says "o" for "l'eau" (phonetic: "lo")
  if (card.phonetic && matchesTarget(recognized, card.phonetic)) return true;
  return false;
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

export default function SayWordScreen({ words, onBack, speak, speaking, screen, showWords, onNav }) {
  const [queue] = useState(() => {
    if (!words.length) return [];
    return shuffle([...words]).slice(0, 20);
  });
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState(null); // null | "correct" | "incorrect"
  const [heard, setHeard] = useState("");
  const hasSpoken = useRef(false);
  const { status, startListening } = useVoiceRecognition();

  const card = queue[idx] || null;

  useEffect(() => {
    if (card && !hasSpoken.current) {
      hasSpoken.current = true;
      setTimeout(() => speak(card.fr, 0.8), 400);
    }
  }, [idx]);

  const handleListen = () => {
    setResult(null);
    setHeard("");
    const bare = card.fr.replace(/^(l'|le |la |les |un |une |des )/i, "").trim();
    const timeoutMs = bare.length <= 4 ? 4000 : 7000;
    startListening((transcript) => {
      setHeard(transcript.split("|")[0]);
      if (isGoodMatch(transcript, card)) {
        setResult("correct");
      } else {
        setResult("incorrect");
      }
    }, {
      hintWord: card.fr,
      timeoutMs,
      shouldStopEarly: (t) => isGoodMatch(t, card),
    });
  };

  const next = () => {
    hasSpoken.current = false;
    setResult(null);
    setHeard("");
    if (idx + 1 >= queue.length) { setDone(true); return; }
    setIdx(i => i + 1);
  };

  const header = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "var(--text)" }}><MicIcon /> Si ordet</div>
      <div style={{ width: 60 }} />
    </div>
  );

  if (!words.length || !card) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 66 }}>
      {header}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", gap: 16 }}>
        <div style={{ fontSize: 36, opacity: 0.3 }}>🎙</div>
        <p style={{ color: "var(--text-subtle)", lineHeight: 1.9 }}>Ingen ord i ordbanken ennå.<br />Gjør Dagens øvelse – glose for å lære dine første ord.</p>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  if (done) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 66 }}>
      {header}
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

  const isListening = status === "listening";

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

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px", gap: 24 }}>
        <div style={{ fontSize: 10, color: "rgba(46,107,230,0.45)", letterSpacing: 2, textTransform: "uppercase" }}>
          Si dette ordet høyt på fransk
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

        {/* Feedback */}
        {result === "correct" && (
          <div style={{ background: "rgba(34,197,94,0.12)", border: "1.5px solid rgba(34,197,94,0.4)", borderRadius: 14, padding: "14px 24px", textAlign: "center", width: "100%", maxWidth: 340 }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>✅</div>
            <div style={{ fontSize: 15, color: "var(--text)", fontWeight: 600 }}>Riktig uttale!</div>
            {heard && <div style={{ fontSize: 13, color: "var(--text-subtle)", marginTop: 4 }}>Hørte: «{heard}»</div>}
          </div>
        )}
        {result === "incorrect" && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1.5px solid rgba(239,68,68,0.35)", borderRadius: 14, padding: "16px 24px", textAlign: "center", width: "100%", maxWidth: 340 }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>❌</div>
            {heard
              ? <div style={{ fontSize: 13, color: "var(--text-subtle)", marginBottom: 8 }}>Hørte: «{heard}»</div>
              : <div style={{ fontSize: 13, color: "var(--text-subtle)", marginBottom: 8 }}>Ingenting ble fanget opp — si det litt høyere</div>
            }
            {card.phonetic && (
              <div style={{ fontSize: 14, color: "var(--text)", marginBottom: 4 }}>
                Uttale: <span style={{ color: "var(--accent)", fontWeight: 600 }}>{card.phonetic}</span>
              </div>
            )}
            <button onClick={() => speak(card.fr, 0.6)}
              style={{ marginTop: 8, background: "none", border: "1px solid var(--accent)", borderRadius: 10, padding: "7px 16px", color: "var(--accent)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)" }}>
              🔊 Hør igjen (sakte)
            </button>
          </div>
        )}

        {/* Action buttons */}
        {result === "correct" ? (
          <button onClick={next} className="btn-shine"
            style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", border: "none", borderRadius: 14, color: "white", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 16, padding: "16px 48px", cursor: "pointer", boxShadow: "0 4px 16px rgba(34,197,94,0.35)" }}>
            {idx >= queue.length - 1 ? "Ferdig 🎉" : "Neste ord →"}
          </button>
        ) : (
          <button
            onClick={handleListen}
            disabled={isListening}
            style={{
              background: isListening
                ? "rgba(46,107,230,0.15)"
                : "linear-gradient(135deg, var(--accent), var(--accent-light))",
              border: isListening ? "2px solid var(--accent)" : "none",
              borderRadius: 14,
              color: isListening ? "var(--accent)" : "white",
              fontFamily: "var(--font-body)",
              fontWeight: "500",
              fontSize: 16,
              padding: "16px 48px",
              cursor: isListening ? "default" : "pointer",
              boxShadow: isListening ? "none" : "0 4px 16px rgba(46,107,230,0.35)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}>
            {isListening ? (
              <>
                <PulsingDot /> Hører på deg...
              </>
            ) : (
              <>{result === "incorrect" ? "🎙 Prøv igjen" : "🎙 Si ordet"}</>
            )}
          </button>
        )}
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}

function PulsingDot() {
  return (
    <span style={{
      display: "inline-block",
      width: 10,
      height: 10,
      borderRadius: "50%",
      background: "var(--accent)",
      animation: "pulse 1s ease-in-out infinite",
    }} />
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
