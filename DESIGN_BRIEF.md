# Design Brief — Spillarena, fransk-app

## Prosjekt
Personlig franskopplæringsapp (PWA) for én norsk bruker — A1/A2-nivå, dysleksi. React 18 + Vite, deploy til GitHub Pages. Ingen backend; AI-kall går via Cloudflare Worker.

Alle spillene er ferdig bygget og koblet til menyen. Oppgaven er å gjennomgå designet og foreslå/implementere forbedringer.

---

## Designsystem

**Fil:** `src/design-system.css`

### Farger — Dark mode (primærmodus, kalt "French midnight")
| Token | Verdi | Bruk |
|---|---|---|
| `--bg` | `#091526` | Sidebakgrunn |
| `--surface` | `#0f1f34` | Kort og paneler |
| `--border` | `rgba(255,255,255,0.07)` | Kanter |
| `--text` | `#e8edf5` | Primærtekst |
| `--text-subtle` | `rgba(232,237,245,0.48)` | Sekundærtekst, hints |
| `--cream` | `#e6d3a8` | Primær handlingsfarge (varm gull) |
| `--cream-deep` | `#c9b78d` | Dypere cream-variant |
| `--amber` | `#d4a574` | Streak/poeng |
| `--mustard` | `#c8783a` | Accentfarge varm |
| `--app-bg` | Gradient midnattsblå | Gradientbakgrunn |
| `--nav-bg` | `rgba(9,21,38,0.97)` | Bunnnavigasjon |

### Typografi
- **Overskrifter:** `Playfair Display` (serif) — `font-display`
- **Brødtekst:** `DM Sans` (sans-serif) — `font-body`
- **Skjermoverskrifter:** 28px / weight 500 / letter-spacing -0.5px
- **Kortoverskrifter:** 17px / weight 500
- **Hint/undertekst:** 11-13px / `text-subtle`

### Radius
- Knapper: 14px (`--radius-btn`)
- Kort/paneler: 18–20px (varierer — inkonsistent)
- Modaler: 24–32px

### Bunnnavigasjon
`BottomNav`-komponenten er alltid til stede. Høyde ≈ 84px. Alle scrollbare områder trenger `paddingBottom: 84+px`.

---

## Spillarena — alle 8 spill

Spillene vises i HomeScreen under "Spillarena"-seksjonen. Hvert spill har en screen-komponent i `src/screens/`.

---

### 1. Rollespill (`RollespillScreen.jsx`)
**Konsept:** Velg scenario (restaurant, kafé, butikk, tog, hotell, marked) → chat med Pierre (AI-kelner/betjent) → 6 runder → karakter 1–6 🎲

**Faser:** `select` → `loading` → `play` → `result`

**Play-layout:**
- Header: ← Avslutt | 🍽️ Scenario | 🇳🇴-toggle + 2/6
- Progress bar: 6 segmenter fylt med `--cream`
- Scrollbar chatområde med meldingsbobler (Pierre venstre, bruker høyre)
- **Fast bunnt panel** (position: fixed, bottom: 84): 3 valgknapper + fritekst-input

**Norsk-toggle:** 🇳🇴-knapp i header. Slår av/på norsk undertekst i bobler og valgknapper.

**Problemer å se på:**
- Fast bunntpanel kan overlappe chat på små skjermer
- Valgknapper er kompakte — vurder mer visuell differensiering
- Ingen visuell tilbakemelding på valgt svar

---

### 2. Kryssord (`KryssordScreen.jsx`)
**Konsept:** Kryssord generert fra ordbanken. Ord plasseres horisontalt/vertikalt i 15×15 rutenett. Norsk oversettelse = ledetekst.

**Faser:** `play` → `checked`

**Layout:**
- Header: ← Tilbake | Kryssord | Nytt kryss
- Rullebart rutenett (cellestørrelse ~36px, svarte/hvite ruter)
- Ledetekstliste (Vannrett / Loddrett med numre)
- **Inputpanel** dukker opp nederst når et ord er valgt: viser ordnummer + retning + norsk hint + tekstfelt
- "Sjekk"-knapp → grønt/rødt per ord

**Problemer å se på:**
- Rutenettet er trangt på mobil (36px celler)
- Valgt ord og markert celle mangler tydelig kontrast
- Inputpanelet er enkelt — kan bli mer ekspressivt

---

### 3. Historiediktat (`HistoriediktatScreen.jsx`)
**Konsept:** AI genererer en kort fransk tekst. Bruker lytter via TTS, fyller ut tomme felt.

**Faser:** `mode` → `loading` → `listen` → `fill` → `result`

**Modes:**
- **Enkel:** Teksten er synlig med tomme ___-felt inline
- **Avansert (ekte diktat):** Teksten er skjult. Kun nummererte inputfelt.

**Listen-fase:** Stor avspillingsknapp + lydbølge-CSS-animasjon + "Klar til å fylle inn"-knapp

**Fill-fase (Enkel):** Tekst med inline `<input>` i tekstflyten — felt bredde = svarets lengde

**Result:** Grønn/rød farge per ord, score X/N, Prøv igjen-knapp

**Problemer å se på:**
- Lytterfasen er minimalistisk — kan være mer engasjerende
- Modusvalgskjermen er god men kan ha mer visuell vekt
- Inline inputs bryter tekstflyten på mobil

---

### 4. Tallsudoku (`SudokuScreen.jsx`)
**Konsept:** Standard 9×9 Sudoku. Verdiene 1–9 representeres av franske tall. Bruker velger tallrekke (1–9, 11–19, ... 100–900), taster inn franske tallord i cellene.

**Faser:** `select` (velg tallrekke) → `play` → `done`

**Select-layout:**
- 11 rekker å velge mellom (knappeliste)

**Play-layout:**
- Header: ← | Tallsudoku | 🔢-emoji | Referanseknapp
- Referansekort (toggle): viser alle 9 tall i valgt rekke
- 9×9 rutenett med 3×3-boks-separatorer
- Valgt celle markeres med `--cream`-bakgrunn
- Gitte (forhåndsutfylte) tall er lysere/ikke klikkbare
- Input-panel under rutenettet: tekstfelt + → -knapp
- Feil markeres rødt, riktig markeres grønt

**Problemer å se på:**
- Rutenettceller er relativt store — tester om de skalerer OK på liten skjerm
- Talldisplay i cellene er dobbelt (tall + fransk ord) — kan bli trangt
- Referansekortet er bra men posisjonen kan optimaliseres

---

### 5. Memory Match (`MemoryMatchScreen.jsx`)
**Konsept:** 8 par kort (16 totalt). Hvert par: ett kort med fransk tekst, ett med norsk. Finn matchende par ved å snu kort.

**Faser:** `play` (med intro-state) → `done`

**Layout:**
- Header: ← | Memory | tid + antall feil
- 4×4 grid med kort
- Kort vises baksiden (mørk bakgrunn) → klikk → snur → fransk eller norsk tekst
- Matchede par forblir synlige (grønne/dempet)
- Done-skjerm: tid, feil, Spill igjen

**Problemer å se på:**
- Kortvendings-animasjon (CSS flip?) — sjekk om den er til stede og smooth
- 4×4 grid på liten mobil — cellestørrelse
- Visuell state for "to kort valgt, venter" vs "match!" vs "ikke match"

---

### 6. Tidspress (`TidspressScreen.jsx`)
**Konsept:** 60 sekunder. Vis ett ord (fransk eller norsk), velg riktig oversettelse fra 4 alternativer. Jo raskere, jo bedre. Highscore lagres.

**Faser:** `intro` → `play` → `done`

**Play-layout:**
- Stor nedtellingstimer (sirkel/bar?)
- Spørsmål i midten (det franske/norske ordet)
- 4 svaralternativer (store knapper)
- Score + streak-teller øverst

**Problemer å se på:**
- Highscore-funksjon er bra — vises den tydelig nok?
- Feedback (riktig/feil) mellom spørsmål — er den rask nok?
- Timerdisplay — er den engasjerende nok?

---

### 7. Lyddetektiv (`LyttedetektivScreen.jsx`)
**Konsept:** AI genererer 8 franske setninger med distractors. Hør setningen (TTS), velg riktig norsk oversettelse blant 4 nær-like alternativer.

**Faser:** `loading` → `play` (runde 1–8) → `result`

**Play-layout:**
- Runde X/8 progress
- Stor avspillingsknapp (hør setningen igjen)
- 4 svaralternativer (norske setninger som ligner hverandre)
- Feedback: riktig (grønt) eller feil (rødt + riktig svar vises)

**Problemer å se på:**
- Avspillingsknapp bør være svært fremtredende
- Alternativene er setninger (lengre tekst) — trenger god linjebrytning
- Runde-indikatoren

---

### 8. Bygg Setningen (`ByggSetningenScreen.jsx`)
**Konsept:** AI genererer 7 franske setninger med distractors. Bygg setningen ved å trykke/dra ordkort i riktig rekkefølge.

**Faser:** `loading` → `play` → `result`

**Play-layout:**
- Setningens norske oversettelse øverst
- "Byggefeltet": klikk ord for å legge til, i rekkefølge
- Ordbank nedst: alle ord + distractors som chips/pills
- Klikk på ord i byggefeltet for å fjerne
- "Sjekk"-knapp → riktig (grønt) eller feil (rødt + riktig svar)

**Problemer å se på:**
- Ordchips — størrelse, spacing, press-tilstand
- Byggefeltet — tydelig skille fra ordbank?
- Progressindikator for runde X/7

---

## Felles mønstre å vurdere

### Det som er bra nå
- Konsistent header-struktur (← Tilbake | Tittel | Handling)
- BottomNav alltid tilstede
- Mørk "French midnight"-palette er distinkt og vakker
- Cream/gull som primær handlingsfarge er gjennomgående

### Det som er inkonsistent
- **Border-radius:** 14px / 16px / 18px / 20px / 28px brukes om hverandre — ingen klar regel
- **Kortpadding:** 12px / 14px / 18px / 20px — ujevnt
- **Game headers:** Noen har progress bar, noen ikke. Ingen delt komponent.
- **Loading-states:** Noen bruker spinner, noen en enkel tekst — ikke uniformt
- **Result-skjermer:** Svært ulike per spill — vurder et felles "Ferdig"-mønster
- **Feil-states:** Farger er `rgba(248,113,113,0.xx)` (rød) — ikke design-token
- **Suksess-farger:** Ikke definert i design-system — noen bruker grønn hardkodet

### Forslag til hva Claude Design kan gjøre
1. Definer et felles `GameHeader`-mønster (← | icon + navn | progress X/N)
2. Rens opp border-radius — velg 14px for knapper, 18px for kort, 24px for modaler
3. Legg til `--color-success` og `--color-error` som design tokens og bruk dem konsistent
4. Vurder et felles `GameResult`-mønster som alle spill bruker på slutten
5. Se på om avspillingsknapper (Historiediktat, Lyddetektiv) kan ha et felles ikon/stil
6. Vurder micro-animasjoner ved svar (riktig/feil-feedback)

---

## Tekniske rammer
- **Kun inline styles** (ingen CSS modules/Tailwind) — all styling må skje i JSX
- **Design tokens** brukes via `var(--token)` i inline style-strenger
- **Ingen animasjonsbibliotek** i spillene (framer-motion finnes men brukes ikke i spill)
- **Mobile-first**, skjermbredde 375–430px primært
- **iOS PWA** — ingen browser-chrome, `100dvh`

---

## Filer å jobbe med
```
src/
  design-system.css              ← Design tokens (legg til nye tokens her)
  screens/
    RollespillScreen.jsx
    KryssordScreen.jsx
    HistoriediktatScreen.jsx
    SudokuScreen.jsx
    MemoryMatchScreen.jsx
    TidspressScreen.jsx
    LyttedetektivScreen.jsx
    ByggSetningenScreen.jsx
```
