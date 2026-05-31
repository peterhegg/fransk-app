import { useState, useRef } from "react";
import BottomNav from "../components/BottomNav.jsx";
import { TutorAnimated } from "../components/Tutor/Tutor.jsx";
import { PROXY_URL, APP_TOKEN } from "../constants.js";

// ─── Lesson data ─────────────────────────────────────────────────────────────

const LESSONS = [
  {
    id: "present",
    icon: "⏱",
    color: "#818cf8",
    title: "Présent",
    subtitle: "Nåtid — det som skjer nå",
    tutorIntro: "La oss starte med grunnsteinen i franskgrammatikken. Présent er den første tidsformen du bør beherske — og heldigvis er den ikke så ulik norsk.",
    sections: [
      {
        type: "text",
        heading: "Hva er présent?",
        body: "Présent er nåtid. Du bruker det til å si hva som skjer akkurat nå, hva du gjør regelmessig, eller noe som alltid er sant — akkurat som «spiser» og «bor» på norsk.",
      },
      {
        type: "comparison",
        heading: "Sammenligning med norsk",
        body: "På norsk har vi bare én form: «jeg spiser» — uansett person. I fransk bøyes verbet etter hvem som gjør det.",
        pairs: [
          { fr: "je parle", no: "jeg snakker" },
          { fr: "tu parles", no: "du snakker" },
          { fr: "il/elle parle", no: "han/hun snakker" },
          { fr: "nous parlons", no: "vi snakker" },
          { fr: "vous parlez", no: "dere snakker / De (høflig)" },
          { fr: "ils/elles parlent", no: "de snakker" },
        ],
      },
      {
        type: "tip",
        body: "Uttalen er lurere enn den ser ut! «Parle», «parles» og «parlent» uttales likt (parlø). Bare skrivingen er forskjellig.",
      },
      {
        type: "text",
        heading: "Når bruker du présent?",
        body: "Présent brukes i tre situasjoner:",
        items: [
          "Noe som skjer nå: «Je mange.» (Jeg spiser akkurat nå.)",
          "En vane eller noe man gjør regelmessig: «Je mange du pain chaque matin.» (Jeg spiser brød hver morgen.)",
          "En allmen sannhet: «Paris est la capitale de la France.» (Paris er Frankrikes hovedstad.)",
        ],
      },
      {
        type: "note",
        body: "Présent kan også brukes for nær fremtid, akkurat som norsk: «Je pars demain.» betyr «Jeg drar i morgen» — ikke «Jeg drar nå».",
      },
    ],
  },

  {
    id: "passe-compose",
    icon: "✅",
    color: "#a78bfa",
    title: "Passé composé",
    subtitle: "Fortid — avsluttede hendelser",
    tutorIntro: "Passé composé er fortidsformen du vil bruke mest i samtale. Den tilsvarer både «jeg spiste» og «jeg har spist» på norsk — og det er nettopp der norsktalende kan bli forvirret.",
    sections: [
      {
        type: "text",
        heading: "Hva er passé composé?",
        body: "Passé composé brukes for fullstendige, avsluttede handlinger i fortiden. Det tilsvarer det norske «jeg har spist» og ofte også enkelt «jeg spiste».",
      },
      {
        type: "text",
        heading: "Slik er det bygd opp",
        body: "Passé composé = hjelpeverb (avoir eller être) + participe passé (fortidsform av verbet).",
        items: [
          "J'ai mangé = Jeg har spist / Jeg spiste (avoir + mangé)",
          "Elle est arrivée = Hun ankom / Hun har ankommet (être + arrivée)",
          "Nous avons travaillé = Vi jobbet / Vi har jobbet (avoir + travaillé)",
        ],
      },
      {
        type: "comparison",
        heading: "Norsk vs. fransk — to fortider i én",
        body: "Norsk skiller mellom «spiste» (enkel fortid) og «har spist» (perfektum). Fransk bruker passé composé for begge i hverdagsspråk.",
        pairs: [
          { fr: "J'ai mangé une pizza.", no: "Jeg spiste en pizza. / Jeg har spist en pizza." },
          { fr: "Il est parti hier.", no: "Han dro i går. / Han har dratt i går." },
          { fr: "Nous avons vu ce film.", no: "Vi så den filmen. / Vi har sett den filmen." },
        ],
      },
      {
        type: "warning",
        heading: "Être eller avoir?",
        body: "De fleste verb bruker avoir. Men bevegelsesverb og refleksive verb bruker être. Husketips for être-verb: tenk på liv og bevegelse (fødes, dø, gå, komme, reise, ankomme, returnere osv.).",
        items: [
          "Je suis né(e) = Jeg ble født",
          "Elle est morte = Hun døde",
          "Nous sommes allés = Vi dro",
          "Il est venu = Han kom",
        ],
      },
    ],
  },

  {
    id: "imparfait",
    icon: "🌫",
    color: "#f59e0b",
    title: "Imparfait",
    subtitle: "Fortid — bakgrunn og vaner",
    tutorIntro: "Her er den store utfordringen for norsktalende: vi skiller ikke mellom «holdt på å spise» og «spiste» på samme måte. I fransk er dette to helt ulike tidsformer.",
    sections: [
      {
        type: "text",
        heading: "Hva er imparfait?",
        body: "Imparfait er fortid for tilstander, vaner og handlinger som var i gang — ikke avsluttet. Du tenker på det som «bakgrunn» i historien, mens passé composé er «forgrunn» (det som skjer og avbryter).",
      },
      {
        type: "comparison",
        heading: "Sammenligning med norsk",
        body: "Norsk: Vi sier «spiste» for alt. Fransk skiller tydelig:",
        pairs: [
          { fr: "J'ai mangé une pizza. (p.c.)", no: "Jeg spiste en pizza. (én gang, ferdig)" },
          { fr: "Je mangeais une pizza. (imp.)", no: "Jeg holdt på å spise en pizza. (i gang)" },
          { fr: "Je mangeais du pain chaque matin. (imp.)", no: "Jeg spiste brød hver morgen. (vane)" },
        ],
      },
      {
        type: "text",
        heading: "Når bruker du imparfait?",
        items: [
          "Vaner i fortiden: «Quand j'étais enfant, je jouais dehors.» (Da jeg var barn, lekte jeg ute.)",
          "Tilstander og beskrivelser: «Il pleuvait et le ciel était gris.» (Det regnet og himmelen var grå.)",
          "Bakgrunn for en annen handling: «Je mangeais quand il est arrivé.» (Jeg holdt på å spise da han ankom.)",
        ],
      },
      {
        type: "tip",
        body: "Et godt bilde: Tenk på imparfait som filmens bakgrunn (stedslys, atmosfære, vaner) og passé composé som plottet (handlingene som faktisk skjer og driver historien fremover).",
      },
    ],
  },

  {
    id: "futur",
    icon: "🔮",
    color: "#34d399",
    title: "Futur — to måter å si fremtid",
    subtitle: "Futur proche og futur simple",
    tutorIntro: "Å snakke om fremtiden i fransk er faktisk enklere enn du tror. Det finnes to varianter — én for planer og én for spådommer.",
    sections: [
      {
        type: "text",
        heading: "Futur proche — nær fremtid",
        body: "Futur proche brukes for planer og nær fremtid. Du lager det med verbet «aller» i présent + infinitiv av verbet du vil bruke. Det tilsvarer norsk «skal» eller «er i ferd med å».",
        items: [
          "Je vais manger. = Jeg skal spise.",
          "Elle va partir demain. = Hun skal dra i morgen.",
          "Nous allons voir ce film. = Vi skal se den filmen.",
        ],
      },
      {
        type: "comparison",
        heading: "Sammenligning med norsk",
        body: "Aller + infinitiv i présent er nesten identisk med norsk «skal» — det er like intuitivt.",
        pairs: [
          { fr: "Je vais apprendre le français.", no: "Jeg skal lære meg fransk." },
          { fr: "Tu vas réussir!", no: "Du skal klare det!" },
          { fr: "Il va pleuvoir.", no: "Det skal begynne å regne." },
        ],
      },
      {
        type: "text",
        heading: "Futur simple — enkel fremtid",
        body: "Futur simple brukes for mer formelle spådommer, løfter og noe som vil skje langt frem i tid. Det er mer formelt og litterært. Du legger til endinger direkte på infinitiv.",
        items: [
          "Je parlerai = Jeg vil snakke",
          "Tu seras = Du vil være",
          "Elle viendra = Hun vil komme",
        ],
      },
      {
        type: "tip",
        body: "Tommelregelen: Start med futur proche — det er mest naturlig i hverdagssamtale. Futur simple lærer du bedre når du leser tekster.",
      },
    ],
  },

  {
    id: "conditionnel",
    icon: "💭",
    color: "#f472b6",
    title: "Conditionnel",
    subtitle: "Betinget form — det som ville skje",
    tutorIntro: "Conditionnel er faktisk ganske likt norsk «ville». Du bruker det for å være høflig, snakke hypotetisk, eller si hva du ville gjort om noe var annerledes.",
    sections: [
      {
        type: "text",
        heading: "Hva er conditionnel?",
        body: "Conditionnel tilsvarer norsk «ville»: «Jeg ville gjerne ha...», «Hva ville du gjort?», «Jeg skulle ønske...». Det er også den formen du bruker for å være høflig.",
      },
      {
        type: "comparison",
        heading: "Sammenligning med norsk",
        body: "Norsk «ville» og conditionnel er svært like i funksjon.",
        pairs: [
          { fr: "Je voudrais un café, s'il vous plaît.", no: "Jeg ville gjerne ha en kaffe, takk." },
          { fr: "Tu devrais étudier.", no: "Du burde studere." },
          { fr: "Si j'avais le temps, je voyagerais.", no: "Hvis jeg hadde tid, ville jeg reist." },
          { fr: "Ce serait bien.", no: "Det ville vært fint." },
        ],
      },
      {
        type: "text",
        heading: "Når bruker du conditionnel?",
        items: [
          "Høflighet: «Je voudrais...» er mye mer høflig enn «Je veux...» (Jeg vil).",
          "Hypotetiske situasjoner: «Si j'étais riche...» (Hvis jeg var rik...)",
          "Indirekte tale: «Elle a dit qu'elle viendrait.» (Hun sa at hun ville komme.)",
          "Ønske eller drøm: «J'aimerais visiter Paris.» (Jeg ville gjerne besøke Paris.)",
        ],
      },
      {
        type: "tip",
        body: "Lær deg «voudrais» (ville gjerne ha) og «aimerais» (ville gjerne) — de er dine mest nyttige høflighetsformer fra dag én.",
      },
    ],
  },

  {
    id: "imperatif",
    icon: "📢",
    color: "#f87171",
    title: "Impératif",
    subtitle: "Bydeform — gi ordre og råd",
    tutorIntro: "Impératif er enklere enn det høres ut — det er bare å gi ordre eller råd, som «Spis!», «Kom!» eller «Ikke glem!» på norsk.",
    sections: [
      {
        type: "text",
        heading: "Hva er impératif?",
        body: "Impératif brukes når du gir en ordre, et råd eller en oppfordring. Det er som norsk bydeform: «Spis», «Gå», «Hjelp meg». I fransk bruker du bare tre personer: tu (du), nous (vi) og vous (dere/De).",
      },
      {
        type: "comparison",
        heading: "Sammenligning med norsk",
        body: "Bydeform fungerer likt i begge språk — du dropper personpronomen og sier bare verbet.",
        pairs: [
          { fr: "Mange !", no: "Spis!" },
          { fr: "Parle plus doucement.", no: "Snakk roligere." },
          { fr: "Ne parle pas !", no: "Ikke snakk!" },
          { fr: "Allons-y !", no: "La oss dra!" },
          { fr: "Asseyez-vous, s'il vous plaît.", no: "Sett dere / Vær så snill og sett dere." },
        ],
      },
      {
        type: "note",
        body: "Et triks: For -er-verb mister «tu»-formen sitt «s» i impératif. Ikke «tu parles», men «Parle !». Unntaket: «Parles-en!» (Snakk om det!) — da kommer -s tilbake foran en pronomen.",
      },
      {
        type: "tip",
        body: "Impératif er praktisk for instruksjoner, oppskrifter, kart-retninger og høflige oppfordringer. Du møter det overalt i hverdagen.",
      },
    ],
  },

  {
    id: "participe-passe",
    icon: "🧩",
    color: "#94a3b8",
    title: "Participe passé",
    subtitle: "Fortidspartisipp — byggestein i fortiden",
    tutorIntro: "Participe passé er ikke en tidsform i seg selv — det er en byggestein som brukes i alle de sammensatte tidene. Tenk på det som det norske «spist», «sett» og «gjort».",
    sections: [
      {
        type: "text",
        heading: "Hva er participe passé?",
        body: "Participe passé tilsvarer norsk fortidspartisipp: «spist», «sett», «vært», «gjort». I norsk bruker vi det med «har» (perfektum). I fransk gjør vi det samme — men det kan endre form etter kjønn og tall.",
      },
      {
        type: "comparison",
        heading: "Sammenligning med norsk",
        body: "Norsk: «Jeg har spist» → «spist» er partisippet. Fransk: «J'ai mangé» → «mangé» er partisippet.",
        pairs: [
          { fr: "mangé (manger)", no: "spist (å spise)" },
          { fr: "vu (voir)", no: "sett (å se)" },
          { fr: "fait (faire)", no: "gjort (å gjøre)" },
          { fr: "été (être)", no: "vært (å være)" },
          { fr: "eu (avoir)", no: "hatt (å ha)" },
        ],
      },
      {
        type: "text",
        heading: "Samsvarsbøying",
        body: "Når être brukes som hjelpeverb, bøyes partisippet etter kjønn og tall — som et adjektiv.",
        items: [
          "Il est arrivé. (han, én) = Han ankom.",
          "Elle est arrivée. (hun, én) = Hun ankom. (+ e)",
          "Ils sont arrivés. (de, menn) = De ankom. (+ s)",
          "Elles sont arrivées. (de, kvinner) = De ankom. (+ es)",
        ],
      },
      {
        type: "tip",
        body: "Med avoir bøyes partisippet vanligvis ikke — «j'ai mangé» for alle. Unntaket er avansert (direkte objekt foran verbet), som du lærer gradvis.",
      },
    ],
  },

  {
    id: "genre",
    icon: "⚖️",
    color: "#e6d3a8",
    title: "Kjønn — genre",
    subtitle: "Maskulin og feminin",
    tutorIntro: "Kjønn er kanskje det første du reagerer på i fransk: hvert eneste substantiv er enten maskulin (le) eller feminin (la). Det finnes ingen nøytrum. Og nei — det er ikke alltid logisk!",
    sections: [
      {
        type: "text",
        heading: "Hva betyr grammatisk kjønn?",
        body: "I norsk har vi grammatisk kjønn (hankjønn, hunkjønn og intetkjønn), men vi er ganske løselige med det i bokmål og bruker ofte bare «en» og «et». I fransk er kjønn strengt — du MÅ lære det for hvert ord, og det påvirker artikkelen, adjektivet og partisippet.",
      },
      {
        type: "comparison",
        heading: "Maskulin vs. feminin",
        pairs: [
          { fr: "le livre (mask.)", no: "boken" },
          { fr: "la maison (fem.)", no: "huset" },
          { fr: "le soleil (mask.)", no: "solen" },
          { fr: "la lune (fem.)", no: "månen" },
          { fr: "le problème (mask.)", no: "problemet" },
          { fr: "la solution (fem.)", no: "løsningen" },
        ],
      },
      {
        type: "text",
        heading: "Noen mønstre å lære",
        items: [
          "Ord som slutter på -tion, -sion, -ure er nesten alltid femininum: la nation, la question, la nature",
          "Ord som slutter på -ment, -eur (ting) er nesten alltid maskulin: le mouvement, le moteur",
          "Ord som slutter på -eur (person) kan være begge: le professeur (lærer, hankjønn) — men la professeure finnes!",
          "Mange ord er uforutsigbare — lær kjønnet sammen med ordet, alltid.",
        ],
      },
      {
        type: "tip",
        body: "Lær alltid substantiv med artikkelen: ikke bare «maison», men «la maison». Da setter kjønnet seg automatisk.",
      },
    ],
  },

  {
    id: "artikler",
    icon: "🔤",
    color: "#fcd34d",
    title: "Artikler",
    subtitle: "le, la, un, une, du, de la",
    tutorIntro: "Artikler er de lille ordene foran substantiv. Fransk har tre typer — og én av dem finnes knapt i norsk. La oss gå gjennom dem én etter én.",
    sections: [
      {
        type: "text",
        heading: "Bestemt artikkel (som «-en/-et» på norsk)",
        body: "Bestemt artikkel sier «den/det bestemte».",
        items: [
          "le → maskulin: le chat (katten)",
          "la → feminin: la maison (huset)",
          "l' → foran vokal eller stum h: l'ami (vennen), l'homme (mannen)",
          "les → flertall: les enfants (barna)",
        ],
      },
      {
        type: "text",
        heading: "Ubestemt artikkel (som «en/et» på norsk)",
        body: "Ubestemt artikkel introduserer noe nytt eller uspesifisert.",
        items: [
          "un → maskulin: un livre (en bok)",
          "une → feminin: une maison (et hus)",
          "des → flertall: des enfants (noen barn)",
        ],
      },
      {
        type: "text",
        heading: "Partitiv artikkel — finnes ikke på norsk!",
        body: "Den partitive artikkelen brukes for «noe av» noe som ikke er tellelig. Norsk bruker ingen artikkel her.",
        items: [
          "du pain = (noe) brød → «Je mange du pain.» (Jeg spiser brød.)",
          "de l'eau = (noe) vann → «Tu bois de l'eau.» (Du drikker vann.)",
          "de la musique = (noe) musikk → «Elle écoute de la musique.» (Hun hører på musikk.)",
        ],
      },
      {
        type: "note",
        body: "Etter nekting (ne...pas) forsvinner artikkelen og erstattes med «de»: «Je mange du pain» → «Je ne mange pas de pain.» (Jeg spiser ikke brød.)",
      },
    ],
  },

  {
    id: "adjektiver",
    icon: "🎨",
    color: "#7dd3fc",
    title: "Adjektivbøying",
    subtitle: "Adjektiver tilpasser seg substantivet",
    tutorIntro: "I norsk sier vi «en grønn bil» og «et grønt hus» — adjektivet endrer seg litt etter kjønn. I fransk er dette systemet enda mer gjennomført, og adjektivet bøyes etter kjønn OG tall.",
    sections: [
      {
        type: "text",
        heading: "Samsvarsbøying",
        body: "Et adjektiv i fransk bøyes etter kjønnet og antallet til substantivet det beskriver. Grunnformen er maskulin singularis.",
        items: [
          "grand (mask. sg.) = stor",
          "grande (fem. sg.) = stor",
          "grands (mask. pl.) = store",
          "grandes (fem. pl.) = store",
        ],
      },
      {
        type: "comparison",
        heading: "Sammenligning med norsk",
        body: "Norsk har noe av det samme, men enklere — bare to former (intetkjønn + resten).",
        pairs: [
          { fr: "un grand garçon", no: "en stor gutt" },
          { fr: "une grande fille", no: "ei stor jente" },
          { fr: "de grands garçons", no: "store gutter" },
          { fr: "de grandes filles", no: "store jenter" },
        ],
      },
      {
        type: "text",
        heading: "Adjektivets plass",
        body: "De fleste adjektiver kommer ETTER substantivet i fransk — motsatt norsk!",
        items: [
          "une voiture rouge (en rød bil) — rouge kommer etter",
          "un film intéressant (en interessant film) — intéressant etter",
          "Unntak: noen korte, vanlige adjektiv kommer FØR: grand, petit, beau, bon, mauvais, jeune, vieux → un grand homme, une belle maison",
        ],
      },
      {
        type: "tip",
        body: "Lydlig tip: Feminumsendingen -e gjør at den foregående konsonanten uttales. «grand» (grå) vs. «grande» (grand) — den siste d-en hørres.",
      },
    ],
  },

  {
    id: "etre-avoir",
    icon: "🏛",
    color: "#fb923c",
    title: "Être og avoir",
    subtitle: "Å være og å ha — de to viktigste verbene",
    tutorIntro: "Être (å være) og avoir (å ha) er de to absolutt viktigste verbene i franskgrammatikken. De brukes ikke bare alene, men som hjelpeverb i alle sammensatte tider. Uregelmessige og umulige å unngå.",
    sections: [
      {
        type: "comparison",
        heading: "Être — å være",
        body: "Être i présent:",
        pairs: [
          { fr: "je suis", no: "jeg er" },
          { fr: "tu es", no: "du er" },
          { fr: "il/elle est", no: "han/hun er" },
          { fr: "nous sommes", no: "vi er" },
          { fr: "vous êtes", no: "dere er / De er" },
          { fr: "ils/elles sont", no: "de er" },
        ],
      },
      {
        type: "comparison",
        heading: "Avoir — å ha",
        body: "Avoir i présent:",
        pairs: [
          { fr: "j'ai", no: "jeg har" },
          { fr: "tu as", no: "du har" },
          { fr: "il/elle a", no: "han/hun har" },
          { fr: "nous avons", no: "vi har" },
          { fr: "vous avez", no: "dere har / De har" },
          { fr: "ils/elles ont", no: "de har" },
        ],
      },
      {
        type: "text",
        heading: "Som hjelpeverb i passé composé",
        body: "Être og avoir brukes som hjelpeverb for å danne sammensatte tider:",
        items: [
          "avoir + p.p. → de fleste verb: j'ai mangé (jeg spiste)",
          "être + p.p. → bevegelse og refleksive: je suis allé(e) (jeg dro)",
        ],
      },
      {
        type: "warning",
        heading: "Tre triks med avoir",
        body: "Avoir brukes i noen uttrykk der norsk bruker «å være»:",
        items: [
          "J'ai faim. = Jeg er sulten. (ha sult)",
          "J'ai soif. = Jeg er tørst. (ha tørst)",
          "J'ai chaud/froid. = Jeg er varm/kald. (ha varmt/kaldt)",
          "J'ai peur. = Jeg er redd. (ha frykt)",
          "Tu as raison. = Du har rett.",
        ],
      },
    ],
  },

  {
    id: "reflexive",
    icon: "🔄",
    color: "#2dd4bf",
    title: "Refleksive verb",
    subtitle: "Verb med «seg» — se lever, s'appeler",
    tutorIntro: "Refleksive verb er verb der handlingen retter seg tilbake mot den som gjør den — «å kle seg», «å hete», «å huske». Fransk bruker dem mye mer enn norsk.",
    sections: [
      {
        type: "text",
        heading: "Hva er et refleksivt verb?",
        body: "Et refleksivt verb har et pronomen (me, te, se, nous, vous, se) foran verbet som viser at handlingen er rettet mot seg selv. På norsk sier vi «vasker seg», «kaller seg», «føler seg».",
      },
      {
        type: "comparison",
        heading: "S'appeler — å hete",
        body: "Et av de første du lærte:",
        pairs: [
          { fr: "Je m'appelle Pierre.", no: "Jeg heter Pierre. (kaller meg)" },
          { fr: "Tu t'appelles comment ?", no: "Hva heter du?" },
          { fr: "Il s'appelle Henri.", no: "Han heter Henri." },
        ],
      },
      {
        type: "comparison",
        heading: "Se lever — å stå opp",
        body: "Merk at pronomen endrer seg etter person:",
        pairs: [
          { fr: "Je me lève.", no: "Jeg står opp." },
          { fr: "Tu te lèves.", no: "Du står opp." },
          { fr: "Il se lève.", no: "Han står opp." },
          { fr: "Nous nous levons.", no: "Vi står opp." },
          { fr: "Vous vous levez.", no: "Dere står opp." },
          { fr: "Ils se lèvent.", no: "De står opp." },
        ],
      },
      {
        type: "tip",
        body: "Refleksive verb bruker alltid être i passé composé: «Je me suis levé(e).» (Jeg stod opp.)",
      },
      {
        type: "note",
        body: "Mange refleksive verb i fransk har ingen direkte parallell i norsk. «Se souvenir» (å huske), «s'en aller» (å gå sin vei), «se tromper» (å ta feil). Bare lær dem som hele uttrykk.",
      },
    ],
  },
];

// ─── Lesson card ─────────────────────────────────────────────────────────────

function LessonCard({ lesson, onOpen }) {
  return (
    <button onClick={() => onOpen(lesson)}
      style={{ display: "flex", alignItems: "center", gap: 14, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px", cursor: "pointer", fontFamily: "var(--font-body)", textAlign: "left", width: "100%", transition: "background 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(230,211,168,0.06)"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "var(--surface)"; }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: lesson.color + "22", border: `1px solid ${lesson.color}44`, display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0 }}>
        {lesson.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-display)", fontStyle: "italic" }}>{lesson.title}</div>
        <div style={{ fontSize: 12, color: "var(--text-subtle)", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lesson.subtitle}</div>
      </div>
      <div style={{ color: "var(--cream-deep)", fontSize: 16, flexShrink: 0 }}>›</div>
    </button>
  );
}

// ─── Section renderers ────────────────────────────────────────────────────────

function SectionBlock({ section, accentColor }) {
  const blockStyle = { borderRadius: 12, padding: "12px 14px", marginBottom: 14 };

  if (section.type === "text") return (
    <div>
      {section.heading && <div style={{ fontSize: 12, color: accentColor, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6, fontWeight: 600 }}>{section.heading}</div>}
      {section.body && <p style={{ margin: "0 0 8px", fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>{section.body}</p>}
      {section.items && (
        <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
          {section.items.map((item, i) => <li key={i} style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6 }}>{item}</li>)}
        </ul>
      )}
    </div>
  );

  if (section.type === "comparison") return (
    <div>
      {section.heading && <div style={{ fontSize: 12, color: accentColor, textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6, fontWeight: 600 }}>{section.heading}</div>}
      {section.body && <p style={{ margin: "0 0 8px", fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>{section.body}</p>}
      {section.pairs && (
        <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
          {section.pairs.map((pair, i) => (
            <div key={i} style={{ display: "flex", borderBottom: i < section.pairs.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div style={{ flex: 1, padding: "9px 12px", fontSize: 14, fontStyle: "italic", fontFamily: "var(--font-display)", color: accentColor, borderRight: "1px solid var(--border)", background: "rgba(0,0,0,0.12)" }}>{pair.fr}</div>
              <div style={{ flex: 1, padding: "9px 12px", fontSize: 13, color: "var(--text-subtle)" }}>{pair.no}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (section.type === "tip") return (
    <div style={{ ...blockStyle, background: "rgba(230,211,168,0.06)", border: "1px solid rgba(230,211,168,0.2)" }}>
      <div style={{ fontSize: 11, color: "var(--cream)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5, fontWeight: 600 }}>💡 Tips</div>
      <p style={{ margin: 0, fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>{section.body}</p>
    </div>
  );

  if (section.type === "warning") return (
    <div style={{ ...blockStyle, background: "rgba(225,112,85,0.06)", border: "1px solid rgba(225,112,85,0.2)" }}>
      <div style={{ fontSize: 11, color: "var(--color-error)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5, fontWeight: 600 }}>⚠️ {section.heading || "Merk"}</div>
      {section.body && <p style={{ margin: "0 0 8px", fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>{section.body}</p>}
      {section.items && (
        <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 5 }}>
          {section.items.map((item, i) => <li key={i} style={{ fontSize: 14, color: "var(--text)", lineHeight: 1.6 }}>{item}</li>)}
        </ul>
      )}
    </div>
  );

  if (section.type === "note") return (
    <div style={{ ...blockStyle, background: "rgba(100,150,200,0.07)", border: "1px solid rgba(100,150,200,0.2)" }}>
      <div style={{ fontSize: 11, color: "#7dd3fc", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5, fontWeight: 600 }}>📌 Merk</div>
      <p style={{ margin: 0, fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>{section.body}</p>
    </div>
  );

  return null;
}

// ─── Inline Ask ───────────────────────────────────────────────────────────────

function InlineAsk({ lesson, tutorName, isOnline }) {
  const [question, setQuestion] = useState("");
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const ask = async () => {
    const q = question.trim();
    if (!q || loading) return;
    setQuestion("");
    setExchanges(prev => [...prev, { q, a: null }]);
    setLoading(true);
    try {
      const res = await fetch(PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-App-Token": APP_TOKEN },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 600,
          system: `Du er ${tutorName}, en vennlig og tålmodig fransktutor. Eleven leser om «${lesson.title}» (${lesson.subtitle}) i læringsappen sin. Svar på norsk, kort og pedagogisk, maks 4-5 setninger. Sammenlign gjerne med norsk der det er naturlig. Ikke bruk fagterminologi uten å forklare den. Eleven har dysleksi og er A1/A2-nivå.`,
          messages: exchanges
            .filter(e => e.a)
            .flatMap(e => [
              { role: "user", content: e.q },
              { role: "assistant", content: e.a },
            ])
            .concat([{ role: "user", content: q }]),
        }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "Beklager, noe gikk galt.";
      setExchanges(prev => prev.map((e, i) => i === prev.length - 1 ? { ...e, a: text } : e));
    } catch {
      setExchanges(prev => prev.map((e, i) => i === prev.length - 1 ? { ...e, a: "Fikk ikke kontakt med serveren. Sjekk internettforbindelsen." } : e));
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 20, marginTop: 8 }}>
      <div style={{ fontSize: 12, color: "var(--cream-deep)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
        Spør {tutorName}
      </div>

      {exchanges.map((ex, i) => (
        <div key={i} style={{ marginBottom: 14 }}>
          <div style={{ background: "rgba(230,211,168,0.08)", borderRadius: "10px 10px 4px 10px", padding: "10px 12px", fontSize: 14, color: "var(--cream-deep)", lineHeight: 1.6, marginBottom: 8 }}>
            {ex.q}
          </div>
          {ex.a ? (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px 10px 10px 10px", padding: "10px 12px", fontSize: 14, color: "var(--text)", lineHeight: 1.7 }}>
              {ex.a}
            </div>
          ) : (
            <div style={{ padding: "10px 12px", fontSize: 13, color: "var(--text-subtle)", fontStyle: "italic" }}>
              {tutorName} skriver...
            </div>
          )}
        </div>
      ))}

      {!isOnline ? (
        <div style={{ fontSize: 13, color: "var(--text-subtle)", padding: "10px 0", fontStyle: "italic" }}>
          Ingen internettforbindelse — kan ikke spørre {tutorName} nå.
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <input
            ref={inputRef}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(); } }}
            placeholder={`Spør om ${lesson.title}…`}
            disabled={loading}
            style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12, padding: "11px 14px", fontSize: 14, color: "var(--text)", fontFamily: "var(--font-body)", outline: "none", opacity: loading ? 0.6 : 1 }}
          />
          <button onClick={ask} disabled={!question.trim() || loading}
            style={{ background: question.trim() && !loading ? "var(--cream)" : "rgba(230,211,168,0.12)", border: "none", borderRadius: 12, color: question.trim() && !loading ? "var(--bg)" : "var(--text-subtle)", padding: "11px 16px", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 14, cursor: question.trim() && !loading ? "pointer" : "default", flexShrink: 0 }}>
            Send
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Lesson detail view ───────────────────────────────────────────────────────

function LessonView({ lesson, tutorPrefs, onBack, isOnline, screen, showWords, onNav }) {
  const tutorName = tutorPrefs?.tutorName || "Pierre";
  const persona = tutorPrefs?.tutorPersona || "henri";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 66 }}>
      <div style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--cream-deep)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)", flexShrink: 0 }}>← Tilbake</button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <span style={{ fontSize: 16 }}>{lesson.icon}</span>
          <span style={{ fontSize: 15, fontFamily: "var(--font-display)", fontStyle: "italic", marginLeft: 6, color: lesson.color }}>{lesson.title}</span>
        </div>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 32px" }}>
        {/* Tutor intro */}
        <div style={{ display: "flex", gap: 12, marginBottom: 22 }}>
          <div style={{ flexShrink: 0, marginTop: 2 }}>
            <TutorAnimated persona={persona} emotion="reading" accessory={persona === "henri" ? "book" : "book"} crop="face" size={48} title={tutorName} />
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px 14px 14px 14px", padding: "12px 14px", flex: 1 }}>
            <div style={{ fontSize: 11, color: "var(--cream-deep)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{tutorName}</div>
            <p style={{ margin: 0, fontSize: 14, color: "var(--text)", lineHeight: 1.7, fontStyle: "italic" }}>{lesson.tutorIntro}</p>
          </div>
        </div>

        {/* Lesson heading */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: lesson.color, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>{lesson.subtitle}</div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 26, color: "var(--text)", fontWeight: 500 }}>{lesson.title}</h1>
        </div>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {lesson.sections.map((section, i) => (
            <SectionBlock key={i} section={section} accentColor={lesson.color} />
          ))}
        </div>

        {/* Ask tutor */}
        <div style={{ marginTop: 28 }}>
          <InlineAsk lesson={lesson} tutorName={tutorName} isOnline={isOnline} />
        </div>
      </div>

      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function GrammatikkTeoriScreen({ onBack, tutorPrefs, isOnline, screen, showWords, onNav }) {
  const [openLesson, setOpenLesson] = useState(null);
  const tutorName = tutorPrefs?.tutorName || "Pierre";
  const persona = tutorPrefs?.tutorPersona || "henri";

  if (openLesson) {
    return (
      <LessonView
        lesson={openLesson}
        tutorPrefs={tutorPrefs}
        isOnline={isOnline}
        onBack={() => setOpenLesson(null)}
        screen={screen}
        showWords={showWords}
        onNav={onNav}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--app-bg)", fontFamily: "var(--font-body)", color: "var(--text)", paddingBottom: 66 }}>
      <div style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 10px" }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--cream-deep)", fontSize: 14, cursor: "pointer", fontFamily: "var(--font-body)" }}>← Tilbake</button>
          <div style={{ fontSize: 15, fontWeight: 500 }}>Grammatikkteori</div>
          <div style={{ width: 70 }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Tutor welcome */}
        <div style={{ padding: "20px 16px 8px" }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <div style={{ flexShrink: 0 }}>
              <TutorAnimated persona={persona} emotion="waving" accessory={persona === "henri" ? "book" : "book"} crop="face" size={52} title={tutorName} />
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "4px 14px 14px 14px", padding: "12px 14px", flex: 1 }}>
              <div style={{ fontSize: 11, color: "var(--cream-deep)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{tutorName}</div>
              <p style={{ margin: 0, fontSize: 14, color: "var(--text)", lineHeight: 1.7, fontStyle: "italic" }}>
                Bonjour! Her er en oversikt over grammatikken i franskspråket — fra de mest grunnleggende konseptene til mer avanserte former. Klikk på et tema for å lese og stille spørsmål.
              </p>
            </div>
          </div>

          <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10 }}>
            {LESSONS.length} temaer
          </div>
        </div>

        {/* Lesson list */}
        <div style={{ padding: "0 16px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
          {LESSONS.map(lesson => (
            <LessonCard key={lesson.id} lesson={lesson} onOpen={setOpenLesson} />
          ))}
        </div>
      </div>

      <BottomNav screen={screen} showWords={showWords} onNav={onNav} />
    </div>
  );
}
