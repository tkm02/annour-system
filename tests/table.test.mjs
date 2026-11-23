// Tests de lib/table.ts (tri, recherche, pagination des tableaux) — données fictives
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  clampPage, compareValues, countLabel, matchesSearch, normalizeText, pageCount, paginate, sortRows,
} from "../lib/table.ts";

test("normalisation : casse, accents, espaces", () => {
  assert.equal(normalizeText("  Élève   KONÉ "), "eleve kone");
  assert.equal(normalizeText(null), "");
  assert.equal(normalizeText(42), "42");
});

test("recherche : tous les mots, ordre indifférent, sans accents", () => {
  const fields = ["Koné", "Awa", "SEM-0001"];
  assert.ok(matchesSearch("awa kone", fields));
  assert.ok(matchesSearch("sem-0001", fields));
  assert.ok(matchesSearch("", fields));
  assert.ok(!matchesSearch("awa traore", fields));
});

test("comparaison : vides en dernier dans les deux sens, nombres, dates, texte français", () => {
  assert.ok(compareValues(null, "a") > 0);
  assert.ok(compareValues(null, "a", "desc") > 0);
  assert.ok(compareValues(2, 10) < 0);
  assert.ok(compareValues("2", "10") < 0); // tri numérique du texte
  assert.ok(compareValues(new Date("2026-01-02"), new Date("2026-01-01")) > 0);
  assert.ok(compareValues("éa", "eb") < 0);
  assert.ok(compareValues("a", "b", "desc") > 0);
});

test("tri stable et sans mutation", () => {
  const rows = [{ n: "B", k: 1 }, { n: "a", k: 2 }, { n: "b", k: 3 }, { n: null, k: 4 }];
  const sorted = sortRows(rows, (r) => r.n, "asc");
  assert.deepEqual(sorted.map((r) => r.k), [2, 1, 3, 4]);
  assert.deepEqual(rows.map((r) => r.k), [1, 2, 3, 4]);
  assert.deepEqual(sortRows(rows, (r) => r.n, "desc").map((r) => r.k), [1, 3, 2, 4]);
});

test("pagination bornée", () => {
  const rows = Array.from({ length: 53 }, (_, i) => i + 1);
  assert.equal(pageCount(53, 25), 3);
  assert.equal(pageCount(0, 25), 1);
  assert.deepEqual(paginate(rows, 3, 25), [51, 52, 53]);
  assert.deepEqual(paginate(rows, 99, 25), [51, 52, 53]);
  assert.deepEqual(paginate(rows, 0, 25).length, 25);
  assert.equal(clampPage(NaN, 53, 25), 1);
});

test("compteur", () => {
  assert.equal(countLabel(1, 1, "séminariste", "séminaristes"), "1 séminariste");
  assert.equal(countLabel(24, 1280, "séminariste", "séminaristes").replace(/\s/g, " "), "24 sur 1 280 séminaristes");
});
