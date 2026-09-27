import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

/** Accède au contexte d'authentification depuis n'importe quel composant. */
export default function useAuth() {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un <AuthProvider>.');
  }

  return context;
}
