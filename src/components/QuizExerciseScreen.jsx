import { gold, dark, cream, card as cardBg, brd, grn, red, GRAMMAR_TOPICS } from "../constants.js";
import BottomNav from "./BottomNav.jsx";

// Shared screen for Gloseøvelse AND Grammatikkøvelse
export default function QuizExerciseScreen({
  title, icon, emptyMsg,
  queue, card, input, setInput, checked, result, stats, options, mode,
  onSubmit, onNext, onBack,
  speak, speaking,
  screen, showWords, onNav,
  wordsCount,
}) {
  const total = stats.correct + stats.wrong + queue.length;
  const done = stats.correct + stats.wrong;
  const isFromBank = !!card?.id;
  const grammarTip = card?.topicId ? GRAMMAR_TOPICS.find(t => t.id === card.topicId) : null;

  if (!card) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#f5f0e6", fontFamily: "'Jost', sans-serif", color: cream, paddingBottom: 66 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${brd}`, background: cardBg }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: gold, fontSize: 14, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>← Tilbake</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, letterSpacing: 2 }}><span style={{ color: gold }}>{icon}</span>{title}</div>
        <div style={{ width: 60 }} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", gap: 16 }}>
        <div style={{ fontSize: 36, opacity: 0.3 }}>{icon}</div>
        <p style={{ color: `rgba(29,22,16,0.4)`, lineHeight: 1.9 }}>{emptyMsg}</p>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#f5f0e6", fontFamily: "'Jost', sans-serif", color: cream, paddingBottom: 66 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${brd}`, background: "#fff", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: gold, fontSize: 14, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>← Tilbake</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, letterSpacing: 2 }}><span style={{ color: gold }}>{icon}</span>{title}</div>
        <div style={{ fontSize: 11, color: `${gold}88`, letterSpacing: 1 }}>{done}/{total}</div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", gap: 20 }}>
        <div style={{ fontSize: 10, color: `${gold}55`, letterSpacing: 2, textTransform: "uppercase" }}>
          {isFromBank ? `Repetisjon · niv. ${card.level}` : "Nytt ord"}
        </div>

        <div style={{ background: "#fff", border: `1px solid ${brd}`, borderRadius: 16, padding: "32px 40px", textAlign: "center", width: "100%", maxWidth: 340 }}>
          <div style={{ fontSize: 11, color: `${gold}88`, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Hva betyr dette på norsk?</div>
          <div style={{ fontSize: 34, color: cream, fontStyle: "italic", marginBottom: 8, fontFamily: "'Playfair Display', Georgia, serif" }}>{card.fr}</div>
          {card.phonetic && <div style={{ fontSize: 14, color: gold, opacity: 0.7, marginBottom: 8 }}>({card.phonetic})</div>}
          <div style={{ display: "flex", gap: 16, marginTop: 4, justifyContent: "center" }}>
            <button onClick={() => speak(card.fr)} title="Normal hastighet" style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: speaking ? gold : `${gold}88`, lineHeight: 1 }}>🔊</button>
            <button onClick={() => speak(card.fr, 0.4)} title="Sakte" style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: speaking ? gold : `${gold}88`, lineHeight: 1 }}>🐢</button>
          </div>
        </div>

        {!checked ? (
          mode === "choice" ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", maxWidth: 340 }}>
                {options.map((opt, i) => (
                  <button key={i} onClick={() => setInput(opt)}
                    style={{ background: input === opt ? "rgba(200,120,58,0.12)" : "#fff", border: `${input === opt ? 2 : 1}px solid ${input === opt ? gold : brd}`, borderRadius: 14, padding: "16px 10px", cursor: "pointer", color: cream, fontFamily: "'Jost', sans-serif", fontSize: 14, lineHeight: 1.3, textAlign: "center", transition: "all 0.15s ease" }}>
                    {opt}
                  </button>
                ))}
              </div>
              <button onClick={onSubmit} disabled={!input.trim()} className={input.trim() ? "btn-shine" : ""}
                style={{ background: input.trim() ? `linear-gradient(135deg, #d98a4a, ${gold})` : "rgba(200,120,58,0.2)", border: "none", borderRadius: 14, color: input.trim() ? dark : `${cream}55`, fontFamily: "'Jost', sans-serif", fontWeight: "500", fontSize: 15, padding: "16px", cursor: input.trim() ? "pointer" : "default", width: "100%", maxWidth: 340 }}>
                Bekreft svar
              </button>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 340 }}>
              <input value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && onSubmit()}
                placeholder="Skriv norsk oversettelse..."
                className="input-glow"
                style={{ background: "#f5f0e6", border: `0.5px solid ${brd}`, borderRadius: 10, color: cream, fontFamily: "'Jost', sans-serif", fontSize: 16, padding: "14px 16px", outline: "none", textAlign: "center" }}
                autoFocus />
              <button onClick={onSubmit} disabled={!input.trim()} className={input.trim() ? "btn-shine" : ""}
                style={{ background: input.trim() ? `linear-gradient(135deg, #d98a4a, ${gold})` : "rgba(200,120,58,0.25)", border: "none", borderRadius: 14, color: dark, fontFamily: "'Jost', sans-serif", fontWeight: "500", fontSize: 15, padding: "14px", cursor: input.trim() ? "pointer" : "default" }}>
                Sjekk svar
              </button>
            </div>
          )
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 340, alignItems: "center" }}>
            {result === "correct" && (
              <div style={{ background: "rgba(76,175,122,0.12)", border: `1px solid ${grn}55`, borderRadius: 12, padding: "16px 24px", textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: 16, color: grn, fontWeight: "bold" }}>✓ Riktig!</div>
              </div>
            )}
            {result === "close" && (
              <div style={{ background: "rgba(201,168,76,0.1)", border: `1px solid ${gold}55`, borderRadius: 12, padding: "16px 24px", textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: 16, color: gold, fontWeight: "bold", marginBottom: 6 }}>~ Nesten riktig!</div>
                <div style={{ fontSize: 13, color: `${cream}88`, marginBottom: 4 }}>Du svarte: <em>{input}</em></div>
                <div style={{ fontSize: 15, color: cream }}>Riktig: <strong>{card.no}</strong></div>
                {card.phonetic && <div style={{ fontSize: 13, color: gold, opacity: 0.8, marginTop: 6 }}>{card.phonetic}</div>}
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8 }}>
                  <button onClick={() => speak(card.fr)} style={{ background: "none", border: "none", color: `${gold}88`, fontSize: 18, cursor: "pointer" }}>🔊</button>
                  <button onClick={() => speak(card.fr, 0.4)} style={{ background: "none", border: "none", color: `${gold}88`, fontSize: 18, cursor: "pointer" }}>🐢</button>
                </div>
              </div>
            )}
            {result === "wrong" && (
              <>
                <div style={{ background: "rgba(196,122,90,0.1)", border: `1px solid ${red}55`, borderRadius: 12, padding: "16px 24px", textAlign: "center", width: "100%" }}>
                  <div style={{ fontSize: 16, color: red, fontWeight: "bold", marginBottom: 6 }}>Prøv igjen neste gang</div>
                  <div style={{ fontSize: 13, color: `${cream}66`, marginBottom: 6 }}>Du svarte: <em>{input}</em></div>
                  <div style={{ fontSize: 18, color: cream, marginBottom: 4 }}>{card.no}</div>
                  {card.phonetic && <div style={{ fontSize: 13, color: gold, opacity: 0.8, marginBottom: 6 }}>({card.phonetic})</div>}
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 4 }}>
                    <button onClick={() => speak(card.fr)} style={{ background: "none", border: "none", color: `${gold}88`, fontSize: 18, cursor: "pointer" }}>🔊</button>
                    <button onClick={() => speak(card.fr, 0.4)} style={{ background: "none", border: "none", color: `${gold}88`, fontSize: 18, cursor: "pointer" }}>🐢</button>
                  </div>
                </div>
                {grammarTip && (
                  <div style={{ background: `rgba(200,120,58,0.07)`, border: `1px solid ${gold}33`, borderRadius: 12, padding: "12px 16px", width: "100%" }}>
                    <div style={{ fontSize: 10, color: gold, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Huskeregel — {grammarTip.title}</div>
                    <div style={{ fontSize: 13, color: cream, lineHeight: 1.65 }}>{grammarTip.description}</div>
                  </div>
                )}
              </>
            )}
            <button onClick={onNext} className="btn-shine"
              style={{ background: `linear-gradient(135deg, #d98a4a, ${gold})`, border: "none", borderRadius: 14, color: dark, fontFamily: "'Jost', sans-serif", fontWeight: "500", fontSize: 15, padding: "14px 40px", cursor: "pointer", letterSpacing: 1 }}>
              {queue.length <= 1 ? "Ferdig!" : "Neste ord →"}
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {Array.from({ length: Math.min(total, 20) }).map((_, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i < stats.correct ? grn : i < done ? red : brd }} />
          ))}
        </div>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}
