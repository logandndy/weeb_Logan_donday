import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './styles/index.css'
import App from './App.jsx'
import { initMonitoring } from './monitoring'

initMonitoring()

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
