export const PROXY_URL = import.meta.env.VITE_PROXY_URL;
export const APP_TOKEN = import.meta.env.VITE_APP_TOKEN;

export const SYSTEM_PROMPT = `Du er en tålmodig fransktutor for en norsk nybegynner (A1/A2) med dysleksi. Eleven har to bøker: en roman av Houellebecq og en bok om kulturlivet i Paris på 1920-tallet.

KOMMUNIKASJON:
- Norsk som hovedspråk — innfør gradvis mer fransk i takt med elevens fremgang
- Aldri mer fransk enn eleven mestrer
- Forklar grammatikk gjennom eksempler, aldri lange regelforklaringer
- Korte avsnitt og tydelig struktur
- Kort, oppmuntrende tilbakemelding — ikke overdrevet

UTTALE:
- Skriv alltid fonetisk uttale på norsk i parentes etter nye ord: bonjour (bånsjur)
- Minn jevnlig eleven på å si ordene høyt

PROGRESJON:
- Bygg alltid videre på det eleven kan fra før
- Bruk ord og temaer fra Houellebecq og Paris på 1920-tallet aktivt

TEKSTHJELP: Eleven limer inn tekst på fransk. Bruk skjønn: én setning/par ord → bryt ned ord for ord. Lengre tekst → norsk sammendrag (2-3 setninger), oversett avsnitt for avsnitt, plukk ut 2-3 grammatiske mønstre. Avslutt med FORSLAG: [svar1] | [svar2] | [svar3].
FRI: Svar fritt på spørsmål om fransk. Kan spille franskmannen Pierre hvis eleven vil — start på norsk og innfør gradvis mer fransk, bruk *kursiv* for handlinger. Avslutt gjerne med FORSLAG: [svar1] | [svar2] | [svar3].`;

export const BOOK_EXCERPTS = [
  { book: "Houellebecq", hint: "Om en enkel dag", text: "Il faisait beau, le ciel était bleu." },
  { book: "Houellebecq", hint: "En filosofisk observasjon", text: "La vie est simple quand on ne pense pas trop." },
  { book: "Paris 1920", hint: "Kunstnernes møtesteder", text: "Les artistes se retrouvaient dans les cafés de Montparnasse." },
  { book: "Paris 1920", hint: "Paris som kunstnerby", text: "Paris était la capitale du monde de l'art dans les années vingt." },
  { book: "Paris 1920", hint: "Jazzens ankomst", text: "Le jazz américain est arrivé à Paris après la guerre." },
];

export const VOCAB_LIST = [
  // Hilsener
  { fr: "bonjour", no: "hallo / god dag", phonetic: "bånsjur" },
  { fr: "bonsoir", no: "god kveld", phonetic: "bånswår" },
  { fr: "au revoir", no: "ha det bra", phonetic: "o rəvwår" },
  { fr: "merci", no: "takk", phonetic: "merssi" },
  { fr: "s'il vous plaît", no: "vær så snill", phonetic: "sil vu plæ" },
  { fr: "oui", no: "ja", phonetic: "wi" },
  { fr: "non", no: "nei", phonetic: "nån" },
  { fr: "pardon", no: "unnskyld", phonetic: "pardån" },
  { fr: "de rien", no: "ingen årsak", phonetic: "də rjæn" },
  // Pronomen
  { fr: "je", no: "jeg", phonetic: "sjø" },
  { fr: "tu", no: "du", phonetic: "ty" },
  { fr: "il", no: "han", phonetic: "il" },
  { fr: "elle", no: "hun", phonetic: "æl" },
  { fr: "nous", no: "vi", phonetic: "nu" },
  { fr: "vous", no: "dere / De", phonetic: "vu" },
  // Vanlige verb
  { fr: "être", no: "å være", phonetic: "ætr" },
  { fr: "avoir", no: "å ha", phonetic: "avwår" },
  { fr: "aller", no: "å gå / dra", phonetic: "alæ" },
  { fr: "venir", no: "å komme", phonetic: "vənir" },
  { fr: "voir", no: "å se", phonetic: "vwår" },
  { fr: "parler", no: "å snakke", phonetic: "parlæ" },
  { fr: "manger", no: "å spise", phonetic: "månsjæ" },
  { fr: "boire", no: "å drikke", phonetic: "bwår" },
  { fr: "lire", no: "å lese", phonetic: "lir" },
  { fr: "écrire", no: "å skrive", phonetic: "ekrir" },
  { fr: "aimer", no: "å like / elske", phonetic: "emæ" },
  { fr: "savoir", no: "å vite", phonetic: "savwår" },
  { fr: "faire", no: "å gjøre / lage", phonetic: "fær" },
  { fr: "habiter", no: "å bo", phonetic: "abitæ" },
  // Steder – Paris
  { fr: "Paris", no: "Paris", phonetic: "pari" },
  { fr: "café", no: "kafé", phonetic: "kafæ" },
  { fr: "rue", no: "gate", phonetic: "ry" },
  { fr: "ville", no: "by", phonetic: "vil" },
  { fr: "quartier", no: "bydel / nabolag", phonetic: "kartjæ" },
  { fr: "musée", no: "museum", phonetic: "myzæ" },
  { fr: "gare", no: "togstasjon", phonetic: "går" },
  { fr: "hôtel", no: "hotell", phonetic: "otæl" },
  { fr: "restaurant", no: "restaurant", phonetic: "rEstorån" },
  { fr: "bibliothèque", no: "bibliotek", phonetic: "biblijotæk" },
  { fr: "Seine", no: "Seinen (elven)", phonetic: "sæn" },
  // Tid
  { fr: "aujourd'hui", no: "i dag", phonetic: "osjurdwi" },
  { fr: "demain", no: "i morgen", phonetic: "dəmæn" },
  { fr: "hier", no: "i går", phonetic: "jær" },
  { fr: "maintenant", no: "nå", phonetic: "mæntnå" },
  { fr: "toujours", no: "alltid", phonetic: "tusjur" },
  { fr: "jamais", no: "aldri", phonetic: "sjamæ" },
  { fr: "souvent", no: "ofte", phonetic: "suvån" },
  // Adjektiver
  { fr: "beau / belle", no: "vakker", phonetic: "bo / bæl" },
  { fr: "grand / grande", no: "stor", phonetic: "grå / grågd" },
  { fr: "petit / petite", no: "liten", phonetic: "pəti / pətit" },
  { fr: "bon / bonne", no: "god / bra", phonetic: "bån / bOn" },
  { fr: "nouveau / nouvelle", no: "ny", phonetic: "nuvo / nuvæl" },
  { fr: "vieux / vieille", no: "gammel", phonetic: "vjø / vjæj" },
  { fr: "simple", no: "enkel", phonetic: "sæmpl" },
  // Kunst og kultur
  { fr: "artiste", no: "kunstner", phonetic: "artist" },
  { fr: "peintre", no: "maler", phonetic: "pæntr" },
  { fr: "écrivain", no: "forfatter", phonetic: "ekriven" },
  { fr: "roman", no: "roman", phonetic: "romån" },
  { fr: "livre", no: "bok", phonetic: "livr" },
  { fr: "tableau", no: "maleri", phonetic: "tablo" },
  { fr: "jazz", no: "jazz", phonetic: "dsjaz" },
  { fr: "musique", no: "musikk", phonetic: "myzik" },
  { fr: "guerre", no: "krig", phonetic: "gær" },
  { fr: "étranger", no: "utlending / fremmed", phonetic: "etrånsjæ" },
  { fr: "époque", no: "epoke / tid", phonetic: "epok" },
  // Mat og drikke
  { fr: "pain", no: "brød", phonetic: "pæn" },
  { fr: "vin", no: "vin", phonetic: "væn" },
  { fr: "eau", no: "vann", phonetic: "o" },
  { fr: "fromage", no: "ost", phonetic: "fromåsj" },
  { fr: "bière", no: "øl", phonetic: "bjær" },
  // Verden og natur
  { fr: "soleil", no: "sol", phonetic: "solæj" },
  { fr: "ciel", no: "himmel / sky", phonetic: "sjæl" },
  { fr: "vie", no: "liv", phonetic: "vi" },
  { fr: "monde", no: "verden", phonetic: "månd" },
  { fr: "homme", no: "mann / menneske", phonetic: "Om" },
  { fr: "femme", no: "kvinne", phonetic: "fam" },
  { fr: "ami / amie", no: "venn / venninne", phonetic: "ami" },
  { fr: "temps", no: "tid / vær", phonetic: "tå" },
  { fr: "année", no: "år", phonetic: "anæ" },
];

export const VOCAB_CAT_ORDER = [
  "Hilsener", "Pronomen", "Vanlige verb", "Steder – Paris",
  "Tid", "Adjektiver", "Kunst og kultur", "Mat og drikke", "Verden og natur", "Andre ord",
];


import { STATIC_VOCAB } from "./static_vocab.js";
export { STATIC_VOCAB };

export const VOCAB_CAT_MAP = {
  "bonjour": "Hilsener", "bonsoir": "Hilsener", "au revoir": "Hilsener",
  "merci": "Hilsener", "s'il vous plaît": "Hilsener", "oui": "Hilsener",
  "non": "Hilsener", "pardon": "Hilsener", "de rien": "Hilsener",
  "je": "Pronomen", "tu": "Pronomen", "il": "Pronomen",
  "elle": "Pronomen", "nous": "Pronomen", "vous": "Pronomen",
  "être": "Vanlige verb", "avoir": "Vanlige verb", "aller": "Vanlige verb",
  "venir": "Vanlige verb", "voir": "Vanlige verb", "parler": "Vanlige verb",
  "manger": "Vanlige verb", "boire": "Vanlige verb", "lire": "Vanlige verb",
  "écrire": "Vanlige verb", "aimer": "Vanlige verb", "savoir": "Vanlige verb",
  "faire": "Vanlige verb", "habiter": "Vanlige verb",
  "Paris": "Steder – Paris", "café": "Steder – Paris", "rue": "Steder – Paris",
  "ville": "Steder – Paris", "quartier": "Steder – Paris", "musée": "Steder – Paris",
  "gare": "Steder – Paris", "hôtel": "Steder – Paris", "restaurant": "Steder – Paris",
  "bibliothèque": "Steder – Paris", "la Seine": "Steder – Paris",
  "aujourd'hui": "Tid", "demain": "Tid", "hier": "Tid",
  "maintenant": "Tid", "toujours": "Tid", "jamais": "Tid", "souvent": "Tid",
  "beau / belle": "Adjektiver", "grand / grande": "Adjektiver", "petit / petite": "Adjektiver",
  "bon / bonne": "Adjektiver", "nouveau / nouvelle": "Adjektiver",
  "vieux / vieille": "Adjektiver", "simple": "Adjektiver",
  "artiste": "Kunst og kultur", "peintre": "Kunst og kultur", "écrivain": "Kunst og kultur",
  "roman": "Kunst og kultur", "livre": "Kunst og kultur", "tableau": "Kunst og kultur",
  "jazz": "Kunst og kultur", "musique": "Kunst og kultur", "guerre": "Kunst og kultur",
  "étranger": "Kunst og kultur", "époque": "Kunst og kultur",
  "pain": "Mat og drikke", "vin": "Mat og drikke", "eau": "Mat og drikke",
  "fromage": "Mat og drikke", "bière": "Mat og drikke",
  "soleil": "Verden og natur", "ciel": "Verden og natur", "vie": "Verden og natur",
  "monde": "Verden og natur", "homme": "Verden og natur", "femme": "Verden og natur",
  "ami / amie": "Verden og natur", "temps": "Verden og natur", "année": "Verden og natur",
};

export const GRAMMAR_TOPICS = [
  {
    id: "etre",
    title: "être — å være",
    subtitle: "Grunnleggende konjugasjon",
    description: "Lær å konjugere être (å være) for alle pronomen. Dette er det viktigste verbet på fransk!",
    pairs: [
      { fr: "je suis", no: "jeg er", phonetic: "sjø swi" },
      { fr: "tu es", no: "du er", phonetic: "ty æ" },
      { fr: "il est", no: "han er", phonetic: "il æ" },
      { fr: "elle est", no: "hun er", phonetic: "æl æ" },
      { fr: "nous sommes", no: "vi er", phonetic: "nu sOm" },
      { fr: "vous êtes", no: "dere er", phonetic: "vu æt" },
      { fr: "ils sont", no: "de er", phonetic: "il sån" },
    ],
  },
  {
    id: "avoir",
    title: "avoir — å ha",
    subtitle: "Grunnleggende konjugasjon",
    description: "Lær å konjugere avoir (å ha). Brukes også for å danne fortid på fransk.",
    pairs: [
      { fr: "j'ai", no: "jeg har", phonetic: "sjæ" },
      { fr: "tu as", no: "du har", phonetic: "ty a" },
      { fr: "il a", no: "han har", phonetic: "il a" },
      { fr: "elle a", no: "hun har", phonetic: "æl a" },
      { fr: "nous avons", no: "vi har", phonetic: "nu avån" },
      { fr: "vous avez", no: "dere har", phonetic: "vu avæ" },
      { fr: "ils ont", no: "de har", phonetic: "il zån" },
    ],
  },
  {
    id: "articles",
    title: "Artikler — le, la, un, une",
    subtitle: "Kjønn og artikler",
    description: "På fransk har alle substantiv kjønn — hankjønn (le/un) eller hunkjønn (la/une). Foran vokal brukes l'. Bestemt flertall: les. Ubestemt flertall: des. Kjønnet må pugges ord for ord — det finnes ingen enkel regel.",
    pairs: [
      { fr: "le café", no: "kaféen", phonetic: "lə kafæ" },
      { fr: "la rue", no: "gaten", phonetic: "la ry" },
      { fr: "l'homme", no: "mannen", phonetic: "lOm" },
      { fr: "un livre", no: "en bok", phonetic: "øn livr" },
      { fr: "une femme", no: "en kvinne", phonetic: "yn fam" },
      { fr: "les artistes", no: "kunstnerne", phonetic: "læ zartist" },
      { fr: "des cafés", no: "noen kaféer", phonetic: "dæ kafæ" },
      { fr: "le monde", no: "verden (hankjønn)", phonetic: "lə månd" },
      { fr: "la musique", no: "musikken (hunkjønn)", phonetic: "la myzik" },
      { fr: "l'ami", no: "vennen (hankjønn)", phonetic: "lami" },
      { fr: "l'amie", no: "venninnen (hunkjønn)", phonetic: "lami" },
      { fr: "un homme", no: "en mann", phonetic: "øn Om" },
      { fr: "une ville", no: "en by", phonetic: "yn vil" },
      { fr: "le temps", no: "tiden / været (hankjønn)", phonetic: "lə tå" },
      { fr: "la vie", no: "livet (hunkjønn)", phonetic: "la vi" },
    ],
  },
  {
    id: "negation",
    title: "Negasjon — ne...pas, jamais, plus, rien",
    subtitle: "Å si nei på fransk",
    description: "Grunnform: ne + verb + pas. Ne forkortes til n' foran vokal. Varianter: ne...jamais (aldri), ne...plus (ikke lenger), ne...rien (ingenting), ne...personne (ingen). I muntlig fransk sløyfes ne ofte.",
    pairs: [
      { fr: "je ne suis pas", no: "jeg er ikke", phonetic: "sjø nə swi pa" },
      { fr: "tu n'es pas", no: "du er ikke", phonetic: "ty næ pa" },
      { fr: "il n'est pas", no: "han er ikke", phonetic: "il næ pa" },
      { fr: "je n'ai pas", no: "jeg har ikke", phonetic: "sjø næ pa" },
      { fr: "ce n'est pas bon", no: "det er ikke bra", phonetic: "sə næ pa bån" },
      { fr: "je n'aime pas ça", no: "jeg liker ikke det", phonetic: "sjø næm pa sa" },
      { fr: "je ne parle jamais", no: "jeg snakker aldri", phonetic: "sjø nə parl sjamæ" },
      { fr: "il n'y a plus de café", no: "det er ikke mer kaffe", phonetic: "il nja ply də kafæ" },
      { fr: "je ne vois rien", no: "jeg ser ingenting", phonetic: "sjø nə vwa rjæn" },
      { fr: "elle ne vient plus", no: "hun kommer ikke lenger", phonetic: "æl nə vjæn ply" },
      { fr: "il ne parle à personne", no: "han snakker ikke med noen", phonetic: "il nə parl a pærsOn" },
    ],
  },
  {
    id: "er-verbs",
    title: "-er verb — parler",
    subtitle: "Første konjugasjonsgruppe",
    description: "De fleste franske verb slutter på -er. Lær mønsteret med parler (å snakke) — det gjelder for hundrevis av verb!",
    pairs: [
      { fr: "je parle", no: "jeg snakker", phonetic: "sjø parl" },
      { fr: "tu parles", no: "du snakker", phonetic: "ty parl" },
      { fr: "il parle", no: "han snakker", phonetic: "il parl" },
      { fr: "nous parlons", no: "vi snakker", phonetic: "nu parlån" },
      { fr: "vous parlez", no: "dere snakker", phonetic: "vu parlæ" },
      { fr: "ils parlent", no: "de snakker", phonetic: "il parl" },
      { fr: "j'aime Paris", no: "jeg liker Paris", phonetic: "sjæm pari" },
    ],
  },
  {
    id: "questions",
    title: "Spørsmål",
    subtitle: "Å spørre på fransk",
    description: "Lær de vanligste spørreutrykkene. Du kan alltid legge est-ce que foran en setning for å gjøre det til et spørsmål.",
    pairs: [
      { fr: "Où habitez-vous?", no: "Hvor bor du?", phonetic: "u abitæ vu" },
      { fr: "Êtes-vous artiste?", no: "Er du kunstner?", phonetic: "æt vu zartist" },
      { fr: "Aimez-vous Paris?", no: "Liker du Paris?", phonetic: "æmæ vu pari" },
      { fr: "Qu'est-ce que c'est?", no: "Hva er det?", phonetic: "kæskə sæ" },
      { fr: "Avez-vous un livre?", no: "Har du en bok?", phonetic: "avæ vu øn livr" },
      { fr: "Parlez-vous souvent?", no: "Snakker du ofte?", phonetic: "parlæ vu suvå" },
    ],
  },
  {
    id: "passe-compose",
    title: "Passé composé",
    subtitle: "Fortid med avoir og être",
    description: "Fortidsformen brukes for å si hva du har gjort. De fleste verb bruker avoir: j'ai + partisipp. Ca. 17 bevegelsesverb (aller, venir, partir, arriver, naître, mourir...) bruker être som hjelpeverb — og partisippen bøyes da etter subjektets kjønn og tall.",
    pairs: [
      { fr: "j'ai mangé", no: "jeg spiste / jeg har spist", phonetic: "sjæ månsjæ" },
      { fr: "tu as parlé", no: "du snakket", phonetic: "ty a parlæ" },
      { fr: "il a vu", no: "han så", phonetic: "il a vy" },
      { fr: "nous avons lu", no: "vi leste", phonetic: "nu zavån ly" },
      { fr: "elle a aimé le café", no: "hun likte kaféen", phonetic: "æl a æmæ lə kafæ" },
      { fr: "j'ai écrit un livre", no: "jeg skrev en bok", phonetic: "sjæ ekri øn livr" },
      { fr: "je suis allé(e) à Paris", no: "jeg dro til Paris (aller → être-hjelp.)", phonetic: "sjø swi zalæ a pari" },
      { fr: "elle est venue au café", no: "hun kom til kaféen (venir → être-hjelp.)", phonetic: "æl æ vøny o kafæ" },
      { fr: "nous sommes allés au musée", no: "vi dro til museet (aller → être-hjelp.)", phonetic: "nu sOm zalæ o myzæ" },
      { fr: "tu es venu(e) à Paris", no: "du kom til Paris (venir → être-hjelp.)", phonetic: "ty æ vøny a pari" },
      { fr: "ils sont venus hier", no: "de kom i går (venir → être-hjelp.)", phonetic: "il sån vøny jær" },
      { fr: "elle a bu du vin au restaurant", no: "hun drakk vin på restauranten", phonetic: "æl a by dy væn o restårå" },
    ],
  },
  // --- Fase 2: Hverdagsfransk ---
  {
    id: "partitifs",
    title: "Partitivartikler — du, de la, des",
    subtitle: "Litt av noe",
    description: "Når du snakker om en ubestemt mengde bruker du du (hankjønn), de la (hunkjønn) eller de l' (foran vokal). Tenk: 'noe brød', 'litt musikk'.",
    pairs: [
      { fr: "du pain", no: "noe brød / brød", phonetic: "dy pæn" },
      { fr: "de la musique", no: "noe musikk / musikk", phonetic: "də la myzik" },
      { fr: "de l'eau", no: "noe vann / vann", phonetic: "də lo" },
      { fr: "des amis", no: "noen venner", phonetic: "dæ zami" },
      { fr: "je mange du fromage", no: "jeg spiser ost", phonetic: "sjø månj dy fromåsj" },
      { fr: "elle boit de la bière", no: "hun drikker øl", phonetic: "æl bwa də la bjær" },
      { fr: "il n'y a pas de café", no: "det er ikke noe kaffe", phonetic: "il nja pa də kafæ" },
    ],
  },
  {
    id: "reflexifs",
    title: "Refleksive verb — se lever",
    subtitle: "Handlinger du gjør mot deg selv",
    description: "Refleksive verb har et pronomen (me, te, se, nous, vous) foran verbet. De brukes ofte om daglige rutiner: stå opp, vaske seg, føle seg.",
    pairs: [
      { fr: "je me lève", no: "jeg står opp", phonetic: "sjø mə læv" },
      { fr: "tu te lèves", no: "du står opp", phonetic: "ty tə læv" },
      { fr: "il se lève", no: "han står opp", phonetic: "il sə læv" },
      { fr: "je me lave", no: "jeg vasker meg", phonetic: "sjø mə lav" },
      { fr: "elle se sent bien", no: "hun har det bra", phonetic: "æl sə sån bjæn" },
      { fr: "nous nous levons", no: "vi står opp", phonetic: "nu nu ləvån" },
      { fr: "je me souviens", no: "jeg husker", phonetic: "sjø mə suvjæn" },
    ],
  },
  {
    id: "possessifs",
    title: "Possessiver — mon, ma, mes",
    subtitle: "Eierskap og tilhørighet",
    description: "Possessivene bøyes etter kjønnet på DET MAN EIER, ikke eieren. Hankjønn: mon/ton/son. Hunkjønn: ma/ta/sa (men mon/ton/son foran vokal). Flertall: mes/tes/ses. Vi: notre/nos. Dere/De: votre/vos. De: leur/leurs.",
    pairs: [
      { fr: "mon ami", no: "vennen min (hankjønn)", phonetic: "mån ami" },
      { fr: "ma ville", no: "byen min (hunkjønn)", phonetic: "ma vil" },
      { fr: "mes livres", no: "bøkene mine (flertall)", phonetic: "mæ livr" },
      { fr: "ton ami", no: "vennen din (hankjønn)", phonetic: "tån ami" },
      { fr: "mon amie", no: "venninnen min (mon foran vokal!)", phonetic: "mån ami" },
      { fr: "sa femme", no: "kona hans / kona hennes", phonetic: "sa fam" },
      { fr: "son livre", no: "boken hans/hennes", phonetic: "sån livr" },
      { fr: "notre café", no: "kaféen vår", phonetic: "nOtr kafæ" },
      { fr: "nos livres", no: "bøkene våre", phonetic: "no livr" },
      { fr: "votre livre", no: "boken din/deres (formelt)", phonetic: "vOtr livr" },
      { fr: "vos amis", no: "vennene dine/deres (formelt)", phonetic: "vo zami" },
      { fr: "leur restaurant", no: "restauranten deres", phonetic: "lœr restårå" },
      { fr: "leurs livres", no: "bøkene deres", phonetic: "lœr livr" },
    ],
  },
  {
    id: "futur-proche",
    title: "Futur proche — aller + infinitif",
    subtitle: "Nær fremtid",
    description: "Den enkleste måten å si hva du skal gjøre: bruk aller (å gå/dra) konjugert + et infinitiv. Tilsvarer norsk 'skal' eller 'kommer til å'.",
    pairs: [
      { fr: "je vais boire du vin", no: "jeg skal drikke vin", phonetic: "sjø væ bwar dy væn" },
      { fr: "tu vas manger", no: "du skal spise", phonetic: "ty va månsjæ" },
      { fr: "il va faire beau", no: "det skal bli fint vær", phonetic: "il va fær bo" },
      { fr: "nous allons voir Paris", no: "vi skal se Paris", phonetic: "nu zalån vwar pari" },
      { fr: "qu'est-ce que tu vas faire?", no: "hva skal du gjøre?", phonetic: "kæskə ty va fær" },
      { fr: "elle va lire un livre", no: "hun skal lese en bok", phonetic: "æl va lir øn livr" },
      { fr: "ils vont venir demain", no: "de skal komme i morgen", phonetic: "il vån vənir dəmæn" },
    ],
  },
  {
    id: "accord-adjectif",
    title: "Adjektivbøyning — kjønn og tall",
    subtitle: "Adjektiv må bøyes",
    description: "Adjektiver bøyes etter substantivets kjønn og tall. Grunnregel: legg til -e for hunkjønn, -s for flertall, -es for hunkjønn flertall. Uregelmessige: beau/belle, vieux/vieille, nouveau/nouvelle. Noen adjektiv står FORAN substantivet (beau, vieux, nouveau, grand, petit, bon, mauvais).",
    pairs: [
      { fr: "un grand café", no: "en stor kafé", phonetic: "øn grå kafæ" },
      { fr: "une grande ville", no: "en stor by", phonetic: "yn grågd vil" },
      { fr: "un livre simple", no: "en enkel bok", phonetic: "øn livr sæmpl" },
      { fr: "une belle musique", no: "en vakker musikk (beau → belle i hunkjønn)", phonetic: "yn bæl myzik" },
      { fr: "de beaux tableaux", no: "vakre malerier (beau → beaux i flertall)", phonetic: "də bo tablo" },
      { fr: "une belle femme", no: "en vakker kvinne", phonetic: "yn bæl fam" },
      { fr: "les artistes sont bons", no: "kunstnerne er gode (bon → bons i flertall)", phonetic: "læ zartist sån bån" },
      { fr: "un vieux livre", no: "en gammel bok (hankjønn)", phonetic: "øn vjø livr" },
      { fr: "une vieille ville", no: "en gammel by (vieux → vieille i hunkjønn)", phonetic: "yn vjæj vil" },
      { fr: "un nouveau roman", no: "en ny roman (hankjønn)", phonetic: "øn nuvo romå" },
      { fr: "une nouvelle vie", no: "et nytt liv (nouveau → nouvelle i hunkjønn)", phonetic: "yn nuvæl vi" },
      { fr: "un beau tableau", no: "et vakkert maleri", phonetic: "øn bo tablo" },
      { fr: "une bonne bière", no: "en god øl (bon → bonne i hunkjønn)", phonetic: "yn bOn bjær" },
    ],
  },
  {
    id: "prepositions-lieux",
    title: "Preposisjoner — land og byer",
    subtitle: "Å si hvor du er og drar",
    description: "Til/i by: à. Til/i hunkjønnsland: en. Til/i hankjønnsland: au. Fra by: de. Fra land: de/du/des. Frankrike er hunkjønn — en France.",
    pairs: [
      { fr: "je vais à Paris", no: "jeg drar til Paris (by → à)", phonetic: "sjø væ a pari" },
      { fr: "il habite en France", no: "han bor i Frankrike (hunkjønnsland → en)", phonetic: "il abit å frås" },
      { fr: "j'habite en France", no: "jeg bor i Frankrike", phonetic: "sjabit å frås" },
      { fr: "elle vient de Paris", no: "hun kommer fra Paris (by → de)", phonetic: "æl vjæn də pari" },
      { fr: "nous allons en France", no: "vi drar til Frankrike", phonetic: "nu zalån å frås" },
      { fr: "il habite à Paris", no: "han bor i Paris (by → à)", phonetic: "il abit a pari" },
      { fr: "je viens de Paris", no: "jeg kommer fra Paris", phonetic: "sjø vjæn də pari" },
    ],
  },
  // --- Fase 3: Mellomtrinn ---
  {
    id: "imperatif",
    title: "Imperativ — beordre og be",
    subtitle: "Å gi beskjeder",
    description: "Imperativ brukes for å gi ordre, råd eller oppfordringer. Drop subjektet — bare bruk verbformen direkte. Tu-form mister -s for -er verb: parler → parle (ikke parles).",
    pairs: [
      { fr: "Viens!", no: "Kom!", phonetic: "vjæn" },
      { fr: "Mange!", no: "Spis! (tu-form: manger → mange)", phonetic: "månj" },
      { fr: "Parlez souvent!", no: "Snakk ofte! (vous-form)", phonetic: "parlæ suvå" },
      { fr: "Ne parle pas!", no: "Ikke snakk! (tu-form med negasjon)", phonetic: "nə parl pa" },
      { fr: "Lis ce livre!", no: "Les denne boken!", phonetic: "li sə livr" },
      { fr: "Buvez de l'eau!", no: "Drikk vann! (vous-form)", phonetic: "byvæ də lo" },
      { fr: "Venez voir Paris!", no: "Kom og se Paris!", phonetic: "vənæ vwar pari" },
    ],
  },
  {
    id: "imparfait",
    title: "Imparfait — beskrivelse i fortid",
    subtitle: "Slik var det",
    description: "Imparfait brukes for å beskrive hvordan noe var, hva som pleide å skje, eller bakgrunnssituasjoner. Mønster: stamme + -ais, -ais, -ait, -ions, -iez, -aient.",
    pairs: [
      { fr: "il faisait beau", no: "det var fint vær", phonetic: "il fəzæ bo" },
      { fr: "c'était une belle ville", no: "det var en vakker by", phonetic: "sætæ yn bæl vil" },
      { fr: "j'aimais la musique", no: "jeg likte musikk", phonetic: "sjæmæ la myzik" },
      { fr: "nous habitions à Paris", no: "vi bodde i Paris", phonetic: "nu zabitjån a pari" },
      { fr: "elle aimait lire", no: "hun likte å lese", phonetic: "æl æmæ lir" },
      { fr: "il y avait du vin", no: "det var vin (der)", phonetic: "il javæ dy væn" },
      { fr: "je lisais souvent", no: "jeg leste ofte", phonetic: "sjø lizæ suvå" },
    ],
  },
  {
    id: "imparfait-vs-passe",
    title: "Imparfait vs. passé composé",
    subtitle: "Fortid i kontekst",
    description: "Passé composé = avsluttet hendelse ('jeg spiste'). Imparfait = pågående tilstand eller vane ('jeg spiste alltid'). Begge kan brukes i samme setning.",
    pairs: [
      { fr: "hier, j'ai mangé du pain", no: "i går spiste jeg brød (avsluttet)", phonetic: "jær sjæ månsjæ dy pæn" },
      { fr: "avant, je mangeais souvent du pain", no: "før spiste jeg ofte brød (vane)", phonetic: "avå sjø månsjæ suvå dy pæn" },
      { fr: "il lisait quand je suis venu", no: "han leste da jeg kom", phonetic: "il lizæ kå sjø swi vøny" },
      { fr: "elle buvait du vin pendant que je lisais", no: "hun drakk vin mens jeg leste", phonetic: "æl byvæ dy væn pådå kə sjø lizæ" },
      { fr: "nous avons vu le musée", no: "vi så museet (avsluttet)", phonetic: "nu zavån vy lə myzæ" },
      { fr: "il faisait beau quand nous sommes allés au café", no: "det var fint da vi gikk på kafé", phonetic: "il fəzæ bo kå nu sOm zalæ o kafæ" },
      { fr: "j'ai écrit un livre il y a deux ans", no: "jeg skrev en bok for to år siden", phonetic: "sjæ ekri øn livr il ja dø å" },
    ],
  },
  {
    id: "conditionnel",
    title: "Kondisjonalis — ville og skulle",
    subtitle: "Det hypotetiske",
    description: "Kondisjonalis uttrykker ønsker, hypoteser og høflige forespørsler. Dannes av infinitiv + imparfait-endinger: -ais, -ais, -ait, -ions, -iez, -aient.",
    pairs: [
      { fr: "je voudrais un café", no: "jeg vil gjerne ha en kaffe (høflig)", phonetic: "sjø vudræ øn kafæ" },
      { fr: "ce serait beau", no: "det ville vært vakkert", phonetic: "sə sræ bo" },
      { fr: "j'aimerais voir Paris", no: "jeg skulle gjerne sett Paris", phonetic: "sjæmræ vwar pari" },
      { fr: "tu aimerais venir?", no: "kunne du tenke deg å komme?", phonetic: "ty æmræ vənir" },
      { fr: "il faudrait boire de l'eau", no: "man burde drikke vann", phonetic: "il fodræ bwar də lo" },
      { fr: "si j'avais le temps...", no: "hvis jeg hadde tid...", phonetic: "si sjavæ lə tå" },
      { fr: "vous voudriez du vin?", no: "ønsker dere vin?", phonetic: "vu vudrijæ dy væn" },
    ],
  },
  {
    id: "pronoms-relatifs",
    title: "Relativpronomen — qui, que, dont, où",
    subtitle: "Å binde setninger sammen",
    description: "Qui = som (subjekt). Que = som (objekt). Dont = som / hvis / av/om hvem. Où = der / hvor. De binder to setninger til én og unngår gjentakelse.",
    pairs: [
      { fr: "c'est l'homme qui parle", no: "det er mannen som snakker", phonetic: "sæ lOm ki parl" },
      { fr: "voilà le livre que j'ai lu", no: "der er boken jeg leste", phonetic: "vwala lə livr kə sjæ ly" },
      { fr: "Paris est la ville où j'habite", no: "Paris er byen jeg bor i", phonetic: "pari æ la vil u sjabit" },
      { fr: "c'est le livre dont je parle", no: "det er boken jeg snakker om", phonetic: "sæ lə livr dån sjø parl" },
      { fr: "l'artiste dont je parle", no: "kunstneren jeg snakker om", phonetic: "lartist dån sjø parl" },
      { fr: "la femme qui est venue", no: "kvinnen som kom", phonetic: "la fam ki æ vəny" },
      { fr: "le café que tu aimes", no: "kaféen du liker", phonetic: "lə kafæ kə ty æm" },
    ],
  },
  // --- Fase 4: Litterær inngang ---
  {
    id: "comparatif",
    title: "Komparativ og superlativ",
    subtitle: "Mer, mindre, best",
    description: "Komparativ: plus + adj + que (mer enn), moins + adj + que (mindre enn), aussi + adj + que (like). Superlativ: le/la/les plus + adj (den/det mest).",
    pairs: [
      { fr: "le café est plus grand que le restaurant", no: "kaféen er større enn restauranten", phonetic: "lə kafæ æ ply grå kə lə restårå" },
      { fr: "il parle moins souvent que moi", no: "han snakker sjeldnere enn meg", phonetic: "il parl mwæn suvå kə mwa" },
      { fr: "c'est le meilleur café", no: "det er den beste kaféen", phonetic: "sæ lə mæjœr kafæ" },
      { fr: "il est aussi grand que moi", no: "han er like stor som meg", phonetic: "il æ osi grå kə mwa" },
      { fr: "c'est la plus belle ville", no: "det er den vakreste byen", phonetic: "sæ la ply bæl vil" },
      { fr: "je lis moins souvent qu'hier", no: "jeg leser sjeldnere enn i går", phonetic: "sjø li mwæn suvå kjær" },
      { fr: "c'est le plus beau", no: "det er det vakreste", phonetic: "sæ lə ply bo" },
    ],
  },
  {
    id: "gerondif",
    title: "Gérondif — en + participe présent",
    subtitle: "Samtidige handlinger",
    description: "Gérondif dannes med en + verb-stamme + -ant. Tilsvarer norsk 'mens jeg...' eller 'ved å...'. Brukes mye i literær og muntlig fransk.",
    pairs: [
      { fr: "en lisant", no: "mens jeg leser / ved å lese", phonetic: "å lizå" },
      { fr: "en mangeant", no: "mens jeg spiser / ved å spise", phonetic: "å månsjå" },
      { fr: "en écrivant", no: "mens jeg skriver / ved å skrive", phonetic: "å nekrivå" },
      { fr: "en buvant du vin", no: "mens han drikker vin", phonetic: "å byvå dy væn" },
      { fr: "elle lit en mangeant", no: "hun leser mens hun spiser", phonetic: "æl li å månsjå" },
      { fr: "j'aime écrire en buvant du café", no: "jeg liker å skrive mens jeg drikker kaffe", phonetic: "sjæm ekrir å byvå dy kafæ" },
      { fr: "tout en parlant", no: "mens han/hun snakket", phonetic: "tu tå parlå" },
    ],
  },
  // --- Fase 5: Avansert ---
  {
    id: "subjonctif",
    title: "Subjonktiv — il faut que...",
    subtitle: "Nødvendighet og følelser",
    description: "Subjonktiv brukes etter uttrykk for nødvendighet, ønsker og følelser. Triggere: il faut que, je veux que, bien que, avant que. Kjennetegn: -e, -es, -e, -ions, -iez, -ent.",
    pairs: [
      { fr: "il faut que tu viennes", no: "du må komme", phonetic: "il fo kə ty vjæn" },
      { fr: "je veux que tu viennes aussi", no: "jeg vil at du også skal komme", phonetic: "sjø vø kə ty vjæn osi" },
      { fr: "il est important que vous parliez", no: "det er viktig at dere snakker", phonetic: "il æ æmpOrtå kə vu parljæ" },
      { fr: "bien qu'il soit simple", no: "selv om det er enkelt", phonetic: "bjæn kil swa sæmpl" },
      { fr: "j'aime que tu sois là", no: "jeg er glad for at du er her", phonetic: "sjæm kə ty swa la" },
      { fr: "avant que tu viennes", no: "før du kommer", phonetic: "avå kə ty vjæn" },
      { fr: "il faut que nous parlions", no: "vi må snakke", phonetic: "il fo kə nu parljån" },
    ],
  },
  {
    id: "voix-passive",
    title: "Passiv — être + participe passé",
    subtitle: "Når noe skjer med noe",
    description: "Passiv dannes med être + perfektum partisipp. Partisippen bøyes etter subjektets kjønn og tall. Tilsvarer norsk 'bli' eller 'ble'.",
    pairs: [
      { fr: "le tableau est peint", no: "maleriet er malt", phonetic: "lə tablo æ pæn" },
      { fr: "le livre a été écrit", no: "boken ble skrevet", phonetic: "lə livr a etæ ekri" },
      { fr: "le livre est écrit par Houellebecq", no: "boken er skrevet av Houellebecq", phonetic: "lə livr æ ekri par wælbæk" },
      { fr: "le livre a été lu", no: "boken ble lest", phonetic: "lə livr a etæ ly" },
      { fr: "le livre est lu dans le monde", no: "boken leses i hele verden", phonetic: "lə livr æ ly då lə månd" },
      { fr: "le livre a été écrit à Paris", no: "boken ble skrevet i Paris", phonetic: "lə livr a etæ ekri a pari" },
      { fr: "le livre sera lu demain", no: "boken vil bli lest i morgen", phonetic: "lə livr sra ly dəmæn" },
    ],
  },
];

export const EXIT_PHRASES = [
  "Er du sikker på at du vil avslutte?",
  "Êtes-vous sûr de vouloir quitter?",
  "Allerede ferdig for i dag?",
  "Déjà fini pour aujourd'hui?",
  "Vil du virkelig forlate Pierre?",
  "Vous voulez vraiment quitter Pierre?",
  "Vi savner deg allerede!",
  "On va vous manquer!",
  "Husker du at du skal lese Houellebecq på fransk én dag?",
  "N'oubliez pas — Houellebecq vous attend en français!",
  "Sikker? Du var så nær fremgang!",
  "Sûr? Vous étiez si proche du progrès!",
  "Et lite franskord til før du går?",
  "Encore un petit mot français avant de partir?",
  "Au revoir betyr ikke for alltid.",
  "Au revoir ne veut pas dire pour toujours.",
  "Ta gjerne med deg noen franske ord ut i verden!",
  "Emportez quelques mots français dans le monde!",
  "Kom tilbake snart — Pierre venter.",
  "Revenez vite — Pierre vous attend.",
];

export const MODES = [
  { id: "dagens-glose", label: "Dagens øvelse – glose", icon: "◆", desc: "5 nye ord daglig" },
  { id: "glose", label: "Gloseøvelse", icon: "◈", desc: "Øv på alle ordene dine" },
  { id: "dagens-grammatikk", label: "Daglig grammatikk", icon: "◑", desc: "Ny grammatikkregel per dag" },
  { id: "grammatikk-ovelse", label: "Grammatikkøvelse", icon: "◐", desc: "Repeter lærte grammatikkregler" },
  { id: "teksthjelp", label: "Teksthjelp", icon: "◫", desc: "Lim inn tekst på fransk" },
  { id: "fri", label: "Spør fritt", icon: "✦", desc: "Still spørsmål om fransk" },
];

export const STARTER = {
  teksthjelp: "Lim inn en setning eller lengre tekst på fransk — jeg tilpasser meg automatisk.\n\nDu kan også velge en setning fra bøkene dine nedenfor.",
  fri: "Hva lurer du på om fransk? Du kan også skrive «Pierre» hvis du vil øve med en virtuell franskmann.",
};

export const CHAT_MODES = ["teksthjelp", "fri"];

export const MASTERY_LABELS = ["ikke lært", "kjennskap", "bekjent", "lært", "godt lært", "mestret"];
export const MASTERY_COLORS = [
  "rgba(26,18,16,0.25)",
  "#c8783a",
  "#c8a03a",
  "#7ab050",
  "#3a8a50",
  "#1a7a38",
];

export const SR_INTERVALS = [1, 2, 4, 8, 16, 32];

export const MASTERY_POINTS = 20;
export const MASTERY_PAUSE_MIN = 20;
export const MASTERY_PAUSE_MAX = 40;

export const ORDMESTER_GOALS = [
  { target: 150, reward: "Vinylplate" },
  { target: 300, reward: "Vinylplate" },
  { target: 450, reward: "Vinylplate" },
  { target: 600, reward: "Vinylplate" },
  { target: 750, reward: "Tur til Frankrike" },
];

export const VOCAB_GOALS = [
  // --- Fase 1: Grunnmur (0–800) ---
  { id: "core",       label: "Grunnleggende fransk",          desc: "Funksjonsord, pronomen, kjerneverb og basissubstantiv",                target: 400 },
  { id: "everyday",  label: "Hverdagssituasjoner",            desc: "Bestilling av mat og drikke på restaurant, café og bar",               target: 200 },
  { id: "tdf",       label: "Tour de France",                 desc: "Etapper, felt, tid og avstand – lukket domene",                        target: 200 },
  // --- Fase 2: Utvidelse av hverdagsfransk (800–1 950) ---
  { id: "senses",    label: "Beskrivelse, rom og sanser",     desc: "Farger, lys, former, rom og sanselig beskrivelse",                     target: 120 },
  { id: "food",      label: "Mat, drikke og matlaging",       desc: "Råvarer, tilberedning, smak og fransk kjøkken",                        target: 200 },
  { id: "body",      label: "Kropp, helse og rutine",         desc: "Kroppsdeler, symptomer, daglige rutiner og medisin",                   target: 150 },
  { id: "family",    label: "Familie og relasjoner",          desc: "Familiemedlemmer, vennskap, hjemmeliv og følelser mellom folk",        target: 150 },
  { id: "travel",    label: "Feriereiser og transport",       desc: "Reise, hotell, flyplass, tog og å finne veien",                        target: 180 },
  { id: "core2",     label: "Grunnleggende fransk — avansert",desc: "Mer nyanserte bindeord, preposisjoner og frekvente verb",              target: 150 },
  { id: "geo",       label: "Geografi og natur",              desc: "Land, landskap, vær, klima og Frankrikes regioner",                    target: 200 },
  // --- Fase 3: Mellomtrinn – samfunn og kultur (1 950–3 400) ---
  { id: "everyday2", label: "Hverdagssituasjoner — avansert", desc: "Shopping, bank, lege, apotek og mer komplekse situasjoner",            target: 150 },
  { id: "identity",  label: "Følelser og identitet",          desc: "Indre liv, personlighetstrekk, selvbeskrivelse og relasjoner",         target: 170 },
  { id: "popculture",label: "Populærkultur og underholdning", desc: "Musikk, film, TV, idrett, sosiale medier og mote",                    target: 200 },
  { id: "history",   label: "Historie",                       desc: "Revolusjon, verdenskrigene, de fem republikkene og sentrale hendelser", target: 230 },
  { id: "arts",      label: "Kunst og kulturliv",             desc: "Kunstretninger, musikk, litteratur, teater, kino og museer",           target: 200 },
  { id: "politics",  label: "Det politiske system",           desc: "Statsapparat, partier, valg og demokratiske institusjoner",            target: 200 },
  { id: "tdf2",      label: "Tour de France — avansert",      desc: "Taktikk, lagdynamikk, fjell og sendetekst i detalj",                  target: 150 },
  { id: "gastro",    label: "Matlaging og gastronomi — avansert", desc: "Fransk gastronomi, vin, regionale spesialiteter og finmat",        target: 150 },
  // --- Fase 4: Litterær inngang (3 400–4 650) ---
  { id: "prose1",    label: "Litterær prosa — nivå 1",        desc: "Litterære bindeord, fortidsformer i tekst og beskrivende prosa",       target: 200 },
  { id: "work",      label: "Fag, yrker og arbeidsliv",       desc: "Profesjoner, arbeidsplass, utdanning og fagspråk",                    target: 200 },
  { id: "abstract",  label: "Abstrakt og filosofisk",         desc: "Årsak, konsekvens, tvil, ironi og abstrakte substantiv",               target: 150 },
  { id: "geo2",      label: "Geografi — avansert",            desc: "Frankrikes regioner i dybden, oversjøiske territorier og Europa",     target: 200 },
  { id: "body2",     label: "Kropp og helse — avansert",      desc: "Medisinske konsultasjoner, psykisk helse og kroppssystemer",          target: 150 },
  { id: "popculture2",label:"Populærkultur — avansert",       desc: "Filmanalyse, musikkritikk og internetkultur på fransk",               target: 200 },
  { id: "everyday3", label: "Hverdagssituasjoner — avansert 2",desc: "Juridiske forhold, kontrakter, forsikring og formelle situasjoner",  target: 150 },
  // --- Fase 5: Avansert kulturforståelse (4 650–6 050) ---
  { id: "prose2",    label: "Litterær prosa — nivå 2",        desc: "Houellebecqs register: fremmedgjøring, kropp og moderne Frankrike",    target: 250 },
  { id: "history2",  label: "Historie — avansert",            desc: "Historiografi, kollektiv hukommelse og commemorasjon",                target: 200 },
  { id: "politics2", label: "Det politiske system — avansert",desc: "Politisk debattspråk, medier, journalistikk og kommentar",            target: 200 },
  { id: "aesthetics",label: "Beskrivelse og estetikk — avansert", desc: "Kunstbeskrivelse, estetisk vurdering, stil og arkitektur",        target: 150 },
  { id: "paris1920", label: "Paris 1920 — kunst og modernitet",desc: "Avantgarde, surrealisme, dadaisme og kunsthistorisk terminologi",    target: 200 },
  { id: "nature",    label: "Natur, miljø og vitenskap",      desc: "Miljø, klimaendringer, biologi, kjemi og vitenskapsspråk",            target: 200 },
  { id: "core3",     label: "Grunnleggende fransk — avansert 2", desc: "Idiomer, kollokasjoner og register – formelt vs. uformelt",        target: 200 },
  // --- Fase 6: Ekspertnivå og direkte lesing (6 050–8 000) ---
  { id: "medicine",  label: "Medisin og psykologi",           desc: "Psykiatri, farmakologi og biologisk vokabular til Sérotonine",        target: 200 },
  { id: "philosophy",label: "Filosofi og samfunn",            desc: "Eksistensialisme, sosiologi og franske filosofiske begreper",         target: 250 },
  { id: "gastro2",   label: "Mat og vin — ekspert",           desc: "Sommeliervokabular, ost, regionale retter og kulinarisk kritikk",     target: 200 },
  { id: "prose3",    label: "Litterær prosa — nivå 3",        desc: "Komplekse litterære grep, intertekstualitet, metafor og retorikk",    target: 250 },
  { id: "tdf3",      label: "Tour de France — ekspert",       desc: "Historiske TdF-referanser, sykkelkultur og kjendisvokabular",         target: 150 },
  { id: "houellebecq",label:"Houellebecq — direkte lesing",   desc: "Sérotonines spesifikke vokabular: depresjon, ironi og samtids-Frankrike", target: 300 },
  { id: "paris_adv", label: "Paris kulturliv — direkte lesing",desc: "Kunsthistorisk og kulturkritisk vokabular fra 1920-boken",          target: 250 },
  { id: "free",      label: "Avansert lesing og fri forståelse",desc: "Avisspråk, kompleks argumentasjon og nær-innfødt leseforståelse",   target: 350 },
];

export const WORDS_KEY = "fransk-laering-ord-v2";
export const GRAMMAR_WORDS_KEY = "fransk-grammar-words";
export const GRAMMAR_PROGRESS_KEY = "fransk-grammar-progress";
export const STREAK_KEY = "fransk-streak";
export const BEST_STREAK_KEY = "fransk-best-streak";
export const DAGENS_GLOSE_KEY = "fransk-dagens-glose";
export const SESSION_KEY = "fransk-session-msgs";
export const SESSION_SCREEN_KEY = "fransk-session-screen";
export const ANSWER_COUNT_KEY = "fransk-global-answer-count";
export const GENERATED_VOCAB_KEY = "fransk-generated-vocab";

export const gold = "#c8783a";
export const dark = "#f5f0e6";
export const cream = "#1a1210";
export const card = "#ffffff";
export const brd = "rgba(0,0,0,0.09)";
export const grn = "#3a8a50";
export const red = "#c83a3a";
