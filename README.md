# BRF Hjälpen

BRF Hjälpen är en arbetsyta för bostadsrättsföreningens stämmor och administration. Appen samlar datumhjälp, medlemsregister, kallelser, pappersutskrifter, närvaro, ombud och röstlängd i ett och samma flöde.

Den här versionen är förberedd för Cloudflare:

- frontend serveras som statiska assets
- backend körs som en Cloudflare Worker
- appdata lagras i Cloudflare D1
- e-postutskick kan skickas via Resend

## Det appen gör idag

- visar en landningssida för `BRF Hjälpen`
- hanterar flera stämmor med egen mötesinformation per stämma
- räknar fram viktiga datum inför ordinarie stämma
- lagrar medlemsregister med adress, lägenhet, kontaktuppgifter, distributionspreferens och röstvärde
- hanterar distributionsstatus, RSVP, check-in, ombud och fullmakt per aktiv stämma
- skapar röstlängd utifrån medlemsdata och närvarostatus
- importerar och exporterar medlemsdata som CSV
- exporterar röstlängd som CSV
- förhandsgranskar och skriver ut generell papperskallelse
- skickar e-postkallelser via Worker-API om Resend är konfigurerat

## Cloudflare-arkitektur

- Worker: `src/worker.js`
- statiska filer: byggs till `dist/public`
- Worker-konfig: `wrangler.jsonc`
- D1-migrationer: `migrations/`

Nuvarande D1-upplägg lagrar appens adminstate som JSON i en tabell för att göra migreringen enkel. Det är en bra första Cloudflare-version, men på sikt bör detta delas upp i riktiga tabeller för medlemmar, stämmor och mötesspecifika statusfält.

## Kom igång lokalt

1. Installera beroenden:

```bash
npm install
```

2. Logga in i Cloudflare:

```bash
npx wrangler login
```

3. Bygg frontend-assets för Worker:

```bash
npm run prepare:cloudflare
```

4. Starta lokal utvecklingsmiljö:

```bash
npm run dev
```

## Skapa D1-databas

1. Skapa databasen:

```bash
npx wrangler d1 create brf-hjalpen
```

2. Kopiera `database_id` från kommandots svar.

3. Öppna `wrangler.jsonc` och ersätt:

```json
"database_id": "REPLACE_WITH_YOUR_D1_DATABASE_ID"
```

med ditt riktiga D1-id.

4. Kör migrationen:

```bash
npm run cf:d1:migrate
```

## Deploy till Cloudflare

När `wrangler.jsonc` har rätt D1-id:

```bash
npm run deploy
```

Efter deploy kan du koppla en custom domain som `brf.taren.se` till Workern i Cloudflare.

## Miljövariabler

Om du vill använda e-postutskick behöver du sätta följande Worker-secrets:

- `RESEND_API_KEY`
- `RESEND_FROM`

Exempel:

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put RESEND_FROM
```

Om dessa saknas fungerar appen fortfarande för planering, medlemsregister, preview, CSV och röstlängd, men e-postutskick kommer inte att skickas.

## Viktiga filer

- `src/worker.js`
- `wrangler.jsonc`
- `migrations/0001_initial.sql`
- `scripts/prepare-cloudflare.mjs`
- `index.html`
- `app.js`
- `styles.css`

## Dokumentation

Det finns även produkt- och planeringsdokument i `docs/`:

- `docs/brf-hjalpen-product-structure.md`
- `docs/brf-hjalpen-information-architecture.md`
- `docs/production-plan.md`
- `docs/data-model.md`
- `docs/security-checklist.md`

## Viktigt

BRF Hjälpen är ett administrativt stöd, inte juridisk rådgivning. Kontrollera alltid föreningens stadgar, distributionskrav, särskilda ärenden och aktuell lagstiftning innan ni skickar kallelser eller använder underlaget vid stämman.
