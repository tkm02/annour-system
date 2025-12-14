"use client"

import { useState } from "react"
import { usersApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Loader2, CheckCircle } from "lucide-react"

interface CreateAccessModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateAccessModal({ onClose, onSuccess }: CreateAccessModalProps) {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    nom: "",
    prenom: "",
    role: "scientifique",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation simple
    if (!formData.email || !formData.username || !formData.password) {
      setError("Veuillez remplir tous les champs obligatoires")
      return
    }

    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères")
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      await usersApi.createUser(formData)
      
      setSuccess(true)
      
      // Fermer après 1.5 secondes
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création de l'utilisateur")
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
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-secondary">Créer un Accès</h2>
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
        
        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <span>Utilisateur créé avec succès!</span>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Erreur : </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              placeholder="exemple@seminaire.com"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={loading || success}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="username">
              Nom d'utilisateur <span className="text-red-500">*</span>
            </Label>
            <Input
              id="username"
              placeholder="nom.utilisateur"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              disabled={loading || success}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">
              Mot de passe <span className="text-red-500">*</span>
            </Label>
            <Input
              id="password"
              placeholder="Minimum 8 caractères"
              type="password"
              required
              minLength={8}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={loading || success}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">
                Nom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nom"
                placeholder="Nom"
                required
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                disabled={loading || success}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prenom">
                Prénom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="prenom"
                placeholder="Prénom"
                required
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                disabled={loading || success}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">
              Commission <span className="text-red-500">*</span>
            </Label>
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
          
          {/* Actions */}
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
                  Création...
                </>
              ) : success ? (
                "Créé ✓"
              ) : (
                "Créer"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
