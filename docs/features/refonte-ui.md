# Fonctionnalité — Refonte UI/UX du back-office

- **Statut** : en cours
- **Partie / backlog** : TAF lot 5 — Refonte UI/UX (plan : `d:\GitHub\An Nour\docs\taf\02_REFONTE_BACKOFFICE_PLAN.md`)
- **Dépôts touchés** : Frontend uniquement
- **Décisions** : D1-D15 du plan validées le 2026-11-23 (variante B, bleu primaire, Plus Jakarta Sans, sonner seul,
  mode sombre hors périmètre, gabarits imprimables gelés, menu groupé, coque montée par page, mobile en consultation).
  Palette et police : `docs/adr/0002-palette-et-police-back-office.md`.

## 1. Contexte et objectif
Rendre le back-office moderne, cohérent, accessible (WCAG 2.2 AA) et responsive **sans changement fonctionnel** :
aucun appel d'API ajouté, retiré ou modifié ; `lib/api.ts`, `contexts/`, `lib/roles.ts` intacts.

## 2. Critères d'acceptation (à chaque étape)
- [ ] `npm run typecheck`, `npm run lint` (0 erreur, avertissements ≤ 171), `npm test`, `npm run build` réussis.
- [ ] Inventaire des appels d'API par fichier identique à la référence (voir §6), sauf déplacement justifié.
- [ ] Aucune nouvelle couleur en dur ni classe de palette brute dans les fichiers touchés.
- [ ] Contrastes ≥ 4,5:1 (texte), ≥ 3:1 (composants et focus) ; focus visible ; parcours au clavier.
- [ ] Pas de défilement horizontal de page à 375, 768, 1024, 1440 px.
- [ ] États chargement / vide / erreur présents sur chaque écran migré.

## 3. Comportements à conserver (caractérisation)
| Écran | Comportements |
|---|---|
| Connexion `/` | Connexion par identifiant + mot de passe ; redirection selon le rôle (`homeFor`) ; message d'erreur sur échec |
| Coque | Menu filtré par rôle (`navigationFor`) ; entrée active `aria-current` ; déconnexion ; « Déconnecter tous mes appareils » avec confirmation ; garde `ProtectedRoute` (redirection si non connecté ou rôle refusé) |
| Tableau de bord | Chargement de `dashboardApi.getDashboardData` ; cartes de statistiques ; démographie ; dernières inscriptions |
| Séminaristes | Recherche, filtres, détail, modification, suppression avec confirmation, ajout (admin), actions masquées pour le rôle scientifique |
| Badges / certificats / bulletins | Sélection, aperçu, génération PDF **identique** (gabarits gelés) |
| Finance | Tableau de bord, entrées, sorties (corbeille), paiements (vérification, reçu), rapports ; montants FCFA |
| Santé | Statistiques, séminaristes, consultations (ajout, détail) |
| Recensement CO / Membres CO | Onglets fiches / cas à vérifier, filtres conservés entre onglets, validation/rejet, export |
| Accès | Liste des comptes, activation/désactivation, révocation des sessions, création/modification/suppression |
| Visiteurs, formateurs, avis, attributions, notes | Listes, filtres, pagination, actions existantes |

## 4. Découpage (1 étape = 1 commit) — voir le plan §5
0 Référence · 1 Tokens + police · 2 Coque · 3 Composants communs · 4 Tableaux et filtres · 5 Toasts (sonner) ·
6 Tableau de bord + scientifique · 7 Écrans simples · 8 Séminaristes · 9 Habillage des écrans imprimables ·
10 Finance ✋ · 11 Santé ✋ · 12 Accès ✋ · 13 Connexion ✋ · 14 Revue et documentation.

## 5. Risques et sécurité
Aucune donnée nouvelle manipulée. Zones sensibles (`lib/navigation.ts`, `components/auth/`, `app/acces`,
`app/finance/**`, `app/sante/**`) : diff présenté avant commit, aucune logique modifiée. La préférence de repli de
la barre latérale est stockée en `localStorage` (aucune donnée personnelle). La recherche textuelle n'est jamais
placée dans l'URL.

## 6. Tests prévus
- Automatiques à chaque étape : typecheck, lint, `node --test`, build.
- Inventaire des appels d'API : script `grep` sur `app`, `components`, `hooks` (motifs `xxxApi.méthode`, `fetch(`),
  comparé à la référence prise sur `origin/mdev` (53178c7).
- **À valider manuellement** (Preview Vercel) : captures 375/768/1024/1440 px, parcours clavier, un compte de test
  par rôle, PDF imprimables comparés à ceux produits sur `mdev`.

## 7. Proposition UI
Voir le plan §3-§4 et `docs/DESIGN_SYSTEM.md` (mis à jour à l'étape 14).

## 8. Questions ouvertes
- Indicateurs du tableau de bord par rôle (D11) : proposition faite à l'étape 6, à confirmer.
- `super_admin` (lot 3) non présent dans le code : l'écran Accès et la connexion seront repris après sa fusion.
