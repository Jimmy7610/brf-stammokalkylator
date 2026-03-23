# Säkerhetschecklista

## Grundskydd

- använd HTTPS i alla miljöer utanför lokal utveckling
- lagra aldrig SMTP-hemligheter i frontend
- använd miljövariabler och hemlighetshantering i drift
- sätt säkra HTTP-headers
- begränsa request-storlekar
- inför rate limiting för känsliga endpoints

## Input och validering

- validera all input i backend
- sätt maxlängder på textfält
- validera e-postformat
- validera CSV-rader och ge tydliga fel
- lita aldrig på klientens statusfält eller röstvärden

## Behörighet

- inför användarkonton
- separera data per förening
- ha roller och rättigheter
- logga känsliga administrativa åtgärder

## Personuppgifter

- minimera vilken data som lagras
- dokumentera samtycke för e-postutskick
- definiera gallringsregler
- skydda exporterad CSV och fullmaktsdata

## Drift

- ha revisionslogg
- ha backup och återställning
- övervaka fel
- logga inte känsliga personuppgifter i klartext i onödan

## Apple-spår

- dokumentera datainsamling för App Privacy
- säkerställ att filimport/export fungerar säkert på iOS
- testa behörigheter, nätverksfel och offline-fall
