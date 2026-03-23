# BRF StämmoGuide

Ett beräknings- och administrationsstöd för BRF-stämmor. Appen hjälper till med datum för kallelse och handlingar, medlemslista, distributionsstatus, närvaro, fullmakter, röstlängd och e-postutskick via SMTP.

## Funktioner

- Beräknar viktiga datum för ordinarie föreningsstämma
- Hanterar medlemslista med RSVP, check-in, fullmakter och röstvärde
- Importerar och exporterar medlemslista som CSV
- Exporterar röstlängd som CSV
- Skickar kallelser via backend och SMTP
- Sparar adminläge server-side i `data/app-state.json`

## Lokal körning

1. Installera beroenden:

```bash
npm install
```

2. Kopiera `.env.example` till `.env` och fyll i SMTP-uppgifter om du vill använda e-postutskick.

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

Om SMTP saknas kommer appen fortfarande fungera för planering, CSV och röstlängd, men e-postutskick visar ett tydligt felmeddelande.

## Lagring

Nuvarande version sparar administrativt appdata i backendfilen `data/app-state.json` och använder lokal cache i webbläsaren som fallback. Det här är ett steg mot riktig server-side lagring, men bör på sikt ersättas av databas och autentisering.

## CSV-format

CSV-importen stödjer bland annat dessa kolumner:

- `name`
- `unit` eller adress/lägenhet
- `email`
- `voteWeight`
- `emailConsent`
- `distributionStatus`
- `rsvpStatus`
- `attendanceStatus`
- `proxyHolder`
- `proxyDocument`

## Viktigt

Verktyget ersätter inte juridisk rådgivning. Kontrollera alltid er förenings stadgar och aktuell lagstiftning.
