# Design system — An-Nour Frontend (back-office)

> Formalisé à partir des styles **réellement utilisés** (2026-11-19). Palette commune proposée pour les 3 interfaces :
> dépôt Backend, `docs/DESIGN_SYSTEM.md` (tokens `--an-*`). **Aucun style n'a été modifié** : la mise en conformité
> se fera par tâches dédiées, après validation de la palette (ADR).

## 1. Tokens actuels (`app/globals.css`, thème shadcn + Tailwind 4)
| Token | Valeur (oklch) | Équivalent commenté | Usage constaté (classes) |
|---|---|---|---|
| `--primary` / `--accent` | `oklch(0.75 0.15 120)` | `#AACD06` vert An-Nour | `bg-primary` ×52, `bg-accent` ×42, `text-primary` ×22 |
| `--primary-foreground` | blanc | `#ffffff` | texte sur `bg-primary` |
| `--secondary` | `oklch(0.3 0.1 240)` | `#004576` bleu An-Nour | — |
| `--accent-foreground` | `oklch(0.3 0.1 240)` | `#004576` | ×32 |
| `--destructive` | `oklch(0.6 0.2 20)` | `#ff4d4d` | `text-destructive` ×48, `bg-destructive` ×21 |
| `--foreground` / `--muted-foreground` | gris | `#333333` | `text-muted-foreground` ×258, `text-foreground` ×97 |
| `--radius` | `0.5rem` | — | `rounded-md` ×64, `rounded-lg` ×47, `rounded` ×66 |
Mode sombre défini (`.dark`). Police : **Geist Sans** (texte) et **Geist Mono**.

→ L'interface elle-même utilise **majoritairement les tokens** : c'est une bonne base.

## 2. Couleurs écrites en dur (hors tokens)
| Couleur | Occurrences | Où | Token cible proposé |
|---|---|---|---|
| `#A6C33C` | 75 | `app/badges/page.tsx`, `app/certificats/page.tsx` | `--an-green-500` |
| `#AC3`, `#9B2`, `#95B035` | 7, 4, 4 | `app/badges/page.tsx`, `app/certificats/page.tsx` | `--an-green-500` (quasi-doublons) |
| `#AACD06` | 5 | `app/globals.css`, `components/common/bar-chart.tsx` | `--an-green-500` (à arbitrer) |
| `#008080`, `#006666` | 23, 1 | `app/bulletins/page.tsx` | `--an-teal-700` |
| `#143264` | 12 | `app/certificats/page.tsx` | `--an-blue-900` |
| `#004576` | 4 | `app/globals.css` (commentaires) | `--an-blue-900` (à arbitrer) |
| `#0F766E` | 1 | `lib/pdf-generator.ts` | `--an-teal-700` |
| `#FF4D4D` | 2 | `app/globals.css` | `--an-error` |
Les couleurs en dur se concentrent dans les **gabarits imprimables** (badges, certificats, bulletins, PDF) ; ils
peuvent garder des constantes de couleur dédiées, mais issues de la même palette.

Classes Tailwind de palette brute (hors tokens) : `gray-*` (≈ 60), `red-*` (≈ 40, erreurs), `green-*` (≈ 20),
`blue-600`, `pink-*`, `yellow-*`, `emerald-*` — notamment dans `app/acces`, `app/feedback`, `components/access/*`,
`components/auth/login-form.tsx`, `components/finance/payments-manager.tsx`.

## 3. Problème d'accessibilité identifié
`--primary` (vert clair, luminance élevée) avec `--primary-foreground` **blanc** donne un contraste d'environ 2:1,
sous le minimum WCAG AA (4,5:1 texte, 3:1 composants). À corriger lors de la mise en conformité : texte
`--an-blue-900` sur fond vert (≈ 6:1), ou vert réservé aux fonds décoratifs.

## 4. Typographie et formes (constaté)
Tailles les plus utilisées : `text-sm` ×239, `text-xs` ×95, `text-lg` ×37, `text-2xl` ×37 ; graisses `font-bold`
×136, `font-medium` ×119, `font-semibold` ×78. Rayons : `rounded`/`rounded-md`/`rounded-lg` mélangés.
Cible : titres `text-2xl font-semibold`, sous-titres `text-lg font-medium`, texte `text-sm`, rayon par défaut
`rounded-md` (= `--radius`).

## 5. Composants de référence
Boutons, champs, dialogues, tableaux, badges, onglets : `components/ui/*` (shadcn). États :
`components/common/states.tsx`. Confirmation : `components/common/confirm-dialog.tsx`. Pagination :
`components/common/pager.tsx`. Graphiques : `components/common/bar-chart.tsx`, `recharts`.
