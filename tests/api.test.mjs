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
globalThis.fetch = async (url, init) => {
  calls.push({ url, headers: Object.fromEntries(new Headers(init.headers)) });
  return new Response(nextStatus === 200 ? "{}" : '{"detail":"x"}', { status: nextStatus });
};

const { apiRequest } = await import("../lib/api.ts");

beforeEach(() => {
  store.clear();
  calls.length = 0;
  nextStatus = 200;
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
  await assert.rejects(apiRequest("/admin/users"), /403/);
  assert.equal(store.get("authToken"), "tok-fictif");
  assert.equal(window.location.href, "/notes");
});

test("401 avec token : session effacée et retour à la connexion", async () => {
  store.set("authToken", "tok-fictif");
  store.set("user", "{}");
  nextStatus = 401;
  await assert.rejects(apiRequest("/admin/users"), /401/);
  assert.equal(store.has("authToken"), false);
  assert.equal(store.has("user"), false);
  assert.equal(window.location.href, "/");
});

test("échec de connexion (sans token) : erreur affichable, pas de redirection", async () => {
  nextStatus = 401;
  window.location = { pathname: "/", href: "/" };
  await assert.rejects(apiRequest("/admin/auth/login", { method: "POST" }), /401/);
  assert.equal(window.location.href, "/");
});

test("l'URL de base n'a pas de slash final", async () => {
  await apiRequest("/health");
  assert.match(calls[0].url, /\/api\/v1\/health$/);
  assert.doesNotMatch(calls[0].url, /\/\/health$/);
});
