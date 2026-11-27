// Tests de lib/roles.ts (doit rester aligné avec app/utils/auth.py côté backend)
import { test } from "node:test";
import assert from "node:assert/strict";

import { ROLES, canManageAccess, canWriteFinance, isAdministration, normalizeRole, roleLabel } from "../lib/roles.ts";

test("rôles canoniques identiques au backend", () => {
  assert.deepEqual([...ROLES], ["super_admin", "admin", "scientifique", "finances", "sante"]);
});

test("TAF lot 3 : droits dérivés du rôle (alignés sur l'API)", () => {
  assert.equal(roleLabel("SUPER_ADMIN"), "Super administrateur");
  assert.deepEqual(ROLES.filter(canManageAccess), ["super_admin"]);
  assert.deepEqual(ROLES.filter(isAdministration), ["super_admin", "admin"]);
  assert.deepEqual(ROLES.filter(canWriteFinance), ["super_admin", "finances"]);
  assert.equal(canWriteFinance("finance"), true);   // ancienne valeur
  assert.equal(canManageAccess(undefined), false);
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
