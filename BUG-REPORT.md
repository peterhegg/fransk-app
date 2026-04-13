# Bug Report — fransk-app
**Dato:** 2026-04-13  
**Analyse av:** Claude Sonnet 4.6  
**Status for kjente bugs:** BUG-01 til BUG-06 bekreftet fikset. BUG-07 er identifisert og dokumentert nedenfor.

---

## Cloudflare Worker

---

### [WORKER] Manglende try/catch rundt Anthropic API-kallet

**Fil:** `cloudflare-worker.js` (linje 105–113)  
**Alvorlighetsgrad:** Høy  
**Beskrivelse:** `fetch(...)` til Anthropic API er ikke pakket inn i try/catch. Hvis nettverksforbindelsen feiler (timeout, DNS-feil, o.l.), kaster funksjonen et ukjent unntak. Workeren returnerer da en generisk 500-respons *uten* CORS-headere. Nettleseren tolker dette som en CORS-feil, og frontend-appen viser en ikke-forklarende feilmelding.

**Forslag til fix:**
```js
let response;
try {
  response = await fetch("https://api.anthropic.com/v1/messages", { ... });
} catch {
  return new Response(JSON.stringify({ error: "Service unavailable" }), {
    status: 502,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

---

### [WORKER] Manglende try/catch rundt `response.json()` for Anthropic-svar

**Fil:** `cloudflare-worker.js` (linje 122)  
**Alvorlighetsgrad:** Medium  
**Beskrivelse:** `const data = await response.json()` har ingen feilhåndtering. Hvis Anthropic returnerer en ikke-JSON-body (kan skje ved visse nettverksfeil eller feilkonfigurering), kaster dette et ukjent unntak — igjen uten CORS-headere i feilen.

**Forslag til fix:**
```js
let data;
try {
  data = await response.json();
} catch {
  return new Response(JSON.stringify({ error: "Invalid upstream response" }), {
    status: 502,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

---

### [WORKER] Race condition i rate limiting

**Fil:** `cloudflare-worker.js` (linje 30–36)  
**Alvorlighetsgrad:** Medium  
**Beskrivelse:** `checkRateLimit` gjør en les-og-skriv-operasjon på KV uten atomaritet. To samtidige forespørsler fra samme IP kan begge lese `count=0`, begge skrive `count=1` og dermed fordoble tillatt rate. Cloudflare KV har ingen compare-and-swap, men en enkel workaround er å bruke Durable Objects for teller, eller akseptere at rate limit er «best effort» og dokumentere dette.

**Forslag til fix:** Akseptere som best-effort (lav risiko) eller bruke Durable Object counter for korrekt atomaritet.

---

### [WORKER] Race condition i dagsbudsjett

**Fil:** `cloudflare-worker.js` (linje 18–28)  
**Alvorlighetsgrad:** Medium  
**Beskrivelse:** `checkBudget` og `recordCost` er separate KV-operasjoner. Dersom to forespørsler ankommer nesten samtidig og begge passerer budsjettsjekken, kan total kostnad overskride `DAILY_BUDGET_USD`. Risikoen er lav (maks noen cent), men budsjett er ikke garantert.

**Forslag til fix:** Akseptere som best-effort gitt budsjettstørrelsen, men dokumenter dette.

---

### [WORKER] Manglende `preview_id` i wrangler.toml

**Fil:** `wrangler.toml` (linje 5–7)  
**Alvorlighetsgrad:** Lav  
**Beskrivelse:** KV-namespacet har ingen `preview_id`. `wrangler dev` (lokal utvikling) vil feile på alle KV-operasjoner fordi det ikke finnes et lokalt preview-namespace å binde mot.

**Forslag til fix:**
```toml
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "6d43f11b2d6e4dab99fe9e6a9f97e7c5"
preview_id = "<id fra wrangler kv:namespace create RATE_LIMIT_KV --preview>"
```

---

## PWA og Workbox

---

### [PWA] `skipWaiting + clientsClaim` kan avbryte pågående øvelser

**Fil:** `vite.config.js` (linje 12–14)  
**Alvorlighetsgrad:** Medium  
**Beskrivelse:** Kombinasjonen `skipWaiting: true` og `clientsClaim: true` gjør at en ny service worker aktiverer seg umiddelbart og tar kontroll over alle åpne faner. Hvis brukeren er midt i en DagensGlose-øvelse og en deploy skjer, kan SW-skiftet forstyrre nettverkskall (fetch til Cloudflare Worker) og — i verste fall — reloade appen slik at øvelsesstaten mistes. React-state lever i minnet og overlever ikke et reload.

**Forslag til fix:** For denne typen app er `registerType: "prompt"` tryggere — brukeren varsles om oppdatering og velger selv om den skal skje nå. Alternativt legge til `workbox.navigateFallbackDenylist` for å beskytte pågående økt.

---

### [PWA] Ingen `navigateFallback` for offline SPA-navigasjon

**Fil:** `vite.config.js` (linje 9–29)  
**Alvorlighetsgrad:** Lav  
**Beskrivelse:** Workbox-konfigurasjonen mangler `navigateFallback: "/fransk-app/index.html"`. Dersom en bruker åpner appen for første gang uten nett, eller direkte navigerer til en URL, kan nettleseren få en tom side i stedet for appen.

**Forslag til fix:**
```js
workbox: {
  clientsClaim: true,
  skipWaiting: true,
  navigateFallback: "/fransk-app/index.html",
}
```

---

## React-komponenter

---

### [REACT-BUG07] Phase 2 fill-ord er ikke-deterministiske ved session-restore

**Fil:** `src/App.jsx` (linje 216–220)  
**Alvorlighetsgrad:** Høy  
**Beskrivelse:** Dette er den undersøkte BUG-07. Når appen reloades og `startDagensGlose` kalles for en sesjon der `phase1done === true`, plukkes fill-ord på nytt:
```js
const fill = words.filter(w => !ex.words.some(d => d.fr === w.fr))
  .sort(() => Math.random() - 0.5)
  .slice(0, 5);
```
`Math.random()` gir en ny tilfeldig sortering hver gang, og `words` kan ha endret seg siden fase-1 ble fullført (nye ord er lagt til via `submitDagens`). Resultatet er at brukeren kan få et annet sett fill-ord enn det de originalt ble testet på i fase 2. Dette strider mot forventningen om at «fase 2 er samme økt som fase 1».

**Forslag til fix:** Lagre fill-ordene (deres `fr`-felter) i `DAGENS_GLOSE_KEY`-objektet når fase 2 initieres, og les dem derfra ved restore:
```js
// Ved fase 1→2-overgang i nextDagens:
const fill = words.filter(...).sort(() => Math.random() - 0.5).slice(0, 5);
localStorage.setItem(DAGENS_GLOSE_KEY, JSON.stringify({
  ...saved, phase1done: true,
  fillFr: fill.map(w => w.fr),  // lagre hvilke fill-ord som ble valgt
}));

// Ved resume:
} else if (phase === 2) {
  const fillFr = ex.fillFr || [];
  const fill = words.filter(w => fillFr.includes(w.fr));
  // fallback til tilfeldig valg hvis fillFr mangler (bakoverkompatibilitet)
  const actualFill = fill.length ? fill : words.filter(...).slice(0, 5);
```

---

### [REACT] BottomNav fremhever aldri «Snakk»-fanen på chat-skjermen

**Fil:** `src/components/BottomNav.jsx` (linje 11–15)  
**Alvorlighetsgrad:** Medium  
**Beskrivelse:** `activeId`-logikken sjekker `screen === "chat-fri"`, men chat-skjermen bruker `screen === "chat"` som ID (satt i `startMode`). Resultatet er at ingen fane er aktiv (highlightet) når brukeren er i chat-modus — verken «Snakk» eller noen annen fane.

**Forslag til fix:**
```js
: screen === "chat" ? "fri"
```
Endre `"chat-fri"` til `"chat"` i activeId-betingelsen.

---

### [REACT] `submitGramOvelse` oppdaterer ikke `points` på grammatikkord

**Fil:** `src/App.jsx` (linje 430–442)  
**Alvorlighetsgrad:** Medium  
**Beskrivelse:** Mens `submitGlose` og `submitDagens` begge bruker `updateWordPoints` (som håndterer mastery-poeng, `masteredRound`, `retestRound` og SR-override), bruker `submitGramOvelse` bare `scheduleNext` direkte. Grammatikkord akkumulerer aldri poeng og når aldri «mestret»-status. `getDue` for grammatikkord vil alltid baseres på `nextReview`-timestamp alene, noe som er inkonsistent med glose-systemet.

**Forslag til fix:** Erstatt lines 438–441 med samme `updateWordPoints`-logikk som brukes i `submitGlose`:
```js
if (gramOvCard?.id) {
  const gc = incrementAnswerCount();  // flytt hit fra linje 437
  setGrammarWords(prev => prev.map(w => {
    if (w.id !== gramOvCard.id) return w;
    const updated = updateWordPoints(w, passed, gc);
    const srOverride = updated._srOverride;
    const { _srOverride: _, ...cleanUpdated } = updated;
    if (srOverride) return { ...cleanUpdated, ...srOverride };
    if ((cleanUpdated.points || 0) < 50) {
      const { level: nl, nextReview: nr } = scheduleNext(w.level, passed);
      return { ...cleanUpdated, level: nl, nextReview: nr };
    }
    return cleanUpdated;
  }));
}
```

---

### [REACT] ChatScreen mangler AbortController — state-oppdatering etter navigasjon

**Fil:** `src/screens/ChatScreen.jsx` (linje 36–78)  
**Alvorlighetsgrad:** Medium  
**Beskrivelse:** `send()`-funksjonen starter en `fetch`-forespørsel, men det finnes ingen `AbortController` og ingen cleanup i `useEffect`. Hvis brukeren navigerer bort fra ChatScreen mens forespørselen er in-flight, vil resolve-handleren likevel kalle `setMessages`, `setLoading` og `setSessionMsgs` på en umountet (eller gjenbrukt) komponent-instans. I React 18 kaster dette ikke lenger en feil, men det kan gi uønskede state-oppdateringer hvis brukeren navigerer tilbake raskt.

**Forslag til fix:**
```js
const abortRef = useRef(null);

const send = async (override) => {
  const controller = new AbortController();
  abortRef.current = controller;
  // legg til signal: controller.signal i fetch-kallet
  ...
};

useEffect(() => {
  return () => abortRef.current?.abort();
}, []);
```

---

### [REACT] ChatScreen rescanner alle meldinger for `✓ LÆRT:` ved hvert nye svar

**Fil:** `src/screens/ChatScreen.jsx` (linje 22–34)  
**Alvorlighetsgrad:** Lav  
**Beskrivelse:** `useEffect([messages])` itererer over *alle* meldinger i historikken hver gang et nytt svar ankommer. For en lang chat-økt med mange `✓ LÆRT:`-markører betyr dette at `setWords` kalles gjentatte ganger med allerede-eksisterende ord (men `prev.some(w => w.fr === parsed.fr)` forhindrer faktisk duplisering, så React returnerer samme referanse). Det er likevel unødvendig CPU-bruk.

**Forslag til fix:** Erstatt avhengigheten med kun siste melding, eller bruk en `processedRef` som tracker hvilke meldingsindekser som allerede er skannet.

---

### [REACT] `loadAnswerCount()` kalt direkte i render-funksjonen til HomeScreen

**Fil:** `src/screens/HomeScreen.jsx` (linje 7, 19)  
**Alvorlighetsgrad:** Lav  
**Beskrivelse:** `getDue(words, loadAnswerCount())` kalles to ganger per render (linje 7 og 19), der `loadAnswerCount()` er et synkront localStorage-kall. Siden HomeScreen rendres ved enhver state-endring i App (f.eks. ord-oppdateringer), skjer disse localStorage-lesningene svært hyppig.

**Forslag til fix:** Beregn `loadAnswerCount()` én gang utenfor komponentene og pass det som prop fra App, eller bruk `useMemo`:
```js
const answerCount = useMemo(() => loadAnswerCount(), [words]);
```

---

### [REACT] `wordsCount`-prop akseptert men aldri brukt i QuizExerciseScreen

**Fil:** `src/components/QuizExerciseScreen.jsx` (linje 11)  
**Alvorlighetsgrad:** Lav  
**Beskrivelse:** `wordsCount` er inkludert i destructuring-parameteren men refereres aldri i komponentens kropp. Død kode.

**Forslag til fix:** Fjern `wordsCount` fra destructuringen.

---

### [REACT] `else if (passed)`-grenen i `submitGlose` er utilgjengelig kode

**Fil:** `src/App.jsx` (linje 353–356)  
**Alvorlighetsgrad:** Lav  
**Beskrivelse:** Grenen `else if (passed)` kjøres bare hvis `gloseCard.id` er falsy. Men køen i `startGlose` bygges utelukkende fra `words`-arrayen via `getDue` og `notDue` — alle disse ordene har et `id`-felt. `gloseCard.id` er alltid truthy, og `else if`-grenen kan aldri nås.

**Forslag til fix:** Fjern de fire linjene (353–356). De er identiske med tilsvarende kode i `submitDagens` og ble sannsynligvis kopiert dit ved en feil.

---

### [REACT] OrdmesterTeller omdefinerer fargevariabler lokalt

**Fil:** `src/components/OrdmesterTeller.jsx` (linje 4–5)  
**Alvorlighetsgrad:** Lav  
**Beskrivelse:** Komponenten definerer `const gold = "#c8783a"` og `const cream = "#1a1210"` lokalt i stedet for å importere fra `../constants.js`. Hvis temafargene endres i `constants.js`, vil `OrdmesterTeller` ikke bli oppdatert.

**Forslag til fix:** Erstatt med `import { gold, cream } from "../constants.js"`.

---

## localStorage og datapersistering

---

### [DATA] `clearWords` fjerner ikke grammatikkord eller grammatikkprogresjon

**Fil:** `src/screens/WordsScreen.jsx` (linje 71–76)  
**Alvorlighetsgrad:** Medium  
**Beskrivelse:** «Nullstill ordliste»-knappen fjerner ordbanken og dagens-glose-state, men *ikke* `GRAMMAR_WORDS_KEY` og `GRAMMAR_PROGRESS_KEY`. En bruker som trykker «Nullstill» vil få tom ordbank, men beholde all grammatikk-fremgang og alle grammatikkord i øvelsesystemet. Dette er sannsynligvis ikke tilsiktet atferd og kan virke forvirrende.

**Forslag til fix:** Beslutning: enten fjern grammatikk-state også (full reset), eller gi to separate knapper («Nullstill gloser» vs. «Full tilbakestilling»). Hvis full reset:
```js
import { GRAMMAR_WORDS_KEY, GRAMMAR_PROGRESS_KEY } from "../constants.js";
// I clearWords:
localStorage.removeItem(GRAMMAR_WORDS_KEY);
localStorage.removeItem(GRAMMAR_PROGRESS_KEY);
setGrammarWords([]);  // trenger prop/callback til App
```

---

## CI/CD

---

### [CI] Ingen validering av `VITE_PROXY_URL` før bygg

**Fil:** `.github/workflows/deploy.yml` (linje 29–31) + `src/constants.js` (linje 0)  
**Alvorlighetsgrad:** Medium  
**Beskrivelse:** `PROXY_URL = import.meta.env.VITE_PROXY_URL` vil bli `undefined` hvis `VITE_PROXY_URL`-secreten ikke er satt i repo-innstillingene. Vite kompilerer dette uten feil; appen bygges og deployes, men ChatScreen vil kalle `fetch(undefined)` som kaster `TypeError`. Brukeren ser da «Kunne ikke koble til. Prøv igjen.» — uten noen indikasjon på at det er en konfigurasjonsfeil.

**Forslag til fix:** Legg til et valideringssteg i workflow:
```yaml
- name: Validate required secrets
  run: |
    if [ -z "$VITE_PROXY_URL" ]; then
      echo "ERROR: VITE_PROXY_URL secret is not set"
      exit 1
    fi
  env:
    VITE_PROXY_URL: ${{ secrets.VITE_PROXY_URL }}
```

---

### [CI] `npm ci` cacher ikke `node_modules` mellom kjøringer

**Fil:** `.github/workflows/deploy.yml` (linje 25–26)  
**Alvorlighetsgrad:** Lav  
**Beskrivelse:** `setup-node` er ikke konfigurert med `cache: 'npm'`. Alle avhengigheter lastes ned fra npm ved hvert bygg, noe som øker byggetiden unødvendig.

**Forslag til fix:**
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 18
    cache: 'npm'
```

---

## Spaced Repetition / utils.jsx

---

### [SR] `getTodaysGloseWords` kaller `getDue` uten `globalCount`

**Fil:** `src/utils.jsx` (linje 179)  
**Alvorlighetsgrad:** Lav  
**Beskrivelse:** `getDue(words)` kalles uten `globalCount`-argumentet, slik at `getDue` må kalle `loadAnswerCount()` internt. Dette er et ekstra synkront localStorage-kall og er inkonsistent med alle andre call sites som eksplisitt sender `loadAnswerCount()`. Ikke en funksjonell feil, men bidrar til unødvendige localStorage-lesninger.

**Forslag til fix:** Endre til `getDue(words, loadAnswerCount())`.

---

## Potensielle edge cases

---

### [EDGE] System prompt kan overskride `MAX_SYSTEM_LENGTH` med stor ordbank

**Fil:** `src/screens/ChatScreen.jsx` (linje 47–50) + `cloudflare-worker.js` (linje 6)  
**Alvorlighetsgrad:** Medium  
**Beskrivelse:** `wordCtx` inkluderer alle ord i ordbanken i system-prompten. Grunnprompt tar ca. 1 200 tegn. `MAX_SYSTEM_LENGTH` er 6 000 tegn. Ved ~30 tegn per ord når totalstørrelsen taket ved ca. 160 ord i ordbanken. Workers `slice(0, MAX_SYSTEM_LENGTH)` vil da avkorte midt i et ord og skade prompt-semantikken.

**Forslag til fix:** Begrens `wordCtx` til de siste N lærte ordene (f.eks. 80–100), prioritert etter lavest `points` (de minst mestrede):
```js
const wordSample = words
  .sort((a, b) => (a.points || 0) - (b.points || 0))
  .slice(0, 80);
```

---

## Oppsummering

| Alvorlighetsgrad | Antall |
|-----------------|--------|
| Kritisk         | 0      |
| Høy             | 2      |
| Medium          | 8      |
| Lav             | 8      |
| **Totalt**      | **18** |

### Topp tre å fikse først

1. **[WORKER] Manglende try/catch rundt Anthropic-fetch** — Dette er den eneste feilen som kan gi brukeren en uforklarlig feil (CORS-avvisning i stedet for en norsk feilmelding). Enkel 5-linjers fix med stor effekt.

2. **[REACT-BUG07] Phase 2 fill-ord ikke-deterministiske ved session-restore** — Den aktuelle BUG-07. Brukere som avbryter og gjenopptar en fase-2-øvelse vil møte ukjente ord de ikke har lært i fase 1. Svekker læringsopplevelsen direkte.

3. **[REACT] BottomNav «Snakk»-fanen aldri aktiv** — En én-ords-fix (`"chat-fri"` → `"chat"`) som gir brukeren korrekt visuell tilbakemelding om hvilken del av appen de er i. Lav risiko, høy UX-verdi.
