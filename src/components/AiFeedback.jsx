import { useState, useRef, useEffect } from "react";
import { PROXY_URL, APP_TOKEN } from "../constants.js";

// Reusable "request explanation on wrong answer" button + result display.
// Used by every text-answer exercise (vocab, grammar, sentence games) so the
// learner can ask Pierre WHY an answer was wrong — specific to the exact words,
// not generic rules. Caller supplies a buildPrompt() that returns the user
// message; the model must answer {"forklaring":"...","huskeregel":"..."}.
export default function AiFeedback({ isOnline, resetKey, buildPrompt, label = "💡 Få tilbakemelding", style }) {
  const [hint, setHint] = useState(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    setHint(null);
    setLoading(false);
    abortRef.current?.abort();
  }, [resetKey]);

  const request = () => {
    if (!isOnline || loading || hint) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-App-Token": APP_TOKEN },
      signal: controller.signal,
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 240,
        system: "Respond only with a valid JSON object, no markdown.",
        messages: [{ role: "user", content: buildPrompt() }],
      }),
    })
      .then(r => r.json())
      .then(data => {
        const text = data.content?.find(b => b.type === "text")?.text || "";
        const match = text.match(/\{[\s\S]*?\}/);
        if (match) setHint(JSON.parse(match[0]));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  if (!isOnline) return null;

  if (!hint && !loading) {
    return (
      <button
        onClick={request}
        style={{ background: "none", border: "1px solid var(--border)", borderRadius: 10, padding: "7px 14px", fontSize: 12, color: "var(--text-subtle)", cursor: "pointer", fontFamily: "var(--font-body)", ...style }}
      >
        {label}
      </button>
    );
  }

  return (
    <div style={{ background: "rgba(230,211,168,0.04)", border: "1px solid rgba(230,211,168,0.14)", borderRadius: 12, padding: "12px 16px", width: "100%", maxWidth: 360, ...style }}>
      {loading ? (
        <div style={{ fontSize: 12, color: "var(--text-subtle)", opacity: 0.7, textAlign: "center" }}>🤔 Analyserer…</div>
      ) : (
        <>
          {hint.forklaring && (
            <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.65, marginBottom: hint.huskeregel ? 8 : 0 }}>{hint.forklaring}</div>
          )}
          {hint.huskeregel && (
            <>
              <div style={{ fontSize: 10, color: "var(--cream-deep)", letterSpacing: 2, marginBottom: 4 }}>Huskeregel</div>
              <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.65, fontStyle: "italic" }}>{hint.huskeregel}</div>
            </>
          )}
        </>
      )}
    </div>
  );
}
