// lib/api.ts
const API_BASE_URL = "http://192.168.1.16:8000/api/v1"

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

// Ajoutez à votre lib/api.ts existant
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

