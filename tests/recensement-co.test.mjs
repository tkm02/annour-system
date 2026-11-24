// Tests de lib/recensement-co.ts : filtres et export, libellés, silhouettes, motif de rejet, formulaire de correction,
// comparaison des cas à vérifier. Données fictives uniquement.
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  ALL, FILTRES_VIDES, buildExportParams, buildFilterParams, buildListParams, champsIdentiques, correctionApiErrors,
  diffCorrection, exportFilename, formFromDetail, formatDateNaissance, hasActiveFilters, motifCorrespondanceLabel,
  normaliserTelephone, qualiteLabel, sexeLabel, silhouetteFor, statutLabel, toDateInput, typeLabel, validateCorrection,
  validateMotif, changementsFusion, comparerCandidat, correctionModifiee, nombreFiltresActifs, pageRecalee,
  premierChampEnErreur, santeEffacee, qualitesPourCommission,
} from "../lib/recensement-co.ts";

const detail = (over = {}) => ({
  id: "p1", personne_id: "pers1", nom: "FICTIF", prenoms: "Awa Test", sexe: "F",
  date_naissance: "2001-03-09T00:00:00Z", telephone: "0700000001", email: "awa.fictif@example.org",
  photo_url: null, commission: "Santé", qualite: "membre", type: "ancien", statut_fiche: "soumise",
  soumise_at: "2026-11-20T10:00:00Z", validee_at: null, allergies: "Arachide", antecedents_medicaux: null,
  consentement_at: "2026-11-20T10:00:00Z", validee_par: null, motif_rejet: null, historique: [],
  ...over,
});
const TODAY = new Date(2026, 10, 21);

test("filtres : « tous » et valeurs inconnues ignorés, recherche nettoyée, pagination skip/limit", () => {
  assert.deepEqual(buildFilterParams(FILTRES_VIDES), {});
  assert.equal(hasActiveFilters(FILTRES_VIDES), false);
  const filtres = { q: "  Awa  ", commission: "Santé", qualite: "responsable_adjoint", sexe: "F", type: "nouveau", statut: "a_verifier" };
  assert.deepEqual(buildFilterParams(filtres),
    { q: "Awa", commission: "Santé", qualite: "responsable_adjoint", sexe: "F", type: "nouveau", statut: "a_verifier" });
  assert.equal(hasActiveFilters(filtres), true);
  const invalides = { q: "   ", commission: ALL, qualite: "chef", sexe: "X", type: "autre", statut: "toString" };
  assert.deepEqual(buildFilterParams(invalides), {});
  assert.equal(buildFilterParams({ ...FILTRES_VIDES, q: "a".repeat(150) }).q.length, 100);
  assert.deepEqual(buildListParams(FILTRES_VIDES, 3), { skip: 40, limit: 20 });
  assert.deepEqual(buildListParams({ ...FILTRES_VIDES, sexe: "M" }, 0, 50), { sexe: "M", skip: 0, limit: 50 });
});

test("export : format + mêmes filtres, sans pagination ; nom de repli", () => {
  assert.deepEqual(buildExportParams("xlsx", { ...FILTRES_VIDES, statut: "validee", q: "Fictif" }),
    { format: "xlsx", q: "Fictif", statut: "validee" });
  assert.deepEqual(buildExportParams("csv", FILTRES_VIDES), { format: "csv" });
  assert.equal(exportFilename("csv", "ANNOUR26"), "membres_co_ANNOUR26.csv");
  assert.equal(exportFilename("xlsx", null), "membres_co.xlsx");
  assert.equal(exportFilename("csv", "../x y"), "membres_co_xy.csv");
});

test("libellés : statut, qualité, type, sexe, motif ; valeur inconnue affichée telle quelle", () => {
  assert.equal(statutLabel("a_verifier"), "À vérifier");
  assert.equal(statutLabel("validee"), "Validée");
  assert.equal(qualiteLabel("responsable_adjoint"), "Responsable adjoint");
  assert.equal(qualiteLabel("membre"), "Membre");
  assert.equal(typeLabel("ancien"), "Ancien");
  assert.equal(sexeLabel("F"), "Femme");
  assert.equal(sexeLabel(null), "—");
  assert.equal(statutLabel("archivee"), "archivee");
  assert.equal(qualiteLabel("constructor"), "constructor");
  assert.match(motifCorrespondanceLabel("telephone"), /téléphone/);
});

test("libellés des motifs de correspondance : tous ceux produits par l'API, sans date de naissance", () => {
  for (const motif of ["multiple", "partielle", "complete", "tentatives", "telephone", "email"]) {
    assert.notEqual(motifCorrespondanceLabel(motif), motif, motif);
  }
  assert.doesNotMatch(motifCorrespondanceLabel("partielle"), /naissance/);
  assert.match(motifCorrespondanceLabel("complete"), /rattachement à confirmer/);
});

test("silhouette : homme si M, femme voilée si F, neutre sinon", () => {
  assert.equal(silhouetteFor("M"), "homme");
  assert.equal(silhouetteFor("f"), "femme");
  for (const value of [null, undefined, "", "inconnu", "X"]) assert.equal(silhouetteFor(value), "neutre", String(value));
});

test("dates de naissance sans décalage de fuseau, téléphone normalisé comme le serveur", () => {
  assert.equal(toDateInput("2001-03-09T00:00:00Z"), "2001-03-09");
  assert.equal(toDateInput(null), "");
  assert.equal(formatDateNaissance("2001-03-09T00:00:00+00:00"), "09/03/2001");
  assert.equal(formatDateNaissance(undefined), "—");
  assert.equal(normaliserTelephone("+225 07 00 00 00 01"), "0700000001");
  assert.equal(normaliserTelephone("00225 0700000001"), "0700000001");
  assert.equal(normaliserTelephone("07 00 00 01"), "07000001");
  assert.equal(normaliserTelephone("123"), null);
});

test("motif de rejet : 3 à 500 caractères après suppression des espaces", () => {
  assert.ok(validateMotif(""));
  assert.ok(validateMotif("  ab  "));
  assert.equal(validateMotif("abc"), null);
  assert.equal(validateMotif("x".repeat(500)), null);
  assert.ok(validateMotif("x".repeat(501)));
});

test("correction : formulaire initial, aucun champ invalide, aucun envoi si rien ne change", () => {
  const initial = formFromDetail(detail());
  assert.equal(initial.date_naissance, "2001-03-09");
  assert.equal(initial.antecedents_medicaux, "");
  assert.deepEqual(validateCorrection(initial, initial, TODAY), {});
  assert.deepEqual(diffCorrection(initial, initial), {});
  const incomplete = formFromDetail(detail({ sexe: null, date_naissance: null, email: null, telephone: null }));
  assert.equal(incomplete.sexe, "");
  assert.deepEqual(validateCorrection(incomplete, incomplete, TODAY), {});
});

test("correction : règles de validation alignées sur le serveur", () => {
  const initial = formFromDetail(detail());
  const errors = validateCorrection({
    ...initial, nom: " ", prenoms: "--", date_naissance: "2020-01-01", telephone: "12345",
    email: "pas-un-email", commission: "", qualite: "chef", allergies: "x".repeat(1001),
  }, initial, TODAY);
  assert.deepEqual(Object.keys(errors).sort(),
    ["allergies", "commission", "date_naissance", "email", "nom", "prenoms", "qualite", "telephone"]);
  // Un champ déjà renseigné ne peut pas être vidé (le serveur l'ignorerait ou effacerait la date)
  const vide = validateCorrection({ ...initial, date_naissance: "", sexe: "", telephone: "", email: "" }, initial, TODAY);
  assert.deepEqual(Object.keys(vide).sort(), ["date_naissance", "email", "sexe", "telephone"]);
  assert.ok(validateCorrection({ ...initial, date_naissance: "2001-02-30" }, initial, TODAY).date_naissance);
  assert.equal(validateCorrection({ ...initial, telephone: "+225 05 00 00 00 02" }, initial, TODAY).telephone, undefined);
  assert.ok(validateCorrection({ ...initial, telephone: "07 00 00 01" }, initial, TODAY).telephone, "8 chiffres refusés");
});

test("correction : seuls les champs modifiés sont envoyés, santé effaçable par chaîne vide", () => {
  const initial = formFromDetail(detail());
  const update = diffCorrection({
    ...initial, nom: " FICTIF ", prenoms: "Awa Marie", email: "AWA.Autre@Example.org", qualite: "responsable",
    allergies: "", antecedents_medicaux: "Asthme", date_naissance: "2001-03-10", sexe: "F",
  }, initial);
  assert.deepEqual(update, {
    prenoms: "Awa Marie", email: "awa.autre@example.org", date_naissance: "2001-03-10", qualite: "responsable",
    allergies: "", antecedents_medicaux: "Asthme",
  });
  const complete = formFromDetail(detail({ sexe: null }));
  // Commission changée : la qualité retenue l'accompagne (cohérence vérifiée par le serveur)
  assert.deepEqual(diffCorrection({ ...complete, sexe: "M", commission: "Logistique" }, complete),
    { sexe: "M", commission: "Logistique", qualite: "membre" });
});

test("correction : qualité selon la commission (Comité Managérial, commissions sans qualité)", () => {
  const table = {
    "Comité Managérial": ["manager_general", "manager_general_adjoint"],
    Santé: ["membre", "responsable", "responsable_adjoint"],
    Superviseur: [],
  };
  assert.deepEqual(qualitesPourCommission("Comité Managérial", table), ["manager_general", "manager_general_adjoint"]);
  assert.deepEqual(qualitesPourCommission("Superviseur", table), []);
  assert.deepEqual(qualitesPourCommission("Cellule hors référentiel", table), ["membre", "responsable", "responsable_adjoint"]);
  assert.equal(qualitesPourCommission("Santé", null).length, 5); // configuration antérieure : toutes
  assert.equal(qualiteLabel("manager_general_adjoint"), "Manager Général Adjoint");
  assert.equal(qualiteLabel(null), "—");

  const initial = formFromDetail(detail()); // Santé · membre
  const vers = (commission, qualite = initial.qualite) => ({ ...initial, commission, qualite });
  assert.equal(validateCorrection(vers("Comité Managérial"), initial, TODAY, table).qualite,
    "Qualité non valable pour cette commission.");
  assert.equal(validateCorrection(vers("Comité Managérial", ""), initial, TODAY, table).qualite, "La qualité est obligatoire.");
  assert.deepEqual(validateCorrection(vers("Comité Managérial", "manager_general"), initial, TODAY, table), {});
  assert.deepEqual(validateCorrection(vers("Superviseur", ""), initial, TODAY, table), {});
  assert.deepEqual(diffCorrection(vers("Comité Managérial", "manager_general"), initial, table),
    { commission: "Comité Managérial", qualite: "manager_general" });
  // Commission sans qualité : rien n'est envoyé pour la qualité (le serveur la vide)
  assert.deepEqual(diffCorrection(vers("Superviseur", ""), initial, table), { commission: "Superviseur" });
  // Fiche sans qualité (Superviseur) : formulaire vide, retour vers une commission à qualités
  const sansQualite = formFromDetail(detail({ commission: "Superviseur", qualite: null }));
  assert.equal(sansQualite.qualite, "");
  assert.equal(validateCorrection({ ...sansQualite, commission: "Santé" }, sansQualite, TODAY, table).qualite,
    "La qualité est obligatoire.");
});

test("correction : erreurs de l'API (409 email, 422 par champ, autre message)", () => {
  assert.deepEqual(correctionApiErrors({ status: 409, message: "Cet email est déjà utilisé par une autre personne" }),
    { fieldErrors: { email: "Cet email est déjà utilisé par une autre personne" }, formError: null });
  assert.deepEqual(correctionApiErrors({ status: 422, message: "x", fieldErrors: { telephone: "Numéro invalide" } }),
    { fieldErrors: { telephone: "Numéro invalide" }, formError: null });
  assert.deepEqual(correctionApiErrors({ status: 422, message: "Commission inconnue", fieldErrors: {} }),
    { fieldErrors: {}, formError: "Commission inconnue" });
  assert.equal(correctionApiErrors({ status: 0, message: "" }).formError, "Correction impossible.");
  // Clé 422 inconnue du formulaire : message général (rien ne doit être perdu)
  assert.deepEqual(correctionApiErrors({ status: 422, message: "x", fieldErrors: { nom: "Trop long", "query.edition": "Invalide" } }),
    { fieldErrors: { nom: "Trop long" }, formError: "query.edition : Invalide" });
});

test("cas à vérifier : champs identiques (accents, casse, ordre des mots, indicatif ignorés)", () => {
  const fiche = detail({ nom: "Kouassi", prenoms: "Jean Éric", telephone: "+225 0700000001", email: "JEAN@example.org" });
  const candidat = {
    personne_id: "pers2", nom: "KOUASSI", prenoms: "Eric Jean", telephones: ["0500000000", "0700000001"],
    email: "jean@example.org", date_naissance: "2001-03-09T00:00:00Z", commissions: ["ANNOUR25 : Santé"],
  };
  assert.deepEqual([...champsIdentiques(fiche, candidat)].sort(), ["date_naissance", "email", "nom", "prenoms", "telephone"]);
  const autre = { ...candidat, nom: "Konan", telephones: [], email: null, date_naissance: null };
  assert.deepEqual([...champsIdentiques(fiche, autre)], ["prenoms"]);
});

test("correction : seuls les champs modifiés sont contrôlés (fiche 2025 au téléphone à 8 chiffres)", () => {
  const initial = formFromDetail(detail({ telephone: "07000001", email: "ancien-format", nom: "--" }));
  const form = { ...initial, allergies: "Pollen" };
  assert.deepEqual(validateCorrection(form, initial, TODAY), {});
  assert.deepEqual(diffCorrection(form, initial), { allergies: "Pollen" });
  // Le même champ, une fois modifié, est contrôlé
  assert.ok(validateCorrection({ ...initial, telephone: "07000002" }, initial, TODAY).telephone);
});

test("correction : modification détectée, premier champ en erreur, effacement de données de santé", () => {
  const initial = formFromDetail(detail({ antecedents_medicaux: "Asthme" }));
  assert.equal(correctionModifiee(initial, initial), false);
  assert.equal(correctionModifiee({ ...initial, nom: " FICTIF " }, initial), false, "espaces ignorés");
  assert.equal(correctionModifiee({ ...initial, email: "autre@example.org" }, initial), true);
  assert.equal(premierChampEnErreur({ email: "x", prenoms: "y", allergies: "" }), "prenoms");
  assert.equal(premierChampEnErreur({}), null);
  assert.deepEqual(santeEffacee({ ...initial, allergies: " ", antecedents_medicaux: "Asthme sévère" }, initial), ["allergies"]);
  assert.deepEqual(santeEffacee({ ...initial, allergies: "", antecedents_medicaux: "" }, initial), ["allergies", "antecedents_medicaux"]);
  const sansSante = formFromDetail(detail({ allergies: null }));
  assert.deepEqual(santeEffacee(sansSante, sansSante), []);
});

const candidatFictif = (over = {}) => ({
  personne_id: "pers2", nom: "KOUASSI", prenoms: "Eric Jean", telephones: ["0500000000"], email: "ancien@example.org",
  date_naissance: "2000-01-01T00:00:00Z", commissions: ["ANNOUR25 : Santé"], ...over,
});

test("cas à vérifier : repères identique / différent / absent", () => {
  const fiche = detail({ nom: "Kouassi", prenoms: "Jean Éric", telephone: "0700000001", email: null, date_naissance: null });
  assert.deepEqual(comparerCandidat(fiche, candidatFictif({ email: null, date_naissance: null })), {
    nom: "identique", prenoms: "identique", telephone: "different", email: null, date_naissance: null,
  });
  assert.equal(comparerCandidat(fiche, candidatFictif()).email, "different");
  assert.equal(comparerCandidat({ ...fiche, telephone: null }, candidatFictif({ telephones: [] })).telephone, null);
});

test("fusion : liste « champ : ancien → nouveau » des champs d'identité remplacés", () => {
  const fiche = detail({ nom: "KOUASSI", prenoms: "Jean Eric", sexe: "M", telephone: "0700000001", email: null,
    date_naissance: "2001-03-09T00:00:00Z" });
  const changes = changementsFusion(fiche, candidatFictif());
  assert.deepEqual(changes, [
    { champ: "prenoms", libelle: "Prénoms", avant: "Eric Jean", apres: "Jean Eric" },
    { champ: "date_naissance", libelle: "Date de naissance", avant: "01/01/2000", apres: "09/03/2001" },
    { champ: "sexe", libelle: "Sexe", avant: undefined, apres: "Homme" },
    { champ: "telephone", libelle: "Téléphone", avant: "0500000000", apres: "0700000001" },
    { champ: "email", libelle: "Email", avant: "ancien@example.org", apres: null },
  ]);
  const meme = changementsFusion({ ...fiche, sexe: null, prenoms: "Eric Jean", email: "ANCIEN@example.org",
    date_naissance: "2000-01-01T00:00:00Z", telephone: "+225 05 00 00 00 00" }, candidatFictif());
  assert.deepEqual(meme, []);
});

test("pagination recalée quand la page courante devient vide ; compteur des filtres mobiles", () => {
  assert.equal(pageRecalee(3, 41, 0), 3, "page 3 non vide en théorie : inchangée seulement si total le permet");
  assert.equal(pageRecalee(3, 40, 0), 2);
  assert.equal(pageRecalee(3, 0, 0), 1);
  assert.equal(pageRecalee(2, 40, 5), 2);
  assert.equal(pageRecalee(1, 0, 0), 1);
  assert.equal(nombreFiltresActifs(FILTRES_VIDES), 0);
  assert.equal(nombreFiltresActifs({ ...FILTRES_VIDES, q: "Awa", statut: "validee", sexe: "F" }), 2);
});

test("fusion : sexe du candidat comparé quand l'API le communique, repli « non communiqué » sinon", () => {
  const fiche = detail({ nom: "KOUASSI", prenoms: "Eric Jean", sexe: "F", telephone: "0500000000",
    email: "ancien@example.org", date_naissance: "2000-01-01T00:00:00Z" });
  assert.deepEqual(changementsFusion(fiche, candidatFictif({ sexe: "F" })), []);
  assert.deepEqual(changementsFusion(fiche, candidatFictif({ sexe: "M" })),
    [{ champ: "sexe", libelle: "Sexe", avant: "Homme", apres: "Femme" }]);
  assert.deepEqual(changementsFusion(fiche, candidatFictif({ sexe: null })),
    [{ champ: "sexe", libelle: "Sexe", avant: undefined, apres: "Femme" }]);
  assert.deepEqual(changementsFusion({ ...fiche, sexe: null }, candidatFictif({ sexe: "M" })),
    [{ champ: "sexe", libelle: "Sexe", avant: "Homme", apres: null }]);
});
