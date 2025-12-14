"use client"

import { useState } from "react"
import { usersApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Loader2, CheckCircle } from "lucide-react"

interface EditAccessModalProps {
  user: {
    id: string
    username: string
    email: string
    nom: string
    prenom: string
    role: string
  }
  onClose: () => void
  onSuccess: () => void
}

export default function EditAccessModal({ user, onClose, onSuccess }: EditAccessModalProps) {
  const [formData, setFormData] = useState({
    email: user.email,
    username: user.username,
    nom: user.nom,
    prenom: user.prenom,
    role: user.role,
    password: "", // Optionnel pour la modification
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password && formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères")
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      // Ne pas envoyer le password s'il est vide
      const updateData: any = {
        email: formData.email,
        username: formData.username,
        nom: formData.nom,
        prenom: formData.prenom,
        role: formData.role,
      }
      
      if (formData.password) {
        updateData.password = formData.password
      }
      
      await usersApi.updateUser(user.id, updateData)
      
      setSuccess(true)
      
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err: any) {
      setError(err.message || "Erreur lors de la modification")
      console.error("Erreur:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-secondary">Modifier l'Accès</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span>Utilisateur modifié avec succès!</span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Erreur : </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={loading || success}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="username">Nom d'utilisateur</Label>
            <Input
              id="username"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              disabled={loading || success}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">
              Nouveau mot de passe (optionnel)
            </Label>
            <Input
              id="password"
              placeholder="Laisser vide pour ne pas changer"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={loading || success}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                required
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                disabled={loading || success}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom</Label>
              <Input
                id="prenom"
                required
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                disabled={loading || success}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Commission</Label>
            <select
              id="role"
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              disabled={loading || success}
            >
              <option value="admin">ADMINISTRATION</option>
              <option value="scientific">SCIENTIFIQUE</option>
              <option value="finance">FINANCE</option>
            </select>
          </div>
          
          <div className="flex gap-3 justify-end pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={loading || success}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading || success}
              className="bg-primary hover:bg-primary/90 text-white min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Modification...
                </>
              ) : success ? (
                "Modifié ✓"
              ) : (
                "Modifier"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
