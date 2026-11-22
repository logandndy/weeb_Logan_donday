import { describe, expect, it, vi } from 'vitest';
import { ApiError, articlesApi, request, session } from './api';

/** Construit une fausse réponse HTTP, comme celle renvoyée par fetch. */
function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  };
}

describe('request()', () => {
  it('appelle l’API sur le domaine du site', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(200, []));

    await request('/articles/', { auth: false });

    expect(fetchMock.mock.calls[0][0]).toBe('/api/articles/');
  });

  it('joint le token d’accès dans l’en-tête Authorization', async () => {
    session.start('token-a');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(200, { ok: true }));

    await request('/auth/me/');

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer token-a');
  });

  it('n’envoie pas de token pour une route publique', async () => {
    session.start('token-a');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(200, []));

    await request('/articles/', { auth: false });

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('ne garde jamais le token d’accès dans le stockage du navigateur', () => {
    session.start('token-a');

    expect(JSON.stringify(localStorage)).not.toContain('token-a');
  });

  it('renvoie null pour une réponse 204 (suppression)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 204 });

    await expect(request('/articles/x/', { method: 'DELETE' })).resolves.toBeNull();
  });

  it('renouvelle le token expiré grâce au cookie puis rejoue la requête', async () => {
    session.start('expire');
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(401, { detail: 'Token expiré' }))
      .mockResolvedValueOnce(jsonResponse(200, { access: 'nouveau' }))
      .mockResolvedValueOnce(jsonResponse(200, { email: 'a@b.fr' }));

    const data = await request('/auth/me/');

    expect(data).toEqual({ email: 'a@b.fr' });
    const [url, options] = fetchMock.mock.calls[1];
    expect(url).toBe('/api/auth/refresh/');
    // Pas de token dans le corps : le navigateur joint le cookie HttpOnly lui-même.
    expect(options.body).toBeUndefined();
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer nouveau');
    expect(session.getAccess()).toBe('nouveau');
  });

  it('deux requêtes expirées en même temps ne renouvellent qu’une fois', async () => {
    // Le cookie change à chaque renouvellement : un second appel simultané
    // échouerait et déconnecterait l'utilisateur.
    session.start('expire');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options) => {
      if (url.endsWith('/auth/refresh/')) return jsonResponse(200, { access: 'nouveau' });
      return options.headers.Authorization === 'Bearer nouveau'
        ? jsonResponse(200, { ok: true })
        : jsonResponse(401, { detail: 'Token expiré' });
    });

    await Promise.all([request('/auth/me/'), request('/articles/?mine=true')]);

    const refreshCalls = fetchMock.mock.calls.filter(([url]) => url.endsWith('/auth/refresh/'));
    expect(refreshCalls).toHaveLength(1);
  });

  it('termine la session et prévient l’application si le renouvellement échoue', async () => {
    session.start('expire');
    const onEnd = vi.fn();
    session.onEnd(onEnd);
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(401, { detail: 'Token expiré' }))
      .mockResolvedValueOnce(jsonResponse(401, { detail: 'Votre session a expiré.' }))
      .mockResolvedValueOnce(jsonResponse(401, { detail: 'Authentification requise' }));

    await expect(request('/auth/me/')).rejects.toMatchObject({ status: 401 });
    expect(session.getAccess()).toBeNull();
    expect(session.mayExist()).toBe(false);
    expect(onEnd).toHaveBeenCalled();
  });

  it('rejoue une route publique sans token quand la session est terminée', async () => {
    session.start('expire');
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(401, { detail: 'Token expiré' }))
      .mockResolvedValueOnce(jsonResponse(401, { detail: 'Votre session a expiré.' }))
      .mockResolvedValueOnce(jsonResponse(200, { results: [] }));

    const data = await request('/articles/');

    expect(data).toEqual({ results: [] });
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBeUndefined();
  });

  it('garde la session si le serveur est injoignable pendant le renouvellement', async () => {
    session.start('expire');
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(401, { detail: 'Token expiré' }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(request('/auth/me/')).rejects.toThrow('Impossible de joindre le serveur');
    expect(session.mayExist()).toBe(true);
  });

  it('transforme les erreurs de validation DRF en erreurs par champ', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(400, { email: ['Adresse invalide.'], password: ['Trop court.', 'Trop courant.'] }),
    );

    const error = await request('/auth/signup/', { method: 'POST', body: {}, auth: false }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.message).toBe('Adresse invalide.');
    expect(error.fieldErrors).toEqual({
      email: 'Adresse invalide.',
      password: 'Trop court. Trop courant.',
    });
  });

  it('affiche un message clair si le serveur est injoignable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(request('/articles/', { auth: false })).rejects.toThrow('Impossible de joindre le serveur');
  });

  it('encode le slug d’un article dans l’URL', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(200, {}));

    await articlesApi.retrieve('a/b?c');

    expect(fetchMock.mock.calls[0][0]).toBe('/api/articles/a%2Fb%3Fc/');
  });
});
