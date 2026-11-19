# Dette technique — An-Nour Frontend

> Registre priorisé. Source : audit du 2026-11-19 (`audit/AUDIT_INITIAL.md`) puis rapports des reviewers.
> Les constats préexistants relevés pendant une PR sont ajoutés ici et ne bloquent pas la PR.
> Sévérité : 🔴 Bloquant · 🟠 Important · 🟡 Mineur.

| ID | Sévérité | Constat | Emplacement | Piste | Statut |
|---|---|---|---|---|---|
| F-01 | 🔴 | `next@16.4.3` vulnérable ; `next build` s'interrompt (`SecurityFatalError`) à la première exécution | `package.json` | mise à jour de `next` + `eslint-config-next` (tâche dédiée) | **résolu** (vague 1, 2026-11-19) : `next` et `eslint-config-next` 16.4.5 |
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
| F-17 | 🟠 | Repli silencieux sur l'API de **production** si `NEXT_PUBLIC_API_URL` est absente (poste de dev ou prévisualisation Vercel qui écrit en production) (revue 2026-11-19) | `lib/api.ts:4-6` | erreur explicite ou repli localhost hors production ; vérifier la variable Preview Vercel | **partiellement résolu** (vague 1, 2026-11-19) : code corrigé (appels refusés en production sans la variable, `http://localhost:8000/api/v1` sinon) ; reste à vérifier les variables Production et Preview sur Vercel avant fusion vers `main` |
| F-18 | 🟠 | Fiche médicale : consultations du patient précédent affichées et cliquables sous le patient courant (revue 2026-11-19) | `components/health/health-seminarist-modal.tsx:103-122` | réinitialiser au changement de matricule, ignorer les réponses périmées | **résolu** (vague 1, 2026-11-19) ; parcours navigateur à valider manuellement (pas d'outil de test de composants, F-04) |
| F-19 | 🟠 | Activation/désactivation d'un compte en un clic, sans confirmation ni retour, y compris sur son propre compte (revue 2026-11-19) | `app/acces/page.tsx:117-136, 370-373` | `AlertDialog`, switch désactivé pour l'utilisateur courant (règle à confirmer), toast | ouvert |
| F-20 | 🟡 | Dialogues de détail sans annulation : réponse périmée affichée sous un autre élément (décision de paiement ciblant l'ancien matricule) (revue 2026-11-19) | `components/finance/payments-manager.tsx:144-157`, `app/finance/{sorties,entrees,rapports}/page.tsx`, `components/health/consultation-modal.tsx:43-57` | drapeau `cancelled` / `AbortController` | **résolu** (vague 1, 2026-11-19) : réponses périmées ignorées (drapeau `cancelled` ou numéro de requête), formulaire de décision réinitialisé par matricule ; parcours navigateur à valider manuellement |
| F-21 | 🟡 | 403 « Compte désactivé » ne ferme pas la session (jeton et `user` conservés) (revue 2026-11-19) | `lib/api.ts:364-375` | `logout()` sur ce cas, code d'erreur stable côté Backend | **partiellement résolu** (vague 1, 2026-11-19) : 403 « Compte désactivé » avec jeton → session effacée et retour à la connexion ; reste un code d'erreur stable côté Backend (le front compare aujourd'hui le message exact `detail`) |
| F-22 | 🟡 | Export CSV des accès limité à la page courante et non échappé (virgules, formules) ; recherche limitée à la page ; `alert()` (revue 2026-11-19) | `app/acces/page.tsx:86, 138-149, 181-215` | `fetchAllPages`, champs quotés et neutralisés, recherche serveur | ouvert |
| F-23 | 🟡 | Paramètres de chemin non encodés (scientifique, utilisateurs, avis) (revue 2026-11-19) | `lib/api.ts:533-783` | `encodeURIComponent` systématique | ouvert |
| F-24 | 🟡 | La garde de route ignore `isLoading` et dépend de l'ordre des effets (revue 2026-11-19) | `components/auth/protected-route.tsx:50-65` | `!isLoading && !isAuthenticated` | ouvert |
| F-25 | 🟠 | Focus clavier quasi invisible sur tout le site (`ring-ring/50` ≈ 1,11:1, WCAG 2.4.7) (revue 2026-11-19) | `app/globals.css:26,121`, `components/ui/button.tsx:8`, `components/ui/input.tsx:15` | `--ring` opaque ≥ 3:1, avec l'ADR palette | ouvert |
| F-26 | 🟠 | Statuts et contrôles en texte blanc sur vert ou gris clair (1,84 à 3,22:1), y compris onglets et boutons verts en dur (revue 2026-11-19) | `app/acces/page.tsx:165-177,374`, `lib/payment-status.ts:9`, `app/badges/page.tsx:1936-1954`, `app/certificats/page.tsx:1126-1376` | badges sémantiques sur tokens ; `Tabs`/`Button` du thème | ouvert |
| F-27 | 🟠 | Modales d'accès sans sémantique de dialogue (ni `role`, ni `aria-modal`, ni focus piégé, ni Échap) (revue 2026-11-19) | `components/access/create-access-modal.tsx:64`, `components/access/edit-access-modal.tsx:79` | `components/ui/dialog.tsx` + `Field` | ouvert |
| F-28 | 🟠 | Noms accessibles manquants : champs à placeholder seul (dont allergies et antécédents), 10 boutons à icône seule, bouton « œil » 16×16 px (revue 2026-11-19) | `app/badges/page.tsx:2187-2602`, `app/certificats/page.tsx:1264-1294`, `app/feedback/page.tsx:331,341`, `components/auth/login-form.tsx:140` | `Field`/`Label`, `aria-label`, cible ≥ 24 px | ouvert |
| F-29 | 🟠 | Retours trompeurs : tableau de bord à 0 en cas d'erreur ; ajouts de badges annoncés mais perdus au rechargement (doublon `/membres-co`) (revue 2026-11-19) | `app/dashboard/page.tsx:16-33`, `app/badges/page.tsx:643-661,930-948` | `ErrorState` ; badges alimentés par `/membres-co` | ouvert |
| F-30 | 🟠 | Édition « SEMINAIRE AN-NOUR 25 » en dur 7 fois sur les badges (revue 2026-11-19) | `app/badges/page.tsx:413-2720` | `lib/edition.ts` | ouvert |
| F-31 | 🟡 | `--destructive` réel #DE394B à 4,38:1 ; commentaires hex de `globals.css` faux (primary #A2BB40, secondary #00315A…), recopiés dans `DESIGN_SYSTEM.md` §1 (revue 2026-11-19) | `app/globals.css:9-24`, `docs/DESIGN_SYSTEM.md` §1 | aligner sur `--an-error` ; corriger **avant** l'ADR palette | ouvert |
| F-32 | 🟡 | 7 composants jamais importés (dont « Mock data ») qui faussent les relevés (revue 2026-11-19) | `components/access/delete-access-modal.tsx`, `components/scientific/*-modal.tsx`, `components/seminaristes/*-modal.tsx`, `components/theme-provider.tsx` | supprimer (tâche dédiée) | ouvert |
