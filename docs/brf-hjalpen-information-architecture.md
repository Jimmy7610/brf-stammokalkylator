# BRF Hjälpen - Informationsarkitektur och wireframe-flöde

## Syfte

Det här dokumentet beskriver hur den nya appen ska struktureras så att den:

- känns enkel att förstå direkt
- stödjer verkliga arbetsflöden i en BRF
- går att bygga ut över tid
- fungerar bra på både desktop och mobil

## Toppnivå i navigationen

Föreslagen huvudnavigation:

1. Översikt
2. Medlemmar
3. Stämmor
4. Kallelser
5. Närvaro
6. Röstlängd
7. Dokument
8. Inställningar

## Hierarki

### Översikt

Appens startsida.

Ska svara på:

- vad händer härnäst
- vad saknas inför nästa stämma
- vad behöver styrelsen göra nu

Innehåll:

- välkomstruta
- nästa stämma
- kort med viktiga statusvärden
- snabblänkar
- senaste aktivitet

### Medlemmar

Föreningens register.

Undersidor eller vyer:

- medlemslista
- medlemskort
- import/export
- adresser och hus

### Stämmor

Planering och administration av möten.

Undersidor eller vyer:

- lista över stämmor
- skapa ny stämma
- stämmodetaljer
- datumhjälp

### Kallelser

Distribution och uppföljning.

Undersidor eller vyer:

- utskicksöversikt
- välj distributionssätt
- e-postutskick
- pappersunderlag
- svar och status

### Närvaro

Praktisk hantering inför och under stämman.

Undersidor eller vyer:

- RSVP-status
- ombud och fullmakter
- check-in

### Röstlängd

Slutligt underlag för stämman.

Undersidor eller vyer:

- preliminär röstlängd
- kontroll av fullmakter
- lås röstlängd
- export

### Dokument

Samling av dokument.

Undersidor eller vyer:

- kallelse
- dagordning
- årsredovisning
- revisionsberättelse
- motioner
- fullmaktsmallar

### Inställningar

Föreningsspecifik konfiguration.

Undersidor eller vyer:

- föreningsuppgifter
- stadgeregler
- distributionsregler
- användare och roller

## Primära användarflöden

### Flöde 1: Första uppsättningen

1. Lägg upp förening
2. Lägg upp adresser och hus
3. Lägg upp eller importera medlemmar
4. Kontrollera kontaktuppgifter och samtycken

### Flöde 2: Skapa årsstämma

1. Skapa ny stämma
2. Välj datum, plats och typ
3. Få hjälp med juridiska datum
4. Koppla agenda och dokument

### Flöde 3: Skicka kallelse

1. Välj aktuell stämma
2. Se vilka medlemmar som ska få kallelse
3. Välj papper, e-post eller båda
4. Skicka eller exportera underlag
5. Följ status

### Flöde 4: Samla svar

1. Se vilka som svarat
2. Markera kommer eller kommer inte
3. Registrera ombud
4. Notera fullmakt

### Flöde 5: Genomför stämma

1. Öppna check-in-vy
2. Bocka av närvaro
3. Kontrollera ombud
4. Generera slutlig röstlängd

## Wireframe - Översikt

### Desktop

```text
+--------------------------------------------------------------+
| Header: BRF Hjälpen | Sök | Förening | Profil               |
+--------------------------------------------------------------+
| Nav                                                         |
| Översikt | Medlemmar | Stämmor | Kallelser | Närvaro | ... |
+--------------------------------------------------------------+
| Hero                                                        |
| "Allt ni behöver inför nästa stämma"                        |
| [Skapa stämma] [Öppna medlemsregister] [Räkna datum]        |
+----------------------+----------------------+---------------+
| Nästa stämma         | Status               | Snabbåtgärder |
| datum, plats, status | svar, utskick, ombud | länkar        |
+----------------------+----------------------+---------------+
| Att göra nu                                                |
| - Skicka papperskallelser till 7 medlemmar                 |
| - 3 fullmakter saknar kontroll                              |
| - Handlingar ska vara klara om 5 dagar                      |
+--------------------------------------------------------------+
| Senaste aktivitet                                           |
+--------------------------------------------------------------+
```

### Mobil

```text
+-----------------------------+
| BRF Hjälpen                 |
| Förening | Meny             |
+-----------------------------+
| Hero                        |
| Kort intro                  |
| [Skapa stämma]              |
| [Öppna medlemsregister]     |
+-----------------------------+
| Nästa stämma                |
+-----------------------------+
| Statuskort                  |
+-----------------------------+
| Att göra nu                 |
+-----------------------------+
```

## Wireframe - Medlemsregister

### Desktop

```text
+--------------------------------------------------------------+
| Medlemmar                                                    |
| Sök | Filter hus/adress | [Importera] [Lägg till medlem]    |
+--------------------------------------------------------------+
| Lista                                                        |
| Namn | Adress | Lgh | E-post | Samtycke | Röstvärde | Status|
+--------------------------------------------------------------+
| Sidopanel / detaljvy                                         |
| Kontaktuppgifter                                             |
| Samtycke                                                     |
| Anteckningar                                                 |
| Ombud / särskild info                                        |
+--------------------------------------------------------------+
```

### Viktiga designprinciper

- adress och lägenhet ska vara separata fält i datamodellen
- flera hus ska vara enkla att filtrera på
- samtycke ska vara tydligt synligt

## Wireframe - Stämmosida

```text
+--------------------------------------------------------------+
| Årsstämma 2027                                               |
| datum | plats | status | [Redigera]                          |
+--------------------------------------------------------------+
| Flikar: Översikt | Datumhjälp | Kallelser | Närvaro | Röster |
+--------------------------------------------------------------+
| Översikt                                                     |
| - grundinfo                                                  |
| - viktiga deadlines                                          |
| - antal utskick klara                                        |
| - antal svar inkomna                                         |
+--------------------------------------------------------------+
```

## Wireframe - Kallelser

```text
+--------------------------------------------------------------+
| Kallelser                                                    |
| Stämma: Årsstämma 2027                                       |
+--------------------------------------------------------------+
| Filter: Alla | Papper | E-post | Ej skickad | Klara         |
+--------------------------------------------------------------+
| Medlem | Adress | Kanal | Status | Samtycke | Åtgärd        |
+--------------------------------------------------------------+
| Anna   | Tallgatan 4 | Papper + e-post | Skickad | Ja | ... |
| Bo     | Tallgatan 6 | Papper           | Klar    | Nej| ... |
+--------------------------------------------------------------+
| [Exportera papperslista] [Skicka e-post]                     |
+--------------------------------------------------------------+
```

## Wireframe - Närvaro och ombud

```text
+--------------------------------------------------------------+
| Närvaro                                                      |
| Sök medlem                                                   |
+--------------------------------------------------------------+
| Medlem | RSVP | Ombud | Fullmakt | Check-in                 |
+--------------------------------------------------------------+
| Anna   | Kommer | -   | -        | Närvarande               |
| Bo     | Ombud  | Eva | Mottagen | Via ombud               |
+--------------------------------------------------------------+
```

## Wireframe - Röstlängd

```text
+--------------------------------------------------------------+
| Röstlängd                                                    |
| Totalt antal röster | Antal närvarande | Antal ombud         |
+--------------------------------------------------------------+
| Medlem | Företräds av | Röster | Fullmakt | Klar             |
+--------------------------------------------------------------+
| [Lås röstlängd] [Exportera PDF] [Exportera CSV]              |
+--------------------------------------------------------------+
```

## Komponenter som bör återanvändas

För att göra appen konsekvent bör följande UI-komponenter återanvändas:

- toppnavigering
- statuskort
- listtabeller
- filterrad
- tomma lägen
- stegkort
- varningsblock
- sidopanel eller detaljpanel
- åtgärdsknappar

## Mobilprinciper

- navigationen måste fungera tydligt i menyformat
- stora knappar för check-in
- korta formulär per skärm
- viktiga statusvärden ska synas utan att man scrollar långt
- tabellvyer ska brytas ner till kort på små skärmar

## Rekommenderad byggordning

1. Översikt
2. Medlemsregister
3. Stämmor
4. Datumhjälp
5. Kallelser och distribution
6. Närvaro och ombud
7. Röstlängd
8. Dokument
