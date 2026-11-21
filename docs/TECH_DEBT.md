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
| F-17 | 🟠 | Anneau de focus quasi invisible : `--ring` = `oklch(0.2 0 0 / 0.1)` (≈ 1,1 à 1,2:1 sur fond blanc), sous le minimum WCAG 2.2 de 3:1 pour un indicateur de focus ; utilisé par toutes les primitives shadcn | `app/globals.css:26` (`--ring`), `components/ui/*` | token de focus contrasté (ex. `--secondary`), tâche design system dédiée | ouvert |
| F-18 | 🟡 | `--destructive` (`oklch(0.6 0.2 20)`, commenté #ff4d4d) : contraste 4,37:1 sur blanc pour le texte `text-destructive` (< 4,5:1 pour du texte courant) | `app/globals.css:22` | assombrir le token (palette commune, ADR) | ouvert |
| F-19 | 🟡 | Libellé accessible en anglais « Close » du bouton de fermeture des dialogues et panneaux (lecteurs d'écran) | `components/ui/dialog.tsx:75`, `components/ui/sheet.tsx:77` | « Fermer » | ouvert |
| F-20 | 🟡 | Report de **B-28** (Backend) : le formulaire de connexion est libellé « EMAIL » alors que l'API accepte l'email **ou** le nom d'utilisateur (`identifier`) | `components/auth/login-form.tsx:95-105` | libellé « Nom d'utilisateur ou email » (lot 3 du TAF) | ouvert |
| F-21 | 🟡 | Report de **B-29** (Backend) : création d'accès — contrôle JavaScript à 6 caractères (« au moins 6 caractères ») alors que le champ porte `minLength={8}` et que l'API exige 8 | `components/access/create-access-modal.tsx:38-39,141` | aligner sur la politique de l'API (lot 3) | ouvert |
| F-22 | 🟡 | Composant générique `Field` (libellé + erreur reliée) rangé dans `components/finance/` et importé par d'autres domaines (Membres CO, Recensement CO) | `components/finance/field.tsx` | le déplacer dans `components/common/` (tâche de refactorisation séparée) | ouvert |
| F-23 | 🟠 | Complément de F-05 : aucune Content-Security-Policy, donc aucune directive `img-src` ne limite l'origine des images affichées (photos Cloudinary, reçus) | `next.config.mjs` (pas d'en-têtes) | CSP avec `img-src 'self' data: blob: https://res.cloudinary.com` (ADR, à tester avec les PDF et QR codes) | ouvert |
