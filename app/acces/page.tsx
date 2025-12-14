"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Search, Download, Plus, Edit, Loader2, AlertCircle } from "lucide-react"
import dynamic from "next/dynamic"
import { usersApi } from "@/lib/api"

// Importer les modals dynamiquement
const CreateAccessModal = dynamic(
  () => import("@/components/access/create-access-modal"),
  { ssr: false }
)

const EditAccessModal = dynamic(
  () => import("@/components/access/edit-access-modal"),
  { ssr: false }
)

interface AccessUser {
  id: string
  username: string
  email: string
  nom: string
  prenom: string
  role: string
  is_active: boolean
}

export default function AccessManagementPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [users, setUsers] = useState<AccessUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AccessUser | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted) {
      loadUsers()
    }
  }, [currentPage, isMounted])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await usersApi.getUsers(currentPage, 10)
      
      console.log("📦 Réponse API complète:", response)
      
      let usersArray: AccessUser[] = []
      let total = 0
      
      if (response && typeof response === 'object') {
        if ('data' in response && Array.isArray((response as any).data)) {
          usersArray = (response as any).data
          total = (response as any).total || (response as any).data.length
        } else if (Array.isArray(response)) {
          usersArray = response as AccessUser[]
          total = (response as AccessUser[]).length
        }
      } else if (Array.isArray(response)) {
        usersArray = response as AccessUser[]
        total = (response as AccessUser[]).length
      }
      
      if (Array.isArray(usersArray)) {
        console.log(`✅ ${usersArray.length} utilisateur(s) chargé(s)`)
        setUsers(usersArray)
        setTotalUsers(total)
      } else {
        setUsers([])
        setTotalUsers(0)
      }
      
    } catch (err: any) {
      console.error("❌ Erreur lors du chargement:", err)
      setError(err.message || "Erreur lors du chargement des utilisateurs")
      setUsers([])
      setTotalUsers(0)
    } finally {
      setLoading(false)
    }
  }

 // ✅ Fonction pour formater le nom et les prénoms
const formatFullName = (nom: string, prenom: string) => {
  // Nom en MAJUSCULES
  const formattedNom = nom ? nom.toUpperCase() : ""
  
  // Prénoms : chaque prénom commence par une majuscule
  const formattedPrenom = prenom 
    ? prenom
        .split(' ')  // Séparer les prénoms par espace
        .map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )  // Capitaliser chaque prénom
        .join(' ')  // Rejoindre avec espaces
    : ""
  
  return `${formattedNom} ${formattedPrenom}`.trim()
}


  const handleToggleStatus = async (user: AccessUser) => {
    try {
      setTogglingUserId(user.id)
      
      const newStatus = !user.is_active
      
      await usersApi.toggleUserStatus(user.id, newStatus)
      
      setUsers(prevUsers => 
        prevUsers.map(u => 
          u.id === user.id ? { ...u, is_active: newStatus } : u
        )
      )
      
      console.log(`✅ Statut modifié: ${user.username} -> ${newStatus ? 'Activé' : 'Désactivé'}`)
      
    } catch (err: any) {
      console.error("❌ Erreur toggle status:", err)
      alert(`Erreur lors de la modification du statut: ${err.message}`)
    } finally {
      setTogglingUserId(null)
    }
  }

  const filteredUsers = (users || []).filter((user) => {
    if (!searchTerm) return true
    
    const search = searchTerm.toLowerCase()
    return (
      user?.username?.toLowerCase().includes(search) ||
      user?.email?.toLowerCase().includes(search) ||
      user?.role?.toLowerCase().includes(search) ||
      user?.nom?.toLowerCase().includes(search) ||
      user?.prenom?.toLowerCase().includes(search)
    )
  })

  const handleEdit = (user: AccessUser) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const getCommissionColor = (role: string) => {
    if (!role) return "bg-gray-500 text-white"
    
    switch (role.toUpperCase()) {
      case "ADMINISTRATION":
        return "bg-secondary text-white"
      case "SCIENTIFIQUE":
        return "bg-primary text-white"
      case "FINANCE":
        return "bg-green-600 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-500 text-white">ACTIVÉ</Badge>
    ) : (
      <Badge className="bg-gray-400 text-white">DÉSACTIVÉ</Badge>
    )
  }

  const handleExport = async () => {
    try {
      if (!users || users.length === 0) {
        alert("Aucune donnée à exporter")
        return
      }

      const csvContent = [
        ["Nom d'utilisateur", "Email", "Nom", "Prénom", "Commission", "Statut"].join(","),
        ...users.map(user => 
          [
            user.username || "",
            user.email || "",
            user.nom ? user.nom.toUpperCase() : "",
            user.prenom ? user.prenom.charAt(0).toUpperCase() + user.prenom.slice(1).toLowerCase() : "",
            user.role || "",
            user.is_active ? "Activé" : "Désactivé"
          ].join(",")
        )
      ].join("\n")

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `utilisateurs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Erreur lors de l'export:", err)
      alert("Erreur lors de l'export des données")
    }
  }

  const totalPages = Math.ceil(totalUsers / 10)

  if (!isMounted) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg">Chargement...</span>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-secondary">GESTION DES ACCÈS</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex items-center gap-2 bg-transparent"
              onClick={handleExport}
              disabled={!users || users.length === 0}
            >
              <Download className="h-4 w-4" />
              EXPORTER
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              CRÉER UN ACCÈS
            </Button>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800">Erreur</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <Button 
                  onClick={loadUsers} 
                  variant="outline" 
                  size="sm" 
                  className="mt-3"
                >
                  Réessayer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Barre de recherche */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Recherche par nom, email ou commission..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-muted-foreground font-medium">
            TOUS {filteredUsers.length.toString().padStart(3, "0")}
          </div>
        </div>

        {/* Tableau des utilisateurs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {filteredUsers.length > 0 
                ? `Affichage de 1-${Math.min(10, filteredUsers.length)} sur ${totalUsers} accès`
                : "Aucun utilisateur trouvé"
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Chargement des utilisateurs...</span>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-foreground">COMMISSION</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">NOM D'UTILISATEUR</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">EMAIL</th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">NOM COMPLET</th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground">STATUS</th>
                        <th className="text-center py-3 px-4 font-semibold text-foreground">ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="py-3 px-4">
                              <Badge className={getCommissionColor(user.role)}>
                                {user.role?.toUpperCase() || "N/A"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-foreground font-medium">
                              {user.username || "N/A"}
                            </td>
                            <td className="py-3 px-4 text-foreground text-sm">
                              {user.email || "N/A"}
                            </td>
                            {/* ✅ Nom et Prénom formatés */}
                            <td className="py-3 px-4 text-foreground">
                              {formatFullName(user.nom || "", user.prenom || "") || "N/A"}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {getStatusBadge(user.is_active ?? true)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex justify-center items-center gap-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(user)}
                                  className="text-primary hover:text-primary/80 hover:bg-primary/10"
                                  title="Modifier"
                                  disabled={togglingUserId === user.id}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={user.is_active ?? true}
                                    onCheckedChange={() => handleToggleStatus(user)}
                                    disabled={togglingUserId === user.id}
                                    className="data-[state=checked]:bg-green-500"
                                    title={user.is_active ? "Désactiver l'utilisateur" : "Activer l'utilisateur"}
                                  />
                                  {togglingUserId === user.id && (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <AlertCircle className="h-12 w-12 mb-3 opacity-50" />
                              <p className="text-lg font-medium">
                                {searchTerm 
                                  ? "Aucun utilisateur ne correspond à votre recherche" 
                                  : "Aucun utilisateur enregistré"
                                }
                              </p>
                              {!searchTerm && (
                                <p className="text-sm mt-2">
                                  Cliquez sur "CRÉER UN ACCÈS" pour ajouter un utilisateur
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && filteredUsers.length > 0 && (
                  <div className="flex justify-center items-center gap-2 mt-6 pt-6 border-t">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={currentPage === 1 || loading}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      Précédent
                    </Button>
                    
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      const pageNum = i + 1
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          disabled={loading}
                          className={currentPage === pageNum ? "bg-primary text-white" : ""}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                    
                    {totalPages > 5 && (
                      <>
                        <span className="text-muted-foreground px-2">...</span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={loading}
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={currentPage === totalPages || loading}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Suivant
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateAccessModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            setCurrentPage(1)
            loadUsers()
          }}
        />
      )}
      
      {showEditModal && selectedUser && (
        <EditAccessModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false)
            setSelectedUser(null)
          }}
          onSuccess={() => {
            setShowEditModal(false)
            setSelectedUser(null)
            loadUsers()
          }}
        />
      )}
    </DashboardLayout>
  )
}
