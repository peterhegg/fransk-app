import { useEffect, useState } from "react";
import { ORDMESTER_GOALS } from "../constants.js";
import { loadOrdmesterGoals, loadMasteryLog, touchMasteryCount, getMasteryMidpoint, todayStr } from "../utils.jsx";

function getGoals() {
  return loadOrdmesterGoals() || ORDMESTER_GOALS;
}

function getSegment(masteredCount, goals) {
  const idx = goals.findIndex(g => masteredCount < g.target);
  if (idx === -1) return { goal: goals[goals.length - 1], start: goals.length > 1 ? goals[goals.length - 2].target : 0, goalIdx: goals.length - 1 };
  return { goal: goals[idx], start: idx === 0 ? 0 : goals[idx - 1].target, goalIdx: idx };
}

function MasteryGraph({ masteredCount, midpoint }) {
  const log = loadMasteryLog();
  const today = todayStr();
  const yMin = midpoint - 10;
  const yMax = midpoint + 10;
  const range = 20;

  let lastKnown = null;
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const date = d.toISOString().split("T")[0];
    let count = null;
    if (date === today) {
      count = masteredCount;
    } else {
      const entry = log.find(e => e.date === date);
      if (entry) count = entry.count;
      else if (lastKnown !== null) count = lastKnown;
    }
    if (count !== null) lastKnown = count;
    const dl = new Date(date + "T12:00:00");
    const label = date === today ? "i dag" : dl.toLocaleDateString("nb", { weekday: "short" }).slice(0, 2);
    const heightPct = count !== null
      ? Math.min(100, Math.max(0, ((count - yMin) / range) * 100))
      : null;
    return { date, count, label, isToday: date === today, heightPct };
  });

  return (
    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
      <div style={{ fontSize: 10, color: "var(--text-subtle)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
        Fremgang siste 7 dager
      </div>
      <div style={{ display: "flex", gap: 4, alignItems: "flex-end" }}>
        {/* Y-axis */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: 48, paddingBottom: 16, flexShrink: 0, width: 24 }}>
          <div style={{ fontSize: 8, color: "var(--text-subtle)", textAlign: "right", lineHeight: 1 }}>{yMax}</div>
          <div style={{ fontSize: 8, color: "rgba(46,107,230,0.6)", textAlign: "right", lineHeight: 1, fontWeight: 600 }}>{midpoint}</div>
          <div style={{ fontSize: 8, color: "var(--text-subtle)", textAlign: "right", lineHeight: 1 }}>{yMin}</div>
        </div>
        {/* Bars */}
        <div style={{ flex: 1, display: "flex", gap: 3 }}>
          {days.map(day => (
            <div key={day.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div style={{ fontSize: 8, color: day.isToday ? "var(--accent)" : "var(--text-subtle)", fontWeight: day.isToday ? 700 : 400, lineHeight: 1, height: 10, display: "flex", alignItems: "center" }}>
                {day.count !== null ? day.count : ""}
              </div>
              <div style={{ width: "100%", height: 36, position: "relative", background: "var(--accent-bg)", borderRadius: 3, overflow: "hidden" }}>
                {day.heightPct !== null && (
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0,
                    height: `${day.heightPct}%`,
                    background: day.isToday
                      ? "linear-gradient(to top, var(--accent), var(--accent-light))"
                      : "rgba(46,107,230,0.38)",
                    borderRadius: "3px 3px 0 0",
                    transition: "height 0.5s ease",
                    minHeight: 2,
                  }} />
                )}
                {/* Midpoint line at 50% */}
                <div style={{
                  position: "absolute", left: 0, right: 0,
                  top: "50%", height: 1,
                  background: "rgba(46,107,230,0.35)",
                  transform: "translateY(-50%)",
                }} />
              </div>
              <div style={{ fontSize: 8, color: day.isToday ? "var(--accent)" : "var(--text-subtle)", fontWeight: day.isToday ? 700 : 400, whiteSpace: "nowrap" }}>
                {day.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OrdmesterTeller({ masteredCount, onEdit }) {
  const [displayed, setDisplayed] = useState(0);
  const [barWidth, setBarWidth] = useState(0);
  const [midpoint] = useState(() => getMasteryMidpoint(masteredCount));

  const goals = getGoals();
  const { goal, start } = getSegment(masteredCount, goals);
  const segmentSize = goal.target - start;
  const progressInSegment = Math.min(masteredCount - start, segmentSize);
  const pct = segmentSize > 0 ? (progressInSegment / segmentSize) * 100 : 0;

  useEffect(() => {
    touchMasteryCount(masteredCount);
  }, [masteredCount]);

  useEffect(() => {
    let frame;
    const target = masteredCount;
    let current = 0;
    const step = () => {
      current = Math.min(current + Math.max(1, Math.ceil((target - current) / 12)), target);
      setDisplayed(current);
      if (current < target) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [masteredCount]);

  useEffect(() => {
    const t = setTimeout(() => setBarWidth(pct), 120);
    return () => clearTimeout(t);
  }, [pct]);

  const allDone = masteredCount >= goals[goals.length - 1].target;

  return (
    <div style={{ textAlign: "center", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: "var(--text-subtle)", textTransform: "uppercase", fontWeight: 500 }}>
          Ordmestertelleren
        </div>
        {onEdit && (
          <button onClick={onEdit}
            style={{ background: "var(--accent-bg)", border: "none", borderRadius: 8, color: "var(--accent)", fontSize: 11, fontWeight: 500, padding: "4px 10px", cursor: "pointer", fontFamily: "var(--font-body)" }}>
            Tilpass
          </button>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6, marginBottom: 12 }}>
        <span style={{ fontSize: 32, fontWeight: 600, color: "var(--accent)", lineHeight: 1 }}>
          {displayed}
        </span>
        <span style={{ fontSize: 11, color: "var(--text-subtle)", letterSpacing: 1, textTransform: "uppercase" }}>
          mestrede
        </span>
      </div>

      <div style={{ position: "relative", height: 6, background: "var(--accent-bg)", borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
        <div style={{
          position: "absolute", left: 0, top: 0, height: "100%",
          width: `${barWidth}%`,
          background: "linear-gradient(to right, var(--accent), var(--accent-light))",
          borderRadius: 99,
          transition: "width 1.2s cubic-bezier(0.22,1,0.36,1)",
          boxShadow: barWidth > 5 ? "0 0 8px rgba(46,107,230,0.35)" : "none",
        }} />
      </div>

      {!allDone ? (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-subtle)" }}>
          <span>{progressInSegment} / {segmentSize}</span>
          <span style={{ color: "var(--accent)", opacity: 0.7 }}>Mål: {goal.target} — {goal.reward}</span>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: "var(--accent)", letterSpacing: 2, textTransform: "uppercase" }}>
          ✦ Alle mål nådd — Bon voyage! ✦
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12 }}>
        {goals.map((g, i) => {
          const done = masteredCount >= g.target;
          const active = !done && masteredCount >= (i === 0 ? 0 : goals[i - 1].target);
          return (
            <div key={g.target} title={`${g.target} ord — ${g.reward}`}
              style={{
                width: active ? 8 : 6, height: active ? 8 : 6,
                borderRadius: "50%",
                background: done ? "var(--accent)" : active ? "rgba(46,107,230,0.45)" : "var(--accent-bg)",
                border: active ? "1px solid var(--accent)" : "none",
                transition: "all 0.4s",
              }} />
          );
        })}
      </div>

      <MasteryGraph masteredCount={masteredCount} midpoint={midpoint} />
    </div>
  );
}
