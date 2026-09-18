# L'Atelier (Språkappen)

Personlig språkapp for én norsk elev (A1/A2, dysleksi): **fransk** og **sveitsertysk** (Schweizer Hochdeutsch). React + Vite, installerbar PWA, AI-tutor via Claude.

## Arkitektur

```
Nettleser (GitHub Pages, PWA) → Cloudflare Worker (fransk-proxy) → Anthropic API
                                        └─ KV: rate limits, push-abonnement, widget-data
```

- Ingen backend utover Worker. API-nøkkelen ligger kun som Worker-secret.
- Brukerdata (ord, fremgang, profil) ligger i `localStorage`, adskilt per språk (`src/storage-namespace.js`). Ta **sikkerhetskopi** i Brukerprofil → «Lagre kopi».
- Tale bruker nettleserens Web Speech API (`src/tts.js`, `src/hooks/useVoiceRecognition.jsx`).

## Kommandoer

```bash
npm run dev      # utviklingsserver
npm run build    # produksjonsbygg
npm run lint     # ESLint
npm test         # vitest (app + Worker)
```

## Miljøvariabler og secrets

| Navn | Hvor | Bruk |
|---|---|---|
| `VITE_PROXY_URL` | `.env` / GitHub secret | Worker-URL |
| `VITE_APP_TOKEN` | `.env` / GitHub secret | Delt token sendt til Worker (ligger i bundle, ikke en ekte hemmelighet) |
| `VITE_VAPID_PUBLIC_KEY` | `.env` / GitHub secret | Web Push |
| `ANTHROPIC_API_KEY`, `CLIENT_TOKEN`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Worker secrets (`wrangler secret put`) | Server-side |

Se `.env.example`. Sett også en **spend limit** i Anthropic Console.

## Deploy

- **App:** push til `main` → GitHub Actions (lint, test, bygg) → GitHub Pages.
- **Worker:** `wrangler login` og `wrangler deploy` (bruker `wrangler.toml`). Valgfritt: sett repo-variabel `WORKER_AUTO_DEPLOY=true` og secrets `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` for automatisk deploy (`.github/workflows/deploy-worker.yml`).

## Struktur

```
src/
  App.jsx, main.jsx      rot, routing, feilgrense
  api.js                 proxyFetch mot Worker (token, timeout)
  tts.js                 felles tekst-til-tale
  backup.js              JSON-backup/restore
  utils.jsx              ord, poeng, repetisjon, streak, dato
  languages/             fr.js, de-ch.js (språkmoduler)
  screens/, components/  skjermer og øvelser (sjeldne skjermer er lazy)
  hooks/                 tale, samtale, push, tema
cloudflare-worker.js     proxy, /voice, push, widget
```

## Kjente begrensninger

- Hele vokabularet (begge språk) ligger i hovedbundlen.
- Delt app-token er ikke ekte autentisering; Worker beskyttes av rate limits og daglig budsjett.
- Uttalevurdering sammenligner transkripsjon, den måler ikke uttale.
