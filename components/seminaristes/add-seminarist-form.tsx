"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import QRCode from "qrcode"
import { toast } from "sonner"
import { AlertCircle, CheckCircle2, Clock, Download, FileImage, Loader2, Plus, RefreshCw, XCircle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  ApiError, registrationsApi, scientificApi,
  type Dortoir, type FieldErrors, type ReceiptResult, type RegistrationCreated, type RegistrationsStatus,
  type StaticMetadata,
} from "@/lib/api"
import PDFGenerator, { type SeminaristData } from "@/lib/pdf-generator"
import {
  RECEIPT_ACCEPT_ATTRIBUTE, RECEIPT_BAD_FORMAT, ReceiptFileError, checkReceiptFile, prepareReceiptImage,
} from "@/lib/receipt-image"
import {
  COMMUNE_AUTRE, EMPTY_REGISTRATION_FORM, buildRegistrationPayload, computeAge, mapServerFieldErrors,
  validateRegistrationForm, type RegistrationFormValues,
} from "@/lib/registration"

type Mode = "public" | "admin"
type PreparedReceipt = { blob: Blob; filename: string }
type Registration = Omit<RegistrationCreated, "verification_token">

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} Mo` : `${Math.max(1, Math.round(bytes / 1024))} Ko`

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="text-sm text-destructive">
      {message}
    </p>
  )
}

export default function AddSeminaristForm({ mode = "admin" }: { mode?: Mode }) {
  const [values, setValues] = useState<RegistrationFormValues>(EMPTY_REGISTRATION_FORM)
  const [errors, setErrors] = useState<FieldErrors>({})

  const [status, setStatus] = useState<RegistrationsStatus | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<StaticMetadata | null>(null)
  const [metadataError, setMetadataError] = useState<string | null>(null)

  const [dortoirs, setDortoirs] = useState<Dortoir[]>([])
  const [dortoirsLoading, setDortoirsLoading] = useState(false)
  const [dortoirsError, setDortoirsError] = useState<string | null>(null)

  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Après création : l'inscription existe en base, seuls des reçus sont renvoyés (jamais de nouvelle création)
  const [registration, setRegistration] = useState<Registration | null>(null)
  const [receiptResult, setReceiptResult] = useState<ReceiptResult | null>(null)
  const [receiptError, setReceiptError] = useState<string | null>(null)
  const [sendingReceipt, setSendingReceipt] = useState(false)
  const [pdfDownloaded, setPdfDownloaded] = useState(false)

  // Jeton d'envoi du reçu : en mémoire de la page uniquement (jamais d'état persistant, de log ni d'impression)
  const tokenRef = useRef<string | null>(null)
  // Dernier reçu préparé (image seulement, aucune donnée secrète) : réutilisé par « Réessayer »
  const [preparedReceipt, setPreparedReceipt] = useState<PreparedReceipt | null>(null)
  const newReceiptInputRef = useRef<HTMLInputElement>(null)

  const loadStatus = useCallback(async () => {
    setStatusError(null)
    try {
      setStatus(await registrationsApi.getStatus())
    } catch (error) {
      setStatusError(errorMessage(error, "Impossible de vérifier l'ouverture des inscriptions."))
    }
  }, [])

  const loadMetadata = useCallback(async () => {
    setMetadataError(null)
    try {
      setMetadata(await scientificApi.getStaticMetadata())
    } catch (error) {
      setMetadataError(errorMessage(error, "Impossible de charger les communes et niveaux."))
    }
  }, [])

  const loadDortoirs = useCallback(async (sexe: "M" | "F") => {
    setDortoirsLoading(true)
    setDortoirsError(null)
    try {
      const list = await registrationsApi.getDortoirs(sexe)
      setDortoirs(list.filter((d) => d.available > 0))
    } catch (error) {
      setDortoirs([])
      setDortoirsError(errorMessage(error, "Impossible de charger les dortoirs."))
    } finally {
      setDortoirsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()
    loadMetadata()
  }, [loadStatus, loadMetadata])

  useEffect(() => {
    if (values.sexe === "M" || values.sexe === "F") loadDortoirs(values.sexe)
    else setDortoirs([])
  }, [values.sexe, loadDortoirs])

  // Avertir avant de quitter tant que le matricule n'a pas été récupéré (fiche PDF)
  useEffect(() => {
    if (!registration || pdfDownloaded) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [registration, pdfDownloaded])

  const setField = <K extends keyof RegistrationFormValues>(field: K, value: RegistrationFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      if (!prev[field] && !prev._form) return prev
      const next = { ...prev }
      delete next[field]
      delete next._form
      return next
    })
  }

  const handleSexeChange = (sexe: "M" | "F") => {
    setValues((prev) => ({ ...prev, sexe, dortoirId: "", dortoirNom: "" }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next.sexe
      delete next.dortoirId
      return next
    })
  }

  const handleDortoirChange = (code: string) => {
    const dortoir = dortoirs.find((d) => d.code === code)
    setValues((prev) => ({ ...prev, dortoirId: code, dortoirNom: dortoir?.name ?? "" }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next.dortoirId
      return next
    })
  }

  const handleReceiptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setErrors((prev) => {
      const next = { ...prev }
      delete next.receipt
      return next
    })
    if (file && checkReceiptFile(file) === "format" && !file.type.startsWith("image/")) {
      setReceiptFile(null)
      event.target.value = ""
      setErrors((prev) => ({ ...prev, receipt: RECEIPT_BAD_FORMAT }))
      return
    }
    setReceiptFile(file)
  }

  const generatePdf = async (reg: Registration, paymentStatus: string) => {
    try {
      const data: SeminaristData = {
        matricule: reg.matricule,
        paymentStatus,
        personalInfo: {
          nom: reg.nom,
          prenom: reg.prenom,
          sexe: reg.sexe,
          age: reg.age,
          communeHabitation: reg.commune_habitation,
          niveauAcademique: reg.niveau_academique,
        },
        dormitoryInfo: { dortoir: reg.dortoir_name || values.dortoirNom || reg.dortoir_code, matricule: reg.matricule },
        healthInfo: {
          allergie: reg.allergie || "RAS",
          antecedentMedical: reg.antecedent_medical || "Néant",
        },
      }
      // Le QR code ne contient que le matricule (lu par la PWA pour joindre la photo)
      const qrCodeUrl = await QRCode.toDataURL(reg.matricule)
      await PDFGenerator.generateRegistrationPDF(data, qrCodeUrl)
      setPdfDownloaded(true)
    } catch {
      toast.error("La fiche PDF n'a pas pu être générée. Notez le matricule affiché et réessayez.")
    }
  }

  const sendReceipt = async (reg: Registration, prepared: PreparedReceipt) => {
    const token = tokenRef.current
    if (!token) return
    setSendingReceipt(true)
    setReceiptError(null)
    try {
      const result = await registrationsApi.submitReceipt(reg.matricule, token, prepared.blob, prepared.filename)
      setReceiptResult(result)
      if (result.statut === "verifie") {
        tokenRef.current = null
        toast.success("Inscription et paiement validés")
        await generatePdf(reg, "verifie")
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 409 && /déjà vérifié/i.test(error.message)) {
        tokenRef.current = null
        setReceiptResult({ matricule: reg.matricule, statut: "verifie", message: error.message })
        return
      }
      setReceiptError(errorMessage(error, "L'envoi du reçu a échoué."))
    } finally {
      setSendingReceipt(false)
    }
  }

  const handleCreateError = (error: unknown) => {
    if (error instanceof ApiError) {
      if (error.status === 422 && Object.keys(error.fieldErrors).length > 0) {
        setErrors(mapServerFieldErrors(error.fieldErrors))
        toast.error("Certains champs sont invalides")
        return
      }
      if (error.status === 409 && /complet/i.test(error.message) && (values.sexe === "M" || values.sexe === "F")) {
        setValues((prev) => ({ ...prev, dortoirId: "", dortoirNom: "" }))
        setErrors({ dortoirId: error.message })
        loadDortoirs(values.sexe)
        toast.error(error.message)
        return
      }
      if (error.status === 409 && /transaction/i.test(error.message)) {
        setErrors({ transactionId: error.message })
        toast.error(error.message)
        return
      }
      if (error.status === 403) loadStatus()
    }
    const message = errorMessage(error, "L'inscription a échoué.")
    setErrors({ _form: message })
    toast.error(message)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting) return

    const localErrors = validateRegistrationForm(values)
    if (!receiptFile) localErrors.receipt = "Reçu de paiement obligatoire"
    if (Object.keys(localErrors).length > 0) {
      setErrors(localErrors)
      toast.error("Veuillez corriger les champs signalés")
      return
    }

    setSubmitting(true)
    setErrors({})
    try {
      // 1. Préparer l'image avant toute création (évite une inscription sans reçu envoyable)
      let prepared: PreparedReceipt
      try {
        prepared = await prepareReceiptImage(receiptFile as File)
      } catch (error) {
        setErrors({ receipt: errorMessage(error, RECEIPT_BAD_FORMAT) })
        return
      }
      setPreparedReceipt(prepared)

      // 2. Créer l'inscription (une seule fois)
      const created = await registrationsApi.create(buildRegistrationPayload(values, status?.fee ?? 0))
      const { verification_token, ...reg } = created
      tokenRef.current = verification_token
      setRegistration(reg)
      setReceiptResult(null)
      setPdfDownloaded(false)

      // 3. Envoyer le reçu, enchaîné automatiquement
      await sendReceipt(reg, prepared)
    } catch (error) {
      handleCreateError(error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleNewReceipt = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || !registration) return
    try {
      const prepared = await prepareReceiptImage(file)
      setPreparedReceipt(prepared)
      await sendReceipt(registration, prepared)
    } catch (error) {
      setReceiptError(error instanceof ReceiptFileError ? error.message : errorMessage(error, "Reçu invalide."))
    }
  }

  const retryReceipt = () => {
    if (registration && preparedReceipt) sendReceipt(registration, preparedReceipt)
  }

  const resetAll = () => {
    tokenRef.current = null
    setPreparedReceipt(null)
    setValues(EMPTY_REGISTRATION_FORM)
    setErrors({})
    setReceiptFile(null)
    setRegistration(null)
    setReceiptResult(null)
    setReceiptError(null)
    setPdfDownloaded(false)
    loadStatus()
  }

  // ===================== Rendus =====================

  if (mode === "public" && !status) {
    return (
      <Card className="border-border">
        <CardContent className="py-12 text-center space-y-4">
          {statusError ? (
            <>
              <p className="text-destructive">{statusError}</p>
              <Button variant="outline" onClick={loadStatus} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Réessayer
              </Button>
            </>
          ) : (
            <p className="text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  if (mode === "public" && status && !status.open && !registration) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-secondary">Inscriptions closes</CardTitle>
          <CardDescription>
            Les inscriptions pour cette édition du séminaire sont terminées. Pour toute question, contactez
            l&apos;organisation.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (registration) {
    const statut = receiptResult?.statut ?? registration.payment_status
    const verified = statut === "verifie"
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-secondary">Inscription enregistrée</CardTitle>
          <CardDescription>
            Matricule : <span className="font-mono font-semibold text-foreground">{registration.matricule}</span>
            {" — "}
            {registration.prenom} {registration.nom}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6" aria-live="polite">
          {sendingReceipt ? (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Vérification du reçu en cours…</AlertTitle>
              <AlertDescription>Cela peut prendre quelques secondes.</AlertDescription>
            </Alert>
          ) : verified ? (
            <Alert className="border-green-600 text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Inscription et paiement validés</AlertTitle>
              <AlertDescription>{receiptResult?.message ?? "Paiement vérifié."}</AlertDescription>
            </Alert>
          ) : receiptError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Le reçu n&apos;a pas pu être traité</AlertTitle>
              <AlertDescription>{receiptError}</AlertDescription>
            </Alert>
          ) : statut === "rejete" ? (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Reçu rejeté</AlertTitle>
              <AlertDescription>{receiptResult?.message ?? "Le reçu n'a pas été accepté."}</AlertDescription>
            </Alert>
          ) : statut === "erreur" ? (
            <Alert className="border-amber-600 text-amber-700">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Vérification momentanément impossible</AlertTitle>
              <AlertDescription>{receiptResult?.message ?? "Veuillez réessayer dans un instant."}</AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-amber-600 text-amber-700">
              <Clock className="h-4 w-4" />
              <AlertTitle>Paiement en attente de vérification</AlertTitle>
              <AlertDescription>Votre inscription est enregistrée ; le paiement reste à vérifier.</AlertDescription>
            </Alert>
          )}

          {!verified && !sendingReceipt && (
            <p className="text-sm text-muted-foreground">
              Votre inscription est déjà enregistrée : renvoyez seulement un reçu, ne refaites pas l&apos;inscription.
              Si vous quittez cette page, le paiement sera vérifié manuellement par l&apos;équipe Finances.
            </p>
          )}

          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            {!verified && (
              <>
                <input
                  ref={newReceiptInputRef}
                  type="file"
                  accept={RECEIPT_ACCEPT_ATTRIBUTE}
                  className="sr-only"
                  aria-label="Joindre un autre reçu"
                  onChange={handleNewReceipt}
                />
                <Button
                  type="button"
                  className="gap-2"
                  disabled={sendingReceipt}
                  onClick={() => newReceiptInputRef.current?.click()}
                >
                  <FileImage className="h-4 w-4" /> Joindre un autre reçu
                </Button>
                {(statut === "erreur" || receiptError) && preparedReceipt && (
                  <Button type="button" variant="outline" className="gap-2" disabled={sendingReceipt} onClick={retryReceipt}>
                    <RefreshCw className="h-4 w-4" /> Réessayer
                  </Button>
                )}
              </>
            )}
            <Button
              type="button"
              variant={verified ? "default" : "outline"}
              className="gap-2"
              disabled={sendingReceipt}
              onClick={() => generatePdf(registration, statut)}
            >
              <Download className="h-4 w-4" /> Télécharger la fiche d&apos;inscription (PDF)
            </Button>
            <Button type="button" variant="outline" className="gap-2 sm:ml-auto" disabled={sendingReceipt} onClick={resetAll}>
              <Plus className="h-4 w-4" /> Nouvelle inscription
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const age = computeAge(values.dateNaissance)
  const inputProps = (field: keyof RegistrationFormValues | "receipt") => ({
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `${field}-error` : undefined,
  })

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-secondary">
          {mode === "public" ? "INSCRIPTION AU SÉMINAIRE" : "AJOUT DE SÉMINARISTE"}
        </CardTitle>
        <CardDescription>
          Frais d&apos;inscription{status ? ` : ${status.fee.toLocaleString("fr-FR")} F` : ""}, payés par Wave au
          compte AN-NOUR. Joignez la capture du reçu Wave : il est vérifié automatiquement.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {mode === "admin" && status && !status.open && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Inscriptions publiques closes</AlertTitle>
            <AlertDescription>Inscription tardive réservée à l&apos;administration.</AlertDescription>
          </Alert>
        )}
        {metadataError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex flex-wrap items-center gap-3">
              {metadataError}
              <Button type="button" size="sm" variant="outline" onClick={loadMetadata}>Réessayer</Button>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8" noValidate>
          {/* Informations générales */}
          <fieldset className="space-y-4" disabled={submitting}>
            <legend className="w-full font-semibold text-foreground border-b border-border pb-2">Informations générales</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input id="nom" value={values.nom} maxLength={100} autoComplete="family-name"
                  onChange={(e) => setField("nom", e.target.value)} {...inputProps("nom")} />
                <FieldError id="nom-error" message={errors.nom} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prenom">Prénoms *</Label>
                <Input id="prenom" value={values.prenom} maxLength={100} autoComplete="given-name"
                  onChange={(e) => setField("prenom", e.target.value)} {...inputProps("prenom")} />
                <FieldError id="prenom-error" message={errors.prenom} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateNaissance">Date de naissance *</Label>
                <Input id="dateNaissance" type="date" value={values.dateNaissance}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setField("dateNaissance", e.target.value)} {...inputProps("dateNaissance")} />
                {age !== null && age >= 0 && !errors.dateNaissance && (
                  <p className="text-sm text-muted-foreground">{age} ans</p>
                )}
                <FieldError id="dateNaissance-error" message={errors.dateNaissance} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sexe">Sexe *</Label>
                <Select value={values.sexe} onValueChange={(v) => handleSexeChange(v as "M" | "F")}>
                  <SelectTrigger id="sexe" {...inputProps("sexe")}>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculin</SelectItem>
                    <SelectItem value="F">Féminin</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError id="sexe-error" message={errors.sexe} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="communeHabitation">Commune *</Label>
                <Select value={values.communeHabitation} onValueChange={(v) => setField("communeHabitation", v)}>
                  <SelectTrigger id="communeHabitation" {...inputProps("communeHabitation")}>
                    <SelectValue placeholder={metadata ? "Sélectionner" : "Chargement…"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(metadata?.communes ?? []).map((commune) => (
                      <SelectItem key={commune} value={commune}>{commune}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError id="communeHabitation-error" message={errors.communeHabitation} />
              </div>
              {values.communeHabitation === COMMUNE_AUTRE && (
                <div className="space-y-2">
                  <Label htmlFor="communeAutre">Préciser la commune *</Label>
                  <Input id="communeAutre" value={values.communeAutre} maxLength={100}
                    onChange={(e) => setField("communeAutre", e.target.value)} {...inputProps("communeAutre")} />
                  <FieldError id="communeAutre-error" message={errors.communeAutre} />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="niveauAcademique">Niveau d&apos;étude *</Label>
                <Select value={values.niveauAcademique} onValueChange={(v) => setField("niveauAcademique", v)}>
                  <SelectTrigger id="niveauAcademique" {...inputProps("niveauAcademique")}>
                    <SelectValue placeholder={metadata ? "Sélectionner" : "Chargement…"} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(metadata?.niveaux_academiques ?? {}).map(([categorie, niveaux]) => (
                      <SelectGroup key={categorie}>
                        <SelectLabel>{categorie}</SelectLabel>
                        {niveaux.map((niveau) => (
                          <SelectItem key={niveau} value={niveau}>{niveau}</SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError id="niveauAcademique-error" message={errors.niveauAcademique} />
              </div>
            </div>
          </fieldset>

          {/* Coordonnées */}
          <fieldset className="space-y-4" disabled={submitting}>
            <legend className="w-full font-semibold text-foreground border-b border-border pb-2">Coordonnées</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactParent">Contact d&apos;un parent *</Label>
                <Input id="contactParent" type="tel" inputMode="tel" value={values.contactParent} maxLength={30}
                  placeholder="01 02 03 04 05" autoComplete="tel"
                  onChange={(e) => setField("contactParent", e.target.value)} {...inputProps("contactParent")} />
                <FieldError id="contactParent-error" message={errors.contactParent} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactSeminariste">Contact du séminariste</Label>
                <Input id="contactSeminariste" type="tel" inputMode="tel" value={values.contactSeminariste} maxLength={30}
                  placeholder="Facultatif"
                  onChange={(e) => setField("contactSeminariste", e.target.value)} {...inputProps("contactSeminariste")} />
                <FieldError id="contactSeminariste-error" message={errors.contactSeminariste} />
              </div>
            </div>
          </fieldset>

          {/* Dortoir */}
          <fieldset className="space-y-4" disabled={submitting}>
            <legend className="w-full font-semibold text-foreground border-b border-border pb-2">Dortoir</legend>
            <div className="space-y-2 md:w-1/2">
              <Label htmlFor="dortoirId">Dortoir *</Label>
              <Select
                value={values.dortoirId}
                onValueChange={handleDortoirChange}
                disabled={!values.sexe || dortoirsLoading || dortoirs.length === 0}
              >
                <SelectTrigger id="dortoirId" {...inputProps("dortoirId")}>
                  <SelectValue
                    placeholder={
                      !values.sexe ? "Choisir d'abord le sexe"
                        : dortoirsLoading ? "Chargement…"
                          : dortoirs.length === 0 && !dortoirsError ? "Aucune place disponible"
                            : "Sélectionner"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {dortoirs.map((d) => (
                    <SelectItem key={d.code} value={d.code}>
                      {d.name} — {d.available} place{d.available > 1 ? "s" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {dortoirsError && (
                <p className="text-sm text-destructive flex flex-wrap items-center gap-2">
                  {dortoirsError}
                  <Button type="button" size="sm" variant="outline"
                    onClick={() => (values.sexe === "M" || values.sexe === "F") && loadDortoirs(values.sexe)}>
                    Réessayer
                  </Button>
                </p>
              )}
              <FieldError id="dortoirId-error" message={errors.dortoirId} />
            </div>
          </fieldset>

          {/* Informations médicales */}
          <fieldset className="space-y-4" disabled={submitting}>
            <legend className="w-full font-semibold text-foreground border-b border-border pb-2">Informations médicales</legend>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="antecedentMedical">Antécédents médicaux</Label>
                <Textarea id="antecedentMedical" value={values.antecedentMedical} maxLength={2000} rows={3}
                  placeholder="Laisser vide si aucun"
                  onChange={(e) => setField("antecedentMedical", e.target.value)} {...inputProps("antecedentMedical")} />
                <FieldError id="antecedentMedical-error" message={errors.antecedentMedical} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="allergie">Allergies</Label>
                <Textarea id="allergie" value={values.allergie} maxLength={2000} rows={3}
                  placeholder="Laisser vide si aucune"
                  onChange={(e) => setField("allergie", e.target.value)} {...inputProps("allergie")} />
                <FieldError id="allergie-error" message={errors.allergie} />
              </div>
            </div>
          </fieldset>

          {/* Paiement */}
          <fieldset className="space-y-4" disabled={submitting}>
            <legend className="w-full font-semibold text-foreground border-b border-border pb-2">Paiement</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transactionId">ID de transaction Wave *</Label>
                <Input id="transactionId" value={values.transactionId} maxLength={100} autoComplete="off"
                  placeholder="Ex. TV4FVURZFR0PGF3MQ"
                  onChange={(e) => setField("transactionId", e.target.value)} {...inputProps("transactionId")} />
                <FieldError id="transactionId-error" message={errors.transactionId} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receipt">Reçu de paiement (capture Wave) *</Label>
                <Input id="receipt" type="file" accept={RECEIPT_ACCEPT_ATTRIBUTE}
                  onChange={handleReceiptChange} {...inputProps("receipt")} />
                <p className="text-sm text-muted-foreground">
                  {receiptFile
                    ? `${receiptFile.name} (${formatSize(receiptFile.size)})${checkReceiptFile(receiptFile) !== "ok" ? " — sera compressée avant l'envoi" : ""}`
                    : "JPEG, PNG ou WEBP, 5 Mo maximum."}
                </p>
                <FieldError id="receipt-error" message={errors.receipt} />
              </div>
            </div>
          </fieldset>

          {errors._form && (
            <Alert variant="destructive" role="alert">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-line">{errors._form}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2 sm:justify-end">
            {mode === "admin" && (
              <Button type="button" variant="outline" asChild>
                <Link href="/seminaristes">ANNULER</Link>
              </Button>
            )}
            <Button type="submit" className="bg-primary hover:bg-primary/90 gap-2" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Envoi en cours…" : mode === "public" ? "S'INSCRIRE" : "AJOUTER LE SÉMINARISTE"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
