// Shared exercise catalog for the Øv hub (OvelserScreen) and Snakk hub (SnakkScreen).
// Grouped by the skill the learner practices, not by technical type.
// Every id maps to a screen via the onStart() dispatcher in App.jsx — unchanged here.
import { IcoGrid, IcoSwap, IcoList, IcoMic as IcoMicSvg, IcoPen, IcoChat as IcoChatSvg, IcoSpeak, IcoArrow, IcoFlame } from "./components/Icons.jsx";
import { MASTERY_LABELS } from "./constants.js";

const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

// ① Gloser — vocabulary
export const VOCAB_EXERCISES = [
  { id: "glose",           label: "Gloseøvelse",     sub: "Glosekort med repetisjon",        Icon: IcoGrid },
  { id: "ordoversettelse", label: "Ordoversettelse", sub: "Skriv oversettelse, begge veier", Icon: IcoSwap },
  { id: "flervalg",        label: "Flervalg",        sub: "Velg riktig svar, 0,25 pt/rett",  Icon: IcoList },
  { id: "si-ordet",        label: "Si ordet",        sub: "Hør og øv på uttalen",            Icon: IcoMicSvg },
  { id: "glose-tier-0",    label: `Øv: ${cap(MASTERY_LABELS[0])}`,                             sub: "Kun ord du ikke har lært ennå",          Icon: IcoGrid },
  { id: "glose-tier-1-2",  label: `Øv: ${cap(MASTERY_LABELS[1])} – ${cap(MASTERY_LABELS[2])}`, sub: "Ord du kjenner litt, men ikke behersker", Icon: IcoGrid },
  { id: "glose-tier-3-4",  label: `Øv: ${cap(MASTERY_LABELS[3])} – ${cap(MASTERY_LABELS[4])}`, sub: "Ord du kan godt — vedlikehold og mestre", Icon: IcoGrid },
];

// ② Setninger & grammatikk — production + rules
export const SENTENCE_GRAMMAR_EXERCISES = [
  { id: "grammatikk-teori",      label: "Grammatikkteori",       sub: "Lær teorien bak reglene",            Icon: IcoArrow },
  { id: "grammatikk-ovelse",     label: "Grammatikkøvelse",      sub: "Repeter lærte regler",               Icon: IcoPen },
  { id: "artikkel-ovelse",       label: "Artikkeltest",          sub: "Øv på le / la / les / l'",           Icon: IcoPen },
  { id: "bøying-ovelse",         label: "Bøyingstest",           sub: "Skriv riktig bøyingsform",           Icon: IcoPen },
  { id: "boyningstabell",        label: "Bøyningstabellen",      sub: "Lær og test hele paradigmet",        Icon: IcoList },
  { id: "oversett-grammatikken", label: "Oversett grammatikken", sub: "Skriv oversettelse av grammatikk",   Icon: IcoSwap },
  { id: "grammatikk-flervalg",   label: "Grammatikkflervalg",    sub: "Flervalg på grammatikk",             Icon: IcoList },
  { id: "oversett-setningen",    label: "Oversett setningen",    sub: "AI-lager setninger fra ordbanken",   Icon: IcoSwap },
  { id: "generert-flervalg",     label: "Generert flervalg",     sub: "AI-lager flervalg, begge retninger", Icon: IcoList },
  { id: "si-setningen",          label: "Si setningen!",         sub: "Hør og si hele setningen høyt",      Icon: IcoMicSvg },
  { id: "bygg-setningen",        label: "Bygg setningen",        sub: "Sett ordene i riktig rekkefølge",    Icon: IcoPen },
  { id: "historiediktat",        label: "Historiediktat",        sub: "Hør historien, fyll inn ordene",     Icon: IcoMicSvg },
];

// ③ Spill — playful drilling
export const GAME_EXERCISES = [
  { id: "memory-match",      label: "Memory",          sub: "Match norsk og fransk — 8 par",  Icon: IcoGrid },
  { id: "tidspress",         label: "Tidspress",       sub: "Oversett flest mulig på 60 sek", Icon: IcoFlame },
  { id: "lyttedetektiv",     label: "Lyttedetektiv",   sub: "Hør og velg riktig svar",        Icon: IcoMicSvg },
  { id: "kategorisortering", label: "Kategorisortering", sub: "Sorter ord i riktig kategori", Icon: IcoList },
  { id: "ordstokken",        label: "Ordstokken",      sub: "Stav det franske ordet",         Icon: IcoSwap },
  { id: "kryssord",          label: "Kryssord",        sub: "Fyll inn franske ord fra ordbanken", Icon: IcoGrid },
  { id: "sudoku",            label: "Tallsudoku",      sub: "Sudoku — skriv tallene på fransk", Icon: IcoGrid },
];

// Øv hub sections, in display order.
// groupKey ties a section to its focus-group selector ("vocab" / "grammar"); null = no selector.
export const HUB_SECTIONS = [
  { title: "Gloser",                 groupKey: "vocab",   items: VOCAB_EXERCISES },
  { title: "Setninger & grammatikk", groupKey: "grammar", items: SENTENCE_GRAMMAR_EXERCISES },
  { title: "Spill",                  groupKey: null,      items: GAME_EXERCISES },
];

// Snakk hub — conversation with the tutor
export const CONVERSATION_CHOICES = [
  { id: "fri",        label: "Snakk fritt",  sub: "Snakk med læreren din om hva som helst", Icon: IcoSpeak },
  { id: "rollespill", label: "Rollespill",   sub: "Øv på situasjoner — kafé, butikk, hotell", Icon: IcoSpeak },
  { id: "teksthjelp", label: "Teksthjelpen", sub: "Lim inn eller spør om en tekst",         Icon: IcoChatSvg },
];
