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

// Personalised conversation system prompt. Receives an already-merged profile
// (DEFAULT_PROFILE + user profile). Moved here from utils.buildSystemPrompt.
export function systemPromptFor(p) {
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
  systemPromptFor,
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
