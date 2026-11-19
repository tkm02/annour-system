---
description: "Audit UX et cohérence visuelle par l'agent ux-reviewer : ciblé sur les écrans touchés par la branche, ou global avec l'argument global."
argument-hint: "[global]"
---

# /ux-review — An-Nour Frontend (back-office)

Mode : **$ARGUMENTS** (`global` = tout le site ; vide = écrans touchés par `git diff mdev...HEAD`).

## Étapes
1. Mode ciblé : liste les écrans, composants et styles modifiés ; s'il n'y en a aucun, dis-le et arrête-toi.
2. Délègue à l'agent **`ux-reviewer`** (outil Agent, `subagent_type: ux-reviewer`) avec le mode et le périmètre :
   parcours, heuristiques de Nielsen, microcopies, retours utilisateur, accessibilité WCAG 2.2 AA, couleurs en dur
   et quasi-doublons comparés à `docs/DESIGN_SYSTEM.md`, contrastes calculés, cohérence des composants.
3. Enregistre le rapport livré dans `docs/reviews/ux-AAAA-MM-JJ[-<périmètre>].md` (tableau « Écart · Fichier:ligne ·
   Attendu (token) · Constaté · Sévérité · Correction proposée »).
4. Présente le résumé, le verdict et les points « À valider manuellement » (rendu réel, lecteur d'écran, mobile).
5. Après accord : ajoute les constats préexistants à `docs/TECH_DEBT.md`. Les 🔴/🟠 introduits par le changement
   renvoient à `/implement`.

Aucune correction de style n'est appliquée par cette commande.

## Garde-fous
- Ne lis jamais les fichiers `.env*` réels ; n'affiche aucun secret ni donnée personnelle réelle.
- Aucun `git commit`, `push`, `merge`, déploiement, migration ni opération sur une base réelle sans demande
  explicite de l'utilisateur ; aucune ligne d'attribution IA dans un commit ou une PR.
- Résultats classés **Réussi / Échoué / Non exécuté / À valider manuellement** ; n'invente aucun résultat.
