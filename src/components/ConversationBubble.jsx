import { motion } from "framer-motion";

export default function ConversationBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
      }}
    >
      <div style={{
        maxWidth: "82%",
        padding: "10px 14px",
        borderRadius: isUser ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
        background: isUser ? "var(--accent-bg)" : "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: isUser ? "none" : "var(--shadow-sm)",
        fontSize: "var(--font-size-base)",
        lineHeight: "var(--line-height-relaxed)",
        color: "var(--text)",
        fontFamily: isUser ? "var(--font-body)" : "var(--font-display)",
        fontStyle: isUser ? "normal" : "italic",
      }}>
        {message.content}
      </div>
    </motion.div>
  );
}
