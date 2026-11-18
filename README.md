# Système de Gestion An-Nour

Un système complet de gestion pour le séminaire intercommunal de formation islamique et managériale An-Nour.

## 🎯 Objectifs

- Faciliter la gestion du séminaire avant et après l'événement
- Gagner du temps et optimiser les activités des comités
- Centraliser toutes les informations des séminaristes et des activités

## 🎨 Design

- **Couleurs principales** : Vert #AACD06 et Bleu #004576
- **Design responsive** compatible PC, tablette et mobile
- **Interface moderne** avec navigation intuitive

## 🚀 Fonctionnalités

### SuperAdmin
- ✅ Création et suppression de comptes administrateurs
- ✅ Génération des identifiants de connexion
- ✅ Tableau de bord détaillé avec statistiques et état d'avancement

### Comité Administration
- ✅ Interface de connexion sécurisée
- ✅ Communication avec tous les comités
- ✅ Création de comptes mini-administrateurs
- ✅ Partage des tâches par l'administrateur du comité
- ✅ Inscription des membres du comité d'organisation
- ✅ Enregistrement des séminaristes
- ✅ Génération de badges (formateur, visiteur, séminariste, comité d'organisation)
- ✅ Génération de diplômes (formateur, séminariste, comité d'organisation, remerciement)
- ✅ Génération de billets de santé
- ✅ Génération de PDF avec la liste des séminaristes
- ✅ Interface de modification des informations des séminaristes
- ✅ Génération de bulletins

### Comité Scientifique
- ✅ Toutes les fonctionnalités des autres comités
- ✅ Établissement du programme de formation
- ✅ Planification des emplois du temps
- ✅ Ajout des notes des séminaristes
- ✅ Gestion des emplois du temps (modifiables)
- ✅ Communication étroite avec le comité d'administration
- ✅ Établissement du programme général du séminaire
- ✅ Ajout des séminaristes dans une classe
- ✅ Calcul automatique de la moyenne

### Comité Santé
- ✅ Fonctionnalités basiques des autres comités
- ✅ Gestion des consultations médicales
- ✅ Suivi des antécédents médicaux
- ✅ Génération de fiches de consultation
- ✅ Statistiques de santé

### Comité Finance
- ✅ Fonctionnalités basiques des autres comités
- ✅ Vente de tickets
- ✅ Paiement et suivi des paiements
- ✅ Génération de tickets

## 🛠️ Technologies

- **Frontend** : React avec Next.js 15
- **Styling** : Tailwind CSS v4
- **UI Components** : shadcn/ui
- **Icons** : Lucide React
- **Backend** : Django Python (à implémenter)

## 📱 Pages et Modules

### Authentification
- Page de connexion avec logo An-Nour
- Gestion des sessions utilisateur

### Dashboard
- Statistiques générales
- Données démographiques
- Enregistrements récents
- Navigation vers tous les modules

### Gestion des Séminaristes
- Liste complète avec recherche et filtres
- Ajout de nouveaux séminaristes
- Modification des informations
- Suppression avec confirmation
- Export des données

### Module Scientifique
- Gestion des notes par niveau
- Génération de bulletins individuels
- Calcul automatique des moyennes
- Statistiques académiques

### Module Santé
- Gestion des consultations
- Fiches médicales détaillées
- Suivi des antécédents
- Statistiques de santé

### Gestion des Accès
- Création d'utilisateurs par commission
- Modification des permissions
- Suppression sécurisée des accès

## 🎨 Couleurs du Système

\`\`\`css
/* Couleurs principales An-Nour */
--primary: #AACD06;     /* Vert An-Nour */
--secondary: #004576;   /* Bleu An-Nour */
--background: #ffffff;  /* Blanc */
--foreground: #333333;  /* Gris foncé */
--muted: #f0f0f0;      /* Gris clair */
\`\`\`

## 📋 Structure du Projet

\`\`\`
├── app/
│   ├── page.tsx                 # Page de connexion
│   ├── dashboard/               # Tableau de bord
│   ├── seminaristes/           # Gestion séminaristes
│   ├── scientifique/           # Module scientifique
│   ├── notes/                  # Gestion des notes
│   ├── sante/                  # Module santé
│   └── acces/                  # Gestion des accès
├── components/
│   ├── auth/                   # Composants d'authentification
│   ├── dashboard/              # Composants du dashboard
│   ├── layout/                 # Layout et navigation
│   ├── seminaristes/           # Composants séminaristes
│   ├── scientific/             # Composants scientifiques
│   ├── health/                 # Composants santé
│   ├── access/                 # Composants gestion accès
│   └── ui/                     # Composants UI réutilisables
\`\`\`

## 🚀 Installation et Démarrage

1. Cloner le projet
2. Installer les dépendances : `npm ci`
3. Copier `.env.example` en `.env.local` et renseigner `NEXT_PUBLIC_API_URL`
4. Lancer le serveur de développement : `npm run dev`
5. Ouvrir [http://localhost:3000](http://localhost:3000)

### Vérifications (lancées aussi par la CI)

| Commande | Rôle |
|---|---|
| `npm run typecheck` | Vérification des types TypeScript |
| `npm run lint` | ESLint (configuration `eslint.config.mjs`) : bloquant sur les erreurs, avertissements = dette suivie |
| `npm test` | Tests unitaires (`tests/*.test.mjs`, Node `--test`) |
| `npm run build` | Build de production Next.js |

### Pages par rôle

L'accès aux pages est décrit dans `lib/navigation.ts` (matrice route → rôles, menus par rôle, page d'accueil
après connexion). Une page interdite affiche « Accès refusé » ; le serveur reste seul juge des droits.

| Rôle | Pages |
|---|---|
| `admin` | Tableau de bord, Séminaristes (+ export Excel), Badges, Certificats, Membres CO, Visiteurs, Avis, Gérer les accès, Finances, Paiements, Santé |
| `scientifique` | Tableau de bord, Séminaristes, Scientifique, Attributions, Notes, Bulletins, Formateurs |
| `finances` | `/finance` (tableau de bord), Entrées, Sorties, Paiements, Rapports |
| `sante` | `/sante` (tableau de bord), Séminaristes (fiche médicale), Consultations |

La page publique `/inscription` (sans connexion) crée l'inscription puis envoie le reçu Wave. Son ouverture est
contrôlée par le backend (variable `REGISTRATIONS_OPEN`, route `GET /registrations/status`).

### Nouvelle édition du séminaire

Les dates, le lieu, le numéro d'édition et l'année des bulletins utilisés dans les certificats, bulletins et
fiches PDF sont dans `lib/edition.ts` (surcharge possible par les variables `NEXT_PUBLIC_EDITION_*`).
**À mettre à jour avant chaque édition** ; `anneeScolaire` doit rester identique pendant toute l'édition
(clé des rangs des bulletins côté serveur).

## 📝 Notes de Développement

- Interface entièrement responsive
- Navigation intuitive avec sidebar
- Modals pour toutes les actions importantes
- Système de couleurs cohérent
- Composants réutilisables
- Code TypeScript strict

## 🔮 Prochaines Étapes

- Tests de composants et parcours navigateur de bout en bout
- Réduction des avertissements ESLint (règles React Compiler sur les pages historiques)
- Token en cookie `httpOnly` + refresh token (décision d'architecture reportée)
- Système de notifications

---

**An Nour, pour une spiritualité étincelante.**
