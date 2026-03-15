# Publishing strategy (v0.5.2)

Cíl: mít opakovatelný release flow bez náhodného publikování interních souborů.

## Stav

- `package.json` zůstává `"private": true` (ochrana proti omylu).
- Přidaný whitelist `files` omezuje obsah balíčku jen na runtime/compiler/IDE/docs/examples.
- `npm run pack:check` dělá `npm pack --dry-run --json` + validaci povinných/zakázaných souborů.
- `prepublishOnly` gate = `npm test && npm run pack:check`.

## Release checklist (až přijde čas publish)

1. Zvýšit verzi (`npm version <patch|minor|major>`).
2. Dočasně přepnout `private` na `false`.
3. Spustit:
   - `npm test`
   - `npm run pack:check`
4. Ověřit tarball ručně:
   - `npm pack`
   - `tar -tf mulda-lang-<ver>.tgz`
5. Publikovat:
   - `npm publish --access public`
6. Vrátit `private` podle požadovaného režimu repozitáře.

## Poznámky k bezpečnosti

- Jazyk runtime stále používá JS evaluaci výrazů (`new Function`), takže release musí jasně uvádět model důvěry: jen trusted input.
- `pack:check` explicitně zakazuje publikaci `tests/`, `dist/` a `.github/`, aby se neposílal šum ani interní artefakty.
