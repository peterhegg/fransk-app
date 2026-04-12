import { gold, dark, cream, card, red } from "../constants.js";
import { EXIT_PHRASES } from "../constants.js";

export default function ExitDialog({ phraseIdx, onStay, onExit }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: card, border: `1px solid ${gold}55`, borderRadius: 20, padding: "32px 28px", maxWidth: 320, width: "100%", textAlign: "center", boxShadow: "0 8px 40px rgba(0,0,0,0.3)" }}>
        <div style={{ fontSize: 28, marginBottom: 12 }}>🗼</div>
        <div style={{ fontSize: 17, color: cream, lineHeight: 1.5, marginBottom: 24, fontStyle: phraseIdx % 2 === 1 ? "italic" : "normal" }}>
          {EXIT_PHRASES[phraseIdx]}
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={onStay} className="btn-shine"
            style={{ background: `linear-gradient(135deg, #d98a4a, ${gold})`, border: "none", borderRadius: 14, color: dark, fontFamily: "'Jost', sans-serif", fontWeight: "500", fontSize: 15, padding: "12px 24px", cursor: "pointer" }}>
            Bli værende
          </button>
          <button onClick={onExit}
            style={{ background: "none", border: `1px solid ${red}55`, borderRadius: 14, color: red, fontFamily: "'Jost', sans-serif", fontSize: 15, padding: "12px 24px", cursor: "pointer" }}>
            Avslutt
          </button>
        </div>
      </div>
    </div>
  );
}
