# Fonctionnalité — <Nom>

> Copier ce fichier en `docs/features/<nom-en-kebab-case>.md`. Rempli par `/plan` (architecte) puis `/design`
> (UI designer). Aucune implémentation avant validation humaine.

- **Statut** : brouillon | validé | en cours | livré
- **Partie / backlog** : <ex. Partie 6 — Santé>
- **Dépôts touchés** : <Backend / Frontend / an-nour / PWA>

## 1. Contexte et objectif
Besoin métier, utilisateurs concernés (rôle : admin, scientifique, finances, sante, public), règles métier
**confirmées** (sinon : questions ouvertes ci-dessous).

## 2. Critères d'acceptation
- [ ] Étant donné …, quand …, alors …
- [ ] Erreurs, permissions insuffisantes, doublons, limites, rechargement de page couverts.

## 3. Existant et impact
| Fichier / module | Impact (création, modification) | Tests existants |
|---|---|---|

Contrat d'API (méthode, chemin, rôle requis, entrée, sortie, codes d'erreur) :

## 4. Découpage en tâches (1 tâche = 1 commit)
1. …

## 5. Risques et sécurité
Données manipulées (personnelles, médicales, financières), contrôles d'accès, validation, journalisation,
abus possibles, migration de données, plan de retour arrière.

## 6. Tests prévus
Unitaires, API, intégration, e2e, autorisations (token absent/invalide/expiré, compte inactif, rôle insuffisant,
ressource d'autrui).

## 7. Proposition UI (agent UI Designer)
Objectif de l'écran, disposition (ASCII), composants existants réutilisés, tokens de `DESIGN_SYSTEM.md`,
états (vide, chargement, erreur, succès, désactivé, survol, focus), responsive, accessibilité,
2–3 variantes et recommandation.

## 8. Questions ouvertes
-
