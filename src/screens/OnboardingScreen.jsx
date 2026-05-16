import { useState } from "react";
import { motion } from "framer-motion";
import Tutor, { TutorAnimated } from "../components/Tutor/Tutor.jsx";
import { saveTutorPrefs } from "../hooks/useTutorPrefs.js";

const NAMES_F = [
  { key: "simone", label: "Simone", persona: "simone", desc: "Stille, lest, tålmodig." },
  { key: "colette", label: "Colette", persona: "simone", desc: "Varm, direkte, morsom." },
  { key: "marguerite", label: "Marguerite", persona: "simone", desc: "Tankefull, presis, rolig." },
  { key: "camille", label: "Camille", persona: "simone", desc: "Ung, nysgjerrig, energisk." },
];
const NAMES_M = [
  { key: "henri", label: "Henri", persona: "henri", desc: "Litterær, tålmodig, røyker pipe." },
  { key: "antoine", label: "Antoine", persona: "henri", desc: "Entusiastisk, grundig, detaljorientert." },
  { key: "marcel", label: "Marcel", persona: "henri", desc: "Filosofisk, rolig, eftertenksom." },
  { key: "jean-paul", label: "Jean-Paul", persona: "henri", desc: "Ironisk, skarp, engasjert." },
];

export default function OnboardingScreen({ onDone }) {
  const [selected, setSelected] = useState(NAMES_M[0]);

  const handleConfirm = () => {
    const newPrefs = {
      tutorPersona: selected.persona,
      tutorName: selected.label,
      tutorVisibility: "all",
    };
    saveTutorPrefs(newPrefs);
    onDone(newPrefs);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        height: "100dvh", background: "var(--app-bg)", color: "var(--text)",
        fontFamily: "var(--font-body)", display: "flex", flexDirection: "column",
        padding: "52px 20px 32px", overflowY: "auto", scrollbarWidth: "none",
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(232,237,245,0.5)", marginBottom: 6 }}>
        L'ATELIER · LÆREREN DIN
      </div>
      <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400, fontSize: 26, margin: "6px 0 4px", color: "var(--text)" }}>
        Hvem skal lære deg fransk?
      </h1>
      <div style={{ fontSize: 13, color: "rgba(232,237,245,0.6)", marginBottom: 22, lineHeight: 1.5 }}>
        Du kan endre dette når som helst i innstillinger.
      </div>

      <div style={{
        background: "linear-gradient(135deg, rgba(90,154,240,0.10), rgba(15,31,52,0.4))",
        border: "1px solid rgba(255,255,255,0.10)", borderRadius: 20,
        padding: 18, display: "flex", alignItems: "center", gap: 16, marginBottom: 18,
      }}>
        <div style={{ color: "var(--accent, #5a9af0)", flexShrink: 0 }}>
          <TutorAnimated persona={selected.persona} emotion="dignified" accessory={selected.persona === "henri" ? "pipe" : "book"} crop="bust" size={84} title={selected.label} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: "rgba(232,237,245,0.5)", textTransform: "uppercase", letterSpacing: 0.5 }}>VALGT</div>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, margin: "4px 0", color: "var(--text)" }}>{selected.label}</div>
          <div style={{ fontSize: 12, color: "rgba(232,237,245,0.6)", lineHeight: 1.5 }}>{selected.desc}</div>
        </div>
      </div>

      <div style={{ fontSize: 10, color: "rgba(232,237,245,0.5)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>HUN</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {NAMES_F.map(n => {
          const isSel = selected.key === n.key;
          return (
            <button key={n.key} onClick={() => setSelected(n)} style={{
              flex: 1, padding: "10px 0 12px", borderRadius: 14, textAlign: "center", cursor: "pointer",
              background: isSel ? "rgba(90,154,240,0.18)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${isSel ? "rgba(90,154,240,0.55)" : "rgba(255,255,255,0.10)"}`,
              color: isSel ? "#7db0f5" : "rgba(232,237,245,0.78)",
            }}>
              <div style={{ color: isSel ? "#7db0f5" : "rgba(232,237,245,0.55)", display: "flex", justifyContent: "center", marginBottom: 4 }}>
                <Tutor persona="simone" emotion="idle" crop="face" size={36} title="" />
              </div>
              <div style={{ fontSize: 12 }}>{n.label}</div>
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: 10, color: "rgba(232,237,245,0.5)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>HAN</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {NAMES_M.map(n => {
          const isSel = selected.key === n.key;
          return (
            <button key={n.key} onClick={() => setSelected(n)} style={{
              flex: 1, padding: "10px 0 12px", borderRadius: 14, textAlign: "center", cursor: "pointer",
              background: isSel ? "rgba(90,154,240,0.18)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${isSel ? "rgba(90,154,240,0.55)" : "rgba(255,255,255,0.10)"}`,
              color: isSel ? "#7db0f5" : "rgba(232,237,245,0.78)",
            }}>
              <div style={{ color: isSel ? "#7db0f5" : "rgba(232,237,245,0.55)", display: "flex", justifyContent: "center", marginBottom: 4 }}>
                <Tutor persona="henri" emotion="idle" crop="face" size={36} title="" />
              </div>
              <div style={{ fontSize: 12 }}>{n.label}</div>
            </button>
          );
        })}
      </div>

      <button onClick={handleConfirm} style={{
        background: "#5a9af0", color: "#fff", border: 0, borderRadius: 14,
        padding: "14px 20px", fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 500,
        boxShadow: "0 4px 16px rgba(46,107,230,0.30)", cursor: "pointer", marginTop: "auto",
      }}>
        Møt {selected.label}
      </button>
    </motion.div>
  );
}
