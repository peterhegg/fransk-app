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
  { fr: "la Seine", no: "Seinen (elven)", phonetic: "la sæn" },
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
    description: "På fransk har alle substantiv kjønn — hankjønn (le/un) eller hunkjønn (la/une). Dette må pugges!",
    pairs: [
      { fr: "le café", no: "kaféen", phonetic: "lə kafæ" },
      { fr: "la rue", no: "gaten", phonetic: "la ry" },
      { fr: "l'homme", no: "mannen", phonetic: "lOm" },
      { fr: "un livre", no: "en bok", phonetic: "øn livr" },
      { fr: "une femme", no: "en kvinne", phonetic: "yn fam" },
      { fr: "les artistes", no: "kunstnerne", phonetic: "læ zartist" },
      { fr: "des cafés", no: "noen kaféer", phonetic: "dæ kafæ" },
    ],
  },
  {
    id: "negation",
    title: "Negasjon — ne...pas",
    subtitle: "Å si nei på fransk",
    description: "For å nekte noe på fransk bruker du ne foran verbet og pas etter. Ne kan forkortes til n' foran vokal.",
    pairs: [
      { fr: "je ne suis pas", no: "jeg er ikke", phonetic: "sjø nə swi pa" },
      { fr: "tu n'es pas", no: "du er ikke", phonetic: "ty næ pa" },
      { fr: "il n'est pas", no: "han er ikke", phonetic: "il næ pa" },
      { fr: "je n'ai pas", no: "jeg har ikke", phonetic: "sjø næ pa" },
      { fr: "ce n'est pas bon", no: "det er ikke bra", phonetic: "sə næ pa bån" },
      { fr: "je ne parle pas français", no: "jeg snakker ikke fransk", phonetic: "sjø nə parl pa frånse" },
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
      { fr: "Comment vous appelez-vous?", no: "Hva heter du?", phonetic: "komå vu zaplæ vu" },
      { fr: "Quel âge avez-vous?", no: "Hvor gammel er du?", phonetic: "kæl åsj avæ vu" },
      { fr: "Qu'est-ce que c'est?", no: "Hva er det?", phonetic: "kæskə sæ" },
      { fr: "Combien ça coûte?", no: "Hvor mye koster det?", phonetic: "kåmbjæn sa kut" },
      { fr: "Parlez-vous français?", no: "Snakker du fransk?", phonetic: "parlæ vu frånse" },
    ],
  },
  {
    id: "passe-compose",
    title: "Passé composé",
    subtitle: "Fortid med avoir",
    description: "Fortidsformen brukes for å si hva du har gjort: avoir + participe passé. Mønster: j'ai + [verb]-é.",
    pairs: [
      { fr: "j'ai mangé", no: "jeg spiste / jeg har spist", phonetic: "sjæ månsjæ" },
      { fr: "tu as parlé", no: "du snakket", phonetic: "ty a parlæ" },
      { fr: "il a vu", no: "han så", phonetic: "il a vy" },
      { fr: "nous avons lu", no: "vi leste", phonetic: "nu zavån ly" },
      { fr: "j'ai été à Paris", no: "jeg var i Paris", phonetic: "sjæ etæ a pari" },
      { fr: "elle a aimé le café", no: "hun likte kaféen", phonetic: "æl a æmæ lə kafæ" },
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
    description: "Possessivene bøyes etter kjønnet på det man eier, ikke eieren. Mon/ma/mes = min/mitt/mine, ton/ta/tes = din, son/sa/ses = hans/hennes.",
    pairs: [
      { fr: "mon père", no: "faren min", phonetic: "mån pær" },
      { fr: "ma mère", no: "moren min", phonetic: "ma mær" },
      { fr: "mes parents", no: "foreldrene mine", phonetic: "mæ parå" },
      { fr: "ton ami", no: "vennen din", phonetic: "tån ami" },
      { fr: "sa femme", no: "kona hans / kona hennes", phonetic: "sa fam" },
      { fr: "notre maison", no: "huset vårt", phonetic: "nOtr mæzån" },
      { fr: "leur voiture", no: "bilen deres", phonetic: "lœr vwatyr" },
    ],
  },
  {
    id: "futur-proche",
    title: "Futur proche — aller + infinitif",
    subtitle: "Nær fremtid",
    description: "Den enkleste måten å si hva du skal gjøre: bruk aller (å gå/dra) konjugert + et infinitiv. Tilsvarer norsk 'skal' eller 'kommer til å'.",
    pairs: [
      { fr: "je vais partir", no: "jeg skal dra", phonetic: "sjø væ partir" },
      { fr: "tu vas manger", no: "du skal spise", phonetic: "ty va månsjæ" },
      { fr: "il va pleuvoir", no: "det skal regne", phonetic: "il va pløvwår" },
      { fr: "nous allons voyager", no: "vi skal reise", phonetic: "nu zalån vwajasj æ" },
      { fr: "qu'est-ce que tu vas faire?", no: "hva skal du gjøre?", phonetic: "kæskə ty va fær" },
      { fr: "elle va se marier", no: "hun skal gifte seg", phonetic: "æl va sə marjæ" },
      { fr: "ils vont arriver", no: "de skal ankomme", phonetic: "il vån arivæ" },
    ],
  },
  {
    id: "accord-adjectif",
    title: "Adjektivbøyning — kjønn og tall",
    subtitle: "Adjektiv må bøyes",
    description: "På fransk bøyes adjektiver etter substantivets kjønn og tall. Hankjønn: grand. Hunkjønn: grande. Flertall: grands / grandes.",
    pairs: [
      { fr: "un grand café", no: "en stor kafé", phonetic: "øn grå kafæ" },
      { fr: "une grande ville", no: "en stor by", phonetic: "yn grågd vil" },
      { fr: "un livre intéressant", no: "en interessant bok", phonetic: "øn livr æntæresså" },
      { fr: "une histoire intéressante", no: "en interessant historie", phonetic: "yn istwar æntæresåt" },
      { fr: "de beaux tableaux", no: "vakre malerier", phonetic: "də bo tablo" },
      { fr: "une belle femme", no: "en vakker kvinne", phonetic: "yn bæl fam" },
      { fr: "les enfants sont contents", no: "barna er fornøyde", phonetic: "læ zånfå sån kåntå" },
    ],
  },
  {
    id: "prepositions-lieux",
    title: "Preposisjoner — land og byer",
    subtitle: "Å si hvor du er og drar",
    description: "Til/i by: à. Til/i hunkjønnsland: en. Til/i hankjønnsland: au. Fra by: de. Fra land: de/du/des. Frankrike er hunkjønn — en France.",
    pairs: [
      { fr: "je vais à Paris", no: "jeg drar til Paris", phonetic: "sjø væ a pari" },
      { fr: "il habite en France", no: "han bor i Frankrike", phonetic: "il abit å frås" },
      { fr: "elle vient du Canada", no: "hun kommer fra Canada", phonetic: "æl vjæn dy kanada" },
      { fr: "nous sommes aux États-Unis", no: "vi er i USA", phonetic: "nu sOm o zætazyni" },
      { fr: "je rentre en Norvège", no: "jeg reiser hjem til Norge", phonetic: "sjø råtr å norvæsj" },
      { fr: "il voyage au Japon", no: "han reiser til Japan", phonetic: "il vwajasj o sjapån" },
      { fr: "elle arrive de Rome", no: "hun kommer fra Roma", phonetic: "æl ariv də rOm" },
    ],
  },
  // --- Fase 3: Mellomtrinn ---
  {
    id: "imperatif",
    title: "Imperativ — beordre og be",
    subtitle: "Å gi beskjeder",
    description: "Imperativ brukes for å gi ordre, råd eller oppfordringer. Drop subjektet — bare bruk verbformen direkte. Tu-form mister -s for -er verb.",
    pairs: [
      { fr: "Viens!", no: "Kom!", phonetic: "vjæn" },
      { fr: "Mangez!", no: "Spis!", phonetic: "månsjæ" },
      { fr: "Parlez plus lentement!", no: "Snakk saktere!", phonetic: "parlæ ply låtmå" },
      { fr: "Ne touchez pas!", no: "Ikke rør!", phonetic: "nə tusjæ pa" },
      { fr: "Écoutez!", no: "Hør etter!", phonetic: "ekutæ" },
      { fr: "Prenez votre temps", no: "Ta deg god tid", phonetic: "prənæ vOtr tå" },
      { fr: "Soyez prudent!", no: "Vær forsiktig!", phonetic: "swajæ prydå" },
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
      { fr: "je me sentais fatigué", no: "jeg følte meg trøtt", phonetic: "sjø mə såtæ fatighæ" },
      { fr: "nous habitions à Paris", no: "vi bodde i Paris", phonetic: "nu zabitjån a pari" },
      { fr: "elle aimait la musique", no: "hun likte musikk", phonetic: "æl æmæ la myzik" },
      { fr: "il y avait beaucoup de monde", no: "det var mange folk", phonetic: "il javæ boku də månd" },
      { fr: "je pensais souvent à toi", no: "jeg tenkte ofte på deg", phonetic: "sjø påsæ suvå a twa" },
    ],
  },
  {
    id: "imparfait-vs-passe",
    title: "Imparfait vs. passé composé",
    subtitle: "Fortid i kontekst",
    description: "Passé composé = avsluttet hendelse ('jeg spiste'). Imparfait = pågående tilstand eller vane ('jeg spiste alltid'). Begge kan brukes i samme setning.",
    pairs: [
      { fr: "hier, j'ai mangé une pizza", no: "i går spiste jeg en pizza", phonetic: "jær sjæ månsjæ yn pitza" },
      { fr: "avant, je mangeais souvent des pizzas", no: "før spiste jeg ofte pizza", phonetic: "avå sjø månsjæ suvå dæ pitza" },
      { fr: "il lisait quand je suis arrivé", no: "han leste da jeg kom", phonetic: "il lizæ kå sjø swi zarivæ" },
      { fr: "elle a appelé pendant que je dormais", no: "hun ringte mens jeg sov", phonetic: "æl a aplæ pådå kə sjø dormæ" },
      { fr: "nous avons visité le musée", no: "vi besøkte museet", phonetic: "nu zavån vizitæ lə myzæ" },
      { fr: "il pleuvait quand nous sommes partis", no: "det regnet da vi dro", phonetic: "il pløvæ kå nu sOm parti" },
      { fr: "j'ai rencontré Pierre il y a deux ans", no: "jeg møtte Pierre for to år siden", phonetic: "sjæ rånkåtræ pjær il ja dø å" },
    ],
  },
  {
    id: "conditionnel",
    title: "Kondisjonalis — ville og skulle",
    subtitle: "Det hypotetiske",
    description: "Kondisjonalis uttrykker ønsker, hypoteser og høflige forespørsler. Dannes av infinitiv + imparfait-endinger: -ais, -ais, -ait, -ions, -iez, -aient.",
    pairs: [
      { fr: "je voudrais un café", no: "jeg vil gjerne ha en kaffe", phonetic: "sjø vudræ øn kafæ" },
      { fr: "ce serait formidable", no: "det ville vært fantastisk", phonetic: "sə sræ formidabl" },
      { fr: "j'aimerais visiter Paris", no: "jeg skulle gjerne besøkt Paris", phonetic: "sjæmræ vizitæ pari" },
      { fr: "tu pourrais m'aider?", no: "kan du hjelpe meg?", phonetic: "ty purræ mædæ" },
      { fr: "il faudrait partir tôt", no: "vi burde dra tidlig", phonetic: "il fodræ partir to" },
      { fr: "si j'avais le temps...", no: "hvis jeg hadde tid...", phonetic: "si sjavæ lə tå" },
      { fr: "vous voudriez autre chose?", no: "ønsker dere noe annet?", phonetic: "vu vudrijæ otr sjoz" },
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
      { fr: "Paris est la ville où je vis", no: "Paris er byen jeg bor i", phonetic: "pari æ la vil u sjø vi" },
      { fr: "c'est une chose dont j'ai besoin", no: "det er noe jeg trenger", phonetic: "sæ yn sjoz dån sjæ bəzwæn" },
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
      { fr: "Paris est plus grand que Lyon", no: "Paris er større enn Lyon", phonetic: "pari æ ply grå kə ljån" },
      { fr: "il parle moins vite que moi", no: "han snakker saktere enn meg", phonetic: "il parl mwæn vit kə mwa" },
      { fr: "c'est le meilleur café", no: "det er den beste kaféen", phonetic: "sæ lə mæjœr kafæ" },
      { fr: "elle est aussi intelligente que lui", no: "hun er like intelligent som ham", phonetic: "æl æ osi æntælisjåt kə lwi" },
      { fr: "c'est la plus belle ville", no: "det er den vakreste byen", phonetic: "sæ la ply bæl vil" },
      { fr: "je suis moins fatigué qu'hier", no: "jeg er mindre trøtt enn i går", phonetic: "sjø swi mwæn fatighæ kjær" },
      { fr: "c'est le plus difficile", no: "det er det vanskeligste", phonetic: "sæ lə ply difisil" },
    ],
  },
  {
    id: "gerondif",
    title: "Gérondif — en + participe présent",
    subtitle: "Samtidige handlinger",
    description: "Gérondif dannes med en + verb-stamme + -ant. Tilsvarer norsk 'mens jeg...' eller 'ved å...'. Brukes mye i literær og muntlig fransk.",
    pairs: [
      { fr: "en marchant", no: "mens jeg går / ved å gå", phonetic: "å marsjå" },
      { fr: "en mangeant", no: "mens jeg spiser", phonetic: "å månsjå" },
      { fr: "en travaillant", no: "ved å arbeide", phonetic: "å travajå" },
      { fr: "en pédalant dans la montagne", no: "mens han sykler i fjellet", phonetic: "å pedalå då la måntanj" },
      { fr: "elle chante en cuisinant", no: "hun synger mens hun lager mat", phonetic: "æl sjåt å kwizinå" },
      { fr: "il a appris le français en regardant des films", no: "han lærte fransk ved å se filmer", phonetic: "il a apri lə frånse å rəgardå dæ film" },
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
      { fr: "je veux que tu sois heureux", no: "jeg vil at du skal være lykkelig", phonetic: "sjø vø kə ty swa ørø" },
      { fr: "il est important que vous parliez", no: "det er viktig at dere snakker", phonetic: "il æ æmpOrtå kə vu parljæ" },
      { fr: "bien qu'il soit tard", no: "selv om det er sent", phonetic: "bjæn kil swa tar" },
      { fr: "je suis content que tu sois là", no: "jeg er glad for at du er her", phonetic: "sjø swi kåntå kə ty swa la" },
      { fr: "avant que tu partes", no: "før du drar", phonetic: "avå kə ty part" },
      { fr: "il faut que nous partions", no: "vi må dra", phonetic: "il fo kə nu partjån" },
    ],
  },
  {
    id: "voix-passive",
    title: "Passiv — être + participe passé",
    subtitle: "Når noe skjer med noe",
    description: "Passiv dannes med être + perfektum partisipp. Partisippen bøyes etter subjektets kjønn og tall. Tilsvarer norsk 'bli' eller 'ble'.",
    pairs: [
      { fr: "le tableau est peint", no: "maleriet er malt", phonetic: "lə tablo æ pæn" },
      { fr: "la maison a été construite", no: "huset ble bygget", phonetic: "la mæzån a etæ kånstrwit" },
      { fr: "le livre est écrit par Houellebecq", no: "boken er skrevet av Houellebecq", phonetic: "lə livr æ ekri par wælbæk" },
      { fr: "la lettre a été envoyée", no: "brevet ble sendt", phonetic: "la lætr a etæ ånvwajæ" },
      { fr: "il est connu dans le monde entier", no: "han er kjent over hele verden", phonetic: "il æ kOny då lə månd åtjæ" },
      { fr: "le film a été tourné à Paris", no: "filmen ble spilt inn i Paris", phonetic: "lə film a etæ turnæ a pari" },
      { fr: "les résultats seront annoncés demain", no: "resultatene vil bli kunngjort i morgen", phonetic: "læ rezylta srån anåsæ dəmæn" },
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

export const MASTERY_LABELS = ["ny", "kjennskap", "bekjent", "lært", "godt lært", "mestret"];
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
export const DAGENS_GLOSE_KEY = "fransk-dagens-glose";
export const SESSION_KEY = "fransk-session-msgs";
export const SESSION_SCREEN_KEY = "fransk-session-screen";
export const ANSWER_COUNT_KEY = "fransk-global-answer-count";

export const gold = "#c8783a";
export const dark = "#f5f0e6";
export const cream = "#1a1210";
export const card = "#ffffff";
export const brd = "rgba(0,0,0,0.09)";
export const grn = "#3a8a50";
export const red = "#c83a3a";
