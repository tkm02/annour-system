"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { X } from "lucide-react"
import { useState } from "react"

interface AddNotesModalProps {
  seminarist?: any
  onClose: () => void
}

// Mock data for batch note entry
const seminaristesForNotes = [
  {
    id: "1",
    matricule: "AN06-XXXX",
    nom: "XXXX XXXX",
    genre: "M",
    niveau: "XXXX",
    note1: "",
  },
  {
    id: "2",
    matricule: "AN06-XXXX",
    nom: "XXXX XXXX",
    genre: "F",
    niveau: "XXXX",
    note1: "",
  },
  {
    id: "3",
    matricule: "AN06-XXXX",
    nom: "XXXX XXXX",
    genre: "M",
    niveau: "XXXX",
    note1: "",
  },
]

export default function AddNotesModal({ seminarist, onClose }: AddNotesModalProps) {
  const [notes, setNotes] = useState<{ [key: string]: string }>({})

  const handleNoteChange = (seminaristId: string, value: string) => {
    setNotes((prev) => ({
      ...prev,
      [seminaristId]: value,
    }))
  }

  const handleSubmit = () => {
    // Handle notes submission
    console.log("Notes submitted:", notes)
    onClose()
  }

  // If editing individual seminarist
  if (seminarist) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-bold text-secondary">BULLETIN DES NOTES</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Photo placeholder */}
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                <div className="text-center text-muted-foreground">
                  <div className="w-6 h-6 mx-auto mb-1 bg-muted-foreground/20 rounded"></div>
                  <div className="text-xs">Photo</div>
                </div>
              </div>
            </div>

            {/* Informations générales */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground border-b border-border pb-2">Informations générales</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Matricule</label>
                  <div className="text-foreground font-medium">{seminarist.matricule}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date de naissance</label>
                  <div className="text-foreground">00/00/0000</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nom & Prénoms</label>
                  <div className="text-foreground font-medium">{seminarist.nom}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Genre</label>
                  <div>
                    <Badge variant={seminarist.genre === "M" ? "default" : "secondary"}>{seminarist.genre}</Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Niveau</label>
                  <div className="text-foreground">{seminarist.niveau}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dortoir</label>
                  <div className="text-foreground">Dortoir 1</div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground border-b border-border pb-2">Notes</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium text-foreground">TEST D'ENTRÉE</div>
                    <div className="text-sm text-muted-foreground">XXXX</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">00,00</div>
                    <div className="text-sm text-muted-foreground">MOYENNE</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="gap-2 bg-transparent">
                Exporter en PDF
              </Button>
              <Button onClick={onClose} className="bg-primary hover:bg-primary/90 ml-auto">
                FERMER
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Batch note entry
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold text-secondary">AJOUTER DES NOTES</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-sm text-muted-foreground">
            1-{Math.min(10, seminaristesForNotes.length)} sur {seminaristesForNotes.length.toString().padStart(3, "0")}{" "}
            séminaristes
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">N°</TableHead>
                  <TableHead>MATRICULE</TableHead>
                  <TableHead>NOM & PRÉNOMS</TableHead>
                  <TableHead>GENRE</TableHead>
                  <TableHead>NIVEAU</TableHead>
                  <TableHead>NOTE 1</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seminaristesForNotes.map((student, index) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-mono text-muted-foreground w-[50px]">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{student.matricule}</TableCell>
                    <TableCell>{student.nom}</TableCell>
                    <TableCell>
                      <Badge variant={student.genre === "M" ? "default" : "secondary"}>{student.genre}</Badge>
                    </TableCell>
                    <TableCell>{student.niveau}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        step="0.01"
                        placeholder="00"
                        value={notes[student.id] || ""}
                        onChange={(e) => handleNoteChange(student.id, e.target.value)}
                        className="w-20 text-center"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="bg-transparent">
              ANNULER
            </Button>
            <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 ml-auto">
              ENREGISTRER
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
