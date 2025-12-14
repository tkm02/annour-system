const API_BASE_URL = "http://192.168.1.27:8000/api/v1"

let cachedSeminaristes: any = null

interface ApiResponse<T> {
  total: number
  page: number
  limit: number
  data: T[]
}

interface Seminariste {
  id: string
  matricule: string
  nom: string
  prenom: string
  sexe: string
  age: number
  niveau_academique: string
  dortoir: string
  photo_url: string | null
}

interface User {
  id: string
  username: string
  email: string
  nom: string
  prenom: string
  role: string
  is_active: boolean
  last_login?: string
  created_at?: string
  updated_at?: string
}

interface CreateUserPayload {
  email: string
  username: string
  password: string
  nom: string
  prenom: string
  role: string
}

// ✅ Interface pour la réponse de login
interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

// ✅ Interface pour les credentials de login
interface LoginCredentials {
  identifier: string
  password: string
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config: RequestInit = {
    headers: { "Content-Type": "application/json" },
    ...options,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
  console.log(`API ${endpoint}:`, response.status)
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API Error: ${response.status} - ${errorText}`)
  }
  
  return response.json()
}

export const scientificApi = {
  getSeminaristes: async (page = 1, limit = 500, filters?: any) => {
    if (cachedSeminaristes) {
      console.log('Cache utilisé')
      return cachedSeminaristes
    }
    
    const data = await apiRequest<ApiResponse<Seminariste>>(
      `/scientific/seminaristes?page=${page}&limit=${limit}`
    )
    cachedSeminaristes = data
    return data
  },
  
  invalidateCache: () => {
    cachedSeminaristes = null
  },
  
  getStats: () => apiRequest<any>("/scientific/stats"),
}

export const dashboardApi = {
  getDashboardData: async () => {
    const [seminaristesResponse] = await Promise.all([
      scientificApi.getSeminaristes(1, 100)
    ])
    
    return {
      seminaristes: seminaristesResponse.data,
      total: seminaristesResponse.total,
    }
  },
}

// ✅ API d'authentification
export const authApi = {
  /**
   * Connexion d'un utilisateur
   * @param credentials - identifier (email ou username) et password
   * @returns LoginResponse avec access_token, token_type et user
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    console.log("🔐 Envoi requête login avec identifier:", credentials.identifier)
    console.log("📤 Payload:", JSON.stringify({ identifier: credentials.identifier, password: "***" }))
    
    // ✅ IMPORTANT : Envoyer exactement "identifier" et "password"
    const response = await apiRequest<LoginResponse>("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({
        identifier: credentials.identifier,  // ✅ PAS "email" !
        password: credentials.password
      }),
    })
    
    console.log("✅ Connexion réussie:", response.user.username)
    
    // Stocker le token et les infos utilisateur
    if (typeof window !== 'undefined') {
      localStorage.setItem("authToken", response.access_token)
      localStorage.setItem("tokenType", response.token_type)
      localStorage.setItem("user", JSON.stringify(response.user))
    }
    
    return response
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("authToken")
      localStorage.removeItem("tokenType")
      localStorage.removeItem("user")
    }
    console.log("✅ Déconnexion réussie")
  },

  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null
    
    const userStr = localStorage.getItem("user")
    if (!userStr) return null
    
    try {
      return JSON.parse(userStr)
    } catch (error) {
      console.error("Erreur parsing user:", error)
      return null
    }
  },

  getToken: (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem("authToken")
  },

  isAuthenticated: (): boolean => {
    return !!authApi.getToken()
  },
}

// API de gestion des utilisateurs
export const usersApi = {
  // Liste des utilisateurs avec pagination
  getUsers: async (page = 1, limit = 100) => {
    return apiRequest<ApiResponse<User>>(
      `/admin/users?page=${page}&limit=${limit}`
    )
  },

  // Créer un utilisateur
  createUser: async (userData: CreateUserPayload) => {
    return apiRequest<User>("/admin/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  },

  // Modifier un utilisateur
  updateUser: async (id: string, userData: Partial<CreateUserPayload>) => {
    return apiRequest<User>(`/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    })
  },

    /**
   * Active ou désactive un utilisateur (toggle status)
   */
toggleUserStatus: async (id: string, isActive: boolean) => {
  console.log("=== DÉBUT TOGGLE STATUS ===")
  console.log("User ID:", id)
  console.log("Nouveau statut demandé:", isActive)
  console.log("Payload envoyé:", JSON.stringify({ is_active: isActive }))
  
  try {
    const response = await apiRequest<User>(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: isActive }),
    })
    
    console.log("✅ Réponse API reçue:", response)
    console.log("✅ is_active dans la réponse:", response.is_active)
    console.log(`✅ Utilisateur ${isActive ? 'activé' : 'désactivé'}`)
    console.log("=== FIN TOGGLE STATUS ===")
    
    return response
  } catch (error) {
    console.error("❌ Erreur dans toggleUserStatus:", error)
    throw error
  }
},


 }

// Export des types
export type { User, CreateUserPayload, Seminariste, ApiResponse, LoginResponse, LoginCredentials }