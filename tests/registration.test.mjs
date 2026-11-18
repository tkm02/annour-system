// Tests de lib/registration.ts (formulaire d'inscription public / admin)
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  EMPTY_REGISTRATION_FORM, buildRegistrationPayload, computeAge, mapServerFieldErrors, validateRegistrationForm,
} from "../lib/registration.ts";

const TODAY = new Date(Date.UTC(2026, 9, 27)); // 27/10/2026

const valid = {
  ...EMPTY_REGISTRATION_FORM,
  nom: " Fictif ", prenom: "Test", dateNaissance: "2007-03-15", sexe: "M",
  communeHabitation: "Cocody", niveauAcademique: "Licence 1",
  contactParent: "01 02 03 04 05", dortoirId: "NASSR", dortoirNom: "Nassr – Victoire",
  transactionId: " TX-FICTIF-1 ",
};

test("âge révolu, anniversaire non encore passé et date invalide", () => {
  assert.equal(computeAge("2007-03-15", TODAY), 19);
  assert.equal(computeAge("2007-12-01", TODAY), 18);
  assert.equal(computeAge("2026-10-27", TODAY), 0);
  assert.equal(computeAge("2007-02-30", TODAY), null);
  assert.equal(computeAge("", TODAY), null);
});

test("formulaire valide : aucune erreur", () => {
  assert.deepEqual(validateRegistrationForm(valid, TODAY), {});
});

test("champs obligatoires, âge minimum, commune « Autre » et contact invalide", () => {
  const errors = validateRegistrationForm({
    ...EMPTY_REGISTRATION_FORM, dateNaissance: "2023-01-01", communeHabitation: "Autre", contactParent: "abc",
  }, TODAY);
  for (const field of ["nom", "prenom", "sexe", "niveauAcademique", "dortoirId", "transactionId", "communeAutre"]) {
    assert.ok(errors[field], field);
  }
  assert.match(errors.dateNaissance, /minimum : 5 ans/);
  assert.equal(errors.contactParent, "Numéro de téléphone invalide");
  assert.equal(errors.contactSeminariste, undefined); // facultatif
});

test("date future refusée", () => {
  assert.ok(validateRegistrationForm({ ...valid, dateNaissance: "2027-01-01" }, TODAY).dateNaissance);
});

test("corps envoyé : noms du serveur, valeurs nettoyées, valeurs médicales par défaut", () => {
  const body = buildRegistrationPayload(valid, 6000, TODAY);
  assert.deepEqual(body, {
    personalInfo: {
      nom: "Fictif", prenom: "Test", sexe: "M", age: "19", communeHabitation: "Cocody", communeAutre: "",
      niveauAcademique: "Licence 1", contactParent: "01 02 03 04 05", contactSeminariste: "",
      dateNaissance: "2007-03-15",
    },
    dormitoryInfo: { dortoir: "Nassr – Victoire", dortoirId: "NASSR" },
    healthInfo: { allergie: "RAS", antecedentMedical: "Néant" },
    paymentInfo: { transactionId: "TX-FICTIF-1", amount: 6000 },
  });
  assert.equal("expected_amount" in body.paymentInfo, false);
});

test("commune « Autre » : la commune précisée est enregistrée", () => {
  const body = buildRegistrationPayload({ ...valid, communeHabitation: "Autre", communeAutre: " Tiassalé " }, 0, TODAY);
  assert.equal(body.personalInfo.communeHabitation, "Tiassalé");
  assert.equal(body.personalInfo.communeAutre, "Tiassalé");
});

test("erreurs 422 du serveur rattachées aux champs du formulaire", () => {
  assert.deepEqual(mapServerFieldErrors({
    "personalInfo.nom": "trop long",
    "paymentInfo.transactionId": "obligatoire",
    "dormitoryInfo.dortoir": "obligatoire",
    personalInfo: "moins de 5 ans",
    "inconnu.champ": "x",
  }), {
    nom: "trop long", transactionId: "obligatoire", dortoirId: "obligatoire", _form: "moins de 5 ans ; x",
  });
});
