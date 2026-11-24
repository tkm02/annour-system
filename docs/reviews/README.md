# Rapports de revue

Rapports produits par les agents reviewers (code, sécurité, UX). Nommage :
`<agent>-AAAA-MM-JJ[-<périmètre>].md`, par exemple `security-2026-11-20-finance.md` ou `ux-2026-11-20.md`.

Format commun :
```
## Rapport <agent> — <périmètre> — <date>
### Résumé (3 lignes max) + verdict : ✅ OK / ⚠️ OK avec réserves / ❌ À corriger
### Constats introduits par ce changement
| Sévérité | Fichier:ligne | Problème | Correction proposée |
### Constats préexistants (→ TECH_DEBT.md, non bloquants)
### Points positifs
### Actions recommandées (ordonnées)
```
Sévérités : 🔴 Bloquant · 🟠 Important · 🟡 Mineur · 💡 Suggestion.
Aucune valeur secrète ni donnée personnelle réelle dans un rapport.
