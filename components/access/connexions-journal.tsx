"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import Pager from "@/components/common/pager"
import { EmptyState, ErrorState, LoadingState, errorText } from "@/components/common/states"
import { StatusBadge } from "@/components/common/status-badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { comptesApi, type EvenementConnexion } from "@/lib/api"
import { LIBELLES_EVENEMENTS, libelleEvenement, navigateurCourt, tonEvenement } from "@/lib/comptes"
import { formatDate } from "@/lib/format"

const LIMIT = 50
const TOUS = "tous"

/** Journal des connexions et des opérations de compte (super_admin), du plus récent au plus ancien. */
export default function ConnexionsJournal() {
  const [type, setType] = useState(TOUS)
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<EvenementConnexion[] | null>(null)
  const [total, setTotal] = useState(0)
  const [erreur, setErreur] = useState<string | null>(null)
  const derniere = useRef(0)

  // Aucun état modifié avant la réponse : l'indicateur de chargement est remis par les gestionnaires (filtre, page)
  const charger = useCallback(async () => {
    const requete = ++derniere.current
    try {
      const resultat = await comptesApi.journal(page, LIMIT, { type: type === TOUS ? undefined : type })
      if (requete !== derniere.current) return
      setErreur(null)
      setItems(resultat.data)
      setTotal(resultat.total)
    } catch (err) {
      if (requete === derniere.current) setErreur(errorText(err, "Journal indisponible"))
    }
  }, [page, type])

  useEffect(() => { charger() }, [charger])

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Journal des connexions</CardTitle>
          <CardDescription>Connexions, échecs, activations, réinitialisations et envois de liens.</CardDescription>
        </div>
        <Select value={type} onValueChange={(v) => { setItems(null); setType(v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-64" aria-label="Filtrer par type d'événement"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TOUS}>Tous les événements</SelectItem>
            {Object.entries(LIBELLES_EVENEMENTS).map(([valeur, libelle]) => (
              <SelectItem key={valeur} value={valeur}>{libelle}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {erreur ? (
          <ErrorState message={erreur} onRetry={() => { setErreur(null); setItems(null); charger() }} />
        ) : !items ? (
          <LoadingState />
        ) : items.length === 0 ? (
          <EmptyState message={type === TOUS ? "Aucun événement enregistré." : "Aucun événement de ce type."} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Événement</TableHead>
                  <TableHead>Compte</TableHead>
                  <TableHead className="hidden md:table-cell">Adresse IP</TableHead>
                  <TableHead className="hidden lg:table-cell">Navigateur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap text-sm">{formatDate(e.created_at, true)}</TableCell>
                    <TableCell><StatusBadge tone={tonEvenement(e.type)}>{libelleEvenement(e.type)}</StatusBadge></TableCell>
                    <TableCell className="font-mono text-sm">
                      {e.username ?? (e.user_id ? "compte supprimé" : <span className="font-sans text-muted-foreground">identifiant inconnu</span>)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs">{e.ip_address ?? "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm" title={e.user_agent ?? undefined}>
                      {navigateurCourt(e.user_agent)}
                    </TableCell>
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
