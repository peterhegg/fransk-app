import { motion } from "framer-motion";

export default function CorrectionCard({ correction }) {
  if (!correction) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      style={{
        background: "var(--accent-bg)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "10px 14px",
        marginTop: 6,
        maxWidth: "82%",
        alignSelf: "flex-end",
      }}
    >
      <div style={{
        fontSize: "var(--font-size-xs)",
        color: "var(--accent)",
        letterSpacing: 1.5,
        textTransform: "uppercase",
        marginBottom: 6,
        opacity: 0.75,
        fontFamily: "var(--font-body)",
        fontWeight: "var(--font-weight-medium)",
      }}>
        Petite correction
      </div>

      <div style={{
        fontSize: "var(--font-size-sm)",
        fontFamily: "var(--font-body)",
        lineHeight: "var(--line-height-normal)",
      }}>
        <span style={{ textDecoration: "line-through", color: "var(--text-subtle)", marginRight: 6 }}>
          {correction.original}
        </span>
        <span style={{ color: "var(--accent)", fontWeight: "var(--font-weight-medium)" }}>
          → {correction.corrected}
        </span>
      </div>

      {correction.explanation && (
        <div style={{
          fontSize: "var(--font-size-xs)",
          color: "var(--text-subtle)",
          marginTop: 5,
          lineHeight: "var(--line-height-relaxed)",
          fontStyle: "italic",
          fontFamily: "var(--font-body)",
        }}>
          {correction.explanation}
        </div>
      )}
    </motion.div>
  );
}
