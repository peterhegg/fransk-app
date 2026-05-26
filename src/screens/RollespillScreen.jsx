import { useState } from "react";
import { PROXY_URL, APP_TOKEN } from "../constants.js";
import { loadUserProfile, logGameSession } from "../utils.jsx";
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

function systemPrompt(scenario, profile) {
  return `You are a French conversation partner playing the role of ${scenario.role}. You help a Norwegian ${profile.level || "A1/A2"} learner${profile.dysleksi ? " with dyslexia" : ""} practice real French.

RULES:
- Your French replies must be short and simple (A1/A2, max 1-2 sentences).
- Always include a Norwegian translation of your reply.
- Always give exactly 3 response options the learner can say. Options must be realistic for the scenario, at A1/A2 level, and meaningfully different from each other.
- After turn ${MAX_TURNS}, wrap up the conversation naturally and set done:true.

ALWAYS respond with valid JSON only — no markdown, no explanation:
{"reply_fr":"Bonjour! Vous désirez?","reply_no":"Hei! Hva ønsker du?","options":[{"fr":"Je voudrais un café, s'il vous plaît.","no":"Jeg vil gjerne ha en kaffe, takk."},{"fr":"Qu'est-ce que vous recommandez?","no":"Hva anbefaler du?"},{"fr":"Avez-vous du thé?","no":"Har dere te?"}],"done":false}

When done (after turn ${MAX_TURNS} or natural end):
{"done":true,"score":4,"comment":"Norwegian feedback in 2-3 sentences. Mention what went well and one thing to improve.","corrections":["Specific mistake if any, in Norwegian — or leave array empty"]}

Score is 1–6 (Norwegian dice). Be encouraging.`;
}

export default function RollespillScreen({ onBack, speak, screen, showWords, onNav }) {
  const [phase, setPhase]           = useState("select");
  const [scenario, setScenario]     = useState(null);
  const [messages, setMessages]     = useState([]);  // {role, fr, no}
  const [apiHistory, setApiHistory] = useState([]);  // raw {role, content} for Claude
  const [options, setOptions]       = useState([]);
  const [turn, setTurn]             = useState(0);
  const [result, setResult]         = useState(null);
  const [busy, setBusy]             = useState(false);

  const profile = loadUserProfile();

  const callClaude = async (history, sc) => {
    const res = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-App-Token": APP_TOKEN },
      body: JSON.stringify({
        max_tokens: 600,
        system: systemPrompt(sc, profile),
        messages: history,
      }),
    });
    const data = await res.json();
    const text = data.content?.find(b => b.type === "text")?.text || "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("parse");
    return JSON.parse(match[0]);
  };

  const startScenario = async (sc) => {
    setScenario(sc);
    setPhase("loading");
    setMessages([]);
    setOptions([]);
    setTurn(0);
    setResult(null);

    const initHistory = [{ role: "user", content: "Start the scenario. Greet me." }];
    try {
      const parsed = await callClaude(initHistory, sc);
      setApiHistory([...initHistory, { role: "assistant", content: parsed.reply_fr }]);
      setMessages([{ role: "assistant", fr: parsed.reply_fr, no: parsed.reply_no }]);
      setOptions(parsed.options || []);
      setTurn(1);
      setPhase("play");
      speak(parsed.reply_fr, 0.85);
    } catch {
      setPhase("select");
    }
  };

  const pickOption = async (opt) => {
    if (busy) return;
    setBusy(true);

    const newMsg    = { role: "user", fr: opt.fr, no: opt.no };
    const newMsgs   = [...messages, newMsg];
    const newHistory = [...apiHistory, { role: "user", content: opt.fr }];
    setMessages(newMsgs);
    setOptions([]);

    try {
      const parsed = await callClaude(newHistory, scenario);

      if (parsed.done) {
        setResult(parsed);
        logGameSession(turn);
        setPhase("result");
      } else {
        const updHistory = [...newHistory, { role: "assistant", content: parsed.reply_fr }];
        setApiHistory(updHistory);
        setMessages([...newMsgs, { role: "assistant", fr: parsed.reply_fr, no: parsed.reply_no }]);
        setOptions(parsed.options || []);
        setTurn(t => t + 1);
        speak(parsed.reply_fr, 0.85);
      }
    } catch {
      // Recover with generic options
      setApiHistory(newHistory);
      setOptions([
        { fr: "Je comprends.", no: "Jeg forstår." },
        { fr: "D'accord, merci.", no: "Greit, takk." },
        { fr: "Pouvez-vous répéter?", no: "Kan du gjenta?" },
      ]);
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
            style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "18px 20px", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, transition: "border-color 0.15s" }}>
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
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ fontSize: 52 }}>{scenario?.icon}</span>
      <div style={{ width: 32, height: 32, border: "3px solid var(--border)", borderTopColor: "var(--cream)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ fontSize: 13, color: "var(--text-subtle)", fontFamily: "var(--font-body)" }}>Pierre forbereder seg…</div>
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
            <div key={i} style={{ width: "100%", maxWidth: 320, fontSize: 12, color: "var(--text-subtle)", background: "rgba(248,113,113,0.08)", borderRadius: 10, padding: "10px 14px", fontFamily: "var(--font-body)", lineHeight: 1.6 }}>⚠ {c}</div>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={() => startScenario(scenario)} style={{ padding: "14px 24px", background: "var(--cream)", color: "#1a1209", border: "none", borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)" }}>Spill igjen</button>
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
        <div style={{ fontSize: 12, color: "var(--text-subtle)", fontFamily: "var(--font-body)" }}>{turn}/{MAX_TURNS}</div>
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", gap: 4, padding: "0 20px 14px" }}>
        {Array.from({ length: MAX_TURNS }, (_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < turn ? "var(--cream)" : "var(--border)", transition: "background 0.3s" }} />
        ))}
      </div>

      {/* Chat */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px", display: "flex", flexDirection: "column", gap: 10, paddingBottom: 260 }}>
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
              <div style={{ fontSize: 11, color: "var(--text-subtle)", marginTop: 5, fontStyle: "italic", lineHeight: 1.4 }}>{m.no}</div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
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
              style={{ textAlign: "left", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "12px 16px", cursor: "pointer", transition: "border-color 0.15s, background 0.15s" }}>
              <div style={{ fontSize: 14, color: "var(--text)", fontFamily: "var(--font-body)", fontWeight: 500, lineHeight: 1.35 }}>{opt.fr}</div>
              <div style={{ fontSize: 11, color: "var(--text-subtle)", marginTop: 3, fontStyle: "italic" }}>{opt.no}</div>
            </button>
          ))}
        </div>
      )}

      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}
