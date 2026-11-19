---
description: "Le QA lance toute la suite de contrôles du dépôt et compare les résultats à la baseline de docs/TESTING.md."
argument-hint: "[périmètre optionnel]"
---

# /test — An-Nour Frontend (back-office)

Périmètre : **$ARGUMENTS** (vide = toute la suite).

## Étapes
1. Note `git status` avant de commencer (pour détecter les fichiers réécrits par les outils).
2. Délègue à l'agent **`qa`** (outil Agent, `subagent_type: qa`) l'exécution des contrôles listés dans
   `CLAUDE.md` §3 et `docs/TESTING.md` §2 (tests, lint, typage et build selon le dépôt), sans rien installer ni
   viser une base ou une API réelle. Les tests nécessitant un service absent (base locale, navigateur, téléphone)
   sont classés « Non exécuté » ou « À valider manuellement » avec la raison.
3. Compare chaque résultat à la baseline : **écarts introduits** (bloquants) vs **échecs préexistants** (dette).
4. Après exécution, compare `git status` : un fichier versionné réécrit par un outil (voir `CLAUDE.md` §3) et non
   modifié auparavant est signalé et restauré ; ne touche jamais aux changements de l'utilisateur.
5. Rends le rapport QA (tableau Contrôle · Commande · Baseline · Résultat · Statut) avec un verdict :
   ✅ aucune régression / ⚠️ réserves / ❌ régression.
6. Si la baseline a légitimement changé (nouveaux tests), propose la mise à jour de `docs/TESTING.md` §2.

## Garde-fous
- Ne lis jamais les fichiers `.env*` réels ; n'affiche aucun secret ni donnée personnelle réelle.
- Aucun `git commit`, `push`, `merge`, déploiement, migration ni opération sur une base réelle sans demande
  explicite de l'utilisateur ; aucune ligne d'attribution IA dans un commit ou une PR.
- Résultats classés **Réussi / Échoué / Non exécuté / À valider manuellement** ; n'invente aucun résultat.
