import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LANGUAGES } from "../languages/index.js";

const LANG_ORDER = ["fr", "de-CH"];

function FlagCircle({ flag, size = 36, active = false }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        display: "grid",
        placeItems: "center",
        fontSize: size * 0.58,
        lineHeight: 1,
        background: active ? "var(--accent-bg)" : "var(--surface)",
        border: active
          ? "1.5px solid var(--accent)"
          : "1.5px solid var(--border)",
        flexShrink: 0,
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      {flag}
    </div>
  );
}

export default function LanguagePicker({ langId, setLang }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [open]);

  const available = LANG_ORDER.filter((id) => LANGUAGES[id]);
  const current = LANGUAGES[langId] || LANGUAGES["fr"];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.9 }}
        aria-label="Bytt språk"
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          display: "flex",
        }}
      >
        <FlagCircle flag={current.flag} active={open} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -6 }}
            transition={{ duration: 0.14 }}
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              background: "var(--color-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-md)",
              padding: "6px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              minWidth: 160,
              zIndex: 200,
            }}
          >
            {available.map((id) => {
              const lang = LANGUAGES[id];
              const isActive = id === langId;
              return (
                <button
                  key={id}
                  onClick={() => { setLang(id); setOpen(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    cursor: "pointer",
                    background: isActive ? "var(--accent-bg)" : "transparent",
                    color: isActive ? "var(--accent)" : "var(--text)",
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    fontWeight: isActive ? 600 : 400,
                    textAlign: "left",
                    transition: "background 0.12s",
                  }}
                >
                  <span style={{ fontSize: 20, lineHeight: 1 }}>{lang.flag}</span>
                  <span style={{ flex: 1 }}>{lang.label}</span>
                  {isActive && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
