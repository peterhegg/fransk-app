import { useState, useRef, useEffect } from "react";
import {
  MODES, EXIT_PHRASES,
  DAGENS_GLOSE_KEY, SR_INTERVALS, SESSION_SCREEN_KEY, MASTERY_POINTS,
  PROXY_URL, APP_TOKEN,
  gold, cream, card, brd,
} from "./constants.js";
import {
  loadWords, saveWords, loadGrammarWords, saveGrammarWords,
  loadGrammarProgress, saveGrammarProgress,
  loadStreak, touchStreak, getDue, scheduleNext, shuffle,
  getQuizOptions, checkQuizAnswer, todayStr,
  getTodaysGloseWords, getCurrentGrammarTopic,
  incrementAnswerCount, loadAnswerCount, updateWordPoints,
  logDailyAnswer, logVocabSession, logGrammarSession, logWordAnswer,
  loadGeneratedVocab, saveGeneratedVocab, needsNewVocab,
  getActiveGoal, loadGoalOrder,
} from "./utils.jsx";
import BottomNav from "./components/BottomNav.jsx";
import ExitDialog from "./components/ExitDialog.jsx";
import DagensExerciseScreen from "./components/DagensExerciseScreen.jsx";
import QuizExerciseScreen from "./components/QuizExerciseScreen.jsx";
import TranslationExerciseScreen from "./components/TranslationExerciseScreen.jsx";
import MultipleChoiceOnlyScreen from "./components/MultipleChoiceOnlyScreen.jsx";
import HomeScreen from "./screens/HomeScreen.jsx";
import WordsScreen from "./screens/WordsScreen.jsx";
import ChatScreen from "./screens/ChatScreen.jsx";
import VoiceScreen from "./screens/VoiceScreen.jsx";
import SayWordScreen from "./screens/SayWordScreen.jsx";
import SentenceTranslationScreen from "./screens/SentenceTranslationScreen.jsx";

function TranslateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12H19M5 12l4-4M5 12l4 4M19 12l-4-4M19 12l-4 4"/>
    </svg>
  );
}

function MultiChoiceIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="4" height="4" rx="1"/><line x1="10" y1="7" x2="21" y2="7"/>
      <rect x="3" y="13" width="4" height="4" rx="1"/><line x1="10" y1="15" x2="21" y2="15"/>
      <polyline points="4 7 5 8 7 5"/>
    </svg>
  );
}

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
  const [dagensLoading, setDagensLoading] = useState(false);

  // --- Speech ---
  const [speaking, setSpeaking] = useState(false);
  const speakingRef = useRef(false);
  const voicesRef = useRef([]);

  // --- Exit dialog ---
  const [showExitDialog, _setShowExitDialog] = useState(false);
  const showExitDialogRef = useRef(false);
  const setShowExitDialog = v => { showExitDialogRef.current = v; _setShowExitDialog(v); };
  const [exitPhraseIdx, setExitPhraseIdx] = useState(0);

  const screenRef = useRef(screen);
  const showWordsRef = useRef(showWords);
  const sessionSaveFirstRender = useRef(true);

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
  const [dagensHistory, setDagensHistory] = useState([]);

  // --- Glose state ---
  const [gloseQueue, setGloseQueue] = useState([]);
  const [gloseCard, setGloseCard] = useState(null);
  const [gloseInput, setGloseInput] = useState("");
  const [gloseChecked, setGloseChecked] = useState(false);
  const [gloseResult, setGloseResult] = useState("");
  const [gloseStats, setGloseStats] = useState({ correct: 0, wrong: 0 });
  const [gloseOptions, setGloseOptions] = useState([]);
  const [gloseMode, setGloseMode] = useState("choice");
  const [gloseHistory, setGloseHistory] = useState([]);

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
  const [grammarHistory, setGrammarHistory] = useState([]);

  // --- Grammatikk Ovelse state ---
  const [gramOvQueue, setGramOvQueue] = useState([]);
  const [gramOvCard, setGramOvCard] = useState(null);
  const [gramOvInput, setGramOvInput] = useState("");
  const [gramOvChecked, setGramOvChecked] = useState(false);
  const [gramOvResult, setGramOvResult] = useState("");
  const [gramOvStats, setGramOvStats] = useState({ correct: 0, wrong: 0 });
  const [gramOvOptions, setGramOvOptions] = useState([]);
  const [gramOvMode, setGramOvMode] = useState("choice");
  const [gramOvHistory, setGramOvHistory] = useState([]);

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
  // Restore sentinel when screen/showWords changes AFTER mount (e.g. after Avslutt without closing).
  // Skip first run to avoid double-push with the back-button effect below.
  const exitIntentRef = useRef(false);
  const sentinelMountedRef = useRef(false);
  useEffect(() => {
    if (!sentinelMountedRef.current) { sentinelMountedRef.current = true; return; }
    if (history.state?.fransNav) return;
    const base = window.location.pathname + window.location.search;
    if (window.location.hash) window.history.replaceState(null, "", base);
    window.history.pushState({ fransNav: true }, "", base + "#nav");
  }, [screen, showWords]);
  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { showWordsRef.current = showWords; }, [showWords]);
  useEffect(() => {
    if (sessionSaveFirstRender.current) { sessionSaveFirstRender.current = false; return; }
    try { sessionStorage.setItem(SESSION_SCREEN_KEY, JSON.stringify({ screen, modeId: mode?.id || null, showWords })); }
    catch {}
  }, [screen, mode, showWords]);

  // --- Speech synthesis preload ---
  useEffect(() => {
    if (!window.speechSynthesis) return;
    const load = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  // --- Back button / exit dialog ---
  // Uses #nav hash sentinel. pushSentinel strips any existing hash first (replaceState)
  // so that the subsequent pushState always causes a real URL change on back navigation —
  // guaranteeing hashchange + popstate fire on Samsung Android Chrome PWA.
  // Chrome PWA remembers last URL between sessions, so app may reload at #nav; the
  // replaceState ensures we always end up with [base, sentinel@#nav] regardless.
  useEffect(() => {
    const baseUrl = window.location.pathname + window.location.search;
    const sentinelUrl = baseUrl + "#nav";

    const pushSentinel = () => {
      if (history.state?.fransNav) return;
      if (window.location.hash) window.history.replaceState(null, "", baseUrl);
      window.history.pushState({ fransNav: true }, "", sentinelUrl);
    };

    pushSentinel();

    const restoreSentinel = () => {
      if (showExitDialogRef.current) return;
      pushSentinel();
    };

    let handling = false;
    const handler = () => {
      if (handling) return;
      handling = true;
      setTimeout(() => { handling = false; }, 50);

      // Avslutt was clicked — ignore the popstate it causes, let PWA close
      if (exitIntentRef.current) { exitIntentRef.current = false; return; }
      if (showExitDialogRef.current) { setShowExitDialog(false); return; }
      if (showWordsRef.current) { pushSentinel(); setShowWords(false); return; }
      if (screenRef.current !== "home") { pushSentinel(); setScreen("home"); return; }
      // On home: show dialog (no sentinel push — we stay at base)
      setExitPhraseIdx(i => (i + 1) % EXIT_PHRASES.length);
      setShowExitDialog(true);
    };

    const onPageShow = e => { if (e.persisted) restoreSentinel(); };
    const onVisible = () => { if (!document.hidden) restoreSentinel(); };
    window.addEventListener("popstate", handler);
    window.addEventListener("hashchange", handler);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("popstate", handler);
      window.removeEventListener("hashchange", handler);
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
      else if (rs === "ordoversettelse") setScreen("ordoversettelse");
      else if (rs === "flervalg") setScreen("flervalg");
      else if (rs === "si-ordet") setScreen("si-ordet");
      else if (rs === "oversett-grammatikken") setScreen("oversett-grammatikken");
      else if (rs === "grammatikk-flervalg") setScreen("grammatikk-flervalg");
      else if (rs === "oversett-setningen") setScreen("oversett-setningen");
      else if (rs === "chat" && s.modeId) startMode(s.modeId);
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
    const clean = text
      .replace(/\*\*?(.+?)\*\*?/g, "$1")
      .replace(/[✓✗][^:]*:/g, "")
      .replace(/\n+/g, " ")
      .trim();
    if (!clean) return;
    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang = "fr-FR";
    utt.rate = rate;
    const frVoice = voicesRef.current.find(v => v.lang === "fr-FR")
                 || voicesRef.current.find(v => v.lang.startsWith("fr"));
    if (frVoice) utt.voice = frVoice;
    utt.onend = () => { speakingRef.current = false; setSpeaking(false); };
    utt.onerror = () => { speakingRef.current = false; setSpeaking(false); };
    speakingRef.current = true; setSpeaking(true);
    window.speechSynthesis.speak(utt);
  };

  // --- Start modes ---
  const startDagensGlose = async () => {
    const activeGoal = getActiveGoal(words, loadGoalOrder());
    const goalId = activeGoal.id;
    let genVocab = loadGeneratedVocab();

    // Check cached exercise for today
    let cached = null;
    try {
      const s = JSON.parse(localStorage.getItem(DAGENS_GLOSE_KEY) || "{}");
      if (s.date === todayStr() && s.goal === goalId) {
        const learnedFr = new Set(words.map(w => w.fr));
        const hasNew = (s.words || []).some(w => !learnedFr.has(w.fr));
        if (s.phase1done || s.phase2done || hasNew) cached = s;
      }
    } catch {}

    // Helper: fetch new vocab (with 15s timeout, always background-safe)
    const fetchNewVocab = async (currentGenVocab) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      try {
        const knownFr = new Set([...words.map(w => w.fr), ...currentGenVocab.map(v => v.fr)]);
        const res = await fetch(PROXY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-App-Token": APP_TOKEN },
          signal: controller.signal,
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 400,
            system: "You are a French vocabulary generator. Respond only with a valid JSON array, no markdown.",
            messages: [{
              role: "user",
              content: `Generate 10 new French vocabulary words for a Norwegian A1/A2 learner with dyslexia. Current learning topic: "${activeGoal.label}" — ${activeGoal.desc}. The learner is also reading Houellebecq and a book about Paris cultural life in the 1920s. Do NOT include these already-known words: ${[...knownFr].join(", ")}. Return a JSON array only: [{"fr":"...","no":"...","phonetic":"..."}]. Use phonetic spelling in Norwegian (e.g. bonjour → bånsjur). Pick words relevant to the topic and appropriate for A1/A2 level.`,
            }],
          }),
        });
        const data = await res.json();
        const text = data.content?.find(b => b.type === "text")?.text || "";
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
          const generated = JSON.parse(match[0]);
          if (Array.isArray(generated) && generated.length) {
            const fresh = generated
              .filter(v => v.fr && v.no && !knownFr.has(v.fr))
              .map(v => ({ ...v, goal: goalId }));
            const updated = [...currentGenVocab, ...fresh];
            saveGeneratedVocab(updated);
            return updated;
          }
        }
      } catch { /* ignore */ }
      finally { clearTimeout(timeoutId); }
      return currentGenVocab;
    };

    // Helper: launch exercise from data
    const launchExercise = (ex) => {
      const phase = ex.phase2done ? 3 : ex.phase1done ? 2 : 1;
      setDagensWords(ex.words); setDagensStats({ correct: 0, wrong: 0 }); setDagensMastered(new Set());
      setDagensInput(""); setDagensChecked(false); setDagensResult(""); setDagensHistory([]);
      // phase 1 = fresh start → show intro first (phase 0), queue set later by startDagensTestPhase1
      if (phase === 2) {
        const savedFill = Array.isArray(ex.fillFr)
          ? words.filter(w => ex.fillFr.includes(w.fr))
          : words.filter(w => !ex.words.some(d => d.fr === w.fr)).sort(() => Math.random() - 0.5).slice(0, 5);
        const all = [...ex.words, ...savedFill]; setDagensWords(all);
        const p2 = shuffle(all).map(w => ({ ...w, reverse: true })); setDagensQueue(p2); setDagensCard(p2[0]);
      }
      setDagensPhase(phase === 1 ? 0 : phase); setScreen("dagens-glose");
    };

    // Use cached exercise directly — fetch more in background if needed
    if (cached) {
      launchExercise(cached);
      if (needsNewVocab(words, genVocab, goalId)) fetchNewVocab(genVocab); // fire & forget
      return;
    }

    // Check if we have any words available right now
    const ex = getTodaysGloseWords(words, genVocab, goalId);

    if (ex.words.length > 0) {
      // Start immediately — fetch more vocab in background, never block the user
      launchExercise(ex);
      if (needsNewVocab(words, genVocab, goalId)) fetchNewVocab(genVocab); // fire & forget
    } else if (needsNewVocab(words, genVocab, goalId)) {
      // Zero words available — only case where we block and show loading
      setDagensLoading(true);
      const updated = await fetchNewVocab(genVocab);
      setDagensLoading(false);
      const newEx = getTodaysGloseWords(words, updated, goalId);
      if (newEx.words.length > 0) {
        launchExercise(newEx);
      } else {
        setNoWordsMsg(true);
        setTimeout(() => setNoWordsMsg(false), 3000);
      }
    } else {
      setNoWordsMsg(true);
      setTimeout(() => setNoWordsMsg(false), 3000);
    }

  };

  const startDagensTestPhase1 = () => {
    const q = shuffle([...dagensWords]);
    setDagensQueue(q); setDagensCard(q[0]);
    setDagensPhase(1);
  };

  const startGlose = () => {
    if (!words.length) { setNoWordsMsg(true); setTimeout(() => setNoWordsMsg(false), 3000); return; }
    const due = getDue(words, loadAnswerCount());
    const notDue = words.filter(w => !due.some(d => d.id === w.id));
    const q = shuffle([...due, ...notDue]).slice(0, 20).map(w => Math.random() < 0.5 ? { ...w, reverse: true } : w);
    setGloseQueue(q); setGloseCard(q[0]);
    setGloseOptions(getQuizOptions(q[0], words, !!q[0].reverse)); setGloseMode(Math.random() < 0.5 ? "input" : "choice");
    setGloseInput(""); setGloseChecked(false); setGloseResult(""); setGloseStats({ correct: 0, wrong: 0 }); setGloseHistory([]);
    setScreen("glose");
  };

  const startDagensGrammatikk = () => {
    const topic = getCurrentGrammarTopic();
    if (!topic) { setScreen("dagens-grammatikk"); setGrammarPhase(0); setGrammarTopic(null); return; }
    setGrammarTopic(topic); setGrammarPhase(0);
    setGrammarQueue([]); setGrammarCard(null);
    setGrammarInput(""); setGrammarChecked(false); setGrammarResult("");
    setGrammarStats({ correct: 0, wrong: 0 }); setGrammarMastered(new Set()); setGrammarHistory([]);
    setScreen("dagens-grammatikk");
  };

  const startGramOvelse = () => {
    if (!grammarWords.length) { setGramOvCard(null); setScreen("grammatikk-ovelse"); return; }
    const due = getDue(grammarWords, loadAnswerCount());
    const notDue = grammarWords.filter(w => !due.some(d => d.id === w.id));
    const q = shuffle([...due, ...notDue]).slice(0, 20).map(w => Math.random() < 0.5 ? { ...w, reverse: true } : w);
    setGramOvQueue(q); setGramOvCard(q[0]);
    setGramOvOptions(getQuizOptions(q[0], grammarWords, !!q[0].reverse)); setGramOvMode(Math.random() < 0.5 ? "input" : "choice");
    setGramOvInput(""); setGramOvChecked(false); setGramOvResult(""); setGramOvStats({ correct: 0, wrong: 0 }); setGramOvHistory([]);
    setScreen("grammatikk-ovelse");
  };

  const startMode = id => {
    if (id === "dagens-glose") startDagensGlose();
    else if (id === "glose") startGlose();
    else if (id === "dagens-grammatikk") startDagensGrammatikk();
    else if (id === "grammatikk-ovelse") startGramOvelse();
    else if (id === "ordoversettelse") setScreen("ordoversettelse");
    else if (id === "flervalg") setScreen("flervalg");
    else if (id === "si-ordet") setScreen("si-ordet");
    else if (id === "oversett-grammatikken") setScreen("oversett-grammatikken");
    else if (id === "grammatikk-flervalg") setScreen("grammatikk-flervalg");
    else if (id === "oversett-setningen") setScreen("oversett-setningen");
    else if (id === "fri") {
      setScreen("voice");
    } else {
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
    setDagensHistory(h => [...h, passed ? "correct" : "wrong"]);
    bumpSession();
    const gc = incrementAnswerCount();
    const inBank = words.find(w => w.fr === dagensCard.fr);
    if (inBank) {
      setWords(prev => prev.map(w => {
        if (w.id !== inBank.id) return w;
        const ptsBefore = w.points || 0;
        const updated = updateWordPoints(w, result, gc);
        logWordAnswer(w.fr, w.no, w.phonetic, ptsBefore, updated.points, result);
        const srOverride = updated._srOverride;
        const { _srOverride: _, ...cleanUpdated } = updated;
        if (srOverride) return { ...cleanUpdated, ...srOverride };
        if ((cleanUpdated.points || 0) < MASTERY_POINTS) {
          const { level: nl, nextReview: nr } = scheduleNext(w.level, passed);
          return { ...cleanUpdated, level: nl, nextReview: nr };
        }
        return cleanUpdated;
      }));
    } else if (result === "correct") {
      logWordAnswer(dagensCard.fr, dagensCard.no, dagensCard.phonetic, 0, 1, result);
      const currentGoalId = getActiveGoal(words, loadGoalOrder()).id;
      const nw = { id: Date.now() + Math.random(), fr: dagensCard.fr, no: dagensCard.no, phonetic: dagensCard.phonetic, level: 1, nextReview: Date.now() + SR_INTERVALS[1] * 86400000, added: Date.now(), points: 1, goal: currentGoalId };
      setWords(prev => prev.some(w => w.fr === nw.fr) ? prev : [...prev, nw]);
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
        const fill = words.filter(w => !dagensWords.some(d => d.fr === w.fr)).sort(() => Math.random() - 0.5).slice(0, 5);
        localStorage.setItem(DAGENS_GLOSE_KEY, JSON.stringify({ ...saved, phase1done: true, fillFr: fill.map(w => w.fr) }));
        const allWords = [...dagensWords, ...fill]; setDagensWords(allWords);
        const p2 = shuffle(allWords).map(w => ({ ...w, reverse: true }));
        setDagensQueue(p2); setDagensCard(p2[0]); setDagensPhase(2);
        setDagensStats({ correct: 0, wrong: 0 }); setDagensMastered(new Set()); setDagensHistory([]);
      } else {
        localStorage.setItem(DAGENS_GLOSE_KEY, JSON.stringify({ ...saved, phase2done: true }));
        logVocabSession();
        setDagensPhase(3); setStreak(touchStreak());
      }
      return;
    }
    setDagensQueue(remaining); setDagensCard(remaining[0]);
  };

  // --- Glose handlers ---
  const submitGlose = () => {
    if (!gloseInput.trim()) return;
    const isReverse = !!gloseCard?.reverse;
    const result = checkQuizAnswer(gloseInput, gloseCard, isReverse);
    const passed = result !== "wrong";
    setGloseChecked(true); setGloseResult(result);
    setGloseStats(s => ({ correct: s.correct + (passed ? 1 : 0), wrong: s.wrong + (passed ? 0 : 1) }));
    setGloseHistory(h => [...h, passed ? "correct" : "wrong"]);
    bumpSession();
    const gc = incrementAnswerCount();
    if (gloseCard.id) {
      setWords(prev => prev.map(w => {
        if (w.id !== gloseCard.id) return w;
        const ptsBefore = w.points || 0;
        const updated = updateWordPoints(w, result, gc);
        logWordAnswer(w.fr, w.no, w.phonetic, ptsBefore, updated.points, result);
        const srOverride = updated._srOverride;
        const { _srOverride: _, ...cleanUpdated } = updated;
        if (srOverride) return { ...cleanUpdated, ...srOverride };
        if ((cleanUpdated.points || 0) < MASTERY_POINTS) {
          const { level: nl, nextReview: nr } = scheduleNext(w.level, passed);
          return { ...cleanUpdated, level: nl, nextReview: nr };
        }
        return cleanUpdated;
      }));
    }
  };

  const nextGlose = () => {
    const remaining = gloseQueue.slice(1);
    const passed = gloseResult !== "wrong";
    if (!passed) {
      const at = Math.min(3, remaining.length);
      const recycled = [...remaining.slice(0, at), { ...gloseCard }, ...remaining.slice(at)];
      setGloseQueue(recycled); setGloseCard(recycled[0]);
      setGloseOptions(getQuizOptions(recycled[0], words, !!recycled[0].reverse));
      setGloseMode(Math.random() < 0.5 ? "input" : "choice");
      setGloseInput(""); setGloseChecked(false); setGloseResult("");
      return;
    }
    if (!remaining.length) { logVocabSession(); setStreak(touchStreak()); setScreen("home"); return; }
    setGloseQueue(remaining); setGloseCard(remaining[0]);
    setGloseOptions(getQuizOptions(remaining[0], words, !!remaining[0].reverse));
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
    setGrammarHistory(h => [...h, passed ? "correct" : "wrong"]);
    bumpSession();
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
        setGrammarStats({ correct: 0, wrong: 0 }); setGrammarMastered(new Set()); setGrammarHistory([]); return;
      }
      // Phase 2 done — save grammar words
      const newGW = grammarTopic.pairs.map(p => ({ id: Date.now() + Math.random(), fr: p.fr, no: p.no, phonetic: p.phonetic, level: 1, nextReview: Date.now() + SR_INTERVALS[1] * 86400000, added: Date.now(), topicId: grammarTopic.id }));
      setGrammarWords(prev => [...prev, ...newGW.filter(nw => !prev.some(ow => ow.fr === nw.fr && ow.topicId === nw.topicId))]);
      const progress = [...loadGrammarProgress(), grammarTopic.id];
      saveGrammarProgress(progress);
      logGrammarSession();
      setStreak(touchStreak());
      setGrammarPhase(3);
      return;
    }
    setGrammarQueue(remaining); setGrammarCard(remaining[0]);
  };

  // --- Grammatikk Ovelse handlers ---
  const submitGramOvelse = () => {
    if (!gramOvInput.trim()) return;
    const isReverse = !!gramOvCard?.reverse;
    const result = checkQuizAnswer(gramOvInput, gramOvCard, isReverse);
    const passed = result !== "wrong";
    setGramOvChecked(true); setGramOvResult(result);
    setGramOvStats(s => ({ correct: s.correct + (passed ? 1 : 0), wrong: s.wrong + (passed ? 0 : 1) }));
    setGramOvHistory(h => [...h, passed ? "correct" : "wrong"]);
    bumpSession();
    const gc = incrementAnswerCount();
    if (gramOvCard?.id) {
      setGrammarWords(prev => prev.map(w => {
        if (w.id !== gramOvCard.id) return w;
        const ptsBefore = w.points || 0;
        const updated = updateWordPoints(w, result, gc);
        logWordAnswer(w.fr, w.no, w.phonetic, ptsBefore, updated.points, result);
        const srOverride = updated._srOverride;
        const { _srOverride: _, ...cleanUpdated } = updated;
        if (srOverride) return { ...cleanUpdated, ...srOverride };
        if ((cleanUpdated.points || 0) < MASTERY_POINTS) {
          const { level: nl, nextReview: nr } = scheduleNext(w.level, passed);
          return { ...cleanUpdated, level: nl, nextReview: nr };
        }
        return cleanUpdated;
      }));
    }
  };

  const nextGramOvelse = () => {
    const remaining = gramOvQueue.slice(1);
    if (!remaining.length) { logGrammarSession(); setStreak(touchStreak()); setScreen("home"); return; }
    setGramOvQueue(remaining); setGramOvCard(remaining[0]);
    setGramOvOptions(getQuizOptions(remaining[0], grammarWords, !!remaining[0].reverse));
    setGramOvMode(Math.random() < 0.5 ? "input" : "choice");
    setGramOvInput(""); setGramOvChecked(false); setGramOvResult("");
  };

  // --- Session bump (called by all quiz submit handlers) ---
  const bumpSession = () => {
    logDailyAnswer();
    setSessionMsgs(s => {
      const n = s + 1;
      try { localStorage.setItem("fransk-session-msgs", JSON.stringify({ date: todayStr(), count: n })); } catch {}
      return n;
    });
  };

  // --- Clear all data ---
  const clearAllData = () => {
    setGrammarWords([]);
    saveGrammarProgress([]);
  };

  // --- Nav helper ---
  const handleNav = id => {
    if (id === "words") { setShowWords(true); setScreen("home"); }
    else if (id === "home") { setShowWords(false); setScreen("home"); }
    else if (id === "glose") { setShowWords(false); startGlose(); }
    else if (id === "fri") { setShowWords(false); setScreen("voice"); }
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
      {showExitDialog && <ExitDialog phraseIdx={exitPhraseIdx} onStay={() => { setShowExitDialog(false); window.history.pushState({ fransNav: true }, "", window.location.pathname + window.location.search + "#nav"); }} onExit={() => { exitIntentRef.current = true; setShowExitDialog(false); window.history.back(); }} />}
      <WordsScreen words={words} setWords={setWords} grammarWords={grammarWords} setGrammarWords={setGrammarWords} onBack={() => setShowWords(false)} onClearGrammar={clearAllData} {...navProps} />
    </>
  );

  if (screen === "dagens-glose") return (
    <>
      {showExitDialog && <ExitDialog phraseIdx={exitPhraseIdx} onStay={() => { setShowExitDialog(false); window.history.pushState({ fransNav: true }, "", window.location.pathname + window.location.search + "#nav"); }} onExit={() => { exitIntentRef.current = true; setShowExitDialog(false); window.history.back(); }} />}
      <DagensExerciseScreen title="Dagens fem gloser" icon="◆" phase={dagensPhase} topic={null} dailyWords={dagensWords} queue={dagensQueue} card={dagensCard} input={dagensInput} setInput={setDagensInput} checked={dagensChecked} result={dagensResult} stats={dagensStats} history={dagensHistory} onStartExercise={startDagensTestPhase1} onSubmit={submitDagens} onNext={nextDagens} onBack={() => setScreen("home")} speak={speak} speaking={speaking} {...navProps} />
    </>
  );

  if (screen === "glose") return (
    <>
      {showExitDialog && <ExitDialog phraseIdx={exitPhraseIdx} onStay={() => { setShowExitDialog(false); window.history.pushState({ fransNav: true }, "", window.location.pathname + window.location.search + "#nav"); }} onExit={() => { exitIntentRef.current = true; setShowExitDialog(false); window.history.back(); }} />}
      <QuizExerciseScreen title="Gloseøvelse" icon="◈" emptyMsg="Ingen ord i ordbanken ennå. Gjør Dagens øvelse – glose for å lære dine første ord." queue={gloseQueue} card={gloseCard} input={gloseInput} setInput={setGloseInput} checked={gloseChecked} result={gloseResult} stats={gloseStats} history={gloseHistory} options={gloseOptions} mode={gloseMode} onSubmit={submitGlose} onNext={nextGlose} onBack={() => setScreen("home")} speak={speak} speaking={speaking} {...navProps} />
    </>
  );

  if (screen === "dagens-grammatikk") return (
    <>
      {showExitDialog && <ExitDialog phraseIdx={exitPhraseIdx} onStay={() => { setShowExitDialog(false); window.history.pushState({ fransNav: true }, "", window.location.pathname + window.location.search + "#nav"); }} onExit={() => { exitIntentRef.current = true; setShowExitDialog(false); window.history.back(); }} />}
      {grammarTopic ? (
        <DagensExerciseScreen title="Daglig grammatikk" icon="◑" phase={grammarPhase} topic={grammarTopic} dailyWords={grammarTopic?.pairs || []} queue={grammarQueue} card={grammarCard} input={grammarInput} setInput={setGrammarInput} checked={grammarChecked} result={grammarResult} stats={grammarStats} history={grammarHistory} onStartExercise={startGrammarExercise} onSubmit={submitGrammar} onNext={nextGrammar} onBack={() => setScreen("home")} speak={speak} speaking={speaking} {...navProps} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#f5f0e6", fontFamily: "'DM Sans', sans-serif", color: cream, paddingBottom: 66 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${brd}`, background: card }}>
            <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: gold, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>← Tilbake</button>
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
      {showExitDialog && <ExitDialog phraseIdx={exitPhraseIdx} onStay={() => { setShowExitDialog(false); window.history.pushState({ fransNav: true }, "", window.location.pathname + window.location.search + "#nav"); }} onExit={() => { exitIntentRef.current = true; setShowExitDialog(false); window.history.back(); }} />}
      <QuizExerciseScreen title="Grammatikkøvelse" icon="◐" emptyMsg="Ingen grammatikk lært ennå. Gjør Daglig grammatikk for å låse opp." queue={gramOvQueue} card={gramOvCard} input={gramOvInput} setInput={setGramOvInput} checked={gramOvChecked} result={gramOvResult} stats={gramOvStats} history={gramOvHistory} options={gramOvOptions} mode={gramOvMode} onSubmit={submitGramOvelse} onNext={nextGramOvelse} onBack={() => setScreen("home")} speak={speak} speaking={speaking} {...navProps} />
    </>
  );

  if (screen === "ordoversettelse") return (
    <>
      {showExitDialog && <ExitDialog phraseIdx={exitPhraseIdx} onStay={() => { setShowExitDialog(false); window.history.pushState({ fransNav: true }, "", window.location.pathname + window.location.search + "#nav"); }} onExit={() => { exitIntentRef.current = true; setShowExitDialog(false); window.history.back(); }} />}
      <TranslationExerciseScreen title="Ordoversettelse" icon={<TranslateIcon />} emptyMsg="Ingen ord i ordbanken ennå. Gjør Dagens øvelse – glose for å lære dine første ord." words={words} setWords={setWords} onBack={() => setScreen("home")} speak={speak} speaking={speaking} {...navProps} />
    </>
  );

  if (screen === "flervalg") return (
    <>
      {showExitDialog && <ExitDialog phraseIdx={exitPhraseIdx} onStay={() => { setShowExitDialog(false); window.history.pushState({ fransNav: true }, "", window.location.pathname + window.location.search + "#nav"); }} onExit={() => { exitIntentRef.current = true; setShowExitDialog(false); window.history.back(); }} />}
      <MultipleChoiceOnlyScreen title="Flervalg" icon={<MultiChoiceIcon />} emptyMsg="Ingen ord i ordbanken ennå. Gjør Dagens øvelse – glose for å lære dine første ord." words={words} setWords={setWords} onBack={() => setScreen("home")} onFinish={() => setScreen("home")} speak={speak} speaking={speaking} {...navProps} />
    </>
  );

  if (screen === "si-ordet") return (
    <>
      {showExitDialog && <ExitDialog phraseIdx={exitPhraseIdx} onStay={() => { setShowExitDialog(false); window.history.pushState({ fransNav: true }, "", window.location.pathname + window.location.search + "#nav"); }} onExit={() => { exitIntentRef.current = true; setShowExitDialog(false); window.history.back(); }} />}
      <SayWordScreen words={words} onBack={() => setScreen("home")} speak={speak} speaking={speaking} {...navProps} />
    </>
  );

  if (screen === "oversett-grammatikken") return (
    <>
      {showExitDialog && <ExitDialog phraseIdx={exitPhraseIdx} onStay={() => { setShowExitDialog(false); window.history.pushState({ fransNav: true }, "", window.location.pathname + window.location.search + "#nav"); }} onExit={() => { exitIntentRef.current = true; setShowExitDialog(false); window.history.back(); }} />}
      <TranslationExerciseScreen title="Oversett grammatikken" icon={<TranslateIcon />} emptyMsg="Ingen grammatikk lært ennå. Gjør Daglig grammatikk for å låse opp." words={grammarWords} setWords={setGrammarWords} onBack={() => setScreen("home")} speak={speak} speaking={speaking} {...navProps} />
    </>
  );

  if (screen === "grammatikk-flervalg") return (
    <>
      {showExitDialog && <ExitDialog phraseIdx={exitPhraseIdx} onStay={() => { setShowExitDialog(false); window.history.pushState({ fransNav: true }, "", window.location.pathname + window.location.search + "#nav"); }} onExit={() => { exitIntentRef.current = true; setShowExitDialog(false); window.history.back(); }} />}
      <MultipleChoiceOnlyScreen title="Grammatikkflervalg" icon={<MultiChoiceIcon />} emptyMsg="Ingen grammatikk lært ennå. Gjør Daglig grammatikk for å låse opp." words={grammarWords} setWords={setGrammarWords} onBack={() => setScreen("home")} onFinish={() => setScreen("home")} speak={speak} speaking={speaking} {...navProps} />
    </>
  );

  if (screen === "oversett-setningen") return (
    <>
      {showExitDialog && <ExitDialog phraseIdx={exitPhraseIdx} onStay={() => { setShowExitDialog(false); window.history.pushState({ fransNav: true }, "", window.location.pathname + window.location.search + "#nav"); }} onExit={() => { exitIntentRef.current = true; setShowExitDialog(false); window.history.back(); }} />}
      <SentenceTranslationScreen words={words} grammarWords={grammarWords} isOnline={isOnline} onBack={() => setScreen("home")} speak={speak} speaking={speaking} {...navProps} />
    </>
  );

  if (screen === "voice") return (
    <>
      {showExitDialog && <ExitDialog phraseIdx={exitPhraseIdx} onStay={() => { setShowExitDialog(false); window.history.pushState({ fransNav: true }, "", window.location.pathname + window.location.search + "#nav"); }} onExit={() => { exitIntentRef.current = true; setShowExitDialog(false); window.history.back(); }} />}
      <VoiceScreen onBack={() => setScreen("home")} {...navProps} />
    </>
  );

  if (screen === "chat") return (
    <>
      {showExitDialog && <ExitDialog phraseIdx={exitPhraseIdx} onStay={() => { setShowExitDialog(false); window.history.pushState({ fransNav: true }, "", window.location.pathname + window.location.search + "#nav"); }} onExit={() => { exitIntentRef.current = true; setShowExitDialog(false); window.history.back(); }} />}
      <ChatScreen mode={mode} words={words} setWords={setWords} isOnline={isOnline} speak={speak} speaking={speaking} sessionMsgs={sessionMsgs} setSessionMsgs={setSessionMsgs} onBack={() => setScreen("home")} onShowWords={() => setShowWords(true)} {...navProps} />
    </>
  );

  return (
    <>
      {showExitDialog && <ExitDialog phraseIdx={exitPhraseIdx} onStay={() => { setShowExitDialog(false); window.history.pushState({ fransNav: true }, "", window.location.pathname + window.location.search + "#nav"); }} onExit={() => { exitIntentRef.current = true; setShowExitDialog(false); window.history.back(); }} />}
      <HomeScreen words={words} setWords={setWords} grammarWords={grammarWords} streak={streak} sessionMsgs={sessionMsgs} onStart={startMode} noWordsMsg={noWordsMsg} dagensLoading={dagensLoading} isOnline={isOnline} offlineBanner={offlineBanner} onShowWords={() => setShowWords(true)} {...navProps} />
    </>
  );
}
