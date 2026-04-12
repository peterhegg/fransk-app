import { useState, useRef, useEffect } from "react";
import {
  MODES, EXIT_PHRASES,
  DAGENS_GLOSE_KEY, SR_INTERVALS, SESSION_SCREEN_KEY,
  gold, cream, card, brd,
} from "./constants.js";
import {
  loadWords, saveWords, loadGrammarWords, saveGrammarWords,
  loadGrammarProgress, saveGrammarProgress,
  loadStreak, touchStreak, getDue, scheduleNext, shuffle,
  getQuizOptions, checkQuizAnswer, todayStr,
  getTodaysGloseWords, getCurrentGrammarTopic,
} from "./utils.jsx";
import BottomNav from "./components/BottomNav.jsx";
import ExitDialog from "./components/ExitDialog.jsx";
import DagensExerciseScreen from "./components/DagensExerciseScreen.jsx";
import QuizExerciseScreen from "./components/QuizExerciseScreen.jsx";
import HomeScreen from "./screens/HomeScreen.jsx";
import WordsScreen from "./screens/WordsScreen.jsx";
import ChatScreen from "./screens/ChatScreen.jsx";

export default function App() {
  // --- Navigation ---
  const [screen, setScreen] = useState("home");
  const [mode, setMode] = useState(null);
  const [showWords, setShowWords] = useState(false);

  // --- Shared data ---
  const [words, setWords] = useState(loadWords);
  const [grammarWords, setGrammarWords] = useState(loadGrammarWords);
  const [streak, setStreak] = useState(() => loadStreak().current);
  const [sessionMsgs, setSessionMsgs] = useState(() => { try { const s = JSON.parse(localStorage.getItem("fransk-session-msgs") || "{}"); return s.date === todayStr() ? (s.count || 0) : 0; } catch { return 0; } });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [noWordsMsg, setNoWordsMsg] = useState(false);

  // --- Speech ---
  const [speaking, setSpeaking] = useState(false);
  const speakingRef = useRef(false);

  // --- Exit dialog ---
  const [showExitDialog, _setShowExitDialog] = useState(false);
  const showExitDialogRef = useRef(false);
  const setShowExitDialog = v => { showExitDialogRef.current = v; _setShowExitDialog(v); };
  const [exitPhraseIdx, setExitPhraseIdx] = useState(0);
  const skipCountRef = useRef(0);
  const screenRef = useRef(screen);
  const showWordsRef = useRef(showWords);

  // --- Dagens Glose state ---
  const [dagensPhase, setDagensPhase] = useState(0);
  const [dagensWords, setDagensWords] = useState([]);
  const [dagensQueue, setDagensQueue] = useState([]);
  const [dagensCard, setDagensCard] = useState(null);
  const [dagensInput, setDagensInput] = useState("");
  const [dagensChecked, setDagensChecked] = useState(false);
  const [dagensResult, setDagensResult] = useState("");
  const [dagensStats, setDagensStats] = useState({ correct: 0, wrong: 0 });
  const [dagensMastered, setDagensMastered] = useState(new Set());

  // --- Glose state ---
  const [gloseQueue, setGloseQueue] = useState([]);
  const [gloseCard, setGloseCard] = useState(null);
  const [gloseInput, setGloseInput] = useState("");
  const [gloseChecked, setGloseChecked] = useState(false);
  const [gloseResult, setGloseResult] = useState("");
  const [gloseStats, setGloseStats] = useState({ correct: 0, wrong: 0 });
  const [gloseOptions, setGloseOptions] = useState([]);
  const [gloseMode, setGloseMode] = useState("choice");

  // --- Daglig Grammatikk state ---
  const [grammarTopic, setGrammarTopic] = useState(null);
  const [grammarPhase, setGrammarPhase] = useState(0);
  const [grammarQueue, setGrammarQueue] = useState([]);
  const [grammarCard, setGrammarCard] = useState(null);
  const [grammarInput, setGrammarInput] = useState("");
  const [grammarChecked, setGrammarChecked] = useState(false);
  const [grammarResult, setGrammarResult] = useState("");
  const [grammarStats, setGrammarStats] = useState({ correct: 0, wrong: 0 });
  const [grammarMastered, setGrammarMastered] = useState(new Set());

  // --- Grammatikk Ovelse state ---
  const [gramOvQueue, setGramOvQueue] = useState([]);
  const [gramOvCard, setGramOvCard] = useState(null);
  const [gramOvInput, setGramOvInput] = useState("");
  const [gramOvChecked, setGramOvChecked] = useState(false);
  const [gramOvResult, setGramOvResult] = useState("");
  const [gramOvStats, setGramOvStats] = useState({ correct: 0, wrong: 0 });
  const [gramOvOptions, setGramOvOptions] = useState([]);
  const [gramOvMode, setGramOvMode] = useState("choice");

  // --- Persist words ---
  useEffect(() => { saveWords(words); }, [words]);
  useEffect(() => { saveGrammarWords(grammarWords); }, [grammarWords]);

  // --- Online status ---
  useEffect(() => {
    const on = () => setIsOnline(true), off = () => setIsOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // --- Session screen save ---
  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { showWordsRef.current = showWords; }, [showWords]);
  useEffect(() => {
    try { sessionStorage.setItem(SESSION_SCREEN_KEY, JSON.stringify({ screen, modeId: mode?.id || null, showWords })); }
    catch {}
  }, [screen, mode, showWords]);

  // --- Speech synthesis preload ---
  useEffect(() => { if (window.speechSynthesis) window.speechSynthesis.getVoices(); }, []);

  // --- Back button / exit dialog ---
  useEffect(() => {
    const url = window.location.pathname + window.location.search;
    history.replaceState({ fransBase: true }, "", url);
    history.pushState({ fransNav: true }, "", url);

    const restoreSentinel = () => { if (!history.state?.fransNav) history.pushState({ fransNav: true }, "", url); };
    const handler = () => {
      if (skipCountRef.current > 0) { skipCountRef.current--; return; }
      history.pushState({ fransNav: true }, "", url);
      if (showExitDialogRef.current) { setShowExitDialog(false); return; }
      if (showWordsRef.current) { setShowWords(false); }
      else if (screenRef.current !== "home") { setScreen("home"); }
      else { setExitPhraseIdx(i => (i + 1) % EXIT_PHRASES.length); setShowExitDialog(true); }
    };
    const onPageShow = e => { if (e.persisted) restoreSentinel(); };
    const onVisible = () => { if (!document.hidden) restoreSentinel(); };
    window.addEventListener("popstate", handler);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("popstate", handler);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // --- Session restore ---
  useEffect(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION_SCREEN_KEY) || "null");
      if (!s) return;
      if (s.showWords) { setShowWords(true); return; }
      const legacyMap = { quiz: "glose", dagens: "dagens-glose" };
      const rs = legacyMap[s.screen] || s.screen;
      if (rs === "glose") startGlose();
      else if (rs === "dagens-glose") startDagensGlose();
      else if (rs === "dagens-grammatikk") startDagensGrammatikk();
      else if (rs === "grammatikk-ovelse") startGramOvelse();
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Speak ---
  const speak = (text, rate = 0.85) => {
    if (!window.speechSynthesis) return;
    if (speakingRef.current) {
      window.speechSynthesis.cancel();
      speakingRef.current = false; setSpeaking(false);
      return;
    }
    // Clear any stuck synthesis state
    window.speechSynthesis.cancel();
    const cleanLine = t => t.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/[✓✗].*?:/g, "").replace(/GLOSE:/g, "").trim();
    const detectLang = l => {
      if (/[øåæ]/i.test(l)) return "nb-NO";
      if (/[éèêëàâùûôîœç]/i.test(l)) return "fr-FR";
      if (/\b(jeg|og|er|til|for|ikke|fra|med|har|kan|det|norsk)\b/i.test(l)) return "nb-NO";
      return "fr-FR";
    };
    const lines = text.split("\n").map(l => ({ text: cleanLine(l), lang: detectLang(l) })).filter(l => l.text.length > 1);
    if (!lines.length) return;
    // Check which language voices are available (Samsung may not have fr/nb installed)
    const voices = window.speechSynthesis.getVoices();
    const hasLang = lang => !voices.length || voices.some(v => v.lang.startsWith(lang.slice(0, 2)));
    speakingRef.current = true; setSpeaking(true);
    lines.forEach((l, i) => {
      const utt = new SpeechSynthesisUtterance(l.text);
      if (hasLang(l.lang)) utt.lang = l.lang;
      utt.rate = rate;
      if (i === lines.length - 1) {
        utt.onend = () => { speakingRef.current = false; setSpeaking(false); };
        utt.onerror = () => { speakingRef.current = false; setSpeaking(false); };
      }
      window.speechSynthesis.speak(utt);
    });
  };

  // --- Start modes ---
  const startDagensGlose = () => {
    const ex = getTodaysGloseWords(words);
    if (!ex.words.length) { setNoWordsMsg(true); setTimeout(() => setNoWordsMsg(false), 3000); return; }
    const phase = ex.phase2done ? 3 : ex.phase1done ? 2 : 1;
    setDagensWords(ex.words); setDagensStats({ correct: 0, wrong: 0 }); setDagensMastered(new Set());
    setDagensInput(""); setDagensChecked(false); setDagensResult("");
    if (phase === 1) { const q = shuffle([...ex.words]); setDagensQueue(q); setDagensCard(q[0]); }
    else if (phase === 2) {
      const fill = words.filter(w => !ex.words.some(d => d.fr === w.fr)).sort(() => Math.random() - 0.5).slice(0, 5);
      const all = [...ex.words, ...fill]; setDagensWords(all);
      const p2 = shuffle(all).map(w => ({ ...w, reverse: true })); setDagensQueue(p2); setDagensCard(p2[0]);
    }
    setDagensPhase(phase); setScreen("dagens-glose");
  };

  const startGlose = () => {
    if (!words.length) { setNoWordsMsg(true); setTimeout(() => setNoWordsMsg(false), 3000); return; }
    const due = getDue(words);
    const notDue = words.filter(w => !due.some(d => d.id === w.id));
    const q = shuffle([...due, ...notDue]).slice(0, 20);
    setGloseQueue(q); setGloseCard(q[0]);
    setGloseOptions(getQuizOptions(q[0], words)); setGloseMode(Math.random() < 0.5 ? "input" : "choice");
    setGloseInput(""); setGloseChecked(false); setGloseResult(""); setGloseStats({ correct: 0, wrong: 0 });
    setScreen("glose");
  };

  const startDagensGrammatikk = () => {
    const topic = getCurrentGrammarTopic();
    if (!topic) { setScreen("dagens-grammatikk"); setGrammarPhase(0); setGrammarTopic(null); return; }
    setGrammarTopic(topic); setGrammarPhase(0);
    setGrammarQueue([]); setGrammarCard(null);
    setGrammarInput(""); setGrammarChecked(false); setGrammarResult("");
    setGrammarStats({ correct: 0, wrong: 0 }); setGrammarMastered(new Set());
    setScreen("dagens-grammatikk");
  };

  const startGramOvelse = () => {
    if (!grammarWords.length) { setGramOvCard(null); setScreen("grammatikk-ovelse"); return; }
    const due = getDue(grammarWords);
    const notDue = grammarWords.filter(w => !due.some(d => d.id === w.id));
    const q = shuffle([...due, ...notDue]).slice(0, 20);
    setGramOvQueue(q); setGramOvCard(q[0]);
    setGramOvOptions(getQuizOptions(q[0], grammarWords)); setGramOvMode(Math.random() < 0.5 ? "input" : "choice");
    setGramOvInput(""); setGramOvChecked(false); setGramOvResult(""); setGramOvStats({ correct: 0, wrong: 0 });
    setScreen("grammatikk-ovelse");
  };

  const startMode = id => {
    if (id === "dagens-glose") startDagensGlose();
    else if (id === "glose") startGlose();
    else if (id === "dagens-grammatikk") startDagensGrammatikk();
    else if (id === "grammatikk-ovelse") startGramOvelse();
    else {
      setMode(MODES.find(m => m.id === id)); setScreen("chat");
    }
  };

  // --- Dagens Glose handlers ---
  const submitDagens = () => {
    if (!dagensInput.trim()) return;
    const isReverse = dagensCard?.reverse;
    const result = checkQuizAnswer(dagensInput, dagensCard, isReverse);
    const passed = result !== "wrong";
    setDagensChecked(true); setDagensResult(result);
    setDagensStats(s => ({ correct: s.correct + (passed ? 1 : 0), wrong: s.wrong + (passed ? 0 : 1) }));
    if (passed) {
      const inBank = words.find(w => w.fr === dagensCard.fr);
      if (inBank) {
        const { level: nl, nextReview: nr } = scheduleNext(inBank.level, true);
        setWords(prev => prev.map(w => w.id === inBank.id ? { ...w, level: nl, nextReview: nr } : w));
      } else {
        const nw = { id: Date.now() + Math.random(), fr: dagensCard.fr, no: dagensCard.no, phonetic: dagensCard.phonetic, level: 1, nextReview: Date.now() + SR_INTERVALS[1] * 86400000, added: Date.now() };
        setWords(prev => prev.some(w => w.fr === nw.fr) ? prev : [...prev, nw]);
      }
    } else {
      const inBank = words.find(w => w.fr === dagensCard.fr);
      if (inBank) {
        const { level: nl, nextReview: nr } = scheduleNext(inBank.level, false);
        setWords(prev => prev.map(w => w.id === inBank.id ? { ...w, level: nl, nextReview: nr } : w));
      }
    }
  };

  const nextDagens = () => {
    setDagensInput(""); setDagensChecked(false); setDagensResult("");
    const remaining = dagensQueue.slice(1);
    const passed = dagensResult !== "wrong";
    if (!passed) {
      const at = Math.min(3, remaining.length);
      const recycled = [...remaining.slice(0, at), { ...dagensCard }, ...remaining.slice(at)];
      setDagensQueue(recycled); setDagensCard(recycled[0]);
      return;
    }
    const newMastered = new Set([...dagensMastered, dagensCard.fr]);
    setDagensMastered(newMastered);
    if (remaining.length === 0) {
      const allDone = dagensWords.every(w => newMastered.has(w.fr));
      if (!allDone) {
        const unmastered = dagensWords.filter(w => !newMastered.has(w.fr)).map(w => dagensPhase === 2 ? { ...w, reverse: true } : w);
        setDagensQueue(unmastered); setDagensCard(unmastered[0]); return;
      }
      const saved = JSON.parse(localStorage.getItem(DAGENS_GLOSE_KEY) || "{}");
      if (dagensPhase === 1) {
        localStorage.setItem(DAGENS_GLOSE_KEY, JSON.stringify({ ...saved, phase1done: true }));
        const fill = words.filter(w => !dagensWords.some(d => d.fr === w.fr)).sort(() => Math.random() - 0.5).slice(0, 5);
        const allWords = [...dagensWords, ...fill]; setDagensWords(allWords);
        const p2 = shuffle(allWords).map(w => ({ ...w, reverse: true }));
        setDagensQueue(p2); setDagensCard(p2[0]); setDagensPhase(2);
        setDagensStats({ correct: 0, wrong: 0 }); setDagensMastered(new Set());
      } else {
        localStorage.setItem(DAGENS_GLOSE_KEY, JSON.stringify({ ...saved, phase2done: true }));
        setDagensPhase(3); setStreak(touchStreak());
      }
      return;
    }
    setDagensQueue(remaining); setDagensCard(remaining[0]);
  };

  // --- Glose handlers ---
  const submitGlose = () => {
    if (!gloseInput.trim()) return;
    const result = checkQuizAnswer(gloseInput, gloseCard);
    const passed = result !== "wrong";
    setGloseChecked(true); setGloseResult(result);
    setGloseStats(s => ({ correct: s.correct + (passed ? 1 : 0), wrong: s.wrong + (passed ? 0 : 1) }));
    if (gloseCard.id) {
      const { level: nl, nextReview: nr } = scheduleNext(gloseCard.level, passed);
      setWords(prev => prev.map(w => w.id === gloseCard.id ? { ...w, level: nl, nextReview: nr } : w));
    } else if (passed) {
      const nw = { id: Date.now() + Math.random(), fr: gloseCard.fr, no: gloseCard.no, phonetic: gloseCard.phonetic, level: 1, nextReview: Date.now() + SR_INTERVALS[1] * 86400000, added: Date.now() };
      setWords(prev => prev.some(w => w.fr === nw.fr) ? prev : [...prev, nw]);
    }
  };

  const nextGlose = () => {
    const remaining = gloseQueue.slice(1);
    if (!remaining.length) { setScreen("home"); return; }
    setGloseQueue(remaining); setGloseCard(remaining[0]);
    setGloseOptions(getQuizOptions(remaining[0], words));
    setGloseMode(Math.random() < 0.5 ? "input" : "choice");
    setGloseInput(""); setGloseChecked(false); setGloseResult("");
  };

  // --- Daglig Grammatikk handlers ---
  const startGrammarExercise = () => {
    if (!grammarTopic) return;
    const q = shuffle([...grammarTopic.pairs]);
    setGrammarQueue(q); setGrammarCard(q[0]); setGrammarPhase(1);
  };

  const submitGrammar = () => {
    if (!grammarInput.trim()) return;
    const isReverse = grammarCard?.reverse;
    const result = checkQuizAnswer(grammarInput, grammarCard, isReverse);
    setGrammarChecked(true); setGrammarResult(result);
    const passed = result !== "wrong";
    setGrammarStats(s => ({ correct: s.correct + (passed ? 1 : 0), wrong: s.wrong + (passed ? 0 : 1) }));
  };

  const nextGrammar = () => {
    setGrammarInput(""); setGrammarChecked(false); setGrammarResult("");
    const remaining = grammarQueue.slice(1);
    const passed = grammarResult !== "wrong";
    if (!passed) {
      const at = Math.min(3, remaining.length);
      const recycled = [...remaining.slice(0, at), { ...grammarCard }, ...remaining.slice(at)];
      setGrammarQueue(recycled); setGrammarCard(recycled[0]); return;
    }
    const newMastered = new Set([...grammarMastered, grammarCard.fr]);
    setGrammarMastered(newMastered);
    if (remaining.length === 0) {
      const allPairs = grammarTopic.pairs;
      const allDone = allPairs.every(p => newMastered.has(p.fr));
      if (!allDone && grammarPhase === 1) {
        const unmastered = allPairs.filter(p => !newMastered.has(p.fr));
        setGrammarQueue(unmastered); setGrammarCard(unmastered[0]); return;
      }
      if (grammarPhase === 1) {
        const p2 = shuffle(allPairs).map(p => ({ ...p, reverse: true }));
        setGrammarQueue(p2); setGrammarCard(p2[0]); setGrammarPhase(2);
        setGrammarStats({ correct: 0, wrong: 0 }); setGrammarMastered(new Set()); return;
      }
      // Phase 2 done — save grammar words
      const newGW = grammarTopic.pairs.map(p => ({ id: Date.now() + Math.random(), fr: p.fr, no: p.no, phonetic: p.phonetic, level: 1, nextReview: Date.now() + SR_INTERVALS[1] * 86400000, added: Date.now(), topicId: grammarTopic.id }));
      setGrammarWords(prev => [...prev, ...newGW.filter(nw => !prev.some(ow => ow.fr === nw.fr && ow.topicId === nw.topicId))]);
      const progress = [...loadGrammarProgress(), grammarTopic.id];
      saveGrammarProgress(progress);
      setGrammarPhase(3);
      return;
    }
    setGrammarQueue(remaining); setGrammarCard(remaining[0]);
  };

  // --- Grammatikk Ovelse handlers ---
  const submitGramOvelse = () => {
    if (!gramOvInput.trim()) return;
    const result = checkQuizAnswer(gramOvInput, gramOvCard);
    const passed = result !== "wrong";
    setGramOvChecked(true); setGramOvResult(result);
    setGramOvStats(s => ({ correct: s.correct + (passed ? 1 : 0), wrong: s.wrong + (passed ? 0 : 1) }));
    if (gramOvCard?.id) {
      const { level: nl, nextReview: nr } = scheduleNext(gramOvCard.level, passed);
      setGrammarWords(prev => prev.map(w => w.id === gramOvCard.id ? { ...w, level: nl, nextReview: nr } : w));
    }
  };

  const nextGramOvelse = () => {
    const remaining = gramOvQueue.slice(1);
    if (!remaining.length) { setScreen("home"); return; }
    setGramOvQueue(remaining); setGramOvCard(remaining[0]);
    setGramOvOptions(getQuizOptions(remaining[0], grammarWords));
    setGramOvMode(Math.random() < 0.5 ? "input" : "choice");
    setGramOvInput(""); setGramOvChecked(false); setGramOvResult("");
  };

  // --- Nav helper ---
  const handleNav = id => {
    if (id === "words") { setShowWords(true); setScreen("home"); }
    else if (id === "home") { setShowWords(false); setScreen("home"); }
    else if (id === "glose") { setShowWords(false); startGlose(); }
    else if (id === "fri") { setShowWords(false); startMode("fri"); }
  };

  const navProps = { screen, showWords, onNav: handleNav };

  const offlineBanner = !isOnline ? (
    <div style={{ background: "#3a2a10", borderBottom: `1px solid ${gold}44`, padding: "8px 16px", fontSize: 13, color: gold, textAlign: "center", letterSpacing: 1 }}>
      Ingen internettforbindelse — Claude er ikke tilgjengelig
    </div>
  ) : null;

  // --- Routing ---
  if (showWords) return (
    <>
      {showExitDialog && <ExitDialog phraseIdx={exitPhraseIdx} onStay={() => setShowExitDialog(false)} onExit={() => { setShowExitDialog(false); skipCountRef.current = 1; history.back(); }} />}
      <WordsScreen words={words} setWords={setWords} onBack={() => setShowWords(false)} {...navProps} />
    </>
  );

  if (screen === "dagens-glose") return (
    <>
      {showExitDialog && <ExitDialog phraseIdx={exitPhraseIdx} onStay={() => setShowExitDialog(false)} onExit={() => { setShowExitDialog(false); skipCountRef.current = 1; history.back(); }} />}
      <DagensExerciseScreen title="Dagens øvelse – glose" icon="◆" phase={dagensPhase} topic={null} dailyWords={dagensWords} queue={dagensQueue} card={dagensCard} input={dagensInput} setInput={setDagensInput} checked={dagensChecked} result={dagensResult} stats={dagensStats} onSubmit={submitDagens} onNext={nextDagens} onBack={() => setScreen("home")} speak={speak} speaking={speaking} {...navProps} />
    </>
  );

  if (screen === "glose") return (
    <>
      {showExitDialog && <ExitDialog phraseIdx={exitPhraseIdx} onStay={() => setShowExitDialog(false)} onExit={() => { setShowExitDialog(false); skipCountRef.current = 1; history.back(); }} />}
      <QuizExerciseScreen title="Gloseøvelse" icon="◈" emptyMsg="Ingen ord i ordbanken ennå. Gjør Dagens øvelse – glose for å lære dine første ord." queue={gloseQueue} card={gloseCard} input={gloseInput} setInput={setGloseInput} checked={gloseChecked} result={gloseResult} stats={gloseStats} options={gloseOptions} mode={gloseMode} onSubmit={submitGlose} onNext={nextGlose} onBack={() => setScreen("home")} speak={speak} speaking={speaking} {...navProps} />
    </>
  );

  if (screen === "dagens-grammatikk") return (
    <>
      {showExitDialog && <ExitDialog phraseIdx={exitPhraseIdx} onStay={() => setShowExitDialog(false)} onExit={() => { setShowExitDialog(false); skipCountRef.current = 1; history.back(); }} />}
      {grammarTopic ? (
        <DagensExerciseScreen title="Daglig grammatikk" icon="◑" phase={grammarPhase} topic={grammarTopic} dailyWords={grammarTopic?.pairs || []} queue={grammarQueue} card={grammarCard} input={grammarInput} setInput={setGrammarInput} checked={grammarChecked} result={grammarResult} stats={grammarStats} onStartExercise={startGrammarExercise} onSubmit={submitGrammar} onNext={nextGrammar} onBack={() => setScreen("home")} speak={speak} speaking={speaking} {...navProps} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#f5f0e6", fontFamily: "'Jost', sans-serif", color: cream, paddingBottom: 66 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${brd}`, background: card }}>
            <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: gold, fontSize: 14, cursor: "pointer", fontFamily: "'Jost', sans-serif" }}>← Tilbake</button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, letterSpacing: 2 }}><span style={{ color: gold }}>◑</span> Daglig grammatikk</div>
            <div style={{ width: 60 }} />
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center", gap: 16 }}>
            <div style={{ fontSize: 40 }}>🎓</div>
            <div style={{ fontSize: 20, color: gold, fontStyle: "italic" }}>Alle grammatikktemaer fullført!</div>
            <div style={{ fontSize: 14, color: `${cream}88`, lineHeight: 1.8 }}>Du har lært all grammatikken som er tilgjengelig nå.<br />Bruk Grammatikkøvelse for å repetere.</div>
          </div>
          <BottomNav {...navProps} />
        </div>
      )}
    </>
  );

  if (screen === "grammatikk-ovelse") return (
    <>
      {showExitDialog && <ExitDialog phraseIdx={exitPhraseIdx} onStay={() => setShowExitDialog(false)} onExit={() => { setShowExitDialog(false); skipCountRef.current = 1; history.back(); }} />}
      <QuizExerciseScreen title="Grammatikkøvelse" icon="◐" emptyMsg="Ingen grammatikk lært ennå. Gjør Daglig grammatikk for å låse opp." queue={gramOvQueue} card={gramOvCard} input={gramOvInput} setInput={setGramOvInput} checked={gramOvChecked} result={gramOvResult} stats={gramOvStats} options={gramOvOptions} mode={gramOvMode} onSubmit={submitGramOvelse} onNext={nextGramOvelse} onBack={() => setScreen("home")} speak={speak} speaking={speaking} {...navProps} />
    </>
  );

  if (screen === "chat") return (
    <>
      {showExitDialog && <ExitDialog phraseIdx={exitPhraseIdx} onStay={() => setShowExitDialog(false)} onExit={() => { setShowExitDialog(false); skipCountRef.current = 1; history.back(); }} />}
      <ChatScreen mode={mode} words={words} setWords={setWords} isOnline={isOnline} speak={speak} speaking={speaking} sessionMsgs={sessionMsgs} setSessionMsgs={setSessionMsgs} onBack={() => setScreen("home")} onShowWords={() => setShowWords(true)} {...navProps} />
    </>
  );

  return (
    <>
      {showExitDialog && <ExitDialog phraseIdx={exitPhraseIdx} onStay={() => setShowExitDialog(false)} onExit={() => { setShowExitDialog(false); skipCountRef.current = 1; history.back(); }} />}
      <HomeScreen words={words} grammarWords={grammarWords} streak={streak} sessionMsgs={sessionMsgs} onStart={startMode} noWordsMsg={noWordsMsg} isOnline={isOnline} offlineBanner={offlineBanner} onShowWords={() => setShowWords(true)} {...navProps} />
    </>
  );
}
