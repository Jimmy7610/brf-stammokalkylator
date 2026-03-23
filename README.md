# BRF Hjälpen

BRF Hjälpen är en arbetsyta för bostadsrättsföreningens stämmor och administration. Appen samlar datumhjälp, medlemsregister, kallelser, pappersutskrifter, närvaro, ombud och röstlängd i ett och samma flöde.

Det här är inte längre bara en datumkalkylator. Tanken är att styrelsen ska kunna gå från planering till genomförd stämma utan att hoppa mellan separata dokument, kalkylblad och manuella listor.

## Det appen gör idag

- Visar en landningssida för `BRF Hjälpen` och öppnar sedan själva appen
- Hanterar flera stämmor med egen mötesinformation per stämma
- Räknar fram viktiga datum inför ordinarie stämma
- Lagrar medlemsregister med adress, lägenhet, kontaktuppgifter, distributionspreferens och röstvärde
- Hanterar distributionsstatus, RSVP, check-in, ombud och fullmakt per aktiv stämma
- Skapar röstlängd utifrån medlemsdata och närvarostatus
- Importerar och exporterar medlemsdata som CSV
- Exporterar röstlängd som CSV
- Förhandsgranskar och skriver ut generell papperskallelse
- Skickar e-postkallelser via backend och SMTP
- Sparar appdata i `data/app-state.json`

## Produktstruktur

Appen är uppdelad i följande delar:

- `Översikt`
  Ger snabbstatus, visar nästa steg och listar stämmor.
- `Datumhjälp`
  Hjälper styrelsen att räkna fram hållpunkter för kallelse och handlingar.
- `Medlemmar`
  Samlar medlemsregister och distributionsrelevant information.
- `Kallelser`
  Hanterar mötesdetaljer, distribution, e-post och papperskallelse.
- `Röstlängd`
  Visar vilka som deltar, ombud, fullmakter och aktuellt röstunderlag.

## Teknik

- Frontend: statisk HTML, CSS och JavaScript
- Backend: `Express`
- E-post: `Nodemailer`
- Lagring: filbaserat app-state i `data/app-state.json`

## Lokal körning

1. Installera beroenden:

```bash
npm install
```

2. Kopiera `.env.example` till `.env` om du vill använda e-postutskick.

3. Starta appen:

```bash
npm start
```

4. Öppna [http://127.0.0.1:4173](http://127.0.0.1:4173)

## SMTP-konfiguration

Följande miljövariabler används:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Om SMTP inte är konfigurerat fungerar appen fortfarande för planering, medlemsregister, preview, CSV och röstlängd, men e-postutskick kommer inte att skickas.

## Lagring

Nuvarande version sparar appdata i backendfilen `data/app-state.json`. Klienten använder även lokal cache i webbläsaren för att förbättra upplevelsen och kunna återhämta sig om servern inte svarar direkt.

Det här är fortfarande en mellanlösning. För produktion bör lagringen på sikt flyttas till databas med autentisering, behörigheter och revisionsspår.

## CSV-format

CSV-importen stödjer bland annat dessa kolumner:

- `name`
- `address`
- `unit`
- `email`
- `phone`
- `voteWeight`
- `emailConsent`
- `preferredDistribution`
- `ownershipType`

Exporten använder appens aktuella medlemsdata och röstlängd.

## Dokumentation

Det finns även produkt- och planeringsdokument i `docs/`:

- `docs/brf-hjalpen-product-structure.md`
- `docs/brf-hjalpen-information-architecture.md`
- `docs/production-plan.md`
- `docs/data-model.md`
- `docs/security-checklist.md`

## Viktigt

BRF Hjälpen är ett administrativt stöd, inte juridisk rådgivning. Kontrollera alltid föreningens stadgar, distributionskrav, särskilda ärenden och aktuell lagstiftning innan ni skickar kallelser eller använder underlaget vid stämman.
