# Configuration Locale - Système An-Nour

> ⚠️ **Document historique, obsolète.** Il décrit l'installation prévue avec un backend Django qui n'a pas été
> retenu (l'API réelle est en FastAPI : dépôt `ym-0-bm/An-Nour-Backend`). Références à jour : `CLAUDE.md` §3,
> `CONTRIBUTING.md`, `docs/ENVIRONMENTS.md` et `.env.example`.

## Prérequis

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 ou **yarn** >= 1.22.0
- **Git**

## Installation

### 1. Cloner le projet
\`\`\`bash
git clone <repository-url>
cd an-nour-management
\`\`\`

### 2. Installer les dépendances
\`\`\`bash
npm install
# ou
yarn install
\`\`\`

### 3. Configuration de l'environnement
Créer un fichier `.env.local` à la racine du projet :

\`\`\`env
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# API Backend (à configurer quand Django sera implémenté)
NEXT_PUBLIC_API_URL=http://localhost:8000/api
API_SECRET_KEY=your-secret-key-here

# Base de données (pour Django)
DATABASE_URL=postgresql://user:password@localhost:5432/annour_db

# JWT
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRE_TIME=24h

# Email (pour notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Upload de fichiers
UPLOAD_MAX_SIZE=5MB
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf
\`\`\`

### 4. Lancer le serveur de développement
\`\`\`bash
npm run dev
# ou
yarn dev
\`\`\`

L'application sera accessible sur `http://localhost:3000`

## Comptes de Test

Utilisez ces identifiants pour tester les différents rôles :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Super Admin | `superadmin@annour.com` | `admin123` |
| Administration | `admin@annour.com` | `admin123` |
| Scientifique | `scientifique@annour.com` | `science123` |
| Santé | `sante@annour.com` | `sante123` |
| Finance | `finance@annour.com` | `finance123` |

## Scripts Disponibles

\`\`\`bash
# Développement
npm run dev          # Lancer le serveur de développement
npm run build        # Build de production
npm run start        # Lancer en mode production
npm run lint         # Vérifier le code avec ESLint
npm run lint:fix     # Corriger automatiquement les erreurs ESLint

# Tests
npm run test         # Lancer les tests
npm run test:watch   # Tests en mode watch
npm run test:coverage # Tests avec couverture de code

# Base de données (quand Django sera configuré)
npm run db:migrate   # Appliquer les migrations
npm run db:seed      # Peupler la base avec des données de test
npm run db:reset     # Réinitialiser la base de données
\`\`\`

## Structure du Projet

\`\`\`
an-nour-management/
├── app/                    # Pages Next.js (App Router)
│   ├── dashboard/         # Dashboard principal
│   ├── seminaristes/      # Gestion des séminaristes
│   ├── scientifique/      # Module scientifique
│   ├── sante/            # Module santé
│   ├── acces/            # Gestion des accès
│   └── page.tsx          # Page de connexion
├── components/            # Composants React
│   ├── auth/             # Authentification
│   ├── dashboard/        # Composants dashboard
│   ├── layout/           # Layout et navigation
│   ├── seminaristes/     # Composants séminaristes
│   ├── scientific/       # Composants scientifiques
│   ├── health/           # Composants santé
│   ├── access/           # Composants accès
│   └── ui/               # Composants UI de base
├── docs/                 # Documentation
├── lib/                  # Utilitaires et helpers
├── public/               # Fichiers statiques
└── types/                # Types TypeScript
\`\`\`

## Debugging

### 1. Debugging Frontend (React)
- Utiliser les **React Developer Tools**
- Console du navigateur pour les logs
- Breakpoints dans le code avec `debugger;`

### 2. Debugging avec VS Code
Créer `.vscode/launch.json` :

\`\`\`json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/next",
      "args": ["dev"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
\`\`\`

### 3. Logs de Debug
Utiliser les logs avec préfixe pour identifier les sources :
\`\`\`typescript
console.log("[v0] Auth:", user);
console.log("[v0] API Response:", data);
console.error("[v0] Error:", error);
\`\`\`

## Tests

### 1. Tests Unitaires
\`\`\`bash
# Lancer tous les tests
npm run test

# Tests en mode watch
npm run test:watch

# Tests avec couverture
npm run test:coverage
\`\`\`

### 2. Tests d'Intégration
\`\`\`bash
# Tests E2E avec Playwright (à configurer)
npm run test:e2e
\`\`\`

### 3. Structure des Tests
\`\`\`
__tests__/
├── components/           # Tests des composants
├── pages/               # Tests des pages
├── utils/               # Tests des utilitaires
└── setup.ts             # Configuration des tests
\`\`\`

## Configuration Backend Django (Futur)

### 1. Installation Python
\`\`\`bash
# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Installer Django et dépendances
pip install django djangorestframework django-cors-headers
pip install psycopg2-binary python-decouple
\`\`\`

### 2. Structure Django
\`\`\`
backend/
├── annour/              # Projet Django principal
├── apps/                # Applications Django
│   ├── authentication/ # Authentification
│   ├── seminaristes/   # Gestion séminaristes
│   ├── scientific/     # Module scientifique
│   ├── health/         # Module santé
│   └── access/         # Gestion accès
├── requirements.txt     # Dépendances Python
└── manage.py           # Script Django
\`\`\`

## Dépannage

### Problèmes Courants

1. **Port 3000 déjà utilisé**
   \`\`\`bash
   lsof -ti:3000 | xargs kill -9
   # ou changer le port
   npm run dev -- -p 3001
   \`\`\`

2. **Erreurs de dépendances**
   \`\`\`bash
   rm -rf node_modules package-lock.json
   npm install
   \`\`\`

3. **Problèmes de cache**
   \`\`\`bash
   npm run build
   rm -rf .next
   npm run dev
   \`\`\`

### Logs Utiles
- **Next.js** : `.next/trace` et console du navigateur
- **Network** : Onglet Network des DevTools
- **Performance** : React Profiler

## Contribution

1. Créer une branche pour chaque fonctionnalité
2. Suivre les conventions de nommage
3. Écrire des tests pour les nouvelles fonctionnalités
4. Documenter les changements importants

## Support

Pour toute question ou problème :
1. Vérifier la documentation
2. Consulter les logs d'erreur
3. Tester avec les comptes de démonstration
4. Vérifier la configuration des variables d'environnement
