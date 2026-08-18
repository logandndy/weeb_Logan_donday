/**
 * Point d'entrée unique vers l'API Django.
 *
 * Toutes les requêtes passent par `request()`, qui centralise l'URL de base,
 * l'en-tête d'authentification, le rafraîchissement du token expiré et la
 * remontée des erreurs de validation renvoyées par DRF.
 */

// URL de base de l'API Django (serveur de développement).
const API_URL = 'http://127.0.0.1:8000/api';

const ACCESS_TOKEN_KEY = 'weeb_access_token';
const REFRESH_TOKEN_KEY = 'weeb_refresh_token';

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_TOKEN_KEY),

  save: ({ access, refresh }) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    if (refresh) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    }
  },

  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
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

/** Tente de renouveler le token d'accès. Retourne le nouveau token ou `null`. */
async function refreshAccessToken() {
  const refresh = tokenStorage.getRefresh();
  if (!refresh) {
    return null;
  }

  const response = await fetch(`${API_URL}/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    tokenStorage.clear();
    return null;
  }

  const data = await response.json();
  tokenStorage.save({ access: data.access, refresh: data.refresh });
  return data.access;
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

  let response;
  try {
    response = await sendRequest(tokenStorage.getAccess());
  } catch {
    throw new ApiError("Impossible de joindre le serveur. Vérifiez qu'il est démarré.");
  }

  // Un 401 sur une requête authentifiée signifie généralement que le token
  // d'accès a expiré : on le renouvelle puis on rejoue la requête une fois.
  if (response.status === 401 && auth && tokenStorage.getRefresh()) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await sendRequest(newToken);
    }
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
  me: () => request('/auth/me/'),
  requestPasswordReset: (email) =>
    request('/auth/password-reset/', { method: 'POST', body: { email }, auth: false }),
  confirmPasswordReset: (payload) =>
    request('/auth/password-reset/confirm/', { method: 'POST', body: payload, auth: false }),
};

/** Endpoints des articles du blog. */
export const articlesApi = {
  list: (page = 1) => request(`/articles/?page=${page}`, { auth: false }),
  retrieve: (slug) => request(`/articles/${slug}/`, { auth: false }),
  create: (payload) => request('/articles/', { method: 'POST', body: payload }),
  update: (slug, payload) => request(`/articles/${slug}/`, { method: 'PATCH', body: payload }),
  remove: (slug) => request(`/articles/${slug}/`, { method: 'DELETE' }),
};

/** Endpoint du formulaire de contact. */
export const contactApi = {
  send: (payload) => request('/contact/', { method: 'POST', body: payload, auth: false }),
};
