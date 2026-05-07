import { useEffect, useRef } from "react";
import { MASTERY_LABELS, MASTERY_COLORS, MASTERY_POINTS } from "../constants.js";

// Fireworks canvas — French tricolore colors
export function Fireworks({ onDone }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = ["#002395", "#FFFFFF", "#ED2939", "#FFD700", "#002395", "#ED2939"];
    const particles = [];

    const burst = (x, y) => {
      const count = 60 + Math.floor(Math.random() * 30);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const speed = 3 + Math.random() * 6;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          alpha: 1,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          size: 3 + Math.random() * 4,
          decay: 0.012 + Math.random() * 0.01,
          gravity: 0.12 + Math.random() * 0.06,
          trail: [],
        });
      }
    };

    // Fire 5 bursts spread across the screen
    const W = canvas.width, H = canvas.height;
    const positions = [
      [W * 0.25, H * 0.3], [W * 0.75, H * 0.25], [W * 0.5, H * 0.2],
      [W * 0.15, H * 0.45], [W * 0.85, H * 0.4],
    ];
    positions.forEach(([x, y], i) => setTimeout(() => burst(x, y), i * 160));

    let frame;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 5) p.trail.shift();
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.98;
        p.alpha -= p.decay;
        if (p.alpha <= 0) { particles.splice(i, 1); continue; }

        // Trail
        for (let t = 0; t < p.trail.length; t++) {
          const a = (t / p.trail.length) * p.alpha * 0.4;
          ctx.beginPath();
          ctx.arc(p.trail[t].x, p.trail[t].y, p.size * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = a;
          ctx.fill();
        }
        // Particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (particles.length > 0) {
        frame = requestAnimationFrame(animate);
      } else {
        onDone?.();
      }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", inset: 0, zIndex: 9998, pointerEvents: "none" }}
    />
  );
}

// Points pill shown inside riktig/nesten/feil card
export default function PointsBadge({ pointsInfo }) {
  if (!pointsInfo) return null;
  const { pts, ptsBefore, tierBefore, tierAfter } = pointsInfo;
  const tierChanged = tierAfter !== tierBefore;
  const delta = pts - ptsBefore;
  const isMastered = pts >= MASTERY_POINTS;

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.12)", display: "flex", flexDirection: "column", gap: 5, alignItems: "center" }}>
      {/* Points bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: delta > 0 ? "var(--color-success)" : delta < 0 ? "var(--color-error)" : "var(--text-subtle)" }}>
          {delta > 0 ? `+${delta}` : delta < 0 ? delta : "~"}
        </div>
        <div style={{ height: 6, width: 100, background: "rgba(0,0,0,0.12)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(100, (pts / MASTERY_POINTS) * 100)}%`, background: isMastered ? "var(--color-success)" : "var(--accent)", borderRadius: 99, transition: "width 0.4s ease" }} />
        </div>
        <div style={{ fontSize: 12, color: "var(--text-subtle)", whiteSpace: "nowrap" }}>{pts} / {MASTERY_POINTS}</div>
      </div>

      {/* Tier label */}
      {tierChanged ? (
        <div style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ color: MASTERY_COLORS[tierBefore], textDecoration: "line-through", opacity: 0.7 }}>
            {MASTERY_LABELS[tierBefore]}
          </span>
          <span style={{ color: "var(--text-subtle)" }}>→</span>
          <span style={{ color: isMastered ? "var(--color-success)" : MASTERY_COLORS[tierAfter], fontWeight: 600 }}>
            {isMastered ? "★ mestret!" : MASTERY_LABELS[tierAfter]}
          </span>
        </div>
      ) : (
        <div style={{ fontSize: 11, color: MASTERY_COLORS[tierAfter] }}>
          {isMastered ? "★ mestret" : MASTERY_LABELS[tierAfter]}
        </div>
      )}
    </div>
  );
}
