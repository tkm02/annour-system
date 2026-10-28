// Tests de lib/roles.ts (doit rester aligné avec app/utils/auth.py côté backend)
import { test } from "node:test";
import assert from "node:assert/strict";

import { ROLES, normalizeRole, roleLabel } from "../lib/roles.ts";

test("rôles canoniques identiques au backend", () => {
  assert.deepEqual([...ROLES], ["admin", "scientifique", "finances", "sante"]);
});

test("conversion des anciennes valeurs et de la casse", () => {
  const cases = {
    admin: "admin", ADMINISTRATION: "admin", finance: "finances", Finances: "finances",
    scientific: "scientifique", SCIENTIFIQUE: "scientifique", SANTE: "sante", "santé": "sante",
    " admin ": "admin", consultation: "consultation",
  };
  for (const [raw, expected] of Object.entries(cases)) {
    assert.equal(normalizeRole(raw), expected, raw);
  }
  assert.equal(normalizeRole(undefined), "");
  assert.equal(normalizeRole(null), "");
});

test("libellés affichés", () => {
  assert.equal(roleLabel("ADMINISTRATION"), "Administration");
  assert.equal(roleLabel("finance"), "Finances");
  assert.equal(roleLabel("sante"), "Santé");
  assert.equal(roleLabel("inconnu"), "Utilisateur");
});
