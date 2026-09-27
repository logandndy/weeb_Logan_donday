import { describe, expect, it, vi } from 'vitest';
import { ApiError, request, tokenStorage } from './api';

/** Construit une fausse réponse HTTP, comme celle renvoyée par fetch. */
function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  };
}

describe('request()', () => {
  it('joint le token d’accès dans l’en-tête Authorization', async () => {
    tokenStorage.save({ access: 'token-a', refresh: 'token-r' });
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(200, { ok: true }));

    await request('/auth/me/');

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer token-a');
  });

  it('n’envoie pas de token pour une route publique', async () => {
    tokenStorage.save({ access: 'token-a', refresh: 'token-r' });
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse(200, []));

    await request('/articles/', { auth: false });

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it('renvoie null pour une réponse 204 (suppression)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 204 });

    await expect(request('/articles/x/', { method: 'DELETE' })).resolves.toBeNull();
  });

  it('renouvelle le token expiré puis rejoue la requête', async () => {
    tokenStorage.save({ access: 'expire', refresh: 'token-r' });
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(401, { detail: 'Token expiré' }))
      .mockResolvedValueOnce(jsonResponse(200, { access: 'nouveau', refresh: 'token-r2' }))
      .mockResolvedValueOnce(jsonResponse(200, { email: 'a@b.fr' }));

    const data = await request('/auth/me/');

    expect(data).toEqual({ email: 'a@b.fr' });
    expect(fetchMock.mock.calls[1][0]).toContain('/auth/refresh/');
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe('Bearer nouveau');
    expect(tokenStorage.getAccess()).toBe('nouveau');
  });

  it('déconnecte l’utilisateur si le renouvellement échoue', async () => {
    tokenStorage.save({ access: 'expire', refresh: 'invalide' });
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(401, { detail: 'Token expiré' }))
      .mockResolvedValueOnce(jsonResponse(401, { detail: 'Refresh invalide' }));

    await expect(request('/auth/me/')).rejects.toMatchObject({ status: 401 });
    expect(tokenStorage.getAccess()).toBeNull();
    expect(tokenStorage.getRefresh()).toBeNull();
  });

  it('transforme les erreurs de validation DRF en erreurs par champ', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(400, { email: ['Adresse déjà utilisée.'], password: ['Trop court.', 'Trop courant.'] }),
    );

    const error = await request('/auth/signup/', { method: 'POST', body: {}, auth: false }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.message).toBe('Adresse déjà utilisée.');
    expect(error.fieldErrors).toEqual({
      email: 'Adresse déjà utilisée.',
      password: 'Trop court. Trop courant.',
    });
  });

  it('affiche un message clair si le serveur est injoignable', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(request('/articles/', { auth: false })).rejects.toThrow('Impossible de joindre le serveur');
  });
});
