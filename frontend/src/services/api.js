/**
 * Point d'entrée unique vers l'API Django.
 *
 * Toutes les requêtes passent par `request()`, qui centralise l'URL de base,
 * l'en-tête d'authentification, le rafraîchissement du token expiré et la
 * remontée des erreurs de validation renvoyées par DRF.
 */

// L'API est appelée sur le domaine du site : Vercel (production) et Vite
// (développement) relaient /api vers Django. Le cookie de session reste
// ainsi un cookie « du site », et aucune règle CORS n'est nécessaire.
const API_URL = '/api';

const SESSION_HINT_KEY = 'weeb_session';
const UNREACHABLE = "Impossible de joindre le serveur. Vérifiez votre connexion puis réessayez.";

let accessToken = null;
let onSessionEnd = () => {};

/**
 * Session de l'utilisateur.
 *
 * Le token d'accès (30 min) reste en mémoire : il disparaît en fermant
 * l'onglet et aucun script ne peut le retrouver dans le stockage du
 * navigateur. Le token de rafraîchissement est dans un cookie HttpOnly,
 * illisible par le JavaScript : seul le serveur le voit.
 *
 * Le localStorage ne garde qu'un indicateur sans valeur secrète : « ce
 * navigateur a une session ». Il évite d'appeler l'API au chargement pour
 * les visiteurs qui ne se sont jamais connectés.
 */
export const session = {
  getAccess: () => accessToken,

  start(access) {
    accessToken = access;
    localStorage.setItem(SESSION_HINT_KEY, '1');
  },

  clear() {
    accessToken = null;
    localStorage.removeItem(SESSION_HINT_KEY);
  },

  mayExist: () => accessToken !== null || localStorage.getItem(SESSION_HINT_KEY) === '1',

  /** Fonction appelée quand le serveur met fin à la session (AuthContext s'y abonne). */
  onEnd(callback) {
    onSessionEnd = callback;
  },
};

/**
 * Erreur enrichie des détails renvoyés par l'API.
 *
 * `fieldErrors` reprend le format de Django REST Framework
 * (`{ email: ["..."], password: ["..."] }`) pour permettre aux formulaires
 * d'afficher le message sous le bon champ.
 */
export class ApiError extends Error {
  constructor(message, { status, fieldErrors = {} } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/** Transforme le corps d'erreur de DRF en message lisible et en erreurs par champ. */
function buildApiError(status, body) {
  if (!body || typeof body !== 'object') {
    return new ApiError('Une erreur est survenue, veuillez réessayer.', { status });
  }

  if (body.detail) {
    return new ApiError(body.detail, { status });
  }

  const fieldErrors = {};
  Object.entries(body).forEach(([field, messages]) => {
    fieldErrors[field] = Array.isArray(messages) ? messages.join(' ') : String(messages);
  });

  const firstMessage = Object.values(fieldErrors)[0];
  return new ApiError(firstMessage ?? 'Formulaire invalide.', { status, fieldErrors });
}

/** Demande un token d'accès neuf. Le navigateur joint lui-même le cookie de session. */
async function fetchNewAccessToken() {
  let response;
  try {
    response = await fetch(`${API_URL}/auth/refresh/`, { method: 'POST' });
  } catch {
    // Serveur injoignable : la session n'est peut-être pas finie, on la garde.
    throw new ApiError(UNREACHABLE);
  }

  if (!response.ok) {
    session.clear();
    onSessionEnd();
    return null;
  }

  const { access } = await response.json();
  session.start(access);
  return access;
}

let pendingRefresh = null;

/**
 * Renouvelle le token d'accès. Retourne le nouveau token, ou `null` si la
 * session est terminée.
 *
 * Chaque renouvellement grille le cookie utilisé (rotation). Deux
 * renouvellements lancés en même temps, avec le même cookie, feraient donc
 * échouer le second et déconnecteraient l'utilisateur. D'où deux verrous :
 * - dans l'onglet, les appels simultanés partagent la même requête ;
 * - entre onglets, `navigator.locks` les fait passer l'un après l'autre,
 *   chacun avec le cookie le plus récent.
 */
function refreshAccessToken() {
  if (!pendingRefresh) {
    const run = navigator.locks
      ? navigator.locks.request('weeb-refresh', fetchNewAccessToken)
      : fetchNewAccessToken();
    pendingRefresh = run.finally(() => {
      pendingRefresh = null;
    });
  }
  return pendingRefresh;
}

/**
 * Exécute un appel à l'API.
 *
 * @param {string} path      Chemin relatif, par exemple `/articles/`.
 * @param {object} options   `method`, `body` (objet JS, sérialisé en JSON),
 *                           `auth` (joint le token, `true` par défaut si présent).
 * @returns {Promise<object|null>} Corps de la réponse, ou `null` pour un 204.
 */
export async function request(path, { method = 'GET', body, auth = true } = {}) {
  const sendRequest = async (token) => {
    const headers = {};
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (auth && token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  };

  const send = async (token) => {
    try {
      return await sendRequest(token);
    } catch {
      throw new ApiError(UNREACHABLE);
    }
  };

  const sentToken = session.getAccess();
  let response = await send(sentToken);

  // Un 401 sur une requête authentifiée signifie généralement que le token
  // d'accès a expiré (ou qu'il n'est pas encore chargé, juste après un
  // rechargement de la page) : on le renouvelle puis on rejoue la requête une
  // fois. Si la session est vraiment terminée, on la rejoue sans token, comme
  // un visiteur : les pages publiques (le blog) restent ainsi lisibles.
  if (response.status === 401 && auth && session.mayExist()) {
    // Si un autre appel a renouvelé le token entre-temps, inutile de recommencer.
    const current = session.getAccess();
    const newToken = current && current !== sentToken ? current : await refreshAccessToken();
    response = await send(newToken);
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw buildApiError(response.status, data);
  }

  return data;
}

/** Endpoints d'authentification. */
export const authApi = {
  signup: (payload) => request('/auth/signup/', { method: 'POST', body: payload, auth: false }),
  login: (payload) => request('/auth/login/', { method: 'POST', body: payload, auth: false }),
  logout: () => request('/auth/logout/', { method: 'POST', auth: false }),
  me: () => request('/auth/me/'),
  updateMe: (payload) => request('/auth/me/', { method: 'PATCH', body: payload }),
  deleteMe: (password) => request('/auth/me/', { method: 'DELETE', body: { password } }),
  changePassword: (payload) => request('/auth/password-change/', { method: 'POST', body: payload }),
  requestPasswordReset: (email) =>
    request('/auth/password-reset/', { method: 'POST', body: { email }, auth: false }),
  confirmPasswordReset: (payload) =>
    request('/auth/password-reset/confirm/', { method: 'POST', body: payload, auth: false }),
};

/**
 * Endpoints des articles du blog.
 *
 * Le token est joint quand il existe : l'auteur d'un brouillon (ou un admin)
 * peut ainsi l'ouvrir et le modifier. Le blog public, lui, ne liste que les
 * articles publiés, que l'on soit connecté ou non.
 */
export const articlesApi = {
  list: (page = 1) => request(`/articles/?page=${page}`),
  mine: (page = 1) => request(`/articles/?mine=true&page=${page}`),
  retrieve: (slug) => request(`/articles/${encodeURIComponent(slug)}/`),
  create: (payload) => request('/articles/', { method: 'POST', body: payload }),
  update: (slug, payload) =>
    request(`/articles/${encodeURIComponent(slug)}/`, { method: 'PATCH', body: payload }),
  remove: (slug) => request(`/articles/${encodeURIComponent(slug)}/`, { method: 'DELETE' }),
};

/** Inscription et désinscription à la newsletter (pied de page). */
export const newsletterApi = {
  subscribe: (email) => request('/newsletter/', { method: 'POST', body: { email }, auth: false }),
  unsubscribe: (token) =>
    request('/newsletter/unsubscribe/', { method: 'POST', body: { token }, auth: false }),
};

/** Endpoint du formulaire de contact. */
export const contactApi = {
  send: (payload) => request('/contact/', { method: 'POST', body: payload, auth: false }),
};
