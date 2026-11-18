"use client"

import type React from "react"
import { useCallback, useEffect, useState } from "react"
import { CheckCircle2, Eye, Loader2, Search } from "lucide-react"
import { toast } from "react-hot-toast"

import Pager from "@/components/common/pager"
import { EmptyState, ErrorState, LoadingState, errorText } from "@/components/common/states"
import PaymentStatusBadge from "@/components/finance/payment-status-badge"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  ApiError, paymentsApi, type PaiementListItem, type PaymentDecision, type PaymentDetail,
} from "@/lib/api"
import { MOTIF_MAX, validateDecision } from "@/lib/finance-forms"
import { formatDate } from "@/lib/format"
import { isPaymentVerified, paymentStatusInfo } from "@/lib/payment-status"

const LIMIT = 20
const STATUT_OPTIONS = [
  { value: "a_traiter", label: "À traiter (en attente, rejetés, erreurs)" },
  { value: "en_attente", label: "En attente" },
  { value: "rejete", label: "Rejetés" },
  { value: "erreur", label: "Erreurs de vérification" },
  { value: "verifie", label: "Vérifiés" },
  { value: "completed", label: "Vérifiés (historique)" },
]


function DecisionPanel({ detail, onDone }: { detail: PaymentDetail; onDone: () => void }) {
  const [decision, setDecision] = useState<"verifie" | "rejete">("verifie")
  const [transactionId, setTransactionId] = useState(detail.transaction_id ?? "")
  const [motif, setMotif] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)

  const payload: PaymentDecision = {
    decision,
    motif: motif.trim(),
    ...(decision === "verifie" ? { transaction_id: transactionId.trim() } : {}),
  }

  const askConfirmation = (event: React.FormEvent) => {
    event.preventDefault()
    const problem = validateDecision(payload)
    setError(problem)
    if (!problem) setConfirming(true)
  }

  const submit = async () => {
    setSaving(true)
    try {
      const result = await paymentsApi.decide(detail.matricule, payload)
      toast.success(result.message || "Décision enregistrée")
      setConfirming(false)
      onDone()
    } catch (err) {
      setConfirming(false)
      setError(errorText(err, "La décision n'a pas pu être enregistrée"))
      if (err instanceof ApiError && err.status === 409) onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={askConfirmation} className="space-y-4 border-t pt-4" noValidate>
      <h3 className="font-semibold">Décision manuelle</h3>
      <RadioGroup value={decision} onValueChange={(v) => setDecision(v as "verifie" | "rejete")} className="flex gap-6">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="verifie" id="decision-verifie" />
          <Label htmlFor="decision-verifie">Valider le paiement</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="rejete" id="decision-rejete" />
          <Label htmlFor="decision-rejete">Rejeter</Label>
        </div>
      </RadioGroup>
      {decision === "verifie" && (
        <div className="space-y-2">
          <Label htmlFor="decision-transaction">ID de transaction Wave (contrôlé sur le relevé) *</Label>
          <Input id="decision-transaction" value={transactionId} maxLength={100}
            onChange={(e) => setTransactionId(e.target.value)} />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="decision-motif">Motif *</Label>
        <Textarea id="decision-motif" value={motif} maxLength={MOTIF_MAX} rows={3}
          placeholder="Ex. Relevé Wave contrôlé le 27/10" onChange={(e) => setMotif(e.target.value)} />
        <p className="text-xs text-muted-foreground">{motif.trim().length}/{MOTIF_MAX}</p>
      </div>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" variant={decision === "verifie" ? "default" : "destructive"} disabled={saving}>
          {decision === "verifie" ? "Valider le paiement" : "Rejeter le paiement"}
        </Button>
      </div>

      <AlertDialog open={confirming} onOpenChange={(open) => !saving && setConfirming(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {decision === "verifie" ? "Confirmer la validation du paiement ?" : "Confirmer le rejet du paiement ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {decision === "verifie"
                ? `Inscription ${detail.matricule}, transaction ${payload.transaction_id}. Cette action est irréversible : elle crée l'entrée financière de l'inscription.`
                : `Inscription ${detail.matricule}. Le rejet sera tracé avec votre motif.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); submit() }} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}

function PaymentDetailDialog({ matricule, onClose, onChanged }: {
  matricule: string | null
  onClose: () => void
  onChanged: () => void
}) {
  const [detail, setDetail] = useState<PaymentDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!matricule) return
    setDetail(null)
    setError(null)
    try {
      setDetail(await paymentsApi.get(matricule))
    } catch (err) {
      setError(errorText(err, "Détail du paiement indisponible"))
    }
  }, [matricule])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Dialog open={!!matricule} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Paiement — {matricule}</DialogTitle>
          <DialogDescription>État du paiement et historique des vérifications (la plus récente en premier).</DialogDescription>
        </DialogHeader>
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !detail ? (
          <LoadingState />
        ) : (
          <div className="space-y-4">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><dt className="text-muted-foreground">Statut</dt><dd><PaymentStatusBadge status={detail.statut} /></dd></div>
              <div><dt className="text-muted-foreground">Transaction</dt><dd className="font-mono">{detail.transaction_id ?? "—"}</dd></div>
              <div className="sm:col-span-2"><dt className="text-muted-foreground">Dernier message</dt><dd>{detail.message ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">Méthode</dt><dd>{detail.methode ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">Vérifié par / le</dt><dd>{detail.verified_by ?? "—"} {detail.verified_at ? `— ${formatDate(detail.verified_at, true)}` : ""}</dd></div>
            </dl>

            <div>
              <h3 className="font-semibold mb-2">Historique</h3>
              {detail.historique.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune tentative enregistrée.</p>
              ) : (
                <ul className="space-y-2">
                  {detail.historique.map((h) => (
                    <li key={h.id} className="rounded-md border p-3 text-sm space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <PaymentStatusBadge status={h.statut} />
                        <span className="text-muted-foreground">{formatDate(h.created_at, true)}</span>
                        <span>— {h.methode === "manuel" ? `manuel (${h.verified_by})` : "lecture automatique du reçu"}</span>
                      </div>
                      {h.transaction_id && <p>Transaction : <span className="font-mono">{h.transaction_id}</span></p>}
                      {h.motif && <p>Motif : {h.motif}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {isPaymentVerified(detail.statut) ? (
              <p className="text-sm text-green-700 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Paiement déjà vérifié : aucune décision possible.
              </p>
            ) : (
              <DecisionPanel detail={detail} onDone={() => { onChanged(); load() }} />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function PaymentsManager() {
  const [statut, setStatut] = useState("a_traiter")
  const [search, setSearch] = useState("")
  const [appliedSearch, setAppliedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<PaiementListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await paymentsApi.list({
        statut: statut === "a_traiter" ? undefined : statut,
        search: appliedSearch || undefined,
        page,
        limit: LIMIT,
      })
      setItems(res.data)
      setTotal(res.total)
    } catch (err) {
      setError(errorText(err, "Liste des paiements indisponible"))
    } finally {
      setLoading(false)
    }
  }, [statut, appliedSearch, page])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Card>
      <CardHeader className="space-y-4">
        <CardTitle>Paiements des inscriptions</CardTitle>
        <form
          className="flex flex-col md:flex-row gap-3"
          onSubmit={(e) => { e.preventDefault(); setPage(1); setAppliedSearch(search.trim()) }}
          role="search"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input className="pl-9" placeholder="Nom, prénom, matricule ou transaction" value={search}
              aria-label="Rechercher" onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statut} onValueChange={(v) => { setStatut(v); setPage(1) }}>
            <SelectTrigger className="md:w-72" aria-label="Filtrer par statut"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button type="submit" variant="outline">Rechercher</Button>
        </form>
      </CardHeader>
      <CardContent>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : items.length === 0 ? (
          <EmptyState message="Aucune inscription pour ce filtre." />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Nom et prénoms</TableHead>
                  <TableHead className="hidden md:table-cell">Dortoir</TableHead>
                  <TableHead className="hidden md:table-cell">Transaction</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="hidden lg:table-cell">Inscription</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.matricule}>
                    <TableCell className="font-mono text-xs">{item.matricule}</TableCell>
                    <TableCell>{item.nom} {item.prenom}</TableCell>
                    <TableCell className="hidden md:table-cell">{item.dortoir_name ?? item.dortoir_code}</TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs">{item.transaction_id ?? "—"}</TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={item.payment_status} />
                      {item.payment_message && !isPaymentVerified(item.payment_status) && (
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs">{item.payment_message}</p>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{formatDate(item.registration_date)}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => setSelected(item.matricule)}
                        aria-label={`Traiter le paiement de ${item.matricule} (${paymentStatusInfo(item.payment_status).label})`}>
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        {isPaymentVerified(item.payment_status) ? "Voir" : "Traiter"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <Pager page={page} limit={LIMIT} total={total} onPageChange={setPage} disabled={loading} />
      </CardContent>

      <PaymentDetailDialog matricule={selected} onClose={() => setSelected(null)} onChanged={load} />
    </Card>
  )
}
