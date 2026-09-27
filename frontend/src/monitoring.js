/**
 * Monitoring des erreurs du navigateur avec Sentry.
 *
 * Activé uniquement si VITE_SENTRY_DSN est définie au build (production) :
 * en local et pendant les tests, rien n'est envoyé.
 */
import * as Sentry from '@sentry/react';

export function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    // 10 % des chargements de page mesurés : suffisant pour suivre les
    // performances sans alourdir le site ni dépasser le quota gratuit.
    tracesSampleRate: 0.1,
    // Les traces ne sont propagées qu'à notre propre API.
    tracePropagationTargets: [import.meta.env.VITE_API_URL ?? 'localhost'],
    sendDefaultPii: false,
    // Les erreurs passent par notre propre domaine (/monitoring), relayées
    // par Vercel vers Sentry : les bloqueurs de pub ne les interceptent plus.
    tunnel: '/monitoring',
  });
}
