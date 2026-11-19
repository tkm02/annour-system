---
description: "L'architecte analyse l'impact d'une évolution sur l'existant, crée docs/features/<nom>.md (contexte, critères, fichiers impactés, tâches, risques, sécurité) puis attend la validation."
argument-hint: "<évolution à planifier>"
---

# /plan — An-Nour Frontend (back-office)

Évolution demandée : **$ARGUMENTS**

Si la demande est vide ou trop vague, pose une question ciblée et arrête-toi.

## Étapes
1. Vérifie qu'une spec n'existe pas déjà dans `docs/features/` (sinon, propose de la compléter).
2. Délègue l'analyse à l'agent **`architect`** (outil Agent, `subagent_type: architect`) en lui transmettant la
   demande telle quelle, le dépôt courant et la consigne de :
   - créer `docs/features/<nom-en-kebab-case>.md` à partir de `docs/features/_template.md`, **statut : brouillon** ;
   - remplir contexte, critères d'acceptation vérifiables, existant et impact (fichiers réellement lus), contrat
     d'API, découpage en tâches (1 tâche = 1 commit + tests, tests de caractérisation d'abord), risques et
     sécurité, tests prévus, plan de retour arrière, questions ouvertes ;
   - proposer un ADR (`docs/adr/`, statut « proposé ») si un choix structurant apparaît.
3. Si le changement suppose une évolution de l'API (nouvel endpoint, champ, rôle), signale-la pour le dépôt Backend (PR liée) ; ne modifie jamais un autre dépôt depuis ici.
4. Présente à l'utilisateur un résumé : objectif, critères d'acceptation, tâches numérotées, fichiers impactés,
   zones sensibles touchées, risques et impact sécurité, **questions ouvertes à trancher**, lien vers la spec.

## ✋ Point d'arrêt obligatoire
N'implémente rien, ne crée aucune branche. Termine par : « Valides-tu ce plan (ou que faut-il changer) ? ».
Après validation explicite seulement : passer le statut de la spec à **validé**, puis `/design` (si écran) ou
`/implement <tâche 1>`.

## Garde-fous
- Ne lis jamais les fichiers `.env*` réels ; n'affiche aucun secret ni donnée personnelle réelle.
- Aucun `git commit`, `push`, `merge`, déploiement, migration ni opération sur une base réelle sans demande
  explicite de l'utilisateur ; aucune ligne d'attribution IA dans un commit ou une PR.
- Résultats classés **Réussi / Échoué / Non exécuté / À valider manuellement** ; n'invente aucun résultat.
