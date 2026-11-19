---
description: "Présente le projet à un nouveau contributeur : rôle dans le système, architecture, commandes, workflow, zones sensibles et dette prioritaire."
---

# /onboard — An-Nour Frontend (back-office)

Présente ce dépôt à un nouveau contributeur. **Lecture seule** : ne modifie aucun fichier et n'exécute aucune
commande autre que `git status` / `git branch --show-current`.

## Sources (dans cet ordre, sans audit général)
`CLAUDE.md`, `CONTRIBUTING.md`, `docs/ARCHITECTURE.md`, `docs/FEATURES.md`, `docs/TESTING.md`, `docs/SECURITY.md`,
`docs/TECH_DEBT.md` ; vue d'ensemble des 4 dépôts : dépôt Backend, `docs/SYSTEME_GLOBAL.md`.
Si l'utilisateur précise un sujet (`$ARGUMENTS`), approfondis-le après la présentation générale.

## Présentation attendue (en français, concise, avec des liens `fichier` cliquables)
1. **Le projet en 3 phrases** et la place de ce dépôt parmi les 4 applications.
2. **Stack réelle** et architecture (schéma ASCII court si utile).
3. **Carte du code** : « pour X, regarde dans Y » (les 8 entrées les plus utiles).
4. **Démarrer** : installation, lancement, tests, lint (commandes de `CLAUDE.md` §3) et baseline actuelle.
5. **Workflow d'une évolution** : `/plan` → … → `/ship`, avec les points de validation humaine ✋.
6. **Zones sensibles** et règles de sécurité non négociables.
7. **Dette prioritaire** : les 5 constats 🔴/🟠 ouverts de `docs/TECH_DEBT.md`.
8. **Première contribution suggérée** : une tâche 🟡 simple et bien délimitée de la dette.
9. État Git actuel (branche courante, changements en cours) sans rien modifier.

## Garde-fous
- Ne lis jamais les fichiers `.env*` réels ; n'affiche aucun secret ni donnée personnelle réelle.
- Aucun `git commit`, `push`, `merge`, déploiement, migration ni opération sur une base réelle sans demande
  explicite de l'utilisateur ; aucune ligne d'attribution IA dans un commit ou une PR.
- Résultats classés **Réussi / Échoué / Non exécuté / À valider manuellement** ; n'invente aucun résultat.
