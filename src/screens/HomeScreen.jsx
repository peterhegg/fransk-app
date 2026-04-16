import { MODES, DAGENS_GLOSE_KEY, GRAMMAR_TOPICS, VOCAB_GOALS } from "../constants.js";
import { todayStr, getDue, loadGrammarProgress, getMasteredCount, loadAnswerCount } from "../utils.jsx";
import BottomNav from "../components/BottomNav.jsx";
import OrdmesterTeller from "../components/OrdmesterTeller.jsx";

const MODE_COLORS = {
  "dagens-glose":      "linear-gradient(135deg, #6C5CE7, #a29bf7)",
  "glose":             "linear-gradient(135deg, #00b894, #55efc4)",
  "dagens-grammatikk": "linear-gradient(135deg, #0984e3, #74b9ff)",
  "grammatikk-ovelse": "linear-gradient(135deg, #5a4fcf, #9b8ff5)",
  "teksthjelp":        "linear-gradient(135deg, #e17055, #fab1a0)",
  "fri":               "linear-gradient(135deg, #f0a500, #ffd166)",
};

const MODE_EMOJI = {
  "dagens-glose": "🗼", "glose": "🃏", "dagens-grammatikk": "📖",
  "grammatikk-ovelse": "✏️", "teksthjelp": "📝", "fri": "💬",
};

function timeGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "God morgen" : h < 17 ? "God ettermiddag" : "God kveld";
}

export default function HomeScreen({ words, grammarWords, streak, sessionMsgs, onStart, noWordsMsg, isOnline, offlineBanner, screen, showWords, onNav }) {
  const answerCount = loadAnswerCount();
  const dueCount = getDue(words, answerCount).length;
  const masteredCount = getMasteredCount(words);

  const dagensDone = (() => {
    try { const s = JSON.parse(localStorage.getItem(DAGENS_GLOSE_KEY) || "{}"); return s.date === todayStr() && s.phase2done; }
    catch { return false; }
  })();

  const completedGrammar = loadGrammarProgress();
  const grammarProgress = `${completedGrammar.length}/${GRAMMAR_TOPICS.length}`;
  const grammarOvDue = getDue(grammarWords, answerCount).length;

  const cumTargets = VOCAB_GOALS.reduce((acc, g, i) => { acc.push((acc[i - 1] || 0) + g.target); return acc; }, []);
  const activeIdx = cumTargets.findIndex(t => words.length < t);
  const idx = activeIdx === -1 ? VOCAB_GOALS.length - 1 : activeIdx;
  const activeGoal = VOCAB_GOALS[idx];
  const prevTotal = idx === 0 ? 0 : cumTargets[idx - 1];
  const goalTotal = cumTargets[idx];
  const pct = Math.min(100, ((words.length - prevTotal) / (goalTotal - prevTotal)) * 100);

  const recCards = [
    {
      id: "dagens-glose",
      emoji: "🗼",
      gradient: "linear-gradient(135deg, #6C5CE7, #a29bf7)",
      title: "Dagens 5 gloser",
      sub: dagensDone ? "Fullført i dag ✓" : "Ny øvelse klar nå",
      badge: dagensDone ? "✓" : null,
      badgeDone: dagensDone,
    },
    {
      id: "glose",
      emoji: "🃏",
      gradient: "linear-gradient(135deg, #00b894, #55efc4)",
      title: "Klar til repetisjon",
      sub: dueCount > 0 ? `${dueCount} ord venter på deg` : "Ingen ord forfalt",
      badge: dueCount > 0 ? dueCount : null,
      badgeDone: false,
    },
    {
      id: "dagens-grammatikk",
      emoji: "📖",
      gradient: "linear-gradient(135deg, #0984e3, #74b9ff)",
      title: "Daglig grammatikk",
      sub: `${grammarProgress} temaer fullført`,
      badge: grammarOvDue > 0 ? grammarOvDue : null,
      badgeDone: false,
    },
  ];

  return (
    <div style={{ height: "100dvh", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-body)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {offlineBanner}

      {/* Scrollable area */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: 84, scrollbarWidth: "none" }}>

        {/* Header */}
        <div style={{ padding: "52px 24px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--text-subtle)", fontWeight: 400, marginBottom: 3 }}>Bonjour, Peter 👋</div>
            <div style={{ fontSize: 26, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.3px" }}>{timeGreeting()}</div>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--accent-light))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "var(--shadow-sm)" }}>
            🇫🇷
          </div>
        </div>

        {/* Search row */}
        <div style={{ padding: "0 24px 20px", display: "flex", gap: 10 }}>
          <div style={{ flex: 1, background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 14, padding: "12px 16px", fontSize: 14, color: "var(--text-subtle)", boxShadow: "var(--shadow-sm)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ opacity: 0.5 }}>🔍</span>
            <span>Søk på ord eller tema…</span>
          </div>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(108,92,231,0.35)", flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 10, padding: "0 24px 28px" }}>
          {[
            { num: words.length, label: "Ord lært" },
            { num: `🔥 ${streak}`, label: "Dager" },
            { num: sessionMsgs, label: "Svar i dag" },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, background: "var(--surface)", borderRadius: 14, padding: "12px 10px", textAlign: "center", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 22, fontWeight: 600, color: "var(--accent)", lineHeight: 1, marginBottom: 3 }}>{s.num}</div>
              <div style={{ fontSize: 10, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Øvelser */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 24px 14px" }}>
          <span style={{ fontSize: 20, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>Øvelser</span>
        </div>

        <div className="fade-stagger" style={{ display: "flex", gap: 14, padding: "0 24px 4px", overflowX: "auto", scrollbarWidth: "none" }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => onStart(m.id)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0, background: "none", border: "none", padding: 0, fontFamily: "var(--font-body)" }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: MODE_COLORS[m.id] || "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, boxShadow: "var(--shadow-md)", transition: "transform 0.18s ease" }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.06)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                {MODE_EMOJI[m.id] || m.icon}
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", textAlign: "center", maxWidth: 72, lineHeight: 1.3 }}>{m.label.split("–")[0].split("–")[0].trim()}</div>
            </button>
          ))}
        </div>

        {/* Anbefalt i dag */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "28px 24px 14px" }}>
          <span style={{ fontSize: 20, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>Anbefalt i dag</span>
        </div>

        <div style={{ display: "flex", gap: 16, padding: "0 24px 4px", overflowX: "auto", scrollbarWidth: "none" }}>
          {recCards.map(c => (
            <button key={c.id} onClick={() => onStart(c.id)}
              style={{ flexShrink: 0, width: 220, background: "var(--surface)", borderRadius: 22, overflow: "hidden", boxShadow: "var(--shadow-md)", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-body)", padding: 0, transition: "transform 0.2s ease" }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
              <div style={{ height: 120, background: c.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, position: "relative" }}>
                {c.emoji}
                {c.badge !== null && (
                  <div style={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: "50%", background: c.badgeDone ? "var(--accent)" : "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: c.badgeDone ? "white" : "var(--accent)", boxShadow: "var(--shadow-sm)" }}>
                    {c.badge}
                  </div>
                )}
              </div>
              <div style={{ padding: "12px 14px 14px" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-subtle)" }}>{c.sub}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Læringsmål */}
        <div style={{ margin: "20px 24px 0", background: "var(--surface)", borderRadius: 20, padding: "18px 20px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-subtle)", fontWeight: 500 }}>Læringsmål</span>
            <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 500 }}>Bolk {idx + 1} av {VOCAB_GOALS.length}</span>
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 16, color: "var(--text)", marginBottom: 12 }}>{activeGoal.label}</div>
          <div style={{ height: 6, background: "var(--accent-bg)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(to right, var(--accent), var(--accent-light))", borderRadius: 99, transition: "width 0.8s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 11, color: "var(--text-subtle)" }}>{words.length - prevTotal} / {goalTotal - prevTotal} ord i bolken</span>
            <span style={{ fontSize: 11, color: "var(--accent)" }}>{Math.round(pct)}%</span>
          </div>
        </div>

        <div style={{ margin: "20px 24px 0", background: "var(--surface)", borderRadius: 20, padding: "18px 20px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}>
          <OrdmesterTeller masteredCount={masteredCount} />
        </div>

        {noWordsMsg && (
          <div style={{ fontSize: 13, color: "var(--text-subtle)", textAlign: "center", margin: "16px 24px 0" }}>
            Alle ord er mestret! Kom tilbake i morgen.
          </div>
        )}

      </div>

      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}
