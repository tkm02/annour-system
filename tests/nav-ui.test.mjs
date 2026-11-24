// Tests de lib/nav-ui.ts (coque du back-office : entrée active, groupes, fil d'Ariane, initiales)
import { test } from "node:test";
import assert from "node:assert/strict";

import { NAVIGATION, navigationFor } from "../lib/navigation.ts";
import { activeHref, breadcrumbFor, groupBySection, initials, SUB_PAGE_LABELS } from "../lib/nav-ui.ts";
import { ROLES } from "../lib/roles.ts";

test("entrée active : correspondance exacte, sous-page, entrée la plus précise", () => {
  const admin = navigationFor("admin");
  assert.equal(activeHref(admin, "/dashboard"), "/dashboard");
  assert.equal(activeHref(admin, "/seminaristes/ajouter"), "/seminaristes");
  assert.equal(activeHref(admin, "/finance/paiements"), "/finance/paiements");
  assert.equal(activeHref(admin, "/finance/sorties"), "/finance");
  assert.equal(activeHref(admin, "/notesx"), null);
  assert.equal(activeHref(admin, "/"), null);
});

test("groupes : ordre conservé, entrées d'une section contiguës dans chaque menu", () => {
  for (const role of ROLES) {
    const items = navigationFor(role);
    const sections = groupBySection(items);
    assert.deepEqual(sections.flatMap((s) => s.items), items, role);
    const order = items.map((i) => i.section).filter((s, i, a) => i === 0 || a[i - 1] !== s);
    assert.equal(new Set(order).size, order.length, `${role} : section non contiguë`);
  }
  assert.deepEqual(groupBySection(navigationFor("admin")).map((s) => s.title),
    ["Pilotage", "Séminaristes", "Comité d'organisation", "Accueil", "Pédagogie", "Finances", "Santé", "Administration"]);
});

test("chaque entrée a une section et un lien unique par rôle", () => {
  for (const [role, items] of Object.entries(NAVIGATION)) {
    for (const item of items) assert.ok(item.section && item.section.trim(), `${role} → ${item.href}`);
    assert.equal(new Set(items.map((i) => i.href)).size, items.length, role);
  }
});

test("fil d'Ariane", () => {
  const admin = navigationFor("admin");
  assert.deepEqual(breadcrumbFor(admin, "/seminaristes"), [{ label: "Séminaristes" }]);
  assert.deepEqual(breadcrumbFor(admin, "/badges"), [{ label: "Séminaristes" }, { label: "Badges" }]);
  assert.deepEqual(breadcrumbFor(admin, "/seminaristes/ajouter", SUB_PAGE_LABELS), [
    { label: "Séminaristes", href: "/seminaristes" },
    { label: "Ajouter un séminariste" },
  ]);
  assert.deepEqual(breadcrumbFor(admin, "/finance/sorties", SUB_PAGE_LABELS), [
    { label: "Finances" },
    { label: "Vue d'ensemble", href: "/finance" },
    { label: "Sorties" },
  ]);
  assert.deepEqual(breadcrumbFor(admin, "/inconnu"), []);
});

test("initiales", () => {
  assert.equal(initials("admin"), "AD");
  assert.equal(initials("jean.dupont"), "JD");
  assert.equal(initials("  "), "?");
  assert.equal(initials(undefined), "?");
});
