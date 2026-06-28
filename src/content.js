// Active-language content. Screens import language-specific data from HERE
// instead of constants.js, so the same code renders French or Swiss-German
// depending on the active language. Resolved once at module load — language
// switches trigger a full reload (see useLang), so this stays consistent.
//
// No import cycle: content.js → languages/index.js → fr.js / de-ch.js →
// constants.js. constants.js never imports content.js.
import { getActiveLang } from "./languages/index.js";

const L = getActiveLang();

export const SYSTEM_PROMPT = L.systemPrompt;
export const BOOK_EXCERPTS = L.bookExcerpts;
export const VOCAB_GOALS = L.goals;
export const ORDMESTER_GOALS = L.ordmesterGoals;
export const VOCAB_LIST = L.vocabList;
export const VOCAB_CAT_ORDER = L.vocabCatOrder;
export const VOCAB_CAT_MAP = L.vocabCatMap;
export const STATIC_VOCAB = L.staticVocab;
export const GRAMMAR_TOPICS = L.grammarTopics;
export const vocabGenPrompt = L.vocabGenPrompt;
export const systemPromptFor = L.systemPromptFor;
export const speechLocale = L.locale;
export const dateLocale = L.dateLocale;
