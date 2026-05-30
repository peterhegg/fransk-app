import { useState } from "react";
import { PROXY_URL, APP_TOKEN } from "../constants.js";
import { loadUserProfile, logGameSession, logDailyAnswer } from "../utils.jsx";
import BottomNav from "../components/BottomNav.jsx";

const SCENARIOS = [
  { id: "restaurant", label: "På restaurant",    icon: "🍽️", desc: "Bestill mat og drikke",          role: "a friendly French waiter at a cozy Parisian bistro" },
  { id: "kafe",       label: "På kafeen",         icon: "☕", desc: "Bestill kaffe og et lite måltid", role: "a French café waiter in a Parisian café" },
  { id: "butikk",     label: "I butikken",         icon: "🛍️", desc: "Kjøp klær eller suvenirer",     role: "a helpful French boutique shopkeeper" },
  { id: "tog",        label: "På togstasjonen",    icon: "🚂", desc: "Kjøp billett, finn rett tog",    role: "a French train station clerk at Gare du Nord" },
  { id: "hotell",     label: "På hotellet",        icon: "🏨", desc: "Sjekk inn og få hjelp",          role: "a friendly French hotel receptionist" },
  { id: "marked",     label: "På markedet",        icon: "🥖", desc: "Kjøp brød, ost og frukt",        role: "a French market vendor selling bread, cheese and produce" },
];

const MAX_TURNS = 6;

function systemPrompt(scenario, profile, words) {
  const vocabList = words && words.length > 0
    ? words.map(w => w.fr).join(", ")
    : null;

  return `You are a French conversation partner playing the role of ${scenario.role}. You help a Norwegian ${profile.level || "A1/A2"} learner${profile.dysleksi ? " with dyslexia" : ""} practice real French.

RULES:
- Your French replies must be short and simple (A1/A2, max 1-2 sentences).
- Always include a Norwegian translation of your reply.
- Always give exactly 3 response options the learner can say. Options must be realistic for the scenario, at A1/A2 level, and meaningfully different from each other. Use vocabulary from the student's word list where possible.
- Only set done:true after the conversation has had ${MAX_TURNS} full exchanges. Never before.

ALWAYS respond with valid JSON only — no markdown, no explanation:
{"reply_fr":"Bonjour! Vous désirez?","reply_no":"Hei! Hva ønsker du?","options":[{"fr":"Je voudrais un café, s'il vous plaît.","no":"Jeg vil gjerne ha en kaffe, takk."},{"fr":"Qu'est-ce que vous recommandez?","no":"Hva anbefaler du?"},{"fr":"Avez-vous du thé?","no":"Har dere te?"}],"done":false}

When done (after ${MAX_TURNS} exchanges):
{"done":true,"score":4,"comment":"Norwegian feedback in 2-3 sentences. Mention what went well and one thing to improve.","corrections":["Specific mistake if any, in Norwegian — or leave array empty"]}

Score is 1–6 (Norwegian dice). Be encouraging.${vocabList ? `\n\nSTUDENT'S VOCABULARY — use these words and their natural inflections. Basic grammatical words (articles, prepositions, être, avoir) are always fine:\n${vocabList}` : ""}`;
}

const FALLBACK_OPTIONS = [
  { fr: "Je comprends.", no: "Jeg forstår." },
  { fr: "D'accord, merci.", no: "Greit, takk." },
  { fr: "Pouvez-vous répéter?", no: "Kan du gjenta?" },
];

export default function RollespillScreen({ words, onBack, speak, screen, showWords, onNav, onGameComplete }) {
  const [phase, setPhase]           = useState("select");
  const [scenario, setScenario]     = useState(null);
  const [messages, setMessages]     = useState([]);
  const [apiHistory, setApiHistory] = useState([]);
  const [options, setOptions]       = useState([]);
  const [turn, setTurn]             = useState(0);
  const [result, setResult]         = useState(null);
  const [busy, setBusy]             = useState(false);
  const [freeText, setFreeText]     = useState("");
  const [loadError, setLoadError]   = useState(false);
  const [loadErrorMsg, setLoadErrorMsg] = useState("");
  const [showNo, setShowNo]         = useState(true);   // toggle Norwegian translations

  const profile = loadUserProfile();

  const callClaude = async (history, sc) => {
    const res = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-App-Token": APP_TOKEN },
      body: JSON.stringify({
        max_tokens: 600,
        system: systemPrompt(sc, profile, words),
        messages: history,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${data.error || data.message || JSON.stringify(data)}`);
    const text = data.content?.find(b => b.type === "text")?.text || "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("parse: no JSON in response");
    return JSON.parse(match[0]);
  };

  const startScenario = async (sc) => {
    setScenario(sc);
    setPhase("loading");
    setMessages([]);
    setOptions([]);
    setTurn(0);
    setResult(null);
    setLoadError(false);
    setLoadErrorMsg("");

    const initHistory = [{ role: "user", content: "Start the scenario. Greet me as the customer arrives." }];
    try {
      const parsed = await callClaude(initHistory, sc);
      setApiHistory([...initHistory, { role: "assistant", content: parsed.reply_fr }]);
      setMessages([{ role: "assistant", fr: parsed.reply_fr, no: parsed.reply_no }]);
      setOptions(parsed.options?.length ? parsed.options : FALLBACK_OPTIONS);
      setTurn(1);
      setPhase("play");
      speak(parsed.reply_fr, 0.85);
    } catch (e) {
      setLoadErrorMsg(e?.message || "Ukjent feil");
      setLoadError(true);
    }
  };

  const pickOption = async (opt) => {
    if (busy) return;
    setBusy(true);

    const newMsg     = { role: "user", fr: opt.fr, no: opt.no };
    const newMsgs    = [...messages, newMsg];
    const newHistory = [...apiHistory, { role: "user", content: opt.fr }];
    setMessages(newMsgs);
    setOptions([]);

    try {
      const parsed = await callClaude(newHistory, scenario);

      // Only accept done:true if we've actually reached MAX_TURNS
      const isDone = parsed.done && turn >= MAX_TURNS - 1;

      if (isDone) {
        setResult(parsed);
        logGameSession(turn);
        for (let i = 0; i < turn; i++) logDailyAnswer("vocab");
        if (onGameComplete) onGameComplete();
        setPhase("result");
      } else {
        const replyFr = parsed.reply_fr || "…";
        const replyNo = parsed.reply_no || "";
        const updHistory = [...newHistory, { role: "assistant", content: replyFr }];
        setApiHistory(updHistory);
        setMessages([...newMsgs, { role: "assistant", fr: replyFr, no: replyNo }]);
        setOptions(parsed.options?.length ? parsed.options : FALLBACK_OPTIONS);
        setTurn(t => t + 1);
        speak(replyFr, 0.85);
      }
    } catch {
      setApiHistory(newHistory);
      setOptions(FALLBACK_OPTIONS);
    }
    setBusy(false);
  };

  // ── Select ──────────────────────────────────────────────────────────────────
  if (phase === "select") return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "56px 22px 20px" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)", marginBottom: 20, padding: 0 }}>← Tilbake</button>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.5px" }}>Rollespill</div>
        <div style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)", marginTop: 4 }}>Velg en situasjon og snakk med Pierre</div>
      </div>
      <div style={{ flex: 1, padding: "0 22px 100px", display: "flex", flexDirection: "column", gap: 10 }}>
        {SCENARIOS.map(sc => (
          <button key={sc.id} onClick={() => startScenario(sc)}
            style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "18px 20px", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 34, flexShrink: 0 }}>{sc.icon}</span>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 500, color: "var(--text)", letterSpacing: "-0.2px" }}>{sc.label}</div>
              <div style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 3, fontFamily: "var(--font-body)" }}>{sc.desc}</div>
            </div>
          </button>
        ))}
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (phase === "loading") return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 32 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ fontSize: 52 }}>{scenario?.icon}</span>
      {loadError ? (
        <>
          <div style={{ fontSize: 14, color: "var(--text-subtle)", fontFamily: "var(--font-body)", textAlign: "center" }}>Kunne ikke koble til Pierre 😔</div>
          {loadErrorMsg && <div style={{ fontSize: 11, color: "var(--text-subtle)", fontFamily: "monospace", background: "var(--surface)", padding: "6px 10px", borderRadius: 8, maxWidth: 320, wordBreak: "break-all", textAlign: "left" }}>{loadErrorMsg}</div>}
          <button onClick={() => startScenario(scenario)} style={{ padding: "12px 28px", background: "var(--cream)", color: "var(--on-accent)", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>Prøv igjen</button>
          <button onClick={() => setPhase("select")} style={{ padding: "10px 20px", background: "none", border: "none", color: "var(--text-subtle)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
        </>
      ) : (
        <>
          <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--cream)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <div style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)" }}>Pierre forbereder seg…</div>
        </>
      )}
    </div>
  );

  // ── Result ──────────────────────────────────────────────────────────────────
  if (phase === "result") {
    const score = Math.min(6, Math.max(1, result?.score || 4));
    const dice  = ["⚀","⚁","⚂","⚃","⚄","⚅"][score - 1];
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", gap: 16 }}>
          <div style={{ fontSize: 80 }}>{dice}</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 500, color: "var(--cream)" }}>{score} / 6</div>
          <div style={{ fontSize: 14, color: "var(--text)", fontFamily: "var(--font-body)", textAlign: "center", lineHeight: 1.8, maxWidth: 300, background: "var(--surface)", borderRadius: 18, padding: "18px 20px", border: "1px solid var(--border)" }}>
            {result?.comment}
          </div>
          {result?.corrections?.filter(Boolean).map((c, i) => (
            <div key={i} style={{ width: "100%", maxWidth: 320, fontSize: 12, color: "var(--text-subtle)", background: "var(--color-error-bg)", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-body)", lineHeight: 1.6 }}>⚠ {c}</div>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={() => startScenario(scenario)} style={{ padding: "14px 24px", background: "var(--cream)", color: "var(--on-accent)", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>Spill igjen</button>
            <button onClick={() => setPhase("select")} style={{ padding: "14px 24px", background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 14, fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>Velg scenario</button>
          </div>
        </div>
        <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
      </div>
    );
  }

  // ── Play ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>

      {/* Header */}
      <div style={{ padding: "52px 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)", padding: 0 }}>← Avslutt</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{scenario?.icon}</span>
          <span style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)" }}>{scenario?.label}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setShowNo(v => !v)}
            title={showNo ? "Skjul norsk" : "Vis norsk"}
            style={{
              background: showNo ? "rgba(230,211,168,0.15)" : "transparent",
              border: `1px solid ${showNo ? "rgba(230,211,168,0.4)" : "var(--border)"}`,
              borderRadius: 8, padding: "4px 8px", cursor: "pointer",
              fontSize: 11, color: showNo ? "var(--cream)" : "var(--text-subtle)",
              fontFamily: "var(--font-body)", fontWeight: 600, letterSpacing: 0.3,
            }}
          >
            🇳🇴
          </button>
          <div style={{ fontSize: 12, color: "var(--text-subtle)", fontFamily: "var(--font-body)" }}>{turn}/{MAX_TURNS}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", gap: 4, padding: "0 20px 14px" }}>
        {Array.from({ length: MAX_TURNS }, (_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < turn ? "var(--cream)" : "var(--border)", transition: "background 0.3s" }} />
        ))}
      </div>

      {/* Chat */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px", display: "flex", flexDirection: "column", gap: 10, paddingBottom: 280 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "82%",
              background: m.role === "user" ? "rgba(230,211,168,0.13)" : "var(--surface)",
              border: `1px solid ${m.role === "user" ? "rgba(230,211,168,0.28)" : "var(--border)"}`,
              borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              padding: "12px 16px",
            }}>
              <div style={{ fontSize: 15, color: "var(--text)", fontFamily: "var(--font-body)", lineHeight: 1.45 }}>{m.fr}</div>
              {showNo && m.no && (
                <div style={{ fontSize: 11, color: "var(--text-subtle)", marginTop: 5, fontStyle: "italic", lineHeight: 1.4 }}>{m.no}</div>
              )}
            </div>
          </div>
        ))}

        {busy && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "18px 18px 18px 4px", padding: "14px 18px", display: "flex", gap: 5, alignItems: "center" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--text-subtle)", animation: `bounce 1s ${i * 0.18}s infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Response options */}
      {options.length > 0 && !busy && (
        <div style={{ position: "fixed", bottom: 84, left: 0, right: 0, padding: "10px 16px 12px", background: "linear-gradient(to top, var(--bg) 80%, transparent)", zIndex: 190, display: "flex", flexDirection: "column", gap: 7 }}>
          {options.map((opt, i) => (
            <button key={i} onClick={() => pickOption(opt)}
              style={{ textAlign: "left", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: showNo && opt.no ? "12px 16px 10px" : "13px 16px", cursor: "pointer" }}>
              <div style={{ fontSize: 14, color: "var(--text)", fontFamily: "var(--font-body)", fontWeight: 500, lineHeight: 1.35 }}>{opt.fr}</div>
              {showNo && opt.no && (
                <div style={{ fontSize: 11, color: "var(--text-subtle)", marginTop: 3, fontStyle: "italic" }}>{opt.no}</div>
              )}
            </button>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
            <input
              value={freeText}
              onChange={e => setFreeText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && freeText.trim()) { pickOption({ fr: freeText.trim(), no: "" }); setFreeText(""); } }}
              placeholder="eller skriv selv på fransk…"
              style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "11px 14px", fontSize: 13, color: "var(--text)", fontFamily: "var(--font-body)", outline: "none" }}
              autoComplete="off" autoCorrect="off" spellCheck={false}
            />
            <button
              onClick={() => { if (freeText.trim()) { pickOption({ fr: freeText.trim(), no: "" }); setFreeText(""); } }}
              style={{ padding: "11px 16px", background: freeText.trim() ? "var(--cream)" : "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 16, cursor: "pointer", color: freeText.trim() ? "var(--on-accent)" : "var(--text-subtle)", transition: "all 0.15s" }}
            >→</button>
          </div>
        </div>
      )}

      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}
