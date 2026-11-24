# Environnements — An-Nour Frontend

## 1. État actuel
| Environnement | Où | API utilisée | Configuration |
|---|---|---|---|
| Développement | `npm run dev` (http://localhost:3000) | `NEXT_PUBLIC_API_URL` de `.env.local` (API locale recommandée) | `.env.local`, ignoré par Git |
| CI | GitHub Actions (`ci.yml`) | aucune (build et tests unitaires) | — |
| Production | Vercel, domaine `https://backoffice.annour.ci` (depuis 2026-11 ; l'origine doit figurer dans `CORS_ORIGINS` de l'API, procédure : Backend `docs/DEPLOYMENT.md` §6) | API Render, via `NEXT_PUBLIC_API_URL` (**obligatoire**) | variables du projet Vercel |

Pas de préproduction identifiée. Depuis F-17 (2026-11-19), `lib/api.ts` n'a plus de repli sur l'API de production :
sans `NEXT_PUBLIC_API_URL`, un build de production (Vercel Production **et** Preview, `NODE_ENV=production`) refuse
tout appel avec un message « Configuration incomplète » ; hors production (`npm run dev`, tests), l'API locale
`http://localhost:8000/api/v1` est utilisée. Le build lui-même n'échoue pas (CI sans variable).

## 2. Variables (référence : `.env.example`)
`NEXT_PUBLIC_API_URL` (URL de l'API avec `/api/v1`, sans slash final) ; `NEXT_PUBLIC_EDITION_*` (données de
l'édition, facultatives, valeurs par défaut dans `lib/edition.ts`). Toutes publiques.

## 3. Cible
| Environnement | Utilisation | Données | À mettre en place |
|---|---|---|---|
| Development | développement local | API locale + données fictives | documenter l'API locale par défaut dans `.env.example` |
| Staging | recette | API de staging, données anonymisées | déploiement Vercel *Preview* de `mdev` pointant vers l'API de staging |
| Production | utilisateurs | réelles | variables propres à l'environnement *Production* de Vercel |
