# DECISIONS.md — hantec-lang

## 2026-03-14 — v0.3 control flow jako bloková syntaxe
- Přidána bloková pravidla `kdyz <expr>` a `opakuj <expr>` uzavíraná klíčovým slovem `konec`.
- Parser používá stack AST bloků, aby podporoval zanoření a explicitní chyby při chybějícím/neočekávaném `konec`.
- Generátor JS mapuje:
  - `kdyz` → `if ((expr)) { ... }`
  - `opakuj` → `for` smyčka s interním čítačem `__hantec_iN`
- Důvod: minimální, čitelný krok roadmapy v0.3 bez zavádění složitých parser-combinatorů.
- Dopad: zpětně kompatibilní pro dosavadní v0.2 skripty.

## 2026-03-15 — v0.4 funkce jako další blokový konstruktor
- Přidána syntaxe `funkce <name>(<params>)` ... `konec` s podporou deklarací na top-level i vnořeně v blocích.
- `vrat <expr>` je povolen pouze uvnitř funkce; parser vrací explicitní chybu při použití mimo `funkce`.
- Validace podpisu kontroluje identifikátor jména funkce i všech parametrů a vrací konkrétní syntax error zprávy.
- Generátor JS mapuje funkce na standardní `function name(params) { ... }` deklarace a zachovává blokové odsazení těla.
- Verzovací markery transpileru a bytecode placeholderu byly posunuty na `v0.4`.

## 2026-03-15 — v0.4.1 web IDE syntax highlighting (MVP)
- Editor v `ide-web/index.html` byl přepracován na dvouvrstvý model (`textarea` + `pre`), aby šlo zachovat editaci i zvýraznění bez externích knihoven.
- Přidáno zvýraznění klíčových slov jazyka (`dej`, `rekni`, `spocitej`, `kdyz`, `opakuj`, `konec`, `funkce`, `vrat`), čísel a komentářů (`# ...`).
- Přidána synchronizace scrollu mezi vrstvami a handling `Tab` pro odsazení dvěma mezerami.
- Důvod: dokončit zbývající bod roadmapy v0.3 s minimální složitostí a bez zavádění editor frameworku.
- Dopad: IDE je čitelnější při psaní delších skriptů; runtime/kompilátor zůstaly beze změn.

## 2026-03-15 — v0.4.2 stdlib základy (MVP)
- Do generovaného JS byl přidán stdlib prelude se třemi funkcemi: `delka(value)`, `cislo(value)`, `text(value)`.
- Implementace je záměrně malá a zero-dependency: helpery jsou emitované přímo transpilerem, bez změny runtime vrstvy.
- `cislo` validuje převod pomocí `Number.isNaN` a vyhazuje explicitní chybu pro nečíselné vstupy.
- Marker transpileru/bytecode placeholderu byl posunut na `v0.4.2`.
- Důvod: uzavřít „Standard library basics“ bod roadmapy konzistentně s dosavadní architekturou (line-based parser + JS backend).
- Dopad: skripty mohou používat základní utility bez ručního psaní helper funkcí v každém programu.
