/**
 * Contexte d'authentification.
 *
 * Conserve l'utilisateur connecté et le met à disposition de toute
 * l'application, ce qui évite de faire remonter l'état de connexion à travers
 * les props de chaque page.
 */

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authApi, tokenStorage } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `isLoading` couvre la vérification du token au démarrage : sans lui, les
  // routes protégées redirigeraient vers /login avant que le profil soit chargé.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    /** Restaure la session si un token est encore présent dans le navigateur. */
    async function restoreSession() {
      if (!tokenStorage.getAccess()) {
        setIsLoading(false);
        return;
      }

      try {
        setUser(await authApi.me());
      } catch {
        tokenStorage.clear();
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password });
    tokenStorage.save({ access: data.access, refresh: data.refresh });
    setUser(data.user);
    return data.user;
  }, []);

  /** Ferme la session dans ce navigateur seulement (compte supprimé par exemple). */
  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const logout = useCallback(() => {
    // Le serveur met le token de rafraîchissement sur liste noire. On n'attend
    // pas sa réponse : même hors ligne, la session locale est fermée.
    const refresh = tokenStorage.getRefresh();
    if (refresh) {
      authApi.logout(refresh).catch(() => {});
    }
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      logout,
      clearSession,
      // Après une modification du profil (page Mon espace).
      updateUser: setUser,
    }),
    [user, isLoading, login, logout, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
