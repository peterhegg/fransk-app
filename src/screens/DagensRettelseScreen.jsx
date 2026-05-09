import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  checkQuizAnswer, updateWordPoints, incrementAnswerCount, scheduleNext,
  logDailyAnswer, logWordAnswer, loadAnswerCount, touchStreak, getWordTier,
  shuffle,
} from "../utils.jsx";
import { MASTERY_POINTS, PROXY_URL, APP_TOKEN } from "../constants.js";
import BottomNav from "../components/BottomNav.jsx";
import PointsBadge, { Fireworks, TierPop, ConfettiBurst } from "../components/PointsBadge.jsx";
import { AutoPlayToggle, SpeakButton } from "../components/AudioControls.jsx";

const ICON = "✦";

// Each error word becomes two cards: fr→no and no→fr
function buildQueue(worstWords) {
  const cards = worstWords.flatMap(w => [
    { ...w, reverse: false },
    { ...w, reverse: true },
  ]);
  return shuffle(cards);
}

export default function DagensRettelseScreen({
  words, setWords, worstWords,
  onBack, speak, speaking,
  screen, showWords, onNav,
  autoPlay, onToggleAutoPlay,
}) {
  const [queue, setQueue] = useState(() => buildQueue(worstWords));
  const [card, setCard] = useState(() => queue[0] || null);
  const [input, setInput] = useState("");
  const [checked, setChecked] = useState(false);
  const [result, setResult] = useState("");
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });
  const [history, setHistory] = useState([]);
  const [pointsInfo, setPointsInfo] = useState(null);
  const [fireworksDone, setFireworksDone] = useState(false);
  const [tierPopDone, setTierPopDone] = useState(false);
  const [done, setDone] = useState(false);
  const [aiHint, setAiHint] = useState(null);
  const [aiHintLoading, setAiHintLoading] = useState(false);
  const inputRef = useRef(null);

  const isReverse = !!card?.reverse;
  const total = stats.correct + stats.wrong + queue.length;

  useEffect(() => {
    setAiHint(null); setAiHintLoading(false);
  }, [card?.fr, card?.reverse]);

  useEffect(() => {
    if (!checked && inputRef.current) inputRef.current.focus();
  }, [card, checked]);

  useEffect(() => {
    if (autoPlay && card?.fr && !isReverse) {
      const t = setTimeout(() => speak(card.fr), 400);
      return () => clearTimeout(t);
    }
  }, [card?.fr, card?.reverse, autoPlay]);

  useEffect(() => {
    if (checked && autoPlay && isReverse && card?.fr && result !== "wrong") {
      const t = setTimeout(() => speak(card.fr), 300);
      return () => clearTimeout(t);
    }
  }, [checked]);

  const requestHint = () => {
    if (!card || !PROXY_URL || aiHintLoading || aiHint) return;
    const controller = new AbortController();
    setAiHintLoading(true);
    const question = isReverse ? `"${card.no}" (norsk → fransk)` : `"${card.fr}" (fransk → norsk)`;
    const correct = isReverse ? card.fr : card.no;
    const wasWrong = result === "wrong";
    const prompt = wasWrong
      ? `Norsk A1/A2-elev svarte galt på et franskkort.\nSpørsmål: ${question}\nEleven svarte: "${input}"\nRiktig svar: "${correct}"\n\nForklar på norsk (1-2 korte setninger) SPESIFIKT hva som er galt. Gi én huskeregel knyttet direkte til akkurat dette ordet.\nSvar KUN som JSON: {"forklaring":"...","huskeregel":"..."}`
      : `Norsk A1/A2-elev lærte seg et franskt ord riktig: ${card.fr} = ${card.no}.\n\nGi én kort huskeregel på norsk som hjelper eleven å huske akkurat dette ordet. Ingen forklaring, bare huskeregelen.\nSvar KUN som JSON: {"forklaring":"","huskeregel":"..."}`;
    fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-App-Token": APP_TOKEN },
      signal: controller.signal,
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 180, system: "Respond only with a valid JSON object, no markdown.", messages: [{ role: "user", content: prompt }] }),
    }).then(r => r.json()).then(data => {
      const text = data.content?.find(b => b.type === "text")?.text || "";
      const match = text.match(/\{[\s\S]*?\}/);
      if (match) setAiHint(JSON.parse(match[0]));
    }).catch(() => {}).finally(() => setAiHintLoading(false));
  };

  const submit = () => {
    if (!input.trim() || !card) return;
    const res = checkQuizAnswer(input, card, isReverse);
    const passed = res !== "wrong";
    setChecked(true); setResult(res);
    setStats(s => ({ correct: s.correct + (passed ? 1 : 0), wrong: s.wrong + (passed ? 0 : 1) }));
    setHistory(h => [...h, passed ? "correct" : "wrong"]);
    logDailyAnswer("rettelse");

    // Find matching word in bank to update SRS
    const gc = incrementAnswerCount();
    const bankWord = words.find(w => w.fr === card.fr);
    if (bankWord) {
      const ptsBefore = bankWord.points || 0;
      const updated = updateWordPoints({ ...bankWord }, res, gc);
      const ptsAfter = updated.points || 0;
      setPointsInfo({
        pts: ptsAfter, ptsBefore,
        tierBefore: getWordTier(ptsBefore), tierAfter: getWordTier(ptsAfter),
        justMastered: ptsAfter >= MASTERY_POINTS && ptsBefore < MASTERY_POINTS,
      });
      setWords(prev => prev.map(w => {
        if (w.fr !== card.fr) return w;
        const pb = w.points || 0;
        const upd = updateWordPoints(w, res, gc);
        logWordAnswer(w.fr, w.no, w.phonetic, pb, upd.points, res);
        const srOverride = upd._srOverride;
        const { _srOverride: _, ...clean } = upd;
        if (srOverride) return { ...clean, ...srOverride };
        if ((clean.points || 0) < MASTERY_POINTS) {
          const { level: nl, nextReview: nr } = scheduleNext(w.level, passed);
          return { ...clean, level: nl, nextReview: nr };
        }
        return clean;
      }));
    }
  };

  const next = () => {
    const remaining = queue.slice(1);
    const passed = result !== "wrong";
    if (!passed) {
      const at = Math.min(3, remaining.length);
      const recycled = [...remaining.slice(0, at), { ...card }, ...remaining.slice(at)];
      setQueue(recycled); setCard(recycled[0]);
      setInput(""); setChecked(false); setResult(""); setPointsInfo(null); setFireworksDone(false); setTierPopDone(false);
      return;
    }
    if (!remaining.length) { touchStreak(); setDone(true); return; }
    setQueue(remaining); setCard(remaining[0]);
    setInput(""); setChecked(false); setResult(""); setPointsInfo(null); setFireworksDone(false); setTierPopDone(false);
  };

  const navBar = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--cream-deep)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, color: "var(--text)" }}>
        <span style={{ color: "var(--color-error)" }}>{ICON}</span> Dagens rettelse
      </div>
      <AutoPlayToggle autoPlay={autoPlay} onToggle={onToggleAutoPlay} />
    </div>
  );

  // Empty state
  if (!card && !done) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", color: "var(--text)" }}>
      {navBar}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", gap: 16 }}>
        <div style={{ fontSize: 36, opacity: 0.3 }}>{ICON}</div>
        <p style={{ color: "var(--text-subtle)", lineHeight: 1.9, fontFamily: "var(--font-body)" }}>
          Ingen feil registrert ennå.<br />Gjør noen øvelser, så vil Pierre notere hva du sliter med.
        </p>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  // Done state
  if (done) return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", color: "var(--text)" }}>
      {navBar}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", gap: 20 }}>
        <div style={{ fontSize: 48 }}>✦</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontStyle: "italic", color: "var(--cream)" }}>Bra jobbet!</div>
        <div style={{ color: "var(--text-subtle)", fontFamily: "var(--font-body)", lineHeight: 1.7 }}>
          {stats.correct} riktige · {stats.wrong} feil<br />
          <span style={{ fontSize: 13 }}>Fortsett å øve, så blir disse lettere.</span>
        </div>
        <button onClick={onBack} style={{ marginTop: 8, padding: "12px 28px", background: "var(--cream)", color: "#1a1410", border: "none", borderRadius: 12, fontSize: 15, fontFamily: "var(--font-body)", fontWeight: 600, cursor: "pointer" }}>
          Tilbake
        </button>
      </div>
      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );

  const prompt = isReverse ? card.no : card.fr;
  const hint = isReverse ? "Skriv på fransk" : "Skriv på norsk";
  const colorResult = result === "correct" ? "var(--color-success)" : result === "close" ? "var(--amber)" : "var(--color-error)";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", color: "var(--text)" }}>
      {navBar}

      {/* Progress bar */}
      <div style={{ height: 3, background: "rgba(230,211,168,0.08)" }}>
        <div style={{ height: "100%", background: "var(--color-error)", width: `${Math.min(100, ((stats.correct + stats.wrong) / total) * 100)}%`, transition: "width 0.4s" }} />
      </div>

      {/* Dot history */}
      <div style={{ display: "flex", gap: 5, padding: "10px 20px 0", flexWrap: "wrap" }}>
        {history.map((h, i) => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: h === "correct" ? "var(--color-success)" : "var(--color-error)" }} />
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 0" }}>
        {/* Error badge */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <div style={{ background: "rgba(225,112,85,0.12)", border: "1px solid rgba(225,112,85,0.3)", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "var(--color-error)", letterSpacing: 1, textTransform: "uppercase" }}>
            {card.errorCount > 1 ? `${card.errorCount} feil siste 10 dager` : "Feil registrert"}
          </div>
        </div>

        {/* Prompt card */}
        <motion.div
          key={card.fr + String(isReverse)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "22px 20px", marginBottom: 16, textAlign: "center" }}
        >
          <div style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>
            {isReverse ? "Norsk → Fransk" : "Fransk → Norsk"}
          </div>
          <div style={{ fontFamily: isReverse ? "var(--font-body)" : "var(--font-display)", fontStyle: isReverse ? "normal" : "italic", fontSize: 26, color: "var(--text)", marginBottom: isReverse ? 0 : 6 }}>
            {prompt}
          </div>
          {!isReverse && card.phonetic && (
            <div style={{ fontSize: 13, color: "var(--cream-deep)", fontFamily: "var(--font-body)", marginBottom: 4 }}>[{card.phonetic}]</div>
          )}
          {!isReverse && (
            <SpeakButton fr={card.fr} speak={speak} speaking={speaking} size={22} style={{ marginTop: 6 }} />
          )}
        </motion.div>

        {/* Input */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { if (!checked) submit(); else next(); } }}
            onFocus={() => setTimeout(() => inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 300)}
            placeholder={hint}
            disabled={checked}
            style={{
              flex: 1, padding: "13px 16px", borderRadius: 12,
              background: checked ? (result === "wrong" ? "rgba(225,112,85,0.08)" : "rgba(0,184,148,0.08)") : "var(--surface)",
              border: checked ? `1.5px solid ${colorResult}` : "1.5px solid var(--border)",
              color: "var(--text)", fontSize: 16, fontFamily: "var(--font-body)", outline: "none",
            }}
          />
          {!checked && (
            <button onClick={submit} style={{ padding: "0 18px", background: "var(--cream)", color: "#1a1410", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}>
              Sjekk
            </button>
          )}
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {checked && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ background: result === "wrong" ? "rgba(225,112,85,0.08)" : "rgba(0,184,148,0.08)", border: `1px solid ${colorResult}`, borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}
            >
              <div style={{ fontSize: 13, color: colorResult, fontWeight: 600, marginBottom: 4 }}>
                {result === "correct" ? "Riktig! ✓" : result === "close" ? "Nesten! ~" : "Feil ✗"}
              </div>
              {result === "wrong" && (
                <div style={{ fontSize: 14, color: "var(--text-subtle)", fontFamily: "var(--font-body)", marginBottom: 8 }}>
                  Riktig svar: <span style={{ color: "var(--cream)", fontFamily: isReverse ? "var(--font-display)" : "var(--font-body)", fontStyle: isReverse ? "italic" : "normal" }}>
                    {isReverse ? card.fr : card.no}
                  </span>
                </div>
              )}
              {card.fr && (
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <SpeakButton onClick={() => speak(card.fr)} />
                  <SpeakButton onClick={() => speak(card.fr, 0.5)} slow />
                </div>
              )}
              {!aiHint && !aiHintLoading && (
                <button onClick={requestHint} style={{ background: "none", border: "1px solid var(--border)", borderRadius: 10, padding: "7px 14px", fontSize: 12, color: "var(--text-subtle)", cursor: "pointer", fontFamily: "var(--font-body)", marginTop: 10 }}>
                  💡 Få tilbakemelding
                </button>
              )}
              {(aiHintLoading || aiHint) && (
                <div style={{ marginTop: 12, background: "rgba(230,211,168,0.04)", border: "1px solid rgba(230,211,168,0.14)", borderRadius: 10, padding: "10px 14px" }}>
                  {aiHintLoading ? (
                    <div style={{ fontSize: 12, color: "var(--text-subtle)", opacity: 0.7 }}>🤔 Analyserer…</div>
                  ) : aiHint ? (
                    <>
                      {aiHint.forklaring && <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.65, marginBottom: aiHint.huskeregel ? 8 : 0 }}>{aiHint.forklaring}</div>}
                      {aiHint.huskeregel && (
                        <>
                          <div style={{ fontSize: 10, color: "var(--cream-deep)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Huskeregel</div>
                          <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.65, fontStyle: "italic" }}>{aiHint.huskeregel}</div>
                        </>
                      )}
                    </>
                  ) : null}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {pointsInfo && <PointsBadge info={pointsInfo} onFireworksDone={() => setFireworksDone(true)} onTierPopDone={() => setTierPopDone(true)} />}

        {checked && (
          <div style={{ padding: "12px 0 108px" }}>
            <button onClick={next} style={{ width: "100%", padding: "15px", background: "var(--cream)", color: "#1a1410", border: "none", borderRadius: 14, fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)" }}>
              {queue.length <= 1 ? "Ferdig" : result === "wrong" ? "Prøv igjen" : "Neste →"}
            </button>
          </div>
        )}
      </div>

      {pointsInfo?.justMastered && !fireworksDone && <Fireworks onDone={() => setFireworksDone(true)} />}
      {pointsInfo && pointsInfo.tierAfter > pointsInfo.tierBefore && !pointsInfo.justMastered && !fireworksDone && (
        <ConfettiBurst onDone={() => setFireworksDone(true)} />
      )}
      {pointsInfo && pointsInfo.tierAfter > pointsInfo.tierBefore && !tierPopDone && (
        <TierPop tier={pointsInfo.tierAfter} onDone={() => setTierPopDone(true)} />
      )}

      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}
