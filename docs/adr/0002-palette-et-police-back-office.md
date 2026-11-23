# ADR 0002 — Palette, police et formes du back-office

- **Statut** : Accepté (2026-11-23, validation de l'utilisateur sur le plan `docs/taf/02_REFONTE_BACKOFFICE_PLAN.md`)
- **Portée** : back-office (`An Nour Frontend`). Le site public `an-nour` et la PWA feront l'objet d'une décision séparée.

## Contexte
- `app/globals.css` utilisait le vert An-Nour comme `--primary` avec un texte blanc : contraste **2,16:1** (WCAG AA
  exige 4,5:1). Tous les boutons et badges par défaut étaient illisibles (F-02).
- L'anneau de focus (`--ring`, 10 % de noir) était invisible : **1,11:1** (F-17).
- Deux documents se contredisaient : plan TAF §3.3 (bleu primaire, vert accent) et `Backend/docs/DESIGN_SYSTEM.md` §4
  (vert primaire, bleu secondaire).
- 5 verts, 2 bleus et 3 sarcelles quasi identiques étaient écrits en dur.

## Décision (variante B « SaaS clair à accents de marque »)
| Rôle | Token | Valeur |
|---|---|---|
| Primaire (boutons, liens, focus) | `--primary`, `--ring`, `--an-blue-700` | `#004576` |
| Survol primaire | `--an-blue-800` | `#003A63` |
| Accent (survol, élément actif) | `--accent`, `--an-blue-50` | `#EEF5FA` + texte `#004576` |
| Marque (logo, indicateurs, décor) | `--brand`, `--an-green-500` | `#AACD06` — **jamais en couleur de texte** |
| Texte | `--foreground` / `--muted-foreground` | `#1F2937` / `#4B5563` |
| Fonds | `--background` / `--card` / `--muted` | `#F9FAFB` / `#FFFFFF` / `#F3F4F6` |
| Bordures | `--border` / `--input` | `#E5E7EB` / `#8A919C` |
| Succès, alerte, erreur, info | `--success`, `--warning`, `--destructive`, `--info` (+ `-soft`, `-strong`) | voir `docs/DESIGN_SYSTEM.md` |

- `--secondary` reste le **bleu de marque** pour compatibilité (23 usages `text-secondary` dans le code existant).
- Police : **Plus Jakarta Sans** via `next/font/google` (intégré à Next, aucune dépendance ajoutée) ; Geist Mono
  conservée pour les identifiants et montants.
- Rayon de base 8 px ; 3 niveaux d'ombre ; casse de phrase.
- Anneau de focus : `ring-ring/70` (4,42:1 sur blanc) au lieu de `ring-ring/50` (2,69:1).
- Mode sombre : **hors périmètre** ; le bloc `.dark` est conservé mais n'est jamais activé.

## Contrastes calculés (formule WCAG 2.x)
| Couple | Ratio |
|---|---|
| Blanc sur primaire `#004576` | 9,94 |
| Primaire sur fond de page / sur accent / sur marque | 9,51 / 9,03 / 5,42 |
| Texte `#1F2937` sur blanc / fond de page | 14,68 / 14,05 |
| Texte secondaire `#4B5563` sur blanc / atténué | 7,56 / 6,87 |
| Méta `#6B7280` sur blanc / fond de page | 4,83 / 4,63 |
| Bordure de champ `#8A919C` sur blanc | 3,18 |
| Blanc sur destructif `#B91C1C` | 6,47 |
| Badges succès / alerte / erreur / info | 6,49 / 6,37 / 6,80 / 6,59 |
| Couleurs de graphique sur blanc (6) | 3,82 à 9,94 |
| Anneau de focus (primaire à 70 %) sur blanc | 4,42 |
| Marque `#AACD06` sur blanc | 1,83 → interdit en texte |

## Alternatives écartées
- **A. Institutionnel sobre** (sidebar bleu plein) : lourd sur tablette, logo clair inexistant.
- **C. Chaleureux identitaire** (couleurs du site public) : s'écarte du couple bleu/vert, plus long à livrer.
- Garder le vert primaire en assombrissant le texte : le vert reste trop clair pour les liens et le texte.

## Conséquences
- Les gabarits imprimables (badges, certificats, bulletins, PDF) gardent leurs couleurs pendant le lot 5 (gel) ;
  leur alignement sur cette palette est un chantier ultérieur.
- `Backend/docs/DESIGN_SYSTEM.md` §4 devra être aligné (rôle de `--primary`) par une PR sur le dépôt Backend.
