---
description: "Le développeur implémente UNE seule tâche d'une spec validée, avec ses tests, puis rend un compte rendu et un message de commit proposé."
argument-hint: "<tâche (n° ou intitulé) de docs/features/<nom>.md>"
---

# /implement — An-Nour Frontend (back-office)

Tâche : **$ARGUMENTS**

## Préconditions (vérifie, sinon arrête-toi et explique)
- La tâche appartient à une spec de `docs/features/` au statut **validé** ou **en cours** (sinon : `/plan`).
- Une seule tâche est demandée ; si plusieurs, demande laquelle traiter en premier.
- Branche courante : ni `main` ni `mdev`. Sinon, propose `feature/<id>-<nom>` (ou `fix/…`) créée depuis
  `mdev` et **attends l'accord** avant de la créer.
- `git status` : repère les changements non committés de l'utilisateur ; ne les modifie pas et ne les mélange pas
  à la tâche.
- Si la tâche touche une **zone sensible** (`CLAUDE.md` §6), rappelle-le et obtiens une validation explicite.

## Étapes
1. Délègue à l'agent **`developer`** (outil Agent, `subagent_type: developer`) : la tâche exacte, ses critères
   d'acceptation, le chemin de la spec. Il écrit d'abord les tests de caractérisation si le code touché n'est pas
   testé, implémente le changement minimal, ajoute les tests, exécute tests et lint (et typage/build selon le
   dépôt) et compare à la baseline de `docs/TESTING.md`.
2. Relis le diff produit (`git diff`) : périmètre respecté, aucun fichier généré modifié par erreur, aucun secret.
3. Passe la spec au statut **en cours** si ce n'est pas déjà fait et coche la tâche une fois terminée.
4. Compte rendu : fichiers modifiés et raison, contrôles avec statut réel, limites, message de commit proposé
   (Conventional Commits, sans attribution). **Commit uniquement si l'utilisateur le demande.**
5. Suite suggérée : tâche suivante (`/implement`), ou `/test` puis `/review` quand toutes les tâches sont faites.

## Garde-fous
- Ne lis jamais les fichiers `.env*` réels ; n'affiche aucun secret ni donnée personnelle réelle.
- Aucun `git commit`, `push`, `merge`, déploiement, migration ni opération sur une base réelle sans demande
  explicite de l'utilisateur ; aucune ligne d'attribution IA dans un commit ou une PR.
- Résultats classés **Réussi / Échoué / Non exécuté / À valider manuellement** ; n'invente aucun résultat.
