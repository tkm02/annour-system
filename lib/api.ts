// lib/api.ts - VERSION UNIFIÉE MAMADOU 2025

const API_BASE_URL = "https://an-nour-backend-5mf0.onrender.com/api/v1";

let cachedSeminaristes: any = null;

// ✅ INTERFACES PRINCIPALES
interface ApiResponse<T> {
  total: number;
  page: number;
  limit: number;
  data: T[];
}

export interface StaticMetadata {
  niveaux_academiques: Record<string, string[]>;
  communes: string[];
  dortoirs: Record<string, Array<{ code: string; name: string }>>;
}

// ✅ SEMINARISTE COMPLET
export interface Seminariste {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  sexe: string;
  age: number;
  niveau_academique: string;
  niveau: string | null;              // ✅ NIVEAU TEST
  dortoir: string;
  photo_url: string | null;
  commune_habitation?: string;
  contact_parent?: string;
  contact_seminariste?: string;
  allergie?: string;
  antecedent_medical?: string;
  dortoir_code?: string;
  note_entree?: number | null;        // ✅ NOTE DU TEST D'ENTRÉE
}

// ✅ CREATE SEMINARISTE
export interface CreateSeminariste {
  nom: string;
  prenom: string;
  sexe: string;
  age: number;
  commune_habitation: string;
  niveau_academique: string;
  dortoir_code: string;
  contact_parent: string;
  contact_seminariste: string;
  allergie: string;
  antecedent_medical: string;
}

// ✅ UPDATE SEMINARISTE
export interface UpdateSeminariste {
  nom?: string;
  prenom?: string;
  sexe?: string;
  age?: number;
  commune_habitation?: string;
  niveau_academique?: string;
  niveau?: string;
  dortoir_code?: string;
  contact_parent?: string;
  contact_seminariste?: string;
  allergie?: string;
  antecedent_medical?: string;
}

// ✅ TEST ENTRÉE
export interface TestScore {
  matricule: string;
  note: number;              // ✅ Changé de note_test → note
  niveau: string;            // ✅ Ajouté
  created_by?: string;       // ✅ Ajouté optionnel
}

// ✅ NOTES
export interface Note {
  id: string;
  matricule: string;
  seminariste: string | null;
  note: number;
  observation: string | null;
  type: string;
  libelle: string; // "note1", "note2", "note3", "note4"
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface UpdateNote {
  note: number;
  observation: string;
}

export interface CreateNote {
  matricule: string;
  note: number;
  type_evaluation: string;
  libelle: string;
  observation?: string;
}

// ✅ BULLETINS
export interface Bulletin {
  id: string;
  numero: string;
  matricule: string;
  nom_seminariste: string | null;
  prenom_seminariste: string | null;
  niveau: string | null;
  niveau_academique: string | null;
  annee_scolaire: string;
  moyenne_generale: number;
  total_coefficient: number;
  rang: number | null;
  effectif_classe: number | null;
  mention: string | null;
  observations: string | null;
  generated_at: string;
  generated_by: string;
}

export interface BulletinGenerate {
  matricule: string;
  annee_scolaire?: string;
  observations?: string;
}

export interface BulletinDetail {
  bulletin: Bulletin;
  notes: Note[];
  seminariste: Seminariste;
}

// ✅ USERS & AUTH
export interface User {
  id: string;
  username: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserPayload {
  email: string;
  username: string;
  password: string;
  nom: string;
  prenom: string;
  role: string;
}

// ✅ MEMBRE CO (Comité d'Organisation)
export interface MembreCO {
  id: string;
  nom: string;
  prenoms: string;
  contact: string;
  commission: string;
  statut: string;
  photo_url: string;
  allergies: string;
  antecedent_medical: string;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginCredentials {
  identifier: string;
  password: string;
}

// ✅ API REQUEST GÉNÉRIQUE
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config: RequestInit = {
    headers: { "Content-Type": "application/json" },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`❌ API ${response.status}: ${errorText}`);
  }
  
  return response.json();
}

// ✅ SCIENTIFIC API - UNIFIÉ
export const scientificApi = {
  // 📊 SÉMINARISTES (CACHE 5min)
  // 📊 SÉMINARISTES (CACHE 5min)
  getSeminaristes: async (page = 1, limit = 100, filters?: any) => {
    // ✅ MODE "FETCH ALL" (Si limit > 100, on charge tout)
    if (limit > 100) {
      if (cachedSeminaristes && cachedSeminaristes.limit >= 10000) {
        return cachedSeminaristes;
      }
      
      // 1. Première page pour avoir le total
      const firstBatch = await apiRequest<ApiResponse<Seminariste>>(
        `/scientific/seminaristes?page=1&limit=100${filters ? '&' + new URLSearchParams(filters) : ''}`
      );
      
      let allData = [...firstBatch.data];
      const total = firstBatch.total;
      const totalPages = Math.ceil(total / 100);

      // 2. Charger le reste en parallèle
      if (totalPages > 1) {
        const promises = [];
        for (let p = 2; p <= totalPages; p++) {
          promises.push(
            apiRequest<ApiResponse<Seminariste>>(
              `/scientific/seminaristes?page=${p}&limit=100${filters ? '&' + new URLSearchParams(filters) : ''}`
            )
          );
        }
        
        const results = await Promise.all(promises);
        results.forEach(res => {
          allData = [...allData, ...res.data];
        });
      }

      const result = {
        total: total,
        page: 1,
        limit: total, // On indique que la limite est le total
        data: allData,
      };

      cachedSeminaristes = result;
      setTimeout(() => { cachedSeminaristes = null; }, 5 * 60 * 1000);
      return result;
    }

    // ✅ MODE PAGINATION SHANDARD (Max 100 par le backend)
    // Attention: Le backend rejette > 100, donc on s'assure de ne pas dépasser
    const safeLimit = Math.min(limit, 100);
    
    // Note: On ne cache PAS les pages individuelles pour éviter les bugs de pagination
    // sauf si on implémente un cache par clé (page+limit). 
    // Pour l'instant, on désactive le cache partiel pour la sécurité.
    
    const data = await apiRequest<ApiResponse<Seminariste>>(
      `/scientific/seminaristes?page=${page}&limit=${safeLimit}${filters ? '&' + new URLSearchParams(filters) : ''}`
    );
    return data;
  },
  // ✅ CRUD SÉMINARISTES
  createSeminariste: async (data: CreateSeminariste) => {
    return apiRequest<Seminariste>('/admin/seminaristes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateSeminariste: async (matricule: string, data: Partial<UpdateSeminariste>) => {
    return apiRequest<Seminariste>(`/admin/seminaristes/${matricule}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  deleteSeminariste: async (matricule: string) => {
    return apiRequest(`/admin/seminaristes/${matricule}`, {
      method: 'DELETE',
    });
  },
  // ✅ TEST D'ENTRÉE
   saveTestEntree: async (data: TestScore) => {
    
    // ✅ CONSTRUIRE URL AVEC QUERY PARAMS
    const params = new URLSearchParams({
      matricule: data.matricule,
      note: data.note.toString(),
      niveau: data.niveau,
      created_by: data.created_by || 'admin'
    });
    
    return apiRequest(`/scientific/test-entree?${params.toString()}`, {
      method: 'POST',
      // ✅ PAS DE BODY (ou body vide)
    });
  },

  updateSeminaristeNiveau: async (matricule: string, niveau: string) => {
    return apiRequest(`/seminaristes/${matricule}/niveau`, {
      method: 'PATCH',
      body: JSON.stringify({ niveau }),
    });
  },

  // 📝 NOTES
  getNotes: async () => apiRequest<Note[]>('/scientific/notes'),
  
  getNotesByLibelle: async (libelle: string) => {
    const allNotes = await apiRequest<Note[]>('/scientific/notes');
    return allNotes.filter(n => n.libelle === libelle);
  },
  
  createNote: async (data: CreateNote) => {
    // ✅ FastAPI expects query params, not JSON body
    const params = new URLSearchParams({
      matricule: data.matricule,
      note: data.note.toString(),
      libelle: data.libelle || 'note1',
      created_by: 'admin'
    });
    
    return apiRequest<Note>(`/scientific/notes?${params.toString()}`, {
      method: 'POST',
    });
  },
  
  updateNote: async (id: string, data: UpdateNote) => {
    return apiRequest<Note>(`/scientific/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  deleteNote: async (id: string) => {
    return apiRequest(`/scientific/notes/${id}`, {
      method: 'DELETE',
    });
  },
  
  deleteNotesByLibelle: async (libelle: string) => {
    const notesToDelete = await scientificApi.getNotesByLibelle(libelle);
    const deletePromises = notesToDelete.map(note => scientificApi.deleteNote(note.id));
    await Promise.all(deletePromises);
    return notesToDelete.length;
  },

  // 📈 STATS
  getStats: () => apiRequest<any>("/scientific/stats"),
  getScientificStats: () => apiRequest('/scientific/stats/scientifiques'),

  // 📜 BULLETINS
  generateBulletin: async (data: BulletinGenerate) => {
    return apiRequest<Bulletin>('/scientific/bulletins/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  getBulletins: async (matricule?: string) => {
    const params = matricule ? `?matricule=${matricule}` : '';
    return apiRequest<Bulletin[]>(`/scientific/bulletins${params}`);
  },
  
  getBulletinByNumero: async (numero: string) => {
    return apiRequest<BulletinDetail>(`/scientific/bulletins/${numero}`);
  },

  // 📋 MÉTADONNÉES
  getStaticMetadata: async () => {
    return apiRequest<StaticMetadata>('/admin/static-metadata');
  },

  // 🔄 CACHE
  invalidateCache: () => {
    cachedSeminaristes = null;
  },
};

// ✅ DASHBOARD API
export const dashboardApi = {
  getDashboardData: async () => {
    const seminaristesResponse = await scientificApi.getSeminaristes(1, 10000);
    return {
      seminaristes: seminaristesResponse.data,
      total: seminaristesResponse.total,
    };
  },
};

// ✅ AUTH API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiRequest<LoginResponse>("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({
        identifier: credentials.identifier,
        password: credentials.password,
      }),
    });
    
    if (typeof window !== 'undefined') {
      localStorage.setItem("authToken", response.access_token);
      localStorage.setItem("tokenType", response.token_type);
      localStorage.setItem("user", JSON.stringify(response.user));
    }
    return response;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("authToken");
      localStorage.removeItem("tokenType");
      localStorage.removeItem("user");
    }
  },

  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: (): string | null => {
    return typeof window !== 'undefined' ? localStorage.getItem("authToken") : null;
  },

  isAuthenticated: (): boolean => !!authApi.getToken(),
};

// ✅ USERS API
export const usersApi = {
  getUsers: async (page = 1, limit = 100) => {
    return apiRequest<ApiResponse<User>>(`/admin/users?page=${page}&limit=${limit}`);
  },
  
  createUser: async (userData: CreateUserPayload) => {
    return apiRequest<User>("/admin/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },
  
  updateUser: async (id: string, userData: Partial<CreateUserPayload>) => {
    return apiRequest<User>(`/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  },
  
  toggleUserStatus: async (id: string, isActive: boolean) => {
    return apiRequest<User>(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: isActive }),
    });
  },
};

// ✅ CO API (Comité d'Organisation)
export const coApi = {
  getMembresCO: async () => {
    return apiRequest<{ total: number; data: MembreCO[] }>('/admin/membres-co');
  },
};

// ✅ EXPORTS


export default {
  scientificApi,
  dashboardApi,
  authApi,
  usersApi,
  coApi,
};
