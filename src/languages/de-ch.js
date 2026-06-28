// ── Swiss-German language module (de-CH) ────────────────────────────────
// Schweizer Hochdeutsch for a Norwegian beginner. Tutor: Klaus Müller (with
// Regula as the alternate persona). Theme: anthracite + amber. The TARGET
// word lives in the `fr` field throughout (see de_static_vocab.js for why),
// so every exercise screen works unchanged.
//
// HARD RULE everywhere: never ß — always "ss" (Strasse, Fussball, gross).
import { VOCAB_CAT_ORDER } from "../constants.js";
import { DE_STATIC_VOCAB } from "../de_static_vocab.js";

// Always-known basics — excluded from AI vocab generation, like French VOCAB_LIST.
export const DE_VOCAB_LIST = [
  // Hilsener
  { fr: "Grüezi", no: "hei / god dag", phonetic: "gryetsi" },
  { fr: "Guten Tag", no: "god dag", phonetic: "gutən tak" },
  { fr: "Guten Morgen", no: "god morgen", phonetic: "gutən mårgən" },
  { fr: "Merci", no: "takk", phonetic: "mærsi" },
  { fr: "bitte", no: "vær så snill / vær så god", phonetic: "bitə" },
  { fr: "ja", no: "ja", phonetic: "ja" },
  { fr: "nein", no: "nei", phonetic: "nain" },
  { fr: "Entschuldigung", no: "unnskyld", phonetic: "æntsjuldigung" },
  // Pronomen
  { fr: "ich", no: "jeg", phonetic: "ikj" },
  { fr: "du", no: "du", phonetic: "du" },
  { fr: "er", no: "han", phonetic: "ær" },
  { fr: "sie", no: "hun / de", phonetic: "si" },
  { fr: "es", no: "det", phonetic: "æs" },
  { fr: "wir", no: "vi", phonetic: "vir" },
  { fr: "ihr", no: "dere", phonetic: "ir" },
  // Tallord
  { fr: "eins", no: "en", phonetic: "ains" },
  { fr: "zwei", no: "to", phonetic: "tsvai" },
  { fr: "drei", no: "tre", phonetic: "drai" },
  { fr: "vier", no: "fire", phonetic: "fir" },
  { fr: "fünf", no: "fem", phonetic: "fynf" },
  { fr: "sechs", no: "seks", phonetic: "sæks" },
  { fr: "sieben", no: "sju", phonetic: "sibən" },
  { fr: "acht", no: "åtte", phonetic: "akt" },
  { fr: "neun", no: "ni", phonetic: "noin" },
  { fr: "zehn", no: "ti", phonetic: "tsen" },
];

// Learning bolker — mirror the French goals exactly: same ids, same order,
// same targets, so the structure is identical across languages and the
// static-vocab keys (core/everyday/tdf) map straight to each goal.
// Only labels/descriptions are phrased for the German learner.
export const DE_VOCAB_GOALS = [
  { id: "core",     label: "Grunnleggende tysk", desc: "Funksjonsord, pronomen, kjerneverb og basissubstantiv", target: 400 },
  { id: "everyday", label: "Hverdagssituasjoner", desc: "Bestilling av mat og drikke på restaurant, café og bar", target: 200 },
  { id: "tdf",      label: "Tour de France",      desc: "Etapper, felt, tid og avstand – lukket domene",         target: 200 },
];

export const DE_ORDMESTER_GOALS = [
  { target: 150, reward: "Vinylplate" },
  { target: 300, reward: "Vinylplate" },
  { target: 450, reward: "Vinylplate" },
  { target: 600, reward: "Tur til Sveits" },
];

// Starter grammar topics (same shape as French GRAMMAR_TOPICS).
export const DE_GRAMMAR_TOPICS = [
  {
    id: "sein",
    title: "sein — å være",
    subtitle: "Grunnleggende bøying",
    description: "Det viktigste verbet på tysk. Uregelrett — må pugges.",
    pairs: [
      { fr: "ich bin", no: "jeg er", phonetic: "ikj bin" },
      { fr: "du bist", no: "du er", phonetic: "du bist" },
      { fr: "er ist", no: "han er", phonetic: "ær ist" },
      { fr: "sie ist", no: "hun er", phonetic: "si ist" },
      { fr: "wir sind", no: "vi er", phonetic: "vir sint" },
      { fr: "ihr seid", no: "dere er", phonetic: "ir sait" },
      { fr: "sie sind", no: "de er", phonetic: "si sint" },
    ],
  },
  {
    id: "haben",
    title: "haben — å ha",
    subtitle: "Grunnleggende bøying",
    description: "Brukes også til å lage fortid (Perfekt) på tysk.",
    pairs: [
      { fr: "ich habe", no: "jeg har", phonetic: "ikj habə" },
      { fr: "du hast", no: "du har", phonetic: "du hast" },
      { fr: "er hat", no: "han har", phonetic: "ær hat" },
      { fr: "sie hat", no: "hun har", phonetic: "si hat" },
      { fr: "wir haben", no: "vi har", phonetic: "vir habən" },
      { fr: "ihr habt", no: "dere har", phonetic: "ir hapt" },
      { fr: "sie haben", no: "de har", phonetic: "si habən" },
    ],
  },
  {
    id: "artikel",
    title: "Artikler — der, die, das",
    subtitle: "Kjønn og artikler",
    description: "Tyske substantiv har tre kjønn: hankjønn (der), hunkjønn (die) og intetkjønn (das). Kjønnet må pugges sammen med ordet. Bestemt flertall er alltid die.",
    pairs: [
      { fr: "der Mann", no: "mannen (hankjønn)", phonetic: "der man" },
      { fr: "die Frau", no: "kvinnen (hunkjønn)", phonetic: "di frau" },
      { fr: "das Kind", no: "barnet (intetkjønn)", phonetic: "das kind" },
      { fr: "die Kinder", no: "barna (flertall)", phonetic: "di kindər" },
    ],
  },
  {
    id: "praesens",
    title: "Presens — regelrette verb",
    subtitle: "Endinger i nåtid",
    description: "Regelrette verb får faste endinger på stammen: -e, -st, -t, -en, -t, -en. Eksempel: machen (å gjøre).",
    pairs: [
      { fr: "ich mache", no: "jeg gjør", phonetic: "ikj makhə" },
      { fr: "du machst", no: "du gjør", phonetic: "du makst" },
      { fr: "er macht", no: "han gjør", phonetic: "ær makt" },
      { fr: "wir machen", no: "vi gjør", phonetic: "vir makhən" },
      { fr: "ihr macht", no: "dere gjør", phonetic: "ir makt" },
      { fr: "sie machen", no: "de gjør", phonetic: "si makhən" },
    ],
  },
];

// Newspaper / cultural context for the tutor (replaces Houellebecq/Paris).
const DE_BOOK_EXCERPTS = [
  { book: "NZZ", hint: "En enkel nyhetssetning", text: "Das Wetter in der Schweiz ist heute schön." },
  { book: "NZZ", hint: "Om hverdagen", text: "Viele Menschen fahren mit dem Velo zur Arbeit." },
  { book: "Tages-Anzeiger", hint: "Sport i Sveits", text: "Der Verein hat das Spiel am Samstag gewonnen." },
  { book: "Blick", hint: "Om fjellene", text: "Im Winter liegt viel Schnee auf den Bergen." },
];

// Klaus Müller — Swiss-German tutor. Mirrors the French SYSTEM_PROMPT
// structure (KOMMUNIKASJON / UTTALE / PROGRESJON / TEKSTHJELP / FRI) so the
// app's FORSLAG-suggestion parsing works identically across languages.
const DE_SYSTEM_PROMPT = `Du er Klaus Müller, en tålmodig sveitsisk tysklærer for en norsk nybegynner (A1/A2) med dysleksi. Du er professor i Zürich, varm og presis, og overbevist om at tysk egentlig er logisk. Eleven leser sveitsiske aviser (NZZ, Tages-Anzeiger, Blick) og er interessert i sveitsisk hverdag, natur og sport.

KOMMUNIKASJON:
- Norsk som hovedspråk — innfør gradvis mer tysk i takt med elevens fremgang
- Aldri mer tysk enn eleven mestrer
- Skriv ALLTID sveitsisk standardtysk: aldri ß, alltid "ss" (Strasse, Fussball, gross)
- Bruk sveitsiske ord der det er naturlig: Grüezi (hei), Merci (takk), Velo, Natel, Billett, Glace, Zmorge
- Forklar grammatikk gjennom eksempler, aldri lange regelforklaringer
- Korte avsnitt og tydelig struktur
- Kort, oppmuntrende tilbakemelding — ikke overdrevet

UTTALE:
- Skriv alltid fonetisk uttale på norsk i parentes etter nye ord: Grüezi (gryetsi)
- Minn jevnlig eleven på å si ordene høyt

PROGRESJON:
- Bygg alltid videre på det eleven kan fra før
- Bruk sveitsiske tema aktivt: aviser, fjell og natur, ishockey og fotball, mat og hverdag

TEKSTHJELP: Eleven limer inn tekst på tysk. Bruk skjønn: én setning/par ord → bryt ned ord for ord. Lengre tekst → norsk sammendrag (2-3 setninger), oversett avsnitt for avsnitt, plukk ut 2-3 grammatiske mønstre. Avslutt med FORSLAG: [svar1] | [svar2] | [svar3].
FRI: Svar fritt på spørsmål om tysk. Kan spille sveitseren Klaus hvis eleven vil — start på norsk og innfør gradvis mer tysk, bruk *kursiv* for handlinger. Avslutt gjerne med FORSLAG: [svar1] | [svar2] | [svar3].`;

// Personalised Klaus prompt — receives an already-merged profile.
export function systemPromptFor(p) {
  const dysleksi = p.dysleksi ? " med dysleksi" : "";
  const genderNote = p.gender === "hun" ? "\n- Eleven er jente/kvinne — ta hensyn der det er relevant" : "";
  const teacher = p.teacherName || "Klaus";
  return `Du er ${teacher}, en tålmodig sveitsisk tysklærer for en norsk nybegynner (${p.level})${dysleksi}. Eleven heter ${p.name}. Du er professor i Zürich, varm og presis. Eleven leser sveitsiske aviser (NZZ, Tages-Anzeiger, Blick) og er interessert i sveitsisk hverdag, natur og sport.

KOMMUNIKASJON:
- Norsk som hovedspråk — innfør gradvis mer tysk i takt med elevens fremgang
- Aldri mer tysk enn eleven mestrer
- Skriv ALLTID sveitsisk standardtysk: aldri ß, alltid "ss" (Strasse, Fussball, gross)
- Bruk sveitsiske ord der det er naturlig: Grüezi (hei), Merci (takk), Velo, Natel, Billett, Glace, Zmorge
- Forklar grammatikk gjennom eksempler, aldri lange regelforklaringer
- Korte avsnitt og tydelig struktur
- Kort, oppmuntrende tilbakemelding — ikke overdrevet${genderNote}

UTTALE:
- Skriv alltid fonetisk uttale på norsk i parentes etter nye ord: Grüezi (gryetsi)
- Minn jevnlig eleven på å si ordene høyt

PROGRESJON:
- Bygg alltid videre på det eleven kan fra før
- Bruk sveitsiske tema aktivt: aviser, fjell og natur, ishockey og fotball, mat og hverdag

TEKSTHJELP: Hjelp med alt som handler om tekst og oversettelse.
- Eleven limer inn tysk tekst → bryt ned ord for ord (kort setning) eller norsk sammendrag + avsnitt-for-avsnitt + 2-3 grammatiske mønstre (lengre tekst).
- Eleven stiller spørsmål på norsk (f.eks. "Hvordan staves X på tysk?", "Hva betyr Y?", "Oversett Z") → svar direkte på norsk med korrekt sveitsisk tysk og fonetisk uttale i parentes.
- Eleven skriver norsk tekst som skal oversettes → oversett til naturlig sveitsisk tysk på elevens nivå, forklar valgene kort.
Avslutt alltid med FORSLAG: [svar1] | [svar2] | [svar3].
FRI: Svar fritt på spørsmål om tysk. Kan spille sveitseren ${teacher} hvis eleven vil — start på norsk og innfør gradvis mer tysk, bruk *kursiv* for handlinger. Avslutt gjerne med FORSLAG: [svar1] | [svar2] | [svar3].`;
}

export function vocabGenPrompt(activeGoal, knownWords) {
  return `Generate 10 new Swiss Standard German (Schweizer Hochdeutsch) vocabulary words for a Norwegian A1/A2 learner with dyslexia. Current learning topic: "${activeGoal.label}" — ${activeGoal.desc}. CRITICAL: never use ß — always write "ss" (Strasse, Fussball, gross). Prefer Swiss everyday words (Helvetisms) where natural: Velo, Natel, Billett, Perron, Glace, Poulet, Rüebli, Gipfeli, Zmorge/Zmittag/Znacht, Spital, parkieren. Do NOT include these already-known words: ${[...knownWords].join(", ")}. Return a JSON array only — no markdown. Nouns: use the BASE FORM capitalised, WITHOUT article (e.g. "Hund" not "der Hund"); put the article in forms. For each word include inflected forms. Format: [{"fr":"Hund","no":"hunden","p":"hund","forms":[["der Hund","n"],["die Hunde","np"]]},{"fr":"machen","no":"å gjøre","p":"makhən","forms":[["ich mache","pr"],["wir machen","pr"],["sie machen","pr"],["ich habe gemacht","pc"],["ich machte","imp"],["mach!","impv"],["gemacht","pp"]]}]. Codes: pr=Präsens, pc=Perfekt, imp=Präteritum, f=Futur, impv=Imperativ, pp=Partizip, n=Nomen, np=Nomen Plural. Use phonetic spelling in Norwegian (ü→y, ö→ø, ä→æ, z→ts, w→v, sch→sj, ch→kh/kj, ei→ai). Fixed phrases or adverbs: forms:[].`;
}

const deCH = {
  id: "de-CH",
  label: "Sveitsertysk",
  flag: "🇨🇭",

  locale: "de-CH",
  dateLocale: "de-CH",
  storagePrefix: "sveitsertysk",
  themeAttr: "de-CH",

  tutor: {
    defaultPersona: "klaus",
    personas: [
      { id: "klaus", label: "Klaus", gender: "m" },
      { id: "regula", label: "Regula", gender: "f" },
    ],
  },

  systemPrompt: DE_SYSTEM_PROMPT,
  systemPromptFor,
  bookExcerpts: DE_BOOK_EXCERPTS,
  vocabGenPrompt,

  goals: DE_VOCAB_GOALS,
  ordmesterGoals: DE_ORDMESTER_GOALS,
  vocabList: DE_VOCAB_LIST,
  vocabCatOrder: VOCAB_CAT_ORDER,
  vocabCatMap: {},
  staticVocab: DE_STATIC_VOCAB,
  grammarTopics: DE_GRAMMAR_TOPICS,
};

export default deCH;
