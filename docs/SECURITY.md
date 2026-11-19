# Sécurité — An-Nour Frontend

> Politique commune, modèle de menace global et checklist : dépôt Backend, `docs/SECURITY.md` (source de vérité).
> Ce document ne garde que ce qui est propre au back-office.

## 1. Points propres à ce dépôt
| Sujet | État actuel | Règle |
|---|---|---|
| Variables d'environnement | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_EDITION_*` : publiques, incluses dans le bundle | ne jamais y mettre de secret |
| Jeton de session | JWT dans `localStorage` (`authToken`, `user`) | exposé en cas de XSS : pas de HTML non échappé, CSP à mettre en place (ADR) |
| Expiration | 401 avec token → `logout()` et retour à la connexion (`lib/api.ts`) | conserver ce comportement pour tout nouvel appel |
| Autorisation | menus filtrés par rôle, garde client `protected-route.tsx` | confort uniquement : l'API reste juge ; afficher proprement les 403 |
| Données sensibles à l'écran | santé, finances, identité, photos | pas de `console.log` de données, pas de données dans les URL, PDF générés côté client sans stockage |
| Analytics | `@vercel/analytics` | ne transmettre aucune donnée personnelle dans les événements |
| Secrets Git | gitleaks en CI (diff bloquant), `.next/` exclu | — |

## 2. Constats ouverts (audit du 2026-11-19)
| # | Sévérité | Constat | Piste |
|---|---|---|---|
| F-S1 | 🔴 | `next@16.4.3` vulnérable (avis modéré) ; le build s'interrompt une fois avec `SecurityFatalError` | mettre à jour `next` (tâche dédiée, avec test du build) |
| F-S2 | 🟠 | Ancienne `SECRET_KEY` Django dans l'historique (`backend/backend/settings.py`, commits `bae1da4`, `26b0cbf`) | la considérer compromise (aucun usage actuel constaté) |
| F-S3 | 🟠 | JWT en `localStorage`, pas de CSP | ADR stockage des jetons + en-têtes de sécurité Vercel |
| F-S4 | 🟡 | 6 dépendances en `latest` | figer les versions |
| F-S5 | 🟡 | CI seulement sur `main` | Phase 6 |
