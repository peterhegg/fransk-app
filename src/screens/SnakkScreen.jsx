import BottomNav from "../components/BottomNav.jsx";
import { IcoArrow } from "../components/Icons.jsx";
import { CONVERSATION_CHOICES } from "../exercises.jsx";
import { brand } from "../content.js";

// Snakk hub — pick a conversation mode with the tutor.
// Top-level nav destination, so it lands on a choice rather than jumping
// straight into the microphone (which made the back button ambiguous).
export default function SnakkScreen({ onStart, ...navProps }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 66 }}>
      <div style={{ padding: "22px 24px 6px", flexShrink: 0 }}>
        <div style={{ fontSize: 9, letterSpacing: 2.4, textTransform: "uppercase", color: "var(--cream)", marginBottom: 4 }}>{brand}</div>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 30, letterSpacing: "-0.5px", color: "var(--text)" }}>Snakk</h1>
        <div style={{ fontSize: 13, color: "var(--text-subtle)", marginTop: 2 }}>Velg hvordan du vil øve</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", display: "flex", flexDirection: "column", gap: 14, paddingTop: 18 }}>
        {CONVERSATION_CHOICES.map(c => (
          <button key={c.id} className="choice-card" onClick={() => onStart(c.id)}>
            <span className="hub-row-icon">
              <c.Icon size={20} stroke="var(--accent)" sw={1.6} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.2px" }}>{c.label}</span>
              <span style={{ display: "block", fontSize: 13, color: "var(--text-subtle)", marginTop: 2, lineHeight: 1.35 }}>{c.sub}</span>
            </span>
            <IcoArrow size={18} stroke="var(--text-muted)" sw={1.5} />
          </button>
        ))}
      </div>

      <BottomNav {...navProps} />
    </div>
  );
}
