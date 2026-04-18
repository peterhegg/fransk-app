import { useState, useRef, useEffect } from "react";
import { MODES, DAGENS_GLOSE_KEY, GRAMMAR_TOPICS, VOCAB_GOALS, VOCAB_CAT_ORDER, VOCAB_CAT_MAP, MASTERY_LABELS, MASTERY_COLORS, MASTERY_POINTS, ORDMESTER_GOALS } from "../constants.js";
import { todayStr, getDue, loadGrammarProgress, getMasteredCount, loadAnswerCount, getWordTier, loadOrdmesterGoals, saveOrdmesterGoals, resetOrdmesterGoals, loadGoalOrder, saveGoalOrder, resetGoalOrder, loadActivityLog, loadTodaysWordAnswers, loadUserProfile, saveUserProfile, DEFAULT_PROFILE } from "../utils.jsx";
import BottomNav from "../components/BottomNav.jsx";
import OrdmesterTeller from "../components/OrdmesterTeller.jsx";

const MODE_COLORS = {
  "dagens-glose":      "linear-gradient(135deg, #6C5CE7, #a29bf7)",
  "glose":             "linear-gradient(135deg, #00b894, #55efc4)",
  "dagens-grammatikk": "linear-gradient(135deg, #0984e3, #74b9ff)",
  "grammatikk-ovelse": "linear-gradient(135deg, #5a4fcf, #9b8ff5)",
  "teksthjelp":        "linear-gradient(135deg, #e17055, #fab1a0)",
  "fri":               "linear-gradient(135deg, #f0a500, #ffd166)",
};

const MODE_EMOJI = {
  "dagens-glose": "🗼", "glose": "🃏", "dagens-grammatikk": "📖",
  "grammatikk-ovelse": "✏️", "teksthjelp": "📝", "fri": "🎙️",
};

function timeGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "God morgen" : h < 17 ? "God ettermiddag" : "God kveld";
}

const getCat = (w) => w.cat || VOCAB_CAT_MAP[w.fr] || "Andre ord";

function speakFr(text) {
  window.speechSynthesis?.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "fr-FR";
  utt.rate = 0.9;
  window.speechSynthesis?.speak(utt);
}

function WordDetailModal({ word, onClose, onSave }) {
  const pts = word.points || 0;
  const tier = getWordTier(pts);
  const currentCat = getCat(word);
  const [editingCat, setEditingCat] = useState(false);
  const [selectedCat, setSelectedCat] = useState(currentCat);
  const [dragY, setDragY] = useState(0);
  const [animated, setAnimated] = useState(false);
  const dragStartY = useRef(null);
  const sheetRef = useRef(null);

  useEffect(() => {
    document.body.style.overscrollBehavior = "none";
    const timer = setTimeout(() => setAnimated(true), 260);
    return () => {
      document.body.style.overscrollBehavior = "";
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const onMove = (e) => {
      if (dragStartY.current === null) return;
      const dy = e.touches[0].clientY - dragStartY.current;
      if (dy > 0) { setDragY(dy); e.preventDefault(); }
    };
    el.addEventListener("touchmove", onMove, { passive: false });
    return () => el.removeEventListener("touchmove", onMove);
  }, []);

  const handleTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY;
    setDragY(0);
  };

  const handleTouchEnd = () => {
    if (dragY > 80) onClose();
    else setDragY(0);
    dragStartY.current = null;
  };

  const save = () => {
    onSave({ ...word, cat: selectedCat });
    setEditingCat(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(26,26,46,0.4)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: "relative",
          background: "var(--surface)",
          borderRadius: "24px 24px 0 0",
          padding: "24px 24px 40px",
          boxShadow: "0 -8px 40px rgba(108,92,231,0.15)",
          animation: animated ? "none" : "slideUp 0.25s ease both",
          transform: animated ? `translateY(${dragY}px)` : undefined,
          transition: animated && dragY === 0 ? "transform 0.3s ease" : "none",
          touchAction: "pan-y",
        }}>
        <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 99, margin: "0 auto 20px" }} />

        <div style={{ textAlign: "center", marginBottom: 20, position: "relative" }}>
          <div style={{ fontSize: 32, fontStyle: "italic", fontFamily: "var(--font-display)", color: "var(--text)", marginBottom: 4 }}>{word.fr}</div>
          {word.phonetic && <div style={{ fontSize: 14, color: "var(--accent)", opacity: 0.7, marginBottom: 6 }}>({word.phonetic})</div>}
          <div style={{ fontSize: 18, color: "var(--text-subtle)" }}>{word.no}</div>
          <button
            onClick={() => speakFr(word.fr)}
            style={{ position: "absolute", top: 0, right: 0, background: "var(--accent-bg)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 17 }}>
            🔊
          </button>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, background: "var(--bg)", borderRadius: 14, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 600, color: "var(--accent)" }}>{pts}</div>
            <div style={{ fontSize: 10, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 }}>av {MASTERY_POINTS} pts</div>
            <div style={{ height: 4, background: "var(--border)", borderRadius: 99, overflow: "hidden", marginTop: 8 }}>
              <div style={{ height: "100%", width: `${Math.min(100, (pts / MASTERY_POINTS) * 100)}%`, background: "linear-gradient(to right, var(--accent), var(--accent-light))", borderRadius: 99 }} />
            </div>
          </div>
          <div style={{ flex: 1, background: "var(--bg)", borderRadius: 14, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: MASTERY_COLORS[tier] || "var(--accent)", marginBottom: 4 }}>
              {tier === 5 ? "★ mestret" : MASTERY_LABELS[tier]}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 0.5 }}>Mestringsnivå</div>
          </div>
        </div>

        <div style={{ background: "var(--bg)", borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: editingCat ? 12 : 0 }}>
            <div>
              <div style={{ fontSize: 10, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Kategori</div>
              <div style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{selectedCat}</div>
            </div>
            <button onClick={() => setEditingCat(e => !e)}
              style={{ background: "var(--accent-bg)", border: "none", borderRadius: 10, color: "var(--accent)", fontSize: 12, fontWeight: 500, padding: "6px 12px", cursor: "pointer", fontFamily: "var(--font-body)" }}>
              {editingCat ? "Avbryt" : "Endre"}
            </button>
          </div>
          {editingCat && (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {VOCAB_CAT_ORDER.map(cat => (
                  <button key={cat} onClick={() => setSelectedCat(cat)}
                    style={{ background: selectedCat === cat ? "var(--accent)" : "var(--surface)", border: `1px solid ${selectedCat === cat ? "var(--accent)" : "var(--border)"}`, borderRadius: 20, padding: "5px 12px", cursor: "pointer", fontSize: 12, color: selectedCat === cat ? "white" : "var(--text)", fontFamily: "var(--font-body)", transition: "all 0.15s" }}>
                    {cat}
                  </button>
                ))}
              </div>
              <button onClick={save}
                style={{ width: "100%", background: "linear-gradient(135deg, var(--accent), var(--accent-light))", border: "none", borderRadius: 12, color: "white", fontFamily: "var(--font-body)", fontWeight: 500, fontSize: 14, padding: "12px", cursor: "pointer" }}>
                Lagre kategori
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function getOrderedGoals(customOrder) {
  if (!customOrder) return VOCAB_GOALS;
  const ordered = customOrder.map(id => VOCAB_GOALS.find(g => g.id === id)).filter(Boolean);
  const missing = VOCAB_GOALS.filter(g => !customOrder.includes(g.id));
  return [...ordered, ...missing];
}

function SheetModal({ onClose, children, style = {} }) {
  const [dragY, setDragY] = useState(0);
  const [animated, setAnimated] = useState(false);
  const dragStartY = useRef(null);
  const sheetRef = useRef(null);

  useEffect(() => {
    document.body.style.overscrollBehavior = "none";
    const timer = setTimeout(() => setAnimated(true), 260);
    return () => {
      document.body.style.overscrollBehavior = "";
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const onMove = (e) => {
      if (dragStartY.current === null) return;
      const dy = e.touches[0].clientY - dragStartY.current;
      if (dy > 0) { setDragY(dy); e.preventDefault(); }
    };
    el.addEventListener("touchmove", onMove, { passive: false });
    return () => el.removeEventListener("touchmove", onMove);
  }, []);

  const handleTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY;
    setDragY(0);
  };

  const handleTouchEnd = () => {
    if (dragY > 80) onClose();
    else setDragY(0);
    dragStartY.current = null;
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(26,26,46,0.4)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: "relative",
          background: "var(--surface)",
          borderRadius: "24px 24px 0 0",
          boxShadow: "0 -8px 40px rgba(108,92,231,0.15)",
          animation: animated ? "none" : "slideUp 0.25s ease both",
          transform: animated ? `translateY(${dragY}px)` : undefined,
          transition: animated && dragY === 0 ? "transform 0.3s ease" : "none",
          touchAction: "pan-y",
          display: "flex",
          flexDirection: "column",
          maxHeight: "85dvh",
          ...style,
        }}>
        <div style={{ width: 36, height: 4, background: "var(--border)", borderRadius: 99, margin: "16px auto 0", flexShrink: 0 }} />
        {children}
      </div>
    </div>
  );
}

function VocabGoalOrderModal({ onClose, onSave }) {
  const initialOrder = getOrderedGoals(loadGoalOrder()).map(g => g.id);
  const [order, setOrder] = useState(initialOrder);

  const move = (i, dir) => {
    const next = [...order];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setOrder(next);
  };

  const goalsMap = Object.fromEntries(VOCAB_GOALS.map(g => [g.id, g]));

  return (
    <SheetModal onClose={onClose}>
      <div style={{ padding: "16px 24px 8px", flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>Rekkefølge på læringsmål</div>
        <div style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 4 }}>Flytt bolkene opp eller ned for å tilpasse læringsveien.</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px", scrollbarWidth: "none" }}>
        {order.map((id, i) => {
          const g = goalsMap[id];
          if (!g) return null;
          return (
            <div key={id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 20, textAlign: "center", fontSize: 11, color: "var(--text-subtle)", flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1, fontSize: 13, color: "var(--text)", lineHeight: 1.3 }}>{g.label}</div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button onClick={() => move(i, -1)} disabled={i === 0}
                  style={{ background: i === 0 ? "var(--bg)" : "var(--accent-bg)", border: "none", borderRadius: 8, width: 30, height: 30, cursor: i === 0 ? "default" : "pointer", fontSize: 14, color: i === 0 ? "var(--text-subtle)" : "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>↑</button>
                <button onClick={() => move(i, 1)} disabled={i === order.length - 1}
                  style={{ background: i === order.length - 1 ? "var(--bg)" : "var(--accent-bg)", border: "none", borderRadius: 8, width: 30, height: 30, cursor: i === order.length - 1 ? "default" : "pointer", fontSize: 14, color: i === order.length - 1 ? "var(--text-subtle)" : "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>↓</button>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: "12px 16px 40px", display: "flex", gap: 10, flexShrink: 0, borderTop: "1px solid var(--border)" }}>
        <button onClick={() => { resetGoalOrder(); onSave(null); }}
          style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text-subtle)", fontSize: 13, padding: "12px", cursor: "pointer", fontFamily: "var(--font-body)" }}>
          Tilbakestill
        </button>
        <button onClick={() => { saveGoalOrder(order); onSave(order); }}
          style={{ flex: 2, background: "linear-gradient(135deg, var(--accent), var(--accent-light))", border: "none", borderRadius: 12, color: "white", fontSize: 14, fontWeight: 500, padding: "12px", cursor: "pointer", fontFamily: "var(--font-body)" }}>
          Lagre rekkefølge
        </button>
      </div>
    </SheetModal>
  );
}

function OrdmesterEditModal({ onClose, onSave }) {
  const defaultGoals = loadOrdmesterGoals() || ORDMESTER_GOALS;
  const [goals, setGoals] = useState(defaultGoals.map(g => ({ ...g })));

  const update = (i, field, val) => {
    setGoals(prev => prev.map((g, idx) => idx === i ? { ...g, [field]: field === "target" ? val : val } : g));
  };

  const addGoal = () => {
    const maxTarget = goals.reduce((m, g) => Math.max(m, g.target), 0);
    setGoals(prev => [...prev, { target: maxTarget + 50, reward: "" }]);
  };

  const removeGoal = (i) => setGoals(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = () => {
    const cleaned = goals
      .map(g => ({ target: parseInt(g.target, 10) || 0, reward: String(g.reward).trim() }))
      .filter(g => g.target > 0)
      .sort((a, b) => a.target - b.target);
    if (cleaned.length === 0) return;
    saveOrdmesterGoals(cleaned);
    onSave();
  };

  return (
    <SheetModal onClose={onClose}>
      <div style={{ padding: "16px 24px 8px", flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>Tilpass Ordmestertelleren</div>
        <div style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 4 }}>Sett dine egne mål og belønninger.</div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px", scrollbarWidth: "none" }}>
        {goals.map((g, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
              <input
                type="number" min="1" value={g.target}
                onChange={e => update(i, "target", e.target.value)}
                style={{ width: 70, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "7px 8px", fontSize: 13, color: "var(--text)", fontFamily: "var(--font-body)", textAlign: "center", outline: "none" }}
              />
              <span style={{ fontSize: 11, color: "var(--text-subtle)", whiteSpace: "nowrap" }}>ord</span>
            </div>
            <input
              type="text" placeholder="Belønning…" value={g.reward}
              onChange={e => update(i, "reward", e.target.value)}
              style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "7px 10px", fontSize: 13, color: "var(--text)", fontFamily: "var(--font-body)", outline: "none", minWidth: 0 }}
            />
            {goals.length > 1 && (
              <button onClick={() => removeGoal(i)}
                style={{ background: "rgba(225,112,85,0.10)", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "var(--color-error)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
            )}
          </div>
        ))}
        <button onClick={addGoal}
          style={{ width: "100%", background: "none", border: "1px dashed var(--border)", borderRadius: 12, color: "var(--accent)", fontSize: 13, padding: "10px", cursor: "pointer", fontFamily: "var(--font-body)", marginTop: 8 }}>
          + Legg til mål
        </button>
      </div>
      <div style={{ padding: "12px 16px 40px", display: "flex", gap: 10, flexShrink: 0, borderTop: "1px solid var(--border)" }}>
        <button onClick={() => { resetOrdmesterGoals(); onSave(); }}
          style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text-subtle)", fontSize: 13, padding: "12px", cursor: "pointer", fontFamily: "var(--font-body)" }}>
          Tilbakestill
        </button>
        <button onClick={handleSave}
          style={{ flex: 2, background: "linear-gradient(135deg, var(--accent), var(--accent-light))", border: "none", borderRadius: 12, color: "white", fontSize: 14, fontWeight: 500, padding: "12px", cursor: "pointer", fontFamily: "var(--font-body)" }}>
          Lagre mål
        </button>
      </div>
    </SheetModal>
  );
}

function ActivityModal({ streak, onClose }) {
  const log = loadActivityLog();
  const today = todayStr();
  const days = Array.from({ length: 20 }, (_, i) => {
    const d = new Date(Date.now() - (19 - i) * 86400000);
    const date = d.toISOString().split("T")[0];
    return log.find(e => e.date === date) || { date, answers: 0, vocab: 0, grammar: 0, voice: 0 };
  });
  const maxAnswers = Math.max(...days.map(d => d.answers), 1);
  const last7 = days.slice(-7);
  const weekAnswers = last7.reduce((s, d) => s + d.answers, 0);
  const weekVocab = last7.reduce((s, d) => s + d.vocab, 0);
  const weekGrammar = last7.reduce((s, d) => s + d.grammar, 0);
  const weekVoice = last7.reduce((s, d) => s + d.voice, 0);

  return (
    <SheetModal onClose={onClose}>
      <div style={{ padding: "16px 24px 8px", flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>Aktivitetshistorikk</div>
        <div style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 2 }}>Siste 20 dager</div>
      </div>

      <div style={{ display: "flex", gap: 8, padding: "0 16px 16px", flexShrink: 0 }}>
        {[
          { label: "Svar", val: weekAnswers, color: "var(--accent)" },
          { label: "Glose", val: weekVocab, color: "#00b894" },
          { label: "Gram.", val: weekGrammar, color: "#0984e3" },
          { label: "Snakk", val: weekVoice, color: "#f0a500" },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: "var(--bg)", borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 10, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 8px", scrollbarWidth: "none" }}>
        <div style={{ display: "flex", gap: 3, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4, alignItems: "flex-end" }}>
          {days.map(day => {
            const isToday = day.date === today;
            const barH = day.answers === 0 ? 4 : Math.max(8, (day.answers / maxAnswers) * 100);
            const dayN = parseInt(day.date.slice(-2));
            return (
              <div key={day.date} style={{ flexShrink: 0, width: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div style={{ fontSize: 9, color: isToday ? "var(--accent)" : "var(--text-subtle)", fontWeight: isToday ? 700 : 400 }}>
                  {day.answers > 0 ? day.answers : ""}
                </div>
                <div style={{ width: 18, height: barH, background: isToday ? "var(--accent)" : day.answers > 0 ? "rgba(108,92,231,0.4)" : "var(--accent-bg)", borderRadius: "4px 4px 0 0", transition: "height 0.4s ease" }} />
                <div style={{ display: "flex", gap: 2, height: 12, alignItems: "center" }}>
                  {day.vocab > 0 && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#00b894" }} title="Glose" />}
                  {day.grammar > 0 && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#0984e3" }} title="Grammatikk" />}
                  {day.voice > 0 && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#f0a500" }} title="Samtale" />}
                </div>
                <div style={{ fontSize: 9, color: isToday ? "var(--accent)" : "var(--text-subtle)", fontWeight: isToday ? 700 : 400 }}>
                  {isToday ? "i dag" : dayN}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 12, fontSize: 11, color: "var(--text-subtle)", justifyContent: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00b894", display: "inline-block" }} />Gloser</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0984e3", display: "inline-block" }} />Grammatikk</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f0a500", display: "inline-block" }} />Samtale</span>
        </div>

        <div style={{ marginTop: 16, background: "var(--bg)", borderRadius: 14, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, color: "var(--text)" }}>🔥 Streak</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "var(--accent)" }}>{streak} dager</div>
        </div>
      </div>

      <div style={{ padding: "12px 16px 40px", flexShrink: 0, borderTop: "1px solid var(--border)" }}>
        <button onClick={onClose} style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text-subtle)", fontSize: 13, padding: "12px", cursor: "pointer", fontFamily: "var(--font-body)" }}>Lukk</button>
      </div>
    </SheetModal>
  );
}

function TodaysAnswersModal({ onClose }) {
  const entries = loadTodaysWordAnswers();

  const wordMap = {};
  entries.forEach(e => {
    if (!wordMap[e.fr]) wordMap[e.fr] = { fr: e.fr, no: e.no, phonetic: e.phonetic, firstPts: e.pointsBefore, lastPts: e.pointsAfter, count: 0 };
    wordMap[e.fr].lastPts = e.pointsAfter;
    wordMap[e.fr].count++;
  });
  const words = Object.values(wordMap).sort((a, b) => (b.lastPts - b.firstPts) - (a.lastPts - a.firstPts));

  const totalPos = words.filter(w => w.lastPts > w.firstPts).length;
  const totalNeg = words.filter(w => w.lastPts < w.firstPts).length;

  return (
    <SheetModal onClose={onClose}>
      <div style={{ padding: "16px 24px 8px", flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>Svar i dag</div>
        {words.length > 0 ? (
          <div style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 2 }}>
            {words.length} ord testet — <span style={{ color: "#00b894" }}>↑ {totalPos}</span> · <span style={{ color: "var(--color-error)" }}>↓ {totalNeg}</span>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 2 }}>Ingen svar registrert ennå i dag</div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 8px", scrollbarWidth: "none" }}>
        {words.map((w, i) => {
          const net = w.lastPts - w.firstPts;
          const netColor = net > 0 ? "#00b894" : net < 0 ? "var(--color-error)" : "var(--text-subtle)";
          const tier = getWordTier(w.lastPts);
          return (
            <div key={w.fr} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < words.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontStyle: "italic", fontFamily: "var(--font-display)", color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{w.fr}</div>
                <div style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 1 }}>{w.no}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: netColor }}>
                  {net > 0 ? `+${net}` : net < 0 ? `${net}` : "="}
                </div>
                <div style={{ fontSize: 10, color: MASTERY_COLORS[tier] || "var(--text-subtle)", fontWeight: 500 }}>
                  {w.lastPts} pts · {w.count} svar
                </div>
              </div>
            </div>
          );
        })}
        {words.length === 0 && (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-subtle)", fontSize: 14 }}>
            Start en øvelse for å se dagens fremgang her.
          </div>
        )}
      </div>

      <div style={{ padding: "12px 16px 40px", flexShrink: 0, borderTop: words.length > 0 ? "1px solid var(--border)" : "none" }}>
        <button onClick={onClose} style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--text-subtle)", fontSize: 13, padding: "12px", cursor: "pointer", fontFamily: "var(--font-body)" }}>Lukk</button>
      </div>
    </SheetModal>
  );
}

const LEVELS = ["A1", "A1/A2", "A2", "A2/B1", "B1", "B1/B2", "B2", "C1", "C2"];

function UserProfileModal({ onClose, onSave }) {
  const [profile, setProfile] = useState(() => loadUserProfile());
  const set = (k, v) => setProfile(p => ({ ...p, [k]: v }));

  return (
    <SheetModal onClose={onClose}>
      <div style={{ padding: "16px 24px 8px", flexShrink: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>Brukerprofil</div>
        <div style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 2 }}>Tilpass appen til deg</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px", scrollbarWidth: "none" }}>
        {[
          { label: "Navn", key: "name", type: "text", placeholder: "Ditt fornavn" },
          { label: "Lærernavn", key: "teacherName", type: "text", placeholder: "F.eks. Pierre" },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{f.label}</div>
            <input value={profile[f.key]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder}
              style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "10px 14px", fontSize: 14, color: "var(--text)", fontFamily: "var(--font-body)", outline: "none", boxSizing: "border-box" }} />
          </div>
        ))}

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Nivå</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {LEVELS.map(l => (
              <button key={l} onClick={() => set("level", l)}
                style={{ background: profile.level === l ? "var(--accent)" : "var(--bg)", border: `1px solid ${profile.level === l ? "var(--accent)" : "var(--border)"}`, borderRadius: 20, padding: "5px 12px", cursor: "pointer", fontSize: 12, color: profile.level === l ? "white" : "var(--text)", fontFamily: "var(--font-body)", transition: "all 0.15s" }}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {[
          { label: "Ditt kjønn", key: "gender" },
          { label: "Lærerens kjønn", key: "teacherGender" },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{f.label}</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["han", "hun"].map(g => (
                <button key={g} onClick={() => set(f.key, g)}
                  style={{ flex: 1, background: profile[f.key] === g ? "var(--accent)" : "var(--bg)", border: `1px solid ${profile[f.key] === g ? "var(--accent)" : "var(--border)"}`, borderRadius: 12, padding: "10px", cursor: "pointer", fontSize: 13, color: profile[f.key] === g ? "white" : "var(--text)", fontFamily: "var(--font-body)", transition: "all 0.15s" }}>
                  {g === "han" ? "Han/gutt" : "Hun/jente"}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg)", borderRadius: 12, padding: "12px 14px" }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>Dysleksi-tilpasning</div>
            <div style={{ fontSize: 11, color: "var(--text-subtle)", marginTop: 2 }}>Kortere tekster, alltid fonetikk</div>
          </div>
          <button onClick={() => set("dysleksi", !profile.dysleksi)}
            style={{ width: 44, height: 26, borderRadius: 13, background: profile.dysleksi ? "var(--accent)" : "var(--border)", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
            <div style={{ position: "absolute", top: 3, left: profile.dysleksi ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
          </button>
        </div>
      </div>

      <div style={{ padding: "12px 16px 40px", flexShrink: 0, borderTop: "1px solid var(--border)" }}>
        <button onClick={() => { saveUserProfile(profile); onSave(profile); }}
          style={{ width: "100%", background: "linear-gradient(135deg, var(--accent), var(--accent-light))", border: "none", borderRadius: 12, color: "white", fontSize: 14, fontWeight: 500, padding: "12px", cursor: "pointer", fontFamily: "var(--font-body)" }}>
          Lagre profil
        </button>
      </div>
    </SheetModal>
  );
}

export default function HomeScreen({ words, setWords, grammarWords, streak, sessionMsgs, onStart, noWordsMsg, isOnline, offlineBanner, screen, showWords, onNav, onShowWords }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [goalOrderOpen, setGoalOrderOpen] = useState(false);
  const [ordmesterEditOpen, setOrdmesterEditOpen] = useState(false);
  const [goalOrder, setGoalOrder] = useState(() => loadGoalOrder());
  const [ordmesterVersion, setOrdmesterVersion] = useState(0);
  const [activityOpen, setActivityOpen] = useState(false);
  const [svarOpen, setSvarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState(() => loadUserProfile());
  const searchRef = useRef(null);

  const searchResults = searchQuery.trim().length > 0
    ? words.filter(w => {
        const q = searchQuery.toLowerCase();
        return w.fr?.toLowerCase().includes(q) || w.no?.toLowerCase().includes(q) || w.phonetic?.toLowerCase().includes(q);
      }).slice(0, 20)
    : [];

  const answerCount = loadAnswerCount();
  const dueCount = getDue(words, answerCount).length;
  const masteredCount = getMasteredCount(words);

  const dagensDone = (() => {
    try { const s = JSON.parse(localStorage.getItem(DAGENS_GLOSE_KEY) || "{}"); return s.date === todayStr() && s.phase2done; }
    catch { return false; }
  })();

  const completedGrammar = loadGrammarProgress();
  const grammarProgress = `${completedGrammar.length}/${GRAMMAR_TOPICS.length}`;
  const grammarOvDue = getDue(grammarWords, answerCount).length;

  const orderedGoals = getOrderedGoals(goalOrder);
  const cumTargets = orderedGoals.reduce((acc, g, i) => { acc.push((acc[i - 1] || 0) + g.target); return acc; }, []);
  const activeIdx = cumTargets.findIndex(t => words.length < t);
  const idx = activeIdx === -1 ? orderedGoals.length - 1 : activeIdx;
  const activeGoal = orderedGoals[idx];
  const prevTotal = idx === 0 ? 0 : cumTargets[idx - 1];
  const goalTotal = cumTargets[idx];
  const pct = Math.min(100, ((words.length - prevTotal) / (goalTotal - prevTotal)) * 100);

  const recCards = [
    {
      id: "dagens-glose",
      emoji: "🗼",
      gradient: "linear-gradient(135deg, #6C5CE7, #a29bf7)",
      title: "Dagens 5 gloser",
      sub: dagensDone ? "Fullført i dag ✓" : "Ny øvelse klar nå",
      badge: dagensDone ? "✓" : null,
      badgeDone: dagensDone,
    },
    {
      id: "glose",
      emoji: "🃏",
      gradient: "linear-gradient(135deg, #00b894, #55efc4)",
      title: "Klar til repetisjon",
      sub: dueCount > 0 ? `${dueCount} ord venter på deg` : "Ingen ord forfalt",
      badge: dueCount > 0 ? dueCount : null,
      badgeDone: false,
    },
    {
      id: "dagens-grammatikk",
      emoji: "📖",
      gradient: "linear-gradient(135deg, #0984e3, #74b9ff)",
      title: "Daglig grammatikk",
      sub: `${grammarProgress} temaer fullført`,
      badge: grammarOvDue > 0 ? grammarOvDue : null,
      badgeDone: false,
    },
  ];

  return (
    <div style={{ height: "100dvh", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-body)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {offlineBanner}

      {/* Scrollable area */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: 84, scrollbarWidth: "none" }}>

        {/* Header */}
        <div style={{ padding: "52px 24px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--text-subtle)", fontWeight: 400, marginBottom: 3 }}>Bonjour, {profile.name} 👋</div>
            <div style={{ fontSize: 26, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.3px" }}>{timeGreeting()}</div>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--accent-light))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "var(--shadow-sm)" }}>
            🇫🇷
          </div>
        </div>

        {/* Search row */}
        <div style={{ padding: "0 24px 20px", display: "flex", gap: 10, position: "relative" }}>
          <div style={{ flex: 1, background: "var(--surface)", border: `1.5px solid ${searchOpen ? "var(--accent)" : "var(--border)"}`, borderRadius: 14, padding: "0 16px", fontSize: 14, boxShadow: "var(--shadow-sm)", display: "flex", alignItems: "center", gap: 8, transition: "border-color 0.2s" }}>
            <span style={{ opacity: 0.4, flexShrink: 0 }}>🔍</span>
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Søk på ord eller tema…"
              style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: 14, color: "var(--text)", fontFamily: "var(--font-body)", padding: "13px 0" }}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setSearchOpen(false); }} style={{ background: "none", border: "none", color: "var(--text-subtle)", cursor: "pointer", fontSize: 16, padding: 0, flexShrink: 0 }}>✕</button>
            )}
          </div>
          <button onClick={() => setProfileOpen(true)} style={{ width: 48, height: 48, borderRadius: 14, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(108,92,231,0.35)", flexShrink: 0, border: "none", cursor: "pointer" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </button>
        </div>

        {/* Search results dropdown */}
        {searchOpen && searchQuery.trim().length > 0 && (
          <div style={{ margin: "0 24px 16px", background: "var(--surface)", borderRadius: 16, boxShadow: "var(--shadow-md)", border: "1px solid var(--border)", overflow: "hidden", maxHeight: 280, overflowY: "auto" }}>
            {searchResults.length === 0 ? (
              <div style={{ padding: "16px", textAlign: "center", color: "var(--text-subtle)", fontSize: 14 }}>Ingen ord funnet</div>
            ) : searchResults.map((w, i) => {
              const tier = getWordTier(w.points || 0);
              return (
                <div key={w.id || i} onClick={() => { setSelectedWord(w); setSearchOpen(false); }}
                  style={{ width: "100%", borderBottom: i < searchResults.length - 1 ? "1px solid var(--border)" : "none", padding: "10px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "var(--font-body)" }}>
                  <div>
                    <span style={{ fontSize: 15, fontStyle: "italic", color: "var(--text)", fontFamily: "var(--font-display)" }}>{w.fr}</span>
                    {w.no && <span style={{ fontSize: 13, color: "var(--text-subtle)", marginLeft: 8 }}>= {w.no}</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <button onClick={(e) => { e.stopPropagation(); speakFr(w.fr); }}
                      style={{ background: "var(--accent-bg)", border: "none", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, flexShrink: 0 }}>
                      🔊
                    </button>
                    <span style={{ fontSize: 11, color: MASTERY_COLORS[tier] || "var(--accent)", fontWeight: 500 }}>{MASTERY_LABELS[tier]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Backdrop to close search */}
        {searchOpen && !searchQuery && (
          <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setSearchOpen(false)} />
        )}

        {/* Stats */}
        <div style={{ display: "flex", gap: 10, padding: "0 24px 28px" }}>
          <button onClick={onShowWords} style={{ flex: 1, background: "var(--surface)", borderRadius: 14, padding: "12px 10px", textAlign: "center", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)", cursor: "pointer", fontFamily: "var(--font-body)" }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: "var(--accent)", lineHeight: 1, marginBottom: 3 }}>{words.length}</div>
            <div style={{ fontSize: 10, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Ord lært</div>
          </button>
          <button onClick={() => setActivityOpen(true)} style={{ flex: 1, background: "var(--surface)", borderRadius: 14, padding: "12px 10px", textAlign: "center", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)", cursor: "pointer", fontFamily: "var(--font-body)" }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: "var(--accent)", lineHeight: 1, marginBottom: 3 }}>🔥 {streak}</div>
            <div style={{ fontSize: 10, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Dager</div>
          </button>
          <button onClick={() => setSvarOpen(true)} style={{ flex: 1, background: "var(--surface)", borderRadius: 14, padding: "12px 10px", textAlign: "center", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)", cursor: "pointer", fontFamily: "var(--font-body)" }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: "var(--accent)", lineHeight: 1, marginBottom: 3 }}>{sessionMsgs}</div>
            <div style={{ fontSize: 10, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Svar i dag</div>
          </button>
        </div>

        {/* Øvelser */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 24px 14px" }}>
          <span style={{ fontSize: 20, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>Øvelser</span>
        </div>

        <div className="fade-stagger" style={{ display: "flex", gap: 14, padding: "0 24px 4px", overflowX: "auto", scrollbarWidth: "none" }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => onStart(m.id)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0, background: "none", border: "none", padding: 0, fontFamily: "var(--font-body)" }}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: MODE_COLORS[m.id] || "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, boxShadow: "var(--shadow-md)", transition: "transform 0.18s ease" }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.06)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                {MODE_EMOJI[m.id] || m.icon}
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", textAlign: "center", maxWidth: 72, lineHeight: 1.3 }}>{m.label.split("–")[0].split("–")[0].trim()}</div>
            </button>
          ))}
        </div>

        {/* Anbefalt i dag */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "28px 24px 14px" }}>
          <span style={{ fontSize: 20, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>Anbefalt i dag</span>
        </div>

        <div style={{ display: "flex", gap: 16, padding: "0 24px 4px", overflowX: "auto", scrollbarWidth: "none" }}>
          {recCards.map(c => (
            <button key={c.id} onClick={() => onStart(c.id)}
              style={{ flexShrink: 0, width: 220, background: "var(--surface)", borderRadius: 22, overflow: "hidden", boxShadow: "var(--shadow-md)", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "var(--font-body)", padding: 0, transition: "transform 0.2s ease" }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
              <div style={{ height: 120, background: c.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, position: "relative" }}>
                {c.emoji}
                {c.badge !== null && (
                  <div style={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: "50%", background: c.badgeDone ? "var(--accent)" : "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: c.badgeDone ? "white" : "var(--accent)", boxShadow: "var(--shadow-sm)" }}>
                    {c.badge}
                  </div>
                )}
              </div>
              <div style={{ padding: "12px 14px 14px" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-subtle)" }}>{c.sub}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Læringsmål */}
        <div onClick={() => setGoalOrderOpen(true)} style={{ margin: "20px 24px 0", background: "var(--surface)", borderRadius: 20, padding: "18px 20px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)", cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-subtle)", fontWeight: 500 }}>Læringsmål</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 500 }}>Bolk {idx + 1} av {orderedGoals.length}</span>
              <span style={{ fontSize: 13, color: "var(--text-subtle)" }}>›</span>
            </div>
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 16, color: "var(--text)", marginBottom: 12 }}>{activeGoal.label}</div>
          <div style={{ height: 6, background: "var(--accent-bg)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(to right, var(--accent), var(--accent-light))", borderRadius: 99, transition: "width 0.8s ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 11, color: "var(--text-subtle)" }}>{words.length - prevTotal} / {goalTotal - prevTotal} ord i bolken</span>
            <span style={{ fontSize: 11, color: "var(--accent)" }}>{Math.round(pct)}%</span>
          </div>
        </div>

        <div style={{ margin: "20px 24px 0", background: "var(--surface)", borderRadius: 20, padding: "18px 20px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}>
          <OrdmesterTeller key={ordmesterVersion} masteredCount={masteredCount} onEdit={() => setOrdmesterEditOpen(true)} />
        </div>

        {noWordsMsg && (
          <div style={{ fontSize: 13, color: "var(--text-subtle)", textAlign: "center", margin: "16px 24px 0" }}>
            Alle ord er mestret! Kom tilbake i morgen.
          </div>
        )}

      </div>

      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />

      {selectedWord && (
        <WordDetailModal
          word={selectedWord}
          onClose={() => setSelectedWord(null)}
          onSave={updated => {
            setWords(prev => prev.map(w => w.id === updated.id ? updated : w));
            setSelectedWord(null);
          }}
        />
      )}

      {goalOrderOpen && (
        <VocabGoalOrderModal
          onClose={() => setGoalOrderOpen(false)}
          onSave={(newOrder) => { setGoalOrder(newOrder); setGoalOrderOpen(false); }}
        />
      )}

      {ordmesterEditOpen && (
        <OrdmesterEditModal
          onClose={() => setOrdmesterEditOpen(false)}
          onSave={() => { setOrdmesterVersion(v => v + 1); setOrdmesterEditOpen(false); }}
        />
      )}

      {activityOpen && (
        <ActivityModal streak={streak} onClose={() => setActivityOpen(false)} />
      )}

      {svarOpen && (
        <TodaysAnswersModal onClose={() => setSvarOpen(false)} />
      )}

      {profileOpen && (
        <UserProfileModal
          onClose={() => setProfileOpen(false)}
          onSave={(p) => { setProfile(p); setProfileOpen(false); }}
        />
      )}

      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  );
}
