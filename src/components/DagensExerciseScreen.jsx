import { useState, useRef, useEffect } from "react";
import BottomNav from "./BottomNav.jsx";
import { checkQuizAnswer, shuffle } from "../utils.jsx";
import { langCode } from "../content.js";
import PointsBadge, { Fireworks, TierPop, ConfettiBurst } from "./PointsBadge.jsx";
import { AutoPlayToggle, SpeakButton } from "./AudioControls.jsx";
import Tutor, { TutorAnimated } from "./Tutor/Tutor.jsx";
import { tutorVisible } from "../hooks/useTutorPrefs.js";

function DagensIntroPhase({ words, speak, speaking, onDone, icon, title, onBack, screen, showWords, onNav, exerciseRounds = 5, autoPlay, onToggleAutoPlay, onSkipWord }) {
  const [allCards, setAllCards] = useState(() =>
    Array.from({ length: exerciseRounds }, () => shuffle([...words])).flat()
  );
  const [idx, setIdx] = useState(0);
  const [noInput, setNoInput] = useState("");
  const [frInput, setFrInput] = useState("");
  const [checked, setChecked] = useState(false);
  const [noResult, setNoResult] = useState("");
  const [frResult, setFrResult] = useState("");

  const card = allCards[idx];
  const isLast = idx === allCards.length - 1;
  const round = Math.floor(idx / words.length) + 1;

  const inputRef = useRef(null);
  const handleFocus = () => setTimeout(() => inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 300);

  const reset = () => { setNoInput(""); setFrInput(""); setChecked(false); setNoResult(""); setFrResult(""); };
  const next = () => { reset(); if (isLast) onDone(); else setIdx(i => i + 1); };

  const skip = () => {
    const skipFr = card.fr;
    const replacement = onSkipWord?.(skipFr) ?? null;
    // Remove all future occurrences of the skipped word
    const remaining = allCards.slice(idx + 1).filter(c => c.fr !== skipFr);
    // Insert replacement immediately as next card (index 0 of remaining), not at end
    const next = replacement
      ? [replacement, ...remaining]
      : remaining;
    if (next.length === 0) { onDone(); return; }
    setAllCards(prev => [...prev.slice(0, idx), ...next]);
  };

  useEffect(() => {
    if (autoPlay && card?.fr) {
      const t = setTimeout(() => speak(card.fr), 400);
      return () => clearTimeout(t);
    }
  }, [card?.fr, autoPlay]);

  const submit = () => {
    if (!noInput.trim() || !frInput.trim()) return;
    setNoResult(checkQuizAnswer(noInput, card, false));
    setFrResult(checkQuizAnswer(frInput, card, true));
    setChecked(true);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--cream-deep)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "var(--text)" }}>
          <span style={{ color: "var(--cream)" }}>{icon}</span>{title}
        </div>
        <AutoPlayToggle autoPlay={autoPlay} onToggle={onToggleAutoPlay} />
      </div>
      <div style={{ height: 3, background: "var(--border)" }}>
        <div style={{ height: "100%", background: "var(--cream)", width: `${((idx + 1) / allCards.length) * 100}%`, transition: "width 0.3s" }} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", gap: 16 }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 2 }}>Øv på stavingen</div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px 28px", textAlign: "center", width: "100%", maxWidth: 340, boxShadow: "var(--shadow-md)" }}>
          <div style={{ fontSize: 28, color: "var(--text)", fontStyle: "italic", fontFamily: "var(--font-display)", marginBottom: 2 }}>{card.fr}</div>
          {card.phonetic && <div style={{ fontSize: 12, color: "var(--text-subtle)", marginBottom: 4 }}>({card.phonetic})</div>}
          <div style={{ fontSize: 18, color: "var(--text-subtle)", marginBottom: 10 }}>{card.no}</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 16 }}>
            <SpeakButton onClick={() => speak(card.fr)} />
            <SpeakButton onClick={() => speak(card.fr, 0.4)} slow />
          </div>

          {checked ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { label: "Norsk", result: noResult, input: noInput, correct: card.no },
                { label: "Fransk", result: frResult, input: frInput, correct: card.fr },
              ].map(({ label, result, input, correct }) => (
                <div key={label} style={{
                  borderRadius: 10, padding: "8px 12px", textAlign: "left",
                  background: result === "correct" ? "rgba(0,184,148,0.10)" : result === "close" ? "rgba(212,165,116,0.08)" : "rgba(225,112,85,0.08)",
                  border: `1px solid ${result === "correct" ? "rgba(0,184,148,0.35)" : result === "close" ? "rgba(212,165,116,0.3)" : "rgba(225,112,85,0.3)"}`,
                }}>
                  <div style={{ fontSize: 10, color: "var(--text-subtle)", letterSpacing: 1, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 13, color: result === "correct" ? "var(--color-success)" : result === "close" ? "var(--amber)" : "var(--color-error)", fontWeight: 500 }}>
                    {result === "correct" ? `✓ ${input}` : `${input} → ${correct}`}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input ref={inputRef} value={noInput} onChange={e => setNoInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && frInput.trim() && submit()}
                onFocus={handleFocus}
                placeholder="Norsk oversettelse…" className="input-glow"
                lang="no"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 15, padding: "11px 14px", outline: "none", textAlign: "center" }}
                autoFocus />
              <input value={frInput} onChange={e => setFrInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && noInput.trim() && submit()}
                placeholder="Skriv ordet…" className="input-glow"
                lang={langCode}
                style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 15, padding: "11px 14px", outline: "none", textAlign: "center" }} />
              <button onClick={submit} disabled={!noInput.trim() || !frInput.trim()} className="btn-shine"
                style={{ background: "var(--cream)", opacity: noInput.trim() && frInput.trim() ? 1 : 0.4, border: "none", borderRadius: 12, color: "var(--bg)", fontFamily: "var(--font-body)", fontWeight: "600", fontSize: 14, padding: "12px", cursor: noInput.trim() && frInput.trim() ? "pointer" : "default" }}>
                Sjekk
              </button>
            </div>
          )}
        </div>

        <div style={{ fontSize: 11, color: "var(--text-subtle)", textAlign: "center", width: "100%" }}>Runde {round} av {exerciseRounds}</div>

        {!checked && (
          <button onClick={skip}
            style={{ background: "none", border: "none", color: "var(--text-subtle)", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-body)", opacity: 0.6, textDecoration: "underline", padding: "2px 8px" }}>
            Hopp over — kan dette allerede
          </button>
        )}

        {checked && (
          <button onClick={next} className="btn-shine"
            style={{ background: "var(--cream)", border: "none", borderRadius: 14, color: "var(--bg)", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 15, padding: "14px 48px", cursor: "pointer", boxShadow: "0 4px 16px rgba(230,211,168,0.12)" }}>
            {isLast ? "Start testing →" : "Neste →"}
          </button>
        )}

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {Array.from({ length: words.length }, (_, i) => {
              const posInRound = idx % words.length;
              return (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i < posInRound ? "rgba(90,154,240,0.4)" : i === posInRound ? "var(--cream)" : "rgba(255,255,255,0.15)" }} />
              );
            })}
          </div>
          <div style={{ fontSize: 10, color: "rgba(232,237,245,0.4)" }}>{idx + 1} av {allCards.length} totalt</div>
        </div>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}

// Shared screen for Dagens øvelse – glose AND Daglig grammatikk
export default function DagensExerciseScreen({
  title, icon,
  phase,
  topic,
  dailyWords,
  queue,
  card,
  input, setInput,
  checked, result, stats, history = [],
  onStartExercise,
  onSubmit, onNext,
  onBack,
  speak, speaking,
  screen, showWords, onNav,
  exerciseRounds = 5,
  pointsInfo,
  autoPlay,
  onToggleAutoPlay,
  onSkipWord,
  tutorPrefs,
}) {
  const [fireworksDone, setFireworksDone] = useState(false);
  const [tierPopDone, setTierPopDone] = useState(false);
  const [mestretDone, setMestretDone] = useState(false);
  useEffect(() => { setFireworksDone(false); setTierPopDone(false); setMestretDone(false); }, [card?.fr, card?.reverse]);

  useEffect(() => {
    if (autoPlay && card?.fr && !card.reverse) {
      const t = setTimeout(() => speak(card.fr), 400);
      return () => clearTimeout(t);
    }
  }, [card?.fr, card?.reverse, autoPlay]);

  useEffect(() => {
    if (checked && autoPlay && card?.reverse && card?.fr && (result === "correct" || result === "close")) {
      const t = setTimeout(() => speak(card.fr), 300);
      return () => clearTimeout(t);
    }
  }, [checked]);

  const isReverse = card?.reverse;
  const totalCards = queue.length + stats.correct + stats.wrong;
  const done = stats.correct + stats.wrong;

  const navBar = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--cream-deep)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "var(--text)" }}>
        <span style={{ color: "var(--cream)" }}>{icon}</span>{title}
      </div>
      <AutoPlayToggle autoPlay={autoPlay} onToggle={onToggleAutoPlay} />
    </div>
  );

  if (phase === 0 && !topic) return (
    <DagensIntroPhase words={dailyWords} speak={speak} speaking={speaking} onDone={onStartExercise} icon={icon} title={title} onBack={onBack} screen={screen} showWords={showWords} onNav={onNav} exerciseRounds={exerciseRounds} autoPlay={autoPlay} onToggleAutoPlay={onToggleAutoPlay} onSkipWord={onSkipWord} />
  );

  if (phase === 0 && topic) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 0 }}>
      {navBar}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", gap: 20, textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "var(--text-subtle)", letterSpacing: 3 }}>Dagens tema</div>
        <div style={{ fontSize: 28, color: "var(--text)", fontStyle: "italic", fontFamily: "var(--font-display)", lineHeight: 1.3 }}>{topic.title}</div>
        <div style={{ fontSize: 14, color: "var(--text-subtle)", fontStyle: "italic" }}>{topic.subtitle}</div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px 24px", maxWidth: 340, width: "100%", fontSize: 14, color: "var(--text)", lineHeight: 1.7, boxShadow: "var(--shadow-sm)" }}>
          {topic.description}
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "14px 20px", maxWidth: 340, width: "100%", boxShadow: "var(--shadow-sm)" }}>
          {topic.pairs.slice(0, 3).map((p, i) => (
            <div key={i} style={{ fontSize: 13, display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
              <span style={{ fontStyle: "italic", color: "var(--cream)" }}>{p.fr}</span>
              <span style={{ color: "var(--text-subtle)" }}>{p.no}</span>
            </div>
          ))}
          {topic.pairs.length > 3 && <div style={{ fontSize: 11, color: "var(--text-subtle)", marginTop: 6, textAlign: "center" }}>+ {topic.pairs.length - 3} til</div>}
        </div>
        <button onClick={onStartExercise} className="btn-shine"
          style={{ background: "var(--cream)", border: "none", borderRadius: 14, color: "var(--bg)", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 16, padding: "16px 48px", cursor: "pointer", marginTop: 8, boxShadow: "0 4px 16px rgba(230,211,168,0.12)" }}>
          Start øvelsen →
        </button>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  if (phase === 3) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)" }}>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--cream-deep)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "var(--text)" }}><span style={{ color: "var(--cream)" }}>{icon}</span>{title}</div>
        <div style={{ fontSize: 11, color: "var(--text-subtle)", letterSpacing: 1 }}>Fullført ✦</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 24px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, textAlign: "center", scrollbarWidth: "none" }}>
        <div style={{ fontSize: 48 }}>✦</div>
        <div style={{ fontSize: 22, color: "var(--cream)", fontStyle: "italic" }}>{topic ? `${topic.title} — ferdig!` : "Dagens øvelse fullført!"}</div>
        <div style={{ fontSize: 14, color: "var(--text-subtle)", lineHeight: 1.8 }}>
          {topic ? "Alle par er lagt til i grammatikkøvelsen din." : `Du har øvd på ${dailyWords.length} ord i begge retninger.\nKom tilbake i morgen for 5 nye ord.`}
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 24px", width: "100%", maxWidth: 340, boxShadow: "var(--shadow-sm)" }}>
          {(topic ? topic.pairs : dailyWords).map((w, i) => (
            <div key={i} style={{ fontSize: 14, color: "var(--text)", padding: "4px 0", borderBottom: i < (topic ? topic.pairs : dailyWords).length - 1 ? "1px solid var(--border)" : "none" }}>
              <span style={{ color: "var(--color-success)" }}>✓</span> <strong>{w.fr}</strong> = {w.no}
              {w.phonetic && <span style={{ color: "var(--text-subtle)", fontSize: 12 }}> ({w.phonetic})</span>}
            </div>
          ))}
        </div>
      </div>
      <div style={{ flexShrink: 0, padding: "12px 24px", paddingBottom: "calc(12px + 66px)", background: "var(--bg)", borderTop: "1px solid var(--border)" }}>
        <button onClick={onBack} className="btn-shine"
          style={{ width: "100%", background: "var(--cream)", border: "none", borderRadius: 14, color: "var(--bg)", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 15, padding: "14px", cursor: "pointer", boxShadow: "0 4px 16px rgba(230,211,168,0.12)" }}>
          Tilbake til hjem
        </button>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  const phaseLabel = phase === 1
    ? "Del 1 — gjenkjenning (fr → no)"
    : "Del 2 — produksjon (no → fr)";
  const prompt = isReverse ? card?.no : card?.fr;
  const phonetic = !isReverse && card?.phonetic;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--cream-deep)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "var(--text)" }}><span style={{ color: "var(--cream)" }}>{icon}</span>{title}</div>
        <AutoPlayToggle autoPlay={autoPlay} onToggle={onToggleAutoPlay} />
      </div>
      <div style={{ height: 3, background: "var(--border)" }}>
        <div style={{ height: "100%", background: "var(--cream)", width: `${totalCards > 0 ? (done / totalCards) * 100 : 0}%`, transition: "width 0.3s" }} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", gap: 20 }}>
        <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: 2, textAlign: "center" }}>{phaseLabel}</div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 36px", textAlign: "center", width: "100%", maxWidth: 340, boxShadow: "var(--shadow-md)" }}>
          <div style={{ fontSize: 11, color: "var(--text-subtle)", letterSpacing: 2, marginBottom: 10 }}>
            {isReverse ? "Skriv på fransk:" : "Hva betyr dette?"}
          </div>
          <div style={{ fontSize: 32, color: "var(--text)", fontStyle: isReverse ? "normal" : "italic", marginBottom: 8, fontFamily: isReverse ? "var(--font-body)" : "var(--font-display)" }}>
            {prompt}
          </div>
          {phonetic && <div style={{ fontSize: 14, color: "var(--cream-deep)", opacity: 0.8, marginBottom: 8 }}>({phonetic})</div>}
          {!isReverse && (
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <SpeakButton onClick={() => speak(card.fr)} />
              <SpeakButton onClick={() => speak(card.fr, 0.4)} slow />
            </div>
          )}
        </div>

        {!checked ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 340 }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onSubmit()}
              placeholder={isReverse ? "Skriv ordet..." : "Skriv norsk oversettelse..."}
              lang={isReverse ? langCode : "no"}
              className="input-glow"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 16, padding: "14px 16px", outline: "none", textAlign: "center" }}
              autoFocus />
            <button onClick={onSubmit} disabled={!input.trim()} className="btn-shine"
              style={{ background: "var(--cream)", opacity: input.trim() ? 1 : 0.4, border: "none", borderRadius: 14, color: "var(--bg)", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 15, padding: "14px", cursor: input.trim() ? "pointer" : "default" }}>
              Sjekk svar
            </button>
          </div>
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
              <div style={{ background: "rgba(0,184,148,0.10)", border: "1px solid rgba(0,184,148,0.35)", borderRadius: 12, padding: "14px 20px", textAlign: "center", width: "100%" }}>
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
              <div style={{ background: "rgba(230,211,168,0.06)", border: "1px solid rgba(230,211,168,0.18)", borderRadius: 12, padding: "14px 20px", textAlign: "center", width: "100%" }}>
                <div style={{ fontSize: 15, color: "var(--amber)", fontWeight: "bold", marginBottom: 4 }}>~ Nesten!</div>
                <div style={{ fontSize: 13, color: "var(--text-subtle)", marginBottom: 4 }}>Du svarte: <em>{input}</em></div>
                <div style={{ fontSize: 14, color: "var(--text)" }}>Riktig: <strong>{isReverse ? card.fr : card.no}</strong></div>
                {card.phonetic && <div style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 4 }}>{card.phonetic}</div>}
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
                    <div style={{ fontSize: 16, color: "var(--text)", fontWeight: 500 }}>{isReverse ? card.fr : card.no}</div>
                    {card.phonetic && <div style={{ fontSize: 13, color: "var(--cream-deep)", marginTop: 4 }}>({card.phonetic})</div>}
                    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                      <SpeakButton onClick={() => speak(card.fr)} />
                      <SpeakButton onClick={() => speak(card.fr, 0.4)} slow />
                    </div>
                    <PointsBadge pointsInfo={pointsInfo} />
                  </div>
                </div>
                {topic && (
                  <div style={{ background: "rgba(230,211,168,0.04)", border: "1px solid rgba(230,211,168,0.14)", borderRadius: 12, padding: "12px 16px", width: "100%" }}>
                    <div style={{ fontSize: 10, color: "var(--cream-deep)", letterSpacing: 2, marginBottom: 6 }}>Huskeregel</div>
                    <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.65 }}>{topic.description}</div>
                  </div>
                )}
              </>
            )}
            <button onClick={onNext} className="btn-shine"
              style={{ background: "var(--cream)", border: "none", borderRadius: 14, color: "var(--bg)", fontFamily: "var(--font-body)", fontWeight: "500", fontSize: 15, padding: "14px 40px", cursor: "pointer", boxShadow: "0 4px 16px rgba(230,211,168,0.12)" }}>
              {queue.length <= 1 && phase === 2 ? "Fullfør!" : queue.length <= 1 ? "Del 2 →" : result === "wrong" ? "Prøv igjen →" : "Neste →"}
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
          {Array.from({ length: Math.min(totalCards, 20) }).map((_, i) => (
            <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: history[i] === "correct" ? "var(--color-success)" : history[i] === "wrong" ? "var(--color-error)" : "var(--border)" }} />
          ))}
        </div>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
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
    </div>
  );
}
