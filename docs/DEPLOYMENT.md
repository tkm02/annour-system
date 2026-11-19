# Déploiement — An-Nour Frontend

## 1. Actuel
- **CI** (`.github/workflows/ci.yml`, push/PR vers `main`) : `npm ci` → typecheck → lint → tests → build →
  `npm audit` (rapport) ; job séparé gitleaks (diff bloquant, historique en rapport).
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
CI aussi sur `mdev` et les PR vers `mdev` ; tags SemVer ; notification en cas d'échec.
