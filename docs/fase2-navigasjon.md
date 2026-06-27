# Fase 2 — Læringsflyt & navigasjonsarkitektur

Designdokument. Ingen kode her — implementeres i Fase 5.

## 1. Krav & rammer

**Bruker:** én person, A1/A2 fransk, dysleksi. Personlig verktøy, ikke produksjon.

**Funksjonelt:**
- Komme raskt i gang med «dagens» læring uten å velge fra 29 alternativer
- Likevel kunne finne og starte hvilken som helst av de 29 øvelsene når man vil
- Samtale (Pierre) skal være en tydelig destinasjon, ikke en snarvei
- Bevare alle eksisterende øvelser og data (localStorage)

**Ikke-funksjonelt / begrensninger:**
- Lav kognitiv last: maks 3–4 valg per skjerm, store trykkmål, ikoner + tekst
- Ingen backend; all state i localStorage
- Minst mulig refactor av selve øvelsesskjermene (de fungerer bra — Fase 1)
- Endring skal være additiv: `onStart(id)`-dispatcheren (App.jsx:526+) beholdes uendret

## 2. Diagnose — rotårsak

Bunn-nav (`handleNav`, App.jsx:848-853) blander to konsepter:

| Fane | I dag | Type |
|------|-------|------|
| Hjem | `setScreen("home")` | **Sted** |
| Øv | `startGlose()` | **Handling** (hopper inn i én øvelse) |
| Snakk | `setScreen("voice")` | **Handling** (hopper inn i mikrofon) |
| Banken | `bankScreen="bank"` | **Sted** |

To faner er destinasjoner, to er øvelse-snarveier. Konsekvenser:
- **(P1)** «Øv» gir ingen oversikt — de 29 øvelsene finnes bare ved å scrolle Hjem (3 `TaskSection`-lister: Gloser 7, Grammatikk 12, Spillarena 10).
- **(P2)** «Snakk» har «← Tilbake» fordi den egentlig er en øvelsesskjerm forkledd som fane — «tilbake til hva?».
- **(P3)** Hjem gjør to jobber dårlig samtidig: kuratert daglig flyt OG fullt øvelsesbibliotek.

## 3. Løsning — destinasjoner, ikke snarveier

Behold 4 faner, men gjør hver til et ekte *sted*:

```
┌─────────┬─────────┬─────────┬─────────┐
│  Hjem   │   Øv    │  Snakk  │ Banken  │
│ dagens  │ bibliotek│ samtale │  ord +  │
│  flyt   │ (29 stk) │  hub    │ grammatikk│
└─────────┴─────────┴─────────┴─────────┘
```

- **Hjem** = dagens vei (kuratert). Én tydelig CTA + fremgang. Slutter å liste alle 29 → løser også Fase 1s «Hjem-overload».
- **Øv** = øvelsesbibliotek (hub). Alle 29 gruppert. Erstatter «hopp inn i glose».
- **Snakk** = samtale-hub. Lander på et valg (Pierre fritt / rollespill / teksthjelp), ikke rett i mikrofonen → fjerner «Tilbake til hva?».
- **Banken** = uendret (appens sterkeste skjerm).

Nøkkelidé: **Hjem = dagens vei. Øv = hele biblioteket.** I dag gjør Hjem begge.

## 4. Øvelses-hierarki (29 → 4 seksjoner)

I dag: teknisk inndeling (Glose/Grammatikk/Spill). Ny: etter *hvilken ferdighet brukeren øver* — mer intuitivt for nybegynner.

Øv-hub, øverst→ned (store kort, maks 4 seksjoner):

**① Anbefalt nå** — 1 kort
Gjenbruker `pierreRecommend`-logikken (HomeScreen.jsx:1086). Alltid ett tydelig startpunkt.

**② Gloser** — vokabular
`glose`, `ordoversettelse`, `flervalg`, `si-ordet`
+ nivåfiltrene: `glose-tier-0`, `glose-tier-1-2`, `glose-tier-3-4` (samlet bak «Øv etter nivå»-rad, ikke 3 separate kort)

**③ Setninger & grammatikk** — produksjon + regler
`grammatikk-teori`, `grammatikk-ovelse`, `artikkel-ovelse`, `bøying-ovelse`, `boyningstabell`, `oversett-grammatikken`, `grammatikk-flervalg`, `oversett-setningen`, `generert-flervalg`, `si-setningen`, `bygg-setningen`, `historiediktat`

**④ Spill** — lystbetont drilling
`memory-match`, `tidspress`, `lyttedetektiv`, `kategorisortering`, `ordstokken`, `kryssord`, `sudoku`

**Flyttes til Snakk-hub:** `fri`, `rollespill`, `teksthjelp` (samtale/produksjon med Pierre).

> Dysleksi-hensyn: seksjon ③ har 12 øvelser. Vis 3–4 som kort + «Vis alle»-utvidelse, så førsteinntrykket ikke er en vegg av valg.

## 5. Daglig flyt

```
        ┌──────────────────────────────┐
        │            HJEM              │
        │  «Bonjour, Peter»            │
        │  ┌────────────────────────┐  │
        │  │ ANBEFALT: dagens gloser│  │ ← én primær CTA (pierreRecommend)
        │  │        [ Start → ]     │  │
        │  └────────────────────────┘  │
        │  Dagens mål: ●●●○○ 60/150    │ ← ringen/baren, ett trykk = modal
        │  Streak · Ord lært           │
        └──────────────┬───────────────┘
                       │ vil ha mer / noe annet
                       ▼
        ┌──────────────────────────────┐
        │             ØV               │
        │  ① Anbefalt nå               │
        │  ② Gloser                    │
        │  ③ Setninger & grammatikk    │
        │  ④ Spill                     │
        └──────────────────────────────┘
```

- Hjem svarer på «hva bør jeg gjøre nå?» (ett svar).
- Øv svarer på «jeg vil velge selv» (hele biblioteket).
- Fullført dagens → Hjem viser «Ferdig for i dag ✓» + lenke til Øv for ekstra.

## 6. Navigasjonsendring (Fase 5-spec)

`handleNav` (App.jsx:848-853) endres fra handlinger til destinasjoner:

| Fane (id) | I dag | Nytt |
|-----------|-------|------|
| `home` | `setScreen("home")` | uendret |
| `glose` (Øv) | `startGlose()` | `setScreen("ovelser")` → ny hub-skjerm |
| `fri` (Snakk) | `setScreen("voice")` | `setScreen("snakk")` → ny hub-skjerm |
| `words` (Banken) | `bankScreen="bank"` | uendret |

- **Ny skjerm `OvelserScreen`**: rendrer de samme `GLOSE_ITEMS`/`SPILL_ITEMS`/`GRAMMATIKK_ITEMS` (flyttes ut av HomeScreen til delt modul) i den nye 4-seksjons-strukturen. Hvert kort kaller eksisterende `onStart(id)` — **null endring i dispatcheren**.
- **Ny skjerm `SnakkScreen`**: 3 valg (Pierre fritt → `voice`, Rollespill → `rollespill`, Teksthjelp → `teksthjelp`). Hvert valg = `onStart(id)`.
- **HomeScreen**: fjern de 3 `TaskSection`-listene (linje 1429-1454). Behold/forsterk dagens-CTA + fremgang.
- **Tilbake-knapp på øvelser** peker nå naturlig til Øv-huben (eller Hjem hvis startet derfra) — sentinel-historikken (App.jsx:253) håndterer dette allerede.

## 7. Avveiinger

| Valg | Fordel | Kostnad |
|------|--------|---------|
| Behold 4 faner | Kjent muskelminne, ingen ny IA å lære | «Øv» betyr nå hub, ikke direkte-start (ett ekstra trykk for å øve glose) |
| Hjem mister øvelseslistene | Roligere, kuratert daglig flyt | Power-bruker må til Øv for spesifikk øvelse |
| Ferdighetsbasert gruppering | Mer intuitivt for nybegynner | Avviker fra dagens teknisk inndeling — krever ny-tilvenning én gang |
| Gjenbruk `onStart`-dispatcher | Minimal risiko, alle øvelser virker som før | Ingen reell ulempe |

**Det ekstra trykket for «Øv glose»** kompenseres av at Hjem alltid har dagens glose som primær CTA — det vanligste tilfellet er fortsatt ett trykk.

## 8. Hva jeg ville revurdert senere

- Hvis Øv-huben føles tung: gjør «Anbefalt nå» til en mini-onboarding som lærer brukeren hvor ting er, vis den bare første ukene.
- Seksjon ③ (12 øvelser) er fortsatt størst — vurder å splitte «Grammatikk» og «Setninger» hvis brukeren synes den er rotete i praksis.
- Vurder å la Hjem huske «sist brukte øvelse» som ekstra snarvei hvis daglig CTA ikke treffer.

## 9. Implementeringsrekkefølge (Fase 5)

1. Flytt `GLOSE_ITEMS`/`SPILL_ITEMS`/`GRAMMATIKK_ITEMS` til delt modul (f.eks. `src/exercises.js`).
2. Lag `OvelserScreen` + `SnakkScreen`.
3. Endre `handleNav` til destinasjoner.
4. Slank HomeScreen (fjern de 3 listene, forsterk CTA).
5. Verifiser alle 29 øvelser starter + Tilbake-flyt (Fase 6).
