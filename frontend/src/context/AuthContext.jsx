/**
 * Contexte d'authentification.
 *
 * Conserve l'utilisateur connecté et le met à disposition de toute
 * l'application, ce qui évite de faire remonter l'état de connexion à travers
 * les props de chaque page.
 */

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { authApi, session } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `isLoading` couvre la vérification du token au démarrage : sans lui, les
  // routes protégées redirigeraient vers /login avant que le profil soit chargé.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Le serveur peut mettre fin à la session à tout moment (expiration, mot
    // de passe changé sur un autre appareil) : la navbar doit alors repasser
    // en mode visiteur, sans attendre un rechargement de la page.
    session.onEnd(() => setUser(null));

    /**
     * Restaure la session au chargement de la page. Le token d'accès, gardé
     * en mémoire, a disparu : api.js en redemande un grâce au cookie.
     */
    async function restoreSession() {
      if (!session.mayExist()) {
        setIsLoading(false);
        return;
      }

      try {
        setUser(await authApi.me());
      } catch {
        // Session terminée : api.js l'a déjà effacée. Serveur injoignable :
        // on la garde, le prochain chargement réessaiera.
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password });
    session.start(data.access);
    setUser(data.user);
    return data.user;
  }, []);

  /** Ferme la session dans ce navigateur seulement (compte supprimé par exemple). */
  const clearSession = useCallback(() => {
    session.clear();
    setUser(null);
  }, []);

  const logout = useCallback(() => {
    // Le serveur met le token du cookie sur liste noire et efface le cookie.
    // On n'attend pas sa réponse : même hors ligne, la session locale est fermée.
    authApi.logout().catch(() => {});
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
