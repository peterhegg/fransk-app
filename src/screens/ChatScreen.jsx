import { useState, useRef, useEffect } from "react";
import { PROXY_URL, SYSTEM_PROMPT, BOOK_EXCERPTS, SESSION_KEY, gold, dark, cream, card, brd, grn } from "../constants.js";
import { todayStr, renderMessage, extractSuggestions, stripSuggestions, parseLearnLine } from "../utils.jsx";
import BottomNav from "../components/BottomNav.jsx";

export default function ChatScreen({ mode, words, setWords, isOnline, speak, speaking, sessionMsgs, setSessionMsgs, onBack, onShowWords, screen, showWords, onNav }) {
  const [messages, setMessages] = useState(() => {
    const starter = mode?.id === "teksthjelp"
      ? "Lim inn en setning eller lengre tekst på fransk — jeg tilpasser meg automatisk.\n\nDu kan også velge en setning fra bøkene dine nedenfor."
      : "Hva lurer du på om fransk? Du kan også skrive «Pierre» hvis du vil øve med en virtuell franskmann.";
    return [{ role: "assistant", content: starter, mode: mode?.id }];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBooks, setShowBooks] = useState(false);
  const [recentTexts, setRecentTexts] = useState(() => { try { return JSON.parse(localStorage.getItem("fransk-recent-texts") || "[]"); } catch { return []; } });
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  // Save words from assistant messages (if any ✓ LÆRT: markers)
  useEffect(() => {
    messages.forEach(msg => {
      if (msg.role === "assistant") {
        [...(msg.content.matchAll(/✓ LÆRT: .+/g) || [])].forEach(m => {
          const parsed = parseLearnLine(m[0]);
          setWords(prev => {
            if (prev.some(w => w.fr === parsed.fr)) return prev;
            return [...prev, { id: Date.now() + Math.random(), ...parsed, level: 0, nextReview: Date.now() + 86400000, added: Date.now() }];
          });
        });
      }
    });
  }, [messages]);

  const send = async (override) => {
    const text = (override || input).trim();
    if (!text || loading) return;
    setInput("");
    const next = [...messages, { role: "user", content: text }];
    setMessages(next); setLoading(true);
    setSessionMsgs(s => {
      const n = s + 1;
      try { localStorage.setItem(SESSION_KEY, JSON.stringify({ date: todayStr(), count: n })); } catch {}
      return n;
    });
    const wordCtx = words.length > 0
      ? `\n\nElevens ordbank (${words.length} ord):\n` + words.map(w => `- ${w.fr}${w.no ? ` = ${w.no}` : ""}${w.phonetic ? ` (${w.phonetic})` : ""} [niv. ${w.level}]`).join("\n") +
        `\n\nDisse ordene KAN eleven. Ikke re-introduser dem som nye. Bygg heller samtaler der disse ordene inngår naturlig.`
      : "";
    try {
      const res = await fetch(PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 800,
          system: SYSTEM_PROMPT + wordCtx + `\nModus: ${mode?.label?.toUpperCase()}`,
          messages: next.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const budgetHit = data.error?.message?.toLowerCase().includes("budget") || data.error?.message?.toLowerCase().includes("daily");
      const reply = data.content?.find(b => b.type === "text")?.text ||
        (budgetHit ? "Daglig grense er nådd. Appen åpner igjen ved midnatt (UTC)." : data.error ? `Feil: ${data.error.message}` : "Noe gikk galt.");
      if (mode?.id === "teksthjelp" && text) {
        setRecentTexts(prev => {
          const n2 = [text, ...prev.filter(t => t !== text)].slice(0, 5);
          localStorage.setItem("fransk-recent-texts", JSON.stringify(n2));
          return n2;
        });
      }
      setMessages([...next, { role: "assistant", content: reply, mode: mode?.id }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Kunne ikke koble til. Prøv igjen." }]);
    }
    setLoading(false);
  };

  const suggestions = (() => {
    const last = [...messages].reverse().find(m => m.role === "assistant");
    return last && !loading ? extractSuggestions(last.content) : [];
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#f5f0e6", fontFamily: "'Jost', sans-serif", color: cream, paddingBottom: 66 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${brd}`, background: card, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: gold, fontSize: 14, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>← Tilbake</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, letterSpacing: 2 }}><span style={{ color: gold }}>{mode?.icon}</span><span>{mode?.label}</span></div>
        <button onClick={onShowWords} style={{ background: "none", border: `1px solid ${gold}44`, borderRadius: 20, color: gold, fontSize: 12, padding: "4px 12px", cursor: "pointer", fontFamily: "'Jost', sans-serif", letterSpacing: 1 }}>◈ {words.length}</button>
      </div>

      {!isOnline && (
        <div style={{ background: "#3a2a10", borderBottom: `1px solid ${gold}44`, padding: "8px 16px", fontSize: 13, color: gold, textAlign: "center", letterSpacing: 1 }}>
          Ingen internettforbindelse — Claude er ikke tilgjengelig
        </div>
      )}

      {mode?.id === "teksthjelp" && (
        <button onClick={() => setShowBooks(b => !b)}
          style={{ background: "rgba(201,168,76,0.06)", border: "none", borderBottom: `1px solid ${brd}`, color: gold, fontFamily: "'Jost', sans-serif", fontSize: 13, padding: "10px 16px", cursor: "pointer", textAlign: "left", letterSpacing: 1, width: "100%" }}>
          {showBooks ? "▲ Lukk boksamling" : "▼ Velg setning fra bøkene dine"}
        </button>
      )}
      {showBooks && (
        <div style={{ background: card, borderBottom: `1px solid ${brd}`, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto" }}>
          {recentTexts.length > 0 && (
            <>
              <div style={{ fontSize: 10, color: `${gold}88`, letterSpacing: 2, textTransform: "uppercase" }}>Nylig brukt</div>
              {recentTexts.map((t, i) => (
                <button key={`r${i}`} onClick={() => { setInput(t); setShowBooks(false); }}
                  style={{ background: "#f5f0e6", border: `1px solid ${gold}33`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", textAlign: "left", fontFamily: "'Jost', sans-serif", outline: "none" }}>
                  <div style={{ fontSize: 13, color: cream, fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>"{t}"</div>
                </button>
              ))}
              <div style={{ height: 1, background: brd, margin: "4px 0" }} />
            </>
          )}
          {BOOK_EXCERPTS.map((ex, i) => (
            <button key={i} onClick={() => { setInput(ex.text); setShowBooks(false); }}
              style={{ background: "#f5f0e6", border: `1px solid ${brd}`, borderRadius: 8, padding: "10px 14px", cursor: "pointer", textAlign: "left", fontFamily: "'Jost', sans-serif", outline: "none" }}>
              <div style={{ fontSize: 11, color: gold, letterSpacing: 1, marginBottom: 4, opacity: 0.8 }}>{ex.book} · {ex.hint}</div>
              <div style={{ fontSize: 14, color: cream, fontStyle: "italic" }}>"{ex.text}"</div>
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.map((msg, i) => (
          <div key={i} style={msg.role === "user"
            ? { alignSelf: "flex-end", maxWidth: "80%", background: "rgba(200,120,58,0.1)", border: `1px solid ${gold}44`, borderRadius: "18px 4px 18px 18px", padding: "12px 16px", fontSize: 15, lineHeight: 1.6 }
            : msg.content.includes("✓ LÆRT:")
              ? { alignSelf: "flex-start", maxWidth: "88%", background: "rgba(76,175,122,0.08)", border: `1px solid ${grn}66`, borderRadius: "4px 18px 18px 18px", padding: "12px 16px", boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }
              : { alignSelf: "flex-start", maxWidth: "88%", background: card, border: `0.5px solid ${brd}`, borderRadius: "4px 18px 18px 18px", padding: "12px 16px", boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }
          }>
            {msg.role === "assistant" && (
              <div style={{ fontSize: 10, color: gold, letterSpacing: 2, marginBottom: 6, textTransform: "uppercase", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Claude ✦</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => speak(stripSuggestions(msg.content))} style={{ background: "none", border: "none", color: speaking ? gold : `${gold}88`, fontSize: 14, cursor: "pointer", padding: 0 }}>🔊</button>
                  <button onClick={() => speak(stripSuggestions(msg.content), 0.4)} style={{ background: "none", border: "none", color: speaking ? gold : `${gold}88`, fontSize: 14, cursor: "pointer", padding: 0 }}>🐢</button>
                </div>
              </div>
            )}
            <div style={{ fontSize: 15, lineHeight: 1.75, color: cream }}>{renderMessage(msg.role === "assistant" ? stripSuggestions(msg.content) : msg.content)}</div>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", maxWidth: "88%", background: card, border: `0.5px solid ${brd}`, borderRadius: "4px 18px 18px 18px", padding: "12px 16px" }}>
            <div style={{ fontSize: 10, color: gold, letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Claude ✦</div>
            <div style={{ display: "flex", gap: 6, fontSize: 28, color: gold, opacity: 0.5 }}><span>·</span><span>·</span><span>·</span></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {suggestions.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "8px 16px 0", background: card, borderTop: `1px solid ${brd}` }}>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => send(s)} className="suggestion-chip"
              style={{ background: "none", border: `1px solid ${gold}55`, borderRadius: 20, color: gold, fontFamily: "'Jost', sans-serif", fontSize: 13, padding: "6px 14px", cursor: "pointer", letterSpacing: 0.5 }}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, padding: "12px 16px", borderTop: `1px solid ${brd}`, background: card, alignItems: "flex-end" }}>
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Skriv her..." className="input-glow"
          style={{ flex: 1, background: "#f5f0e6", border: `0.5px solid ${brd}`, borderRadius: 10, color: cream, fontFamily: "'Jost', sans-serif", fontSize: 15, padding: "10px 14px", resize: "none", outline: "none", lineHeight: 1.5 }}
          rows={2} />
        <button onClick={() => send()} disabled={loading || !input.trim()}
          style={{ background: loading || !input.trim() ? "rgba(200,120,58,0.3)" : `linear-gradient(135deg, #d98a4a, ${gold})`, border: "none", borderRadius: 14, color: loading || !input.trim() ? `${cream}88` : dark, fontFamily: "'Jost', sans-serif", fontWeight: "500", fontSize: 14, padding: "10px 18px", cursor: loading || !input.trim() ? "default" : "pointer", letterSpacing: 1, whiteSpace: "nowrap" }}>
          Send
        </button>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}
