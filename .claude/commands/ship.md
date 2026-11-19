---
description: "Vérifie la Definition of Done, finalise doc et CHANGELOG, prépare le commit et la description de PR vers la branche d'intégration. Ne pousse rien."
---

# /ship — An-Nour Frontend (back-office)

Prépare la livraison de la branche courante vers **`mdev`**. Cette commande ne pousse rien et n'ouvre
aucune PR : l'utilisateur le fait.

## 1. Definition of Done (`CONTRIBUTING.md` §4)
Vérifie chaque case de `CONTRIBUTING.md` §4, y compris celles propres à ce dépôt, **avec une preuve**
(commande exécutée, fichier, rapport) ; au minimum :
- critères d'acceptation de la spec remplis ;
- tests ajoutés pour le code nouveau/modifié, aucune régression (relance `/test` si le code a changé depuis) ;
- lint (et typage selon le dépôt) sans erreur nouvelle sur les fichiers modifiés ;
- aucun constat sécurité 🔴/🟠 introduit (dernier `/review` postérieur au dernier changement de code); cohérence avec le design system (`/ux-review` si UI) ;
- documentation et `CHANGELOG.md` à jour (sinon lance `/document`) ;
- nouvelles variables d'environnement présentes dans `.env.example` ;
- plan de retour arrière identifié si le changement est risqué (données, configuration, déploiement).
Toute case non satisfaite est signalée ; ne la coche jamais sans preuve.

## 2. Contrôles de sûreté du diff
- Aucun secret, token, mot de passe, URL de base ou donnée personnelle réelle dans `git diff mdev...HEAD`
  (recherche de motifs ; `gitleaks` si installé).
- Aucun fichier `.env*` réel, export (`*.xlsx`, `*.csv`), fichier généré ou de debug suivi par Git.
- Zones sensibles touchées (`CLAUDE.md` §6) : listées pour la relecture humaine.

## 3. Commit et PR
- Propose le(s) message(s) de commit au format Conventional Commits, un commit atomique par changement cohérent.
  **Commit uniquement si l'utilisateur le demande**, avec son identité Git, sans ligne `Co-Authored-By` ni
  mention « Generated with … ».
- Rédige la description de PR (en suivant `.github/pull_request_template.md` s'il existe) : résumé, lien vers la
  spec, changements, tests avec statuts réels, Definition of Done cochée avec preuves, risques et retour arrière,
  captures (si UI, données fictives), PR liées dans les autres dépôts. **Aucune** ligne d'attribution IA.
- Rappelle la suite : push par l'utilisateur, PR vers `mdev`, CI verte + 1 relecture humaine, puis
  promotion vers `main` selon `docs/DEPLOYMENT.md`.

## Garde-fous
- Ne lis jamais les fichiers `.env*` réels ; n'affiche aucun secret ni donnée personnelle réelle.
- Aucun `git commit`, `push`, `merge`, déploiement, migration ni opération sur une base réelle sans demande
  explicite de l'utilisateur ; aucune ligne d'attribution IA dans un commit ou une PR.
- Résultats classés **Réussi / Échoué / Non exécuté / À valider manuellement** ; n'invente aucun résultat.
