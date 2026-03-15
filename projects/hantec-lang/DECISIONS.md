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
