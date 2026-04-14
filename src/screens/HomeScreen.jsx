import { MODES, DAGENS_GLOSE_KEY, GRAMMAR_TOPICS, VOCAB_GOALS, gold, dark, cream, card, brd, grn } from "../constants.js";
import { todayStr, getDue, loadGrammarProgress, getMasteredCount, loadAnswerCount } from "../utils.jsx";
import BottomNav from "../components/BottomNav.jsx";
import OrdmesterTeller from "../components/OrdmesterTeller.jsx";

export default function HomeScreen({ words, grammarWords, streak, sessionMsgs, onStart, noWordsMsg, isOnline, offlineBanner, screen, showWords, onNav, onShowWords }) {
  const answerCount = loadAnswerCount();
  const dueCount = getDue(words, answerCount).length;
  const masteredCount = getMasteredCount(words);

  const dagensDone = (() => {
    try { const s = JSON.parse(localStorage.getItem(DAGENS_GLOSE_KEY) || "{}"); return s.date === todayStr() && s.phase2done; }
    catch { return false; }
  })();

  const completedGrammar = loadGrammarProgress();
  const grammarDone = completedGrammar.length >= GRAMMAR_TOPICS.length;
  const grammarProgress = `${completedGrammar.length}/${GRAMMAR_TOPICS.length}`;

  const grammarOvDue = getDue(grammarWords, answerCount).length;

  const modeColors = {
    "dagens-glose": "#7a4828",
    glose: "#3d5a35",
    "dagens-grammatikk": "#2a4848",
    "grammatikk-ovelse": "#384060",
    teksthjelp: "#4a5828",
    fri: "#7a3828",
  };

  return (
    <div style={{ height: "100dvh", background: "#f5f0e6", color: cream, fontFamily: "'Jost', sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ width: "100%", height: 4, background: "linear-gradient(to right, #002395 33.33%, #ffffff 33.33%, #ffffff 66.66%, #ED2939 66.66%)" }} />
        {offlineBanner}
        <div style={{ width: "100%", background: "linear-gradient(150deg, #c8935a 0%, #7a3e18 100%)", padding: "52px 16px 44px", textAlign: "center", color: "white" }}>
          <div style={{ fontSize: 11, letterSpacing: 7, marginBottom: 18, opacity: 0.75, textTransform: "uppercase", fontWeight: 300 }}>Paris · Aujourd'hui</div>
          <h1 style={{ fontSize: 48, fontWeight: "normal", letterSpacing: 5, color: "white", margin: "0 0 8px", fontStyle: "italic", fontFamily: "'Playfair Display', Georgia, serif" }}>Mon Français</h1>
          <p style={{ fontSize: 12, letterSpacing: 4, textTransform: "uppercase", margin: 0, opacity: 0.8, fontWeight: 300 }}>Lær fransk på din måte</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 80px", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", background: card, border: `0.5px solid ${brd}`, borderRadius: 18, padding: "12px 24px", marginBottom: 24, gap: 0, width: "100%", maxWidth: 420, marginTop: 24, boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
          <button onClick={onShowWords} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "center", flex: 1, padding: 0 }}>
            <div style={{ fontSize: 26, color: gold, fontStyle: "italic" }}>{words.length}</div>
            <div style={{ fontSize: 11, color: "rgba(29,22,16,0.45)", letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>ord lært</div>
          </button>
          <div style={{ width: 1, height: 36, background: brd }} />
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontSize: 26, color: gold, fontStyle: "italic" }}>{streak}</div>
            <div style={{ fontSize: 11, color: "rgba(29,22,16,0.45)", letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>🔥 dager</div>
          </div>
          <div style={{ width: 1, height: 36, background: brd }} />
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ fontSize: 26, color: gold, fontStyle: "italic" }}>{sessionMsgs}</div>
            <div style={{ fontSize: 11, color: "rgba(29,22,16,0.45)", letterSpacing: 1, textTransform: "uppercase", marginTop: 2 }}>svar i dag</div>
          </div>
        </div>

        <div className="fade-stagger" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", maxWidth: 420, marginBottom: 20 }}>
          {MODES.map((m, idx) => {
            const bg = modeColors[m.id] || gold;
            let badge = null;
            if (m.id === "glose" && dueCount > 0) badge = dueCount;
            if (m.id === "dagens-glose" && dagensDone) badge = "✓";
            if (m.id === "dagens-grammatikk") badge = grammarDone ? "✓" : grammarProgress;
            if (m.id === "grammatikk-ovelse" && grammarOvDue > 0) badge = grammarOvDue;
            return (
              <button key={m.id} onClick={() => onStart(m.id)}
                className="mode-card-hover btn-shine"
                style={{ background: bg, border: "none", borderRadius: 18, padding: "20px 16px 18px", cursor: "pointer", textAlign: "left", color: "white", fontFamily: "'Jost', sans-serif", outline: "none", display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start", position: "relative", boxShadow: "0 6px 24px rgba(0,0,0,0.18)", minHeight: 132, gridColumn: idx === MODES.length - 1 && MODES.length % 2 !== 0 ? "1 / -1" : undefined }}>
                <div style={{ fontSize: 22, lineHeight: 1, opacity: 0.65, marginBottom: 2 }}>{m.icon}</div>
                <div style={{ fontSize: 17, fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", fontWeight: "normal", lineHeight: 1.2, flex: 1 }}>{m.label}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.4, fontWeight: 300, marginTop: 2 }}>{m.desc}</div>
                {badge !== null && (
                  <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(255,255,255,0.25)", color: "white", borderRadius: 10, fontSize: 10, fontWeight: "bold", padding: "2px 7px" }}>
                    {badge}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {noWordsMsg && (
          <div style={{ color: `${cream}88`, fontSize: 13, textAlign: "center", marginBottom: 12 }}>
            Alle ord er mestret! Kom tilbake i morgen for neste runde.
          </div>
        )}

        <OrdmesterTeller masteredCount={masteredCount} />

        {/* Vocabulary goals progression */}
        {(() => {
          const cumTargets = VOCAB_GOALS.reduce((acc, g, i) => {
            acc.push((acc[i - 1] || 0) + g.target);
            return acc;
          }, []);
          const activeIdx = cumTargets.findIndex(t => words.length < t);
          const idx = activeIdx === -1 ? VOCAB_GOALS.length - 1 : activeIdx;
          const activeGoal = VOCAB_GOALS[idx];
          const prevTotal = idx === 0 ? 0 : cumTargets[idx - 1];
          const goalTotal = cumTargets[idx];
          const pct = Math.min(100, ((words.length - prevTotal) / (goalTotal - prevTotal)) * 100);
          const completedCount = activeIdx === -1 ? VOCAB_GOALS.length : activeIdx;
          // Show up to 3 upcoming bolks
          const upcoming = VOCAB_GOALS.slice(idx + 1, idx + 4);
          return (
            <div style={{ width: "100%", maxWidth: 420, marginTop: 16, background: card, border: `0.5px solid ${brd}`, borderRadius: 14, padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 11, letterSpacing: 2, color: `${gold}99`, textTransform: "uppercase" }}>Læringsmål</span>
                <span style={{ fontSize: 11, color: `rgba(29,22,16,0.4)` }}>Bolk {idx + 1} av {VOCAB_GOALS.length}</span>
              </div>
              <div style={{ fontSize: 14, color: cream, marginBottom: 3, fontStyle: "italic", fontFamily: "'Playfair Display', Georgia, serif" }}>{activeGoal.label}</div>
              <div style={{ fontSize: 11, color: `rgba(29,22,16,0.5)`, marginBottom: 10, lineHeight: 1.5 }}>{activeGoal.desc}</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: `rgba(29,22,16,0.4)`, marginBottom: 4 }}>
                <span>{words.length - prevTotal} / {goalTotal - prevTotal} ord i bolken</span>
                <span>{completedCount} bolker fullført</span>
              </div>
              <div style={{ height: 5, background: "rgba(200,120,58,0.12)", borderRadius: 99, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(to right, #c8783a, #e8a060)`, borderRadius: 99, transition: "width 0.8s ease" }} />
              </div>
              {upcoming.length > 0 && (
                <div style={{ borderTop: `0.5px solid ${brd}`, paddingTop: 8 }}>
                  <div style={{ fontSize: 10, color: `rgba(29,22,16,0.35)`, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Neste bolker</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {upcoming.map((g, i) => (
                      <div key={g.id} style={{ fontSize: 11, color: `rgba(29,22,16,0.4)`, display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ color: `${gold}44`, fontSize: 9 }}>◆</span>
                        <span>{g.label}</span>
                        <span style={{ color: `rgba(29,22,16,0.25)`, fontSize: 10 }}>— {g.target} ord</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}
