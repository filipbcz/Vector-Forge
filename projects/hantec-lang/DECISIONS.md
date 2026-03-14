# DECISIONS.md — hantec-lang

## 2026-03-14 — v0.3 control flow jako bloková syntaxe
- Přidána bloková pravidla `kdyz <expr>` a `opakuj <expr>` uzavíraná klíčovým slovem `konec`.
- Parser používá stack AST bloků, aby podporoval zanoření a explicitní chyby při chybějícím/neočekávaném `konec`.
- Generátor JS mapuje:
  - `kdyz` → `if ((expr)) { ... }`
  - `opakuj` → `for` smyčka s interním čítačem `__hantec_iN`
- Důvod: minimální, čitelný krok roadmapy v0.3 bez zavádění složitých parser-combinatorů.
- Dopad: zpětně kompatibilní pro dosavadní v0.2 skripty.
