import { useRef } from "react";
import { GRAMMAR_TOPICS } from "../constants.js";
import BottomNav from "./BottomNav.jsx";

// Shared screen for Gloseøvelse AND Grammatikkøvelse
export default function QuizExerciseScreen({
  title, icon, emptyMsg,
  queue, card, input, setInput, checked, result, stats, history = [], options, mode,
  onSubmit, onNext, onBack,
  speak, speaking,
  screen, showWords, onNav,
}) {
  const inputRef = useRef(null);
  const total = stats.correct + stats.wrong + queue.length;
  const done = stats.correct + stats.wrong;
  const isFromBank = !!card?.id;
  const isReverse = !!card?.reverse;
  const grammarTip = card?.topicId ? GRAMMAR_TOPICS.find(t => t.id === card.topicId) : null;

  const handleInputFocus = () => {
    setTimeout(() => inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
  };

  if (!card) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 66 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "var(--text)" }}><span style={{ color: "var(--accent)" }}>{icon}</span>{title}</div>
        <div style={{ width: 60 }} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", gap: 16 }}>
        <div style={{ fontSize: 36, opacity: 0.3 }}>{icon}</div>
        <p style={{ color: "var(--text-subtle)", lineHeight: 1.9 }}>{emptyMsg}</p>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 66 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "var(--text)" }}><span style={{ color: "var(--accent)" }}>{icon}</span>{title}</div>
        <div style={{ fontSize: 11, color: "rgba(46,107,230,0.55)", letterSpacing: 1 }}>{done}/{total}</div>
      </div>

      <div style={{ height: 3, background: "var(--border)" }}>
        <div style={{ height: "100%", background: "linear-gradient(to right, var(--accent), var(--accent-light))", width: `${total > 0 ? (done / total) * 100 : 0}%`, transition: "width 0.3s" }} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", gap: 20 }}>
        <div style={{ fontSize: 10, color: "rgba(46,107,230,0.45)", letterSpacing: 2, textTransform: "uppercase" }}>
          {isFromBank ? `Repetisjon · niv. ${card.level}` : "Nytt ord"}
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "32px 40px", textAlign: "center", width: "100%", maxWidth: 340, boxShadow: "var(--shadow-md)" }}>
          {isReverse ? (
            <>
              <div style={{ fontSize: 11, color: "rgba(46,107,230,0.55)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Oversett til fransk</div>
              <div style={{ fontSize: 34, color: "var(--text)", marginBottom: 8, fontFamily: "var(--font-display)" }}>{card.no}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 11, color: "rgba(46,107,230,0.55)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Hva betyr dette på norsk?</div>
              <div style={{ fontSize: 34, color: "var(--text)", fontStyle: "italic", marginBottom: 8, fontFamily: "var(--font-display)" }}>{card.fr}</div>
              {card.phonetic && <div style={{ fontSize: 14, color: "var(--accent)", opacity: 0.7, marginBottom: 8 }}>({card.phonetic})</div>}
              <div style={{ display: "flex", gap: 16, marginTop: 4, justifyContent: "center" }}>
                <button onClick={() => speak(card.fr)} title="Normal hastighet" style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: speaking ? "var(--accent)" : "rgba(46,107,230,0.45)", lineHeight: 1 }}>🔊</button>
                <button onClick={() => speak(card.fr, 0.4)} title="Sakte" style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: speaking ? "var(--accent)" : "rgba(46,107,230,0.45)", lineHeight: 1 }}>🐢</button>
              </div>
            </>
          )}
        </div>

        {!checked ? (
          mode === "choice" ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", maxWidth: 340 }}>
                {options.map((opt, i) => (
                  <button key={i} onClick={() => setInput(opt)}
                    style={{ background: input === opt ? "var(--accent-bg)" : "var(--surface)", border: `${input === opt ? 2 : 1}px solid ${input === opt ? "var(--accent)" : "var(--border)"}`, borderRadius: 14, padding: "16px 10px", cursor: "pointer", color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.3, textAlign: "center", transition: "all 0.15s ease" }}>
                    {opt}
                  </button>
                ))}
              </div>
              <button onClick={onSubmit} disabled={!input.trim()} className={input.trim() ? "btn-shine" : ""}
                style={{ background: input.trim() ? "linear-gradient(135deg, var(--accent), var(--accent-light))" : "var(--accent-bg)", border: "none", borderRadius: 14, color: input.trim() ? "white" : "var(--text-subtle)", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 15, padding: "16px", cursor: input.trim() ? "pointer" : "default", width: "100%", maxWidth: 340 }}>
                Bekreft svar
              </button>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 340 }}>
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && onSubmit()}
                onFocus={handleInputFocus}
                placeholder={isReverse ? "Skriv på fransk..." : "Skriv norsk oversettelse..."}
                className="input-glow"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 16, padding: "14px 16px", outline: "none", textAlign: "center" }}
                autoFocus />
              <button onClick={onSubmit} disabled={!input.trim()} className={input.trim() ? "btn-shine" : ""}
                style={{ background: input.trim() ? "linear-gradient(135deg, var(--accent), var(--accent-light))" : "var(--accent-bg)", border: "none", borderRadius: 14, color: input.trim() ? "white" : "var(--text-subtle)", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 15, padding: "14px", cursor: input.trim() ? "pointer" : "default" }}>
                Sjekk svar
              </button>
            </div>
          )
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 340, alignItems: "center" }}>
            {result === "correct" && (
              <div style={{ background: "rgba(0,184,148,0.10)", border: "1px solid rgba(0,184,148,0.35)", borderRadius: 12, padding: "16px 24px", textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: 16, color: "var(--color-success)", fontWeight: "bold" }}>✓ Riktig!</div>
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
              </div>
            )}
            {result === "wrong" && (
              <>
                <div style={{ background: "rgba(225,112,85,0.08)", border: "1px solid rgba(225,112,85,0.3)", borderRadius: 12, padding: "16px 24px", textAlign: "center", width: "100%" }}>
                  <div style={{ fontSize: 16, color: "var(--color-error)", fontWeight: "bold", marginBottom: 6 }}>Prøv igjen neste gang</div>
                  <div style={{ fontSize: 13, color: "var(--text-subtle)", marginBottom: 6 }}>Du svarte: <em>{input}</em></div>
                  <div style={{ fontSize: 18, color: "var(--text)", marginBottom: 4 }}>{isReverse ? card.fr : card.no}</div>
                  {card.phonetic && <div style={{ fontSize: 13, color: "var(--accent)", opacity: 0.8, marginBottom: 6 }}>({card.phonetic})</div>}
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 4 }}>
                    <button onClick={() => speak(card.fr)} style={{ background: "none", border: "none", color: "rgba(46,107,230,0.55)", fontSize: 18, cursor: "pointer" }}>🔊</button>
                    <button onClick={() => speak(card.fr, 0.4)} style={{ background: "none", border: "none", color: "rgba(46,107,230,0.55)", fontSize: 18, cursor: "pointer" }}>🐢</button>
                  </div>
                </div>
                {grammarTip && (
                  <div style={{ background: "rgba(46,107,230,0.05)", border: "1px solid rgba(46,107,230,0.15)", borderRadius: 12, padding: "12px 16px", width: "100%" }}>
                    <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Huskeregel — {grammarTip.title}</div>
                    <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.65 }}>{grammarTip.description}</div>
                  </div>
                )}
              </>
            )}
            <button onClick={onNext} className="btn-shine"
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
  );
}
