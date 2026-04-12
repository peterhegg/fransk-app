import { gold, brd, cream } from "../constants.js";

export default function BottomNav({ screen, showWords, onNav }) {
  const tabs = [
    { id: "home",  label: "Hjem",    sym: "⌂" },
    { id: "glose", label: "Øv",      sym: "◈" },
    { id: "fri",   label: "Snakk",   sym: "◉" },
    { id: "words", label: "Ordbank", sym: "◎" },
  ];

  const activeId = showWords ? "words"
    : screen === "home" ? "home"
    : (screen === "glose" || screen === "dagens-glose" || screen === "dagens-grammatikk" || screen === "grammatikk-ovelse") ? "glose"
    : screen === "chat-fri" ? "fri"
    : null;

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#ffffff", borderTop: `0.5px solid ${brd}`, display: "flex", alignItems: "stretch", height: 66, zIndex: 200, boxShadow: "0 -4px 20px rgba(0,0,0,0.06)" }}>
      {tabs.map(t => {
        const active = activeId === t.id;
        return (
          <button key={t.id} onClick={() => onNav(t.id)}
            style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, color: active ? gold : "rgba(26,18,16,0.3)", fontFamily: "'Jost', sans-serif", padding: "8px 4px", transition: "color 0.2s ease" }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>{t.sym}</span>
            <span style={{ fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: active ? "500" : "400" }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
