# BRF Hjälpen

## Produktidé

`BRF Hjälpen` ska vara ett växande arbetsverktyg för bostadsrättsföreningar, inte bara en stämmokalkylator. Datumräkning är en viktig funktion, men bara en del av helheten.

Produkten ska byggas modulärt så att nya delar kan läggas till utan att appen känns ombyggd varje gång.

## Grundprincip

Appen ska utgå från verkliga arbetsflöden i en BRF:

1. föreningen har sina fastigheter, adresser och medlemmar
2. styrelsen planerar en stämma eller annan aktivitet
3. verktyget hjälper till med regler, kallelser, dokument, svar och genomförande
4. data återanvänds i nästa steg i stället för att skrivas in flera gånger

## Startläge

Appen ska inte starta i datumkalkylatorn.

Den ska starta på en tydlig översiktssida med:

- vad BRF Hjälpen är
- vad man kan göra i appen
- vilken förening man arbetar i
- kommande aktiviteter
- snabblänkar till vanliga uppgifter

## Föreslagen navigation

### 1. Översikt

Startsida för hela produkten.

Ska innehålla:

- välkomstyta
- kort beskrivning av appen
- nästa viktiga datum
- kommande stämma eller aktivitet
- statuskort, till exempel:
  - antal medlemmar i register
  - antal utskick kvar
  - antal svar inkomna
  - antal fullmakter noterade
- genvägar till vanligaste funktionerna

### 2. Medlemsregister

Basen för allt annat.

Ska innehålla:

- namn
- adress
- lägenhet
- e-post
- telefon
- samtycke till e-post
- röstvärde eller andel
- koppling till adress/hus
- anteckningar
- eventuellt samägande eller medboende

Framtida utbyggnad:

- import från fil
- flera kontaktpersoner per lägenhet
- ägarhistorik
- medlemsstatus

### 3. Stämmor och möten

Lista över skapade och planerade stämmor.

Ska innehålla:

- skapa ny stämma
- typ av stämma
- datum
- plats
- agenda
- status
- kopplade dokument

Framtida utbyggnad:

- extra stämma
- digital eller hybrid stämma
- påminnelser

### 4. Datumhjälp

Den nuvarande kalkylatorn blir en egen modul.

Ska innehålla:

- beräkning av kallelsetider
- handlingar tillgängliga
- praktiska planeringsdatum
- tydlig skillnad mellan lag och praxis

Framtida utbyggnad:

- fler stadgevarianter
- specialärenden
- stöd för extra stämma

### 5. Kallelser och distribution

Central modul för utskick.

Ska byggas utifrån att pappersutskick ofta är nödvändigt eller säkrast.

Ska innehålla:

- val av distributionssätt per medlem
- pappersutskick
- e-postutskick
- kombinerat utskick
- status för varje medlem
- påminnelseflöden

Viktig produktprincip:

- appen får aldrig anta att e-post ensam är tillräckligt
- distributionsregler ska kunna styras av:
  - stadgar
  - samtycke
  - typ av ärende
  - administrativt val i föreningen

### 6. Närvaro, ombud och fullmakter

Ska innehålla:

- svar kommer eller kommer inte
- deltagande via ombud
- fullmaktsnotering
- incheckning på plats
- tydlig översikt inför stämman

Framtida utbyggnad:

- uppladdning av fullmaktsdokument
- valideringsflöde
- check-in på mobil eller surfplatta

### 7. Röstlängd

Ska byggas som ett eget slutsteg inför stämman.

Ska innehålla:

- vilka som är röstberättigade
- vem som företräder medlemmen
- antal röster
- anteckning om fullmakt
- möjlighet att låsa röstlängden

### 8. Dokument

Ska vara en egen modul längre fram.

Ska innehålla:

- kallelse
- dagordning
- motioner
- propositioner
- årsredovisning
- revisionsberättelse
- fullmaktsmall

## MVP för nästa riktiga generation

Det här bör vara första riktiga versionen av `BRF Hjälpen`:

1. startsida med tydlig översikt
2. medlemsregister
3. stämmomodul
4. datumhjälp
5. distributionsmodul med papper och e-post
6. RSVP, ombud och check-in
7. röstlängd

## Vad som inte ska styra arkitekturen

Produkten ska inte byggas som:

- en enda stor sida med allt blandat
- ett engångsverktyg för enbart årsstämma
- en app som antar att alla använder e-post
- en frontend där all affärslogik och all data bor i klienten

## Arkitekturprinciper för nästa omtag

- modulär navigation
- riktig backend
- databas
- föreningsseparerad data
- rollstyrning
- säker hantering av personuppgifter
- mobilanpassning från början
- tydlig design för att kunna växa utan att bli rörig

## Rekommenderat nästa steg

Nästa steg bör vara att ta fram:

1. informationsarkitektur
2. wireframe för startsida och huvudmoduler
3. teknisk struktur för ombyggnaden
4. beslut om vilka delar som ingår i första riktiga produktversionen
