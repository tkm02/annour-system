---
description: "Corrige un bug : reproduction, test de régression qui échoue, correction minimale, test vert, aucune régression."
argument-hint: "<description du bug ou n° d'issue>"
---

# /fix — An-Nour Frontend (back-office)

Bug : **$ARGUMENTS**

## Étapes
1. **Comprendre et localiser** : symptôme, conditions, fichiers en cause (lecture ciblée). Si le comportement
   attendu est une règle métier non confirmée, pose la question et arrête-toi.
2. **Branche** : si la branche courante est `main` ou `mdev`, propose `fix/<id>-<nom>` depuis
   `mdev` (ou `hotfix/<nom>` depuis `main` en urgence) et attends l'accord.
3. **Diagnostic** : présente la cause probable et la correction envisagée. Si la correction touche une zone
   sensible (`CLAUDE.md` §6) ou dépasse quelques lignes, ✋ attends la validation avant d'aller plus loin.
4. **Test de régression** : délègue à l'agent **`qa`** l'écriture d'un test qui reproduit le bug, puis exécute-le :
   il doit **échouer** pour la bonne raison (statut attendu : Échoué). Si la suite de tests du dépôt n'est pas
   exécutable (voir `docs/TESTING.md`), dis-le, propose les étapes de reproduction manuelle et ne prétends jamais
   avoir un test vert.
5. **Correction minimale** : délègue à l'agent **`developer`** la plus petite correction qui fait passer le test,
   sans refactorisation ni changement hors périmètre.
6. **Vérification** : le test de régression passe, la suite complète et le lint restent au niveau de la baseline.
7. **Compte rendu** : cause, correction, test ajouté, contrôles (Réussi / Échoué / Non exécuté / À valider
   manuellement), risques restants, message de commit proposé (`fix: …`, test inclus). Commit uniquement sur
   demande. Ajoute une ligne au `CHANGELOG.md` (`### Corrigé`) si le bug était visible des utilisateurs.

## Garde-fous
- Ne lis jamais les fichiers `.env*` réels ; n'affiche aucun secret ni donnée personnelle réelle.
- Aucun `git commit`, `push`, `merge`, déploiement, migration ni opération sur une base réelle sans demande
  explicite de l'utilisateur ; aucune ligne d'attribution IA dans un commit ou une PR.
- Résultats classés **Réussi / Échoué / Non exécuté / À valider manuellement** ; n'invente aucun résultat.
