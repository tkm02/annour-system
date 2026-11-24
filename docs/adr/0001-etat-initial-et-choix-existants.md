# ADR 0001 — État initial et choix existants (back-office)

- **Statut** : accepté (documentation a posteriori)
- **Date** : 2026-11-19
- **Dépôts concernés** : Frontend (décisions transverses : dépôt Backend, ADR 0001)

## Contexte
Le back-office tourne en production avant la mise en place de ce cadre. Cet ADR consigne les choix **déjà faits**,
sans les remettre en cause ; toute évolution passera par un nouvel ADR.

## Décisions constatées
| # | Décision | Conséquences |
|---|---|---|
| 1 | Projet initialisé avec **v0.dev** (nom `my-v0-project`), **Next.js App Router** + **shadcn/ui** + **Tailwind 4** | composants `components/ui` générés ; nombreuses dépendances Radix |
| 2 | Application **côté client** : 18 pages sur 24 en `"use client"`, aucun route handler ni middleware Next | protection des pages côté client ; autorisation réelle par l'API |
| 3 | **Client API unique** `lib/api.ts` avec base URL `NEXT_PUBLIC_API_URL` (repli sur l'API de production) | point de contrôle unique pour token, erreurs et 401 |
| 4 | **JWT en `localStorage`**, déconnexion automatique sur 401 | simple ; exposé en cas de XSS |
| 5 | Rôles et menus recopiés du backend (`lib/roles.ts`, `lib/navigation.ts`) | à maintenir alignés manuellement |
| 6 | **Documents générés dans le navigateur** (jspdf, canvas, qrcode) : badges, certificats, bulletins, reçus, rapports | pas de charge serveur ; pages volumineuses |
| 7 | Tests unitaires avec le **runner natif `node --test`** (pas de Jest/Vitest) | aucune dépendance de test ; pas de tests de composants |
| 8 | Hébergement **Vercel** + `@vercel/analytics` | rollback instantané via Vercel |
| 9 | Ancienne cible **Django** abandonnée au profit de FastAPI | docs Django historiques à archiver |

## Suivi
`TECH_DEBT.md`, `SECURITY.md`. ADR attendus : stockage des jetons/CSP, bibliothèque de notifications, palette commune,
outil e2e.
