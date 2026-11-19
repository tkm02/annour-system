// Contrat des clients API des lots 2 à 5 : routes, méthodes, pagination X-Total-Count, téléchargement authentifié
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
globalThis.window = { location: { pathname: "/finance", href: "/finance" } };

const calls = [];
let responder = () => new Response("{}", { status: 200 });
globalThis.fetch = async (url, init) => {
  calls.push({ url: String(url), method: init.method ?? "GET", body: init.body, headers: Object.fromEntries(new Headers(init.headers)) });
  return responder(String(url));
};

const api = await import("../lib/api.ts");
const json = (body, headers = {}) => new Response(JSON.stringify(body), { status: 200, headers });

beforeEach(() => {
  store.clear();
  calls.length = 0;
  responder = () => json({});
  store.set("authToken", "tok-fictif");
});

const path = (i = 0) => calls[i].url.replace(/^.*\/api\/v1/, "");

test("paiements : liste finances, détail et décision PATCH avec motif", async () => {
  await api.paymentsApi.list({ statut: "rejete", search: "Fictif", page: 2 });
  await api.paymentsApi.get("ANNOUR26-A-001");
  await api.paymentsApi.decide("ANNOUR26-A-001", { decision: "verifie", transaction_id: "TX", motif: "Relevé contrôlé" });
  assert.equal(path(0), "/finances/paiements?statut=rejete&search=Fictif&page=2&limit=20");
  assert.equal(path(1), "/registrations/ANNOUR26-A-001/paiement");
  assert.equal(calls[2].method, "PATCH");
  assert.deepEqual(JSON.parse(calls[2].body), { decision: "verifie", transaction_id: "TX", motif: "Relevé contrôlé" });
  assert.equal(calls[2].headers.authorization, "Bearer tok-fictif");
});

test("finances : routes et corps (suppression avec motif, restauration, rapports paginés)", async () => {
  await api.financeApi.getSorties({ categorie: "Transport", date_debut: "2026-10-01T00:00:00" });
  await api.financeApi.deleteSortie("SOR-1", "Saisie en double");
  await api.financeApi.restoreSortie("SOR-1");
  responder = () => json([], { "X-Total-Count": "45" });
  const rapports = await api.financeApi.getRapports({ page: 3, limit: 20 });
  assert.equal(path(0), "/finances/sorties?categorie=Transport&date_debut=2026-10-01T00%3A00%3A00&page=1&limit=20");
  assert.equal(calls[1].method, "DELETE");
  assert.deepEqual(JSON.parse(calls[1].body), { deleted_reason: "Saisie en double" });
  assert.equal(calls[2].method, "POST");
  assert.match(path(2), /^\/finances\/sorties\/SOR-1\/restore$/);
  assert.equal(path(3), "/finances/rapports?skip=40&limit=20");
  assert.equal(rapports.total, 45);
});

test("synchronisation : lecture de l'état seulement, jamais de montant_inscription", async () => {
  await api.financeApi.getSyncStatus();
  assert.equal(path(0), "/finances/sync/status");
  assert.equal(calls[0].method, "GET");
  assert.equal(Object.keys(api.financeApi).some((k) => /sync/i.test(k) && k !== "getSyncStatus"), false);
});

test("santé : consultations globales, création, export tracé, médecins actifs de rôle sante", async () => {
  await api.santeApi.getConsultations({ search: "Fictif" });
  await api.santeApi.createConsultation("M 1", { date_consultation: "2026-10-27T09:30:00Z", motif_consultation: "m",
    observations_diagnostic: "o", traitement_prescrit: "t" });
  await api.santeApi.exportConsultation("c1");
  responder = () => json([], { "X-Total-Count": "0" });
  await api.santeApi.getMedecins();
  assert.equal(path(0), "/sante/consultations?page=1&limit=20&search=Fictif");
  assert.equal(path(1), "/sante/patients/M%201/consultations");
  assert.equal(path(2), "/sante/consultations/c1/export");
  assert.equal(path(3), "/admin/users?skip=0&limit=1000&role=sante&is_active=true");
});

test("utilisateurs : pagination skip/limit et total X-Total-Count (F-A6), fermeture des sessions (F-A3)", async () => {
  responder = () => json([{ id: "u1" }], { "X-Total-Count": "27" });
  const res = await api.usersApi.getUsers(3, 10);
  assert.equal(path(0), "/admin/users?skip=20&limit=10");
  assert.equal(res.total, 27);
  responder = () => json({ message: "ok" });
  await api.usersApi.revokeSessions("u1");
  assert.equal(path(1), "/admin/users/u1/revoke-sessions");
  assert.equal(calls[1].method, "POST");
});

test("déconnexion de tous les appareils : session locale effacée même si l'appel échoue", async () => {
  responder = () => new Response('{"detail":"x"}', { status: 500 });
  await assert.rejects(api.authApi.logoutAll(), { name: "ApiError", status: 500 });
  assert.equal(path(0), "/admin/auth/logout-all");
  assert.equal(store.has("authToken"), false);
});

test("notes : toutes les pages au-delà de 1 000 éléments", async () => {
  let n = 0;
  responder = (url) => {
    n += 1;
    const skip = Number(new URL(url).searchParams.get("skip"));
    const size = skip === 0 ? 1000 : 500;
    return json(Array.from({ length: size }, (_, i) => ({ id: `${skip + i}` })), { "X-Total-Count": "1500" });
  };
  const notes = await api.scientificApi.getNotes();
  assert.equal(notes.length, 1500);
  assert.equal(n, 2);
  assert.match(path(1), /skip=1000&limit=1000$/);
});

test("export Excel : fetch authentifié et nom de fichier de Content-Disposition", async () => {
  responder = () => new Response(new Blob(["xlsx"]), {
    status: 200, headers: { "Content-Disposition": 'attachment; filename="seminaristes_20261027_0930.xlsx"' },
  });
  const { blob, filename } = await api.adminApi.exportSeminaristesXlsx();
  assert.equal(calls[0].headers.authorization, "Bearer tok-fictif");
  assert.equal(filename, "seminaristes_20261027_0930.xlsx");
  assert.equal(await blob.text(), "xlsx");
  assert.equal(api.filenameFromContentDisposition("attachment; filename*=UTF-8''s%C3%A9minaristes.xlsx"), "séminaristes.xlsx");
  assert.equal(api.filenameFromContentDisposition(null), null);
});

test("bulletins : recalcul de l'année et formateurs / visiteurs / membres CO", async () => {
  await api.bulletinsApi.recalculer("AnNour25");
  await api.formateursApi.delete("f1");
  await api.visiteursApi.list(2, 20, "Fictif");
  await api.coApi.updateMembreCO("co1", { statut: "Responsable" });
  assert.equal(path(0), "/scientific/bulletins/recalculer?annee_scolaire=AnNour25");
  assert.equal(calls[0].method, "POST");
  assert.equal(path(1), "/scientific/f1");
  assert.equal(calls[1].method, "DELETE");
  assert.equal(path(2), "/visiteurs?skip=20&limit=20&search=Fictif");
  assert.equal(calls[3].method, "PUT");
});

test("code mort retiré (routes inexistantes)", () => {
  assert.equal("getStats" in api.scientificApi, false);
  assert.equal("updateSeminaristeNiveau" in api.scientificApi, false);
});

test("paramètres de chemin encodés : scientifique, utilisateurs, avis (F-23)", async () => {
  const id = "a/../b?x=1#c"; // identifiant fictif contenant des caractères réservés
  const enc = "a%2F..%2Fb%3Fx%3D1%23c";
  await api.scientificApi.updateSeminariste(id, {});
  await api.scientificApi.deleteSeminariste(id);
  await api.scientificApi.updateNote(id, {});
  await api.scientificApi.deleteNote(id);
  await api.scientificApi.getBulletinByNumero(id);
  await api.scientificApi.getBulletins("M&statut=x");
  await api.usersApi.updateUser(id, {});
  await api.usersApi.toggleUserStatus(id, false);
  await api.feedbackApi.getOne(id);
  await api.feedbackApi.delete(id);
  assert.deepEqual(calls.map((c, i) => `${c.method} ${path(i)}`), [
    `PUT /admin/seminaristes/${enc}`,
    `DELETE /admin/seminaristes/${enc}`,
    `PUT /scientific/notes/${enc}`,
    `DELETE /scientific/notes/${enc}`,
    `GET /scientific/bulletins/${enc}`,
    "GET /scientific/bulletins?matricule=M%26statut%3Dx",
    `PUT /admin/users/${enc}`,
    `PATCH /admin/users/${enc}`,
    `GET /admin/feedback/${enc}`,
    `DELETE /admin/feedback/${enc}`,
  ]);
});
