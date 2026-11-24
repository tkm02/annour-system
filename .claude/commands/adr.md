---
description: "Crée un ADR (Architecture Decision Record) numéroté dans docs/adr/ à partir du modèle, au statut proposé."
argument-hint: "<titre de la décision>"
---

# /adr — An-Nour Frontend (back-office)

Décision : **$ARGUMENTS** (si vide, demande le titre et arrête-toi).

## Étapes
1. Liste `docs/adr/` et prends le numéro suivant sur 4 chiffres (le modèle `0000-template.md` ne compte pas).
2. Crée `docs/adr/NNNN-<titre-en-kebab-case>.md` à partir de `docs/adr/0000-template.md` :
   statut **proposé**, date du jour, dépôts concernés ; contexte, options (au moins 2, dont « ne rien changer »
   quand c'est pertinent), décision envisagée, conséquences (sécurité et données, migration, retour arrière),
   suivi. Appuie-toi sur la conversation et sur le code réel ; marque « à confirmer » ce qui n'est pas établi.
3. Si la décision concerne plusieurs dépôts, elle se rédige dans le dépôt Backend (règle de `CONTRIBUTING.md` §6)
   et les autres dépôts y renvoient.
4. Présente l'ADR. Seul un humain le passe à **accepté** ; ensuite seulement, mets à jour les documents listés en
   « Suivi » (`ARCHITECTURE.md`, `CONVENTIONS.md`…).

## Garde-fous
- Ne lis jamais les fichiers `.env*` réels ; n'affiche aucun secret ni donnée personnelle réelle.
- Aucun `git commit`, `push`, `merge`, déploiement, migration ni opération sur une base réelle sans demande
  explicite de l'utilisateur ; aucune ligne d'attribution IA dans un commit ou une PR.
- Résultats classés **Réussi / Échoué / Non exécuté / À valider manuellement** ; n'invente aucun résultat.
