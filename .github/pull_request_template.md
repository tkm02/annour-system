<!--
Titre de la PR au format Conventional Commits, ex. « feat: export des consultations ».
Branche cible : mdev (main uniquement depuis mdev ou pour un hotfix).
Ne jamais inclure de secret, de token ni de donnée personnelle réelle.
-->

## Résumé
<!-- Quoi et pourquoi, en 2 à 4 phrases. -->

**Spec / issue liée** : `docs/features/<nom>.md` · #<issue>

## Type de changement
- [ ] `feat` — fonctionnalité
- [ ] `fix` — correction de bug
- [ ] `security` — sécurité
- [ ] `refactor` — sans changement de comportement
- [ ] `test` / `docs` / `chore` / `ci`

## Changements
-

## Tests
| Contrôle | Commande | Statut (Réussi / Échoué / Non exécuté / À valider manuellement) |
|---|---|---|
| | | |

Contrôles habituels : npm run typecheck · npm run lint · npm test · npm run build.

## Definition of Done
- [ ] Critères d'acceptation remplis
- [ ] Tests ajoutés pour le code nouveau ou modifié, aucune régression
- [ ] `npm run typecheck`, `npm run lint` (0 erreur, aucun avertissement nouveau) et `npm run build` OK
- [ ] Aucun constat sécurité 🔴/🟠 introduit
- [ ] Cohérence avec le design system et les lignes directrices UX (si UI)
- [ ] Documentation et `CHANGELOG.md` mis à jour
- [ ] Nouvelles variables d'environnement ajoutées à `.env.example` (publiques : aucun secret)
- [ ] Plan de rollback identifié si changement risqué

## Sécurité et zones sensibles
- [ ] Aucune zone sensible touchée (`CLAUDE.md` §6) — sinon, lesquelles :
- [ ] Revue sécurité faite (`/review`), aucun constat 🔴/🟠 introduit
- [ ] Aucune donnée personnelle, médicale ou financière réelle dans le code, les tests, les logs ou les captures

## Risques et retour arrière
<!-- Migration, configuration, données, déploiement : impact, sauvegarde, plan de retour arrière. « Aucun » sinon. -->

## Captures (si l'interface change)
<!-- Avant / après, mobile et ordinateur. Données FICTIVES uniquement. -->

## PR liées dans les autres dépôts
<!-- Changement de contrat d'API : lien vers la PR Backend / clients concernés. « Aucune » sinon. -->
