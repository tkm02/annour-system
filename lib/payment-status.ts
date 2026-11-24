// Statut de paiement d'une inscription (F-A1) : libellé et style du badge.
export interface PaymentStatusInfo {
  label: string
  className: string
}

export const PAYMENT_STATUS: Record<string, PaymentStatusInfo> = {
  en_attente: { label: "En attente", className: "bg-orange-100 text-orange-800 border-orange-300" },
  verifie: { label: "Vérifié", className: "bg-green-600 text-white border-green-700" },
  rejete: { label: "Rejeté", className: "bg-red-100 text-red-800 border-red-300" },
  erreur: { label: "Erreur de vérification", className: "bg-gray-200 text-gray-800 border-gray-400" },
  completed: { label: "Vérifié (historique)", className: "bg-green-100 text-green-800 border-green-300" },
  // Valeur renvoyée par GET /registrations/{m}/paiement pour les inscriptions historiques
  verifie_historique: { label: "Vérifié (historique)", className: "bg-green-100 text-green-800 border-green-300" },
}

export const PAYMENT_STATUS_FILTERS = ["en_attente", "verifie", "rejete", "erreur", "completed"] as const

export function paymentStatusInfo(status: string | null | undefined): PaymentStatusInfo {
  if (!status) return { label: "Inconnu", className: "bg-muted text-muted-foreground" }
  return PAYMENT_STATUS[status] ?? { label: status, className: "bg-muted text-muted-foreground" }
}

export const isPaymentVerified = (status: string | null | undefined) =>
  status === "verifie" || status === "completed" || status === "verifie_historique"
