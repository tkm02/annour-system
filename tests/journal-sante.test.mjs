// TAF lot 4 : journal des accès aux données de santé (libellés et client API)
import { test } from "node:test";
import assert from "node:assert/strict";

import { libelleActeurSante, libelleActionSante, libelleCibleSante } from "../lib/journal-sante.ts";

test("libellés des actions : connus traduits, inconnus affichés tels quels", () => {
  assert.equal(libelleActionSante("LIST_INSCRIPTIONS"), "Liste des inscriptions");
  assert.equal(libelleActionSante("READ_FICHE_CO"), "Lecture d'une fiche CO");
  assert.equal(libelleActionSante("UPDATE_INSCRIPTION"), "Modification de la santé d'un séminariste");
  assert.equal(libelleActionSante("NOUVELLE_ACTION"), "NOUVELLE_ACTION");
});

test("libellés des cibles", () => {
  assert.equal(libelleCibleSante("*"), "Plusieurs fiches (liste)");
  assert.equal(libelleCibleSante("ANNOUR26-NASSR-001"), "ANNOUR26-NASSR-001");
  assert.equal(libelleCibleSante("CO:0123456789abcdef01234567"), "Fiche CO 012345…");
  assert.equal(libelleCibleSante("MEMBRECO:0123456789abcdef01234567"), "Membre CO 2025 012345…");
});

test("acteur : formulaire public sans compte", () => {
  assert.equal(libelleActeurSante({ user_id: "public", username: "formulaire-co" }), "Formulaire public");
  assert.equal(libelleActeurSante({ user_id: "a".repeat(24), username: "kawa" }), "kawa");
});
