import {
  SR_INTERVALS, WORDS_KEY, GRAMMAR_WORDS_KEY, GRAMMAR_PROGRESS_KEY,
  STREAK_KEY, BEST_STREAK_KEY, DAGENS_GLOSE_KEY, VOCAB_LIST, STATIC_VOCAB, GRAMMAR_TOPICS, VOCAB_GOALS,
  MASTERY_POINTS, MASTERY_PAUSE_MIN, MASTERY_PAUSE_MAX, ANSWER_COUNT_KEY,
  GENERATED_VOCAB_KEY, VOCAB_CAT_MAP,
  gold, cream, grn, red, card, brd,
} from "./constants.js";

// --- Goal helpers ---
export function getOrderedGoals(customOrder) {
  if (!customOrder) return VOCAB_GOALS;
  const ordered = customOrder.map(id => VOCAB_GOALS.find(g => g.id === id)).filter(Boolean);
  const missing = VOCAB_GOALS.filter(g => !customOrder.includes(g.id));
  return [...ordered, ...missing];
}

export function getWordCountByGoal(words) {
  const counts = {};
  for (const w of words) {
    const g = w.goal || "core";
    counts[g] = (counts[g] || 0) + 1;
  }
  return counts;
}

export function getActiveGoal(words, goalOrder) {
  const ordered = getOrderedGoals(goalOrder);
  const counts = getWordCountByGoal(words);
  const idx = ordered.findIndex(g => (counts[g.id] || 0) < g.target);
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
  const extraAccepted = reverse ? (card.frAccepted || []) : (card.noAccepted || []);
  const variants = [...field.split(/\s*\/\s*/), ...extraAccepted].map(normalizeAnswer);
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
function stripFrArticle(fr) {
  return fr.replace(/^(le |la |les |l')/i, "").trim();
}

function stripPhoneticArticle(p) {
  return p.replace(/^(lə |la |læ |l'|l )/i, "").trim();
}

function lookupForms(baseFr) {
  for (const section of Object.values(STATIC_VOCAB)) {
    if (!Array.isArray(section)) continue;
    const match = section.find(e => e.fr === baseFr);
    if (match && match.forms) return match.forms;
  }
  return [];
}

function stripWordTags(field) {
  if (!field) return field;
  return field
    .replace(/\s*\[pts:[\d.]+\]/g, "")
    .replace(/\s*\[goal:[^\]]+\]/g, "")
    .replace(/\s*\[cat:[^\]]+\]/g, "")
    .trim();
}

function migrateWord(w) {
  let result = { ...w };
  // strip tag cruft from no field
  const no = stripWordTags(result.no || "");
  const pm = no.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (pm) {
    result = { ...result, no: pm[1].trim(), phonetic: result.phonetic || pm[2].trim() };
  } else if (no !== result.no) {
    result = { ...result, no };
  }
  // strip article from fr (le/la/les/l')
  const baseFr = stripFrArticle(result.fr || "");
  if (baseFr !== result.fr) {
    result = {
      ...result,
      fr: baseFr,
      phonetic: stripPhoneticArticle(result.phonetic || ""),
    };
  }
  // add forms if missing or empty (re-lookup so stale [] entries get corrected)
  if (!result.forms?.length) {
    result = { ...result, forms: lookupForms(result.fr) };
  }
  return result;
}

const WB_MIGRATION_KEY = "fransk-wb-migration";
const WB_MIGRATION_VERSION = 5;

const LEGACY_CATS_MIGRATION = new Set([
  "Andre ord", "Hilsener", "Tid", "Verden og natur", "Politikk og samfunn",
]);

const SENTENCE_ENTRIES = new Set([
  "Je suis à Paris", "Tu es au café", "Il est au musée",
  "Elle est à la bibliothèque", "Nous sommes à la ville",
  "être-bøying", "je suis",
]);

function isSentenceLike(fr) {
  return /^(Je|Tu|Il|Elle|Nous|Vous|Ils|Elles)\s.+\s/i.test(fr);
}

function runWordBankMigrations(words) {
  const version = parseInt(localStorage.getItem(WB_MIGRATION_KEY) || "0");
  if (version >= WB_MIGRATION_VERSION) return words;

  let result = [...words];

  if (version < 2) {
    // Remove sentence entries, deduplicate by fr (keep highest pts)
    const removed = result.filter(w => SENTENCE_ENTRIES.has(w.fr) || isSentenceLike(w.fr));
    result = result.filter(w => !SENTENCE_ENTRIES.has(w.fr) && !isSentenceLike(w.fr));
    const seen = new Map();
    for (const w of result) {
      const ex = seen.get(w.fr);
      if (!ex || (w.points || 0) > (ex.points || 0)) seen.set(w.fr, w);
    }
    result = [...seen.values()];
    // Add "à" if not present, using max pts from removed sentences
    if (!result.some(w => w.fr === "à")) {
      const pts = Math.max(...removed.map(w => w.points || 0), 0);
      result.push({ id: Date.now() + Math.random(), fr: "à", no: "til / i / på", phonetic: "a", forms: [], level: 1, nextReview: Date.now() + SR_INTERVALS[1] * 86400000, added: Date.now(), points: pts, goal: "core" });
    }
    saveWords(result);
  }

  if (version < 3) {
    // Fix words with legacy/default category by writing correct cat from VOCAB_CAT_MAP
    result = result.map(w => {
      if (!w.cat || !LEGACY_CATS_MIGRATION.has(w.cat)) return w;
      const correct = VOCAB_CAT_MAP[w.fr];
      if (!correct) return { ...w, cat: undefined };
      return { ...w, cat: correct };
    });
    saveWords(result);
  }

  if (version < 4) {
    // Reset explicit cat for words where stored cat conflicts with VOCAB_CAT_MAP
    // (e.g. réponse was wrongly stored as "Vanlige verb")
    result = result.map(w => {
      if (!w.cat) return w;
      const correct = VOCAB_CAT_MAP[w.fr];
      if (!correct || w.cat === correct) return w;
      return { ...w, cat: correct };
    });
    saveWords(result);
  }

  if (version < 5) {
    // Fix words with goal:"core" that belong to a non-core goal based on VOCAB_CAT_MAP
    const CAT_TO_GOAL = { "Tour de France": "tdf" };
    result = result.map(w => {
      if (w.goal && w.goal !== "core") return w;
      const cat = VOCAB_CAT_MAP[w.fr];
      const correctGoal = cat ? CAT_TO_GOAL[cat] : null;
      if (!correctGoal) return w;
      return { ...w, goal: correctGoal };
    });
    saveWords(result);
  }

  localStorage.setItem(WB_MIGRATION_KEY, WB_MIGRATION_VERSION.toString());
  return result;
}

export function loadWords() {
  try {
    const s = localStorage.getItem(WORDS_KEY);
    if (s) {
      const arr = JSON.parse(s);
      const migrated = arr.map(migrateWord);
      const cleaned = runWordBankMigrations(migrated);
      const dirty = cleaned !== migrated || migrated.some((w, i) => w !== arr[i]);
      if (dirty) saveWords(cleaned);
      return cleaned;
    }
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
  try { const s = localStorage.getItem(STREAK_KEY); return s ? JSON.parse(s) : { current: 0, lastDate: null, startDate: null }; }
  catch { return { current: 0, lastDate: null, startDate: null }; }
}
export function loadBestStreak() {
  try { const s = localStorage.getItem(BEST_STREAK_KEY); return s ? JSON.parse(s) : { days: 0, startDate: null, endDate: null }; }
  catch { return { days: 0, startDate: null, endDate: null }; }
}
export function checkStreakBroken() {
  const s = loadStreak();
  if (!s.lastDate || s.current <= 1) return 0;
  const today = todayStr();
  if (s.lastDate === today) return 0;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (s.lastDate === yesterday) return 0;
  return s.current;
}

export function touchStreak() {
  const today = new Date().toISOString().split("T")[0];
  const s = loadStreak();
  if (s.lastDate === today) return s.current;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const continuing = s.lastDate === yesterday;
  const current = continuing ? s.current + 1 : 1;
  const startDate = continuing ? (s.startDate || s.lastDate || today) : today;

  // When streak breaks, check if previous streak was a record
  if (!continuing && s.current > 0) {
    const best = loadBestStreak();
    if (s.current > best.days) {
      try { localStorage.setItem(BEST_STREAK_KEY, JSON.stringify({ days: s.current, startDate: s.startDate || s.lastDate, endDate: s.lastDate })); } catch {}
    }
  }

  try { localStorage.setItem(STREAK_KEY, JSON.stringify({ current, lastDate: today, startDate })); } catch {}

  // Also update best if current streak is now the best
  const best = loadBestStreak();
  if (current > best.days) {
    try { localStorage.setItem(BEST_STREAK_KEY, JSON.stringify({ days: current, startDate, endDate: today })); } catch {}
  }

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

export function updateWordPoints(word, result, globalCount, pointsPerCorrect = 1) {
  if (result === "close") return word;
  const correct = result === "correct";
  const pts = Math.min(MASTERY_POINTS, Math.max(0, word.points || 0));
  const wasMastered = pts >= MASTERY_POINTS;
  const newPts = correct
    ? Math.min(MASTERY_POINTS, pts + pointsPerCorrect)
    : Math.max(0, pts - 2);
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

// Selects words for exercises with a biased distribution toward less-learned words.
// Tier A (not learned / low familiarity): points 0–7  → 60%
// Tier B (learned / well-learned):        points 8–17 → 35%
// Tier C (well-learned / mastered):       points ≥18  → 5%
// Falls back to random shuffle if tier A is too small to fill the 60% quota.
export function selectExerciseWords(words, count = 20) {
  if (words.length <= count) return shuffle([...words]);

  const tierA = shuffle(words.filter(w => (w.points || 0) < 8));
  const tierB = shuffle(words.filter(w => (w.points || 0) >= 8 && (w.points || 0) < 18));
  const tierC = shuffle(words.filter(w => (w.points || 0) >= 18));

  const target = Math.min(count, words.length);
  const picked = [];
  const used = new Set();

  const take = (pool, n) => {
    for (const w of pool) {
      if (picked.length >= target) break;
      if (n <= 0) break;
      if (!used.has(w.id ?? w.fr)) { picked.push(w); used.add(w.id ?? w.fr); n--; }
    }
  };

  const nA = Math.round(target * 0.60);
  const nC = Math.max(0, Math.round(target * 0.05));
  const nB = target - nA - nC;

  take(tierA, nA);
  take(tierB, nB);
  take(tierC, nC);

  // Fill remaining slots from any tier in priority order
  if (picked.length < target) take(tierA, target);
  if (picked.length < target) take(tierB, target);
  if (picked.length < target) take(tierC, target);

  return shuffle(picked);
}

export function scheduleNext(level, correct) {
  const newLevel = correct ? Math.min(level + 1, SR_INTERVALS.length - 1) : 0;
  return { level: newLevel, nextReview: Date.now() + SR_INTERVALS[newLevel] * 86400000 };
}

// ─── Mastery count log ───────────────────────────────────────────────────────
const MASTERY_LOG_KEY = "fransk-mastery-log";
const MASTERY_MIDPOINT_KEY = "fransk-mastery-midpoint";

export function loadMasteryLog() {
  try { return JSON.parse(localStorage.getItem(MASTERY_LOG_KEY) || "[]"); } catch { return []; }
}

export function touchMasteryCount(count) {
  try {
    const today = todayStr();
    const log = loadMasteryLog();
    const idx = log.findIndex(e => e.date === today);
    if (idx >= 0) { log[idx] = { date: today, count }; } else { log.push({ date: today, count }); }
    log.sort((a, b) => a.date.localeCompare(b.date));
    localStorage.setItem(MASTERY_LOG_KEY, JSON.stringify(log.slice(-30)));
  } catch {}
}

export function getMasteryMidpoint(masteredCount) {
  try {
    const stored = JSON.parse(localStorage.getItem(MASTERY_MIDPOINT_KEY) || "null");
    if (stored && stored.date === todayStr()) return stored.midpoint;
  } catch {}
  const log = loadMasteryLog();
  const today = todayStr();
  let lastKnown = null;
  const counts = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const date = d.toISOString().split("T")[0];
    let count = null;
    if (date === today) { count = masteredCount; }
    else {
      const entry = log.find(e => e.date === date);
      if (entry) { count = entry.count; lastKnown = entry.count; }
      else if (lastKnown !== null) count = lastKnown;
    }
    if (count !== null) counts.push(count);
  }
  const midpoint = counts.length
    ? Math.round(counts.reduce((s, v) => s + v, 0) / counts.length)
    : masteredCount;
  try { localStorage.setItem(MASTERY_MIDPOINT_KEY, JSON.stringify({ date: todayStr(), midpoint })); } catch {}
  return midpoint;
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

export function logDailyAnswer(type = "vocab") {
  touchDay(e => ({ ...e, answers: (e.answers || 0) + 1, [type]: (e[type] || 0) + 1 }));
}
export function logSentenceAnswer() {
  touchDay(e => ({ ...e, sentences: (e.sentences || 0) + 1 }));
}
export function logVocabSession() {}
export function logGrammarSession() {}
export function logDagligGrammatikk() {
  touchDay(e => ({ ...e, dagligGrammatikk: (e.dagligGrammatikk || 0) + 1 }));
}
export function logVoiceSession() { touchDay(e => ({ ...e, voice: (e.voice || 0) + 1 })); }
export function logGameSession(count = 1) {
  touchDay(e => ({ ...e, games: (e.games || 0) + count }));
}

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
  if (result === "wrong") logWordError(fr, no, phonetic);
}

// ─── Word error history (10-day rolling) ─────────────────────────────────────
const WORD_ERRORS_KEY = "fransk-word-errors";

function logWordError(fr, no, phonetic) {
  try {
    const today = todayStr();
    const store = JSON.parse(localStorage.getItem(WORD_ERRORS_KEY) || "{}");
    const entry = store[fr] || { fr, no: no || "", phonetic: phonetic || "", errors: {} };
    entry.errors[today] = (entry.errors[today] || 0) + 1;
    // prune keys older than 15 days
    const cutoff = new Date(Date.now() - 15 * 86400000).toISOString().split("T")[0];
    Object.keys(entry.errors).forEach(d => { if (d < cutoff) delete entry.errors[d]; });
    store[fr] = entry;
    localStorage.setItem(WORD_ERRORS_KEY, JSON.stringify(store));
  } catch {}
}

export function loadWorstWords(n = 5, days = 10) {
  try {
    const store = JSON.parse(localStorage.getItem(WORD_ERRORS_KEY) || "{}");
    const cutoff = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
    return Object.values(store)
      .map(entry => {
        const total = Object.entries(entry.errors)
          .filter(([d]) => d >= cutoff)
          .reduce((s, [, c]) => s + c, 0);
        return { ...entry, errorCount: total };
      })
      .filter(e => e.errorCount > 0)
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, n);
  } catch { return []; }
}

export function loadTodaysWordAnswers() {
  try {
    const s = JSON.parse(localStorage.getItem(TODAYS_ANSWERS_KEY) || "null");
    return (s?.date === todayStr()) ? (s.entries || []) : [];
  } catch { return []; }
}

// ─── Widget UUID ─────────────────────────────────────────────────────────────
const WIDGET_UUID_KEY = "fransk-widget-uuid";
export function getOrCreateWidgetUUID() {
  let id = localStorage.getItem(WIDGET_UUID_KEY);
  if (!id) {
    id = Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(16).padStart(2, "0")).join("");
    localStorage.setItem(WIDGET_UUID_KEY, id);
  }
  return id;
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
  exerciseRounds: 5,
  autoPlay: false,
  dailyGoal: 150,
  sentenceGoal: 5,
  pushTime: "20:00",
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

TEKSTHJELP: Hjelp med alt som handler om tekst og oversettelse.
- Eleven limer inn fransk tekst → bryt ned ord for ord (kort setning) eller norsk sammendrag + avsnitt-for-avsnitt + 2-3 grammatiske mønstre (lengre tekst).
- Eleven stiller spørsmål på norsk (f.eks. "Hvordan staves X på fransk?", "Hva betyr Y?", "Oversett Z") → svar direkte på norsk med korrekt fransk og fonetisk uttale i parentes.
- Eleven skriver norsk tekst som skal oversettes → oversett til naturlig fransk på elevens nivå, forklar valgene kort.
Avslutt alltid med FORSLAG: [svar1] | [svar2] | [svar3].
FRI: Svar fritt på spørsmål om fransk. Kan spille ${p.teacherName} (${teacherDesc}) hvis eleven vil — start på norsk og innfør gradvis mer fransk, bruk *kursiv* for handlinger. Avslutt gjerne med FORSLAG: [svar1] | [svar2] | [svar3].`;
}

export function loadGeneratedVocab() {
  try {
    const arr = JSON.parse(localStorage.getItem(GENERATED_VOCAB_KEY) || "[]");
    if (arr.some(e => /^(le |la |les |l')/i.test(e.fr || ""))) {
      localStorage.removeItem(GENERATED_VOCAB_KEY);
      return [];
    }
    return arr;
  } catch { return []; }
}

export function saveGeneratedVocab(words) {
  try { localStorage.setItem(GENERATED_VOCAB_KEY, JSON.stringify(words)); } catch {}
}

// Normalize a French word for comparison: strip leading article, lowercase
// Also expands slash-variants: "grand / grande" → ["grand", "grande"]
function normFr(fr) {
  return (fr || "").replace(/^(le |la |les |l')/i, "").trim().toLowerCase();
}
function buildLearnedSet(wordBank) {
  const set = new Set();
  for (const w of wordBank) {
    const base = normFr(w.fr);
    set.add(base);
    // Expand "grand / grande" → add "grand" and "grande" separately
    if (base.includes("/")) {
      for (const part of base.split("/")) {
        const p = part.trim();
        if (p) set.add(p);
      }
    }
  }
  return set;
}

// --- Today's exercise ---
export function getTodaysGloseWords(words, generatedVocab = [], goalId = "core") {
  const learnedFr = buildLearnedSet(words);
  try {
    const saved = JSON.parse(localStorage.getItem(DAGENS_GLOSE_KEY) || "{}");
    if (saved.date === todayStr() && saved.goal === goalId) {
      const cachedWords = saved.words || [];
      {
        const stillNew = cachedWords.filter(w => !learnedFr.has(normFr(w.fr)));
        if (stillNew.length > 0) {
          if (stillNew.length < cachedWords.length) {
            const updated = { ...saved, words: stillNew };
            localStorage.setItem(DAGENS_GLOSE_KEY, JSON.stringify(updated));
            return updated;
          }
          if (saved.phase1done || saved.phase2done) return saved;
          return saved;
        }
        localStorage.removeItem(DAGENS_GLOSE_KEY);
      }
    }
  } catch {}
  const staticBase = goalId === "core"
    ? [...VOCAB_LIST, ...(STATIC_VOCAB.core || [])]
    : (STATIC_VOCAB[goalId] || []);
  const goalGenerated = generatedVocab.filter(v => (v.goal || "core") === goalId);
  const normalize = v => ({
    ...v,
    fr: normFr(v.fr),
    phonetic: v.phonetic || v.p || "",
  });
  // Deduplicate by normalized fr (keep first occurrence)
  const seen = new Set();
  const allVocab = [...staticBase, ...goalGenerated].map(normalize).filter(v => {
    if (seen.has(v.fr)) return false;
    seen.add(v.fr); return true;
  });
  const newVocab = allVocab.filter(v => !learnedFr.has(v.fr) && !isSentenceLike(v.fr) && !SENTENCE_ENTRIES.has(v.fr));
  const selected = newVocab.slice(0, 5);
  const exercise = { date: todayStr(), goal: goalId, words: selected, phase1done: false, phase2done: false };
  localStorage.setItem(DAGENS_GLOSE_KEY, JSON.stringify(exercise));
  return exercise;
}

export function getReplacementGloseWord(words, currentDailyFr = [], generatedVocab = [], goalId = "core") {
  const learnedFr = buildLearnedSet(words);
  for (const fr of currentDailyFr) learnedFr.add(normFr(fr));
  const staticBase = goalId === "core"
    ? [...VOCAB_LIST, ...(STATIC_VOCAB.core || [])]
    : (STATIC_VOCAB[goalId] || []);
  const goalGenerated = generatedVocab.filter(v => (v.goal || "core") === goalId);
  const normalize = v => ({ ...v, fr: normFr(v.fr), phonetic: v.phonetic || v.p || "" });
  const seen = new Set();
  const pool = [...staticBase, ...goalGenerated]
    .map(normalize)
    .filter(v => {
      if (seen.has(v.fr)) return false;
      seen.add(v.fr); return true;
    })
    .filter(v => !learnedFr.has(v.fr) && !isSentenceLike(v.fr) && !SENTENCE_ENTRIES.has(v.fr));
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
}

export function needsNewVocab(words, generatedVocab = [], goalId = "core") {
  const learnedFr = new Set(words.map(w => w.fr));
  const staticBase = goalId === "core"
    ? [...VOCAB_LIST, ...(STATIC_VOCAB.core || [])]
    : (STATIC_VOCAB[goalId] || []);
  const goalGenerated = generatedVocab.filter(v => (v.goal || "core") === goalId);
  return [...staticBase, ...goalGenerated].filter(v => !learnedFr.has(v.fr)).length < 10;
}

const VERB_FORM_TYPES = new Set(["v","pr","pc","imp","f","c","impv","pp"]);
const ARTICLE_FORM_TYPES = new Set(["n","np"]);

export function getArticleQuestions(words) {
  const questions = [];
  for (const w of words) {
    if (!w.forms) continue;
    const nForms = w.forms.filter(([, t]) => t === "n");
    for (const [form] of nForms) {
      const m = form.match(/^(le|la|les|l')\s+(.+)$/i);
      if (m) questions.push({ word: w, form, article: m[1], noun: m[2] });
    }
  }
  return questions;
}

export function getConjugationQuestions(words) {
  const questions = [];
  for (const w of words) {
    if (!w.forms) continue;
    const verbForms = w.forms.filter(([, t]) => VERB_FORM_TYPES.has(t));
    for (const [form, type] of verbForms) {
      questions.push({ word: w, form, type });
    }
  }
  return questions;
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
