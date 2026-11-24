"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface SeminaristModalProps {
  seminarist: any
  onClose: () => void
}

export default function SeminaristModal({ seminarist, onClose }: SeminaristModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold text-secondary">SÉMINARISTE</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Photo placeholder */}
          <div className="flex justify-center">
            <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
              <div className="text-center text-muted-foreground">
                <div className="w-8 h-8 mx-auto mb-2 bg-muted-foreground/20 rounded"></div>
                <div className="text-xs">Photo</div>
              </div>
            </div>
          </div>

          {/* Informations générales */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b border-border pb-2">Informations générales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Matricule</label>
                <div className="text-foreground font-medium">{seminarist.matricule}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Date de naissance</label>
                <div className="text-foreground">00/00/0000</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nom</label>
                <div className="text-foreground font-medium">{seminarist.nom}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Genre</label>
                <div>
                  <Badge variant={seminarist.genre === "M" ? "default" : "secondary"}>{seminarist.genre}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Prénoms</label>
                <div className="text-foreground">{seminarist.prenoms}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Commune</label>
                <div className="text-foreground">Bingerville</div>
              </div>
            </div>
          </div>

          {/* Coordonnées */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b border-border pb-2">Coordonnées</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Contact</label>
                <div className="text-foreground">+225 00 00 00 00 00</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Contact Parent</label>
                <div className="text-foreground">+225 00 00 00 00 00</div>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <div className="text-foreground">XXXXXXX@gmail.com</div>
              </div>
            </div>
          </div>

          {/* Catégorie */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b border-border pb-2">Catégorie</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Statut</label>
                <div className="text-foreground">Élève</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Niveau d&apos;étude</label>
                <div className="text-foreground">Terminale</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Dortoir</label>
                <div className="text-foreground">{seminarist.dortoir}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Niveau</label>
                <div className="text-foreground">{seminarist.niveau}</div>
              </div>
            </div>
          </div>

          {/* Informations Médicales */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground border-b border-border pb-2">Informations Médicales</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Antécédents Médicaux</label>
                <div className="text-foreground">Exemple d&apos;antécédents médicaux</div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Allergies</label>
                <div className="text-foreground">Exemple d&apos;allergie</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center">
            <Button onClick={onClose} className="bg-primary hover:bg-primary/90">
              FERMER
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
