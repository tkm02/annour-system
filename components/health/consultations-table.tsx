"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Edit, Eye, Plus, Search } from "lucide-react"
import { useState } from "react"
import AddConsultationModal from "./add-consultation-modal"
import ConsultationModal from "./consultation-modal"

// Mock data
const consultations = [
  {
    id: "1",
    matricule: "AN06-XXXX",
    nom: "XXXX XXXX",
    genre: "M",
    dateHeure: "00/00/00 00H00",
    niveau: "XXXX",
    motif: "XXXXX",
  },
  {
    id: "2",
    matricule: "AN06-XXXX",
    nom: "XXXX XXXX",
    genre: "F",
    dateHeure: "00/00/00 00H00",
    niveau: "XXXX",
    motif: "XXXXX",
  },
  {
    id: "3",
    matricule: "AN06-XXXX",
    nom: "XXXX XXXX",
    genre: "M",
    dateHeure: "00/00/00 00H00",
    niveau: "XXXX",
    motif: "XXXXX",
  },
]

export default function ConsultationsTable() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("tous")
  const [selectedDortoir, setSelectedDortoir] = useState("tous")
  const [selectedNiveau, setSelectedNiveau] = useState("tous")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedConsultation, setSelectedConsultation] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

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

              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40"
                placeholder="Date"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center">
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                TOUS {consultations.length.toString().padStart(3, "0")}
              </Badge>
              <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                FORMATION {consultations.length.toString().padStart(3, "0")}
              </Badge>
              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">
                PÉPINIÈRE 000
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                EXPORTER
              </Button>
              <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90" onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4" />
                AJOUTER UNE CONSULTATION
              </Button>
            </div>
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            1-{Math.min(10, consultations.length)} sur {consultations.length.toString().padStart(3, "0")} séminaristes
          </div>
        </CardHeader>

        <CardContent>
          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">N°</TableHead>
                  <TableHead>MATRICULE</TableHead>
                  <TableHead>NOM & PRÉNOMS</TableHead>
                  <TableHead>GENRE</TableHead>
                  <TableHead>DATE & HEURE</TableHead>
                  <TableHead>NIVEAU</TableHead>
                  <TableHead>MOTIF</TableHead>
                  <TableHead>ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consultations.map((consultation, index) => (
                  <TableRow key={consultation.id}>
                    <TableCell className="font-mono text-muted-foreground w-[50px]">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{consultation.matricule}</TableCell>
                    <TableCell>{consultation.nom}</TableCell>
                    <TableCell>
                      <Badge variant={consultation.genre === "M" ? "default" : "secondary"}>{consultation.genre}</Badge>
                    </TableCell>
                    <TableCell>{consultation.dateHeure}</TableCell>
                    <TableCell>{consultation.niveau}</TableCell>
                    <TableCell>{consultation.motif}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedConsultation(consultation)
                            setShowModal(true)
                          }}
                          className="h-8 w-8 p-0 text-primary hover:text-primary/80"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-secondary hover:text-secondary/80"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
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
              000
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {showModal && selectedConsultation && (
        <ConsultationModal
          consultation={selectedConsultation}
          onClose={() => {
            setShowModal(false)
            setSelectedConsultation(null)
          }}
        />
      )}

      {showAddModal && <AddConsultationModal onClose={() => setShowAddModal(false)} />}
    </>
  )
}
