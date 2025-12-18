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
export interface UpdateNote {
  note: number;
  observation: string;
}

export interface CreateNote {
  matricule: string;
  matiere_code: string;
  note: number;
  type_evaluation: string;
  observation: string;
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
  console.log(`🌐 API ${endpoint}: ${response.status}`);
  
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
        console.log('✅ Cache seminaristes utilisé (FULL)');
        return cachedSeminaristes;
      }

      console.log('🔄 Chargement complet des séminaristes (Batching)...');
      
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
    console.log('➕ [CREATE] Séminariste:', data);
    return apiRequest<Seminariste>('/admin/seminaristes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateSeminariste: async (matricule: string, data: Partial<UpdateSeminariste>) => {
    console.log('✏️ [UPDATE] Séminariste:', matricule, data);
    return apiRequest<Seminariste>(`/admin/seminaristes/${matricule}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  deleteSeminariste: async (matricule: string) => {
    console.log('🗑️ [DELETE] Séminariste:', matricule);
    return apiRequest(`/admin/seminaristes/${matricule}`, {
      method: 'DELETE',
    });
  },
  // ✅ TEST D'ENTRÉE
   saveTestEntree: async (data: TestScore) => {
    console.log('💾 [TEST] Sauvegarde:', data);
    
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
    console.log('🎓 [NIVEAU] Update:', matricule, '→', niveau);
    return apiRequest(`/seminaristes/${matricule}/niveau`, {
      method: 'PATCH',
      body: JSON.stringify({ niveau }),
    });
  },

  // 📝 NOTES
  getNotes: async () => apiRequest('/scientific/notes'),
  createNote: async (data: CreateNote) => {
    return apiRequest('/scientific/notes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateNote: async (id: string, data: UpdateNote) => {
    return apiRequest(`/scientific/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 📈 STATS
  getStats: () => apiRequest<any>("/scientific/stats"),
  getScientificStats: () => apiRequest('/scientific/stats/scientifiques'),

  // 📋 MÉTADONNÉES
  getStaticMetadata: async () => {
    return apiRequest<StaticMetadata>('/admin/static-metadata');
  },

  // 🔄 CACHE
  invalidateCache: () => {
    console.log('🗑️ Cache seminaristes invalidé');
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
    console.log("🔐 [AUTH] Login:", credentials.identifier);
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
    console.log("✅ Déconnexion");
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
    console.log("🔄 [TOGGLE] User:", id, "→", isActive);
    return apiRequest<User>(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: isActive }),
    });
  },
};

// ✅ EXPORTS


export default {
  scientificApi,
  dashboardApi,
  authApi,
  usersApi,
};
