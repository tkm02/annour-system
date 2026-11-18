"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

import { EmptyState, ErrorState, LoadingState, errorText } from "@/components/common/states"
import ConsultationModal from "@/components/health/consultation-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { santeApi, type Consultation } from "@/lib/api"
import { formatDate } from "@/lib/format"

/** Les 5 consultations les plus récentes (GET /sante/consultations). */
export default function RecentConsultations() {
  const [items, setItems] = useState<Consultation[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setItems((await santeApi.getConsultations({ limit: 5 })).data)
    } catch (err) {
      setError(errorText(err, "Consultations indisponibles"))
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Consultations récentes</CardTitle>
        <Button asChild variant="ghost" size="sm"><Link href="/sante/consultations">Tout voir</Link></Button>
      </CardHeader>
      <CardContent>
        {error ? <ErrorState message={error} onRetry={load} /> : !items ? <LoadingState /> : items.length === 0 ? (
          <EmptyState message="Aucune consultation pour le moment." />
        ) : (
          <ul className="divide-y">
            {items.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => setSelected(c.id)}
                  className="w-full text-left py-3 hover:bg-muted/50 rounded-md px-2 focus-visible:outline focus-visible:outline-2">
                  <p className="font-medium">{c.patient_nom_prenoms ?? c.matricule}</p>
                  <p className="text-sm text-muted-foreground truncate">{c.motif_consultation}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(c.date_consultation, true)} — {c.medecin_responsable ?? "—"}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <ConsultationModal consultationId={selected} onClose={() => setSelected(null)} onChanged={load} />
    </Card>
  )
}
