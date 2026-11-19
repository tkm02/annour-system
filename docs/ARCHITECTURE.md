# Architecture — An-Nour Frontend (back-office)

> Architecture **constatée** (2026-11-19). Vue des 4 applications : dépôt Backend, `docs/SYSTEME_GLOBAL.md`.

## 1. Arborescence
```
app/                       # Next.js App Router — 24 pages, toutes sous app/<route>/page.tsx
├── layout.tsx             # racine : polices Geist, ThemeProvider, AuthProvider, 2 Toaster, Vercel Analytics
├── page.tsx               # connexion
├── dashboard/  seminaristes/(ajouter)  badges/  certificats/  membres-co/  visiteurs/  feedback/  acces/
├── scientifique/  attributions/  notes/  bulletins/  formateurs/
├── finance/(entrees|sorties|paiements|rapports)
├── sante/(seminaristes|consultations)
└── inscription/
components/
├── auth/                  # login-form, protected-route (garde côté client)
├── layout/                # dashboard-layout, header, sidebar (menus selon le rôle)
├── common/                # states (chargement/vide/erreur), pager, confirm-dialog, bar-chart
├── access/ dashboard/ finance/ health/ scientific/ seminaristes/   # composants métier
└── ui/                    # primitives shadcn/ui (Radix)
contexts/auth-context.tsx  # état de session (token + utilisateur en localStorage)
hooks/                     # use-mobile, use-toast
lib/
├── api.ts                 # client API unique : base URL, en-tête Bearer, erreurs, 401 → déconnexion, modules par domaine
├── roles.ts navigation.ts # rôles (alignés sur le backend) et menus par rôle
├── edition.ts             # données de l'édition (NEXT_PUBLIC_EDITION_*)
├── *-pdf.ts pdf-generator.ts receipt-image.ts   # génération PDF/images côté client
└── finance-forms.ts consultation-form.ts registration.ts payment-status.ts format.ts utils.ts
tests/                     # tests unitaires node --test (.mjs)
public/                    # logos, fonds de certificats
```

## 2. Flux
```
Utilisateur ─► page (client component) ─► lib/api.ts ──fetch + Authorization: Bearer <token>──► API /api/v1
                     ▲                         │
                     │                         ├─ 2xx → données typées
                     └── états UI ◄────────────┼─ 401 (avec token) → logout + retour à la connexion
                        (common/states)        └─ autres erreurs → message français (table de messages par statut)
```
- **Authentification** : `authApi.login` stocke `authToken`, `tokenType` et `user` dans `localStorage` ;
  `contexts/auth-context.tsx` recharge la session au montage. Pas de `middleware.ts` : la protection des pages est
  côté client (`components/auth/protected-route.tsx`) ; l'autorisation réelle est faite par l'API.
- **Rôles** : `lib/navigation.ts` construit les menus par rôle (admin, scientifique, finances, sante).
- **Base URL** : `NEXT_PUBLIC_API_URL`, sinon l'API de production (`lib/api.ts`).
- **Génération de documents** (badges, certificats, bulletins, reçus, rapports) : côté navigateur (jspdf, canvas,
  qrcode) ; les QR des badges pointent vers le site public (URL écrite en dur).

## 3. Points d'attention
- Pages très volumineuses : `app/badges/page.tsx` (2 817 l.), `certificats` (1 388 l.), `bulletins` (1 088 l.).
- Deux systèmes de notifications (`react-hot-toast` et `sonner`).
- `styles/globals.css` est un doublon non importé de `app/globals.css`.
- Décisions existantes : `adr/0001-etat-initial-et-choix-existants.md`.
