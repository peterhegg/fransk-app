import {
  SR_INTERVALS, WORDS_KEY, GRAMMAR_WORDS_KEY, GRAMMAR_PROGRESS_KEY,
  STREAK_KEY, DAGENS_GLOSE_KEY, VOCAB_LIST, GRAMMAR_TOPICS, VOCAB_GOALS,
  MASTERY_POINTS, MASTERY_PAUSE_MIN, MASTERY_PAUSE_MAX, ANSWER_COUNT_KEY,
  GENERATED_VOCAB_KEY,
  gold, cream, grn, red, card, brd,
} from "./constants.js";

// --- Goal helpers ---
export function getOrderedGoals(customOrder) {
  if (!customOrder) return VOCAB_GOALS;
  const ordered = customOrder.map(id => VOCAB_GOALS.find(g => g.id === id)).filter(Boolean);
  const missing = VOCAB_GOALS.filter(g => !customOrder.includes(g.id));
  return [...ordered, ...missing];
}

export function getActiveGoal(words, goalOrder) {
  const ordered = getOrderedGoals(goalOrder);
  const cumTargets = ordered.reduce((acc, g, i) => { acc.push((acc[i - 1] || 0) + g.target); return acc; }, []);
  const idx = cumTargets.findIndex(t => words.length < t);
  return ordered[idx === -1 ? ordered.length - 1 : idx] || ordered[0];
}

// --- Text helpers ---
export function normalizeAnswer(s) {
  return s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
}

function stripParticles(s) {
  return s.replace(/^(a |le |la |les |l'|l |un |une |en |et |de |du |des )/i, "").trim();
}

function levenshtein(a, b) {
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[a.length][b.length];
}

export function checkQuizAnswer(input, card, reverse = false) {
  const inp = normalizeAnswer(input);
  const field = reverse ? card.fr : card.no;
  const variants = field.split(/\s*\/\s*/).map(normalizeAnswer);
  if (variants.some(v => v === inp)) return "correct";
  const inpStripped = stripParticles(inp);
  if (inpStripped.length > 1 && variants.some(v => stripParticles(v) === inpStripped)) return "correct";
  const minDist = Math.min(...variants.map(v =>
    Math.min(levenshtein(inp, v), levenshtein(inpStripped, stripParticles(v)))
  ));
  const maxLen = Math.max(...variants.map(v => v.length));
  const threshold = Math.max(2, Math.floor(maxLen / 4));
  return minDist <= threshold ? "close" : "wrong";
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Similar distractors: prefer words with similar-length translations
export function getQuizOptions(card, bank = [], isReverse = false) {
  const targetField = isReverse ? card.fr : card.no;
  const correct = targetField.split(/\s*\/\s*/)[0].trim();
  const correctLen = correct.length;

  const candidates = bank.filter(v => v.no !== card.no && v.fr !== card.fr);
  if (candidates.length === 0) return [correct];

  const scored = candidates.map(w => {
    const field = (isReverse ? w.fr : w.no).split(/\s*\/\s*/)[0].trim();
    const lenDiff = Math.abs(field.length - correctLen);
    return { opt: field, score: lenDiff * 0.6 + Math.random() * Math.max(3, correctLen * 0.4) };
  });
  scored.sort((a, b) => a.score - b.score);

  const distractors = [];
  for (const s of scored) {
    if (distractors.length >= 3) break;
    if (s.opt !== correct && !distractors.includes(s.opt)) distractors.push(s.opt);
  }
  while (distractors.length < Math.min(3, candidates.length)) {
    const fb = candidates[Math.floor(Math.random() * candidates.length)];
    const opt = (isReverse ? fb.fr : fb.no).split(/\s*\/\s*/)[0].trim();
    if (opt !== correct && !distractors.includes(opt)) distractors.push(opt);
  }
  return shuffle([...distractors, correct]);
}

// --- Date ---
export function todayStr() { return new Date().toISOString().split("T")[0]; }

// --- Storage ---
export function loadWords() {
  try {
    const s = localStorage.getItem(WORDS_KEY);
    if (s) return JSON.parse(s);
    const old = localStorage.getItem("fransk-laering-ord");
    if (old) {
      const arr = JSON.parse(old);
      if (Array.isArray(arr)) return arr.map((w, i) => ({ id: Date.now() + i, fr: w, no: "", phonetic: "", level: 0, nextReview: Date.now(), added: Date.now() }));
    }
    return [];
  } catch { return []; }
}
export function saveWords(w) { try { localStorage.setItem(WORDS_KEY, JSON.stringify(w)); } catch {} }

export function loadGrammarWords() {
  try { const s = localStorage.getItem(GRAMMAR_WORDS_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
}
export function saveGrammarWords(w) { try { localStorage.setItem(GRAMMAR_WORDS_KEY, JSON.stringify(w)); } catch {} }

export function loadGrammarProgress() {
  try { const s = localStorage.getItem(GRAMMAR_PROGRESS_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
}
export function saveGrammarProgress(arr) { try { localStorage.setItem(GRAMMAR_PROGRESS_KEY, JSON.stringify(arr)); } catch {} }

export function loadStreak() {
  try { const s = localStorage.getItem(STREAK_KEY); return s ? JSON.parse(s) : { current: 0, lastDate: null }; }
  catch { return { current: 0, lastDate: null }; }
}
export function touchStreak() {
  const today = new Date().toISOString().split("T")[0];
  const s = loadStreak();
  if (s.lastDate === today) return s.current;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const current = s.lastDate === yesterday ? s.current + 1 : 1;
  try { localStorage.setItem(STREAK_KEY, JSON.stringify({ current, lastDate: today })); } catch {}
  return current;
}

// --- Global answer counter ---
export function loadAnswerCount() {
  try { return parseInt(localStorage.getItem(ANSWER_COUNT_KEY) || "0", 10); } catch { return 0; }
}
export function incrementAnswerCount() {
  const n = loadAnswerCount() + 1;
  try { localStorage.setItem(ANSWER_COUNT_KEY, String(n)); } catch {}
  return n;
}

const ORDMESTER_GOALS_KEY = "ordmester-custom-goals";
export function loadOrdmesterGoals() {
  try {
    const s = localStorage.getItem(ORDMESTER_GOALS_KEY);
    if (!s) return null;
    const arr = JSON.parse(s);
    if (Array.isArray(arr) && arr.length > 0 && arr.every(g => Number.isInteger(g.target) && g.target > 0 && typeof g.reward === "string")) return arr;
  } catch {}
  return null;
}
export function saveOrdmesterGoals(goals) {
  try { localStorage.setItem(ORDMESTER_GOALS_KEY, JSON.stringify(goals)); } catch {}
}
export function resetOrdmesterGoals() {
  try { localStorage.removeItem(ORDMESTER_GOALS_KEY); } catch {}
}

const VOCAB_GOAL_ORDER_KEY = "vocab-goals-order";
export function loadGoalOrder() {
  try { const s = localStorage.getItem(VOCAB_GOAL_ORDER_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
}
export function saveGoalOrder(ids) {
  try { localStorage.setItem(VOCAB_GOAL_ORDER_KEY, JSON.stringify(ids)); } catch {}
}
export function resetGoalOrder() {
  try { localStorage.removeItem(VOCAB_GOAL_ORDER_KEY); } catch {}
}

// --- Points + mastery ---
export function getWordTier(pts) {
  if (pts >= 20) return 5;
  if (pts >= 17) return 4;
  if (pts >= 15) return 3;
  if (pts >= 10) return 2;
  if (pts >= 5) return 1;
  return 0;
}

export function getMasteredCount(words) {
  return words.filter(w => (w.points || 0) >= MASTERY_POINTS).length;
}

export function updateWordPoints(word, result, globalCount) {
  if (result === "close") return word;
  const correct = result === "correct";
  const pts = word.points || 0;
  const wasMastered = pts >= MASTERY_POINTS;
  const newPts = correct ? pts + 1 : Math.max(0, pts - 2);
  let extra = {};

  if (!wasMastered && newPts >= MASTERY_POINTS) {
    const pause = MASTERY_PAUSE_MIN + Math.floor(Math.random() * (MASTERY_PAUSE_MAX - MASTERY_PAUSE_MIN + 1));
    extra = { masteredRound: globalCount, retestRound: globalCount + pause };
  } else if (wasMastered && correct) {
    const pause = MASTERY_PAUSE_MIN + Math.floor(Math.random() * (MASTERY_PAUSE_MAX - MASTERY_PAUSE_MIN + 1));
    extra = { masteredRound: globalCount, retestRound: globalCount + pause };
  } else if (wasMastered && !correct) {
    extra = { masteredRound: null, retestRound: null, _srOverride: { level: 4, nextReview: Date.now() + SR_INTERVALS[4] * 86400000 } };
  }

  return { ...word, points: newPts, ...extra };
}

export function getDue(words, globalCount) {
  const gc = globalCount ?? loadAnswerCount();
  return words.filter(w => {
    const pts = w.points || 0;
    if (pts >= MASTERY_POINTS) return !w.retestRound || gc >= w.retestRound;
    return w.nextReview <= Date.now();
  });
}

export function scheduleNext(level, correct) {
  const newLevel = correct ? Math.min(level + 1, SR_INTERVALS.length - 1) : 0;
  return { level: newLevel, nextReview: Date.now() + SR_INTERVALS[newLevel] * 86400000 };
}

// ─── Activity log ────────────────────────────────────────────────────────────
const ACTIVITY_LOG_KEY = "fransk-activity-log";

function saveActivityLog(log) {
  try { localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(log.sort((a, b) => a.date.localeCompare(b.date)).slice(-90))); } catch {}
}

export function loadActivityLog() {
  try { return JSON.parse(localStorage.getItem(ACTIVITY_LOG_KEY) || "[]"); } catch { return []; }
}

function touchDay(update) {
  const log = loadActivityLog();
  const today = todayStr();
  const idx = log.findIndex(e => e.date === today);
  const entry = idx >= 0 ? { ...log[idx] } : { date: today, answers: 0, vocab: 0, grammar: 0, voice: 0 };
  if (idx >= 0) log[idx] = update(entry); else log.push(update(entry));
  saveActivityLog(log);
}

export function logDailyAnswer() { touchDay(e => ({ ...e, answers: (e.answers || 0) + 1 })); }
export function logVocabSession() { touchDay(e => ({ ...e, vocab: (e.vocab || 0) + 1 })); }
export function logGrammarSession() { touchDay(e => ({ ...e, grammar: (e.grammar || 0) + 1 })); }
export function logVoiceSession() { touchDay(e => ({ ...e, voice: (e.voice || 0) + 1 })); }

// ─── Today's word answers ────────────────────────────────────────────────────
const TODAYS_ANSWERS_KEY = "fransk-todays-answers";

export function logWordAnswer(fr, no, phonetic, pointsBefore, pointsAfter, result) {
  try {
    const today = todayStr();
    const stored = JSON.parse(localStorage.getItem(TODAYS_ANSWERS_KEY) || "null");
    const entries = stored?.date === today ? stored.entries : [];
    entries.push({ fr, no, phonetic: phonetic || "", pointsBefore: pointsBefore || 0, pointsAfter: pointsAfter || 0, result });
    localStorage.setItem(TODAYS_ANSWERS_KEY, JSON.stringify({ date: today, entries }));
  } catch {}
}

export function loadTodaysWordAnswers() {
  try {
    const s = JSON.parse(localStorage.getItem(TODAYS_ANSWERS_KEY) || "null");
    return (s?.date === todayStr()) ? (s.entries || []) : [];
  } catch { return []; }
}

// ─── User profile ────────────────────────────────────────────────────────────
const USER_PROFILE_KEY = "fransk-user-profile";

export const DEFAULT_PROFILE = {
  name: "Peter",
  level: "A1/A2",
  gender: "han",
  teacherName: "Pierre",
  teacherGender: "han",
  dysleksi: true,
};

export function loadUserProfile() {
  try { const s = localStorage.getItem(USER_PROFILE_KEY); return s ? { ...DEFAULT_PROFILE, ...JSON.parse(s) } : { ...DEFAULT_PROFILE }; }
  catch { return { ...DEFAULT_PROFILE }; }
}

export function saveUserProfile(profile) {
  try { localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile)); } catch {}
}

export function buildSystemPrompt(profile) {
  const p = { ...DEFAULT_PROFILE, ...profile };
  const dysleksi = p.dysleksi ? " med dysleksi" : "";
  const genderNote = p.gender === "hun" ? "\n- Eleven er jente/kvinne — bruk hunkjønnsformer der det er relevant" : "";
  const teacherDesc = p.teacherGender === "hun" ? "en franskvinne" : "en franskmann";
  return `Du er en tålmodig fransktutor for en norsk nybegynner (${p.level})${dysleksi}. Eleven heter ${p.name}. Eleven har to bøker: en roman av Houellebecq og en bok om kulturlivet i Paris på 1920-tallet.

KOMMUNIKASJON:
- Norsk som hovedspråk — innfør gradvis mer fransk i takt med elevens fremgang
- Aldri mer fransk enn eleven mestrer
- Forklar grammatikk gjennom eksempler, aldri lange regelforklaringer
- Korte avsnitt og tydelig struktur
- Kort, oppmuntrende tilbakemelding — ikke overdrevet${genderNote}

UTTALE:
- Skriv alltid fonetisk uttale på norsk i parentes etter nye ord: bonjour (bånsjur)
- Minn jevnlig eleven på å si ordene høyt

PROGRESJON:
- Bygg alltid videre på det eleven kan fra før
- Bruk ord og temaer fra Houellebecq og Paris på 1920-tallet aktivt

TEKSTHJELP: Eleven limer inn tekst på fransk. Bruk skjønn: én setning/par ord → bryt ned ord for ord. Lengre tekst → norsk sammendrag (2-3 setninger), oversett avsnitt for avsnitt, plukk ut 2-3 grammatiske mønstre. Avslutt med FORSLAG: [svar1] | [svar2] | [svar3].
FRI: Svar fritt på spørsmål om fransk. Kan spille ${p.teacherName} (${teacherDesc}) hvis eleven vil — start på norsk og innfør gradvis mer fransk, bruk *kursiv* for handlinger. Avslutt gjerne med FORSLAG: [svar1] | [svar2] | [svar3].`;
}

export function loadGeneratedVocab() {
  try { return JSON.parse(localStorage.getItem(GENERATED_VOCAB_KEY) || "[]"); } catch { return []; }
}

export function saveGeneratedVocab(words) {
  try { localStorage.setItem(GENERATED_VOCAB_KEY, JSON.stringify(words)); } catch {}
}

// --- Today's exercise ---
export function getTodaysGloseWords(words, generatedVocab = [], goalId = "core") {
  try {
    const saved = JSON.parse(localStorage.getItem(DAGENS_GLOSE_KEY) || "{}");
    if (saved.date === todayStr() && saved.goal === goalId) return saved;
  } catch {}
  const learnedFr = new Set(words.map(w => w.fr));
  const baseVocab = goalId === "core" ? VOCAB_LIST : [];
  const goalGenerated = generatedVocab.filter(v => !v.goal || v.goal === goalId);
  const allVocab = [...baseVocab, ...goalGenerated];
  const newVocab = allVocab.filter(v => !learnedFr.has(v.fr)).slice(0, 5);
  const due = getDue(words, loadAnswerCount()).slice(0, Math.max(0, 5 - newVocab.length));
  const selected = [...newVocab, ...due].slice(0, 5);
  const exercise = { date: todayStr(), goal: goalId, words: selected, phase1done: false, phase2done: false };
  localStorage.setItem(DAGENS_GLOSE_KEY, JSON.stringify(exercise));
  return exercise;
}

export function needsNewVocab(words, generatedVocab = [], goalId = "core") {
  const learnedFr = new Set(words.map(w => w.fr));
  const baseVocab = goalId === "core" ? VOCAB_LIST : [];
  const goalGenerated = generatedVocab.filter(v => !v.goal || v.goal === goalId);
  return [...baseVocab, ...goalGenerated].filter(v => !learnedFr.has(v.fr)).length < 5;
}

export function getCurrentGrammarTopic() {
  const completed = loadGrammarProgress();
  return GRAMMAR_TOPICS.find(t => !completed.includes(t.id)) || null;
}

// --- Message parsing ---
export function parseLearnLine(line) {
  const m1 = line.match(/✓ LÆRT:\s*(.+?)\s*=\s*(.+?)\s*\((.+?)\)/);
  if (m1) return { fr: m1[1].trim(), no: m1[2].trim(), phonetic: m1[3].trim() };
  const m2 = line.match(/✓ LÆRT:\s*(.+?)\s*\((.+?)\)/);
  if (m2) return { fr: m2[1].trim(), no: "", phonetic: m2[2].trim() };
  return { fr: line.replace(/✓ LÆRT:\s*/, "").trim(), no: "", phonetic: "" };
}

export function parseInline(text) {
  const parts = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2]) parts.push(<strong key={m.index}>{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={m.index} style={{ fontStyle: "italic", opacity: 0.75 }}>{m[3]}</em>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function extractSuggestions(text) {
  const m = text.match(/FORSLAG:\s*(.+)/);
  if (!m) return [];
  return m[1].split("|").map(s => s.trim()).filter(Boolean);
}

export function stripSuggestions(text) {
  return text.replace(/\nFORSLAG:.*$/s, "").trimEnd();
}

export function renderMessage(text) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("✓ LÆRT:")) return <div key={i} style={{ color: grn, fontWeight: "bold", margin: "4px 0", fontSize: 14 }}>{parseInline(line)}</div>;
    if (line.startsWith("✗ FEIL:")) return <div key={i} style={{ color: red, fontWeight: "bold", margin: "4px 0", fontSize: 14 }}>{parseInline(line)}</div>;
    if (line.startsWith("GLOSE:")) return <div key={i} style={{ background: "rgba(200,120,58,0.08)", borderLeft: `3px solid ${gold}`, padding: "6px 10px", margin: "6px 0", borderRadius: "0 8px 8px 0", fontSize: 14 }}>{parseInline(line)}</div>;
    if (line === "---") return <hr key={i} style={{ border: "none", borderTop: `1px solid ${brd}`, margin: "8px 0" }} />;
    return <div key={i} style={{ minHeight: line === "" ? 10 : "auto" }}>{parseInline(line)}</div>;
  });
}
