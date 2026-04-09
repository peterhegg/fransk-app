# Mon Français

Personlig franskopplæringsapp bygget med React og Claude AI. Tilpasset norske nybegynnere med dysleksi som ønsker å lære seg fransk gjennom naturlig eksponering og praktisk bruk.

---

## Arkitektur

```
Nettleser (GitHub Pages) → Cloudflare Worker → Anthropic API
```

API-nøkkelen ligger aldri i frontend-koden. Den er lagret som en secret i Cloudflare Workers og eksponeres aldri i nettleseren.

---

## Funksjoner

- **Glosekort** med automatisk lagring av ord du lærer
- **Samtaleøvelse** med en virtuell franskmann (Pierre)
- **Lesehjelp** for setninger fra dine egne franske bøker
- **Fri modus** for spørsmål om grammatikk, uttale og kultur
- Fonetisk uttale på norsk for alle nye ord
- Ordsamling som huskes mellom besøk via localStorage
- Fungerer som PWA og kan legges til på hjemskjermen

---

## Kom i gang

### Krav

- Node.js 18 eller nyere
- En Anthropic API-nøkkel (hentes på [console.anthropic.com](https://console.anthropic.com))
- En gratis [Cloudflare](https://cloudflare.com)-konto

### Installasjon

```bash
git clone https://github.com/peterhegg/fransk-app.git
cd fransk-app
npm install
```

### 1. Deploy Cloudflare Worker

```bash
npm install -g wrangler
wrangler login
wrangler deploy cloudflare-worker.js --name fransk-proxy
wrangler secret put ANTHROPIC_API_KEY
```

Wrangler vil spørre om API-nøkkelen din. Den lagres kryptert i Cloudflare.

Noter URL-en du får tilbake, f.eks.:
```
https://fransk-proxy.DITTBRUKERNAVN.workers.dev
```

### 2. Kjør lokalt

Lag en `.env`-fil:

```bash
cp .env.example .env
```

Åpne `.env` og lim inn Worker-URL-en:

```
VITE_PROXY_URL=https://fransk-proxy.DITTBRUKERNAVN.workers.dev
```

Start utviklingsserver:

```bash
npm run dev
```

Åpne [http://localhost:5173/fransk-app/](http://localhost:5173/fransk-app/)

---

## Deploy til GitHub Pages

### Første gang

1. Lag et nytt repo på GitHub med navn `fransk-app`
2. Legg til Worker-URL-en som en GitHub Secret:
   - Settings > Secrets and variables > Actions
   - New repository secret: `VITE_PROXY_URL` = Worker-URL-en din
3. Aktiver GitHub Pages:
   - Settings > Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages`

### Oppdateringer

Hver push til `main` deployer automatisk:

```bash
git add .
git commit -m "oppdatering"
git push
```

Appen er tilgjengelig på:

```
https://peterhegg.github.io/fransk-app/
```

---

## Legg til på hjemskjermen (Android)

1. Åpne appen i Chrome
2. Trykk på de tre prikkene øverst til høyre
3. Velg «Legg til på startskjermen»

---

## Teknologi

- [React](https://react.dev)
- [Vite](https://vitejs.dev)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app)
- [Cloudflare Workers](https://workers.cloudflare.com)
- [Anthropic Claude API](https://docs.anthropic.com)

---

## Personvern

API-nøkkelen din ligger aldri i koden eller JS-bundles. Den er lagret kun i Cloudflare og brukes server-side. Ordlisten lagres lokalt i nettleseren din og sendes aldri noe sted.
