import { gold, dark, cream, card as cardBg, brd, grn, red } from "../constants.js";
import BottomNav from "./BottomNav.jsx";

// Shared screen for Dagens øvelse – glose AND Daglig grammatikk
export default function DagensExerciseScreen({
  title, icon,
  phase,          // 0=intro(grammar), 1, 2, 3=done
  topic,          // grammar topic object (null for glose)
  dailyWords,     // words for this session
  queue,
  card,
  input, setInput,
  checked, result, stats,
  onStartExercise,
  onSubmit, onNext,
  onBack,
  speak, speaking,
  screen, showWords, onNav,
}) {
  const isReverse = card?.reverse;
  const totalCards = queue.length + stats.correct + stats.wrong;
  const done = stats.correct + stats.wrong;

  // --- Intro screen (grammar only) ---
  if (phase === 0 && topic) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#f5f0e6", fontFamily: "'Jost', sans-serif", color: cream, paddingBottom: 66 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${brd}`, background: cardBg, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: gold, fontSize: 14, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>← Tilbake</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, letterSpacing: 2 }}>
          <span style={{ color: gold }}>{icon}</span>{title}
        </div>
        <div style={{ width: 60 }} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", gap: 20, textAlign: "center" }}>
        <div style={{ fontSize: 11, color: `${gold}88`, letterSpacing: 3, textTransform: "uppercase" }}>Dagens tema</div>
        <div style={{ fontSize: 28, color: gold, fontStyle: "italic", fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1.3 }}>{topic.title}</div>
        <div style={{ fontSize: 14, color: `${cream}88`, fontStyle: "italic" }}>{topic.subtitle}</div>
        <div style={{ background: cardBg, border: `1px solid ${brd}`, borderRadius: 16, padding: "20px 24px", maxWidth: 340, width: "100%", fontSize: 14, color: cream, lineHeight: 1.7 }}>
          {topic.description}
        </div>
        <div style={{ background: cardBg, border: `1px solid ${brd}`, borderRadius: 12, padding: "14px 20px", maxWidth: 340, width: "100%" }}>
          {topic.pairs.slice(0, 3).map((p, i) => (
            <div key={i} style={{ fontSize: 13, display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: i < 2 ? `1px solid ${brd}` : "none" }}>
              <span style={{ fontStyle: "italic", color: gold }}>{p.fr}</span>
              <span style={{ color: `${cream}88` }}>{p.no}</span>
            </div>
          ))}
          {topic.pairs.length > 3 && <div style={{ fontSize: 11, color: `${cream}44`, marginTop: 6, textAlign: "center" }}>+ {topic.pairs.length - 3} til</div>}
        </div>
        <button onClick={onStartExercise} className="btn-shine"
          style={{ background: `linear-gradient(135deg, #d98a4a, ${gold})`, border: "none", borderRadius: 14, color: dark, fontFamily: "'Jost', sans-serif", fontWeight: "500", fontSize: 16, padding: "16px 48px", cursor: "pointer", marginTop: 8 }}>
          Start øvelsen →
        </button>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  // --- Done screen ---
  if (phase === 3) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#f5f0e6", fontFamily: "'Jost', sans-serif", color: cream, paddingBottom: 66 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${brd}`, background: cardBg }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: gold, fontSize: 14, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>← Tilbake</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, letterSpacing: 2 }}><span style={{ color: gold }}>{icon}</span>{title}</div>
        <div style={{ fontSize: 11, color: `${gold}88`, letterSpacing: 1 }}>Fullført ✦</div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", gap: 20, textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>✦</div>
        <div style={{ fontSize: 22, color: gold, fontStyle: "italic" }}>{topic ? `${topic.title} — ferdig!` : "Dagens øvelse fullført!"}</div>
        <div style={{ fontSize: 14, color: `${cream}88`, lineHeight: 1.8 }}>
          {topic ? "Alle par er lagt til i grammatikkøvelsen din." : `Du har øvd på ${dailyWords.length} ord i begge retninger.\nKom tilbake i morgen for 5 nye ord.`}
        </div>
        <div style={{ background: cardBg, border: `1px solid ${brd}`, borderRadius: 12, padding: "16px 24px", marginTop: 8, maxWidth: 340, width: "100%" }}>
          {(topic ? topic.pairs : dailyWords).map((w, i) => (
            <div key={i} style={{ fontSize: 14, color: cream, padding: "4px 0", borderBottom: i < (topic ? topic.pairs : dailyWords).length - 1 ? `1px solid ${brd}` : "none" }}>
              <span style={{ color: grn }}>✓</span> <strong>{w.fr}</strong> = {w.no}
              {w.phonetic && <span style={{ color: `${gold}88`, fontSize: 12 }}> ({w.phonetic})</span>}
            </div>
          ))}
        </div>
        <button onClick={onBack} className="btn-shine"
          style={{ background: `linear-gradient(135deg, #d98a4a, ${gold})`, border: "none", borderRadius: 14, color: dark, fontFamily: "'Jost', sans-serif", fontWeight: "500", fontSize: 15, padding: "14px 40px", cursor: "pointer", marginTop: 8 }}>
          Tilbake til hjem
        </button>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  // --- Exercise screen (phase 1 or 2) ---
  const phaseLabel = phase === 1
    ? "Del 1 — gjenkjenning (fr → no)"
    : "Del 2 — produksjon (no → fr)";
  const prompt = isReverse ? card?.no : card?.fr;
  const phonetic = !isReverse && card?.phonetic;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#f5f0e6", fontFamily: "'Jost', sans-serif", color: cream, paddingBottom: 66 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${brd}`, background: cardBg }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: gold, fontSize: 14, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>← Tilbake</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, letterSpacing: 2 }}><span style={{ color: gold }}>{icon}</span>{title}</div>
        <div style={{ fontSize: 11, color: `${gold}88`, letterSpacing: 1 }}>{done}/{totalCards}</div>
      </div>
      <div style={{ height: 3, background: brd }}>
        <div style={{ height: "100%", background: gold, width: `${totalCards > 0 ? (done / totalCards) * 100 : 0}%`, transition: "width 0.3s" }} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", gap: 20 }}>
        <div style={{ fontSize: 10, color: `${gold}66`, letterSpacing: 2, textTransform: "uppercase", textAlign: "center" }}>{phaseLabel}</div>

        <div style={{ background: cardBg, border: `1px solid ${brd}`, borderRadius: 16, padding: "28px 36px", textAlign: "center", width: "100%", maxWidth: 340 }}>
          <div style={{ fontSize: 11, color: `${gold}88`, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
            {isReverse ? "Skriv på fransk:" : "Hva betyr dette?"}
          </div>
          <div style={{ fontSize: 32, color: cream, fontStyle: isReverse ? "normal" : "italic", marginBottom: 8, fontFamily: isReverse ? "'Jost', sans-serif" : "'Playfair Display', Georgia, serif" }}>
            {prompt}
          </div>
          {phonetic && <div style={{ fontSize: 14, color: gold, opacity: 0.7, marginBottom: 8 }}>({phonetic})</div>}
          {!isReverse && (
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => speak(card.fr)} style={{ background: "none", border: "none", color: speaking ? gold : `${gold}66`, fontSize: 20, cursor: "pointer" }}>🔊</button>
              <button onClick={() => speak(card.fr, 0.4)} style={{ background: "none", border: "none", color: speaking ? gold : `${gold}66`, fontSize: 20, cursor: "pointer" }}>🐢</button>
            </div>
          )}
        </div>

        {!checked ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 340 }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onSubmit()}
              placeholder={isReverse ? "Skriv det franske ordet..." : "Skriv norsk oversettelse..."}
              className="input-glow"
              style={{ background: "#f5f0e6", border: `0.5px solid ${brd}`, borderRadius: 10, color: cream, fontFamily: "'Jost', sans-serif", fontSize: 16, padding: "14px 16px", outline: "none", textAlign: "center" }}
              autoFocus />
            <button onClick={onSubmit} disabled={!input.trim()} className={input.trim() ? "btn-shine" : ""}
              style={{ background: input.trim() ? `linear-gradient(135deg, #d98a4a, ${gold})` : "rgba(200,120,58,0.25)", border: "none", borderRadius: 14, color: dark, fontFamily: "'Jost', sans-serif", fontWeight: "500", fontSize: 15, padding: "14px", cursor: input.trim() ? "pointer" : "default" }}>
              Sjekk svar
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 340, alignItems: "center" }}>
            {result === "correct" && (
              <div style={{ background: "rgba(76,175,122,0.12)", border: `1px solid ${grn}55`, borderRadius: 12, padding: "14px 20px", textAlign: "center", width: "100%", fontSize: 16, color: grn, fontWeight: "bold" }}>✓ Riktig!</div>
            )}
            {result === "close" && (
              <div style={{ background: "rgba(201,168,76,0.1)", border: `1px solid ${gold}55`, borderRadius: 12, padding: "14px 20px", textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: 15, color: gold, fontWeight: "bold", marginBottom: 4 }}>~ Nesten!</div>
                <div style={{ fontSize: 13, color: `${cream}88`, marginBottom: 4 }}>Du svarte: <em>{input}</em></div>
                <div style={{ fontSize: 14, color: cream }}>Riktig: <strong>{isReverse ? card.fr : card.no}</strong></div>
                {card.phonetic && <div style={{ fontSize: 12, color: `${gold}88`, marginTop: 4 }}>{card.phonetic}</div>}
              </div>
            )}
            {result === "wrong" && (
              <>
                <div style={{ background: "rgba(196,122,90,0.1)", border: `1px solid ${red}55`, borderRadius: 12, padding: "14px 20px", textAlign: "center", width: "100%" }}>
                  <div style={{ fontSize: 14, color: red, marginBottom: 6 }}>Prøv igjen — riktig svar:</div>
                  <div style={{ fontSize: 13, color: `${cream}88`, marginBottom: 4 }}>Du svarte: <em>{input}</em></div>
                  <div style={{ fontSize: 18, color: cream, fontWeight: "bold" }}>{isReverse ? card.fr : card.no}</div>
                  {card.phonetic && <div style={{ fontSize: 13, color: gold, marginTop: 4 }}>({card.phonetic})</div>}
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8 }}>
                    <button onClick={() => speak(card.fr)} style={{ background: "none", border: "none", color: `${gold}88`, fontSize: 18, cursor: "pointer" }}>🔊</button>
                    <button onClick={() => speak(card.fr, 0.4)} style={{ background: "none", border: "none", color: `${gold}88`, fontSize: 18, cursor: "pointer" }}>🐢</button>
                  </div>
                </div>
                {topic && (
                  <div style={{ background: `rgba(200,120,58,0.07)`, border: `1px solid ${gold}33`, borderRadius: 12, padding: "12px 16px", width: "100%" }}>
                    <div style={{ fontSize: 10, color: gold, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Huskeregel</div>
                    <div style={{ fontSize: 13, color: cream, lineHeight: 1.65 }}>{topic.description}</div>
                  </div>
                )}
              </>
            )}
            <button onClick={onNext} className="btn-shine"
              style={{ background: `linear-gradient(135deg, #d98a4a, ${gold})`, border: "none", borderRadius: 14, color: dark, fontFamily: "'Jost', sans-serif", fontWeight: "500", fontSize: 15, padding: "14px 40px", cursor: "pointer" }}>
              {queue.length <= 1 && phase === 2 ? "Fullfør!" : queue.length <= 1 ? "Del 2 →" : result === "wrong" ? "Prøv igjen →" : "Neste →"}
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
          {Array.from({ length: Math.min(totalCards, 20) }).map((_, i) => (
            <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: i < stats.correct ? grn : i < done ? red : brd }} />
          ))}
        </div>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}
