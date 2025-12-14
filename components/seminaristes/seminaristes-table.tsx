"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Plus, Eye, Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import SeminaristModal from "./seminarist-modal"
import DeleteSeminaristModal from "./delete-seminarist-modal"

// Mock data
const seminaristes = [
  {
    id: "1",
    matricule: "AN06-XXXX",
    nom: "XXXXX",
    prenoms: "XXXX XXXX",
    genre: "M",
    dortoir: "XXXXX",
    niveau: "X",
  },
  {
    id: "2",
    matricule: "AN06-XXXX",
    nom: "XXXXX",
    prenoms: "XXXX XXXX",
    genre: "F",
    dortoir: "XXXXX",
    niveau: "2",
  },
  {
    id: "3",
    matricule: "AN06-XXXX",
    nom: "XXXXX",
    prenoms: "XXXX XXXX",
    genre: "M",
    dortoir: "XXXXX",
    niveau: "2",
  },
  {
    id: "4",
    matricule: "AN06-XXXX",
    nom: "XXXXX",
    prenoms: "XXXX XXXX",
    genre: "F",
    dortoir: "XXXXX",
    niveau: "2",
  },
  {
    id: "5",
    matricule: "AN06-XXXX",
    nom: "XXXXX",
    prenoms: "XXXX XXXX",
    genre: "F",
    dortoir: "XXXXX",
    niveau: "2",
  },
]

export default function SeminaristesTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("tous")
  const [selectedDortoir, setSelectedDortoir] = useState("tous")
  const [selectedNiveau, setSelectedNiveau] = useState("tous")
  const [selectedSeminarist, setSelectedSeminarist] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState<any>(null)

  // ✅ Récupérer l'utilisateur connecté
  const { user } = useAuth()
  
  // ✅ Vérifier si l'utilisateur est admin
  const isAdmin = user?.role?.toUpperCase() === "ADMINISTRATION"
  
  console.log("👤 Utilisateur connecté:", user?.username, "- Rôle:", user?.role)
  console.log("🔑 Est admin?", isAdmin)

  const filteredSeminaristes = seminaristes.filter((seminarist) => {
    const matchesSearch =
      seminarist.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seminarist.prenoms.toLowerCase().includes(searchTerm.toLowerCase()) ||
      seminarist.matricule.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesGenre = selectedGenre === "tous" || seminarist.genre === selectedGenre
    const matchesDortoir = selectedDortoir === "tous" || seminarist.dortoir === selectedDortoir
    const matchesNiveau = selectedNiveau === "tous" || seminarist.niveau === selectedNiveau

    return matchesSearch && matchesGenre && matchesDortoir && matchesNiveau
  })

  return (
    <>
      <Card className="border-border">
        <CardHeader className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Recherche..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">TOUS</SelectItem>
                  <SelectItem value="M">Masculin</SelectItem>
                  <SelectItem value="F">Féminin</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedDortoir} onValueChange={setSelectedDortoir}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Dortoir" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">TOUS</SelectItem>
                  <SelectItem value="Dortoir 1">Dortoir 1</SelectItem>
                  <SelectItem value="Dortoir 2">Dortoir 2</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedNiveau} onValueChange={setSelectedNiveau}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Niveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">TOUS</SelectItem>
                  <SelectItem value="1">Niveau 1</SelectItem>
                  <SelectItem value="2">Niveau 2</SelectItem>
                  <SelectItem value="3">Niveau 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center">
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                TOUS {seminaristes.length.toString().padStart(3, "0")}
              </Badge>
              <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                FORMATION{" "}
                {seminaristes
                  .filter((s) => s.niveau !== "X")
                  .length.toString()
                  .padStart(3, "0")}
              </Badge>
              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                PÉPINIÈRE{" "}
                {seminaristes
                  .filter((s) => s.niveau === "X")
                  .length.toString()
                  .padStart(3, "0")}
              </Badge>
            </div>

            <div className="flex gap-2">
              {/* ✅ Tout le monde peut exporter */}
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                EXPORTER
              </Button>
              
              {/* ✅ Seuls les admins peuvent ajouter */}
              {isAdmin && (
                <Link href="/seminaristes/ajouter">
                  <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4" />
                    AJOUTER UN SÉMINARISTE
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            1-{Math.min(10, filteredSeminaristes.length)} sur {filteredSeminaristes.length.toString().padStart(3, "0")}{" "}
            séminaristes
          </div>
        </CardHeader>

        <CardContent>
          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>MATRICULE</TableHead>
                  <TableHead>NOM</TableHead>
                  <TableHead>PRÉNOMS</TableHead>
                  <TableHead>GENRE</TableHead>
                  <TableHead>DORTOIR</TableHead>
                  <TableHead>NIVEAU</TableHead>
                  <TableHead>ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSeminaristes.slice(0, 10).map((seminarist) => (
                  <TableRow key={seminarist.id}>
                    <TableCell className="font-medium">{seminarist.matricule}</TableCell>
                    <TableCell>{seminarist.nom}</TableCell>
                    <TableCell>{seminarist.prenoms}</TableCell>
                    <TableCell>
                      <Badge variant={seminarist.genre === "M" ? "default" : "secondary"}>{seminarist.genre}</Badge>
                    </TableCell>
                    <TableCell>{seminarist.dortoir}</TableCell>
                    <TableCell>{seminarist.niveau}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {/* ✅ Tout le monde peut voir */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSeminarist(seminarist)
                            setShowModal(true)
                          }}
                          className="h-8 w-8 p-0 text-primary hover:text-primary/80"
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {/* ✅ Seuls les admins peuvent modifier */}
                        {isAdmin && (
                          <Link href={`/seminaristes/${seminarist.id}/modifier`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-secondary hover:text-secondary/80"
                              title="Modifier"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        
                        {/* ✅ Seuls les admins peuvent supprimer */}
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteModal(seminarist)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button variant="outline" size="sm">
              1
            </Button>
            <Button variant="outline" size="sm">
              2
            </Button>
            <Button variant="outline" size="sm">
              3
            </Button>
            <span className="text-muted-foreground">...</span>
            <Button variant="outline" size="sm">
              {seminaristes.length.toString().padStart(3, "0")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {showModal && selectedSeminarist && (
        <SeminaristModal
          seminarist={selectedSeminarist}
          onClose={() => {
            setShowModal(false)
            setSelectedSeminarist(null)
          }}
        />
      )}

      {deleteModal && (
        <DeleteSeminaristModal
          seminarist={deleteModal}
          onClose={() => setDeleteModal(null)}
          onConfirm={() => {
            // Handle delete
            setDeleteModal(null)
          }}
        />
      )}
    </>
  )
}
