// TAF lot 3 : règles de mot de passe, jeton des liens, client comptesApi et erreurs structurées de l'API
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

import {
  contientInfoPersonnelle, jetonDepuisRecherche, reglesMotDePasse, reglesRespectees, sansJeton, sansJetonAnalytics,
} from "../lib/mot-de-passe.ts";

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
globalThis.window = { location: { pathname: "/activer", href: "/activer" } };

const calls = [];
let responder = () => new Response("{}", { status: 200 });
globalThis.fetch = async (url, init) => {
  calls.push({ url: String(url), method: init.method ?? "GET", body: init.body, headers: Object.fromEntries(new Headers(init.headers)) });
  return responder(String(url));
};
const api = await import("../lib/api.ts");
const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers });
const path = (i = 0) => calls[i].url.replace(/^.*\/api\/v1/, "");
const JETON = "Jeton_Fictif-0123456789abcdefghijklmnop";

beforeEach(() => {
  store.clear();
  calls.length = 0;
  responder = () => json({});
});

// ---------------------------------------------------------------------------
// Règles de mot de passe (affichage ; l'API reste seule juge)
// ---------------------------------------------------------------------------

test("règles : longueur 10, informations personnelles, confirmation", () => {
  const etat = (mot, conf = mot) => Object.fromEntries(reglesMotDePasse(mot, conf, ["kawa", "Awa Fatou"]).map((r) => [r.id, r.ok]));
  assert.deepEqual(etat("Court-1"), { longueur: false, personnel: true, identique: true });
  assert.deepEqual(etat("Tamarin-Bleu-48"), { longueur: true, personnel: true, identique: true });
  assert.deepEqual(etat("Tamarin-Bleu-48", "autre"), { longueur: true, personnel: true, identique: false });
  assert.equal(etat("Ma-cle-KAWA-2026").personnel, false);
  assert.equal(etat("fatou-et-moi-77").personnel, false);
  assert.equal(etat("").personnel, false);
  assert.equal(reglesRespectees(reglesMotDePasse("Tamarin-Bleu-48", "Tamarin-Bleu-48", ["kawa"])), true);
  assert.equal(reglesRespectees(reglesMotDePasse("x".repeat(129), "x".repeat(129))), false);
});

test("informations personnelles : accents et morceaux courts ignorés", () => {
  assert.equal(contientInfoPersonnelle("ma-cle-kone-2026", ["KONÉ"]), true);
  assert.equal(contientInfoPersonnelle("Tamarin-Bleu-48", ["Al", "Bo"]), false);   // moins de 3 caractères
  assert.equal(contientInfoPersonnelle("Tamarin-Bleu-48", [null, undefined, ""]), false);
});

test("jeton : lu dans ?jeton=, refusé s'il est malformé, retiré des adresses", () => {
  assert.equal(jetonDepuisRecherche(`?jeton=${JETON}`), JETON);
  assert.equal(jetonDepuisRecherche("?jeton=court"), null);
  assert.equal(jetonDepuisRecherche("?jeton=<script>alert(1)</script>xxxxxxxxxxxxxxx"), null);
  assert.equal(jetonDepuisRecherche(""), null);
  assert.equal(sansJeton(`https://backoffice.annour.ci/activer?jeton=${JETON}`), "https://backoffice.annour.ci/activer");
  assert.equal(sansJeton(`/reinitialiser?jeton=${JETON}&x=1#h`), "/reinitialiser?x=1#h");
  assert.equal(sansJeton("/dashboard?page=2"), "/dashboard?page=2");
  assert.deepEqual(sansJetonAnalytics({ type: "pageview", url: `https://bo.test/activer?jeton=${JETON}` }),
    { type: "pageview", url: "https://bo.test/activer" });
});

// ---------------------------------------------------------------------------
// Client comptesApi
// ---------------------------------------------------------------------------

test("parcours publics : routes POST et corps", async () => {
  await api.comptesApi.verifierLien(JETON, "activation");
  await api.comptesApi.activer(JETON, "Tamarin-Bleu-48");
  await api.comptesApi.motDePasseOublie("kawa");
  await api.comptesApi.reinitialiser(JETON, "Tamarin-Bleu-48");
  assert.deepEqual(calls.map((c) => [c.method, path(calls.indexOf(c))]), [
    ["POST", "/admin/auth/jeton/verifier"], ["POST", "/admin/auth/activation"],
    ["POST", "/admin/auth/mot-de-passe-oublie"], ["POST", "/admin/auth/reinitialisation"],
  ]);
  assert.deepEqual(JSON.parse(calls[0].body), { jeton: JETON, usage: "activation" });
  assert.deepEqual(JSON.parse(calls[2].body), { identifier: "kawa" });
  assert.equal(calls[0].headers.authorization, undefined);   // hors session : aucun token envoyé
});

test("gestion des accès : aperçu, génération (sélection facultative), lien, journal paginé", async () => {
  store.set("authToken", "tok-fictif");
  await api.comptesApi.apercuComptesCO();
  await api.comptesApi.genererComptesCO();
  await api.comptesApi.genererComptesCO(["a".repeat(24)]);
  await api.comptesApi.envoyerLien("b".repeat(24));
  responder = () => json([], 200, { "X-Total-Count": "120" });
  const page = await api.comptesApi.journal(3, 50, { type: "login_echec" });
  assert.equal(path(0), "/admin/comptes-co/apercu");
  assert.equal(path(1), "/admin/comptes-co/generer");
  assert.deepEqual(JSON.parse(calls[1].body), {});
  assert.deepEqual(JSON.parse(calls[2].body), { participation_ids: ["a".repeat(24)] });
  assert.equal(path(3), `/admin/comptes/${"b".repeat(24)}/envoyer-lien`);
  assert.equal(path(4), "/admin/comptes/journal?skip=100&limit=50&type=login_echec");
  assert.equal(page.total, 120);
  assert.ok(calls.every((c) => c.headers.authorization === "Bearer tok-fictif"));
});

test("création d'un compte sans mot de passe : champ absent du corps", async () => {
  store.set("authToken", "tok-fictif");
  await api.usersApi.createUser({ email: "n@an-nour-fictif.org", username: "nfatou", nom: "NDIAYE", prenom: "Fatou", role: "sante" });
  assert.equal("password" in JSON.parse(calls[0].body), false);
});

test("lien refusé : message et code lus dans le détail structuré de l'API", async () => {
  responder = () => json({ detail: { code: "expire", message: "Ce lien a expiré. Demandez un nouveau lien." } }, 400);
  await assert.rejects(api.comptesApi.activer(JETON, "Tamarin-Bleu-48"), (err) => {
    assert.equal(err.status, 400);
    assert.equal(err.message, "Ce lien a expiré. Demandez un nouveau lien.");
    assert.equal(api.etatLien(err), "expire");
    return true;
  });
  responder = () => json({ detail: "Le mot de passe doit contenir au moins 10 caractères" }, 422);
  await assert.rejects(api.comptesApi.activer(JETON, "court"), (err) => {
    assert.equal(api.etatLien(err), null);
    assert.match(err.message, /10 caractères/);
    return true;
  });
  assert.equal(api.etatLien(new Error("x")), null);
  assert.equal(api.buildApiError(400, JSON.stringify({ detail: { code: "autre" } })).message, "Requête invalide.");
});
