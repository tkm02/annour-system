// Tests de lib/reinscription.ts (TAF lot 2) : repère, filtre, validation du matricule précédent, messages d'erreur.
// Données fictives uniquement.
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  REINSCRIPTION_LABELS, matchesReinscriptionFilter, normaliserMatricule, reinscriptionErrorMessage, reinscriptionStatut,
  validateMatriculePrecedent,
} from "../lib/reinscription.ts";

test("repère : ancien confirmé, ancien déclaré à vérifier, rien sinon (champs absents tolérés)", () => {
  assert.equal(reinscriptionStatut({ matricule_precedent: "FICT25-D01-001", reinscription_a_verifier: false }), "ancien");
  // Le lien l'emporte sur le drapeau (le serveur le remet à false en liant)
  assert.equal(reinscriptionStatut({ matricule_precedent: "FICT25-D01-001", reinscription_a_verifier: true }), "ancien");
  assert.equal(reinscriptionStatut({ matricule_precedent: null, reinscription_a_verifier: true }), "a_verifier");
  assert.equal(reinscriptionStatut({ matricule_precedent: "  ", reinscription_a_verifier: false }), null);
  assert.equal(reinscriptionStatut({}), null, "API pas encore déployée");
  assert.equal(REINSCRIPTION_LABELS.ancien, "Ancien (confirmé)");
  assert.equal(REINSCRIPTION_LABELS.a_verifier, "Ancien déclaré — à vérifier");
});

test("filtre : tous, réinscriptions à vérifier, anciens confirmés", () => {
  const lignes = [
    { matricule_precedent: "FICT25-D01-001" },
    { reinscription_a_verifier: true },
    {},
  ];
  assert.equal(lignes.filter((s) => matchesReinscriptionFilter(s, "tous")).length, 3);
  assert.deepEqual(lignes.filter((s) => matchesReinscriptionFilter(s, "a_verifier")), [lignes[1]]);
  assert.deepEqual(lignes.filter((s) => matchesReinscriptionFilter(s, "ancien")), [lignes[0]]);
  assert.equal(matchesReinscriptionFilter({}, "inconnu"), true);
});

test("matricule précédent : obligatoire, format, différent de l'inscription courante ; casse et espaces ignorés", () => {
  assert.equal(normaliserMatricule(" fict25 - d01 - 001 "), "FICT25-D01-001");
  assert.equal(validateMatriculePrecedent(" fict25-d01-001 ", "FICT26-D01-004"), null);
  assert.ok(validateMatriculePrecedent("", "FICT26-D01-004"));
  assert.ok(validateMatriculePrecedent("   ", "FICT26-D01-004"));
  assert.ok(validateMatriculePrecedent("FICT25/D01", "FICT26-D01-004"));
  assert.ok(validateMatriculePrecedent("-FICT25", "FICT26-D01-004"));
  assert.ok(validateMatriculePrecedent("A".repeat(41), "FICT26-D01-004"));
  assert.ok(validateMatriculePrecedent("fict26-d01-004", "FICT26-D01-004"), "lien vers elle-même refusé");
});

test("erreurs du PATCH : texte du serveur prioritaire, replis 404 / 409", () => {
  assert.equal(reinscriptionErrorMessage({ status: 409, detail: "Déjà liée à FICT26-D02-010", message: "x" }), "Déjà liée à FICT26-D02-010");
  assert.match(reinscriptionErrorMessage({ status: 404, detail: null }), /introuvable/);
  assert.match(reinscriptionErrorMessage({ status: 409, detail: [] }), /déjà liée/);
  assert.equal(reinscriptionErrorMessage({ status: 403, message: "Accès refusé." }), "Accès refusé.");
});
