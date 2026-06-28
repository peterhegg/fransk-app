import { AutoPlayToggle, SpeakButton } from "./AudioControls.jsx";
import { useRef, useState, useEffect } from "react";
import { PROXY_URL, APP_TOKEN } from "../constants.js";
import { GRAMMAR_TOPICS } from "../content.js";
import { loadUserProfile } from "../utils.jsx";
import BottomNav from "./BottomNav.jsx";
import PointsBadge, { Fireworks, TierPop, ConfettiBurst } from "./PointsBadge.jsx";
import Tutor, { TutorAnimated } from "./Tutor/Tutor.jsx";
import { tutorVisible } from "../hooks/useTutorPrefs.js";


// Shared screen for Gloseøvelse AND Grammatikkøvelse
export default function QuizExerciseScreen({
  title, icon, emptyMsg,
  queue, card, input, setInput, checked, result, stats, history = [], options, mode,
  onSubmit, onNext, onBack,
  speak, speaking,
  screen, showWords, onNav,
  pointsInfo, autoPlay, onToggleAutoPlay, isOnline, tutorPrefs,
}) {
  const inputRef = useRef(null);
  const [fireworksDone, setFireworksDone] = useState(false);
  const [tierPopDone, setTierPopDone] = useState(false);
  const [mestretDone, setMestretDone] = useState(false);
  const [aiHint, setAiHint] = useState(null);
  const [aiHintLoading, setAiHintLoading] = useState(false);
  const hintAbortRef = useRef(null);

  useEffect(() => { setFireworksDone(false); setTierPopDone(false); setMestretDone(false); setAiHint(null); setAiHintLoading(false); }, [card?.fr, card?.reverse]);

  const requestHint = () => {
    if (!card || !isOnline || aiHintLoading || aiHint) return;
    hintAbortRef.current?.abort();
    const controller = new AbortController();
    hintAbortRef.current = controller;
    setAiHintLoading(true);
    setAiHint(null);
    const lvl = (loadUserProfile().level) || "A1/A2";
    const question = card.reverse ? `"${card.no}" (norsk → fransk)` : `"${card.fr}" (oversett til norsk)`;
    const correct = card.reverse ? card.fr : card.no;
    const context = card.topicId
      ? `grammatikkøvelse (tema: ${card.topicId})`
      : `gloseøvelse (ord: ${card.fr} = ${card.no})`;
    const prompt = `Norsk ${lvl}-elev svarte ${result === "close" ? "nesten riktig" : "galt"} på en ${context}.\nSpørsmål: ${question}\nEleven svarte: "${input}"\nRiktig svar: "${correct}"\n\nForklar på norsk (2 korte setninger) SPESIFIKT hva som er galt — for akkurat disse ordene. Gi én huskeregel knyttet direkte til akkurat dette ordet.\nSvar KUN som JSON: {"forklaring":"...","huskeregel":"..."}`;
    fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-App-Token": APP_TOKEN },
      signal: controller.signal,
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 220, system: "Respond only with a valid JSON object, no markdown.", messages: [{ role: "user", content: prompt }] }),
    }).then(r => r.json()).then(data => {
      const text = data.content?.find(b => b.type === "text")?.text || "";
      const match = text.match(/\{[\s\S]*?\}/);
      if (match) setAiHint(JSON.parse(match[0]));
    }).catch(() => {}).finally(() => setAiHintLoading(false));
  };

  useEffect(() => {
    if (autoPlay && card && !card.reverse) {
      const t = setTimeout(() => speak(card.fr), 400);
      return () => clearTimeout(t);
    }
  }, [card?.fr, card?.reverse, autoPlay]);

  useEffect(() => {
    if (checked && autoPlay && isReverse && card?.fr && (result === "correct" || result === "close")) {
      const t = setTimeout(() => speak(card.fr), 300);
      return () => clearTimeout(t);
    }
  }, [checked]);
  const total = stats.correct + stats.wrong + queue.length;
  const done = stats.correct + stats.wrong;
  const isFromBank = !!card?.id;
  const isReverse = !!card?.reverse;
  const grammarTip = card?.topicId ? GRAMMAR_TOPICS.find(t => t.id === card.topicId) : null;

  const handleInputFocus = () => {
    setTimeout(() => inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 300);
  };

  if (!card) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--cream-deep)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "var(--text)" }}><span style={{ color: "var(--cream)" }}>{icon}</span>{title}</div>
        <AutoPlayToggle autoPlay={autoPlay} onToggle={onToggleAutoPlay} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", gap: 16 }}>
        <div style={{ fontSize: 36, opacity: 0.3 }}>{icon}</div>
        <p style={{ color: "var(--text-subtle)", lineHeight: 1.9 }}>{emptyMsg}</p>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  return (
    <>
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--cream-deep)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "var(--text)" }}><span style={{ color: "var(--cream)" }}>{icon}</span>{title}</div>
        <AutoPlayToggle autoPlay={autoPlay} onToggle={onToggleAutoPlay} />
      </div>

      <div style={{ height: 3, background: "var(--border)" }}>
        <div style={{ height: "100%", background: "var(--cream)", width: `${total > 0 ? (done / total) * 100 : 0}%`, transition: "width 0.3s" }} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", gap: 20 }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 2 }}>
          {isFromBank ? `Repetisjon · niv. ${card.level}` : "Nytt ord"}
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "32px 40px", textAlign: "center", width: "100%", maxWidth: 340, boxShadow: "var(--shadow-md)" }}>
          {isReverse ? (
            <>
              <div style={{ fontSize: 11, color: "var(--text-subtle)", letterSpacing: 2, marginBottom: 10 }}>Oversett til fransk</div>
              <div style={{ fontSize: 34, color: "var(--text)", marginBottom: 8, fontFamily: "var(--font-display)" }}>{card.no}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 11, color: "var(--text-subtle)", letterSpacing: 2, marginBottom: 10 }}>Hva betyr dette på norsk?</div>
              <div style={{ fontSize: 34, color: "var(--text)", fontStyle: "italic", marginBottom: 8, fontFamily: "var(--font-display)" }}>{card.fr}</div>
              {card.phonetic && <div style={{ fontSize: 14, color: "var(--cream-deep)", opacity: 0.8, marginBottom: 8 }}>({card.phonetic})</div>}
              <div style={{ display: "flex", gap: 16, marginTop: 4, justifyContent: "center" }}>
                <SpeakButton onClick={() => speak(card.fr)} />
                <SpeakButton onClick={() => speak(card.fr, 0.4)} slow />
              </div>
            </>
          )}
        </div>

        {!checked ? (
          mode === "choice" ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%", maxWidth: 340 }}>
                {options.map((opt, i) => (
                  <button key={i} onClick={() => setInput(opt)}
                    style={{ background: input === opt ? "rgba(230,211,168,0.1)" : "var(--surface)", border: `${input === opt ? "1.5px" : "1px"} solid ${input === opt ? "var(--cream)" : "var(--border)"}`, borderRadius: 14, padding: "16px 10px", cursor: "pointer", color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 14, lineHeight: 1.3, textAlign: "center", transition: "all 0.15s ease" }}>
                    {opt}
                  </button>
                ))}
              </div>
              <button onClick={onSubmit} disabled={!input.trim()} className="btn-shine"
                style={{ background: "var(--cream)", opacity: input.trim() ? 1 : 0.4, border: "none", borderRadius: 14, color: "var(--bg)", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 15, padding: "16px", cursor: input.trim() ? "pointer" : "default", width: "100%", maxWidth: 340 }}>
                Bekreft svar
              </button>
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 340 }}>
              <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && onSubmit()}
                onFocus={handleInputFocus}
                placeholder={isReverse ? "Skriv på fransk..." : "Skriv norsk oversettelse..."}
                lang={isReverse ? "fr" : "no"}
                className="input-glow"
                style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 16, padding: "14px 16px", outline: "none", textAlign: "center" }}
                autoFocus />
              <button onClick={onSubmit} disabled={!input.trim()} className="btn-shine"
                style={{ background: "var(--cream)", opacity: input.trim() ? 1 : 0.4, border: "none", borderRadius: 14, color: "var(--bg)", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 15, padding: "14px", cursor: input.trim() ? "pointer" : "default" }}>
                Sjekk svar
              </button>
            </div>
          )
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 340, alignItems: "center" }}>
            {/* Placement 04 — milestone: 5-i-rad */}
            {checked && result !== "wrong" && tutorPrefs && tutorVisible(tutorPrefs) &&
              history.length >= 5 && history.slice(-5).every(r => r === "correct") && (
              <div style={{
                background: "rgba(0,200,150,0.12)", border: "1px solid rgba(0,200,150,0.30)",
                borderRadius: 18, padding: 16, width: "100%",
                display: "flex", alignItems: "flex-start", gap: 14,
              }}>
                <div style={{ color: "#00c896", flexShrink: 0 }}>
                  <TutorAnimated persona={tutorPrefs.tutorPersona} emotion="encouraging" crop="bust" size={76} title={tutorPrefs.tutorName} nodOnMount />
                </div>
                <div style={{ flex: 1, paddingTop: 4 }}>
                  <div style={{ fontSize: 11, color: "#00c896", letterSpacing: 1, marginBottom: 4 }}>FEM PÅ RAD</div>
                  <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 17, lineHeight: 1.45, color: "var(--text)" }}>
                    {["Fem på rad — det sitter!", "Du er inne i en god rytme.", "Excellent! Fortsett sånn.", "Bra! Disse kan du nå.", "Flott fremgang!"][card.fr.charCodeAt(0) % 5]}
                  </div>
                </div>
              </div>
            )}
            {result === "correct" && (
              <div style={{ background: "rgba(0,184,148,0.10)", border: "1px solid rgba(0,184,148,0.35)", borderRadius: 12, padding: "16px 24px", textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: 16, color: "var(--color-success)", fontWeight: "bold", marginBottom: isReverse ? 8 : 0 }}>✓ Riktig!</div>
                {isReverse && (
                  <>
                    <div style={{ fontSize: 22, color: "var(--text)", fontStyle: "italic", fontFamily: "var(--font-display)", marginBottom: 2 }}>{card.fr}</div>
                    {card.phonetic && <div style={{ fontSize: 13, color: "var(--cream-deep)", opacity: 0.8, marginBottom: 6 }}>({card.phonetic})</div>}
                    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                      <SpeakButton onClick={() => speak(card.fr)} />
                      <SpeakButton onClick={() => speak(card.fr, 0.4)} slow />
                    </div>
                  </>
                )}
                <PointsBadge pointsInfo={pointsInfo} />
              </div>
            )}
            {result === "close" && (
              <div style={{ background: "rgba(230,211,168,0.06)", border: "1px solid rgba(230,211,168,0.18)", borderRadius: 12, padding: "16px 24px", textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: 16, color: "var(--amber)", fontWeight: "bold", marginBottom: 6 }}>~ Nesten riktig!</div>
                <div style={{ fontSize: 13, color: "var(--text-subtle)", marginBottom: 4 }}>Du svarte: <em>{input}</em></div>
                <div style={{ fontSize: 15, color: "var(--text)" }}>Riktig: <strong>{isReverse ? card.fr : card.no}</strong></div>
                {card.phonetic && <div style={{ fontSize: 13, color: "var(--cream-deep)", opacity: 0.8, marginTop: 6 }}>{card.phonetic}</div>}
                <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 8 }}>
                  <SpeakButton onClick={() => speak(card.fr)} />
                  <SpeakButton onClick={() => speak(card.fr, 0.4)} slow />
                </div>
                <PointsBadge pointsInfo={pointsInfo} />
              </div>
            )}
            {result === "wrong" && (
              <>
                {/* Placement 05 — wrong answer with tutor */}
                <div style={{
                  background: tutorPrefs && tutorVisible(tutorPrefs)
                    ? "linear-gradient(135deg, rgba(240,138,117,0.10), rgba(15,31,52,0.6))"
                    : "rgba(225,112,85,0.08)",
                  border: "1px solid rgba(240,138,117,0.30)",
                  borderRadius: 20, padding: 16, width: "100%",
                  display: "flex", gap: 14, alignItems: "flex-start",
                }}>
                  {tutorPrefs && tutorVisible(tutorPrefs) && (
                    <div style={{ color: "#f08a75", flexShrink: 0 }}>
                      <TutorAnimated persona={tutorPrefs.tutorPersona} emotion="wrong" crop="bust" size={76} title={tutorPrefs.tutorName} />
                    </div>
                  )}
                  <div style={{ flex: 1, paddingTop: tutorPrefs && tutorVisible(tutorPrefs) ? 4 : 0 }}>
                    <div style={{ fontSize: 13, color: "var(--text-subtle)", marginBottom: 4 }}>Du svarte: <em>{input}</em></div>
                    <div style={{ fontSize: 15, color: "var(--text)", fontWeight: 500 }}>{isReverse ? card.fr : card.no}</div>
                    {card.phonetic && <div style={{ fontSize: 13, color: "var(--cream-deep)", opacity: 0.8, marginTop: 4 }}>({card.phonetic})</div>}
                    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                      <SpeakButton onClick={() => speak(card.fr)} />
                      <SpeakButton onClick={() => speak(card.fr, 0.4)} slow />
                    </div>
                    <PointsBadge pointsInfo={pointsInfo} />
                  </div>
                </div>
                {grammarTip && !aiHint && !aiHintLoading && (
                  <div style={{ background: "rgba(230,211,168,0.04)", border: "1px solid rgba(230,211,168,0.14)", borderRadius: 12, padding: "12px 16px", width: "100%" }}>
                    <div style={{ fontSize: 10, color: "var(--cream-deep)", letterSpacing: 2, marginBottom: 6 }}>Huskeregel — {grammarTip.title}</div>
                    <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.65 }}>{grammarTip.description}</div>
                  </div>
                )}
              </>
            )}
            {checked && (result === "wrong" || result === "close") && !aiHint && !aiHintLoading && isOnline && (
              <button onClick={requestHint} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 10, padding: "7px 14px", fontSize: 12, color: "var(--text-subtle)", cursor: "pointer", fontFamily: "var(--font-body)" }}>
                💡 Få tilbakemelding
              </button>
            )}
            {(aiHintLoading || aiHint) && (
              <div style={{ background: "rgba(230,211,168,0.04)", border: "1px solid rgba(230,211,168,0.14)", borderRadius: 12, padding: "12px 16px", width: "100%", maxWidth: 340 }}>
                {aiHintLoading ? (
                  <div style={{ fontSize: 12, color: "var(--text-subtle)", opacity: 0.7, textAlign: "center" }}>🤔 Analyserer…</div>
                ) : aiHint ? (
                  <>
                    {aiHint.forklaring && <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.65, marginBottom: aiHint.huskeregel ? 8 : 0 }}>{aiHint.forklaring}</div>}
                    {aiHint.huskeregel && (
                      <>
                        <div style={{ fontSize: 10, color: "var(--cream-deep)", letterSpacing: 2, marginBottom: 4 }}>Huskeregel</div>
                        <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.65, fontStyle: "italic" }}>{aiHint.huskeregel}</div>
                      </>
                    )}
                  </>
                ) : null}
              </div>
            )}
            <button onClick={onNext} className="btn-shine"
              style={{ background: "var(--cream)", border: "none", borderRadius: 14, color: "var(--bg)", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 15, padding: "14px 40px", cursor: "pointer", boxShadow: "0 4px 16px rgba(230,211,168,0.12)" }}>
              {queue.length <= 1 ? "Ferdig!" : "Neste ord →"}
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {Array.from({ length: Math.min(total, 20) }).map((_, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: history[i] === "correct" ? "var(--color-success)" : history[i] === "wrong" ? "var(--color-error)" : "var(--border)" }} />
          ))}
        </div>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
    {pointsInfo?.justMastered && !fireworksDone && (
      <Fireworks onDone={() => setFireworksDone(true)} />
    )}
    {/* Placement 06 — mestret hero overlay */}
    {pointsInfo?.justMastered && tutorPrefs && tutorVisible(tutorPrefs) && !mestretDone && (
      <div
        onClick={() => setMestretDone(true)}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(9,21,38,0.92)",
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", textAlign: "center", padding: "0 24px",
        }}>
        <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(232,237,245,0.4)", marginBottom: 18 }}>MESTRET</div>
        <div style={{ color: "#ffd700", position: "relative", marginBottom: 22 }}>
          <TutorAnimated persona={tutorPrefs.tutorPersona} emotion="proud" crop="full" size={130} title={tutorPrefs.tutorName} heroMode />
          <span style={{ position: "absolute", top: 10, left: -18, color: "#ffd700", fontSize: 16, opacity: 0.7 }}>✦</span>
          <span style={{ position: "absolute", top: -8, right: -14, color: "#ffd700", fontSize: 22, opacity: 0.85 }}>✦</span>
          <span style={{ position: "absolute", top: 40, right: -28, color: "#ffd700", fontSize: 12, opacity: 0.6 }}>✦</span>
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, lineHeight: 1.2, marginBottom: 8, color: "var(--text)" }}>
          <em style={{ color: "#ffd700" }}>{card?.fr}</em> er mestret.
        </div>
        <div style={{ fontSize: 13, color: "rgba(232,237,245,0.55)", letterSpacing: 0.3, marginBottom: 28 }}>
          Stille framgang.
        </div>
        <div style={{ fontSize: 11, color: "rgba(232,237,245,0.35)", letterSpacing: 1 }}>trykk for å fortsette</div>
      </div>
    )}
    {pointsInfo?.tierAfter > pointsInfo?.tierBefore && !pointsInfo?.justMastered && !tierPopDone && (
      <>
        <ConfettiBurst />
        <TierPop tierAfter={pointsInfo.tierAfter} onDone={() => setTierPopDone(true)} />
      </>
    )}
    </>
  );
}
