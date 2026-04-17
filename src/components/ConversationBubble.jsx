export default function ConversationBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: isUser ? "flex-end" : "flex-start",
    }}>
      <div style={{
        maxWidth: "82%",
        padding: "10px 14px",
        borderRadius: isUser ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
        background: isUser ? "var(--accent-bg)" : "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: isUser ? "none" : "var(--shadow-sm)",
        fontSize: 15,
        lineHeight: 1.65,
        color: "var(--text)",
        fontFamily: isUser ? "var(--font-body)" : "var(--font-display)",
        fontStyle: isUser ? "normal" : "italic",
      }}>
        {message.content}
      </div>
    </div>
  );
}
