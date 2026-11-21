# Fonctionnalités — An-Nour Frontend (back-office)

> Index des écrans **existants** (2026-11-19). État apparent : **stable** · **partiel** · **à risque** — à confirmer
> par recette (navigateur). Endpoints détaillés : `docs/FEATURES.md` du dépôt Backend.
> Nouvelles fonctionnalités : spec dans `docs/features/` (modèle `_template.md`).

| Écran (route) | Rôles (menu) | API principale | Tests | État |
|---|---|---|---|---|
| Connexion (`/`) | tous | `/admin/auth/login`, `/me` | `api.test.mjs` | stable |
| Tableau de bord (`/dashboard`) | admin, scientifique | `/registrations/stats/global`, listes | — | partiel |
| Séminaristes (`/seminaristes`, `/seminaristes/ajouter`) | admin, scientifique | `/registrations`, `/admin/seminaristes`, export XLSX | `registration.test.mjs`, `reinscription.test.mjs` | stable (réinscription : lot 2, recette à faire) |
| Badges (`/badges`) | admin | `/registrations` + génération client (PDF, QR) | — | à risque (2 817 l., non testé) |
| Certificats (`/certificats`) | admin | génération client | — | à risque (non testé) |
| Membres CO (`/membres-co`) | admin | `/admin/membres-co` | `api-modules.test.mjs` | partiel |
| Recensement CO (`/recensement-co`) | admin | `/admin/co/*` (+ `/co/configuration` pour les commissions) | `recensement-co.test.mjs`, `api-modules.test.mjs`, `navigation.test.mjs` | nouveau (recette navigateur à faire) |
| Visiteurs (`/visiteurs`) | admin | `/visiteurs` | — | partiel |
| Avis (`/feedback`) | admin | `/admin/feedback`, analytique | — | partiel |
| Gestion des accès (`/acces`) | admin | `/admin/users`, `/admin/auth/register`, révocation | `roles.test.mjs` | stable |
| Inscription (`/inscription`) | (hors menu) | `/registrations` | `registration.test.mjs` | partiel |
| Finances — tableau de bord (`/finance`) | admin, finances | `/finances/dashboard` | — | partiel |
| Finances — entrées / sorties (`/finance/entrees`, `/finance/sorties`) | finances (admin via `/finance`) | `/finances/entrees`, `/finances/sorties`, corbeille | `forms.test.mjs` | partiel |
| Finances — paiements (`/finance/paiements`) | admin, finances | `/finances/paiements`, `/registrations/{matricule}/paiement` | `receipt-image.test.mjs` | partiel |
| Finances — rapports (`/finance/rapports`) | finances | `/finances/rapports` + PDF client | — | partiel |
| Santé (`/sante`, `/sante/seminaristes`, `/sante/consultations`) | admin, sante | `/sante/*` | `forms.test.mjs` | partiel |
| Scientifique (`/scientifique`) | scientifique | `/scientific/stats/scientifiques` | — | partiel |
| Attributions (`/attributions`) | scientifique | — | — | à confirmer |
| Notes (`/notes`) | scientifique | `/scientific/notes`, `/test-entree` | — | partiel |
| Bulletins (`/bulletins`) | scientifique | `/scientific/bulletins` + PDF | — | partiel (1 088 l.) |
| Formateurs (`/formateurs`) | scientifique | `/scientific/formateurs`, `/Ajouter-formateur` | — | partiel |

Mentionné dans le `README.md` mais non retrouvé dans le code ou l'API (à confirmer) : communication entre comités,
programme et emplois du temps, billets de santé, vente de tickets, comptes « mini-administrateurs ».
