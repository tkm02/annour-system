// Tests de lib/selection.ts (sélection ordonnée des badges, attestations et bulletins) — données fictives
import { test } from "node:test";
import assert from "node:assert/strict";

import { addToSelection, applySelection, isAllSelected, removeFromSelection } from "../lib/selection.ts";

test("ajout : nouvelles clés à la fin, sans doublon", () => {
  assert.deepEqual(addToSelection(["SEM-002"], ["SEM-001", "SEM-002", "SEM-003"]), ["SEM-002", "SEM-001", "SEM-003"]);
  assert.deepEqual(addToSelection([], []), []);
});

test("ajout : la liste d'origine n'est pas modifiée", () => {
  const current = ["SEM-001"];
  addToSelection(current, ["SEM-002"]);
  assert.deepEqual(current, ["SEM-001"]);
});

test("retrait : l'ordre des clés restantes est conservé", () => {
  assert.deepEqual(removeFromSelection(["SEM-003", "SEM-001", "SEM-002"], ["SEM-001"]), ["SEM-003", "SEM-002"]);
  assert.deepEqual(removeFromSelection(["SEM-001"], ["SEM-009"]), ["SEM-001"]);
});

test("application d'un ensemble : rang conservé pour l'aperçu (première clé)", () => {
  // Le tableau renvoie un ensemble ; la première sélection reste en tête
  assert.deepEqual(applySelection(["SEM-005", "SEM-001"], new Set(["SEM-001", "SEM-005", "SEM-007"])), ["SEM-005", "SEM-001", "SEM-007"]);
  assert.deepEqual(applySelection(["SEM-005", "SEM-001"], new Set(["SEM-001"])), ["SEM-001"]);
  assert.deepEqual(applySelection(["SEM-005"], new Set()), []);
});

test("tout sélectionné : vrai seulement si chaque clé l'est", () => {
  assert.equal(isAllSelected(["A", "B", "C"], ["A", "C"]), true);
  assert.equal(isAllSelected(["A"], ["A", "B"]), false);
  assert.equal(isAllSelected(["A"], []), false);
});
