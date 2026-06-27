import { useState } from "react";

// Bottom sheet listing the groups (vocab goals / grammar topics) with word counts.
function GroupPickerSheet({ groups, selected, onChange, onClose, wordCounts }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(26,26,46,0.45)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{ position: "relative", background: "var(--surface-solid)", borderRadius: "24px 24px 0 0", padding: "20px 20px 40px", boxShadow: "0 -4px 32px rgba(0,0,0,0.4)", maxHeight: "70dvh", display: "flex", flexDirection: "column", overflowX: "hidden", width: "100%" }}>
        <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 99, margin: "0 auto 18px" }} />
        <div style={{ fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "var(--text-subtle)", marginBottom: 12, fontFamily: "var(--font-body)" }}>Velg gruppe</div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {[{ id: null, label: "Alle grupper", count: wordCounts.total }].concat(groups.map(g => ({ ...g, count: wordCounts[g.id] || 0 }))).map(g => {
            const active = selected === g.id;
            return (
              <button key={g.id ?? "_all"} onClick={() => { onChange(g.id); onClose(); }}
                style={{ width: "100%", background: active ? "rgba(230,211,168,0.12)" : "none", border: `1px solid ${active ? "rgba(230,211,168,0.5)" : "var(--border)"}`, borderRadius: 12, padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontFamily: "var(--font-body)", textAlign: "left" }}>
                <span style={{ fontSize: 14, color: active ? "var(--cream)" : "var(--text)", fontWeight: active ? 600 : 400 }}>{g.label}</span>
                <span style={{ fontSize: 12, color: "var(--text-subtle)" }}>{g.count} ord</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Compact "focus group" selector. Opens the sheet on tap.
export default function GroupButton({ groups, selected, onChange, wordCounts }) {
  const [open, setOpen] = useState(false);
  if (!groups.length) return null;
  const label = selected ? (groups.find(g => g.id === selected)?.label || "Gruppe") : "Alle grupper";
  return (
    <>
      <div style={{ padding: "0 24px 16px" }}>
        <button onClick={() => setOpen(true)}
          style={{ background: selected ? "rgba(230,211,168,0.1)" : "none", border: `1px solid ${selected ? "rgba(230,211,168,0.4)" : "var(--border)"}`, borderRadius: 10, padding: "7px 14px", cursor: "pointer", fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "var(--text-subtle)" }}>Gruppe</span>
          <span style={{ fontSize: 13, color: selected ? "var(--cream)" : "var(--text)", fontWeight: selected ? 600 : 400 }}>{label}</span>
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>▾</span>
        </button>
      </div>
      {open && <GroupPickerSheet groups={groups} selected={selected} onChange={onChange} onClose={() => setOpen(false)} wordCounts={wordCounts} />}
    </>
  );
}
