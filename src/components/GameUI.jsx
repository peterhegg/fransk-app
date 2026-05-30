/* ════════════════════════════════════════════════════════════════════════════
   src/components/GameUI.jsx
   The shared building blocks every Spillarena game uses. Inline styles + design
   tokens only (matches your codebase). No game owns its own header / result /
   feedback colors anymore — they all come from here.

   Bottom nav is NOT bundled — screens keep rendering <BottomNav/> themselves and
   pass it into GameResult / LoadingState via the `bottomNav` prop.
   ════════════════════════════════════════════════════════════════════════════ */

export const NAV_H = 84; // matches BottomNav height; scroll areas pad by this

/* ── GameHeader — ONE structure for all 8 games ──
   ← back · centered title(+icon) · right slot (count / toggle / action)        */
export function GameHeader({ onBack, backLabel = "Tilbake", title, icon, right }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "calc(env(safe-area-inset-top, 20px) + 16px) 16px 10px", gap: 8, flexShrink: 0,
    }}>
      <button onClick={onBack} className="press" style={{
        background: "none", border: "none", color: "var(--text-subtle)", fontSize: 14,
        cursor: "pointer", fontFamily: "var(--font-body)", padding: "6px 4px",
        minWidth: 64, textAlign: "left", whiteSpace: "nowrap",
      }}>← {backLabel}</button>
      <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
        {icon && <span style={{ fontSize: 17, lineHeight: 1 }}>{icon}</span>}
        <span style={{
          fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 500, color: "var(--text)",
          letterSpacing: "-0.3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{title}</span>
      </div>
      <div style={{ minWidth: 64, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>{right}</div>
    </div>
  );
}

/* ── GameProgress — replaces dots / segment-bars / nothing ── */
export function GameProgress({ total, current, style }) {
  return (
    <div style={{ display: "flex", gap: 4, padding: "0 16px 12px", flexShrink: 0, ...style }}>
      {Array.from({ length: total }, (_, i) => {
        const done = i < current, here = i === current;
        return <div key={i} style={{
          flex: 1, height: 4, borderRadius: 99,
          background: done ? "var(--cream)" : here ? "var(--cream-deep)" : "var(--border)",
          opacity: here ? 0.6 : 1, transition: "background var(--duration-normal), opacity var(--duration-normal)",
        }} />;
      })}
    </div>
  );
}

export function CountPill({ children, tone = "subtle" }) {
  const color = tone === "success" ? "var(--color-success)" : tone === "streak" ? "var(--color-streak)"
    : tone === "accent" ? "var(--cream)" : "var(--text-subtle)";
  return <span style={{ fontSize: 13, fontWeight: 600, color, fontFamily: "var(--font-body)", whiteSpace: "nowrap" }}>{children}</span>;
}

export function PromptLabel({ children, style }) {
  return <div style={{ fontSize: 11, color: "var(--text-subtle)", textTransform: "uppercase",
    letterSpacing: 1.4, fontFamily: "var(--font-body)", fontWeight: 600, ...style }}>{children}</div>;
}

export function Card({ children, feature, style, className = "" }) {
  return <div className={className} style={{
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: feature ? "var(--radius-feature)" : "var(--radius-card)",
    padding: feature ? "22px 20px" : "18px", ...style }}>{children}</div>;
}

export function PrimaryButton({ children, onClick, disabled, style }) {
  return <button onClick={onClick} disabled={disabled} className="press" style={{
    padding: "15px 22px", background: disabled ? "var(--surface)" : "var(--cream)",
    color: disabled ? "var(--text-subtle)" : "var(--on-accent)", border: "none",
    borderRadius: "var(--radius-control)", fontSize: 15, fontWeight: 700,
    cursor: disabled ? "not-allowed" : "pointer", fontFamily: "var(--font-body)", letterSpacing: 0.2, ...style,
  }}>{children}</button>;
}

export function GhostButton({ children, onClick, style }) {
  return <button onClick={onClick} className="press" style={{
    padding: "15px 22px", background: "var(--surface)", color: "var(--text)",
    border: "1px solid var(--border)", borderRadius: "var(--radius-control)",
    fontSize: 15, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-body)", ...style,
  }}>{children}</button>;
}

/* ── OptionButton — the universal answer button.
   state: "idle" | "correct" | "wrong" | "reveal" | "disabled"               */
export function OptionButton({ children, state = "idle", onClick, align = "center", style }) {
  const map = {
    idle:     { bg: "var(--surface)",          bd: "var(--border)",               fg: "var(--text)" },
    correct:  { bg: "var(--color-success-bg)", bd: "var(--color-success-border)", fg: "var(--color-success)" },
    reveal:   { bg: "var(--color-success-bg)", bd: "var(--color-success-border)", fg: "var(--color-success)" },
    wrong:    { bg: "var(--color-error-bg)",   bd: "var(--color-error-border)",   fg: "var(--color-error)" },
    disabled: { bg: "var(--surface)",          bd: "var(--border)",               fg: "var(--text-muted)" },
  }[state] || {};
  const anim = state === "correct" ? "anim-correct" : state === "wrong" ? "anim-wrong" : "";
  return <button onClick={onClick} disabled={state !== "idle"} className={`press ${anim}`} style={{
    padding: "15px 14px", borderRadius: "var(--radius-control)", border: `2px solid ${map.bd}`,
    background: map.bg, color: map.fg, fontFamily: "var(--font-body)", fontWeight: 500,
    cursor: state === "idle" ? "pointer" : "default", textAlign: align, lineHeight: 1.35,
    transition: "background var(--duration-normal), border-color var(--duration-normal), color var(--duration-normal)", ...style,
  }}>{children}</button>;
}

/* ── Chip — word tiles (Bygg setningen) / tags ── */
export function Chip({ children, tone = "idle", onClick, style }) {
  const map = {
    idle:    { bg: "var(--surface)",          bd: "var(--border)",               fg: "var(--text)" },
    active:  { bg: "var(--accent-bg)",        bd: "var(--cream)",                fg: "var(--cream)" },
    correct: { bg: "var(--color-success-bg)", bd: "var(--color-success-border)", fg: "var(--color-success)" },
    wrong:   { bg: "var(--color-error-bg)",   bd: "var(--color-error-border)",   fg: "var(--color-error)" },
  }[tone] || {};
  return <button onClick={onClick} className="press" style={{
    padding: "9px 13px", borderRadius: "var(--radius-chip)", border: `1.5px solid ${map.bd}`,
    background: map.bg, color: map.fg, fontFamily: "var(--font-body)", fontSize: 15, fontWeight: 500,
    cursor: "pointer", lineHeight: 1, transition: "all var(--duration-normal)", ...style,
  }}>{children}</button>;
}

export function StatCard({ label, value, tone = "accent" }) {
  const color = { accent: "var(--cream)", success: "var(--color-success)", error: "var(--color-error)", neutral: "var(--text)" }[tone];
  return <div style={{
    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-card)",
    padding: "16px 18px", textAlign: "center", minWidth: 82,
  }}>
    <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: "var(--font-body)", lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 11, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 6 }}>{label}</div>
  </div>;
}

/* ── GameResult — ONE celebration screen for all 8 games.
   stats: [{label, value, tone}]   primary/secondary/tertiary: {label, onClick}
   bottomNav: <BottomNav .../>                                                */
export function GameResult({ icon, title, subtitle, stats = [], primary, secondary, tertiary, children, bottomNav }) {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", gap: 22 }}>
        <div style={{ fontSize: 60, lineHeight: 1, animation: "celebrate 0.5s var(--ease-spring) both" }}>{icon}</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.5px" }}>{title}</div>
          {subtitle && <div style={{ fontSize: 13, color: "var(--text-subtle)", marginTop: 8, fontFamily: "var(--font-body)", lineHeight: 1.5, maxWidth: 300 }}>{subtitle}</div>}
        </div>
        {stats.length > 0 && (
          <div className="stagger" style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            {stats.map(s => <StatCard key={s.label} {...s} />)}
          </div>
        )}
        {children}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 4 }}>
          {primary && <PrimaryButton onClick={primary.onClick}>{primary.label}</PrimaryButton>}
          {secondary && <GhostButton onClick={secondary.onClick}>{secondary.label}</GhostButton>}
          {tertiary && <GhostButton onClick={tertiary.onClick}>{tertiary.label}</GhostButton>}
        </div>
      </div>
      {bottomNav}
    </div>
  );
}

/* ── LoadingState — ONE spinner for all loaders ── */
export function LoadingState({ icon, label = "Laster…", bottomNav }) {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        {icon && <div style={{ fontSize: 50 }}>{icon}</div>}
        <div style={{ width: 34, height: 34, border: "3px solid var(--border)", borderTopColor: "var(--cream)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <div style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)" }}>{label}</div>
      </div>
      {bottomNav}
    </div>
  );
}

/* ── Waveform + AudioButton — unified play control (Lyttedetektiv, Historiediktat) ── */
export function Waveform({ active }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, height: 40 }}>
      {Array.from({ length: 7 }, (_, i) => (
        <div key={i} style={{ width: 5, height: 32, borderRadius: 3,
          background: active ? "var(--cream)" : "var(--border)",
          animation: active ? `wave 0.9s ${i * 0.11}s ease-in-out infinite` : "none", transformOrigin: "center" }} />
      ))}
    </div>
  );
}

export function AudioButton({ playing, onClick, onSlow }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", width: 76, height: 76, flexShrink: 0 }}>
        {playing && [0, 0.45, 0.9].map((d, i) => (
          <div key={i} style={{ position: "absolute", top: "50%", left: "50%", width: 76, height: 76, borderRadius: "50%",
            border: "2px solid var(--cream)", transform: "translate(-50%,-50%)",
            animation: `ring-expand 1.8s ease-out ${d}s infinite`, pointerEvents: "none" }} />
        ))}
        <button onClick={onClick} className="press" style={{ width: 76, height: 76, borderRadius: "50%",
          background: playing ? "transparent" : "var(--cream)", border: playing ? "2px solid var(--cream)" : "none",
          color: playing ? "var(--cream)" : "var(--on-accent)", fontSize: 28, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", position: "relative", zIndex: 1,
        }}>{playing ? "⏸" : "▶"}</button>
      </div>
      {onSlow && (
        <button onClick={onSlow} className="press" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-control)",
          padding: "10px 13px", cursor: "pointer", color: "var(--text-subtle)", fontFamily: "var(--font-body)" }}>
          <span style={{ fontSize: 17 }}>🐢</span><span style={{ fontSize: 10 }}>Sakte</span>
        </button>
      )}
    </div>
  );
}

/* ── Dock — fixed action bar above the BottomNav (Sjekk / Neste …) ── */
export function Dock({ children }) {
  return <div className="sheet-up" style={{
    position: "fixed", bottom: NAV_H, left: 0, right: 0, padding: "10px 16px 12px",
    background: "linear-gradient(to top, var(--bg) 72%, transparent)", display: "flex", gap: 10, zIndex: 190,
  }}>{children}</div>;
}
