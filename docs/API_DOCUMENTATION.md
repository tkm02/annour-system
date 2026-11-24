# Documentation API - Système de Gestion An-Nour

> ⚠️ **Document historique, obsolète.** Il décrit une API Django prévue à l'origine, pas l'API réelle
> (FastAPI). Plusieurs routes citées ici n'existent pas (`/auth/refresh`, `/seminarists/import-csv/`…).
> Références à jour : documentation interactive `GET /docs` sur l'URL du backend, client typé `lib/api.ts`
> et `An Nour Doc/Taches_Frontend_AnNour.md`.


## Vue d'ensemble

Cette documentation décrit toutes les APIs nécessaires pour le backend Django du système de gestion du séminaire An-Nour.

**Base URL:** `http://localhost:8000/api/v1/`

**Authentification:** JWT Token dans le header `Authorization: Bearer <token>`

---

## 1. AUTHENTIFICATION

### POST /auth/login
Connexion utilisateur
\`\`\`json
Request:
{
  "email": "admin@annour.com",
  "password": "admin123"
}

Response:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "admin@annour.com",
    "username": "admin",
    "role": "ADMINISTRATION",
    "permissions": ["view_dashboard", "manage_seminarists", ...]
  }
}
\`\`\`

### POST /auth/refresh
Renouvellement du token
\`\`\`json
Request:
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}

Response:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
\`\`\`

### POST /auth/logout
Déconnexion
\`\`\`json
Request:
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}

Response:
{
  "message": "Déconnexion réussie"
}
\`\`\`

### POST /auth/forgot-password
Mot de passe oublié
\`\`\`json
Request:
{
  "email": "admin@annour.com"
}

Response:
{
  "message": "Email de réinitialisation envoyé"
}
\`\`\`

---

## 2. DASHBOARD & STATISTIQUES

### GET /dashboard/stats
Statistiques générales du dashboard
\`\`\`json
Response:
{
  "total_seminarists": 245,
  "male_seminarists": 128,
  "female_seminarists": 117,
  "pepiniere_seminarists": 45,
  "total_consultations": 89,
  "today_consultations": 12,
  "male_consultations": 34,
  "female_consultations": 55,
  "pepiniere_consultations": 15
}
\`\`\`

### GET /dashboard/demographics
Démographie par niveau
\`\`\`json
Response:
{
  "levels": [
    {
      "level": "Niveau 1",
      "boys": 25,
      "girls": 30
    },
    {
      "level": "Niveau 2", 
      "boys": 28,
      "girls": 22
    }
  ]
}
\`\`\`

### GET /dashboard/recent-registrations
Enregistrements récents
\`\`\`json
Response:
{
  "registrations": [
    {
      "matricule": "AN06-2024-001",
      "full_name": "KOUAME Jean Baptiste",
      "gender": "M",
      "dormitory": "Dortoir 1",
      "residence": "Abidjan",
      "registration_date": "2024-12-20T17:50:00Z"
    }
  ]
}
\`\`\`

### GET /dashboard/recent-consultations
Consultations récentes
\`\`\`json
Response:
{
  "consultations": [
    {
      "matricule": "AN06-2024-001",
      "full_name": "KOUAME Jean Baptiste",
      "gender": "M",
      "dormitory": "Dortoir 1",
      "reason": "Consultation générale",
      "consultation_date": "2024-12-20T17:50:00Z"
    }
  ]
}
\`\`\`

---

## 3. GESTION DES SÉMINARISTES

### GET /seminarists/
Liste des séminaristes avec pagination et filtres
\`\`\`json
Query Parameters:
- page: int (défaut: 1)
- page_size: int (défaut: 10)
- search: string
- gender: string (M/F)
- dormitory: string
- level: string
- category: string (FORMATION/PEPINIERE)

Response:
{
  "count": 245,
  "next": "http://localhost:8000/api/v1/seminarists/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "matricule": "AN06-2024-001",
      "first_name": "Jean",
      "last_name": "KOUAME",
      "full_name": "KOUAME Jean Baptiste",
      "gender": "M",
      "birth_date": "2000-05-15",
      "phone": "+225 01 02 03 04 05",
      "email": "jean.kouame@email.com",
      "parent_phone": "+225 06 07 08 09 10",
      "status": "Élève",
      "education_level": "Terminale",
      "dormitory": "Dortoir 1",
      "commune": "Bingerville",
      "category": "FORMATION",
      "medical_history": "Aucun antécédent particulier",
      "allergies": "Aucune allergie connue",
      "photo": "http://localhost:8000/media/photos/seminarist_1.jpg",
      "created_at": "2024-12-20T10:30:00Z",
      "updated_at": "2024-12-20T10:30:00Z"
    }
  ]
}
\`\`\`

### POST /seminarists/
Création d'un nouveau séminariste
\`\`\`json
Request:
{
  "first_name": "Jean",
  "last_name": "KOUAME",
  "gender": "M",
  "birth_date": "2000-05-15",
  "phone": "+225 01 02 03 04 05",
  "email": "jean.kouame@email.com",
  "parent_phone": "+225 06 07 08 09 10",
  "status": "Élève",
  "education_level": "Terminale",
  "dormitory": "Dortoir 1",
  "commune": "Bingerville",
  "category": "FORMATION",
  "medical_history": "Aucun antécédent particulier",
  "allergies": "Aucune allergie connue",
  "photo": "base64_encoded_image_or_file_upload"
}

Response:
{
  "id": 1,
  "matricule": "AN06-2024-001", // Auto-généré
  "message": "Séminariste créé avec succès"
}
\`\`\`

### GET /seminarists/{id}/
Détails d'un séminariste
\`\`\`json
Response:
{
  "id": 1,
  "matricule": "AN06-2024-001",
  "first_name": "Jean",
  "last_name": "KOUAME",
  // ... tous les champs
}
\`\`\`

### PUT /seminarists/{id}/
Modification d'un séminariste
\`\`\`json
Request: // Mêmes champs que POST
Response:
{
  "message": "Séminariste modifié avec succès"
}
\`\`\`

### DELETE /seminarists/{id}/
Suppression d'un séminariste
\`\`\`json
Response:
{
  "message": "Séminariste supprimé avec succès"
}
\`\`\`

### POST /seminarists/import-csv/
Import CSV de séminaristes
\`\`\`json
Request: FormData with CSV file

Response:
{
  "imported": 25,
  "errors": [
    {
      "row": 3,
      "error": "Email déjà existant"
    }
  ]
}
\`\`\`

### GET /seminarists/export/
Export des séminaristes
\`\`\`json
Query Parameters:
- format: string (csv/pdf/excel)
- filters: same as list filters

Response: File download
\`\`\`

---

## 4. MODULE SCIENTIFIQUE

### GET /scientific/stats
Statistiques du module scientifique
\`\`\`json
Response:
{
  "total_students": 245,
  "graded_students": 180,
  "average_grade": 14.5,
  "levels_distribution": {
    "Niveau 1": 45,
    "Niveau 2": 50,
    "Niveau 3": 48,
    "Niveau 4": 52,
    "Niveau 5": 50
  }
}
\`\`\`

### GET /scientific/grades/
Liste des notes avec filtres
\`\`\`json
Query Parameters:
- page, page_size, search, gender, level

Response:
{
  "count": 180,
  "results": [
    {
      "seminarist": {
        "id": 1,
        "matricule": "AN06-2024-001",
        "full_name": "KOUAME Jean Baptiste",
        "gender": "M",
        "level": "Niveau 1"
      },
      "grades": [
        {
          "id": 1,
          "subject": "Note 1",
          "grade": 15.5,
          "coefficient": 1
        },
        {
          "id": 2,
          "subject": "Note 2", 
          "grade": 14.0,
          "coefficient": 1
        },
        {
          "id": 3,
          "subject": "Note 3",
          "grade": 16.0,
          "coefficient": 1
        }
      ],
      "average": 15.17,
      "conduct_grade": 18.0,
      "appreciation": "Très bien"
    }
  ]
}
\`\`\`

### POST /scientific/grades/bulk-add/
Ajout de notes par niveau
\`\`\`json
Request:
{
  "level": "Niveau 1",
  "subject": "Note 1",
  "grades": [
    {
      "seminarist_id": 1,
      "grade": 15.5
    },
    {
      "seminarist_id": 2,
      "grade": 14.0
    }
  ]
}

Response:
{
  "added": 25,
  "message": "Notes ajoutées avec succès"
}
\`\`\`

### PUT /scientific/grades/{grade_id}/
Modification d'une note individuelle
\`\`\`json
Request:
{
  "grade": 16.5,
  "appreciation": "Excellent travail"
}

Response:
{
  "message": "Note modifiée avec succès"
}
\`\`\`

### GET /scientific/bulletin/{seminarist_id}/
Bulletin d'un séminariste
\`\`\`json
Response:
{
  "seminarist": {
    "matricule": "AN06-2024-001",
    "full_name": "KOUAME Jean Baptiste",
    "gender": "M",
    "birth_date": "2000-05-15",
    "level": "Niveau 1",
    "dormitory": "Dortoir 1"
  },
  "grades": [
    {
      "subject": "Note 1",
      "grade": 15.5,
      "appreciation": "Bien"
    }
  ],
  "average": 15.17,
  "conduct_grade": 18.0,
  "general_appreciation": "Très bon élément"
}
\`\`\`

### GET /scientific/bulletin/{seminarist_id}/pdf/
Génération PDF du bulletin
\`\`\`json
Response: PDF file download
\`\`\`

### GET /scientific/levels/
Liste des niveaux disponibles
\`\`\`json
Response:
{
  "levels": [
    {
      "id": 1,
      "name": "Niveau 1",
      "students_count": 45
    },
    {
      "id": 2,
      "name": "Niveau 2",
      "students_count": 50
    }
  ]
}
\`\`\`

---

## 5. MODULE SANTÉ

### GET /health/stats
Statistiques santé
\`\`\`json
Response:
{
  "total_consultations": 89,
  "today_consultations": 12,
  "male_consultations": 34,
  "female_consultations": 55,
  "pepiniere_consultations": 15,
  "common_reasons": [
    {
      "reason": "Consultation générale",
      "count": 25
    },
    {
      "reason": "Maux de tête",
      "count": 18
    }
  ]
}
\`\`\`

### GET /health/seminarists/
Séminaristes avec infos médicales
\`\`\`json
Response: // Même structure que /seminarists/ mais avec focus médical
\`\`\`

### GET /health/consultations/
Liste des consultations
\`\`\`json
Query Parameters:
- page, page_size, search, gender, level, date_from, date_to

Response:
{
  "count": 89,
  "results": [
    {
      "id": 1,
      "seminarist": {
        "matricule": "AN06-2024-001",
        "full_name": "KOUAME Jean Baptiste",
        "gender": "M",
        "level": "Niveau 1"
      },
      "consultation_date": "2024-12-20T14:30:00Z",
      "doctor": "Dr. TRAORE Marie",
      "reason": "Consultation générale",
      "diagnosis": "État général satisfaisant",
      "treatment": "Repos et hydratation",
      "additional_notes": "Contrôle dans une semaine",
      "created_at": "2024-12-20T14:30:00Z"
    }
  ]
}
\`\`\`

### POST /health/consultations/
Nouvelle consultation
\`\`\`json
Request:
{
  "seminarist_id": 1,
  "consultation_date": "2024-12-20T14:30:00Z",
  "doctor": "Dr. TRAORE Marie",
  "reason": "Consultation générale",
  "diagnosis": "État général satisfaisant",
  "treatment": "Repos et hydratation",
  "additional_notes": "Contrôle dans une semaine"
}

Response:
{
  "id": 1,
  "message": "Consultation enregistrée avec succès"
}
\`\`\`

### GET /health/consultations/{id}/
Détails d'une consultation
\`\`\`json
Response:
{
  "id": 1,
  "seminarist": {
    "matricule": "AN06-2024-001",
    "full_name": "KOUAME Jean Baptiste",
    "gender": "M",
    "birth_date": "2000-05-15",
    "level": "Niveau 1",
    "dormitory": "Dortoir 1",
    "parent_phone": "+225 06 07 08 09 10",
    "medical_history": "Aucun antécédent particulier",
    "allergies": "Aucune allergie connue"
  },
  "consultation_date": "2024-12-20T14:30:00Z",
  "doctor": "Dr. TRAORE Marie",
  "reason": "Consultation générale",
  "diagnosis": "État général satisfaisant",
  "treatment": "Repos et hydratation",
  "additional_notes": "Contrôle dans une semaine"
}
\`\`\`

### PUT /health/consultations/{id}/
Modification d'une consultation
\`\`\`json
Request: // Mêmes champs que POST
Response:
{
  "message": "Consultation modifiée avec succès"
}
\`\`\`

### GET /health/consultations/{id}/pdf/
Fiche de consultation PDF
\`\`\`json
Response: PDF file download
\`\`\`

### POST /health/health-tickets/
Génération de billets de santé
\`\`\`json
Request:
{
  "seminarist_id": 1
}

Response: PDF file download
\`\`\`

---

## 6. GESTION DES ACCÈS

### GET /access/users/
Liste des utilisateurs
\`\`\`json
Response:
{
  "count": 15,
  "results": [
    {
      "id": 1,
      "username": "admin_user",
      "email": "admin@annour.com",
      "role": "ADMINISTRATION",
      "is_active": true,
      "created_at": "2024-12-01T10:00:00Z",
      "last_login": "2024-12-20T08:30:00Z"
    }
  ]
}
\`\`\`

### POST /access/users/
Création d'un utilisateur
\`\`\`json
Request:
{
  "username": "nouveau_user",
  "email": "user@annour.com",
  "password": "motdepasse123",
  "role": "SCIENTIFIQUE"
}

Response:
{
  "id": 2,
  "username": "nouveau_user",
  "generated_credentials": {
    "username": "nouveau_user",
    "password": "motdepasse123"
  },
  "message": "Utilisateur créé avec succès"
}
\`\`\`

### PUT /access/users/{id}/
Modification d'un utilisateur
\`\`\`json
Request:
{
  "username": "user_modifie",
  "role": "SANTE",
  "old_password": "ancien_mot_de_passe",
  "new_password": "nouveau_mot_de_passe"
}

Response:
{
  "message": "Utilisateur modifié avec succès"
}
\`\`\`

### DELETE /access/users/{id}/
Suppression d'un utilisateur
\`\`\`json
Response:
{
  "message": "Utilisateur supprimé avec succès"
}
\`\`\`

### GET /access/roles/
Liste des rôles disponibles
\`\`\`json
Response:
{
  "roles": [
    {
      "code": "SUPER_ADMIN",
      "name": "Super Administrateur",
      "permissions": ["all"]
    },
    {
      "code": "ADMINISTRATION", 
      "name": "Comité Administration",
      "permissions": ["manage_seminarists", "generate_documents", ...]
    },
    {
      "code": "SCIENTIFIQUE",
      "name": "Comité Scientifique", 
      "permissions": ["manage_grades", "view_seminarists", ...]
    },
    {
      "code": "SANTE",
      "name": "Comité Santé",
      "permissions": ["manage_consultations", "view_seminarists", ...]
    },
    {
      "code": "FINANCE",
      "name": "Comité Finance",
      "permissions": ["manage_payments", "generate_tickets", ...]
    }
  ]
}
\`\`\`

---

## 7. GÉNÉRATION DE DOCUMENTS

### POST /documents/badges/
Génération de badges
\`\`\`json
Request:
{
  "type": "SEMINARIST", // SEMINARIST, TRAINER, VISITOR, COMMITTEE
  "seminarist_ids": [1, 2, 3] // ou user_ids pour autres types
}

Response: PDF file download
\`\`\`

### POST /documents/diplomas/
Génération de diplômes
\`\`\`json
Request:
{
  "type": "SEMINARIST", // SEMINARIST, TRAINER, COMMITTEE, THANKS
  "seminarist_ids": [1, 2, 3],
  "template": "standard" // ou "special"
}

Response: PDF file download
\`\`\`

### POST /documents/seminarist-list/
Liste PDF des séminaristes
\`\`\`json
Request:
{
  "filters": {
    "level": "Niveau 1",
    "gender": "M",
    "dormitory": "Dortoir 1"
  },
  "format": "detailed" // ou "summary"
}

Response: PDF file download
\`\`\`

---

## 8. FINANCE (Module à développer)

### GET /finance/tickets/
Liste des tickets vendus
\`\`\`json
Response:
{
  "count": 150,
  "results": [
    {
      "id": 1,
      "ticket_number": "TK-2024-001",
      "seminarist": {
        "matricule": "AN06-2024-001",
        "full_name": "KOUAME Jean Baptiste"
      },
      "amount": 25000,
      "payment_status": "PAID",
      "payment_date": "2024-12-15T10:00:00Z",
      "payment_method": "CASH"
    }
  ]
}
\`\`\`

### POST /finance/tickets/
Vente de ticket
\`\`\`json
Request:
{
  "seminarist_id": 1,
  "amount": 25000,
  "payment_method": "CASH"
}

Response:
{
  "ticket_number": "TK-2024-001",
  "message": "Ticket généré avec succès"
}
\`\`\`

### GET /finance/payments/
Suivi des paiements
\`\`\`json
Response:
{
  "total_revenue": 3750000,
  "paid_tickets": 150,
  "pending_payments": 25,
  "payment_methods": {
    "CASH": 100,
    "MOBILE_MONEY": 45,
    "BANK_TRANSFER": 5
  }
}
\`\`\`

---

## 9. MODÈLES DE DONNÉES

### User
\`\`\`python
class User(AbstractUser):
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
\`\`\`

### Seminarist
\`\`\`python
class Seminarist(models.Model):
    matricule = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    gender = models.CharField(max_length=1, choices=[('M', 'Masculin'), ('F', 'Féminin')])
    birth_date = models.DateField()
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    parent_phone = models.CharField(max_length=20)
    status = models.CharField(max_length=50)
    education_level = models.CharField(max_length=50)
    dormitory = models.CharField(max_length=50)
    commune = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=[('FORMATION', 'Formation'), ('PEPINIERE', 'Pépinière')])
    medical_history = models.TextField(blank=True)
    allergies = models.TextField(blank=True)
    photo = models.ImageField(upload_to='photos/', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
\`\`\`

### Grade
\`\`\`python
class Grade(models.Model):
    seminarist = models.ForeignKey(Seminarist, on_delete=models.CASCADE)
    subject = models.CharField(max_length=100)
    grade = models.DecimalField(max_digits=4, decimal_places=2)
    coefficient = models.IntegerField(default=1)
    appreciation = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
\`\`\`

### Consultation
\`\`\`python
class Consultation(models.Model):
    seminarist = models.ForeignKey(Seminarist, on_delete=models.CASCADE)
    consultation_date = models.DateTimeField()
    doctor = models.CharField(max_length=100)
    reason = models.CharField(max_length=200)
    diagnosis = models.TextField()
    treatment = models.TextField()
    additional_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
\`\`\`

---

## 10. CODES D'ERREUR

\`\`\`json
{
  "400": "Données invalides",
  "401": "Non authentifié", 
  "403": "Accès refusé",
  "404": "Ressource non trouvée",
  "409": "Conflit (ex: email déjà existant)",
  "422": "Erreur de validation",
  "500": "Erreur serveur interne"
}
\`\`\`

---

## 11. PERMISSIONS PAR RÔLE

### SUPER_ADMIN
- Toutes les permissions
- Création/suppression comptes administrateurs
- Accès à tous les modules

### ADMINISTRATION  
- Gestion complète des séminaristes
- Génération de documents
- Communication avec tous les comités
- Création de comptes mini-administrateurs

### SCIENTIFIQUE
- Gestion des notes et bulletins
- Établissement des programmes
- Planification des emplois du temps
- Ajout de séminaristes dans les classes

### SANTE
- Gestion des consultations
- Accès aux informations médicales
- Génération de billets de santé

### FINANCE
- Vente de tickets
- Suivi des paiements
- Génération de rapports financiers

Cette documentation couvre tous les endpoints nécessaires pour implémenter le backend Django du système An-Nour selon le cahier des charges fourni.
