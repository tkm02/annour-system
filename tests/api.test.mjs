// Tests de lib/api.ts (transmission du token, gestion de session) — lancés avec `npm test`
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
globalThis.window = { location: { pathname: "/notes", href: "/notes" } };

const calls = [];
let nextStatus = 200;
let nextBody = null; // corps de réponse personnalisé (texte) pour le prochain appel
let nextHeaders = {};
let failNetwork = false;
globalThis.fetch = async (url, init) => {
  if (failNetwork) throw new TypeError("Failed to fetch");
  calls.push({ url, method: init.method ?? "GET", body: init.body, headers: Object.fromEntries(new Headers(init.headers)) });
  const body = nextBody ?? (nextStatus === 200 ? "{}" : '{"detail":"x"}');
  return new Response(body, { status: nextStatus, headers: nextHeaders });
};

const { apiRequest, buildApiError, registrationsApi, resolveApiBaseUrl, MISSING_API_URL_MESSAGE } = await import("../lib/api.ts");

beforeEach(() => {
  store.clear();
  calls.length = 0;
  nextStatus = 200;
  nextBody = null;
  nextHeaders = {};
  failNetwork = false;
  window.location = { pathname: "/notes", href: "/notes" };
});

test("sans token : pas d'en-tête Authorization, JSON par défaut", async () => {
  await apiRequest("/scientific/notes");
  assert.equal(calls[0].headers.authorization, undefined);
  assert.equal(calls[0].headers["content-type"], "application/json");
});

test("le token est envoyé en Bearer et les en-têtes de l'appelant sont conservés", async () => {
  store.set("authToken", "tok-fictif");
  await apiRequest("/scientific/notes", { method: "POST", headers: { "X-Test": "1" } });
  assert.equal(calls[0].headers.authorization, "Bearer tok-fictif");
  assert.equal(calls[0].headers["x-test"], "1");
});

test("FormData : aucun Content-Type forcé", async () => {
  await apiRequest("/upload", { method: "POST", body: new FormData() });
  assert.equal(calls[0].headers["content-type"], undefined);
});

test("403 : la session est conservée", async () => {
  store.set("authToken", "tok-fictif");
  nextStatus = 403;
  await assert.rejects(apiRequest("/admin/users"), { name: "ApiError", status: 403 });
  assert.equal(store.get("authToken"), "tok-fictif");
  assert.equal(window.location.href, "/notes");
});

test("401 avec token : session effacée et retour à la connexion", async () => {
  store.set("authToken", "tok-fictif");
  store.set("user", "{}");
  nextStatus = 401;
  await assert.rejects(apiRequest("/admin/users"), { name: "ApiError", status: 401 });
  assert.equal(store.has("authToken"), false);
  assert.equal(store.has("user"), false);
  assert.equal(window.location.href, "/");
});

test("403 « Compte désactivé » avec token : session effacée et retour à la connexion (F-21)", async () => {
  store.set("authToken", "tok-fictif");
  store.set("tokenType", "bearer");
  store.set("user", "{}");
  nextStatus = 403;
  nextBody = '{"detail":"Compte désactivé"}';
  await assert.rejects(apiRequest("/scientific/notes"), { name: "ApiError", status: 403, message: "Compte désactivé" });
  assert.equal(store.has("authToken"), false);
  assert.equal(store.has("tokenType"), false);
  assert.equal(store.has("user"), false);
  assert.equal(window.location.href, "/");
});

test("403 « Accès refusé » (rôle insuffisant) : la session est conservée (F-21)", async () => {
  store.set("authToken", "tok-fictif");
  store.set("user", "{}");
  nextStatus = 403;
  nextBody = '{"detail":"Accès refusé"}';
  await assert.rejects(apiRequest("/finances/sorties"), { name: "ApiError", status: 403 });
  assert.equal(store.get("authToken"), "tok-fictif");
  assert.equal(store.has("user"), true);
  assert.equal(window.location.href, "/notes");
});

test("connexion refusée pour compte désactivé (sans token) : message affichable, pas de redirection (F-21)", async () => {
  nextStatus = 403;
  nextBody = '{"detail":"Compte désactivé"}';
  window.location = { pathname: "/", href: "/" };
  await assert.rejects(apiRequest("/admin/auth/login", { method: "POST" }), { status: 403, message: "Compte désactivé" });
  assert.equal(window.location.href, "/");
});

test("échec de connexion (sans token) : erreur affichable, pas de redirection", async () => {
  nextStatus = 401;
  window.location = { pathname: "/", href: "/" };
  await assert.rejects(apiRequest("/admin/auth/login", { method: "POST" }), { name: "ApiError", status: 401 });
  assert.equal(window.location.href, "/");
});

test("l'URL de base n'a pas de slash final", async () => {
  await apiRequest("/health");
  assert.match(calls[0].url, /\/api\/v1\/health$/);
  assert.doesNotMatch(calls[0].url, /\/\/health$/);
});

// ---------------------------------------------------------------------------
// F-Q2 : erreurs lisibles ({"detail": texte | liste}, 429 Retry-After, 500 request_id)
// ---------------------------------------------------------------------------

test("detail texte : message = detail, statut conservé", async () => {
  nextStatus = 409;
  nextBody = '{"detail":"Le dortoir sélectionné est complet"}';
  await assert.rejects(apiRequest("/registrations", { method: "POST" }), (err) => {
    assert.equal(err.name, "ApiError");
    assert.equal(err.status, 409);
    assert.equal(err.message, "Le dortoir sélectionné est complet");
    assert.doesNotMatch(err.message, /API|\{/);
    return true;
  });
});

test("422 liste : erreurs par champ sans le préfixe body ni « Value error »", () => {
  const err = buildApiError(422, JSON.stringify({ detail: [
    { loc: ["body", "personalInfo", "nom"], msg: "String should have at least 1 character" },
    { loc: ["body", "personalInfo"], msg: "Value error, Nous n'acceptons pas les séminaristes de moins de 5 ans" },
  ] }));
  assert.equal(err.status, 422);
  assert.deepEqual(err.fieldErrors, {
    "personalInfo.nom": "String should have at least 1 character",
    personalInfo: "Nous n'acceptons pas les séminaristes de moins de 5 ans",
  });
  assert.match(err.message, /moins de 5 ans/);
});

test("422 texte (règle métier) : message = detail, aucune erreur par champ", () => {
  const err = buildApiError(422, '{"detail":"évaluation 2 manquant(e)"}');
  assert.equal(err.message, "évaluation 2 manquant(e)");
  assert.deepEqual(err.fieldErrors, {});
});

test("429 : délai Retry-After lu et affiché", async () => {
  nextStatus = 429;
  nextHeaders = { "Retry-After": "42" };
  await assert.rejects(apiRequest("/registrations", { method: "POST" }), (err) => {
    assert.equal(err.retryAfter, 42);
    assert.equal(err.message, "Trop de requêtes. Réessayez dans 42 s.");
    return true;
  });
});

test("500 : message générique avec request_id, sans détail interne", () => {
  const err = buildApiError(500, '{"detail":"Erreur interne du serveur","request_id":"req-123"}');
  assert.equal(err.requestId, "req-123");
  assert.match(err.message, /req-123/);
});

test("corps non JSON ou vide : message par défaut selon le statut", () => {
  assert.equal(buildApiError(413, "<html>").message, "Fichier trop volumineux (5 Mo maximum).");
  assert.equal(buildApiError(404, "").message, "Ressource introuvable.");
  assert.equal(buildApiError(418, "").message, "Erreur 418.");
});

test("serveur injoignable : ApiError statut 0", async () => {
  failNetwork = true;
  await assert.rejects(apiRequest("/health"), { name: "ApiError", status: 0 });
});

// ---------------------------------------------------------------------------
// F-I1 : circuit d'inscription
// ---------------------------------------------------------------------------

test("création : POST /registrations en JSON", async () => {
  nextBody = '{"matricule":"ANNOUR26-NASSR-001","payment_status":"en_attente","verification_token":"jeton-fictif"}';
  const payload = { personalInfo: { nom: "Fictif" } };
  const created = await registrationsApi.create(payload);
  assert.equal(created.matricule, "ANNOUR26-NASSR-001");
  assert.equal(calls[0].method, "POST");
  assert.match(calls[0].url, /\/registrations$/);
  assert.deepEqual(JSON.parse(calls[0].body), payload);
});

test("reçu : multipart token + file, matricule encodé, jeton jamais stocké", async () => {
  nextBody = '{"matricule":"M/1","statut":"rejete","message":"Montant invalide"}';
  const file = new Blob(["image"], { type: "image/png" });
  const result = await registrationsApi.submitReceipt("M/1", "jeton-fictif", file, "recu.png");
  assert.equal(result.statut, "rejete");
  assert.match(calls[0].url, /\/registrations\/M%2F1\/receipt$/);
  assert.ok(calls[0].body instanceof FormData);
  assert.equal(calls[0].body.get("token"), "jeton-fictif");
  assert.equal(calls[0].body.get("file").name, "recu.png");
  assert.equal(calls[0].headers["content-type"], undefined); // frontière multipart fixée par le navigateur
  assert.equal([...store.values()].some((v) => v.includes("jeton-fictif")), false);
});

test("dortoirs et état des inscriptions : routes publiques attendues", async () => {
  nextBody = "[]";
  await registrationsApi.getDortoirs("F");
  nextBody = '{"open":false,"fee":6000}';
  const status = await registrationsApi.getStatus();
  assert.match(calls[0].url, /\/registrations\/dortoirs\?sexe=F$/);
  assert.match(calls[1].url, /\/registrations\/status$/);
  assert.deepEqual(status, { open: false, fee: 6000 });
});

// ---------------------------------------------------------------------------
// F-17 : jamais de repli silencieux sur l'API de production
// ---------------------------------------------------------------------------

test("URL de l'API : variable utilisée telle quelle, sans slash final", () => {
  assert.equal(resolveApiBaseUrl("https://api.exemple.test/api/v1/", "production"), "https://api.exemple.test/api/v1");
  assert.equal(resolveApiBaseUrl("  http://127.0.0.1:9000/api/v1  ", "development"), "http://127.0.0.1:9000/api/v1");
});

test("URL de l'API absente hors production : API locale du Backend (port 8000)", () => {
  assert.equal(resolveApiBaseUrl(undefined, "development"), "http://localhost:8000/api/v1");
  assert.equal(resolveApiBaseUrl("", "test"), "http://localhost:8000/api/v1");
  assert.equal(resolveApiBaseUrl(undefined, undefined), "http://localhost:8000/api/v1");
});

test("URL de l'API absente en production : aucune URL (jamais l'API de production en dur)", () => {
  assert.equal(resolveApiBaseUrl(undefined, "production"), null);
  assert.equal(resolveApiBaseUrl("   ", "production"), null);
});

test("build de production sans NEXT_PUBLIC_API_URL : appel refusé avec un message explicite, aucun fetch", async () => {
  const saved = { env: process.env.NODE_ENV, url: process.env.NEXT_PUBLIC_API_URL };
  process.env.NODE_ENV = "production";
  delete process.env.NEXT_PUBLIC_API_URL;
  // Instance distincte du module (requête d'URL différente) évaluée avec l'environnement de production
  const prod = await import("../lib/api.ts?f17-production");
  process.env.NODE_ENV = saved.env;
  if (saved.url !== undefined) process.env.NEXT_PUBLIC_API_URL = saved.url;
  await assert.rejects(prod.apiRequest("/health"), { name: "ApiError", status: 0, message: MISSING_API_URL_MESSAGE });
  assert.equal(calls.length, 0);
});
