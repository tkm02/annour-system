// Tests de lib/navigation.ts (F-Q1 : pages et menus par rôle, alignés sur les droits de l'API)
import { test } from "node:test";
import assert from "node:assert/strict";

import { NAVIGATION, allowedRolesFor, canAccess, homeFor, navigationFor } from "../lib/navigation.ts";
import { ROLES } from "../lib/roles.ts";

test("matrice : préfixe le plus précis, pages publiques hors matrice", () => {
  assert.deepEqual(allowedRolesFor("/seminaristes/ajouter"), ["admin"]);
  assert.deepEqual(allowedRolesFor("/seminaristes"), ["admin", "scientifique"]);
  assert.deepEqual(allowedRolesFor("/finance/sorties"), ["admin", "finances"]);
  assert.deepEqual(allowedRolesFor("/sante/consultations"), ["admin", "sante"]);
  assert.equal(allowedRolesFor("/inscription"), null);
  assert.equal(allowedRolesFor("/"), null);
  // « /notes-x » ne doit pas hériter de « /notes »
  assert.equal(allowedRolesFor("/notesx"), null);
});

test("accès refusé aux rôles non prévus (ex. finances sur la liste des séminaristes, santé sur les finances)", () => {
  assert.equal(canAccess("finances", "/seminaristes"), false); // 403 côté API
  assert.equal(canAccess("finances", "/dashboard"), false);
  assert.equal(canAccess("scientifique", "/sante"), false);
  assert.equal(canAccess("finances", "/sante/seminaristes"), false);
  assert.equal(canAccess("sante", "/finance/paiements"), false);
  assert.equal(canAccess("scientifique", "/finance"), false);
  assert.equal(canAccess("admin", "/finance/paiements"), true);
  assert.equal(canAccess(null, "/acces"), false);
  assert.equal(canAccess(undefined, "/inscription"), true);
});

test("aucun lien de menu vers une page interdite au rôle", () => {
  for (const role of ROLES) {
    const items = navigationFor(role);
    assert.ok(items.length > 0, role);
    for (const item of items) assert.ok(canAccess(role, item.href), `${role} → ${item.href}`);
  }
});

test("menus cibles : liens morts retirés, tableau de bord par rôle", () => {
  const hrefs = Object.values(NAVIGATION).flat().map((i) => i.href);
  assert.ok(!hrefs.includes("/finance/tickets") && !hrefs.includes("/finance/payments"));
  assert.deepEqual(navigationFor("finances").map((i) => i.href),
    ["/finance", "/finance/entrees", "/finance/sorties", "/finance/paiements", "/finance/rapports"]);
  assert.equal(homeFor("finances"), "/finance");
  assert.equal(homeFor("sante"), "/sante");
  assert.equal(homeFor("admin"), "/dashboard");
  assert.equal(homeFor("scientifique"), "/dashboard");
  assert.deepEqual(navigationFor("inconnu"), []);
});

test("recensement CO : page et menu réservés à l'administration, ancienne page Membres CO conservée", () => {
  assert.deepEqual(allowedRolesFor("/recensement-co"), ["admin"]);
  for (const role of ["scientifique", "finances", "sante"]) assert.equal(canAccess(role, "/recensement-co"), false, role);
  assert.equal(canAccess(null, "/recensement-co"), false);
  const hrefs = navigationFor("admin").map((i) => i.href);
  assert.ok(hrefs.includes("/recensement-co") && hrefs.includes("/membres-co"));
  assert.equal(navigationFor("admin").find((i) => i.href === "/membres-co").name, "Membres CO 2025 (archives)");
  for (const role of ["scientifique", "finances", "sante"]) {
    assert.ok(!navigationFor(role).some((i) => i.href === "/recensement-co"), role);
  }
});
