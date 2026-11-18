// Tests des formulaires Finances (F-F3 à F-F6) et Santé (F-S3 à F-S5), statut de paiement (F-A1), formats
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildDon, buildRapport, buildSortie, buildVente, diffSortie, parseMontant, validateDecision,
  validateDeleteReason, validateEntree, validateRapport, validateSortie,
} from "../lib/finance-forms.ts";
import { buildConsultation, diffConsultation, diffInformations, validateConsultation } from "../lib/consultation-form.ts";
import { isPaymentVerified, paymentStatusInfo } from "../lib/payment-status.ts";
import { formatMontant } from "../lib/format.ts";

test("montant : nombre > 0, virgule et espaces tolérés", () => {
  assert.equal(parseMontant("6 000"), 6000);
  assert.equal(parseMontant("12,5"), 12.5);
  for (const bad of ["0", "-5", "abc", "", "1.234"]) assert.equal(parseMontant(bad), null, bad);
});

test("entrées : don et vente, champs obligatoires, corps sans champs vides", () => {
  const base = { montant: "5000", donateur: "", libelle: "", description: "", mode_paiement: "Wave", date_transaction: "" };
  assert.ok(validateEntree({ ...base, kind: "don" }).donateur);
  assert.ok(validateEntree({ ...base, kind: "vente" }).libelle);
  assert.deepEqual(buildDon({ ...base, kind: "don", donateur: " Donateur fictif " }),
    { montant: 5000, donateur: "Donateur fictif", mode_paiement: "Wave" });
  assert.deepEqual(buildVente({ ...base, kind: "vente", libelle: "Livres" }), { montant: 5000, libelle: "Livres", mode_paiement: "Wave" });
});

test("sorties : catégorie obligatoire, modification partielle, null seulement pour le bénéficiaire", () => {
  const form = { categorie: "", montant: "0", libelle: "", beneficiaire: "", mode_paiement: "Espèces", date_transaction: "" };
  const errors = validateSortie(form);
  assert.ok(errors.categorie && errors.montant && errors.libelle);
  assert.deepEqual(buildSortie({ ...form, categorie: "Transport", montant: "2500", libelle: "Taxi" }),
    { categorie: "Transport", montant: 2500, libelle: "Taxi", mode_paiement: "Espèces" });

  const original = { categorie: "Transport", montant: 2500, libelle: "Taxi", beneficiaire: "Chauffeur", mode_paiement: "Espèces",
    date_transaction: "2026-10-27T09:30:00Z" };
  const same = { categorie: "Transport", montant: "2500", libelle: "Taxi", beneficiaire: "Chauffeur", mode_paiement: "Espèces", date_transaction: "" };
  assert.deepEqual(diffSortie(original, same), {});
  assert.deepEqual(diffSortie(original, { ...same, beneficiaire: "", montant: "3000" }), { montant: 3000, beneficiaire: null });
});

test("suppression d'une sortie : motif de 10 caractères minimum (règle serveur)", () => {
  assert.ok(validateDeleteReason("doublon"));
  assert.equal(validateDeleteReason("Saisie en double"), null);
});

test("rapports : période cohérente et bornes incluses", () => {
  assert.ok(validateRapport({ titre: "", type_rapport: "x", periode_debut: "2026-10-31", periode_fin: "2026-10-01", commentaires: "" }).periode_fin);
  assert.deepEqual(buildRapport({ titre: "Octobre", type_rapport: "mensuel", periode_debut: "2026-10-01", periode_fin: "2026-10-31", commentaires: "" }),
    { titre: "Octobre", type_rapport: "mensuel", periode_debut: "2026-10-01T00:00:00", periode_fin: "2026-10-31T23:59:59" });
});

test("validation manuelle : motif 3 à 500 caractères, transaction obligatoire pour valider", () => {
  assert.ok(validateDecision({ decision: "verifie", motif: "ok" }));
  assert.ok(validateDecision({ decision: "verifie", motif: "Relevé contrôlé" }));
  assert.equal(validateDecision({ decision: "verifie", motif: "Relevé contrôlé", transaction_id: "TX-FICTIF" }), null);
  assert.equal(validateDecision({ decision: "rejete", motif: "Reçu falsifié" }), null);
  assert.ok(validateDecision({ decision: "rejete", motif: "x".repeat(501) }));
});

test("consultation : date non future, textes obligatoires, médecin exigé pour un admin uniquement", () => {
  const now = new Date("2026-10-27T10:00:00Z");
  const values = { date_consultation: "2026-10-27T09:00", motif_consultation: " Fièvre ", observations_diagnostic: "Obs",
    traitement_prescrit: "Repos", notes_medicales_supplementaires: "", medecin_responsable_id: "" };
  assert.deepEqual(validateConsultation(values, false, now), {});
  assert.ok(validateConsultation(values, true, now).medecin_responsable_id);
  assert.ok(validateConsultation({ ...values, date_consultation: "2026-10-28T09:00" }, false, now).date_consultation);
  assert.ok(validateConsultation({ ...values, traitement_prescrit: " " }, false, now).traitement_prescrit);
  assert.ok(validateConsultation({ ...values, motif_consultation: "x".repeat(2001) }, false, now).motif_consultation);

  const body = buildConsultation({ ...values, medecin_responsable_id: "m1" }, false);
  assert.equal("medecin_responsable_id" in body, false); // rôle sante : médecin par défaut côté serveur
  assert.equal(body.motif_consultation, "Fièvre");
  assert.equal(body.notes_medicales_supplementaires, null);
  assert.equal(buildConsultation({ ...values, medecin_responsable_id: "m1" }, true).medecin_responsable_id, "m1");
});

test("modification de consultation : seuls les champs changés", () => {
  const original = { id: "c1", matricule: "M1", date_consultation: new Date("2026-10-27T09:00").toISOString(), medecin_responsable_id: "m1",
    motif_consultation: "Fièvre", observations_diagnostic: "Obs", traitement_prescrit: "Repos", notes_medicales_supplementaires: null };
  const values = { date_consultation: "2026-10-27T09:00", motif_consultation: "Fièvre", observations_diagnostic: "Obs",
    traitement_prescrit: "Paracétamol", notes_medicales_supplementaires: "", medecin_responsable_id: "m1" };
  assert.deepEqual(diffConsultation(original, values, false), { traitement_prescrit: "Paracétamol" });
});

test("informations médicales : contact non vide, champs vidés → null, aucune modification signalée", () => {
  const original = { contact_parent: "0102030405", allergies: "Arachide", antecedents_medicaux: null, date_naissance: null };
  assert.deepEqual(diffInformations(original, { contact_parent: "0102030405", allergies: "", antecedents_medicaux: "", date_naissance: "" }),
    { update: { allergies: null }, error: null });
  assert.equal(diffInformations(original, { contact_parent: " ", allergies: "", antecedents_medicaux: "", date_naissance: "" }).error,
    "Le contact du parent ne peut pas être vide");
  assert.equal(diffInformations(original, { contact_parent: "0102030405", allergies: "Arachide", antecedents_medicaux: "", date_naissance: "" }).error,
    "Aucune modification");
});

test("statut de paiement : libellés du document et statuts vérifiés", () => {
  assert.equal(paymentStatusInfo("en_attente").label, "En attente");
  assert.equal(paymentStatusInfo("erreur").label, "Erreur de vérification");
  assert.equal(paymentStatusInfo("completed").label, "Vérifié (historique)");
  assert.equal(paymentStatusInfo("autre").label, "autre");
  assert.ok(isPaymentVerified("completed") && isPaymentVerified("verifie") && isPaymentVerified("verifie_historique"));
  assert.ok(!isPaymentVerified("rejete") && !isPaymentVerified(null));
});

test("montants FCFA lisibles", () => {
  assert.equal(formatMontant(6000), "6 000 F");
  assert.equal(formatMontant(null), "0 F");
});
