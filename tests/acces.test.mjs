// TAF lot 3 : logique de l'écran « Gestion des accès » (lib/comptes.ts), alignée sur l'API
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  LIBELLES_EVENEMENTS, actionLien, basculePossible, libelleEvenement, navigateurCourt, statutCompte, tonEvenement,
} from "../lib/comptes.ts";

const enAttente = { is_active: false, en_attente_activation: true };
const actif = { is_active: true, en_attente_activation: false };
const desactive = { is_active: false, en_attente_activation: false };
const ancien = { is_active: true };   // compte antérieur au lot 3 (champ absent)

test("statut d'un compte", () => {
  assert.equal(statutCompte(enAttente), "en_attente");
  assert.equal(statutCompte(actif), "actif");
  assert.equal(statutCompte(desactive), "desactive");
  assert.equal(statutCompte(ancien), "actif");
});

test("lien proposé : activation si jamais activé, réinitialisation si actif, rien si désactivé (409 côté API)", () => {
  assert.equal(actionLien(enAttente).usage, "activation");
  assert.match(actionLien(enAttente).confirmation, /72 h/);
  assert.equal(actionLien(actif).usage, "reset");
  assert.match(actionLien(actif).confirmation, /1 h/);
  assert.equal(actionLien(desactive), null);
});

test("bascule activé / désactivé indisponible pour un compte en attente d'activation", () => {
  assert.equal(basculePossible(enAttente), false);
  assert.equal(basculePossible(actif), true);
  assert.equal(basculePossible(desactive), true);
});

test("journal : libellé et ton de chaque type de l'API", () => {
  const typesApi = ["login_ok", "login_echec", "login_bloque", "login_inactif", "activation", "reset_demande",
    "reset_ok", "lien_envoye", "lien_renvoye", "email_echec", "compte_genere", "compte_cree"];
  assert.deepEqual(Object.keys(LIBELLES_EVENEMENTS).sort(), [...typesApi].sort());
  assert.equal(libelleEvenement("type_futur"), "type_futur");
  assert.equal(tonEvenement("login_echec"), "danger");
  assert.equal(tonEvenement("login_ok"), "success");
  assert.equal(tonEvenement("compte_genere"), "neutral");
});

test("navigateur résumé", () => {
  assert.equal(navigateurCourt(null), "—");
  assert.equal(navigateurCourt("Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/131.0 Mobile Safari/537.36"),
    "Chrome (mobile)");
  assert.equal(navigateurCourt("Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/131.0 Safari/537.36 Edg/131.0"),
    "Edge (ordinateur)");
  assert.equal(navigateurCourt("Mozilla/5.0 (Macintosh) Gecko/20100101 Firefox/133.0"), "Firefox (ordinateur)");
});
