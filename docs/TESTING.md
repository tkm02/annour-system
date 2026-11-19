# Tests — An-Nour Frontend

## 1. Existant
| Type | Outil | Où | Contenu |
|---|---|---|---|
| Unitaires | `node --test` (runner natif, `--experimental-strip-types`) | `tests/*.test.mjs` | `api` (17), `api-modules` (10), `forms` (11), `registration` (7), `navigation` (4), `receipt-image` (4), `roles` (3) |
| Types | `tsc --noEmit` | tout le projet | — |
| Lint | ESLint 9 + `eslint-config-next` | tout le projet | — |
| Build | `next build` | — | 24 routes statiques |
| Sécurité | `npm audit --omit=dev` (rapport), gitleaks (CI) | — | — |
| Composants / e2e | **aucun** | — | — |

## 2. Baseline (2026-11-19, Node 22.20, npm 10.9, dépendances déjà installées)
| Commande | Résultat | Durée |
|---|---|---|
| `npm run typecheck` | **Réussi** | 5 s |
| `npm run lint` | **Réussi** — 0 erreur, 171 avertissements | 34 s |
| `npm test` | **Réussi** — 56/56 | 1 s |
| `npm run build` (1ʳᵉ exécution) | **Échoué** — `SecurityFatalError` (Next.js vulnérable) après compilation | 16 s |
| `npm run build` (2ᵉ exécution) | **Réussi** | 15 s |
| `npm audit --omit=dev` | 1 vulnérabilité modérée (`next` 16.2.0–16.4.4) | 4 s |
| Couverture | **Non mesurée** | — |

## 3. Stratégie et plan de rattrapage
1. Toute logique nouvelle ou modifiée dans `lib/` : tests `node --test`.
2. Bug corrigé : test de régression d'abord (`/fix`).
3. Mesurer la couverture de `lib/` (`node --test --experimental-test-coverage`), puis « pas de baisse » et 80 % sur
   le nouveau code.
4. Tests de composants : à introduire seulement si nécessaire, après ADR (aucun outil présent aujourd'hui).
5. **E2E** (ADR à rédiger, outil à choisir, ex. Playwright) sur 3 à 5 parcours critiques contre une API de test :
   connexion/expiration de session, ajout d'un séminariste, validation d'un paiement, saisie de notes → bulletin,
   création d'une consultation.
6. Lint : avertissements résorbés par tâches dédiées ; bloquant sur les fichiers modifiés (Phase 6).

## 4. Intégration continue (ADR 0002 du dépôt Backend — étape 1)
| Contrôle | Mode |
|---|---|
| `npm run typecheck` | bloquant |
| `npm run lint` | bloquant sur les erreurs (avertissements = dette F-09) |
| `npm test` | bloquant |
| Couverture de `lib/` (`--experimental-test-coverage`, modules chargés par les tests ; 87,9 % des lignes le 2026-11-19) | rapport |
| `npm run build` | bloquant (cf. F-01) |
| gitleaks diff / historique · `npm audit --omit=dev` | bloquant / rapport · rapport |
