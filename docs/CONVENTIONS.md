# Conventions — An-Nour Frontend

## 1. Conventions observées (état au 2026-11-19)
- **Fichiers** : composants en `kebab-case.tsx` (`seminaristes-table.tsx`), regroupés par domaine dans
  `components/<domaine>/` ; pages dans `app/<route>/page.tsx` ; utilitaires dans `lib/`.
- **Imports** : alias `@/` (`@/lib/api`, `@/components/ui/button`).
- **Langue** : libellés, messages et commentaires en français ; identifiants mixtes FR/EN.
- **Réseau** : appels centralisés dans `lib/api.ts` (modules par domaine, types TypeScript des réponses, messages
  d'erreur par statut HTTP).
- **UI** : primitives shadcn/ui (`components/ui/`), icônes `lucide-react`, Tailwind 4 ; états de chargement, vide et
  erreur via `components/common/states.tsx` ; confirmations via `components/common/confirm-dialog.tsx`.
- **Formulaires** : logique de validation extraite dans `lib/*-forms.ts` (testée), `react-hook-form` disponible.
- **Couleurs** : beaucoup de couleurs en dur (`bg-[#A6C33C]`…) au lieu des tokens (cf. `DESIGN_SYSTEM.md`).
- **Qualité** : TypeScript sans erreur ; ESLint 0 erreur, 171 avertissements (49 `no-explicit-any`, 35 variables
  inutilisées, 24 `<img>` au lieu de `next/image`…).
- **Commits** : historiques hétérogènes (`fixe feedback`, `commit manage`, `chore: …`).

## 2. Règles cibles (nouveau code et code modifié)
1. Tout appel réseau passe par `lib/api.ts` avec un type de réponse ; pas de `fetch` direct dans les composants.
2. Pas de `any` nouveau ; pas de variable inutilisée ; ESLint sans avertissement sur les lignes modifiées.
3. Couleurs uniquement via les tokens du thème (`bg-primary`, `text-secondary`, variables CSS) ; pas de nouvelle
   couleur hexadécimale en dur.
4. Réutiliser les composants existants (`components/ui`, `components/common`) avant d'en créer ; un composant
   nouveau ne dépasse pas ~300 lignes (extraire sous-composants et logique dans `lib/`).
5. Chaque écran gère chargement, vide, erreur, succès, et les réponses 401/403 de l'API.
6. Logique pure (calculs, validations, transformations) dans `lib/` et testée par `node --test`.
7. Une seule bibliothèque de notifications pour le nouveau code (à décider par ADR : `sonner` recommandé, déjà
   intégré à shadcn).
8. Dépendances : version explicite, jamais `latest`.
9. Commits : Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`, `security:`, `ci:`).
