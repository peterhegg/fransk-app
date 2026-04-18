import { useRef, useEffect } from "react";
import { useConversation } from "../hooks/useConversation.jsx";
import VoiceOrb from "../components/VoiceOrb.jsx";
import CorrectionCard from "../components/CorrectionCard.jsx";
import ConversationBubble from "../components/ConversationBubble.jsx";
import BottomNav from "../components/BottomNav.jsx";

const isSpeechSupported = !!(
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition)
);

export default function VoiceScreen({ onBack, screen, showWords, onNav }) {
  const {
    history,
    status,
    currentCorrection,
    estimatedLevel,
    startListening,
    stopListening,
    reset,
  } = useConversation();

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, currentCorrection]);

  const handleOrbClick = () => {
    if (status === "idle") startListening();
    else if (status === "listening") stopListening();
    else if (status === "speaking") stopListening();
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100dvh",
      background: "var(--bg)",
      fontFamily: "var(--font-body)",
    }}>

      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 20px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        boxShadow: "var(--shadow-sm)",
        flexShrink: 0,
      }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", color: "var(--accent)",
          fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)",
        }}>
          ← Tilbake
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text)" }}>Samtale</span>
          <span style={{
            fontSize: 11, background: "var(--accent-bg)", color: "var(--accent)",
            borderRadius: 20, padding: "2px 8px", fontWeight: 500,
          }}>
            {estimatedLevel}
          </span>
        </div>

        {history.length > 0 ? (
          <button onClick={reset} style={{
            background: "none", border: "1px solid var(--border)", borderRadius: 8,
            color: "var(--text-subtle)", fontSize: 12, padding: "4px 10px",
            cursor: "pointer", fontFamily: "var(--font-body)",
          }}>
            Ny
          </button>
        ) : (
          <div style={{ width: 42 }} />
        )}
      </div>

      {/* Conversation scroll area */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "20px 16px 0",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        scrollbarWidth: "none",
      }}>

        {history.length === 0 && (
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            padding: "48px 24px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: 44 }}>🇫🇷</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>
              Klar til å snakke?
            </div>
            <div style={{ fontSize: 14, color: "var(--text-subtle)", lineHeight: 1.65, maxWidth: 270 }}>
              Trykk på mikrofonen og si noe på fransk. Claude svarer på fransk og retter forsiktig én feil om gangen.
            </div>
            {!isSpeechSupported && (
              <div style={{
                fontSize: 13,
                color: "var(--color-error)",
                background: "rgba(225,112,85,0.08)",
                border: "1px solid rgba(225,112,85,0.2)",
                borderRadius: 12,
                padding: "12px 16px",
                maxWidth: 280,
                lineHeight: 1.5,
              }}>
                Nettleseren din støtter ikke talegjenkjenning. Prøv Chrome eller Safari på iOS/Android.
              </div>
            )}
          </div>
        )}

        {history.map((msg, i) => {
          const isLastUser = msg.role === "user" && i === history.length - 1;
          const showCorrection = isLastUser && currentCorrection;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column" }}>
              <ConversationBubble message={msg} />
              {showCorrection && <CorrectionCard correction={currentCorrection} />}
            </div>
          );
        })}

        <div ref={bottomRef} style={{ height: 4 }} />
      </div>

      {/* Orb area */}
      <div style={{
        padding: "20px 0 104px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: "var(--bg)",
        flexShrink: 0,
      }}>
        <VoiceOrb
          status={status}
          onClick={isSpeechSupported ? handleOrbClick : undefined}
          disabled={!isSpeechSupported || status === "thinking"}
        />
      </div>

      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}
