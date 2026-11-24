---
description: "Relecture des changements de la branche courante par le code reviewer et le security reviewer, rapport consolidé avec verdict."
argument-hint: "[branche ou plage de commits optionnelle]"
---

# /review — An-Nour Frontend (back-office)

Périmètre : **$ARGUMENTS** (vide = `git diff mdev...HEAD` + changements non committés).

## Étapes
1. Détermine le périmètre : `git diff --stat mdev...HEAD` et `git status`. S'il est vide, dis-le et arrête-toi.
2. Lance **en parallèle** (outil Agent) les agents **`code-reviewer`** et **`security-reviewer`** avec le même
   périmètre et le chemin de la spec concernée (`docs/features/`) s'il y en a une.
3. Consolide leurs rapports (format commun de `docs/reviews/README.md`) :
   - constats **introduits** par le changement, triés par sévérité, sans doublon entre les deux agents ;
   - constats **préexistants** (non bloquants, proposés pour `docs/TECH_DEBT.md`) ;
   - verdict global : ❌ si un 🔴 introduit, ⚠️ si un 🟠 introduit, sinon ✅.
4. Présente le rapport consolidé à l'utilisateur.
5. Après accord : enregistre les rapports dans `docs/reviews/code-AAAA-MM-JJ[-<périmètre>].md` et
   `docs/reviews/security-AAAA-MM-JJ[-<périmètre>].md`, et ajoute les constats préexistants à
   `docs/TECH_DEBT.md` (identifiant suivant, statut « ouvert »).
6. Si des 🔴/🟠 ont été introduits : retour à `/implement` (ou `/fix`) pour les corriger, puis nouvelle `/review`.

Aucune correction n'est appliquée par cette commande.

## Garde-fous
- Ne lis jamais les fichiers `.env*` réels ; n'affiche aucun secret ni donnée personnelle réelle.
- Aucun `git commit`, `push`, `merge`, déploiement, migration ni opération sur une base réelle sans demande
  explicite de l'utilisateur ; aucune ligne d'attribution IA dans un commit ou une PR.
- Résultats classés **Réussi / Échoué / Non exécuté / À valider manuellement** ; n'invente aucun résultat.
