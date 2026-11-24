# Audit initial — An-Nour Frontend (extrait)

> Extrait, pour ce dépôt, de l'audit transverse du 2026-11-19 (Phase 1, lecture seule). Audit complet des 4 dépôts :
> dépôt Backend, `docs/audit/AUDIT_INITIAL.md`. Instantané : le suivi vivant est dans `docs/TECH_DEBT.md`.

## 1. Identification
Remote `tkm02/annour-system` · branche d'intégration `mdev` · 57 commits · contributeurs : MAMADOU TUO, Mo, ym-0-bm,
Kouyatemamadou · arbre propre au moment de l'audit.

## 2. Stack constatée
Next.js 16.4.3 (App Router) · React 19.3.1 · TypeScript 5 · Tailwind 4.1 · shadcn/ui (Radix) · lucide-react ·
recharts · jspdf · qrcode · sonner + react-hot-toast · next-themes · Geist · `@vercel/analytics` · Node 22 ·
ESLint 9 · tests `node --test`. Détail : `docs/ARCHITECTURE.md`.

## 3. Baseline
| Commande | Résultat | Durée |
|---|---|---|
| `npm ls --depth=0` | arbre cohérent | 8 s |
| `npm run typecheck` | **Réussi** | 5 s |
| `npm run lint` | **Réussi** — 0 erreur, 171 avertissements | 34 s |
| `npm test` | **Réussi** — 56/56 | 1 s |
| `npm run build` | **Échoué** (1ʳᵉ exécution, `SecurityFatalError` : Next.js vulnérable) puis **Réussi** (2ᵉ) | 16 s / 15 s |
| `npm audit --omit=dev` | 1 modérée (`next` 16.2.0–16.4.4) | 4 s |
Effet de bord : le build réécrit `next-env.d.ts` (versionné) ; restauré après la baseline.

## 4. Constats principaux
- 🔴 Next.js vulnérable (build interrompu une fois).
- 🟠 Contraste texte blanc / vert primaire ≈ 2:1 ; pages monolithiques non testées (badges 2 817 l.) ; JWT en
  `localStorage` sans CSP ; docs Django obsolètes ; CI seulement sur `main` ; ancienne clé Django dans l'historique.
- 🟡 171 avertissements ESLint, 6 dépendances `latest`, deux bibliothèques de toast, `styles/globals.css` inutilisé,
  `next-env.d.ts` versionné, URL du site public en dur, couleurs en dur dans les gabarits imprimables.
- Points positifs : client API centralisé avec gestion du 401, rôles alignés sur le backend et testés, tokens de
  thème majoritairement utilisés, CI avec `npm ci`, typecheck, build et gitleaks.

Détail et priorités : `docs/TECH_DEBT.md`, `docs/SECURITY.md`, `docs/DESIGN_SYSTEM.md`.
