// Tests de lib/dashboard-stats.ts — données fictives
import { test } from "node:test";
import assert from "node:assert/strict";

import { computeDashboardStats, formatPercent, recentRegistrations } from "../lib/dashboard-stats.ts";

const rows = [
  { sexe: "M", dortoir: "Dortoir A", niveau_academique: "Secondaire", registration_date: "2026-12-01T10:00:00" },
  { sexe: "M", dortoir: "Pépinière Garçons", niveau_academique: "Primaire", registration_date: "2026-12-03T10:00:00" },
  { sexe: "F", dortoir: "Dortoir B", niveau_academique: "Secondaire", registration_date: "2026-12-02T10:00:00" },
  { sexe: "F", dortoir: "Pépinière Filles", niveau_academique: null, registration_date: null },
  { sexe: "F", dortoir: null, niveau_academique: "Universitaire", registration_date: "2026-11-30T10:00:00" },
];

test("effectifs : garçons et filles Pépinière incluse, détail Pépinière", () => {
  const s = computeDashboardStats(rows, 5);
  assert.equal(s.total, 5);
  assert.equal(s.garcons, 2);
  assert.equal(s.filles, 3);
  assert.equal(s.pepiniere, 2);
  assert.equal(s.pepiniereGarcons, 1);
  assert.equal(s.pepiniereFilles, 1);
  // Mêmes valeurs qu'avant la refonte : (hors Pépinière + Pépinière) / total serveur
  assert.equal(s.partGarcons, 40);
  assert.equal(s.partFilles, 60);
});

test("répartition par niveau triée, niveau absent = « Non classé »", () => {
  const s = computeDashboardStats(rows, 5);
  assert.deepEqual(s.parNiveau[0], { niveau: "Secondaire", garcons: 1, filles: 1, total: 2 });
  assert.ok(s.parNiveau.some((n) => n.niveau === "Non classé" && n.filles === 1));
});

test("total nul : parts à 0", () => {
  const s = computeDashboardStats([], 0);
  assert.equal(s.partGarcons, 0);
  assert.equal(s.parNiveau.length, 0);
});

test("inscriptions récentes : tri décroissant sans modifier la liste", () => {
  const copy = rows.map((r) => r.registration_date);
  const recent = recentRegistrations(rows, 2);
  assert.deepEqual(recent.map((r) => r.registration_date), ["2026-12-03T10:00:00", "2026-12-02T10:00:00"]);
  assert.deepEqual(rows.map((r) => r.registration_date), copy);
});

test("pourcentage français", () => {
  assert.equal(formatPercent(40).replace(/\s/g, " "), "40 %");
  assert.equal(formatPercent(52.456).replace(/\s/g, " "), "52,5 %");
});
