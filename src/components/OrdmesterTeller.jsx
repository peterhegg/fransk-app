import { useEffect, useState } from "react";
import { ORDMESTER_GOALS, gold, cream } from "../constants.js";

function getSegment(masteredCount) {
  const idx = ORDMESTER_GOALS.findIndex(g => masteredCount < g.target);
  if (idx === -1) return { goal: ORDMESTER_GOALS[ORDMESTER_GOALS.length - 1], start: ORDMESTER_GOALS[ORDMESTER_GOALS.length - 2].target, goalIdx: ORDMESTER_GOALS.length - 1 };
  return {
    goal: ORDMESTER_GOALS[idx],
    start: idx === 0 ? 0 : ORDMESTER_GOALS[idx - 1].target,
    goalIdx: idx,
  };
}

export default function OrdmesterTeller({ masteredCount }) {
  const [displayed, setDisplayed] = useState(0);
  const [barWidth, setBarWidth] = useState(0);

  const { goal, start } = getSegment(masteredCount);
  const segmentSize = goal.target - start;
  const progressInSegment = Math.min(masteredCount - start, segmentSize);
  const pct = segmentSize > 0 ? (progressInSegment / segmentSize) * 100 : 0;

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

  const allDone = masteredCount >= ORDMESTER_GOALS[ORDMESTER_GOALS.length - 1].target;

  return (
    <div style={{ textAlign: "center", width: "100%", maxWidth: 420, marginTop: 8 }}>
      <div style={{ height: 1, background: `linear-gradient(to right, transparent, rgba(200,120,58,0.25), transparent)`, marginBottom: 14 }} />

      <div style={{ fontSize: 11, letterSpacing: 3, color: `${gold}99`, textTransform: "uppercase", marginBottom: 6 }}>
        Ordmestertelleren
      </div>

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 32, fontStyle: "italic", color: gold, fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1 }}>
          {displayed}
        </span>
        <span style={{ fontSize: 11, color: `${cream}55`, letterSpacing: 2, textTransform: "uppercase" }}>
          mestrede ord
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ position: "relative", height: 6, background: "rgba(200,120,58,0.12)", borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
        <div style={{
          position: "absolute", left: 0, top: 0, height: "100%",
          width: `${barWidth}%`,
          background: `linear-gradient(to right, #c8783a, #e8a060)`,
          borderRadius: 99,
          transition: "width 1.2s cubic-bezier(0.22,1,0.36,1)",
          boxShadow: barWidth > 5 ? "0 0 8px rgba(200,120,58,0.4)" : "none",
        }} />
      </div>

      {/* Goal label */}
      {!allDone ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: `${cream}55` }}>
          <span style={{ letterSpacing: 1 }}>{progressInSegment} / {segmentSize}</span>
          <span style={{ color: `${gold}88`, letterSpacing: 1 }}>
            Mål: {goal.target} — {goal.reward}
          </span>
        </div>
      ) : (
        <div style={{ fontSize: 12, color: gold, letterSpacing: 2, textTransform: "uppercase" }}>
          ✦ Alle mål nådd — Bon voyage! ✦
        </div>
      )}

      {/* Milestone dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 10 }}>
        {ORDMESTER_GOALS.map((g, i) => {
          const done = masteredCount >= g.target;
          const active = !done && masteredCount >= (i === 0 ? 0 : ORDMESTER_GOALS[i - 1].target);
          return (
            <div key={g.target} title={`${g.target} ord — ${g.reward}`}
              style={{
                width: active ? 8 : 6, height: active ? 8 : 6,
                borderRadius: "50%",
                background: done ? gold : active ? `${gold}66` : "rgba(200,120,58,0.15)",
                border: active ? `1px solid ${gold}` : "none",
                transition: "all 0.4s",
              }} />
          );
        })}
      </div>
    </div>
  );
}
