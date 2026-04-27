import { useState, useEffect } from "react";

export default function BottomNav({ screen, showWords, onNav }) {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    // interactive-widget=resizes-content means both innerHeight and
    // visualViewport.height shrink together — screen.height is the only
    // stable baseline (physical pixels, never changes).
    const check = () => {
      const h = window.visualViewport?.height ?? window.innerHeight;
      setKeyboardOpen(h < window.screen.height * 0.75);
    };
    window.addEventListener("resize", check);
    window.visualViewport?.addEventListener("resize", check);
    return () => {
      window.removeEventListener("resize", check);
      window.visualViewport?.removeEventListener("resize", check);
    };
  }, []);

  if (keyboardOpen) return null;
  const tabs = [
    { id: "home",  label: "Hjem",    emoji: "⌂" },
    { id: "glose", label: "Øv",      emoji: "◈" },
    { id: "fri",   label: "Snakk",   emoji: "◉" },
    { id: "words", label: "Ordbank", emoji: "◎" },
  ];

  const GLOSE_SCREENS = new Set(["glose", "ordoversettelse", "flervalg", "si-ordet", "dagens-glose", "dagens-grammatikk", "grammatikk-ovelse", "oversett-grammatikken", "grammatikk-flervalg", "oversett-setningen"]);
  const activeId = showWords ? "words"
    : screen === "home" ? "home"
    : GLOSE_SCREENS.has(screen) ? "glose"
    : (screen === "chat" || screen === "voice") ? "fri"
    : null;

  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 84, background: "var(--nav-bg)", backdropFilter: "blur(24px)", boxShadow: "0 -1px 0 var(--border), 0 -8px 32px rgba(0,0,0,0.12)", display: "flex", alignItems: "center", padding: "0 10px 16px", gap: 6, zIndex: 200 }}>
      {tabs.map(t => {
        const active = activeId === t.id;
        return (
          <button key={t.id} onClick={() => onNav(t.id)}
            style={{
              flex: active ? 1.6 : 1,
              height: 48,
              background: active ? "var(--accent)" : "transparent",
              borderRadius: 16,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: active ? 7 : 0,
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 600,
              color: active ? "white" : "rgba(232,237,245,0.75)",
              boxShadow: active ? "0 4px 16px rgba(46,107,230,0.30)" : "none",
              transition: "all 0.22s ease",
              flexDirection: active ? "row" : "column",
            }}>
            <span style={{ fontSize: active ? 18 : 20, lineHeight: 1 }}>{t.emoji}</span>
            {active
              ? <span style={{ fontSize: 14, fontWeight: 600 }}>{t.label}</span>
              : <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.3px", marginTop: 2 }}>{t.label}</span>
            }
          </button>
        );
      })}
    </div>
  );
}
