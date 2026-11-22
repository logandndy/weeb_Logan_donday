import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
// Police Inter servie par le site lui-même, et non par Google : aucune donnée
// du visiteur (adresse IP) n'est envoyée à un tiers pour afficher une page.
import '@fontsource-variable/inter'
import './styles/theme.css'
import './styles/index.css'
import App from './App.jsx'
import { initMonitoring } from './monitoring'

initMonitoring()

// L'API dort quand personne ne s'en sert (hébergement gratuit). On la réveille
// dès l'arrivée sur le site : elle a ainsi le temps de démarrer pendant que le
// visiteur lit l'accueil, avant qu'il ouvre le blog ou se connecte.
fetch('/api/ping/').catch(() => {})

// Si un composant plante, Sentry remonte l'erreur et l'utilisateur voit un
// message au lieu d'une page blanche.
const fallback = (
  <p style={{ padding: '2rem', textAlign: 'center' }}>
    Une erreur inattendue est survenue. Rechargez la page.
  </p>
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={fallback}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
