import {
  SR_INTERVALS, WORDS_KEY, GRAMMAR_WORDS_KEY, GRAMMAR_PROGRESS_KEY,
  STREAK_KEY, DAGENS_GLOSE_KEY, VOCAB_LIST, GRAMMAR_TOPICS,
  MASTERY_POINTS, MASTERY_PAUSE_MIN, MASTERY_PAUSE_MAX, ANSWER_COUNT_KEY,
  gold, cream, grn, red, card, brd,
} from "./constants.js";

// --- Text helpers ---
export function normalizeAnswer(s) {
  return s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
}

function stripParticles(s) {
  return s.replace(/^(a |le |la |les |l |un |une |en |et |de |du |des )/i, "").trim();
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

// --- Points + mastery ---
export function getMasteredCount(words) {
  return words.filter(w => (w.points || 0) >= MASTERY_POINTS).length;
}

export function updateWordPoints(word, correct, globalCount) {
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

// --- Today's exercise ---
export function getTodaysGloseWords(words) {
  try {
    const saved = JSON.parse(localStorage.getItem(DAGENS_GLOSE_KEY) || "{}");
    if (saved.date === todayStr()) return saved;
  } catch {}
  const learnedFr = new Set(words.map(w => w.fr));
  const newVocab = VOCAB_LIST.filter(v => !learnedFr.has(v.fr)).slice(0, 5);
  const due = getDue(words).slice(0, Math.max(0, 5 - newVocab.length));
  const selected = [...newVocab, ...due].slice(0, 5);
  const exercise = { date: todayStr(), words: selected, phase1done: false, phase2done: false };
  localStorage.setItem(DAGENS_GLOSE_KEY, JSON.stringify(exercise));
  return exercise;
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
