# SECURITY_BASELINE_CHECKLIST

Praktický checklist minimální bezpečnostní baseline.

## 1) Branch protection
- [ ] Hlavní větev (`main`) má zakázaný přímý push.
- [ ] Merge do `main` je možný jen přes Pull Request.
- [ ] Zakázán force-push na chráněných větvích.
- [ ] Zakázáno mazání chráněných větví.

## 2) PR review gate
- [ ] Nastaveno minimálně 1 povinné review před merge.
- [ ] Autor PR nemůže schválit vlastní PR (pokud platforma umožňuje).
- [ ] Vyžadováno nové review po významných změnách (dismiss stale approvals).
- [ ] CODEOWNERS (pokud relevantní) pokrývá kritické části repozitáře.

## 3) CI gate
- [ ] Required status checks jsou zapnuté před merge.
- [ ] CI pipeline běží na každý PR do chráněné větve.
- [ ] Selhání CI blokuje merge.
- [ ] CI obsahuje aspoň základ: lint/test/build nebo syntax check.

## 4) Token hygiene
- [ ] Žádné tokeny/secrets nejsou hardcoded v repozitáři.
- [ ] Secrets jsou uložené v bezpečném úložišti (GitHub Secrets / vault).
- [ ] Staré/nepoužívané tokeny jsou revokované.
- [ ] Aktivní tokeny mají minimální nutná oprávnění (least privilege).
- [ ] Nastavena pravidelná rotace tokenů (perioda + vlastník).

## 5) 2FA
- [ ] 2FA je zapnuté na GitHub účtech se zápisem do repo.
- [ ] 2FA je zapnuté na e-mailu navázaném na vývojářské účty.
- [ ] 2FA je zapnuté na CI/CD a cloud účtech.
- [ ] Recovery metody jsou bezpečně uložené (ne v plaintextu).

---

## Stav a follow-up
- Datum kontroly:
- Odpovědná osoba:
- Otevřené body:
- Termín nápravy:
