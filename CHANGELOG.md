# Changelog — An-Nour Frontend (back-office)

Toutes les évolutions notables de ce dépôt sont consignées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) · versions : [SemVer](https://semver.org/lang/fr/).

## [Non publié]
### Ajouté
- Recensement CO (`/recensement-co`, rôle admin) : synthèse de l'édition en cours, fiches paginées avec recherche,
  filtres et export CSV/Excel, détail (santé signalée confidentielle, historique des éditions), correction,
  validation, rejet motivé et traitement des cas à vérifier (fusion ou personne différente) — routes `/admin/co/*`.
  Silhouette de photo d'identité réutilisable (`components/common/id-photo-placeholder.tsx`). La page
  `/membres-co` (fiches 2025) est inchangée ; son entrée de menu devient « Membres CO 2025 (archives) ».
- CI : contrôles sur `mdev` et ses PR, couverture de `lib/` mesurée (rapport), jeton en lecture seule.
- Règles de collaboration : `.claude/settings.json` (permissions partagées de l'assistant), modèles de PR et
  d'issues, `CODEOWNERS`, hook pré-commit Husky + lint-staged (ESLint sur les fichiers indexés, gitleaks si installé).
- Agents spécialisés (`.claude/agents/`) et commandes partagées du workflow (`.claude/commands/`).
- Documentation de référence du projet existant : `CLAUDE.md`, `CONTRIBUTING.md`, `CHANGELOG.md` et `docs/`
  (architecture, conventions, fonctionnalités, sécurité, tests, environnements, déploiement, exploitation,
  design system, lignes directrices UX, dette technique, audit initial, ADR, modèles).
- `.env.example` : toutes les variables `NEXT_PUBLIC_EDITION_*` lues par `lib/edition.ts` sont listées.
### Modifié
- `docs/LOCAL_SETUP.md` signalé comme historique (projet Django abandonné).

## [0.1.0] — état au 2026-11-19
Version de `package.json` au moment de la mise en place du cadre de travail (aucun tag Git n'existait).
Écrans existants : voir `docs/FEATURES.md`.
