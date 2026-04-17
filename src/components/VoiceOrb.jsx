export default function VoiceOrb({ status, onClick, disabled }) {
  const icons = {
    idle: "🎙️",
    listening: "🎙️",
    thinking: "💭",
    speaking: "🔊",
  };

  const shadows = {
    idle: "0 8px 32px rgba(108,92,231,0.35)",
    listening: "0 8px 40px rgba(108,92,231,0.60)",
    thinking: "0 8px 24px rgba(108,92,231,0.25)",
    speaking: "0 8px 40px rgba(108,92,231,0.50)",
  };

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

        <button
          onClick={onClick}
          disabled={disabled}
          aria-label={status === "listening" ? "Stop listening" : "Start speaking"}
          className={`voice-orb voice-orb--${status}`}
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
            fontSize: 30,
            transition: "box-shadow 0.3s ease, background 0.3s ease",
            opacity: disabled ? 0.5 : 1,
          }}
        >
          {icons[status] || icons.idle}
        </button>
      </div>

      <div style={{
        fontSize: 13,
        color: "var(--text-subtle)",
        fontFamily: "var(--font-body)",
        minHeight: 18,
        textAlign: "center",
        letterSpacing: 0.2,
      }}>
        {{
          idle: "Trykk for å snakke",
          listening: "Lytter…",
          thinking: "Tenker…",
          speaking: "Trykk for å avbryte",
        }[status] || ""}
      </div>
    </div>
  );
}
