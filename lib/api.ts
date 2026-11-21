// lib/api.ts - VERSION UNIFIÉE MAMADOU 2025

// URL de l'API configurable par environnement (voir .env.example) ; repli sur l'API de production
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || "https://an-nour-backend-5mf0.onrender.com/api/v1"
).replace(/\/+$/, "");

let cachedSeminaristes: any = null;

// ✅ INTERFACES PRINCIPALES
interface ApiResponse<T> {
  total: number;
  page: number;
  limit: number;
  data: T[];
}

export interface StaticMetadata {
  niveaux_academiques: Record<string, string[]>;
  communes: string[];
  dortoirs: Record<string, Array<{ code: string; name: string }>>;
}

// ✅ SEMINARISTE COMPLET
export interface Seminariste {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  sexe: string;
  age: number;
  niveau_academique: string;
  niveau: string | null;              // ✅ NIVEAU TEST
  dortoir: string;
  photo_url: string | null;
  payment_status?: string;            // en_attente, verifie, rejete, erreur, completed
  commune_habitation?: string;
  contact_parent?: string;
  contact_seminariste?: string;
  allergie?: string;
  antecedent_medical?: string;
  dortoir_code?: string;
  note_entree?: number | null;        // ✅ NOTE DU TEST D'ENTRÉE
  /** TAF lot 2 : matricule de l'inscription de l'édition précédente (absent tant que l'API ne le renvoie pas) */
  matricule_precedent?: string | null;
  /** TAF lot 2 : « inscrit(e) l'an dernier » déclaré sans correspondance complète, rattachement manuel attendu */
  reinscription_a_verifier?: boolean;
}

// ✅ CREATE SEMINARISTE
export interface CreateSeminariste {
  nom: string;
  prenom: string;
  sexe: string;
  age: number;
  commune_habitation: string;
  niveau_academique: string;
  dortoir_code: string;
  contact_parent: string;
  contact_seminariste: string;
  allergie: string;
  antecedent_medical: string;
}

// ✅ UPDATE SEMINARISTE
export interface UpdateSeminariste {
  nom?: string;
  prenom?: string;
  sexe?: string;
  age?: number;
  commune_habitation?: string;
  niveau_academique?: string;
  niveau?: string;
  dortoir_code?: string;
  contact_parent?: string;
  contact_seminariste?: string;
  allergie?: string;
  antecedent_medical?: string;
}

// ✅ TEST ENTRÉE
export interface TestScore {
  matricule: string;
  note: number;              // ✅ Changé de note_test → note
  niveau: string;            // ✅ Ajouté
  created_by?: string;       // ✅ Ajouté optionnel
}

// ✅ NOTES
export interface Note {
  id: string;
  matricule: string;
  nom_seminariste?: string | null;
  prenom_seminariste?: string | null;
  note: number;
  observation: string | null;
  type: string | null;    // peut être vide
  libelle: string | null; // "note1".."note4", peut être vide
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface UpdateNote {
  note: number;
  observation: string;
}

export interface CreateNote {
  matricule: string;
  note: number;
  type_evaluation: string;
  libelle: string;
  observation?: string;
}

// ✅ BULLETINS
export interface Bulletin {
  id: string;
  numero: string;
  matricule: string;
  nom_seminariste: string | null;
  prenom_seminariste: string | null;
  niveau: string | null;
  niveau_academique: string | null;
  annee_scolaire: string;
  moyenne_generale: number;
  total_coefficient: number;
  rang: number | null;
  effectif_classe: number | null;
  mention: string | null;
  observations: string | null;
  generated_at: string;
  generated_by: string;
}

export interface BulletinGenerate {
  matricule: string;
  annee_scolaire?: string;
  observations?: string;
}

export interface BulletinDetail {
  bulletin: Bulletin;
  notes: Note[];
  seminariste: Seminariste;
}

// ✅ USERS & AUTH
export interface User {
  id: string;
  username: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  is_active: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateUserPayload {
  email: string;
  username: string;
  password: string;
  nom: string;
  prenom: string;
  role: string;
}

// ✅ MEMBRE CO (Comité d'Organisation)
export interface MembreCO {
  id: string;
  nom: string;
  prenoms: string;
  contact: string;
  commission: string;
  statut: string;
  photo_url: string;
  allergies: string;
  antecedent_medical: string;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginCredentials {
  identifier: string;
  password: string;
}

// ✅ ERREURS API — format serveur {"detail": texte | [{loc, msg}], "request_id"?}
export type FieldErrors = Record<string, string>;

export class ApiError extends Error {
  status: number;
  detail: unknown;
  /** Erreurs de validation 422 par champ, clé = chemin sans "body" (ex. "personalInfo.nom") */
  fieldErrors: FieldErrors;
  /** 429 : délai en secondes avant de réessayer (en-tête Retry-After) */
  retryAfter: number | null;
  /** 500 : identifiant à transmettre au support */
  requestId: string | null;

  constructor(status: number, message: string, init: Partial<Pick<ApiError, "detail" | "fieldErrors" | "retryAfter" | "requestId">> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = init.detail ?? null;
    this.fieldErrors = init.fieldErrors ?? {};
    this.retryAfter = init.retryAfter ?? null;
    this.requestId = init.requestId ?? null;
  }
}

const DEFAULT_ERROR_MESSAGES: Record<number, string> = {
  400: "Requête invalide.",
  401: "Session expirée, veuillez vous reconnecter.",
  403: "Accès refusé.",
  404: "Ressource introuvable.",
  409: "Conflit avec des données existantes.",
  413: "Fichier trop volumineux (5 Mo maximum).",
  422: "Données invalides.",
};

const cleanValidationMessage = (msg: string) => msg.replace(/^Value error,\s*/i, "");

/** Construire une ApiError lisible à partir du statut, du corps et de l'en-tête Retry-After. */
export function buildApiError(status: number, bodyText: string, retryAfterHeader: string | null = null): ApiError {
  let body: any = null;
  try {
    body = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    body = null;
  }
  const detail = body && typeof body === "object" ? body.detail : undefined;
  const requestId = body && typeof body.request_id === "string" ? body.request_id : null;

  if (status === 429) {
    const seconds = Number.parseInt(retryAfterHeader ?? "", 10);
    const retryAfter = Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
    const message = retryAfter !== null
      ? `Trop de requêtes. Réessayez dans ${retryAfter} s.`
      : "Trop de requêtes. Réessayez dans quelques instants.";
    return new ApiError(status, message, { detail, retryAfter });
  }

  if (status >= 500) {
    const message = requestId
      ? `Erreur interne du serveur. Référence à transmettre au support : ${requestId}`
      : "Erreur interne du serveur. Veuillez réessayer plus tard.";
    return new ApiError(status, message, { detail, requestId });
  }

  if (Array.isArray(detail)) {
    const fieldErrors: FieldErrors = {};
    const lines: string[] = [];
    for (const item of detail) {
      const path = Array.isArray(item?.loc)
        ? item.loc.filter((part: unknown) => part !== "body").join(".")
        : "";
      const msg = cleanValidationMessage(String(item?.msg ?? "Valeur invalide"));
      if (path && !fieldErrors[path]) fieldErrors[path] = msg;
      lines.push(path ? `${path} : ${msg}` : msg);
    }
    return new ApiError(status, lines.join("\n") || DEFAULT_ERROR_MESSAGES[422], { detail, fieldErrors });
  }

  const message = typeof detail === "string" && detail.trim()
    ? detail
    : DEFAULT_ERROR_MESSAGES[status] ?? `Erreur ${status}.`;
  return new ApiError(status, message, { detail });
}

// ✅ API REQUEST GÉNÉRIQUE
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await rawRequest(endpoint, options);
  return response.json();
}

/** Liste bornée (skip/limit) : contenu + total complet lu dans l'en-tête X-Total-Count. */
export async function apiRequestWithTotal<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T[]; total: number }> {
  const response = await rawRequest(endpoint, options);
  const data = (await response.json()) as T[];
  const header = Number.parseInt(response.headers.get("X-Total-Count") ?? "", 10);
  return { data, total: Number.isFinite(header) ? header : data.length };
}

export const MAX_PAGE_SIZE = 1000;

/** Toutes les pages d'une liste skip/limit (au-delà de la borne serveur de 1 000 éléments). */
export async function fetchAllPages<T>(
  endpoint: string,
  params: Record<string, string | number | boolean | null | undefined> = {}
): Promise<T[]> {
  const all: T[] = [];
  let total = Infinity;
  for (let skip = 0; skip < total; skip += MAX_PAGE_SIZE) {
    const page = await apiRequestWithTotal<T>(`${endpoint}${toQuery({ ...params, skip, limit: MAX_PAGE_SIZE })}`);
    all.push(...page.data);
    total = page.total;
    if (page.data.length === 0) break;
  }
  return all;
}

/** Téléchargement authentifié (un lien <a href> n'enverrait pas le token). */
export async function apiBlob(endpoint: string): Promise<{ blob: Blob; filename: string | null }> {
  const response = await rawRequest(endpoint, { headers: { Accept: "*/*" } });
  return { blob: await response.blob(), filename: filenameFromContentDisposition(response.headers.get("Content-Disposition")) };
}

export function filenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8) {
    try {
      return decodeURIComponent(utf8[1].trim());
    } catch {
      /* repli sur filename= */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1].trim() : null;
}

/** Paramètres de requête sans les valeurs vides. */
export function toQuery(params: Record<string, string | number | boolean | null | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") query.append(key, String(value));
  }
  const text = query.toString();
  return text ? `?${text}` : "";
}

async function rawRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = authApi.getToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const config: RequestInit = { ...options, headers };

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  } catch {
    throw new ApiError(0, "Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.");
  }

  // Token expiré, invalide ou compte supprimé : fermer la session et revenir à la connexion
  if (response.status === 401 && token) {
    authApi.logout();
    if (typeof window !== 'undefined' && window.location.pathname !== "/") {
      window.location.href = "/";
    }
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw buildApiError(response.status, errorText, response.headers.get("Retry-After"));
  }

  return response;
}

// ✅ INSCRIPTIONS (circuit public : création → envoi du reçu)
export interface Dortoir {
  code: string;
  name: string;
  capacity: number;
  current_count: number;
  available: number;
  gender: string;
}

export interface RegistrationPayload {
  personalInfo: {
    nom: string;
    prenom: string;
    sexe: "M" | "F";
    age: string;
    communeHabitation: string;
    communeAutre: string;
    niveauAcademique: string;
    contactParent: string;
    contactSeminariste: string;
    dateNaissance?: string;
  };
  dormitoryInfo: { dortoir: string; dortoirId: string };
  healthInfo: { allergie: string; antecedentMedical: string };
  // amount est ignoré par le serveur (tarif fixé côté serveur) mais reste requis par le schéma
  paymentInfo: { transactionId: string; amount: number };
}

export interface RegistrationCreated {
  matricule: string;
  nom: string;
  prenom: string;
  sexe: string;
  age: number;
  niveau_academique: string;
  commune_habitation: string;
  dortoir_code: string;
  dortoir_name?: string | null;
  allergie?: string | null;
  antecedent_medical?: string | null;
  payment_status: string;
  /** Jeton d'envoi du reçu : à garder en mémoire uniquement (jamais journalisé ni stocké) */
  verification_token: string;
}

export type ReceiptStatus = "verifie" | "rejete" | "erreur" | "en_attente";

export interface ReceiptResult {
  matricule: string;
  statut: ReceiptStatus | string;
  message: string | null;
}

export interface RegistrationsStatus {
  open: boolean;
  fee: number;
}

export const registrationsApi = {
  getStatus: () => apiRequest<RegistrationsStatus>("/registrations/status"),

  getDortoirs: (sexe: "M" | "F") =>
    apiRequest<Dortoir[]>(`/registrations/dortoirs?sexe=${encodeURIComponent(sexe)}`),

  create: (payload: RegistrationPayload) =>
    apiRequest<RegistrationCreated>("/registrations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** Envoi (ou renvoi) du reçu pour une inscription déjà créée : ne recrée jamais l'inscription. */
  submitReceipt: (matricule: string, token: string, file: Blob, filename = "recu.jpg") => {
    const form = new FormData();
    form.append("token", token);
    form.append("file", file, filename);
    return apiRequest<ReceiptResult>(`/registrations/${encodeURIComponent(matricule)}/receipt`, {
      method: "POST",
      body: form,
    });
  },
};

// ✅ SCIENTIFIC API - UNIFIÉ
export const scientificApi = {
  // 📊 SÉMINARISTES (CACHE 5min)
  // 📊 SÉMINARISTES (CACHE 5min)
  getSeminaristes: async (page = 1, limit = 100, filters?: any) => {
    // ✅ MODE "FETCH ALL" (Si limit > 100, on charge tout)
    if (limit > 100) {
      if (cachedSeminaristes && cachedSeminaristes.limit >= 10000) {
        return cachedSeminaristes;
      }
      
      // 1. Première page pour avoir le total
      const firstBatch = await apiRequest<ApiResponse<Seminariste>>(
        `/scientific/seminaristes?page=1&limit=100${filters ? '&' + new URLSearchParams(filters) : ''}`
      );
      
      let allData = [...firstBatch.data];
      const total = firstBatch.total;
      const totalPages = Math.ceil(total / 100);

      // 2. Charger le reste en parallèle
      if (totalPages > 1) {
        const promises = [];
        for (let p = 2; p <= totalPages; p++) {
          promises.push(
            apiRequest<ApiResponse<Seminariste>>(
              `/scientific/seminaristes?page=${p}&limit=100${filters ? '&' + new URLSearchParams(filters) : ''}`
            )
          );
        }
        
        const results = await Promise.all(promises);
        results.forEach(res => {
          allData = [...allData, ...res.data];
        });
      }

      const result = {
        total: total,
        page: 1,
        limit: total, // On indique que la limite est le total
        data: allData,
      };

      cachedSeminaristes = result;
      setTimeout(() => { cachedSeminaristes = null; }, 5 * 60 * 1000);
      return result;
    }

    // ✅ MODE PAGINATION SHANDARD (Max 100 par le backend)
    // Attention: Le backend rejette > 100, donc on s'assure de ne pas dépasser
    const safeLimit = Math.min(limit, 100);
    
    // Note: On ne cache PAS les pages individuelles pour éviter les bugs de pagination
    // sauf si on implémente un cache par clé (page+limit). 
    // Pour l'instant, on désactive le cache partiel pour la sécurité.
    
    const data = await apiRequest<ApiResponse<Seminariste>>(
      `/scientific/seminaristes?page=${page}&limit=${safeLimit}${filters ? '&' + new URLSearchParams(filters) : ''}`
    );
    return data;
  },
  // ✅ CRUD SÉMINARISTES
  createSeminariste: async (data: CreateSeminariste) => {
    return apiRequest<Seminariste>('/admin/seminaristes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateSeminariste: async (matricule: string, data: Partial<UpdateSeminariste>) => {
    return apiRequest<Seminariste>(`/admin/seminaristes/${matricule}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  deleteSeminariste: async (matricule: string) => {
    return apiRequest(`/admin/seminaristes/${matricule}`, {
      method: 'DELETE',
    });
  },
  // ✅ TEST D'ENTRÉE
   saveTestEntree: async (data: TestScore) => {
    
    // ✅ CONSTRUIRE URL AVEC QUERY PARAMS
    const params = new URLSearchParams({
      matricule: data.matricule,
      note: data.note.toString(),
      niveau: data.niveau,
    });
    
    return apiRequest(`/scientific/test-entree?${params.toString()}`, {
      method: 'POST',
      // ✅ PAS DE BODY (ou body vide)
    });
  },

  // 📝 NOTES
  // F-A6 : le serveur borne la liste (1 000 max) et renvoie le total dans X-Total-Count
  getNotes: async (matricule?: string) => fetchAllPages<Note>('/scientific/notes', { matricule }),
  
  getNotesByLibelle: async (libelle: string) => {
    const allNotes = await apiRequest<Note[]>('/scientific/notes');
    return allNotes.filter(n => n.libelle === libelle);
  },
  
  createNote: async (data: CreateNote) => {
    // ✅ FastAPI expects query params, not JSON body
    const params = new URLSearchParams({
      matricule: data.matricule,
      note: data.note.toString(),
      libelle: data.libelle || 'note1',
    });
    
    return apiRequest<Note>(`/scientific/notes?${params.toString()}`, {
      method: 'POST',
    });
  },
  
  updateNote: async (id: string, data: UpdateNote) => {
    return apiRequest<Note>(`/scientific/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  deleteNote: async (id: string) => {
    return apiRequest(`/scientific/notes/${id}`, {
      method: 'DELETE',
    });
  },
  
  deleteNotesByLibelle: async (libelle: string) => {
    const notesToDelete = await scientificApi.getNotesByLibelle(libelle);
    const deletePromises = notesToDelete.map(note => scientificApi.deleteNote(note.id));
    await Promise.all(deletePromises);
    return notesToDelete.length;
  },

  // 📈 STATS
  getScientificStats: () => apiRequest('/scientific/stats/scientifiques'),

  // 📜 BULLETINS
  generateBulletin: async (data: BulletinGenerate) => {
    return apiRequest<Bulletin>('/scientific/bulletins/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  getBulletins: async (matricule?: string) => {
    const params = matricule ? `?matricule=${matricule}` : '';
    return apiRequest<Bulletin[]>(`/scientific/bulletins${params}`);
  },
  
  getBulletinByNumero: async (numero: string) => {
    return apiRequest<BulletinDetail>(`/scientific/bulletins/${numero}`);
  },

  // 📋 MÉTADONNÉES
  getStaticMetadata: async () => {
    return apiRequest<StaticMetadata>('/admin/static-metadata');
  },

  // 🔄 CACHE
  invalidateCache: () => {
    cachedSeminaristes = null;
  },
};

// ✅ DASHBOARD API
export const dashboardApi = {
  getDashboardData: async () => {
    const seminaristesResponse = await scientificApi.getSeminaristes(1, 10000);
    return {
      seminaristes: seminaristesResponse.data,
      total: seminaristesResponse.total,
    };
  },
};

// ✅ AUTH API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiRequest<LoginResponse>("/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({
        identifier: credentials.identifier,
        password: credentials.password,
      }),
    });
    
    if (typeof window !== 'undefined') {
      localStorage.setItem("authToken", response.access_token);
      localStorage.setItem("tokenType", response.token_type);
      localStorage.setItem("user", JSON.stringify(response.user));
    }
    return response;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("authToken");
      localStorage.removeItem("tokenType");
      localStorage.removeItem("user");
    }
  },

  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  getToken: (): string | null => {
    return typeof window !== 'undefined' ? localStorage.getItem("authToken") : null;
  },

  isAuthenticated: (): boolean => !!authApi.getToken(),

  /** F-A3 : fermer les sessions sur tous les appareils, puis effacer la session locale */
  logoutAll: async () => {
    try {
      await apiRequest<{ message: string }>("/admin/auth/logout-all", { method: "POST" });
    } finally {
      authApi.logout();
    }
  },
};

// ✅ USERS API
export const usersApi = {
  // Le serveur pagine par skip/limit et renvoie le total dans X-Total-Count
  getUsers: async (page = 1, limit = 100, filters: { role?: string; is_active?: boolean } = {}) => {
    return apiRequestWithTotal<User>(
      `/admin/users${toQuery({ skip: (page - 1) * limit, limit, role: filters.role, is_active: filters.is_active })}`
    );
  },

  revokeSessions: async (id: string) => {
    return apiRequest<{ message: string }>(`/admin/users/${encodeURIComponent(id)}/revoke-sessions`, { method: "POST" });
  },
  
  createUser: async (userData: CreateUserPayload) => {
    return apiRequest<User>("/admin/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  },
  
  updateUser: async (id: string, userData: Partial<CreateUserPayload>) => {
    return apiRequest<User>(`/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  },
  
  toggleUserStatus: async (id: string, isActive: boolean) => {
    return apiRequest<User>(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: isActive }),
    });
  },
};

// ✅ FEEDBACK API
export interface Feedback {
  id: string;
  sexe: string;
  nom: string;
  note_globale: number;
  qualite_nourriture: number;
  confort_dortoirs: number;
  qualite_formations: number;
  qualite_contenu: number;
  note_organisation: number;
  duree_appropriee: boolean;
  recommande: boolean;
  points_apprecies: string;
  suggestions: string;
  created_at: string;
}

export interface FeedbackAnalytics {
  total_responses: number;
  moyenne_globale: number;
  moyenne_organisation: number;
  moyenne_nourriture: number;
  moyenne_dortoirs: number;
  moyenne_formations: number;
  moyenne_contenu: number;
  repartition_sexe: Record<string, number>;
  repartition_note_globale: Record<string, number>;
  pourcentage_duree_ok: number;
  pourcentage_recommande: number;
  derniers_points_apprecies: string[];
  dernieres_suggestions: string[];
}

export const feedbackApi = {
  getAnalytics: async () => {
    return apiRequest<FeedbackAnalytics>("/admin/feedback/analytics");
  },

  getAll: async (page = 1, limit = 50, filters?: { sexe?: string; recommande?: boolean }) => {
    const queryParams = new URLSearchParams({
      skip: ((page - 1) * limit).toString(),
      limit: limit.toString(),
    });

    if (filters?.sexe) queryParams.append("sexe", filters.sexe);
    if (filters?.recommande !== undefined) queryParams.append("recommande", filters.recommande.toString());

    return apiRequest<{ total: number; data: Feedback[] }>(`/admin/feedback?${queryParams.toString()}`);
  },

  getOne: async (id: string) => {
    return apiRequest<Feedback>(`/admin/feedback/${id}`);
  },

  delete: async (id: string) => {
    return apiRequest(`/admin/feedback/${id}`, {
      method: "DELETE",
    });
  },
};

// ✅ CO API (Comité d'Organisation)
export type MembreCOUpdate = Partial<Pick<MembreCO, "nom" | "prenoms" | "contact" | "commission" | "statut" | "allergies" | "antecedent_medical">>;

export const coApi = {
  getMembresCO: async (filters: { commission?: string; statut?: string; skip?: number; limit?: number } = {}) => {
    return apiRequest<{ total: number; data: MembreCO[] }>(`/admin/membres-co${toQuery(filters)}`);
  },
  updateMembreCO: async (id: string, data: MembreCOUpdate) => {
    return apiRequest<MembreCO>(`/admin/membres-co/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(data) });
  },
  deleteMembreCO: async (id: string) => {
    return apiRequest<{ message: string }>(`/admin/membres-co/${encodeURIComponent(id)}`, { method: "DELETE" });
  },
};

// ✅ RECENSEMENT CO (édition en cours, rôle admin) — contrat : Backend docs/features/recensement-co.md
export type QualiteCO = "membre" | "responsable" | "responsable_adjoint";
export type StatutFicheCO = "soumise" | "a_verifier" | "validee" | "rejetee";
export type TypeMembreCO = "ancien" | "nouveau";
export type SexeCO = "M" | "F";

/** Ligne de liste (sans données médicales) ; dates ISO 8601, champs `null` possibles (fiches 2025 incomplètes). */
export interface ParticipationCOListe {
  id: string;
  personne_id: string;
  nom: string;
  prenoms: string;
  sexe: string | null;
  date_naissance: string | null;
  telephone: string | null;
  email: string | null;
  photo_url: string | null;
  commission: string;
  qualite: string;
  type: string;
  statut_fiche: string;
  soumise_at: string | null;
  validee_at: string | null;
}

export interface HistoriqueParticipationCO {
  edition: string | null;
  commission: string;
  qualite: string;
}

/** Détail (avec santé ; chaque lecture est journalisée côté serveur). */
export interface ParticipationCODetail extends ParticipationCOListe {
  allergies: string | null;
  antecedents_medicaux: string | null;
  consentement_at: string | null;
  validee_par: string | null;
  motif_rejet: string | null;
  historique: HistoriqueParticipationCO[];
}

/** PATCH : champs partiels de la fiche (`date_naissance` au format AAAA-MM-JJ). */
export interface ParticipationCOUpdate {
  nom?: string;
  prenoms?: string;
  date_naissance?: string;
  sexe?: SexeCO;
  telephone?: string;
  email?: string;
  commission?: string;
  qualite?: QualiteCO;
  allergies?: string;
  antecedents_medicaux?: string;
}

export interface StatsCO {
  edition: string;
  total: number;
  par_statut: Record<string, number>;
  par_commission: Record<string, number>;
  par_type: Record<string, number>;
  par_sexe: Record<string, number>;
  cas_a_verifier: number;
}

export interface CandidatCorrespondanceCO {
  personne_id: string;
  nom: string;
  prenoms: string;
  telephones: string[];
  email: string | null;
  date_naissance: string | null;
  /** « ANNOUR25 : Santé » */
  commissions: string[];
  /** Ajout annoncé par le Backend (comparaison visuelle) : absent tant que l'API ne le renvoie pas */
  photo_url?: string | null;
  /** Ajout annoncé par le Backend : sexe actuel de la personne connue (null ou absent = non communiqué) */
  sexe?: SexeCO | null;
}

export interface CorrespondanceCO {
  id: string;
  motif: string;
  statut: string;
  created_at: string;
  fiche: ParticipationCOListe;
  candidats: CandidatCorrespondanceCO[];
  resolution: string | null;
}

export interface ResolutionCorrespondanceCO {
  decision: "fusion" | "nouveau";
  personne_id?: string;
}

export interface DecisionFicheCO {
  message: string;
  id: string;
  statut_fiche: string;
}

/** Configuration publique du formulaire : commissions actives (valeurs acceptées par le PATCH) et qualités. */
export interface ConfigurationCO {
  ouvert: boolean;
  edition: { code: string; libelle: string } | null;
  commissions: string[];
  commissions_precedentes: string[];
  qualites: Array<{ code: string; libelle: string }>;
}

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export const recensementCoApi = {
  getConfiguration: () => apiRequest<ConfigurationCO>("/co/configuration"),
  getStats: () => apiRequest<StatsCO>("/admin/co/stats"),
  /** Paramètres déjà construits (filtres + skip/limit) : voir buildListParams de lib/recensement-co.ts */
  list: (params: QueryParams) =>
    apiRequest<{ total: number; data: ParticipationCOListe[] }>(`/admin/co/participations${toQuery(params)}`),
  get: (id: string) => apiRequest<ParticipationCODetail>(`/admin/co/participations/${encodeURIComponent(id)}`),
  update: (id: string, data: ParticipationCOUpdate) =>
    apiRequest<ParticipationCODetail>(`/admin/co/participations/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  validate: (id: string) =>
    apiRequest<DecisionFicheCO>(`/admin/co/participations/${encodeURIComponent(id)}/valider`, { method: "POST" }),
  reject: (id: string, motif: string) =>
    apiRequest<DecisionFicheCO>(`/admin/co/participations/${encodeURIComponent(id)}/rejeter`, {
      method: "POST",
      body: JSON.stringify({ motif }),
    }),
  /** Cas à vérifier : tableau + total dans X-Total-Count */
  listCorrespondances: (params: { statut?: "ouverte" | "resolue"; skip?: number; limit?: number } = {}) =>
    apiRequestWithTotal<CorrespondanceCO>(`/admin/co/correspondances${toQuery({ statut: "ouverte", ...params })}`),
  resolve: (id: string, data: ResolutionCorrespondanceCO) =>
    apiRequest<{ message: string; decision: string; participation_id: string }>(
      `/admin/co/correspondances/${encodeURIComponent(id)}/resoudre`,
      { method: "POST", body: JSON.stringify(data) }
    ),
  /** Export CSV / Excel authentifié (sans données médicales) ; paramètres : buildExportParams */
  export: (params: QueryParams) => apiBlob(`/admin/co/export${toQuery(params)}`),
};

// ✅ ADMINISTRATION : export, sessions
export const adminApi = {
  /** F-A2 : export Excel (données médicales exclues côté serveur) */
  exportSeminaristesXlsx: () => apiBlob("/admin/export/seminaristes.xlsx"),
  /** TAF lot 2 (admin) : lier une inscription à celle de l'édition précédente, ou délier avec null (404 / 409) ; corps de réponse non spécifié par le contrat : l'écran recharge la liste */
  setReinscription: (matricule: string, matriculePrecedent: string | null) =>
    apiRequest<unknown>(`/admin/seminaristes/${encodeURIComponent(matricule)}/reinscription`, {
      method: "PATCH",
      body: JSON.stringify({ matricule_precedent: matriculePrecedent }),
    }),
};

// ✅ VISITEURS (admin)
export interface Visiteur {
  id: string;
  nom: string;
  prenom: string;
  contact: string;
  created_at: string;
}

export const visiteursApi = {
  list: (page = 1, limit = 20, search?: string) =>
    apiRequest<{ total: number; data: Visiteur[] }>(`/visiteurs${toQuery({ skip: (page - 1) * limit, limit, search })}`),
  get: (id: string) => apiRequest<Visiteur>(`/visiteurs/${encodeURIComponent(id)}`),
  delete: (id: string) => apiRequest<{ message: string }>(`/visiteurs/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

// ✅ FORMATEURS (scientifique, admin)
export interface Formateur {
  id: string;
  nom: string;
  prenoms: string;
  contact: string;
  created_at: string;
}

export const formateursApi = {
  list: () => apiRequest<{ total: number; data: Formateur[] }>("/scientific/formateurs"),
  create: (data: { nom: string; prenoms: string; contact: string }) =>
    apiRequest<Formateur>("/scientific/Ajouter-formateur", { method: "POST", body: JSON.stringify(data) }),
  get: (id: string) => apiRequest<Formateur>(`/scientific/${encodeURIComponent(id)}`),
  delete: (id: string) => apiRequest<{ message: string }>(`/scientific/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

// ✅ BULLETINS (F-A4) : liste paginée et recalcul
export interface RecalculResult {
  annee_scolaire: string;
  bulletins: number;
  moyennes_modifiees: number;
  rangs_modifies: number;
  incomplets: string[];
}

export const bulletinsApi = {
  list: (filters: { matricule?: string; annee_scolaire?: string; page?: number; limit?: number } = {}) => {
    const limit = filters.limit ?? 1000;
    const skip = ((filters.page ?? 1) - 1) * limit;
    return apiRequestWithTotal<Bulletin>(
      `/scientific/bulletins${toQuery({ matricule: filters.matricule, annee_scolaire: filters.annee_scolaire, skip, limit })}`
    );
  },
  recalculer: (anneeScolaire: string) =>
    apiRequest<RecalculResult>(`/scientific/bulletins/recalculer${toQuery({ annee_scolaire: anneeScolaire })}`, { method: "POST" }),
};

// ✅ PAIEMENTS DES INSCRIPTIONS (F-F6, rôles finances et admin)
export type PaymentStatus = "en_attente" | "verifie" | "rejete" | "erreur" | "completed";

export interface PaiementListItem {
  matricule: string;
  nom: string;
  prenom: string;
  sexe: string;
  dortoir_code: string;
  dortoir_name: string | null;
  transaction_id: string | null;
  payment_status: PaymentStatus | string;
  payment_message: string | null;
  registration_date: string;
}

export interface PaymentHistoryEntry {
  id: string;
  matricule: string;
  statut: string;
  methode: string;
  transaction_id: string | null;
  score: number | null;
  motif: string | null;
  verified_by: string;
  created_at: string;
}

export interface PaymentDetail {
  matricule: string;
  statut: string;
  message: string | null;
  methode: string | null;
  verified_by: string | null;
  verified_at: string | null;
  transaction_id: string | null;
  historique: PaymentHistoryEntry[];
}

export interface PaymentDecision {
  decision: "verifie" | "rejete";
  transaction_id?: string;
  motif: string;
}

export const paymentsApi = {
  list: (filters: { statut?: string; search?: string; page?: number; limit?: number } = {}) =>
    apiRequest<ApiResponse<PaiementListItem>>(
      `/finances/paiements${toQuery({ statut: filters.statut, search: filters.search, page: filters.page ?? 1, limit: filters.limit ?? 20 })}`
    ),
  get: (matricule: string) => apiRequest<PaymentDetail>(`/registrations/${encodeURIComponent(matricule)}/paiement`),
  decide: (matricule: string, decision: PaymentDecision) =>
    apiRequest<{ matricule: string; statut: string; message: string }>(
      `/registrations/${encodeURIComponent(matricule)}/paiement`,
      { method: "PATCH", body: JSON.stringify(decision) }
    ),
};

// ✅ FINANCES (F-F1, rôles finances et admin)
export interface TransactionResponse {
  id: string;
  reference: string;
  type: "ENTREE" | "SORTIE" | string;
  categorie: string;
  montant: number;
  devise?: string | null;
  libelle: string;
  description: string | null;
  beneficiaire: string | null;
  payeur: string | null;
  matricule: string | null;
  nom_seminariste?: string | null;
  mode_paiement: string;
  numero_compte: string | null;
  piece_justificative: string | null;
  statut: string;
  date_transaction: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
  deleted_reason: string | null;
}

export interface PaginatedEntrees extends ApiResponse<TransactionResponse> {
  total_montant: number;
}

export interface PaginatedTransactions extends ApiResponse<TransactionResponse> {
  total_entrees: number;
  total_sorties: number;
  solde_periode: number;
}

export interface CountAmount {
  count: number;
  montant: number;
}

export interface DashboardFinance {
  inscriptions: CountAmount;
  dons: CountAmount;
  ventes: CountAmount;
  autres_entrees: CountAmount;
  sorties: CountAmount;
  total_entrees: number;
  total_sorties: number;
  solde: number;
  transactions_recentes: Array<Pick<TransactionResponse,
    "reference" | "type" | "categorie" | "montant" | "libelle" | "date_transaction" | "mode_paiement" | "nom_seminariste">>;
  repartition_entrees: Record<string, number>;
  repartition_sorties: Record<string, number>;
}

export type TypeRapport = "mensuel" | "trimestriel" | "annuel" | "personnalise";

export interface RapportResponse {
  id: string;
  numero: string;
  titre: string;
  periode_debut: string;
  periode_fin: string;
  type_rapport: TypeRapport | string;
  total_entrees: number;
  total_sorties: number;
  solde: number;
  nb_transactions: number;
  pdf_url: string | null;
  generated_by: string;
  generated_at: string;
  commentaires: string | null;
}

export interface RapportDetail {
  rapport: RapportResponse;
  transactions_entrees: TransactionResponse[];
  transactions_sorties: TransactionResponse[];
  repartition_categories: Record<string, unknown>;
}

export interface AuditLogResponse {
  id: string;
  transaction_id: string;
  action: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  modified_by: string;
  modified_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export interface SyncStatus {
  total_registrations: number;
  synced_count: number;
  not_synced_count: number;
  sync_percentage: number;
  total_amount: number;
}

export interface DonCreate {
  montant: number;
  donateur: string;
  description?: string;
  mode_paiement?: string;
  date_transaction?: string;
}

export interface VenteCreate {
  montant: number;
  libelle: string;
  description?: string;
  mode_paiement?: string;
  date_transaction?: string;
}

export interface SortieCreate {
  categorie: string;
  montant: number;
  libelle: string;
  beneficiaire?: string | null;
  mode_paiement?: string;
  date_transaction?: string;
}

export type SortieUpdate = Partial<SortieCreate>;

export const financeApi = {
  getDashboard: () => apiRequest<DashboardFinance>("/finances/dashboard"),

  // Entrées
  getEntrees: (filters: { page?: number; limit?: number; categorie?: string } = {}) =>
    apiRequest<PaginatedEntrees>(`/finances/entrees${toQuery({ page: filters.page ?? 1, limit: filters.limit ?? 20, categorie: filters.categorie })}`),
  getEntree: (reference: string) => apiRequest<TransactionResponse>(`/finances/entrees/${encodeURIComponent(reference)}`),
  createDon: (data: DonCreate) =>
    apiRequest<TransactionResponse>("/finances/entrees/don", { method: "POST", body: JSON.stringify(data) }),
  createVente: (data: VenteCreate) =>
    apiRequest<TransactionResponse>("/finances/entrees/vente", { method: "POST", body: JSON.stringify(data) }),

  // Sorties
  getSorties: (filters: { page?: number; limit?: number; categorie?: string; date_debut?: string; date_fin?: string; search?: string } = {}) =>
    apiRequest<PaginatedTransactions>(`/finances/sorties${toQuery({ ...filters, page: filters.page ?? 1, limit: filters.limit ?? 20 })}`),
  createSortie: (data: SortieCreate) =>
    apiRequest<TransactionResponse>("/finances/sorties", { method: "POST", body: JSON.stringify(data) }),
  updateSortie: (reference: string, data: SortieUpdate) =>
    apiRequest<TransactionResponse>(`/finances/sorties/${encodeURIComponent(reference)}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSortie: (reference: string, deletedReason: string) =>
    apiRequest<{ message: string }>(`/finances/sorties/${encodeURIComponent(reference)}`, {
      method: "DELETE",
      body: JSON.stringify({ deleted_reason: deletedReason }),
    }),
  getDeletedSorties: (page = 1, limit = 20) =>
    apiRequest<ApiResponse<TransactionResponse>>(`/finances/sorties-deleted${toQuery({ page, limit })}`),
  restoreSortie: (reference: string) =>
    apiRequest<{ message: string }>(`/finances/sorties/${encodeURIComponent(reference)}/restore`, { method: "POST" }),
  getAudit: (reference: string) => apiRequest<AuditLogResponse[]>(`/finances/audit/${encodeURIComponent(reference)}`),

  // Rapports
  generateRapport: (data: { titre: string; periode_debut: string; periode_fin: string; type_rapport: TypeRapport; commentaires?: string }) =>
    apiRequest<RapportResponse>("/finances/rapports/generate", { method: "POST", body: JSON.stringify(data) }),
  getRapports: (filters: { type_rapport?: string; annee?: number; page?: number; limit?: number } = {}) => {
    const limit = filters.limit ?? 20;
    return apiRequestWithTotal<RapportResponse>(
      `/finances/rapports${toQuery({ type_rapport: filters.type_rapport, annee: filters.annee, skip: ((filters.page ?? 1) - 1) * limit, limit })}`
    );
  },
  getRapport: (numero: string) => apiRequest<RapportDetail>(`/finances/rapports/${encodeURIComponent(numero)}`),

  // Synchronisation : lecture seule (F-F7 : pas de synchronisation complète, jamais de montant_inscription)
  getSyncStatus: () => apiRequest<SyncStatus>("/finances/sync/status"),
};

// ✅ SANTÉ (rôles sante et admin)
export interface FicheMedicale {
  patient: {
    matricule: string;
    nom_prenoms: string;
    niveau: string | null;
    sexe: string;
    date_naissance: string | null;
    age: number;
    dortoir: string | null;
    dortoir_code: string;
    niveau_scolaire: string;
    photo_url: string | null;
  };
  informations_medicales: {
    contact_parent: string;
    allergies: string | null;
    antecedents_medicaux: string | null;
  };
  nombre_consultations: number;
}

export interface InformationsMedicalesUpdate {
  contact_parent?: string;
  allergies?: string | null;
  antecedents_medicaux?: string | null;
  date_naissance?: string;
}

export interface Consultation {
  id: string;
  matricule: string;
  date_consultation: string;
  medecin_responsable_id: string;
  medecin_responsable: string | null;
  motif_consultation: string;
  observations_diagnostic: string;
  traitement_prescrit: string;
  notes_medicales_supplementaires: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  patient_nom_prenoms?: string | null;
  patient_sexe?: string | null;
}

export interface ConsultationCreate {
  date_consultation: string;
  motif_consultation: string;
  observations_diagnostic: string;
  traitement_prescrit: string;
  notes_medicales_supplementaires?: string | null;
  medecin_responsable_id?: string;
}

export type ConsultationUpdate = Partial<ConsultationCreate>;

export interface StatistiquesSante {
  total_seminaristes: number;
  seminaristes_par_sexe: { M: number; F: number };
  total_consultations: number;
  consultations_aujourdhui: number;
  patients_consultes: number;
  consultations_par_sexe: { M: number; F: number };
  patients_avec_allergies: number;
  patients_avec_antecedents: number;
  consultations_7_derniers_jours: { date: string; nombre: number }[];
}

export const santeApi = {
  getStatistiques: () => apiRequest<StatistiquesSante>("/sante/statistiques"),
  getFiche: (matricule: string) =>
    apiRequest<FicheMedicale>(`/sante/patients/${encodeURIComponent(matricule)}/fiche-medicale`),
  updateInformations: (matricule: string, data: InformationsMedicalesUpdate) =>
    apiRequest<FicheMedicale>(`/sante/patients/${encodeURIComponent(matricule)}/informations-medicales`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  getPatientConsultations: (matricule: string, page = 1, limit = 20) =>
    apiRequest<ApiResponse<Consultation>>(`/sante/patients/${encodeURIComponent(matricule)}/consultations${toQuery({ page, limit })}`),
  createConsultation: (matricule: string, data: ConsultationCreate) =>
    apiRequest<Consultation>(`/sante/patients/${encodeURIComponent(matricule)}/consultations`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getConsultations: (filters: { page?: number; limit?: number; search?: string } = {}) =>
    apiRequest<ApiResponse<Consultation>>(`/sante/consultations${toQuery({ page: filters.page ?? 1, limit: filters.limit ?? 20, search: filters.search })}`),
  getConsultation: (id: string) => apiRequest<Consultation>(`/sante/consultations/${encodeURIComponent(id)}`),
  updateConsultation: (id: string, data: ConsultationUpdate) =>
    apiRequest<Consultation>(`/sante/consultations/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) }),
  /** F-S6 : seule source autorisée pour le PDF (export tracé côté serveur) */
  exportConsultation: (id: string) =>
    apiRequest<{ fiche: FicheMedicale; consultation: Consultation }>(`/sante/consultations/${encodeURIComponent(id)}/export`),
  /** Médecins sélectionnables par un admin : comptes actifs de rôle sante */
  getMedecins: () => usersApi.getUsers(1, 1000, { role: "sante", is_active: true }).then((r) => r.data),
};

// ✅ EXPORTS


export default {
  scientificApi,
  dashboardApi,
  authApi,
  usersApi,
  feedbackApi,
  coApi,
  recensementCoApi,
  registrationsApi,
  adminApi,
  visiteursApi,
  formateursApi,
  bulletinsApi,
  paymentsApi,
  financeApi,
  santeApi,
};
