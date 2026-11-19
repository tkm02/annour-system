# CLAUDE.md — An-Nour Frontend (back-office des comités)

Constitution du dépôt pour l'IA et les contributeurs. Elle reprend les règles communes du projet An-Nour
(`CLAUDE.md` du dossier de travail parent) et les adapte à ce dépôt. Détails : `docs/`, sans duplication ici.

## 1. Projet
Interface d'administration du **Séminaire Islamique et Managérial An-Nour** pour les comités : administration,
scientifique, finances, santé (séminaristes, badges, certificats, notes, bulletins, finances, consultations, accès).
Elle consomme l'API FastAPI (`ym-0-bm/An-Nour-Backend`, `/api/v1`). Vue d'ensemble des 4 dépôts et docs
transverses (sécurité globale, palette commune) : dépôt Backend, `docs/SYSTEME_GLOBAL.md`.

Stack **réelle** : Next.js 16.4 (App Router) · React 19.3 · TypeScript 5 · Tailwind CSS 4 · shadcn/ui (Radix) ·
lucide-react · recharts · jspdf · qrcode · Node 22 · tests `node --test` · ESLint 9.
18 pages sur 24 sont des composants client (`"use client"`) ; aucun backend ni route API Next dans ce dépôt
(les docs Django sont historiques). Déploiement : Vercel (`@vercel/analytics`).

## 2. Principes
1. **Think before code** — analyser et planifier avant d'implémenter.
2. **One task at a time** — tâches petites et indépendantes.
3. **Single source of truth** — `docs/` fait foi et reste à jour.
4. **Small iterations** — incréments petits et testables.
5. **Test everything** — toute logique nouvelle ou modifiée est testée.
6. **Review everything** — aucun code généré accepté sans relecture.
7. **Security first** — dès la conception.
8. **Keep it simple** — la solution la plus simple qui fonctionne.
9. **Git everywhere** — un commit atomique et explicite par évolution cohérente.
10. **Production mindset** — monitoring, sauvegardes, rollback dès la conception.
- **Boy scout rule** : laisser le code un peu plus propre, *uniquement dans le périmètre de la tâche*.
- **Pas de refonte cachée** : toute refactorisation significative = tâche et PR séparées.

## 3. Commandes essentielles
```bash
npm ci                    # installation stricte (lockfile)
cp .env.example .env.local   # puis NEXT_PUBLIC_API_URL (jamais de secret dans NEXT_PUBLIC_*)
npm run dev               # http://localhost:3000 (origine autorisée par l'API hors production)
npm run typecheck         # tsc --noEmit
npm run lint              # ESLint (0 erreur exigée ; avertissements = dette suivie)
npm test                  # node --test tests/**/*.test.mjs
npm run build             # build de production
```
Note : `next build` / `next dev` réécrivent `next-env.d.ts` (fichier versionné) — ne pas committer ce changement
s'il n'est pas voulu. Baseline : `docs/TESTING.md`.

## 4. Carte du code — « pour X, regarde dans Y »
| Pour… | Regarde dans… |
|---|---|
| Une page | `app/<route>/page.tsx` (24 pages ; `app/layout.tsx` = racine) |
| Appels à l'API, types, gestion du token | `lib/api.ts` |
| Session (connexion, déconnexion, utilisateur courant) | `contexts/auth-context.tsx`, `components/auth/` |
| Rôles et menus par rôle | `lib/roles.ts` (aligné sur `app/utils/auth.py` du backend), `lib/navigation.ts` |
| Composants métier | `components/<domaine>/` (access, dashboard, finance, health, scientific, seminaristes, layout) |
| Composants génériques / primitives UI | `components/common/` (états, pager, confirmations), `components/ui/` (shadcn) |
| PDF (reçus, rapports, consultations, bulletins) | `lib/pdf-generator.ts`, `rapport-pdf.ts`, `consultation-pdf.ts` |
| Données de l'édition | `lib/edition.ts` (variables `NEXT_PUBLIC_EDITION_*`) |
| Thème, couleurs | `app/globals.css` (tokens) — `styles/globals.css` n'est pas importé |
| Tests | `tests/*.test.mjs` |
| CI | `.github/workflows/ci.yml` |

## 5. Conventions
Voir `docs/CONVENTIONS.md`, `docs/DESIGN_SYSTEM.md`, `docs/UX_GUIDELINES.md`. En bref : fichiers en
`kebab-case.tsx`, alias `@/`, tout appel réseau passe par `lib/api.ts`, composants shadcn réutilisés avant d'en créer.

## 6. Zones sensibles (validation humaine obligatoire avant modification)
- `lib/api.ts`, `contexts/auth-context.tsx`, `components/auth/` (auth, token, expiration de session).
- `lib/roles.ts`, `lib/navigation.ts`, `app/acces/` (droits et comptes ; toujours alignés sur le backend).
- `app/finance/**`, `components/finance/**` (argent), `app/sante/**`, `components/health/**` (données médicales).
- `.env.example`, `next.config.mjs`, `package.json`/`package-lock.json`, `.github/workflows/*`, `.gitleaks.toml`.

## 7. Sécurité non négociable (détail : `docs/SECURITY.md`)
- Aucun secret dans le code ni dans `NEXT_PUBLIC_*` (publiques). Ne **jamais** lire les fichiers `.env*` réels.
  Un secret exposé doit être révoqué/renouvelé : le retirer du dépôt ne suffit pas.
- Masquer un bouton ou une page n'est jamais une protection : l'autorisation est faite par l'API ; le front gère
  proprement 401 (session expirée → reconnexion) et 403 (accès refusé).
- Aucune donnée personnelle, médicale ou financière dans `console.log`, les URL ou le stockage local (hors token
  de session existant) ; données **fictives** dans les tests et captures.
- Pas de `dangerouslySetInnerHTML` sur une donnée venant de l'API ou de l'utilisateur.

## 8. Règles Git
- Branches : `main` = production ; `mdev` = intégration ; `feature/<id>-<nom>`, `fix/…`, `hotfix/…`, `chore/…`
  créées depuis `mdev`.
- **Conventional Commits** à partir de maintenant : `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`,
  `security:`, `ci:` (historique non réécrit).
- Les commits sont faits avec l'identité Git du contributeur ; l'IA n'ajoute **aucune** ligne d'attribution.
- Pas de push direct sur `main` : PR + 1 relecture humaine + CI verte. Commit, push, merge et déploiement
  uniquement sur demande explicite.

## 9. Interdits
Secrets en dur · code de debug (`console.log` de données) commité · désactiver un test ou une règle ESLint pour
« faire passer » · dépendance sans justification (et jamais en `latest`) · refactorisation hors périmètre ·
plusieurs fonctionnalités dans un commit · données fictives affichées en production.

## 10. Workflow d'une évolution
```
1. /plan        → analyse d'impact + découpage + risques       → ✋ validation humaine
2. /design      → proposition UI descriptive                   → ✋ validation humaine
3. Branche      → feature/<id>-<nom> depuis mdev
4. Tests de caractérisation sur le code existant touché (si non testé)
5. /implement   → 1 tâche = 1 commit + tests (boucle)
6. /test        → aucune régression par rapport à la baseline
7. /review      → code + sécurité
8. /ux-review   → écrans touchés
9. Corrections  → retour à 5 si constat 🔴 ou 🟠 introduit par le changement
10. /document puis /ship → PR vers mdev → CI verte + relecture → main
```
Une fonctionnalité n'est terminée qu'après validation du parcours interface → API → autorisation → persistance →
réponse → affichage actualisé (erreurs, permissions, doublons, rechargement compris). Rapport final distinguant
**Réussi / Échoué / Non exécuté / À valider manuellement**. Ordre des chantiers : `CLAUDE.md` du dossier parent.

## 11. Documentation
`docs/ARCHITECTURE.md` · `CONVENTIONS.md` · `FEATURES.md` · `SECURITY.md` · `TESTING.md` · `ENVIRONMENTS.md` ·
`DEPLOYMENT.md` · `OPERATIONS.md` · `DESIGN_SYSTEM.md` · `UX_GUIDELINES.md` · `TECH_DEBT.md` · `audit/` · `adr/` ·
`features/` · `reviews/`. Historiques (obsolètes) : `API_DOCUMENTATION.md`, `LOCAL_SETUP.md`, `django_*.py`.
