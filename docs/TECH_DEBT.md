# Dette technique — An-Nour Frontend

> Registre priorisé. Source : audit du 2026-11-19 (`audit/AUDIT_INITIAL.md`) puis rapports des reviewers.
> Les constats préexistants relevés pendant une PR sont ajoutés ici et ne bloquent pas la PR.
> Sévérité : 🔴 Bloquant · 🟠 Important · 🟡 Mineur.

| ID | Sévérité | Constat | Emplacement | Piste | Statut |
|---|---|---|---|---|---|
| F-01 | 🔴 | `next@16.4.3` vulnérable ; `next build` s'interrompt (`SecurityFatalError`) à la première exécution | `package.json` | mise à jour de `next` + `eslint-config-next` (tâche dédiée) | ouvert |
| F-02 | 🟠 | Contraste insuffisant : texte blanc sur `--primary` vert clair (≈ 2:1) | `app/globals.css` | `DESIGN_SYSTEM.md` §3 | ouvert |
| F-03 | 🟠 | Pages monolithiques non testées : `app/badges/page.tsx` 2 817 l., `certificats` 1 388 l., `bulletins` 1 088 l. ; `lib/api.ts` 1 214 l. | `app/`, `lib/` | extraction progressive, tâches séparées | ouvert |
| F-04 | 🟠 | Aucun test e2e ni de composant ; couverture non mesurée | `tests/` | `TESTING.md` §3 | ouvert |
| F-05 | 🟠 | JWT en `localStorage`, pas de CSP | `lib/api.ts` | ADR | ouvert |
| F-06 | 🟠 | Docs historiques Django trompeuses (`docs/LOCAL_SETUP.md`, `docs/django_*.py`) | `docs/` | bandeau ajouté ; supprimer ou archiver | ouvert |
| F-07 | 🟠 | CI uniquement sur `main` | `.github/workflows/ci.yml` | Phase 6 | **résolu** (ADR 0002 du Backend) |
| F-08 | 🟡 | Fichiers générés mais versionnés : `next-env.d.ts` (alterne `.next/dev/types` / `.next/types`) et `tsconfig.tsbuildinfo` (réécrit par `npm run typecheck`) | racine | les ignorer dans Git (ADR court) | ouvert |
| F-09 | 🟡 | 171 avertissements ESLint (49 `any`, 35 inutilisés, 24 `<img>`, 4 dépendances de hooks) | — | résorption progressive | ouvert |
| F-10 | 🟡 | 6 dépendances en `latest` | `package.json` | figer | ouvert |
| F-11 | 🟡 | Deux bibliothèques de toast (`react-hot-toast`, `sonner`) | `app/layout.tsx` | en garder une (ADR) | ouvert |
| F-12 | 🟡 | `styles/globals.css` non importé (doublon) | `styles/` | supprimer | ouvert |
| F-13 | 🟡 | URL du site public écrite en dur 10 fois | `app/badges/page.tsx` | constante ou variable `NEXT_PUBLIC_*` | ouvert |
| F-14 | 🟡 | Nom de paquet `my-v0-project`, version 0.1.0 | `package.json` | renommer | ouvert |
| F-15 | 🟡 | Couleurs en dur et quasi-doublons dans les gabarits imprimables | badges, certificats, bulletins | `DESIGN_SYSTEM.md` §2 | ouvert |
| F-16 | 🟡 | `README.md` annonce des fonctions non retrouvées (communication inter-comités, emplois du temps, billets de santé, tickets) | `README.md` | confirmer le périmètre | ouvert |
