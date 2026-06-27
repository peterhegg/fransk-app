import { useState, useEffect } from "react";
import { IcoHome, IcoPractice, IcoChat, IcoBank } from "./Icons.jsx";

export default function BottomNav({ screen, showWords, onNav }) {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
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

  const EXERCISE_SCREENS = new Set([
    "dagens-glose", "glose", "dagens-grammatikk", "grammatikk-ovelse",
    "ordoversettelse", "flervalg", "si-ordet", "oversett-grammatikken",
    "grammatikk-flervalg", "oversett-setningen", "si-setningen", "generert-flervalg",
  ]);
  if (EXERCISE_SCREENS.has(screen) && !showWords) return null;

  const GLOSE_SCREENS = new Set(["glose", "ordoversettelse", "flervalg", "si-ordet", "dagens-glose", "dagens-grammatikk", "grammatikk-ovelse", "oversett-grammatikken", "grammatikk-flervalg", "oversett-setningen"]);
  const activeId = showWords ? "words"
    : screen === "home" ? "home"
    : (screen === "ovelser" || GLOSE_SCREENS.has(screen)) ? "glose"
    : (screen === "snakk" || screen === "chat" || screen === "voice" || screen === "rollespill") ? "fri"
    : null;

  const tabs = [
    { id: "home",  label: "Hjem",    Ico: IcoHome },
    { id: "glose", label: "Øv",      Ico: IcoPractice },
    { id: "fri",   label: "Snakk",   Ico: IcoChat },
    { id: "words", label: "Banken", Ico: IcoBank },
  ];

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      height: 84, background: "var(--nav-bg)", backdropFilter: "blur(24px)",
      boxShadow: "0 -1px 0 var(--border)", display: "flex",
      alignItems: "center", padding: "0 10px 16px", gap: 6, zIndex: 200,
    }}>
      {tabs.map(({ id, label, Ico }) => {
        const active = activeId === id;
        return (
          <button key={id} onClick={() => onNav(id)} style={{
            flex: active ? 1.6 : 1,
            height: 48,
            background: active ? "var(--cream)" : "transparent",
            borderRadius: 16,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: active ? 7 : 0,
            fontFamily: "var(--font-body)",
            fontWeight: 600,
            color: active ? "var(--bg)" : "var(--text-subtle)",
            transition: "all 0.22s ease",
            flexDirection: active ? "row" : "column",
          }}>
            <Ico size={active ? 18 : 20} stroke={active ? "var(--bg)" : "var(--text-subtle)"} sw={1.6} />
            {active
              ? <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
              : <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.3px", marginTop: 2 }}>{label}</span>
            }
          </button>
        );
      })}
    </div>
  );
}
