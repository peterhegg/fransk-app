import { useState } from "react";
import { motion } from "framer-motion";
import Tutor, { TutorAnimated } from "../components/Tutor/Tutor.jsx";
import { saveTutorPrefs } from "../hooks/useTutorPrefs.js";
import { getActiveLang } from "../languages/index.js";

// Tutor name sets per language. The `persona` on each entry is that language's
// figure for the given gender (resolved below from the language's personas).
const NAME_SETS = {
  fr: {
    f: [
      { key: "simone", label: "Simone", desc: "Stille, lest, tålmodig." },
      { key: "colette", label: "Colette", desc: "Varm, direkte, morsom." },
      { key: "marguerite", label: "Marguerite", desc: "Tankefull, presis, rolig." },
      { key: "camille", label: "Camille", desc: "Ung, nysgjerrig, energisk." },
    ],
    m: [
      { key: "henri", label: "Henri", desc: "Litterær, tålmodig, røyker pipe." },
      { key: "antoine", label: "Antoine", desc: "Entusiastisk, grundig, detaljorientert." },
      { key: "marcel", label: "Marcel", desc: "Filosofisk, rolig, eftertenksom." },
      { key: "jean-paul", label: "Jean-Paul", desc: "Ironisk, skarp, engasjert." },
    ],
  },
  "de-CH": {
    f: [
      { key: "regula", label: "Regula", desc: "Rolig, presis, varm." },
      { key: "vreni", label: "Vreni", desc: "Jordnær, direkte, humoristisk." },
      { key: "heidi", label: "Heidi", desc: "Lys, oppmuntrende, tålmodig." },
      { key: "bea", label: "Bea", desc: "Skarp, energisk, nysgjerrig." },
    ],
    m: [
      { key: "klaus", label: "Klaus", desc: "Professor, presis, glad i grammatikk." },
      { key: "beat", label: "Beat", desc: "Avslappet, vennlig, grundig." },
      { key: "urs", label: "Urs", desc: "Stillferdig, metodisk, tålmodig." },
      { key: "hans", label: "Hans", desc: "Varm, fortellerglad, engasjert." },
    ],
  },
};

export default function OnboardingScreen({ onDone }) {
  const lang = getActiveLang();
  const personaFor = (g) => (lang.tutor.personas.find(p => p.gender === g) || {}).id;
  const fPersona = personaFor("f");
  const mPersona = personaFor("m");
  const set = NAME_SETS[lang.id] || NAME_SETS.fr;
  // Attach the resolved persona to each name entry.
  const NAMES_F = set.f.map(n => ({ ...n, persona: fPersona }));
  const NAMES_M = set.m.map(n => ({ ...n, persona: mPersona }));

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
        {lang.brand} · LÆREREN DIN
      </div>
      <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400, fontSize: 26, margin: "6px 0 4px", color: "var(--text)" }}>
        Hvem skal lære deg {lang.label.toLowerCase()}?
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
          <TutorAnimated persona={selected.persona} emotion="dignified" accessory={selected.persona === "henri" ? "pipe" : "book"} crop="bust" size={84} title={selected.label} key={selected.key} />
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
                <Tutor persona={fPersona} emotion="idle" crop="face" size={36} title="" />
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
                <Tutor persona={mPersona} emotion="idle" crop="face" size={36} title="" />
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
