// ── French language module ──────────────────────────────────────────────
// Phase 1: adapter over the existing constants.js. The large data blocks
// (vocab, grammar, goals) are still defined in constants.js and re-used here,
// so this is a zero-behaviour-change refactor. A future language owns its own
// data files; fr keeps re-using constants until a later cleanup phase.
import {
  SYSTEM_PROMPT,
  BOOK_EXCERPTS,
  VOCAB_LIST,
  VOCAB_CAT_ORDER,
  VOCAB_CAT_MAP,
  GRAMMAR_TOPICS,
  VOCAB_GOALS,
  ORDMESTER_GOALS,
} from "../constants.js";
import { STATIC_VOCAB } from "../static_vocab.js";

// AI vocab generation prompt — was hardcoded inline in App.jsx.
// Extracted here so each language can phrase its own generation rules.
export function vocabGenPrompt(activeGoal, knownWords) {
  return `Generate 10 new French vocabulary words for a Norwegian A1/A2 learner with dyslexia. Current learning topic: "${activeGoal.label}" — ${activeGoal.desc}. The learner is also reading Houellebecq and a book about Paris cultural life in the 1920s. Do NOT include these already-known words: ${[...knownWords].join(", ")}. Return a JSON array only — no markdown. Use BASE FORM without article for nouns (e.g. "maison" not "la maison"). For each word include its inflected forms. Format: [{"fr":"maison","no":"huset","p":"mæzå","forms":[["la maison","n"],["les maisons","np"]]},{"fr":"parler","no":"å snakke","p":"parlæ","forms":[["je parle","pr"],["nous parlons","pr"],["ils parlent","pr"],["j'ai parlé","pc"],["je parlais","imp"],["je parlerai","f"],["parle","impv"],["parlé","pp"]]}]. Use phonetic spelling in Norwegian (e.g. bonjour → bånsjur). Adjectives: include adj-f/adj-mp/adj-fp forms. Fixed phrases or adverbs: forms:[].`;
}

const fr = {
  id: "fr",
  label: "Fransk",
  flag: "🇫🇷",

  // Web Speech API — synthesis + recognition + Intl date formatting
  locale: "fr-FR",
  dateLocale: "fr-FR",

  // localStorage namespace. French KEEPS the legacy "fransk" prefix so the
  // user's existing progress survives the multi-language refactor untouched.
  storagePrefix: "fransk",

  // Maps to [data-lang="fr"] in design-system.css (themed in a later phase).
  themeAttr: "fr",

  // Tutor — personas live in Tutor.jsx (PERSONAS); this picks the default.
  tutor: {
    defaultPersona: "henri",
    personas: [
      { id: "henri", label: "Henri", gender: "m" },
      { id: "simone", label: "Simone", gender: "f" },
    ],
  },

  // Conversation / tutoring system prompt
  systemPrompt: SYSTEM_PROMPT,
  bookExcerpts: BOOK_EXCERPTS,
  vocabGenPrompt,

  // Learning content
  goals: VOCAB_GOALS,
  ordmesterGoals: ORDMESTER_GOALS,
  vocabList: VOCAB_LIST,
  vocabCatOrder: VOCAB_CAT_ORDER,
  vocabCatMap: VOCAB_CAT_MAP,
  staticVocab: STATIC_VOCAB,
  grammarTopics: GRAMMAR_TOPICS,
};

export default fr;
