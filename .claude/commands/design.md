---
description: "L'UI designer produit une proposition d'interface DESCRIPTIVE, cohérente avec les écrans existants et les tokens du design system, avec 2 ou 3 variantes, puis attend la validation."
argument-hint: "<écran ou composant>"
---

# /design — An-Nour Frontend (back-office)

Écran ou composant : **$ARGUMENTS**

## Étapes
1. Retrouve la spec correspondante dans `docs/features/` ; si elle n'existe pas ou n'est pas validée, propose
   d'abord `/plan` et arrête-toi.
2. Délègue à l'agent **`ui-designer`** (outil Agent, `subagent_type: ui-designer`) : proposition descriptive
   (aucune maquette graphique ni code UI) écrite dans la section « 7. Proposition UI » de la spec, avec objectif,
   disposition (ASCII), composants existants réutilisés, tokens de `docs/DESIGN_SYSTEM.md`, états, microcopies,
   responsive, accessibilité WCAG 2.2 AA (ratios de contraste calculés), 2 ou 3 variantes et une recommandation.
3. Si un token manque, l'agent le propose comme ajout à `docs/DESIGN_SYSTEM.md` **sans** l'y écrire avant accord.
4. Présente un résumé des variantes et la recommandation, avec les décisions à prendre.

## ✋ Point d'arrêt obligatoire
N'implémente rien. Demande : « Quelle variante retiens-tu (ou quels ajustements) ? ». Après validation, note la
variante retenue dans la spec, puis `/implement <tâche>`.

## Garde-fous
- Ne lis jamais les fichiers `.env*` réels ; n'affiche aucun secret ni donnée personnelle réelle.
- Aucun `git commit`, `push`, `merge`, déploiement, migration ni opération sur une base réelle sans demande
  explicite de l'utilisateur ; aucune ligne d'attribution IA dans un commit ou une PR.
- Résultats classés **Réussi / Échoué / Non exécuté / À valider manuellement** ; n'invente aucun résultat.
