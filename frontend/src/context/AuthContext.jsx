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

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, isAuthenticated: user !== null, login, logout }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
