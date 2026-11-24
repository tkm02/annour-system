"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { authApi, type User } from "@/lib/api"
import type { LoginResponse } from "@/lib/api"
import { normalizeRole } from "@/lib/roles"

export type { UserRole } from "@/lib/roles"

// Le rôle est toujours manipulé sous sa forme canonique (admin, scientifique, finances, sante)
const withCanonicalRole = (user: User): User => ({ ...user, role: normalizeRole(user.role) })

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Charger l'utilisateur depuis le localStorage au montage
    const loadUser = () => {
      try {
        const storedUser = authApi.getCurrentUser()
        const token = authApi.getToken()
        
        if (storedUser && token) {
          setUser(withCanonicalRole(storedUser))
        }
      } catch {
        // Session locale illisible : l'utilisateur devra se reconnecter
        authApi.logout()
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  /**
   * Fonction de connexion utilisant l'API réelle
   */
  const login = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    try {
      
      // Appel de l'API de connexion
      const response: LoginResponse = await authApi.login({ identifier: usernameOrEmail, password })

      // Vérifier que l'utilisateur est actif
      if (!response.user.is_active) {
        throw new Error("Votre compte a été désactivé. Contactez l'administrateur.")
      }
      
      // Mettre à jour l'état local
      setUser(withCanonicalRole(response.user))
      
      
      return true
    } catch (error: any) {
      
      // Nettoyer en cas d'erreur
      setUser(null)
      authApi.logout()
      
      // Propager l'erreur pour affichage
      throw error
    }
  }

  /**
   * Fonction de déconnexion
   */
  const logout = () => {
    
    authApi.logout()
    setUser(null)
    
    // Rediriger vers la page de connexion
    if (typeof window !== 'undefined') {
      window.location.href = "/"
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Export du type User pour utilisation dans d'autres composants
export type { User }
