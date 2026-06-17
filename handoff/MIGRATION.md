# Spillarena — migrasjon til samlet system

Mål: alle 8 spill bruker samme header, progress, result, feedback-farger og radius.
Rekkefølge: **1) tokens → 2) global søk/erstatt → 3) bytt inn delte komponenter.**

---

## 1. Design tokens

Flett `design-system.additions.css` inn i `src/design-system.css` (se kommentarene i fila).
Etterpå finnes alle disse som `var(--…)` i begge temaer.

---

## 2. Global søk/erstatt (alle filer i `src/screens/`)

Disse hardkodede verdiene fins spredt utover. Erstatt rått — verdiene er valgt så de
matcher det som var ment, i begge temaer.

| Finn (hardkodet)                         | Erstatt med                     | Hvor det fins |
|------------------------------------------|---------------------------------|---------------|
| `#34d399`                                | `var(--color-success)`          | Tidspress, Memory, Lyttedetektiv, Bygg |
| `#5e9a6f`                                | `var(--color-success)`          | Historiediktat, Kryssord, Sudoku |
| `#f87171`                                | `var(--color-error)`            | Tidspress, Memory, Lyttedetektiv, Bygg, Rollespill |
| `#ef4444`                                | `var(--color-error)`            | Historiediktat, Sudoku, Kryssord |
| `#fbbf24`                                | `var(--color-streak)`           | Tidspress (🔥/×1.5), Memory, Lyttedetektiv |
| `#818cf8`                                | `var(--color-info)`             | Memory (fr-kort), Lyttedetektiv (setning + spinner) |
| `#1a1209`                                | `var(--on-accent)`              | **alle** cream-knapper (color: …) |
| `rgba(52,211,153,0.1x)` / `(94,154,111,0.1x)` | `var(--color-success-bg)`  | riktig-bakgrunner |
| `rgba(52,211,153,0.4–0.5)` / `(94,154,111,0.4–0.5)` | `var(--color-success-border)` | riktig-kanter |
| `rgba(248,113,113,0.1x)`                 | `var(--color-error-bg)`         | feil-bakgrunner |
| `rgba(248,113,113,0.4–0.6)`              | `var(--color-error-border)`     | feil-kanter |
| `rgba(129,140,248,0.1x–0.2)`             | `var(--color-info-bg)`          | Memory/Lyttedetektiv |

**Radius** — bytt til skalaen (kontroll 14 · kort 18 · feature 24 · chip 10):
- kort/paneler `borderRadius: 16/18/20` → `var(--radius-card)`
- knapper/alternativer `borderRadius: 14/16` → `var(--radius-control)`
- modaler/store kort `24/28/32` → `var(--radius-feature)`
- ordbrikker/små piller `10/12` → `var(--radius-chip)`

> Etter dette steget er fargene konsistente uten å røre layout. Gjør gjerne dette
> alene først og deploy — det er den største gevinsten med minst risiko.

---

## 3. Bytt inn delte komponenter

Legg `GameUI.jsx` i `src/components/`. Importér det du trenger per skjerm.
`BottomNav` beholdes som i dag — send den inn i `GameResult`/`LoadingState` via `bottomNav`-prop.

```jsx
import { GameHeader, GameProgress, GameResult, OptionButton, Chip,
         AudioButton, Waveform, LoadingState, Dock, PrimaryButton,
         GhostButton, CountPill, PromptLabel, Card, NAV_H } from "../components/GameUI.jsx";
```

### Header — alle 8 spill
Erstatt hvert håndlagde header-`<div>` (de varierer 48/52/56px topp):
```jsx
<GameHeader onBack={onBack} backLabel="Avslutt" title="Tidspress" icon="⚡"
  right={<CountPill tone="streak">🔥 {streak}</CountPill>} />
```

### Progress — Rollespill, Lyttedetektiv, Bygg (og legg til der det manglet)
Erstatt både segment-bars OG prikke-rekkene med:
```jsx
<GameProgress total={MAX_TURNS} current={turn} />
```

### Resultat — alle spill med en «ferdig»-skjerm
Erstatt de fire ulike result-blokkene (og de bespoke i Sudoku/Kryssord/Rollespill/Historiediktat):
```jsx
return <GameResult icon="🏆" title="Ny rekord!" subtitle={`Forrige: ${hi} → ${score}`}
  stats={[{label:"Poeng",value:score,tone:"accent"},
          {label:"Riktige",value:right,tone:"success"},
          {label:"Feil",value:wrong,tone:wrong?"error":"success"}]}
  primary={{label:"Prøv igjen", onClick:restart}}
  secondary={{label:"Hjem", onClick:onBack}}
  bottomNav={<BottomNav screen={screen} showWords={showWords} onNav={onNav} />} />;
```

### Svaralternativer — Tidspress, Lyttedetektiv
Erstatt de inline-stylede option-knappene med `OptionButton` + en state-funksjon:
```jsx
{options.map(opt => {
  let s = "idle";
  if (selected !== null) s = opt === correct ? "correct" : opt === selected ? "wrong" : "disabled";
  return <OptionButton key={opt} state={s} onClick={() => answer(opt)}>{opt}</OptionButton>;
})}
```

### Lyd — Lyttedetektiv, Historiediktat
Bytt de to ulike avspillingsknappene til samme:
```jsx
<Waveform active={playing} />
<AudioButton playing={playing} onClick={play} onSlow={() => speak(text, 0.45)} />
```

### Ordbrikker — Bygg setningen
`Chip` med `tone="idle|active|correct|wrong"` (byggefelt = `active`, fasit = `correct/wrong`).

### Fast handlingslinje — Kryssord, Bygg, Lyttedetektiv, Historiediktat
Erstatt `position:fixed; bottom:84`-blokkene med `<Dock>…</Dock>` (samme offset, samme gradient).

### Loading — alle AI-spill (Rollespill, Lyttedetektiv, Bygg, Historiediktat, Kryssord)
```jsx
if (phase === "loading") return <LoadingState icon="📖" label="Lager historien…"
  bottomNav={<BottomNav screen={screen} showWords={showWords} onNav={onNav} />} />;
```

---

## Per-skjerm sjekkliste

- [ ] **Rollespill** — header, GameProgress (har segment-bars), Dock for options, GameResult (terning). Behold 🇳🇴-toggle i `right`. La til synlig valgt-tilstand: marker valgt option `correct`-aktig i 300ms før neste tur.
- [ ] **Kryssord** — søk/erstatt `#5e9a6f`/`#ef4444`, kort→18 radius, Dock, evt. GameResult ved alle-riktig.
- [ ] **Historiediktat** — søk/erstatt `#5e9a6f`/`#ef4444`, AudioButton+Waveform i listen-fasen, Dock for «Sjekk svar», GameResult for resultatkortet.
- [ ] **Tallsudoku** — `#5e9a6f`/`#ef4444`→tokens, conflict-bg→`--color-error-bg`, `.anim-cell` på nyfylt celle, GameResult ved fullført (i dag inline).
- [ ] **Memory** — `#34d399`/`#f87171`/`#fbbf24`/`#818cf8`→tokens, `.anim-correct`/`.anim-wrong` på match/miss, GameResult.
- [ ] **Tidspress** — OptionButton, `#34d399/#f87171/#fbbf24`→tokens, GameResult, timerfarge bruker `--color-success/-streak/-error`.
- [ ] **Lyttedetektiv** — OptionButton, AudioButton, spinner-farge `#818cf8`→`var(--cream)` (én loader), GameProgress, Dock.
- [ ] **Bygg setningen** — Chip, GameProgress, Dock, `#34d399/#f87171`→tokens, GameResult.

> Tips: gjør steg 2 (farger) for alle først og verifiser i begge temaer, så steg 3 (komponenter)
> ett spill av gangen. Prototypen i `spillarena/index.html` viser fasit for hvert sluttresultat.
