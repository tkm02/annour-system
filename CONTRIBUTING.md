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

## 6. Modifier les règles communes
`CLAUDE.md`, `CONTRIBUTING.md`, `.claude/` et la CI ne changent que par **PR + ADR** (`docs/adr/`). Les règles
communes aux 4 dépôts se modifient d'abord dans le dépôt Backend, puis sont reportées ici.
