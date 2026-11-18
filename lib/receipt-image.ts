// Reçu de paiement : contrôle avant envoi (JPEG/PNG/WEBP, 5 Mo max) et compression si nécessaire.
// Le serveur revérifie le contenu réel de l'image ; ce contrôle évite seulement un envoi inutile.

export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024
export const ACCEPTED_RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
export const RECEIPT_ACCEPT_ATTRIBUTE = ACCEPTED_RECEIPT_TYPES.join(",")
const COMPRESSED_MAX_WIDTH = 1600
const COMPRESSED_QUALITY = 0.8

export class ReceiptFileError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ReceiptFileError"
  }
}

export const RECEIPT_TOO_LARGE = "Image trop lourde (5 Mo maximum)"
export const RECEIPT_BAD_FORMAT = "Format non accepté : choisir une image JPEG, PNG ou WEBP"

export type ReceiptCheck = "ok" | "format" | "size"

/** Contrôle simple sans décodage : format déclaré et taille. */
export function checkReceiptFile(file: { type: string; size: number }): ReceiptCheck {
  if (!(ACCEPTED_RECEIPT_TYPES as readonly string[]).includes(file.type)) return "format"
  if (file.size > MAX_RECEIPT_BYTES) return "size"
  return "ok"
}

async function compressImage(file: File): Promise<Blob> {
  if (typeof document === "undefined" || typeof createImageBitmap === "undefined") {
    throw new ReceiptFileError(RECEIPT_TOO_LARGE)
  }
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new ReceiptFileError(RECEIPT_BAD_FORMAT)
  }
  const scale = Math.min(1, COMPRESSED_MAX_WIDTH / bitmap.width)
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext("2d")
  if (!context) throw new ReceiptFileError(RECEIPT_TOO_LARGE)
  context.fillStyle = "#ffffff" // fond blanc pour les PNG transparents convertis en JPEG
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", COMPRESSED_QUALITY))
  if (!blob) throw new ReceiptFileError(RECEIPT_TOO_LARGE)
  return blob
}

/**
 * Image prête à l'envoi. Un fichier conforme est envoyé tel quel (meilleure lecture OCR) ;
 * un fichier trop lourd ou d'un autre format d'image lisible par le navigateur est converti en JPEG
 * (1 600 px de large, qualité 0,8). Lève ReceiptFileError si le résultat reste non conforme.
 */
export async function prepareReceiptImage(file: File): Promise<{ blob: Blob; filename: string }> {
  const check = checkReceiptFile(file)
  if (check === "ok") return { blob: file, filename: file.name || "recu" }
  if (check === "format" && !file.type.startsWith("image/")) throw new ReceiptFileError(RECEIPT_BAD_FORMAT)

  const blob = await compressImage(file)
  if (blob.size > MAX_RECEIPT_BYTES) throw new ReceiptFileError(RECEIPT_TOO_LARGE)
  const base = (file.name || "recu").replace(/\.[^.]+$/, "")
  return { blob, filename: `${base}.jpg` }
}
