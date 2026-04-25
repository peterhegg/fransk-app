import { useState, useRef, useEffect } from "react";
import { PROXY_URL, APP_TOKEN, BOOK_EXCERPTS, SESSION_KEY } from "../constants.js";
import { todayStr, renderMessage, extractSuggestions, stripSuggestions, parseLearnLine, buildSystemPrompt, loadUserProfile, getActiveGoal, loadGoalOrder } from "../utils.jsx";

const SYSTEM_PROMPT = buildSystemPrompt(loadUserProfile());
import BottomNav from "../components/BottomNav.jsx";

export default function ChatScreen({ mode, words, setWords, isOnline, speak, speaking, sessionMsgs, setSessionMsgs, onBack, onShowWords, screen, showWords, onNav }) {
  const [messages, setMessages] = useState(() => {
    const starter = mode?.id === "teksthjelp"
      ? "Lim inn fransk tekst, still spørsmål om ord, eller be meg oversette noe.\n\nDu kan også velge en setning fra bøkene dine nedenfor."
      : "Hva lurer du på om fransk? Du kan også skrive «Pierre» hvis du vil øve med en virtuell franskmann.";
    return [{ role: "assistant", content: starter, mode: mode?.id }];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showBooks, setShowBooks] = useState(false);
  const [recentTexts, setRecentTexts] = useState(() => { try { return JSON.parse(localStorage.getItem("fransk-recent-texts") || "[]"); } catch { return []; } });
  const bottomRef = useRef(null);
  const abortRef = useRef(null);
  const textareaRef = useRef(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const diff = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardOffset(diff);
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { return () => { abortRef.current?.abort(); }; }, []);

  const processedMsgCount = useRef(0);
  useEffect(() => {
    const newMsgs = messages.slice(processedMsgCount.current);
    newMsgs.forEach(msg => {
      if (msg.role === "assistant") {
        [...(msg.content.matchAll(/✓ LÆRT: .+/g) || [])].forEach(m => {
          const parsed = parseLearnLine(m[0]);
          setWords(prev => {
            if (prev.some(w => w.fr === parsed.fr)) return prev;
            const currentGoalId = getActiveGoal(prev, loadGoalOrder()).id;
            return [...prev, { id: Date.now() + Math.random(), ...parsed, level: 0, nextReview: Date.now() + 86400000, added: Date.now(), goal: currentGoalId }];
          });
        });
      }
    });
    processedMsgCount.current = messages.length;
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
    const wordSample = words.length > 0
      ? [...words].sort((a, b) => (a.points || 0) - (b.points || 0)).slice(0, 80)
      : [];
    const san = s => String(s || "").replace(/\n/g, " ").slice(0, 60);
    const wordCtx = wordSample.length > 0
      ? `\n\nElevens ordbank (${words.length} ord totalt, viser ${wordSample.length} minst mestrede):\n` +
        wordSample.map(w => `- ${san(w.fr)}${w.no ? ` = ${san(w.no)}` : ""}${w.phonetic ? ` (${san(w.phonetic)})` : ""} [niv. ${w.level}]`).join("\n") +
        `\n\nDisse ordene KAN eleven. Ikke re-introduser dem som nye. Bygg heller samtaler der disse ordene inngår naturlig.`
      : "";
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch(PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-App-Token": APP_TOKEN },
        signal: controller.signal,
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
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
    } catch (err) {
      if (err.name !== "AbortError") {
        setMessages([...next, { role: "assistant", content: "Kunne ikke koble til. Prøv igjen." }]);
      }
    }
    setLoading(false);
  };

  const suggestions = (() => {
    const last = [...messages].reverse().find(m => m.role === "assistant");
    return last && !loading ? extractSuggestions(last.content) : [];
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 84 + keyboardOffset }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16 }}>
          <span style={{ color: "var(--accent)" }}>{mode?.icon}</span><span>{mode?.label}</span>
        </div>
        <button onClick={onShowWords} style={{ background: "none", border: "1px solid rgba(46,107,230,0.3)", borderRadius: 20, color: "var(--accent)", fontSize: 12, padding: "4px 12px", cursor: "pointer", fontFamily: "var(--font-body)" }}>◈ {words.length}</button>
      </div>

      {!isOnline && (
        <div style={{ background: "rgba(46,107,230,0.08)", borderBottom: "1px solid var(--border)", padding: "8px 16px", fontSize: 13, color: "var(--accent)", textAlign: "center" }}>
          Ingen internettforbindelse — Claude er ikke tilgjengelig
        </div>
      )}

      {mode?.id === "teksthjelp" && (
        <button onClick={() => setShowBooks(b => !b)}
          style={{ background: "rgba(46,107,230,0.04)", border: "none", borderBottom: "1px solid var(--border)", color: "var(--accent)", fontFamily: "var(--font-body)", fontSize: 13, padding: "10px 16px", cursor: "pointer", textAlign: "left", width: "100%" }}>
          {showBooks ? "▲ Lukk boksamling" : "▼ Velg setning fra bøkene dine"}
        </button>
      )}
      {showBooks && (
        <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto" }}>
          {recentTexts.length > 0 && (
            <>
              <div style={{ fontSize: 10, color: "var(--text-subtle)", letterSpacing: 2, textTransform: "uppercase" }}>Nylig brukt</div>
              {recentTexts.map((t, i) => (
                <button key={`r${i}`} onClick={() => { setInput(t); setShowBooks(false); }}
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-body)", outline: "none" }}>
                  <div style={{ fontSize: 13, color: "var(--text)", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>"{t}"</div>
                </button>
              ))}
              <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
            </>
          )}
          {BOOK_EXCERPTS.map((ex, i) => (
            <button key={i} onClick={() => { setInput(ex.text); setShowBooks(false); }}
              style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-body)", outline: "none" }}>
              <div style={{ fontSize: 11, color: "var(--accent)", letterSpacing: 1, marginBottom: 4, opacity: 0.8 }}>{ex.book} · {ex.hint}</div>
              <div style={{ fontSize: 14, color: "var(--text)", fontStyle: "italic" }}>"{ex.text}"</div>
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 24px", display: "flex", flexDirection: "column", gap: 16, justifyContent: "flex-end" }}>
        {messages.map((msg, i) => (
          <div key={i} style={msg.role === "user"
            ? { alignSelf: "flex-end", maxWidth: "80%", background: "var(--accent-bg)", border: "1px solid rgba(46,107,230,0.2)", borderRadius: "18px 4px 18px 18px", padding: "12px 16px", fontSize: 15, lineHeight: 1.6 }
            : msg.content.includes("✓ LÆRT:")
              ? { alignSelf: "flex-start", maxWidth: "88%", background: "rgba(0,184,148,0.08)", border: "1px solid rgba(0,184,148,0.3)", borderRadius: "4px 18px 18px 18px", padding: "12px 16px", boxShadow: "var(--shadow-sm)" }
              : { alignSelf: "flex-start", maxWidth: "88%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px 18px 18px 18px", padding: "12px 16px", boxShadow: "var(--shadow-sm)" }
          }>
            {msg.role === "assistant" && (
              <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Claude ✦</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => speak(stripSuggestions(msg.content))} style={{ background: "none", border: "none", color: speaking ? "var(--accent)" : "rgba(46,107,230,0.5)", fontSize: 14, cursor: "pointer", padding: 0 }}>🔊</button>
                  <button onClick={() => speak(stripSuggestions(msg.content), 0.4)} style={{ background: "none", border: "none", color: speaking ? "var(--accent)" : "rgba(46,107,230,0.5)", fontSize: 14, cursor: "pointer", padding: 0 }}>🐢</button>
                </div>
              </div>
            )}
            <div style={{ fontSize: 15, lineHeight: 1.75, color: "var(--text)" }}>{renderMessage(msg.role === "assistant" ? stripSuggestions(msg.content) : msg.content)}</div>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", maxWidth: "88%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px 18px 18px 18px", padding: "12px 16px" }}>
            <div style={{ fontSize: 10, color: "var(--accent)", letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" }}>Claude ✦</div>
            <div style={{ display: "flex", gap: 6, fontSize: 28, color: "var(--accent)", opacity: 0.5 }}><span>·</span><span>·</span><span>·</span></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {suggestions.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "8px 16px 0", background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => send(s)} className="suggestion-chip"
              style={{ background: "none", border: "1px solid rgba(46,107,230,0.35)", borderRadius: 20, color: "var(--accent)", fontFamily: "var(--font-body)", fontSize: 13, padding: "6px 14px", cursor: "pointer" }}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, padding: "12px 16px", borderTop: "1px solid var(--border)", background: "var(--surface)", alignItems: "flex-end" }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          onFocus={() => setTimeout(() => textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 300)}
          placeholder="Skriv her..." className="input-glow"
          style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 15, padding: "10px 14px", resize: "none", outline: "none", lineHeight: 1.5 }}
          rows={2} />
        <button onClick={() => send()} disabled={loading || !input.trim()}
          style={{ background: loading || !input.trim() ? "var(--accent-bg)" : "linear-gradient(135deg, var(--accent), var(--accent-light))", border: "none", borderRadius: 14, color: loading || !input.trim() ? "var(--text-subtle)" : "white", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 14, padding: "10px 18px", cursor: loading || !input.trim() ? "default" : "pointer", whiteSpace: "nowrap" }}>
          Send
        </button>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}
