# Contribuer — An-Nour Frontend (back-office)

Règles communes aux contributeurs humains et aux assistants IA (Claude Code). Les règles détaillées pour l'IA sont
dans `CLAUDE.md` ; ce document est le guide pratique. Socle commun aux 4 dépôts An-Nour (vue d'ensemble : dépôt
Backend, `docs/SYSTEME_GLOBAL.md`).

## 1. Démarrer
1. Prérequis : Node.js 22, npm 10, Git ; l'API backend en local recommandée (sinon l'API de production est appelée).
2. Installation et lancement :
   ```bash
   npm ci
   cp .env.example .env.local      # NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   npm run dev                     # http://localhost:3000
   ```
3. Lire : `docs/ARCHITECTURE.md`, `docs/CONVENTIONS.md`, `docs/DESIGN_SYSTEM.md`, `docs/UX_GUIDELINES.md`,
   `docs/SECURITY.md`.
4. Vérifier l'état de départ (baseline : `docs/TESTING.md`) avant toute modification.
5. Hooks Git : activés automatiquement par `npm ci` (script `prepare` → Husky).
   Installer **gitleaks** (détection de secrets du hook) : `winget install gitleaks` (Windows),
   `brew install gitleaks` (macOS) ou binaire des releases GitHub (Linux).

## 2. Workflow d'une évolution
```
/plan → validation → /design → validation → branche feature/<id>-<nom> depuis mdev
→ tests de caractérisation → /implement (1 tâche = 1 commit + tests) → /test → /review → /ux-review
→ corrections → /document → /ship → PR vers mdev → CI verte + 1 relecture → merge
→ PR mdev → main → déploiement → vérification
```
Sans Claude Code, suivre les mêmes étapes à la main : spec dans `docs/features/<nom>.md` (modèle `_template.md`),
tests, revue, documentation. Un changement de contrat d'API se coordonne avec le dépôt Backend (PR liées).

## 3. Branches et commits
- `main` : production. `mdev` : intégration.
- Branches de travail depuis `mdev` : `feature/…`, `fix/…`, `hotfix/…` (depuis `main` en urgence), `chore/…`, `docs/…`.
- **Conventional Commits** : `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`, `security:`, `ci:`.
  Un commit = un changement cohérent ; pas plusieurs fonctionnalités dans un même commit.
- Les commits portent l'identité Git de la personne qui les fait ; pas de ligne d'attribution à un assistant IA.
- Pas de push direct sur `main` ; PR + au moins 1 relecture humaine + CI verte.

## 4. Definition of Done
- [ ] Critères d'acceptation remplis
- [ ] Tests ajoutés pour le code nouveau ou modifié, aucune régression
- [ ] `npm run typecheck`, `npm run lint` (0 erreur, aucun avertissement nouveau) et `npm run build` OK
- [ ] Aucun constat sécurité 🔴/🟠 introduit
- [ ] Cohérence avec le design system et les lignes directrices UX (si UI)
- [ ] Documentation et `CHANGELOG.md` mis à jour
- [ ] Nouvelles variables d'environnement ajoutées à `.env.example` (publiques : aucun secret)
- [ ] Plan de rollback identifié si changement risqué

## 5. Utiliser l'assistant IA
- Agents spécialisés (`.claude/agents/`) et commandes partagées (`.claude/commands/`) : `/onboard`, `/plan`,
  `/design`, `/implement`, `/fix`, `/test`, `/review`, `/ux-review`, `/document`, `/ship`, `/adr`.
- L'IA propose, l'humain valide : aucune modification substantielle sans plan approuvé ; tout code généré est relu.
- L'IA ne lit pas les `.env` réels et ne commit/pousse que sur demande explicite.
- Permissions partagées de l'assistant : `.claude/settings.json` (versionné) — tests, lint, build et lecture Git
  sans confirmation ; installation de dépendances, commit, push, suppressions, déploiement avec confirmation ; lecture
  des `.env*` réels et des clés interdite. Réglages personnels : `.claude/settings.local.json` (ignoré par Git).

## 6. Modifier les règles communes
`CLAUDE.md`, `CONTRIBUTING.md`, `.claude/` et la CI ne changent que par **PR + ADR** (`docs/adr/`). Les règles
communes aux 4 dépôts se modifient d'abord dans le dépôt Backend, puis sont reportées ici.

## 7. Hooks, modèles GitHub et relecteurs
### Hook pré-commit
Outils : Husky + lint-staged (`.husky/pre-commit`, clé `lint-staged` de `package.json`), sur les **fichiers indexés** :
- `eslint` sur `*.{ts,tsx,js,jsx,mjs}` : bloque sur les **erreurs** (les avertissements existants restent de la dette) ;
- détection de secrets avec `gitleaks` **s'il est installé** (sinon avertissement ; installation : §1).

Pas de formateur de code (aucun n'est adopté : ADR requis).

`git commit --no-verify` est **interdit**, sauf urgence documentée dans la PR ; ne jamais désactiver une règle pour
« faire passer » un commit.

### Modèles et relecteurs
- PR : `.github/pull_request_template.md` (Definition of Done du §4, tests avec statuts, zones sensibles, retour arrière).
- Issues : `.github/ISSUE_TEMPLATE/feature.md` et `bug.md` (une vulnérabilité se signale en privé, pas en issue).
- `.github/CODEOWNERS` : relecteurs obligatoires pour les règles communes, `.claude/`, la CI et les zones sensibles.
  Effectif seulement si la protection de `main` active « Require review from Code Owners » et si chaque relecteur a
  un accès en écriture au dépôt (réglages GitHub, faits par un administrateur).
