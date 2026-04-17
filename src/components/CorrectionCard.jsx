export default function CorrectionCard({ correction }) {
  if (!correction) return null;

  return (
    <div className="correction-card" style={{
      background: "rgba(108,92,231,0.06)",
      border: "1px solid rgba(108,92,231,0.15)",
      borderRadius: 12,
      padding: "10px 14px",
      marginTop: 6,
      maxWidth: "82%",
      alignSelf: "flex-end",
    }}>
      <div style={{
        fontSize: 10,
        color: "var(--accent)",
        letterSpacing: 1.5,
        textTransform: "uppercase",
        marginBottom: 6,
        opacity: 0.75,
        fontFamily: "var(--font-body)",
        fontWeight: 500,
      }}>
        Petite correction
      </div>
      <div style={{ fontSize: 13, fontFamily: "var(--font-body)", lineHeight: 1.5 }}>
        <span style={{ textDecoration: "line-through", color: "var(--text-subtle)", marginRight: 6 }}>
          {correction.original}
        </span>
        <span style={{ color: "var(--accent)", fontWeight: 500 }}>
          → {correction.corrected}
        </span>
      </div>
      {correction.explanation && (
        <div style={{
          fontSize: 12,
          color: "var(--text-subtle)",
          marginTop: 5,
          lineHeight: 1.55,
          fontStyle: "italic",
          fontFamily: "var(--font-body)",
        }}>
          {correction.explanation}
        </div>
      )}
    </div>
  );
}
