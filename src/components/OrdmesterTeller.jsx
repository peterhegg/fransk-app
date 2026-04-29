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
    // y: 0 = top, 1 = bottom in SVG coords
    const yFrac = count !== null
      ? 1 - Math.min(1, Math.max(0, (count - yMin) / range))
      : null;
    return { date, count, label, isToday: date === today, yFrac };
  });

  // SVG dimensions
  const W = 280, H = 56, PAD = 8;
  const plotW = W - PAD * 2;
  const plotH = H - 6; // leave 6px at top for labels
  const xOf = (i) => PAD + (i / 6) * plotW;
  const yOf = (frac) => 2 + frac * plotH;

  const points = days.map((d, i) => d.yFrac !== null ? { x: xOf(i), y: yOf(d.yFrac) } : null);
  const validPoints = points.filter(Boolean);

  // Smooth line using cubic bezier through points
  const pathD = (() => {
    const pts = points.map((p, i) => p ?? null);
    const segs = [];
    let i = 0;
    while (i < pts.length) {
      if (pts[i] === null) { i++; continue; }
      // Find contiguous run
      let j = i;
      while (j < pts.length && pts[j] !== null) j++;
      const run = pts.slice(i, j);
      if (run.length === 1) {
        segs.push(`M ${run[0].x} ${run[0].y}`);
      } else {
        let d = `M ${run[0].x} ${run[0].y}`;
        for (let k = 1; k < run.length; k++) {
          const prev = run[k - 1], curr = run[k];
          const cpx = (prev.x + curr.x) / 2;
          d += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
        }
        segs.push(d);
      }
      i = j;
    }
    return segs.join(" ");
  })();

  // Area fill — only for contiguous segments
  const areaD = (() => {
    const pts = points.map((p, i) => p ?? null);
    const segs = [];
    let i = 0;
    while (i < pts.length) {
      if (pts[i] === null) { i++; continue; }
      let j = i;
      while (j < pts.length && pts[j] !== null) j++;
      const run = pts.slice(i, j);
      if (run.length < 2) { i = j; continue; }
      let d = `M ${run[0].x} ${H}`;
      d += ` L ${run[0].x} ${run[0].y}`;
      for (let k = 1; k < run.length; k++) {
        const prev = run[k - 1], curr = run[k];
        const cpx = (prev.x + curr.x) / 2;
        d += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`;
      }
      d += ` L ${run[run.length - 1].x} ${H} Z`;
      segs.push(d);
      i = j;
    }
    return segs.join(" ");
  })();

  const midY = yOf(0.5);

  return (
    <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
      <div style={{ fontSize: 10, color: "var(--text-subtle)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>
        Fremgang siste 7 dager
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
        {/* Y-axis labels */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: H + 14, paddingBottom: 14, flexShrink: 0, width: 22 }}>
          <div style={{ fontSize: 8, color: "var(--text-subtle)", textAlign: "right", lineHeight: 1 }}>{yMax}</div>
          <div style={{ fontSize: 8, color: "rgba(46,107,230,0.65)", textAlign: "right", lineHeight: 1, fontWeight: 600 }}>{midpoint}</div>
          <div style={{ fontSize: 8, color: "var(--text-subtle)", textAlign: "right", lineHeight: 1 }}>{yMin}</div>
        </div>
        {/* SVG graph */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <svg width="100%" viewBox={`0 0 ${W} ${H + 14}`} style={{ display: "block", overflow: "visible" }}>
            {/* Midpoint dashed line */}
            <line x1={PAD} y1={midY} x2={W - PAD} y2={midY}
              stroke="rgba(46,107,230,0.25)" strokeWidth="1" strokeDasharray="3 3" />
            {/* Area fill */}
            {areaD && (
              <path d={areaD} fill="url(#masteryGrad)" opacity="0.18" />
            )}
            {/* Line */}
            {pathD && (
              <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            )}
            {/* Dots */}
            {days.map((day, i) => day.yFrac !== null && (
              <g key={day.date}>
                <circle cx={xOf(i)} cy={yOf(day.yFrac)} r={day.isToday ? 4 : 2.5}
                  fill={day.isToday ? "var(--accent)" : "var(--surface)"}
                  stroke="var(--accent)" strokeWidth={day.isToday ? 0 : 1.5} />
                {/* Count label above dot */}
                <text x={xOf(i)} y={yOf(day.yFrac) - 6}
                  textAnchor="middle" fontSize="7"
                  fill={day.isToday ? "var(--accent)" : "rgba(46,107,230,0.55)"}
                  fontWeight={day.isToday ? "700" : "400"}>
                  {day.count}
                </text>
              </g>
            ))}
            {/* Day labels */}
            {days.map((day, i) => (
              <text key={day.date + "l"} x={xOf(i)} y={H + 12}
                textAnchor="middle" fontSize="7.5"
                fill={day.isToday ? "var(--accent)" : "var(--text-subtle)"}
                fontWeight={day.isToday ? "700" : "400"}>
                {day.label}
              </text>
            ))}
            <defs>
              <linearGradient id="masteryGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
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
