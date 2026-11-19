# Lignes directrices UX — An-Nour Frontend (back-office)

## 1. Utilisateurs et parcours clés existants
| Utilisateur | Parcours critiques |
|---|---|
| Comité administration (`admin`) | connexion → liste des séminaristes → fiche / modification → badge PDF ; gestion des accès (création, révocation) ; export |
| Comité finances (`finances`) | paiements à traiter → vérification du reçu → validation/rejet motivé ; saisie entrée/sortie ; rapport PDF |
| Comité santé (`sante`) | recherche d'un séminariste → fiche médicale → nouvelle consultation → export |
| Comité scientifique (`scientifique`) | saisie des notes par niveau → génération des bulletins (rangs) → PDF |
Contexte d'usage : séminaire sur site, ordinateurs et téléphones, connexion parfois instable.

## 2. Principes (heuristiques de Nielsen appliquées)
1. **Visibilité de l'état** : tout chargement > 300 ms affiche un indicateur (`components/common/states.tsx`) ; toute
   action affiche un retour (toast de succès ou message d'erreur explicite).
2. **Langage des utilisateurs** : libellés métier en français (« séminariste », « reçu », « consultation »),
   pas de codes techniques ni de messages anglais.
3. **Contrôle et liberté** : annulation possible des dialogues ; suppression de sorties avec corbeille/restauration
   (déjà en place côté API).
4. **Prévention des erreurs** : confirmation (`confirm-dialog.tsx`) avant toute action destructive ou irréversible ;
   validation des formulaires avant envoi, messages au niveau du champ.
5. **Cohérence** : mêmes composants pour les mêmes actions (un seul style de bouton primaire, destructif, secondaire).
6. **Reconnaissance plutôt que rappel** : filtres et recherche persistants pendant la navigation d'une liste.
7. **Gestion des erreurs** : 401 → « Session expirée, veuillez vous reconnecter » et retour à la connexion ;
   403 → « Accès refusé » sans détails ; erreur réseau → message + bouton « Réessayer ».

## 3. États obligatoires par écran
Chargement · vide (avec action suggérée) · erreur (avec réessai) · succès · désactivé (bouton pendant l'envoi pour
éviter les doublons) · survol · focus visible.

## 4. Accessibilité (WCAG 2.2 AA)
- Contraste ≥ 4,5:1 pour le texte (≥ 3:1 grands textes et composants) — cf. `DESIGN_SYSTEM.md` §3.
- `alt` sur les images porteuses de sens ; `aria-label` sur les boutons-icônes ; focus visible, navigation clavier
  complète dans les dialogues (Radix le gère : ne pas le contourner).
- Cibles tactiles ≥ 24×24 px (44×44 recommandé sur mobile).
- Ne jamais transmettre une information par la seule couleur (statuts de paiement : couleur + libellé).

## 5. Responsive
Mise en page utilisable de 360 px à 1440 px : barre latérale repliable (`use-mobile`), tableaux avec défilement
horizontal ou affichage en cartes sur mobile, dialogues plein écran sur petit écran.

## 6. Microcopie
Verbes d'action à l'infinitif sur les boutons (« Enregistrer », « Valider le paiement ») ; confirmations qui nomment
l'objet (« Supprimer la sortie FIN-0042 ? ») ; dates au format français ; montants en FCFA avec séparateur de milliers.
