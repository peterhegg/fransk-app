export function AutoPlayToggle({ autoPlay, onToggle }) {
  if (!onToggle) return <div style={{ width: 40 }} />;
  return (
    <button onClick={onToggle} title={autoPlay ? "Skru av automatisk uttale" : "Skru på automatisk uttale"}
      style={{ background: "none", border: "none", cursor: "pointer", color: autoPlay ? "var(--accent)" : "var(--text-subtle)", fontSize: 20, padding: "4px", borderRadius: 8, width: 40, display: "flex", justifyContent: "flex-end" }}>
      {autoPlay ? "🔊" : "🔇"}
    </button>
  );
}

export function SpeakButton({ onClick, slow, label }) {
  const text = label ?? (slow ? "Sakte" : "Les opp");
  return (
    <button onClick={onClick}
      style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "6px 14px", cursor: "pointer", fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: 5 }}>
      {slow ? "🐢" : "🔊"} <span style={{ fontSize: 11 }}>{text}</span>
    </button>
  );
}
