"use client"

import { useState } from "react"
import { usersApi } from "@/lib/api"
import { MOT_DE_PASSE_MIN } from "@/lib/mot-de-passe"
import { ROLES_ATTRIBUABLES, ROLE_LABELS } from "@/lib/roles"
import { toast } from "sonner"
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
  // TAF lot 3 : par défaut, la personne choisit son mot de passe via le lien d'activation reçu par email
  const [definirMotDePasse, setDefinirMotDePasse] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation simple (la politique complète est vérifiée par l'API)
    if (!formData.email || !formData.username || !formData.nom || !formData.prenom
        || (definirMotDePasse && !formData.password)) {
      setError("Veuillez remplir tous les champs obligatoires")
      return
    }

    if (definirMotDePasse && formData.password.length < MOT_DE_PASSE_MIN) {
      setError(`Le mot de passe doit contenir au moins ${MOT_DE_PASSE_MIN} caractères`)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { password, ...sansMotDePasse } = formData
      const cree = await usersApi.createUser(definirMotDePasse ? { ...sansMotDePasse, password } : sansMotDePasse)
      if (cree.email_envoye === false) {
        toast.warning("Compte créé, mais l'email d'activation n'a pas pu être envoyé : renvoyez le lien depuis la liste.")
      } else if (cree.email_envoye) {
        toast.success(`Lien d'activation envoyé à ${cree.email}`)
      }

      setSuccess(true)

      // Fermer après 1.5 secondes
      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création de l'utilisateur")
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
              Nom d&apos;utilisateur <span className="text-red-500">*</span>
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

          <div className="space-y-2 rounded-md border p-3">
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={definirMotDePasse}
                onChange={(e) => setDefinirMotDePasse(e.target.checked)} disabled={loading || success} />
              <span>
                Définir le mot de passe moi-même
                <span className="block text-xs text-muted-foreground">
                  Par défaut, un lien d&apos;activation (72 h) est envoyé par email et la personne choisit son mot de passe.
                </span>
              </span>
            </label>
            {definirMotDePasse && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="password">
                  Mot de passe <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  placeholder={`Minimum ${MOT_DE_PASSE_MIN} caractères`}
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={MOT_DE_PASSE_MIN}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={loading || success}
                />
              </div>
            )}
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
              {ROLES_ATTRIBUABLES.map((role) => (
                <option key={role} value={role}>{ROLE_LABELS[role].toUpperCase()}</option>
              ))}
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
