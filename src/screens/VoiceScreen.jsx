import { useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useConversation } from "../hooks/useConversation.jsx";
import VoiceOrb from "../components/VoiceOrb.jsx";
import CorrectionCard from "../components/CorrectionCard.jsx";
import ConversationBubble from "../components/ConversationBubble.jsx";
import BottomNav from "../components/BottomNav.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";

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
    if (status === "idle" || status === "error") startListening();
    else if (status === "listening") stopListening();
    else if (status === "speaking")  stopListening();
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100dvh",
      background: "var(--app-bg)",
      fontFamily: "var(--font-body)",
    }}>

      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--space-3) var(--space-5)",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        boxShadow: "var(--shadow-sm)",
        flexShrink: 0,
      }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", color: "var(--accent)",
          fontSize: "var(--font-size-sm)", cursor: "pointer",
          fontFamily: "var(--font-body)", padding: 0,
        }}>
          ← Tilbake
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <span style={{
            fontSize: "var(--font-size-base)",
            fontWeight: "var(--font-weight-medium)",
            color: "var(--text)",
          }}>
            Samtale
          </span>
          <motion.span
            key={estimatedLevel}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{
              fontSize: "var(--font-size-xs)",
              background: "var(--accent-bg)",
              color: "var(--accent)",
              borderRadius: "var(--radius-full)",
              padding: "2px 8px",
              fontWeight: "var(--font-weight-medium)",
            }}
          >
            {estimatedLevel}
          </motion.span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <ThemeToggle />
          {history.length > 0 ? (
            <button onClick={reset} style={{
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-subtle)",
              fontSize: "var(--font-size-xs)",
              padding: "4px 10px",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
            }}>
              Ny
            </button>
          ) : (
            <div style={{ width: 32 }} />
          )}
        </div>
      </div>

      {/* Conversation scroll area */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "var(--space-5) var(--space-4) 0",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
        scrollbarWidth: "none",
      }}>

        {history.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--space-4)",
              padding: "var(--space-12) var(--space-6)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 44 }}>🇫🇷</div>
            <div style={{
              fontSize: "var(--font-size-xl)",
              fontWeight: "var(--font-weight-semibold)",
              color: "var(--text)",
              letterSpacing: "-0.2px",
            }}>
              Klar til å snakke?
            </div>
            <div style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--text-subtle)",
              lineHeight: "var(--line-height-relaxed)",
              maxWidth: 270,
            }}>
              Trykk på mikrofonen og si noe på fransk. Claude svarer på fransk og retter forsiktig én feil om gangen.
            </div>
            {!isSpeechSupported && (
              <div style={{
                fontSize: "var(--font-size-sm)",
                color: "var(--color-error)",
                background: "rgba(225,112,85,0.08)",
                border: "1px solid rgba(225,112,85,0.2)",
                borderRadius: "var(--radius-md)",
                padding: "12px 16px",
                maxWidth: 280,
                lineHeight: "var(--line-height-normal)",
              }}>
                Nettleseren din støtter ikke talegjenkjenning. Prøv Chrome eller Safari på iOS/Android.
              </div>
            )}
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {history.map((msg, i) => {
            const isLastUser = msg.role === "user" && i === history.length - 1;
            const showCorrection = isLastUser && currentCorrection;
            return (
              <motion.div
                key={i}
                layout
                style={{ display: "flex", flexDirection: "column" }}
              >
                <ConversationBubble message={msg} />
                <AnimatePresence>
                  {showCorrection && (
                    <CorrectionCard correction={currentCorrection} />
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <div ref={bottomRef} style={{ height: 4 }} />
      </div>

      {/* Orb area */}
      <div style={{
        padding: "var(--space-5) 0 104px",
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
          key={status === "error" ? "error" : "normal"}
        />
      </div>

      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}
