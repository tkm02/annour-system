# Exploitation — An-Nour Frontend

> Logs serveur, sauvegardes, gestion d'incident et post-mortem du système : dépôt Backend, `docs/OPERATIONS.md`.

## 1. Actuel
- Application statique/client : pas de données persistées côté front (hors session en `localStorage`).
- Mesure d'audience : `@vercel/analytics`. Aucun suivi d'erreurs navigateur (pas de Sentry côté front).
- Disponibilité : dépend de Vercel et de l'API (`/health` surveillé par le backend).

## 2. Cible
- Suivi des erreurs JavaScript (sans données personnelles) et alerte sur pic d'erreurs.
- Page d'état claire quand l'API est indisponible (message + réessai) sur les écrans principaux.
- Rollback : `DEPLOYMENT.md` §2.
