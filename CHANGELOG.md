# Changelog — An-Nour Frontend (back-office)

Toutes les évolutions notables de ce dépôt sont consignées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) · versions : [SemVer](https://semver.org/lang/fr/).

## [Non publié]
### Sécurité
- `next` et `eslint-config-next` 16.4.3 → 16.4.5 (avis GHSA-mfr8-8qww-v76h et GHSA-vc7v-qv4w-wrv8) : le build ne
  s'interrompt plus sur `SecurityFatalError` (F-01).
### Ajouté
- Sécurité du cadre (revues du 2026-11-19) : hook `PreToolUse` de protection des secrets, permissions de l'assistant
  resserrées (`git branch`, `git diff --no-index`, exports, réécritures), CI durcie (SHA-256 de gitleaks épinglé,
  `persist-credentials: false`, expressions via `env:`, repli si le commit précédent est introuvable).
- Script `prepare` tolérant (`.husky/install.mjs`) : ignoré en CI, en production et sans devDependencies.
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
