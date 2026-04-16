export default function BottomNav({ screen, showWords, onNav }) {
  const tabs = [
    { id: "home",  label: "Hjem",    emoji: "⌂" },
    { id: "glose", label: "Øv",      emoji: "◈" },
    { id: "fri",   label: "Snakk",   emoji: "◉" },
    { id: "words", label: "Ordbank", emoji: "◎" },
  ];

  const activeId = showWords ? "words"
    : screen === "home" ? "home"
    : (screen === "glose" || screen === "dagens-glose" || screen === "dagens-grammatikk" || screen === "grammatikk-ovelse") ? "glose"
    : screen === "chat" ? "fri"
    : null;

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 84, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", padding: "0 16px 16px", gap: 4, zIndex: 200 }}>
      {tabs.map(t => {
        const active = activeId === t.id;
        if (t.id === "home") {
          return (
            <button key={t.id} onClick={() => onNav(t.id)}
              style={{ flex: active ? 1.6 : 1, height: 48, background: active ? "var(--accent)" : "transparent", borderRadius: 16, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: active ? 8 : 0, fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, color: active ? "white" : "var(--text-subtle)", boxShadow: active ? "0 4px 16px rgba(108,92,231,0.30)" : "none", transition: "all 0.2s ease" }}>
              <span style={{ fontSize: 18 }}>{t.emoji}</span>
              {active && <span>{t.label}</span>}
            </button>
          );
        }
        return (
          <button key={t.id} onClick={() => onNav(t.id)}
            style={{ flex: 1, height: 48, background: active ? "var(--accent-bg)" : "none", borderRadius: 14, border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, fontFamily: "var(--font-body)", transition: "background 0.15s" }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>{t.emoji}</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: active ? "var(--accent)" : "var(--text-subtle)", letterSpacing: "0.3px" }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
