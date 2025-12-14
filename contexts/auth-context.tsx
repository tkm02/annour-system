"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { authApi, type User } from "@/lib/api"
import type { LoginResponse } from "@/lib/api"

export type UserRole =  "ADMINISTRATION" | "SCIENTIFIQUE" | "FINANCE"

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
          console.log("👤 Utilisateur chargé depuis le localStorage:", storedUser.username)
          setUser(storedUser)
        } else {
          console.log("ℹ️ Aucun utilisateur connecté")
        }
      } catch (error) {
        console.error("❌ Erreur chargement utilisateur:", error)
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
      console.log("🔐 Appel API login pour:", usernameOrEmail)
      
      // Appel de l'API de connexion
      const response: LoginResponse = await authApi.login({ identifier: usernameOrEmail, password })
      
      console.log("✅ Réponse API login:", response)
      
      // Vérifier que l'utilisateur est actif
      if (!response.user.is_active) {
        console.warn("⚠️ Utilisateur désactivé:", usernameOrEmail)
        throw new Error("Votre compte a été désactivé. Contactez l'administrateur.")
      }
      
      // Mettre à jour l'état local
      setUser(response.user)
      
      console.log("✅ Utilisateur connecté:", response.user.username, "Rôle:", response.user.role)
      
      return true
    } catch (error: any) {
      console.error("❌ Erreur lors de la connexion:", error)
      
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
    console.log("🚪 Déconnexion de l'utilisateur:", user?.username)
    
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
