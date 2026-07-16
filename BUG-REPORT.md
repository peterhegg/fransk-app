# Bug Report — fransk-app / L'Atelier

**Status:** Alle 35 funn under er fikset i påfølgende commit. Rapporten under er bevart uendret som dokumentasjon av opprinnelig analyse (unntak: et par Lav-funn — KV race condition, timing-usikker token-sammenligning, manglende CORS på 403/404, stille trunkering — ble bevisst latt stå, som anbefalt i rapportens egne "Forslag til fix"-felt for personlig enkeltbruker-bruk).

Full kodebase-gjennomgang. React 18 + Vite PWA, ingen backend utenom Cloudflare Worker-proxy (`cloudflare-worker.js`), deploy via GitHub Actions → GitHub Pages, to språk (fransk + sveitsertysk de-CH) via `src/languages/`.

Opprinnelig gjennomgang var kun analyse, ingen endringer. Fikser er gjort i etterkant, se git-historikk.

---

## Cloudflare Worker / Backend

---
### [Worker] 429/400-feilsvar er ren tekst — bryter ALLE klienters `res.json()`, vises som villedende "Nettverksfeil"

**Fil:** `cloudflare-worker.js` (linje 432, 439, 449, 481)
**Alvorlighetsgrad:** Kritisk
**Beskrivelse:** `checkRateLimit`/`checkDailyIPLimit`-feil, ugyldig JSON i request, og tom `messages`-array returneres alle som `new Response("...", { status, headers })` med **ren tekst**, ikke JSON. Samtlige klient-screens (`GenerertFlervalgScreen.jsx`, `ByggSetningenScreen.jsx`, og de fleste andre AI-screens) gjør `await res.json()` ubetinget. Når responsen er ren tekst kaster `res.json()` en `SyntaxError`, som havner i en generisk catch-blokk og vises som "Nettverksfeil. Sjekk forbindelsen og prøv igjen." / "Kunne ikke laste setninger" — selv om det egentlige problemet er rate-limiting eller en ugyldig request, ikke nettverk. Dette er sannsynlig rotårsak til feilen brukeren rapporterte i denne økten (bekreftet med curl mot produksjonsworkeren: CORS og token-feil fungerer korrekt og returnerer JSON — kun disse fire responsene avviker).
**Forslag til fix:** Bruk samme mønster som `checkBudget`-feilen (som allerede er korrekt JSON):
```js
return new Response(JSON.stringify({ error: "Too Many Requests" }), {
  status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
});
```
Gjør tilsvarende for de tre andre stedene.

---
### [Worker] `LOCKED_MODEL` overstyrer klientens modellvalg — Haiku-forespørsler kjøres faktisk som dyrere Sonnet

**Fil:** `cloudflare-worker.js` (linje 2, 462)
**Alvorlighetsgrad:** Høy
**Beskrivelse:** 10 forskjellige screens sender eksplisitt `model: "claude-haiku-4-5-20251001"` i request-body for å holde kostnadene nede på øvelsesgenerering. Workerens generelle proxy-endepunkt ignorerer dette fullstendig og bruker alltid `LOCKED_MODEL = "claude-sonnet-4-6"` (linje 462: `model: LOCKED_MODEL`). Dette betyr at hver "billig" Haiku-forespørsel faktisk faktureres til Sonnet-priser (5-10x dyrere), noe som gjør at det delte `DAILY_BUDGET_USD`-taket på $1/dag nås mye raskere enn klientkoden er designet for — spesielt kombinert med at `MAX_TOKENS_LIMIT` nylig ble hevet fra 1000 til 3000. Dette forklarer trolig hvorfor budsjett-/rate-grenser ble nådd under testing i denne økten.
**Forslag til fix:** Enten la workeren respektere `body.model` (validert mot en tillatt-liste, f.eks. kun haiku-4-5 og sonnet-4-6), eller aksepter kostnaden bevisst — men da bør `DAILY_BUDGET_USD` justeres opp til å reflektere faktisk Sonnet-pris per kall.

---
### [Worker] Budsjett-/rate-limit-sjekker blokkerer også ikke-AI-endepunkter (widget-sync, push)

**Fil:** `cloudflare-worker.js` (linje 414–444 vs. rute-dispatch 452–458)
**Alvorlighetsgrad:** Høy
**Beskrivelse:** `checkBudget`, `checkRateLimit` og `checkDailyIPLimit` kjører ubetinget for **alle** POST-forespørsler før rute-dispatch — inkludert `/push/subscribe`, `/push/unsubscribe` og `/widget/sync`, som ikke kaller Anthropic API og ikke koster noe. Når det daglige AI-budsjettet ($1) er brukt opp, vil widget-synkronisering og push-abonnement **også** begynne å returnere 429, selv om de ikke bruker budsjettet i det hele tatt. Samme delte rate-limit (20/min) gjelder — hyppige widget-synkroniseringer kan låse ute faktisk AI-bruk (tale/chat) i et minutt, eller omvendt.
**Forslag til fix:** Flytt `/push/*` og `/widget/sync` til å dispatches før (eller uavhengig av) budsjett-/rate-sjekkene, siden de ikke bruker Anthropic API.

---
### [Worker] Push-varsel-tidspunkt brukeren velger i UI blir aldri respektert

**Fil:** `src/hooks/usePushSubscription.js` (linje 28–33) → `cloudflare-worker.js` (`handlePushSubscribe` linje 243–250, `sendStreakReminders` linje 261–279) → `wrangler.toml` (linje 5, `crons = ["0 20 * * *"]`)
**Alvorlighetsgrad:** Høy
**Beskrivelse:** UI lar brukeren velge ønsket varslingstidspunkt (`profile.pushTime`), som sendes til workeren som `scheduledTime` og lagres i KV. Men `sendStreakReminders`, som faktisk trigges av cron, ignorerer `scheduledTime` fullstendig — den sender varsel til alle abonnenter på ett fast tidspunkt (20:00 UTC / 22:00 norsk tid). Tidsvelgeren i UI har null effekt på når varselet faktisk kommer.
**Forslag til fix:** Enten fjern tidsvelgeren (misvisende UI), eller kjør cron oftere (hvert 15.-30. min) og filtrer abonnenter i `sendStreakReminders` basert på `scheduledTime`.

---
### [Worker] Ikke-atomisk rate-limit-/budsjett-telling (KV race condition)

**Fil:** `cloudflare-worker.js` (linje 37–63)
**Alvorlighetsgrad:** Lav
**Beskrivelse:** `checkBudget`/`recordCost`/`checkRateLimit`/`checkDailyIPLimit` gjør alle "get, så put" uten atomisk oppdatering — Workers KV støtter ikke compare-and-swap. To samtidige forespørsler kan begge lese samme verdi og begge skrive +1, noe som teller for lite. For en enkeltbruker-app er dette lite kritisk.
**Forslag til fix:** Grei å la stå som den er for personlig bruk. Ved bredere bruk: Durable Objects for atomiske tellere.

---
### [Worker] UTC-basert dags-grense for budsjett/rate ≠ norsk midnatt

**Fil:** `cloudflare-worker.js` (linje 33–35, 57–58)
**Alvorlighetsgrad:** Lav
**Beskrivelse:** `todayKey()` og daily-IP-key bruker `new Date().toISOString().slice(0,10)` — alltid UTC-dato. Budsjett/rate-limit nullstilles altså kl 01:00–02:00 norsk tid, ikke ved midnatt lokalt. Samme mønster som funnet i `src/utils.jsx` sin `todayStr()` (se Persistering-seksjonen) — konsistent internt, men ikke justert til brukerens tidssone.
**Forslag til fix:** Lavt prioritert (1-2 timers avvik), men kan justeres med samme lokal-dato-formel som foreslått for `todayStr()`.

---
### [Worker] Tidskonstant-usikker token-sammenligning

**Fil:** `cloudflare-worker.js` (linje 419)
**Alvorlighetsgrad:** Lav
**Beskrivelse:** `token !== env.CLIENT_TOKEN` er en vanlig streng-sammenligning, ikke tidskonstant. For en personlig enkeltbruker-app med rate-limiting er praktisk risiko minimal, men er ikke best practice for token-sjekk.
**Forslag til fix:** Ikke kritisk å fikse for dette bruksmønsteret; nevnes for fullstendighet.

---
### [Worker] Forbidden/Not Found-responser mangler CORS-headere

**Fil:** `cloudflare-worker.js` (linje 390, 397–399)
**Alvorlighetsgrad:** Lav
**Beskrivelse:** 404 (widget-GET-miss) og 403 (feil Origin) mangler CORS-headere. Ikke en sikkerhetsbug (korrekt avvisning), men gjør at en feilkonfigurert `DEV_ORIGIN` i lokal utvikling vil vises som en uforklarlig "Failed to fetch"/CORS-feil i nettleseren i stedet for en lesbar 403 — identisk symptom til det brukeren opplevde i denne økten, verdt å være obs på ved lokal debugging.
**Forslag til fix:** Ikke strengt nødvendig; evt. logg avviste origins server-side (`console.error`) for synlighet i `wrangler tail`.

---
### [Worker] Utløpte push-abonnementer ryddes aldri opp

**Fil:** `cloudflare-worker.js` (linje 269–278)
**Alvorlighetsgrad:** Lav
**Beskrivelse:** Når `sendPush` feiler (f.eks. 410 Gone for utløpt abonnement) logges det kun med `console.error`, aldri slettet fra KV. Døde abonnementer akkumuleres og forsøkes på nytt daglig helt til 90-dagers TTL.
**Forslag til fix:** Ved 404/410-respons fra `sendPush`, kall `env.RATE_LIMIT_KV.delete(key.name)`.

---
### [Worker] Stille trunkering ved `MAX_SYSTEM_LENGTH`/`MAX_CONTENT_LENGTH`

**Fil:** `cloudflare-worker.js` (linje 5–6, 467–476)
**Alvorlighetsgrad:** Lav
**Beskrivelse:** System-prompt og meldingsinnhold kuttes stille ved hhv. 6000/4000 tegn uten varsel til klient. Lite sannsynlig å ramme dagens prompter (typisk under 2000 tegn), men vil feile stille hvis en fremtidig prompt vokser forbi grensen — spesielt om JSON-instruksen ligger på slutten av en lang prompt.
**Forslag til fix:** Ikke akutt; vurder logging når trunkering faktisk skjer.

---

## React-komponenter / Hooks

---
### [React] `lang` brukt utenfor scope — krasjer hele skjermen

**Fil:** `src/screens/SentenceTranslationScreen.jsx` (linje 285, 300)
**Alvorlighetsgrad:** Kritisk
**Beskrivelse:** `getActiveLang()` er kun tilordnet `lang` inne i den nøstede `fetchAiHint`-funksjonen (linje 162). Selve render-koden i "play"-visningen (linje 269–360) bruker `lang.label.toLowerCase()` på linje 285 og 300 uten at `lang` er definert i komponentens scope. Dette er nøyaktig samme feilklasse som ble fikset i `GenerertFlervalgScreen.jsx` tidligere i denne økten (introdusert i samme commit, `87920f0`/"Fase D") — men her ble den tilsvarende top-level-deklarasjonen aldri lagt til. Gir `ReferenceError: lang is not defined` og krasjer skjermen hver gang den når hoved-render (dvs. hver gang den ikke er i loading/error/done-tilstand).
**Forslag til fix:** Legg til `const lang = getActiveLang();` nær de andre `useState`-deklarasjonene (rundt linje 94), som i `ByggSetningenScreen.jsx`.

---
### [React] Timer-/interval-lekkasje i `useSpeechSynthesis` gjør at mikrofonen kan starte seg selv igjen

**Fil:** `src/hooks/useSpeechSynthesis.jsx` (linje 16–74)
**Alvorlighetsgrad:** Høy
**Beskrivelse:** Hvert `speak()`-kall oppretter en `fallbackTimer` og `keepAlive`-interval lokalt i kallets closure. `utt.onerror` hopper eksplisitt over opprydding for `"interrupted"`-feil (linje 62), men `stop()` og påfølgende `speak()`-kall trigger nettopp `"interrupted"` via `speechSynthesis.cancel()`. Siden `stop()` ikke har referanse til forrige kalls timer/interval (lagres ikke i en delt ref), kan verken ryddes opp. Resultat: `keepAlive` kjører evig, og `fallbackTimer` fyrer senere med en **foreldet** `onEnd`-callback. I `useConversation.jsx` (linje 61–70) kaller `onEnd` `setStatus("idle")` og starter mikrofonen igjen etter 400ms — mikrofonen kan altså spontant starte å lytte igjen flere sekunder etter at brukeren eksplisitt stoppet samtalen.
**Forslag til fix:** Lagre timer-/interval-handles i en delt ref som `stop()` også har tilgang til, og rydd opp eksplisitt derfra i stedet for å stole på at `onerror`/`onend` fyrer korrekt.

---
### [React] VoiceScreen rydder ikke opp ved unmount; kan ikke avbryte avspilling

**Fil:** `src/screens/VoiceScreen.jsx` (linje 32–36)
**Alvorlighetsgrad:** Høy
**Beskrivelse:** Ingen `useEffect`-opprydding kaller `stopListening()`/`reset()` ved unmount. Navigerer brukeren bort mens mikrofonen lytter eller Pierre snakker, fortsetter `SpeechRecognition`/`speechSynthesis` å kjøre frikoblet fra den avmonterte komponenten. I tillegg: `handleOrbClick` kaller `stopListening()` når `status === "speaking"`, men det stopper kun taleGJENKJENNING (som uansett ikke er aktiv da) — det finnes ingen eksponert måte å stoppe faktisk TTS-avspilling på, så brukeren kan ikke avbryte Pierre midt i en setning.
**Forslag til fix:** Legg til `useEffect(() => () => { stopListening(); reset(); }, [])`; eksponer `stopSpeaking` fra `useConversation` og kall den når `status === "speaking"`.

---
### [React] Død `AbortController` → foreldet AI-hint kan vises for feil kort

**Fil:** `src/screens/DagensRettelseScreen.jsx` (linje 71–91), `src/components/QuizExerciseScreen.jsx` (linje 31–55)
**Alvorlighetsgrad:** Høy (DagensRettelseScreen) / Medium (QuizExerciseScreen)
**Beskrivelse:** `DagensRettelseScreen.requestHint` oppretter en `AbortController`, men `.abort()` kalles aldri noe sted i filen — død kode. Ber brukeren om et hint og trykker "neste" før svaret kommer tilbake, kan `setAiHint(...)` fyre etter at kortet allerede har byttet, og reset-effekten fanger det ikke opp. `QuizExerciseScreen.jsx` avbryter riktignok forrige request ved nytt hint-kall, men ikke når kortet byttes uten nytt hint-forsøk — samme risiko, smalere vindu.
**Forslag til fix:** Lagre controlleren i en ref og kall `.abort()` fra effekten som nullstiller `aiHint` ved kortbytte.

---
### [React] Hardkodet "på fransk" gjenstår i tre filer berørt av språk-refaktoreringen

**Filer:** `src/screens/KryssordScreen.jsx` (linje 355), `src/screens/OrdstokkenScreen.jsx` (linje 209), `src/screens/SudokuScreen.jsx` (linje 305, 468)
**Alvorlighetsgrad:** Medium
**Beskrivelse:** Commits "Fase B" (5326023) og "Fase C" (49e8cec) gjorde spillogikken språkbevisst (artikkel-stripping, tyske tallord), men lot instruksjonstekstene stå hardkodet til fransk. En de-CH-bruker ser "Skriv på fransk" mens de faktisk skriver tyske tallord.
**Forslag til fix:** Bytt til `` `Skriv på ${getActiveLang().label.toLowerCase()}…` `` i alle tre filene.

---
### [React] Manglende tomt-resultat-sjekk gir "1/0"-tilstand i stedet for feilmelding

**Fil:** `src/screens/SentenceTranslationScreen.jsx` (linje 140–146), `src/screens/SaySentenceScreen.jsx` (linje 132–138)
**Alvorlighetsgrad:** Medium
**Beskrivelse:** Begge sjekker `Array.isArray(parsed) && parsed.length` FØR filtrering, men setter `sentences` til det filtrerte (potensielt tomme) resultatet uten å sjekke lengden etterpå. Gir `idx+1/0`-tellere og `NaN%`/`Infinity%`-bred fremdriftslinje i stedet for en feilskjerm — i motsetning til `GenerertFlervalgScreen.jsx`/`LyttedetektivScreen.jsx`, som sjekker lengden etter filtrering.
**Forslag til fix:** Sjekk `parsed.filter(...).length` før `setSentences`, ellers `setError("parse")`.

---
### [React] Inkonsistent bruk av AbortController på tvers av AI-screens

**Filer:** `src/screens/ByggSetningenScreen.jsx`, `src/screens/HistoriediktatScreen.jsx`, `src/screens/LyttedetektivScreen.jsx`, `src/screens/RollespillScreen.jsx`
**Alvorlighetsgrad:** Medium
**Beskrivelse:** I motsetning til `GenerertFlervalgScreen.jsx`/`SentenceTranslationScreen.jsx`/`SaySentenceScreen.jsx` (som alle bruker `abortRef` + avbryter ved unmount), fyrer disse fire vanlige `fetch()`-kall uten `signal`. Navigerer brukeren bort midt i en forespørsel, kalles `setState` på en avmontert komponent (React-advarsel; harmløst i dag, men skjørt hvis skjermene noen gang holdes montert/cachet).
**Forslag til fix:** Bruk samme `abortRef`-mønster som de tre "gode" skjermene.

---
### [React] Bredere hardkodede franske strenger utenfor Fase A–E (informasjon)

**Filer (eksempler):** `GrammatikkTeoriScreen.jsx`, `ChatScreen.jsx`, `VoiceScreen.jsx`, `WordsScreen.jsx`, `TidspressScreen.jsx`, `MemoryMatchScreen.jsx`, `SayWordScreen.jsx`, `QuizExerciseScreen.jsx` (linje 116), `TranslationExerciseScreen.jsx`, `MultipleChoiceOnlyScreen.jsx`, `DagensExerciseScreen.jsx`, `WordDetailModal.jsx`
**Alvorlighetsgrad:** Lav
**Beskrivelse:** Ikke berørt av språk-refaktoreringscommittene og har fortsatt hardkodet "fransk"/"Fransk" i UI-tekst. Ikke krasj-risiko, kun ufullstendig i18n hvis full de-CH-paritet er målet på disse skjermene også.
**Forslag til fix:** Ingen umiddelbar handling nødvendig; gjør ved anledning hvis de-CH skal ha full paritet.

---

## localStorage / Persistering / Språknavnerom

---
### [Persistering] Fransk "à"-ord injiseres i ALLE språks ordbank via migrasjon

**Fil:** `src/utils.jsx` (linje 184–217, spesielt 200–204)
**Alvorlighetsgrad:** Høy
**Beskrivelse:** `runWordBankMigrations()` kjører ubetinget for alle språk. `version < 2`-grenen legger til et hardkodet fransk ord (`"à" = "til / i / på"`) hvis ordbanken ikke allerede inneholder "à". Siden migrasjonsversjon-nøkkelen er navnerom-delt per språk, vil en sveitsertysk (`de-CH`) installasjon trigge denne grenen første gang den har lagrede ord — og siden en tysk ordbank naturligvis ikke inneholder det franske ordet "à", injiseres et fransk ord rett inn i den tyske ordbanken.
**Forslag til fix:** Gjør migrasjonen (eller minst denne grenen) betinget på `getActiveLang().id === "fr"`, eller flytt den inn i `fr.js`.

---
### [Persistering] Valgt tutor-persona i onboarding reflekteres ikke før reload

**Fil:** `src/App.jsx` (linje 103, 872–874), `src/screens/OnboardingScreen.jsx` (linje 52–60)
**Alvorlighetsgrad:** Høy
**Beskrivelse:** `OnboardingScreen.handleConfirm()` kaller `saveTutorPrefs(newPrefs)` direkte og deretter `onDone(newPrefs)` — men `App.jsx` sin `onDone={() => setShowOnboarding(false)}` forkaster `newPrefs`-argumentet fullstendig. React sin in-memory `tutorPrefs`-state (satt via `useTutorPrefs()` ved mount, med standardverdier) oppdateres aldri. Alle skjermer rett etter onboarding viser feil tutor (standard "Henri") inntil en full side-reload skjer.
**Forslag til fix:** `onDone={(newPrefs) => { updateTutorPrefs(newPrefs); setShowOnboarding(false); }}`.

---
### [Persistering] Widget-UUID nullstilles per språk — hjemskjerm-widget blir foreldet

**Fil:** `src/utils.jsx` (linje 605–613), `src/App.jsx` (linje 792–811), `src/storage-namespace.js` (linje 17, `GLOBAL_KEYS`)
**Alvorlighetsgrad:** Høy
**Beskrivelse:** `WIDGET_UUID_KEY` er ikke i `GLOBAL_KEYS`, så den navnerom-deles per språk. Første gang brukeren bytter til `de-CH`, finnes ingen UUID i det navnerommet, og en helt ny UUID genereres og postes til `/widget/sync` som en ny backend-post. En fysisk hjemskjerm-widget konfigurert mot den gamle (franske) UUID-en slutter å motta oppdateringer — stille, uten feilmelding, i det øyeblikket språket byttes.
**Forslag til fix:** Legg `WIDGET_UUID_KEY` til i `GLOBAL_KEYS` — widget-identitet er et enhets-konsept, ikke et per-språk-konsept.

---
### [Persistering] `storagePrefix`-feltet er ubrukt og misvisende

**Fil:** `src/languages/fr.js` (linje 78), `src/languages/de-ch.js` (linje 217), `src/storage-namespace.js` (linje 21–24)
**Alvorlighetsgrad:** Medium
**Beskrivelse:** Begge språk-konfigene definerer `storagePrefix` ("fransk"/"sveitsertysk"), men `storage-namespace.js` bruker aldri dette feltet — den utleder navnerommet direkte fra `langId`. Ikke en aktiv bug i dag, men en felle for fremtidige endringer som antar at `storagePrefix` faktisk styrer navnerommet.
**Forslag til fix:** Enten koble `storage-namespace.js` til `storagePrefix`, eller fjern det ubrukte feltet.

---
### [Persistering] Brukerprofil (navn, mål, dysleksi, push-tid …) duplex og nullstilles per språk

**Fil:** `src/utils.jsx` (linje 616–639), `src/hooks/usePushSubscription.js` (linje 29)
**Alvorlighetsgrad:** Medium
**Beskrivelse:** `USER_PROFILE_KEY` er ikke global. Person-/enhetsnivå-felter (`name`, `dysleksi`, `dailyGoal`, `pushTime` osv.) nullstilles til default ved første bytte til `de-CH` — brukeren må sette navn, dysleksi-flagg, daglig mål og push-tid separat per språk, selv om det kun finnes ett fysisk push-abonnement per enhet.
**Forslag til fix:** Flytt person-/enhetsnivå-felter til en `GLOBAL_KEYS`-nøkkel; behold kun genuint språkspesifikke felter (tutor-persona er allerede korrekt navnerom-delt via `useTutorPrefs`).

---
### [Persistering] Push-aktivert-bryter desynkroniserer på tvers av språk

**Fil:** `src/hooks/usePushSubscription.js` (linje 5, 15, 35, 57, 76)
**Alvorlighetsgrad:** Medium
**Beskrivelse:** `STORAGE_KEY` er navnerom-delt per språk, men selve push-abonnementet er enhets-/nettleser-nivå (ett endpoint). UI-bryteren viser "av" ved første besøk i det andre språket selv om push fortsatt er aktivt server-side — en bruker som da skrur "av" tror den aldri var på, og avslutter det ene delte abonnementet.
**Forslag til fix:** Legg til i `GLOBAL_KEYS`, eller utled `enabled` fra `reg.pushManager.getSubscription()` i stedet for en lokal flagg.

---
### [Persistering] `todayStr()` bruker UTC-dato — streak/dagsmål bytter dag kl 01:00–02:00 lokal tid, ikke midnatt

**Fil:** `src/utils.jsx` (linje 112, samt `touchStreak` linje 310, `checkStreakBroken`, `loadActivityLog`)
**Alvorlighetsgrad:** Medium
**Beskrivelse:** `new Date().toISOString().split("T")[0]` er alltid UTC. For en norsk bruker (UTC+1/+2) flippes "i dag" kl 01:00–02:00 lokal tid. Øvelser gjort rett etter midnatt lokal tid telles fortsatt som "i går" i appens logikk — streak/dagsmål kan oppleves som at det "ikke teller".
**Forslag til fix:**
```js
export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
```

---
### [Persistering] `touchStreak()` dupliserer `todayStr()`s formel i stedet for å kalle den

**Fil:** `src/utils.jsx` (linje 310)
**Alvorlighetsgrad:** Lav
**Beskrivelse:** Inline `new Date().toISOString().split("T")[0]` i stedet for `todayStr()`. Harmløst i dag, men betyr at UTC/lokal-dato-fixen over må gjøres to steder.
**Forslag til fix:** `const today = todayStr();`

---
### [Persistering] `usePushSubscription.js` hardkoder profil-nøkkel i stedet for å gjenbruke `loadUserProfile()`

**Fil:** `src/hooks/usePushSubscription.js` (linje 29)
**Alvorlighetsgrad:** Lav
**Beskrivelse:** `localStorage.getItem("fransk-user-profile")` dupliserer `USER_PROFILE_KEY` som literal streng og hopper over `DEFAULT_PROFILE`-sammenslåing.
**Forslag til fix:** Importer og kall `loadUserProfile()` fra `utils.jsx`.

---
### [Persistering] `App.jsx` hardkoder `"fransk-tutor-prefs"` i stedet for å importere nøkkelen

**Fil:** `src/App.jsx` (linje 104)
**Alvorlighetsgrad:** Lav
**Beskrivelse:** Dupliserer en privat konstant fra `useTutorPrefs.js` som literal streng. Konsistent i dag, men et stille brudd om nøkkelen noen gang endres ett sted og ikke det andre.
**Forslag til fix:** Eksporter nøkkelen (eller en `hasTutorPrefs()`-hjelper) fra `useTutorPrefs.js`.

---
### [Persistering] Franskspesifikke regex-hjelpere kjører ubetinget for alle språk

**Fil:** `src/utils.jsx` (linje 42–43, 115–121, 180–182)
**Alvorlighetsgrad:** Lav
**Beskrivelse:** `stripFrArticle`, `isSentenceLike`, `stripPhoneticArticle` antar franske artikler/pronomen og kjører uansett aktivt språk. Nær no-op for tysk data i dag, men skjørt hvis fremtidig tysk ordforråd starter med et av de literale prefiksene.
**Forslag til fix:** Gjør betinget på `getActiveLang().id === "fr"` for konsistens med resten av språk-refaktoreringen.

---

## PWA / Service Worker / CI-CD

---
### [PWA] Ingen reload-håndtering ved service worker-oppdatering

**Fil:** `src/sw.js` (linje 6–7)
**Alvorlighetsgrad:** Medium
**Beskrivelse:** `skipWaiting()` + `clients.claim()` gir ny SW kontroll umiddelbart, uten at appen lytter på `controllerchange` eller tilbyr reload. I dag begrenset skadevirkning (ingen `React.lazy`/kode-splitting bekreftet), men en latent bug: introduseres kode-splitting senere, kan åpne faner få 404 på gamle chunk-URLer etter en deploy siden `cleanupOutdatedCaches()` kjører umiddelbart ved aktivering.
**Forslag til fix:** Lytt på `controllerchange` og kall `window.location.reload()`, eller bytt til `registerType: "prompt"` med en "ny versjon tilgjengelig"-banner.

---
### [PWA] CSP inline-script-hash er skjørt — stille brudd på tema-deteksjon ved minste endring

**Fil:** `index.html` (linje 6, 12–20)
**Alvorlighetsgrad:** Medium
**Beskrivelse:** CSP er låst til en spesifikk SHA-256-hash av et inline mørk/lys-tema-script. Stemmer i dag, men enhver fremtidig redigering (selv whitespace) vil gjøre at nettleseren blokkerer scriptet uten synlig feil i appens egen kode — kun en CSP-violation i devtools. Tidlig tema-deteksjon slutter da å virke, stille.
**Forslag til fix:** Flytt til en ekstern `/theme-init.js` (tillatt via `'self'` uten hash), eller automatiser hash-beregning i build-steget.

---
### [PWA] `manifest.webmanifest` mangler `lang`-felt — defaulter til "en"

**Fil:** `vite.config.js` (linje 14–27)
**Alvorlighetsgrad:** Lav
**Beskrivelse:** Generert manifest får `"lang":"en"` (vite-plugin-pwa-default), mens `index.html` er `lang="no"` og appen er norsk/fransk. Påvirker kun install-prompt-lokalisering, ikke funksjonalitet.
**Forslag til fix:** Legg til `lang: "no"` i manifest-objektet i `vite.config.js`.

---
### [CI/CD] Ingen Node-versjonspinning lokalt

**Fil:** `package.json`
**Alvorlighetsgrad:** Lav
**Beskrivelse:** Alle avhengigheter bruker `^`-ranges, `deploy.yml` hardkoder `node-version: 20` for CI, men det finnes ingen `engines`-felt eller `.nvmrc` som sikrer at lokal utvikling matcher CI-versjonen.
**Forslag til fix:** Legg til `"engines": { "node": ">=20 <21" }` eller `.nvmrc`.

---
### [CI/CD] Ubrukt `gh-pages`-avhengighet

**Fil:** `package.json` (linje 17)
**Alvorlighetsgrad:** Lav
**Beskrivelse:** `gh-pages` er en devDependency, men ingen script bruker den — deploy skjer utelukkende via GitHub Actions med `actions/deploy-pages`.
**Forslag til fix:** Fjern fra `package.json`.

---
### [CI/CD] Ingen sanity-sjekk av build-output før deploy

**Fil:** `.github/workflows/deploy.yml` (linje 42–49)
**Alvorlighetsgrad:** Medium
**Beskrivelse:** Workflowen validerer at miljøvariabler er satt, men ikke at selve `dist/`-output faktisk er korrekt (f.eks. at `sw.js`/`manifest.webmanifest` ble generert, eller at env-variabler faktisk ble substituert inn i `index.html`). Om `vite build` noen gang avslutter med kode 0 men produserer en ødelagt/tom `dist/`, vil deploy "lykkes" mens siden faktisk er ødelagt.
**Forslag til fix:** Legg til en enkel sjekk, f.eks. `test -f dist/sw.js && test -f dist/manifest.webmanifest && grep -q 'https://' dist/index.html` som feiler jobben ellers.

---

## Oppsummering

| Alvorlighetsgrad | Antall |
|---|---|
| Kritisk | 2 |
| Høy | 9 |
| Medium | 10 |
| Lav | 14 |
| **Totalt** | **35** |

### Topp 3 å ta tak i først

1. **[Kritisk] Worker: 429/400-responser er ren tekst, ikke JSON** (`cloudflare-worker.js` linje 432, 439, 449, 481) — dette er den mest sannsynlige rotårsaken til "Nettverksfeil" på Generert Flervalg/Bygg Setningen som ble rapportert i denne økten. Triviell fix, stor effekt.
2. **[Kritisk] `SentenceTranslationScreen.jsx`: `lang` brukt utenfor scope** (linje 285, 300) — krasjer hele skjermen ved hvert forsøk. Identisk feilklasse til den allerede fiksede `GenerertFlervalgScreen`-buggen. Triviell fix.
3. **[Høy] Worker: `LOCKED_MODEL` overstyrer klientens Haiku-valg med dyrere Sonnet** (linje 2, 462) — sannsynlig årsak til at budsjett-/rate-grenser nås uventet fort, som igjen trigger bug #1 over. Bør avklares/fikses samtidig med #1 for å faktisk løse "Nettverksfeil"-symptomet for godt.

*Runner-up verdt å nevne: den franske "à"-ordinjeksjonen i de-CH-ordbanken og widget-UUID-nullstillingen ved språkbytte er begge datakorrupsjons-/pålitelighetsbugs (Høy) som bør fikses før de-CH-sporet brukes videre.*

---

Ingen filer er endret. Vil du at noen av disse feilene skal fikses og pushes til GitHub?
