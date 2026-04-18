import { motion } from "framer-motion";

const MicIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8"  y1="23" x2="16" y2="23"/>
  </svg>
);

const WaveformBars = () => {
  const bars = [
    { height: 12, delay: 0.00 },
    { height: 22, delay: 0.10 },
    { height: 16, delay: 0.20 },
    { height: 24, delay: 0.05 },
    { height: 10, delay: 0.15 },
  ];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      {bars.map((b, i) => (
        <motion.div
          key={i}
          style={{ width: 3, height: b.height, borderRadius: 2, background: "white", originY: 0.5 }}
          animate={{ scaleY: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 0.65, delay: b.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
};

const orbAnimations = {
  idle: {
    animate: { scale: [1, 1.045, 1] },
    transition: { repeat: Infinity, duration: 2.8, ease: "easeInOut" },
  },
  listening: {
    animate: { scale: 1.06 },
    transition: { type: "spring", stiffness: 400, damping: 30 },
  },
  thinking: {
    animate: { opacity: [1, 0.68, 1], scale: [1, 0.96, 1] },
    transition: { repeat: Infinity, duration: 1.1, ease: "easeInOut" },
  },
  speaking: {
    animate: { scale: [1, 1.03, 1] },
    transition: { repeat: Infinity, duration: 0.75, ease: "easeInOut" },
  },
};

const shadows = {
  idle:      "0 8px 32px rgba(108,92,231,0.35)",
  listening: "0 8px 40px rgba(108,92,231,0.60)",
  thinking:  "0 8px 24px rgba(108,92,231,0.25)",
  speaking:  "0 8px 40px rgba(108,92,231,0.50)",
};

const labels = {
  idle:      "Trykk for å snakke",
  listening: "Lytter…",
  thinking:  "Tenker…",
  speaking:  "Trykk for å avbryte",
};

export default function VoiceOrb({ status, onClick, disabled }) {
  const anim = orbAnimations[status] || orbAnimations.idle;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div style={{ position: "relative", width: 88, height: 88 }}>

        {status === "listening" && (
          <>
            <span className="voice-ring voice-ring-1" />
            <span className="voice-ring voice-ring-2" />
            <span className="voice-ring voice-ring-3" />
          </>
        )}

        <motion.button
          onClick={onClick}
          disabled={disabled}
          aria-label={status === "listening" ? "Stop listening" : "Start speaking"}
          animate={anim.animate}
          transition={anim.transition}
          whileTap={!disabled ? { scale: 0.93 } : {}}
          style={{
            position: "relative",
            zIndex: 1,
            width: 88,
            height: 88,
            borderRadius: "50%",
            border: "none",
            cursor: disabled ? "default" : "pointer",
            background: status === "listening"
              ? "linear-gradient(135deg, #8B7FF0, var(--accent))"
              : "linear-gradient(135deg, var(--accent), var(--accent-light))",
            boxShadow: shadows[status] || shadows.idle,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "box-shadow 0.3s ease, background 0.3s ease",
            opacity: disabled ? 0.5 : 1,
          }}
        >
          {status === "speaking" ? <WaveformBars /> : <MicIcon />}
        </motion.button>
      </div>

      <motion.div
        key={status}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        style={{
          fontSize: "var(--font-size-sm)",
          color: "var(--text-subtle)",
          fontFamily: "var(--font-body)",
          minHeight: 18,
          textAlign: "center",
          letterSpacing: 0.2,
        }}
      >
        {labels[status] || ""}
      </motion.div>
    </div>
  );
}
