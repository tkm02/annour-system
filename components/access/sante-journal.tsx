"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import Pager from "@/components/common/pager"
import { EmptyState, ErrorState, LoadingState, errorText } from "@/components/common/states"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { comptesApi, type AccesSante } from "@/lib/api"
import { LIBELLES_ACTIONS_SANTE, libelleActeurSante, libelleActionSante, libelleCibleSante } from "@/lib/journal-sante"
import { formatDate } from "@/lib/format"
import { ROLE_LABELS, type UserRole } from "@/lib/roles"

const LIMIT = 50
const TOUS = "tous"
const ROLES_FILTRE: string[] = ["admin", "sante", "super_admin", "public"]

const libelleRole = (role: string) => (role === "public" ? "Public" : ROLE_LABELS[role as UserRole] ?? role)

/** Journal des accès aux données de santé (super_admin, TAF lot 4) : qui a lu ou modifié quoi, sans contenu médical. */
export default function SanteJournal() {
  const [action, setAction] = useState(TOUS)
  const [role, setRole] = useState(TOUS)
  const [cible, setCible] = useState("")
  const [cibleAppliquee, setCibleAppliquee] = useState("")
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<AccesSante[] | null>(null)
  const [total, setTotal] = useState(0)
  const [erreur, setErreur] = useState<string | null>(null)
  const derniere = useRef(0)

  const charger = useCallback(async () => {
    const requete = ++derniere.current
    try {
      const resultat = await comptesApi.journalSante(page, LIMIT, {
        action: action === TOUS ? undefined : action,
        role: role === TOUS ? undefined : role,
        cible: cibleAppliquee.trim() || undefined,
      })
      if (requete !== derniere.current) return
      setErreur(null)
      setItems(resultat.data)
      setTotal(resultat.total)
    } catch (err) {
      if (requete === derniere.current) setErreur(errorText(err, "Journal indisponible"))
    }
  }, [page, action, role, cibleAppliquee])

  useEffect(() => { charger() }, [charger])

  const filtrer = (appliquer: () => void) => { setItems(null); appliquer(); setPage(1) }
  const filtre = action !== TOUS || role !== TOUS || cibleAppliquee !== ""

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div>
          <CardTitle className="text-base">Journal des accès aux données de santé</CardTitle>
          <CardDescription>
            Lectures et modifications des allergies, antécédents et consultations. Le journal ne contient que les noms
            des champs, jamais leur contenu ; il est conservé 2 ans.
          </CardDescription>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <Select value={action} onValueChange={(v) => filtrer(() => setAction(v))}>
            <SelectTrigger aria-label="Filtrer par action"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TOUS}>Toutes les actions</SelectItem>
              {Object.entries(LIBELLES_ACTIONS_SANTE).map(([valeur, libelle]) => (
                <SelectItem key={valeur} value={valeur}>{libelle}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={role} onValueChange={(v) => filtrer(() => setRole(v))}>
            <SelectTrigger aria-label="Filtrer par rôle"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TOUS}>Tous les rôles</SelectItem>
              {ROLES_FILTRE.map((r) => <SelectItem key={r} value={r}>{libelleRole(r)}</SelectItem>)}
            </SelectContent>
          </Select>
          <form onSubmit={(e) => { e.preventDefault(); filtrer(() => setCibleAppliquee(cible)) }}>
            <Input
              value={cible}
              onChange={(e) => setCible(e.target.value)}
              onBlur={() => { if (cible !== cibleAppliquee) filtrer(() => setCibleAppliquee(cible)) }}
              placeholder="Matricule (Entrée pour filtrer)"
              aria-label="Filtrer par matricule"
              maxLength={100}
            />
          </form>
        </div>
      </CardHeader>
      <CardContent>
        {erreur ? (
          <ErrorState message={erreur} onRetry={() => { setErreur(null); setItems(null); charger() }} />
        ) : !items ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState message={filtre ? "Aucun accès ne correspond à ces filtres." : "Aucun accès enregistré."} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Fiche</TableHead>
                  <TableHead>Compte</TableHead>
                  <TableHead className="hidden md:table-cell">Champs</TableHead>
                  <TableHead className="hidden lg:table-cell">Adresse IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap text-sm">{formatDate(e.created_at, true)}</TableCell>
                    <TableCell className="text-sm">{libelleActionSante(e.action)}</TableCell>
                    <TableCell className="font-mono text-sm" title={e.cible}>{libelleCibleSante(e.cible)}</TableCell>
                    <TableCell className="text-sm">
                      <span className="font-mono">{libelleActeurSante(e)}</span>
                      <span className="block text-xs text-muted-foreground">{libelleRole(e.role)}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs">{e.champs.length ? e.champs.join(", ") : "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell font-mono text-xs">{e.ip_address ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <Pager page={page} limit={LIMIT} total={total} onPageChange={(p) => { setItems(null); setPage(p) }} disabled={!items} />
      </CardContent>
    </Card>
  )
}
