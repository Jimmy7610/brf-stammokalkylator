# Produktionsplan

## Målbild

Produkten ska kunna användas av riktiga bostadsrättsföreningar för att planera och administrera stämmor på ett säkert, stabilt och begripligt sätt, och senare kunna distribueras via Apple Developer som app.

## Nuläge

Nuvarande repo är en fungerande prototyp med:

- datumkalkyl för ordinarie stämma
- medlemslista i klienten
- RSVP, check-in, fullmakter och röstlängd i frontend
- CSV-import och export
- enkel backend för e-postutskick via SMTP

Detta är bra för testning och intern validering, men inte tillräckligt för produktionsbruk.

## Huvudrisker

1. Medlemsdata lagras i webbläsaren i `localStorage`
2. Ingen autentisering eller behörighetsstyrning finns
3. Ingen databas eller säker server-side lagring finns
4. Backend saknar fullständig validering, audit-logg och rate limiting på bred front
5. Ingen testsvit finns för affärsregler eller kritiska flöden
6. Personuppgifter och samtycken behöver hanteras mer strukturerat

## Releasekriterier

Följande ska finnas innan skarp release:

- inloggning och sessionshantering
- föreningsseparerad data
- databas för möten, medlemmar, utskick och fullmakter
- säker server-side lagring av känslig data
- validering av all input i backend
- testade import- och exportflöden
- tydlig felhantering och loggning
- backup- och återställningsstrategi
- GDPR-genomgång
- mobiltest på riktiga Apple-enheter

## Fasindelning

### Fas 1: Hardening av prototyp

- städa teckenkodning och språk
- förbättra validering i klient och server
- lägga till säkerhetsheaders och rate limiting
- tydliggöra felmeddelanden och edge cases
- dokumentera arkitektur och datamodell

### Fas 2: Riktig backend och datalager

- införa databas
- flytta medlems- och mötesdata från `localStorage` till backend
- modellera förening, adress, medlem, stämma, utskick, fullmakt och röstlängd
- skapa API med autentisering

### Fas 3: Produktionsfunktioner

- utskickshistorik
- audit-logg
- bättre import/export
- bättre hantering av ombud och fullmaktsunderlag
- notifieringar och påminnelser

### Fas 4: App- och distributionsspår

- mobilanpassning på riktigt
- filflöden och export på iOS/iPadOS
- paketering för Apple-plattform
- TestFlight
- privacy- och metadataarbete för Apple Developer

## Rekommenderad arbetsordning

1. Hårdna nuvarande kodbas
2. Inför datamodell och backendstruktur
3. Lägg till auth och rättighetsstyrning
4. Flytta lagring till databas
5. Testa kärnflöden och säkerhet
6. Därefter börja App Store/TestFlight-spåret
