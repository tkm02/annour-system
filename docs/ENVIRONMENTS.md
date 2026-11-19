# Environnements — An-Nour Frontend

## 1. État actuel
| Environnement | Où | API utilisée | Configuration |
|---|---|---|---|
| Développement | `npm run dev` (http://localhost:3000) | `NEXT_PUBLIC_API_URL` de `.env.local` (API locale recommandée) | `.env.local`, ignoré par Git |
| CI | GitHub Actions (`ci.yml`) | aucune (build et tests unitaires) | — |
| Production | Vercel *(à confirmer : projet, domaine)* | API Render (valeur par défaut de `lib/api.ts` si la variable est absente) | variables du projet Vercel |

Pas de préproduction identifiée. Attention : sans `NEXT_PUBLIC_API_URL`, même un poste de développement appelle
l'API de **production**.

## 2. Variables (référence : `.env.example`)
`NEXT_PUBLIC_API_URL` (URL de l'API avec `/api/v1`, sans slash final) ; `NEXT_PUBLIC_EDITION_*` (données de
l'édition, facultatives, valeurs par défaut dans `lib/edition.ts`). Toutes publiques.

## 3. Cible
| Environnement | Utilisation | Données | À mettre en place |
|---|---|---|---|
| Development | développement local | API locale + données fictives | documenter l'API locale par défaut dans `.env.example` |
| Staging | recette | API de staging, données anonymisées | déploiement Vercel *Preview* de `mdev` pointant vers l'API de staging |
| Production | utilisateurs | réelles | variables propres à l'environnement *Production* de Vercel |
