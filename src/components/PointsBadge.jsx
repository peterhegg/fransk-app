import { useEffect, useRef, useState } from "react";
import { MASTERY_LABELS, MASTERY_COLORS, MASTERY_POINTS } from "../constants.js";

const TRICOLORE = ["#002395", "#FFFFFF", "#ED2939", "#FFD700", "#002395", "#ED2939", "#FFFFFF", "#FFD700"];
const CONFETTI_COLORS = ["#5a9af0", "#7db0f5", "#00b894", "#FFD700", "#ED2939", "#c8a03a", "#7ab050", "#e17055", "#FFFFFF"];

// Big fireworks for mastered words
export function Fireworks({ onDone }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];

    const burst = (x, y, count = 120) => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const speed = 5 + Math.random() * 13;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 4,
          alpha: 1,
          color: TRICOLORE[Math.floor(Math.random() * TRICOLORE.length)],
          size: 3 + Math.random() * 6,
          decay: 0.005 + Math.random() * 0.006,
          gravity: 0.09 + Math.random() * 0.09,
          trail: [],
        });
      }
    };

    const W = canvas.width, H = canvas.height;
    const positions = [
      [W * 0.5, H * 0.15], [W * 0.2, H * 0.2], [W * 0.8, H * 0.18],
      [W * 0.35, H * 0.1], [W * 0.65, H * 0.12], [W * 0.1, H * 0.32],
      [W * 0.9, H * 0.28], [W * 0.5, H * 0.3], [W * 0.25, H * 0.42],
      [W * 0.75, H * 0.38], [W * 0.5, H * 0.07], [W * 0.15, H * 0.48],
      [W * 0.85, H * 0.44],
    ];
    positions.forEach(([x, y], i) =>
      setTimeout(() => burst(x, y, 110 + Math.floor(Math.random() * 50)), i * 100)
    );

    let frame;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 8) p.trail.shift();
        p.x += p.vx; p.y += p.vy;
        p.vy += p.gravity; p.vx *= 0.98;
        p.alpha -= p.decay;
        if (p.alpha <= 0) { particles.splice(i, 1); continue; }
        for (let t = 0; t < p.trail.length; t++) {
          ctx.beginPath();
          ctx.arc(p.trail[t].x, p.trail[t].y, p.size * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = (t / p.trail.length) * p.alpha * 0.4;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (particles.length > 0) frame = requestAnimationFrame(animate);
      else onDone?.();
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 9998, pointerEvents: "none" }} />;
}

// Lighter confetti for tier UP (non-mastery)
export function ConfettiBurst({ onDone }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const W = canvas.width, H = canvas.height;
    const cx = W * 0.5, cy = H * 0.42;
    const particles = [];

    for (let i = 0; i < 75; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 9;
      const isRect = Math.random() > 0.4;
      particles.push({
        x: cx + (Math.random() - 0.5) * 60,
        y: cy + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 6,
        alpha: 1,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        w: isRect ? 7 + Math.random() * 6 : 4 + Math.random() * 5,
        h: isRect ? 3 + Math.random() * 4 : 4 + Math.random() * 5,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.25,
        isRect,
        decay: 0.011 + Math.random() * 0.009,
        gravity: 0.14 + Math.random() * 0.1,
      });
    }

    let frame;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.vy += p.gravity; p.vx *= 0.99;
        p.rot += p.rotSpeed;
        p.alpha -= p.decay;
        if (p.alpha <= 0) { particles.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if (p.isRect) {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if (particles.length > 0) frame = requestAnimationFrame(animate);
      else onDone?.();
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, zIndex: 9997, pointerEvents: "none" }} />;
}

// Badge pop for tier UP (non-mastery)
export function TierPop({ tierAfter, onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); onDone?.(); }, 1800);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9996, pointerEvents: "none",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: MASTERY_COLORS[tierAfter] || "var(--accent)",
        color: "#fff",
        borderRadius: 20,
        padding: "14px 28px",
        fontSize: 18,
        fontWeight: 700,
        fontFamily: "var(--font-display)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        animation: "tierPopIn 0.35s cubic-bezier(.34,1.56,.64,1) both",
        letterSpacing: 0.5,
        textAlign: "center",
      }}>
        ⭐ {MASTERY_LABELS[tierAfter]}
        <div style={{ fontSize: 12, fontWeight: 400, marginTop: 3, opacity: 0.88 }}>Nytt nivå!</div>
      </div>
      <style>{`@keyframes tierPopIn { from { transform: scale(0.4) translateY(30px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }`}</style>
    </div>
  );
}

export default function PointsBadge({ pointsInfo }) {
  if (!pointsInfo) return null;
  const { pts, ptsBefore, tierBefore, tierAfter } = pointsInfo;
  const tierChanged = tierAfter !== tierBefore;
  const delta = pts - ptsBefore;
  const isMastered = pts >= MASTERY_POINTS;

  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.12)", display: "flex", flexDirection: "column", gap: 5, alignItems: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: delta > 0 ? "var(--color-success)" : delta < 0 ? "var(--color-error)" : "var(--text-subtle)" }}>
          {delta > 0 ? `+${delta}` : delta < 0 ? delta : "~"}
        </div>
        <div style={{ height: 6, width: 100, background: "rgba(0,0,0,0.12)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${Math.min(100, (pts / MASTERY_POINTS) * 100)}%`, background: isMastered ? "var(--color-success)" : "var(--accent)", borderRadius: 99, transition: "width 0.4s ease" }} />
        </div>
        <div style={{ fontSize: 12, color: "var(--text-subtle)", whiteSpace: "nowrap" }}>{pts} / {MASTERY_POINTS}</div>
      </div>

      {tierChanged ? (
        <div style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ color: MASTERY_COLORS[tierBefore], textDecoration: "line-through", opacity: 0.7 }}>{MASTERY_LABELS[tierBefore]}</span>
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
