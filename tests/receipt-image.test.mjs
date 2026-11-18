// Tests de lib/receipt-image.ts (contrôle du reçu avant envoi)
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  MAX_RECEIPT_BYTES, RECEIPT_BAD_FORMAT, RECEIPT_TOO_LARGE, checkReceiptFile, prepareReceiptImage,
} from "../lib/receipt-image.ts";

test("formats et taille acceptés", () => {
  for (const type of ["image/jpeg", "image/png", "image/webp"]) {
    assert.equal(checkReceiptFile({ type, size: 1000 }), "ok", type);
  }
  assert.equal(checkReceiptFile({ type: "image/png", size: MAX_RECEIPT_BYTES }), "ok");
  assert.equal(checkReceiptFile({ type: "image/png", size: MAX_RECEIPT_BYTES + 1 }), "size");
  assert.equal(checkReceiptFile({ type: "application/pdf", size: 10 }), "format");
  assert.equal(checkReceiptFile({ type: "image/heic", size: 10 }), "format");
});

test("fichier conforme envoyé tel quel (pas de recompression)", async () => {
  const file = new File(["png"], "recu.png", { type: "image/png" });
  const prepared = await prepareReceiptImage(file);
  assert.equal(prepared.blob, file);
  assert.equal(prepared.filename, "recu.png");
});

test("non-image refusée avant l'envoi", async () => {
  const file = new File(["%PDF"], "recu.pdf", { type: "application/pdf" });
  await assert.rejects(prepareReceiptImage(file), { name: "ReceiptFileError", message: RECEIPT_BAD_FORMAT });
});

test("image > 5 Mo sans compression possible (hors navigateur) : refusée", async () => {
  const file = new File([new Uint8Array(MAX_RECEIPT_BYTES + 1)], "recu.png", { type: "image/png" });
  await assert.rejects(prepareReceiptImage(file), { name: "ReceiptFileError", message: RECEIPT_TOO_LARGE });
});
