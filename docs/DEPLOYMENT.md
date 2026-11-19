# Déploiement — An-Nour Frontend

## 1. Actuel
- **CI** (`.github/workflows/ci.yml`, push/PR vers `main` **et `mdev`**, ADR 0002 du dépôt Backend) : `npm ci` →
  typecheck → lint → tests → couverture de `lib/` (rapport) → build → `npm audit` (rapport) ; job séparé gitleaks
  (diff bloquant, historique en rapport). Jeton GitHub en lecture seule.
- **Déploiement** : Vercel (intégration Git du projet Vercel, non décrite dans le dépôt — *à confirmer* : branche de
  production, déploiements de prévisualisation). Aucune étape de déploiement dans le CI.

## 2. Retour arrière
Vercel → *Deployments* → promouvoir le déploiement précédent (*Instant Rollback*), ou `git revert` sur `main`.
Un changement de contrat d'API se déploie **après** l'API compatible (ou de façon rétrocompatible).

## 3. Cible (Phase 6)
```
Push → typecheck → lint → tests → build → e2e (à venir) → scans
     → Preview Vercel (mdev = staging) → validation humaine → Production (main)
```
- **Fait (étape 1)** : CI sur `mdev` et ses PR ; couverture mesurée (rapport).
- **Actions manuelles** : staging = déploiement de prévisualisation Vercel de `mdev` ; production depuis `main`
  (vérifier la branche de production dans Vercel).
- **Étape 2** : e2e (ADR, ex. Playwright), tags SemVer à chaque mise en production, seuil de couverture.
- Le build peut s'interrompre sur `SecurityFatalError` tant que F-01 n'est pas traité : l'échec n'est pas masqué.
