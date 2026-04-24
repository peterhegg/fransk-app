import { useState, useRef, useEffect } from "react";
import { MODES, DAGENS_GLOSE_KEY, GRAMMAR_TOPICS, VOCAB_GOALS, VOCAB_CAT_ORDER, VOCAB_CAT_MAP, MASTERY_LABELS, MASTERY_COLORS, MASTERY_POINTS, ORDMESTER_GOALS } from "../constants.js";
import { todayStr, getDue, loadGrammarProgress, getMasteredCount, loadAnswerCount, getWordTier, loadOrdmesterGoals, saveOrdmesterGoals, resetOrdmesterGoals, loadGoalOrder, saveGoalOrder, resetGoalOrder, loadActivityLog, loadTodaysWordAnswers, loadUserProfile, saveUserProfile, DEFAULT_PROFILE, getWordCountByGoal } from "../utils.jsx";
import BottomNav from "../components/BottomNav.jsx";
import OrdmesterTeller from "../components/OrdmesterTeller.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import WordDetailModal from "../components/WordDetailModal.jsx";

const MODE_IMAGES = {
  "dagens-glose":      "https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=700&q=70&auto=format&fit=crop",
  "glose":             "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&q=70&auto=format&fit=crop",
  "dagens-grammatikk": "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&q=70&auto=format&fit=crop",
  "grammatikk-ovelse": "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=70&auto=format&fit=crop",
  "teksthjelp":        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&q=70&auto=format&fit=crop",
  "fri":               "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=70&auto=format&fit=crop",
};

const GOAL_IMAGES = {
  "core":        "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=700&q=70&auto=format&fit=crop",
  "everyday":    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=700&q=70&auto=format&fit=crop",
  "tdf":         "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=700&q=70&auto=format&fit=crop",
  "senses":      "https://images.unsplash.com/photo-1541101767792-f9b2b1c4f127?w=700&q=70&auto=format&fit=crop",
  "food":        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=700&q=70&auto=format&fit=crop",
  "body":        "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=700&q=70&auto=format&fit=crop",
  "family":      "https://images.unsplash.com/photo-1511895426328-dc8714191011?w=700&q=70&auto=format&fit=crop",
  "travel":      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=700&q=70&auto=format&fit=crop",
  "core2":       "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=700&q=70&auto=format&fit=crop",
  "geo":         "https://images.unsplash.com/photo-1566230724840-9b6fc11e3e5c?w=700&q=70&auto=format&fit=crop",
  "everyday2":   "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=700&q=70&auto=format&fit=crop",
  "identity":    "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=700&q=70&auto=format&fit=crop",
  "popculture":  "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=700&q=70&auto=format&fit=crop",
  "history":     "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=700&q=70&auto=format&fit=crop",
  "arts":        "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=700&q=70&auto=format&fit=crop",
  "politics":    "https://images.unsplash.com/photo-1568205631302-c7d88eCcbFd1?w=700&q=70&auto=format&fit=crop",
  "tdf2":        "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=700&q=70&auto=format&fit=crop",
  "gastro":      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=700&q=70&auto=format&fit=crop",
  "prose1":      "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=700&q=70&auto=format&fit=crop",
  "work":        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=700&q=70&auto=format&fit=crop",
  "abstract":    "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=700&q=70&auto=format&fit=crop",
  "geo2":        "https://images.unsplash.com/photo-1549144511-f099e773c147?w=700&q=70&auto=format&fit=crop",
  "body2":       "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=700&q=70&auto=format&fit=crop",
  "popculture2": "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=700&q=70&auto=format&fit=crop",
  "everyday3":   "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=700&q=70&auto=format&fit=crop",
  "prose2":      "https://images.unsplash.com/photo-1512149177596-f817c7ef5d4c?w=700&q=70&auto=format&fit=crop",
  "history2":    "https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=700&q=70&auto=format&fit=crop",
  "politics2":   "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=700&q=70&auto=format&fit=crop",
  "aesthetics":  "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=700&q=70&auto=format&fit=crop",
  "paris1920":   "https://images.unsplash.com/photo-1520520731457-9283dd14aa66?w=700&q=70&auto=format&fit=crop",
  "nature":      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=700&q=70&auto=format&fit=crop",
  "core3":       "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=700&q=70&auto=format&fit=crop",
  "medicine":    "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=700&q=70&auto=format&fit=crop",
  "philosophy":  "https://images.unsplash.com/photo-1544717305-2782549b5136?w=700&q=70&auto=format&fit=crop",
  "gastro2":     "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=700&q=70&auto=format&fit=crop",
  "prose3":      "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=700&q=70&auto=format&fit=crop",
  "tdf3":        "https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?w=700&q=70&auto=format&fit=crop",
  "houellebecq": "https://images.unsplash.com/photo-1543508282-6319a3e2621f?w=700&q=70&auto=format&fit=crop",
  "paris_adv":   "https://images.unsplash.com/photo-1503917988258-f87a78e3c995?w=700&q=70&auto=format&fit=crop",
  "free":        "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=700&q=70&auto=format&fit=crop",
};

const MODE_SHORT = {
  "dagens-glose":      "Dagens gloser",
  "glose":             "Glosekort",
  "dagens-grammatikk": "Daglig grammatikk",
  "grammatikk-ovelse": "Grammatikkøvelse",
  "teksthjelp":        "Teksthjelp",
  "fri":               "Spør fritt",
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

function MiniGraph({ days, onTap }) {
  const maxAnswers = Math.max(...days.map(d => d.answers), 1);
  const today = todayStr();
  return (
    <button onClick={onTap} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
      <div style={{ display: "flex", gap: 5, alignItems: "flex-end", height: 58 }}>
        {days.map(day => {
          const isToday = day.date === today;
          const barH = day.answers === 0 ? 3 : Math.max(8, (day.answers / maxAnswers) * 44);
          const d = new Date(day.date + "T12:00:00");
          const dayLabel = isToday ? "i dag" : d.toLocaleDateString("nb", { weekday: "short" }).slice(0, 2);
          return (
            <div key={day.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              {day.answers > 0 && (
                <div style={{ fontSize: 9, color: isToday ? "var(--accent)" : "var(--text-subtle)", fontWeight: 600, lineHeight: 1 }}>{day.answers}</div>
              )}
              {day.answers === 0 && <div style={{ height: 13 }} />}
              <div style={{ width: "100%", height: barH, background: isToday ? "var(--accent)" : day.answers > 0 ? "rgba(123,114,240,0.45)" : "var(--border)", borderRadius: "4px 4px 0 0", transition: "height 0.4s ease" }} />
              <div style={{ fontSize: 9, color: isToday ? "var(--accent)" : "var(--text-subtle)", fontWeight: isToday ? 700 : 400, whiteSpace: "nowrap" }}>{dayLabel}</div>
            </div>
          );
        })}
      </div>
    </button>
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
  const insideScrolled = useRef(false);

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
      if (dy > 0 && !insideScrolled.current) { setDragY(dy); e.preventDefault(); }
    };
    el.addEventListener("touchmove", onMove, { passive: false });
    return () => el.removeEventListener("touchmove", onMove);
  }, []);

  const handleTouchStart = (e) => {
    dragStartY.current = e.touches[0].clientY;
    setDragY(0);
    let node = e.target;
    insideScrolled.current = false;
    while (node && node !== sheetRef.current) {
      if (node.scrollTop > 0) { insideScrolled.current = true; break; }
      node = node.parentElement;
    }
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

function VocabGoalOrderModal({ onClose, onSave, words }) {
  const initialOrder = getOrderedGoals(loadGoalOrder()).map(g => g.id);
  const [order, setOrder] = useState(initialOrder);
  const wordCountByGoal = getWordCountByGoal(words);

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
          const learned = wordCountByGoal[id] || 0;
          const done = learned >= g.target;
          return (
            <div key={id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 20, textAlign: "center", fontSize: 11, color: "var(--text-subtle)", flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1, lineHeight: 1.3 }}>
                <div style={{ fontSize: 13, color: "var(--text)" }}>{g.label}</div>
                <div style={{ fontSize: 11, color: done ? "var(--color-success)" : "var(--text-subtle)", marginTop: 1 }}>
                  {learned > 0 ? `${learned} / ${g.target} ord` : `${g.target} ord`}
                  {done ? " ✓" : ""}
                </div>
              </div>
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

export default function HomeScreen({ words, setWords, grammarWords, streak, sessionMsgs, onStart, noWordsMsg, dagensLoading, isOnline, offlineBanner, screen, showWords, onNav, onShowWords }) {
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
  const masteredCount = getMasteredCount(words) + (grammarWords || []).filter(w => (w.points || 0) >= MASTERY_POINTS).length;

  const dagensDone = (() => {
    try { const s = JSON.parse(localStorage.getItem(DAGENS_GLOSE_KEY) || "{}"); return s.date === todayStr() && s.phase2done; }
    catch { return false; }
  })();

  const completedGrammar = loadGrammarProgress();
  const grammarProgress = `${completedGrammar.length}/${GRAMMAR_TOPICS.length}`;
  const grammarOvDue = getDue(grammarWords, answerCount).length;

  const orderedGoals = getOrderedGoals(goalOrder);
  const wordCountByGoal = getWordCountByGoal(words);
  const activeIdx = orderedGoals.findIndex(g => (wordCountByGoal[g.id] || 0) < g.target);
  const idx = activeIdx === -1 ? orderedGoals.length - 1 : activeIdx;
  const activeGoal = orderedGoals[idx];
  const activeWordCount = wordCountByGoal[activeGoal.id] || 0;
  const pct = Math.min(100, (activeWordCount / activeGoal.target) * 100);

  const todaysGloseImg = GOAL_IMAGES[activeGoal?.id] || MODE_IMAGES["dagens-glose"];

  const grammarDoneToday = (() => {
    const log = loadActivityLog();
    const entry = log.find(e => e.date === todayStr());
    return (entry?.grammar || 0) > 0;
  })();

  const dagensOvelse = [
    {
      id: "dagens-glose",
      title: "Dagens fem gloser",
      sub: dagensDone ? "Fullført i dag ✓" : dagensLoading ? "Henter…" : "Ny øvelse klar nå",
      done: dagensDone,
      img: todaysGloseImg,
    },
    {
      id: "dagens-grammatikk",
      title: "Daglig grammatikk",
      sub: grammarDoneToday ? "Fullført i dag ✓" : `${grammarProgress} temaer fullført`,
      done: grammarDoneToday,
      img: MODE_IMAGES["dagens-grammatikk"],
    },
  ].sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0));

  const last7Days = (() => {
    const log = loadActivityLog();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - (6 - i) * 86400000);
      const date = d.toISOString().split("T")[0];
      return log.find(e => e.date === date) || { date, answers: 0 };
    });
  })();

  return (
    <div style={{ height: "100dvh", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-body)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {offlineBanner}

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingBottom: 84, scrollbarWidth: "none" }}>

        {/* Header */}
        <div style={{ padding: "52px 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--text-subtle)", fontWeight: 400, marginBottom: 3 }}>Bonjour, {profile.name} 👋</div>
            <div style={{ fontSize: 26, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.3px" }}>{timeGreeting()}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ThemeToggle />
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--accent-light))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "var(--shadow-sm)" }}>
              🇫🇷
            </div>
          </div>
        </div>

        {/* Search + profile */}
        <div style={{ padding: "0 20px 16px", display: "flex", gap: 10, position: "relative" }}>
          <div style={{ flex: 1, background: "var(--surface)", border: `1.5px solid ${searchOpen ? "var(--accent)" : "var(--border)"}`, borderRadius: 14, padding: "0 16px", display: "flex", alignItems: "center", gap: 8, transition: "border-color 0.2s" }}>
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

        {/* Search results */}
        {searchOpen && searchQuery.trim().length > 0 && (
          <div style={{ margin: "0 20px 16px", background: "var(--surface)", borderRadius: 16, boxShadow: "var(--shadow-md)", border: "1px solid var(--border)", overflow: "hidden", maxHeight: 280, overflowY: "auto" }}>
            {searchResults.length === 0 ? (
              <div style={{ padding: "16px", textAlign: "center", color: "var(--text-subtle)", fontSize: 14 }}>Ingen ord funnet</div>
            ) : searchResults.map((w, i) => {
              const tier = getWordTier(w.points || 0);
              return (
                <div key={w.id || i} onClick={() => { setSelectedWord(w); setSearchOpen(false); }}
                  style={{ borderBottom: i < searchResults.length - 1 ? "1px solid var(--border)" : "none", padding: "10px 16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "var(--font-body)" }}>
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
        {searchOpen && !searchQuery && (
          <div style={{ position: "fixed", inset: 0, zIndex: 10 }} onClick={() => setSearchOpen(false)} />
        )}

        {/* Stats row */}
        <div style={{ display: "flex", gap: 10, padding: "0 20px 28px" }}>
          {[
            { label: "Ord lært",   value: words.length,  emoji: "📚", onClick: onShowWords,                color: "var(--accent)" },
            { label: "Dager",      value: streak,         emoji: "🔥", onClick: () => setActivityOpen(true), color: "#e17055" },
            { label: "Svar i dag", value: sessionMsgs,    emoji: "✓",  onClick: () => setSvarOpen(true),     color: "#00c896" },
          ].map(s => (
            <button key={s.label} onClick={s.onClick} style={{
              flex: 1, background: "var(--surface)", borderRadius: 16,
              padding: "14px 8px 12px", textAlign: "center",
              boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)",
              cursor: "pointer", fontFamily: "var(--font-body)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            }}>
              <div style={{ fontSize: 13, lineHeight: 1 }}>{s.emoji}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 500 }}>{s.label}</div>
            </button>
          ))}
        </div>

        {/* Dagens øvelse — horisontal scroll */}
        <div style={{ padding: "0 0 28px" }}>
          <div style={{ padding: "0 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>Dagens øvelse</span>
          </div>
          <div style={{ display: "flex", gap: 12, padding: "0 20px 4px", overflowX: "auto", scrollbarWidth: "none" }}>
            {dagensOvelse.map(card => {
              const isLoading = card.id === "dagens-glose" && dagensLoading;
              return (
                <button key={card.id}
                  onClick={() => !card.done && !isLoading && onStart(card.id)}
                  style={{
                    flexShrink: 0, width: "calc(80vw)", maxWidth: 320, height: 200,
                    borderRadius: 20, overflow: "hidden", position: "relative",
                    border: "none", padding: 0,
                    cursor: card.done || isLoading ? "default" : "pointer",
                    opacity: isLoading ? 0.75 : 1,
                    boxShadow: "var(--shadow-md)",
                  }}>
                  <img src={card.img} alt={card.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", inset: 0, background: card.done
                    ? "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 100%)"
                    : "linear-gradient(to top, rgba(0,0,0,0.84) 0%, rgba(0,0,0,0.28) 55%, rgba(0,0,0,0.04) 100%)"
                  }} />
                  {card.done && (
                    <div style={{ position: "absolute", top: 14, right: 14, width: 30, height: 30, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "white", boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>✓</div>
                  )}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 18px 18px", textAlign: "left" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 4, letterSpacing: "-0.2px" }}>
                      {isLoading ? "Henter øvelse…" : card.title}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.72)" }}>{card.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fremgang i dag — mini sparkline */}
        <div style={{ margin: "0 20px 28px", background: "var(--surface)", borderRadius: 20, padding: "16px 18px 14px", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>Fremgang siste 7 dager</span>
            <button onClick={() => setSvarOpen(true)} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-body)", padding: 0 }}>
              Svar i dag ›
            </button>
          </div>
          <MiniGraph days={last7Days} onTap={() => setActivityOpen(true)} />
        </div>

        {/* Oppgaver — horisontal scroll med bilder */}
        <div style={{ padding: "0 0 28px" }}>
          <div style={{ padding: "0 20px 12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", letterSpacing: "-0.2px" }}>Oppgaver</span>
          </div>
          <div className="fade-stagger" style={{ display: "flex", gap: 12, padding: "0 20px 4px", overflowX: "auto", scrollbarWidth: "none" }}>
            {MODES.filter(m => m.id !== "dagens-glose" && m.id !== "dagens-grammatikk").map(m => {
              const isLoading = false;
              return (
                <button key={m.id} onClick={() => !isLoading && onStart(m.id)}
                  style={{
                    flexShrink: 0, width: 148,
                    background: "var(--surface)", borderRadius: 18,
                    overflow: "hidden", boxShadow: "var(--shadow-sm)",
                    border: "1px solid var(--border)",
                    cursor: isLoading ? "default" : "pointer",
                    textAlign: "left", fontFamily: "var(--font-body)",
                    padding: 0, opacity: isLoading ? 0.7 : 1,
                    transition: "transform 0.18s ease, box-shadow 0.18s ease",
                  }}
                  onMouseEnter={e => { if (!isLoading) { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "var(--shadow-card-hover)"; }}}
                  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}>
                  <div style={{ position: "relative", height: 104, overflow: "hidden" }}>
                    <img
                      src={MODE_IMAGES[m.id]}
                      alt={MODE_SHORT[m.id]}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 45%, rgba(0,0,0,0.38) 100%)" }} />
                  </div>
                  <div style={{ padding: "10px 12px 13px" }}>
                    <div style={{
                      fontSize: 12, fontWeight: 600, color: "var(--text)",
                      lineHeight: 1.35, overflow: "hidden",
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    }}>
                      {isLoading ? "Henter…" : MODE_SHORT[m.id]}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Læringsmål */}
        <div onClick={() => setGoalOrderOpen(true)} style={{ margin: "0 20px 16px", background: "var(--surface)", borderRadius: 20, padding: "18px 20px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)", cursor: "pointer" }}>
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
            <span style={{ fontSize: 11, color: "var(--text-subtle)" }}>{activeWordCount} / {activeGoal.target} ord i bolken</span>
            <span style={{ fontSize: 11, color: "var(--accent)" }}>{Math.round(pct)}%</span>
          </div>
        </div>

        {/* Ordmestertelleren */}
        <div style={{ margin: "0 20px 0", background: "var(--surface)", borderRadius: 20, padding: "18px 20px", boxShadow: "var(--shadow-sm)", border: "1px solid var(--border)" }}>
          <OrdmesterTeller key={ordmesterVersion} masteredCount={masteredCount} onEdit={() => setOrdmesterEditOpen(true)} />
        </div>

        {noWordsMsg && (
          <div style={{ fontSize: 13, color: "var(--text-subtle)", textAlign: "center", margin: "16px 20px 0" }}>
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
          words={words}
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
      {activityOpen && <ActivityModal streak={streak} onClose={() => setActivityOpen(false)} />}
      {svarOpen && <TodaysAnswersModal onClose={() => setSvarOpen(false)} />}
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
