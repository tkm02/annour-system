"use client"

import { useCallback, useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Download, Edit, Loader2, LogOut, Mail, Plus, Search } from "lucide-react"
import { toast } from "sonner"

import ComptesCOGenerator from "@/components/access/comptes-co-generator"
import ConnexionsJournal from "@/components/access/connexions-journal"
import ConfirmDialog from "@/components/common/confirm-dialog"
import { PageHeader } from "@/components/common/page-header"
import Pager from "@/components/common/pager"
import { EmptyState, ErrorState, LoadingState, errorText } from "@/components/common/states"
import { StatusBadge, type StatusTone } from "@/components/common/status-badge"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { comptesApi, usersApi, type User } from "@/lib/api"
import { LIBELLES_STATUT, actionLien, basculePossible, champCsv, statutCompte, type StatutCompte } from "@/lib/comptes"
import { normalizeRole, roleLabel } from "@/lib/roles"

const CreateAccessModal = dynamic(() => import("@/components/access/create-access-modal"), { ssr: false })
const EditAccessModal = dynamic(() => import("@/components/access/edit-access-modal"), { ssr: false })

const LIMIT = 10

const TON_STATUT: Record<StatutCompte, StatusTone> = { actif: "success", en_attente: "warning", desactive: "neutral" }

function couleurRole(role: string) {
  switch (normalizeRole(role)) {
    case "super_admin": return "bg-foreground text-background"
    case "admin": return "bg-secondary text-white"
    case "scientifique": return "bg-primary text-white"
    case "finances": return "bg-green-600 text-white"
    case "sante": return "bg-red-600 text-white"
    default: return "bg-gray-500 text-white"
  }
}

/** NOM en majuscules, prénoms capitalisés */
function nomComplet(nom: string, prenom: string) {
  const prenoms = (prenom || "").split(" ").map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ")
  return `${(nom || "").toUpperCase()} ${prenoms}`.trim()
}

function ComptesListe({ rechargement }: { rechargement: number }) {
  const [recherche, setRecherche] = useState("")
  const [users, setUsers] = useState<User[] | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [erreur, setErreur] = useState<string | null>(null)
  const [enBascule, setEnBascule] = useState<string | null>(null)
  const [aModifier, setAModifier] = useState<User | null>(null)
  const [aFermer, setAFermer] = useState<User | null>(null)
  const [fermeture, setFermeture] = useState(false)
  const [aRelancer, setARelancer] = useState<User | null>(null)
  const [envoi, setEnvoi] = useState(false)

  const charger = useCallback(async () => {
    try {
      const { data, total: nombre } = await usersApi.getUsers(page, LIMIT)
      setErreur(null)
      setUsers(data)
      setTotal(nombre)
    } catch (err) {
      setErreur(errorText(err, "Erreur lors du chargement des comptes"))
      setUsers([])
    }
  }, [page])

  useEffect(() => { charger() }, [charger, rechargement])

  const basculer = async (user: User) => {
    setEnBascule(user.id)
    try {
      await usersApi.toggleUserStatus(user.id, !user.is_active)
      setUsers((liste) => liste?.map((u) => (u.id === user.id ? { ...u, is_active: !user.is_active } : u)) ?? null)
      toast.success(user.is_active ? `Compte ${user.username} désactivé` : `Compte ${user.username} réactivé`)
    } catch (err) {
      toast.error(errorText(err, "Modification du statut impossible"))
    } finally {
      setEnBascule(null)
    }
  }

  const fermerSessions = async () => {
    if (!aFermer) return
    setFermeture(true)
    try {
      await usersApi.revokeSessions(aFermer.id)
      toast.success(`Sessions de ${aFermer.username} fermées`)
      setAFermer(null)
    } catch (err) {
      toast.error(errorText(err, "Fermeture des sessions impossible"))
    } finally {
      setFermeture(false)
    }
  }

  const envoyerLien = async () => {
    if (!aRelancer) return
    setEnvoi(true)
    try {
      const resultat = await comptesApi.envoyerLien(aRelancer.id)
      if (resultat.email_envoye) toast.success(`${resultat.message} à ${aRelancer.email}`)
      else toast.warning(resultat.message)
      setARelancer(null)
    } catch (err) {
      toast.error(errorText(err, "Envoi du lien impossible"))
    } finally {
      setEnvoi(false)
    }
  }

  const exporter = () => {
    if (!users || users.length === 0) return
    const lignes = [
      ["Nom d'utilisateur", "Email", "Nom", "Prénom", "Rôle", "Statut"],
      ...users.map((u) => [u.username, u.email, (u.nom || "").toUpperCase(), u.prenom || "", roleLabel(u.role),
        LIBELLES_STATUT[statutCompte(u)]]),
    ]
    const blob = new Blob(["﻿" + lignes.map((l) => l.map((v) => champCsv(v)).join(",")).join("\n")],
      { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const lien = document.createElement("a")
    lien.href = url
    lien.download = `comptes-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(lien)
    lien.click()
    document.body.removeChild(lien)
    window.URL.revokeObjectURL(url)
  }

  const terme = recherche.trim().toLowerCase()
  const affiches = (users ?? []).filter((u) => !terme || [u.username, u.email, u.nom, u.prenom, roleLabel(u.role)]
    .some((v) => (v ?? "").toLowerCase().includes(terme)))
  const relance = aRelancer ? actionLien(aRelancer) : null

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input placeholder="Rechercher sur cette page (nom, email, rôle…)" value={recherche} className="pl-10"
              aria-label="Rechercher un compte" onChange={(e) => setRecherche(e.target.value)} />
          </div>
          <Button variant="outline" className="gap-2" onClick={exporter} disabled={!users || users.length === 0}>
            <Download className="h-4 w-4" aria-hidden="true" />Exporter la page (CSV)
          </Button>
        </div>

        {erreur ? (
          <ErrorState message={erreur} onRetry={() => { setErreur(null); setUsers(null); charger() }} />
        ) : !users ? (
          <LoadingState label="Chargement des comptes…" />
        ) : affiches.length === 0 ? (
          <EmptyState message={terme ? "Aucun compte ne correspond à votre recherche." : "Aucun compte enregistré."} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Nom d&apos;utilisateur</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Nom complet</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiches.map((u) => {
                  const statut = statutCompte(u)
                  const action = actionLien(u)
                  return (
                    <TableRow key={u.id}>
                      <TableCell><Badge className={couleurRole(u.role)}>{roleLabel(u.role).toUpperCase()}</Badge></TableCell>
                      <TableCell className="font-mono text-sm">{u.username}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{u.email}</TableCell>
                      <TableCell>{nomComplet(u.nom, u.prenom) || "—"}</TableCell>
                      <TableCell><StatusBadge tone={TON_STATUT[statut]}>{LIBELLES_STATUT[statut]}</StatusBadge></TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setAModifier(u)} disabled={enBascule === u.id}
                            aria-label={`Modifier ${u.username}`} title="Modifier">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {action && (
                            <Button variant="ghost" size="sm" onClick={() => setARelancer(u)} disabled={enBascule === u.id}
                              aria-label={`${action.libelle} — ${u.username}`} title={action.libelle}>
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => setAFermer(u)} disabled={enBascule === u.id}
                            aria-label={`Fermer les sessions de ${u.username}`} title="Fermer les sessions">
                            <LogOut className="h-4 w-4" />
                          </Button>
                          <Switch checked={u.is_active} onCheckedChange={() => basculer(u)}
                            disabled={enBascule === u.id || !basculePossible(u)}
                            aria-label={u.is_active ? `Désactiver ${u.username}` : `Réactiver ${u.username}`}
                            title={basculePossible(u) ? (u.is_active ? "Désactiver le compte" : "Réactiver le compte")
                              : "Le compte s'active par le lien envoyé par email"}
                            className="data-[state=checked]:bg-green-500" />
                          {enBascule === u.id && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
        <Pager page={page} limit={LIMIT} total={total} onPageChange={(p) => { setUsers(null); setPage(p) }} disabled={!users} />
      </CardContent>

      {aModifier && (
        <EditAccessModal user={aModifier} onClose={() => setAModifier(null)}
          onSuccess={() => { setAModifier(null); charger() }} />
      )}
      <ConfirmDialog open={!!aFermer} title={`Fermer les sessions de ${aFermer?.username ?? ""} ?`}
        description="Toutes les sessions ouvertes de ce compte seront fermées ; la personne devra se reconnecter."
        confirmLabel="Fermer les sessions" busy={fermeture} onConfirm={fermerSessions} onCancel={() => setAFermer(null)} />
      <ConfirmDialog open={!!aRelancer} tone="default" title={`${relance?.libelle ?? ""} — ${aRelancer?.username ?? ""}`}
        description={`${relance?.confirmation ?? ""} Destinataire : ${aRelancer?.email ?? ""}.`}
        confirmLabel="Envoyer" busy={envoi} onConfirm={envoyerLien} onCancel={() => setARelancer(null)} />
    </Card>
  )
}

export default function AccessManagementPage() {
  const [creation, setCreation] = useState(false)
  const [rechargement, setRechargement] = useState(0)
  const recharger = () => setRechargement((n) => n + 1)

  return (
    <DashboardLayout>
      <PageHeader
        title="Gestion des accès"
        description="Comptes du back-office, génération des comptes des membres du CO et journal des connexions."
        actions={(
          <Button className="gap-2" onClick={() => setCreation(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />Créer un accès
          </Button>
        )}
      />
      <Tabs defaultValue="comptes" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="comptes">Comptes</TabsTrigger>
          <TabsTrigger value="generation">Générer les comptes CO</TabsTrigger>
          <TabsTrigger value="journal">Journal des connexions</TabsTrigger>
        </TabsList>
        <TabsContent value="comptes"><ComptesListe rechargement={rechargement} /></TabsContent>
        <TabsContent value="generation"><ComptesCOGenerator onGenere={recharger} /></TabsContent>
        <TabsContent value="journal"><ConnexionsJournal /></TabsContent>
      </Tabs>

      {creation && (
        <CreateAccessModal onClose={() => setCreation(false)} onSuccess={() => { setCreation(false); recharger() }} />
      )}
    </DashboardLayout>
  )
}
