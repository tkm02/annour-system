---
description: "Met à jour la documentation impactée par les changements de la branche : architecture, fonctionnalités, sécurité, environnements, changelog."
---

# /document — An-Nour Frontend (back-office)

## Étapes
1. Analyse `git diff mdev...HEAD` (et les changements non committés) et la spec de `docs/features/`.
2. Pour chaque changement, détermine les documents concernés :

| Changement | Documents à mettre à jour |
|---|---|
| Page, parcours, fonctionnalité | `docs/FEATURES.md`, statut de `docs/features/<nom>.md` |
| Structure, module, dépendance, flux de données | `docs/ARCHITECTURE.md` (+ ADR si structurant) |
| Couleur, typographie, composant partagé | `docs/DESIGN_SYSTEM.md`, `docs/UX_GUIDELINES.md` |
| Variable `NEXT_PUBLIC_*` | `.env.example`, `docs/ENVIRONMENTS.md` |
| Session, rôles, données sensibles affichées | `docs/SECURITY.md` |
| Tests, baseline | `docs/TESTING.md` |
| Toute évolution visible | `CHANGELOG.md` section `[Non publié]` |

3. Mets à jour **uniquement** ce qui est réellement impacté, en complétant l'existant (pas de réécriture, pas de
   duplication : un sujet = un document). Aucune modification de code.
4. `CHANGELOG.md` : entrées sous `## [Non publié]` (`### Ajouté`, `### Modifié`, `### Corrigé`, `### Sécurité`),
   rédigées pour un lecteur humain, sans détail sensible.
5. Si le changement suppose une évolution de l'API (nouvel endpoint, champ, rôle), signale-la pour le dépôt Backend (PR liée) ; ne modifie jamais un autre dépôt depuis ici.
6. Présente le diff de la documentation et la liste des documents vérifiés mais inchangés.

## Garde-fous
- Ne lis jamais les fichiers `.env*` réels ; n'affiche aucun secret ni donnée personnelle réelle.
- Aucun `git commit`, `push`, `merge`, déploiement, migration ni opération sur une base réelle sans demande
  explicite de l'utilisateur ; aucune ligne d'attribution IA dans un commit ou une PR.
- Résultats classés **Réussi / Échoué / Non exécuté / À valider manuellement** ; n'invente aucun résultat.
