"""Envoi des emails de l'API (comptes, newsletter).

Les emails partent en arrière-plan, après la réponse. Deux raisons :

- l'appel à Brevo prend quelques centaines de millisecondes, que l'utilisateur
  n'a pas à attendre ;
- surtout, une réponse plus lente quand un email part trahirait qu'un compte
  existe (inscription, mot de passe oublié) ou qu'une adresse est déjà
  inscrite (newsletter). En arrière-plan, le temps de réponse est le même.
"""

import logging
import threading

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def _deliver(subject, message, recipients):
    """Envoie l'email. Une panne est journalisée (et remontée par Sentry), jamais propagée."""
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, recipients)
    except Exception:
        logger.exception("Échec de l'envoi de l'email « %s »", subject)


def send_email(subject, message, recipients):
    """Envoie un email sans faire attendre ni échouer la requête en cours.

    Le fil d'envoi ne touche pas à la base : tout le contenu est préparé avant.
    Pendant les tests, Django remplace l'envoi par une boîte en mémoire
    (locmem) : l'envoi reste alors immédiat, pour pouvoir vérifier la boîte.
    """
    recipients = list(recipients)
    if not recipients:
        return
    if settings.EMAIL_BACKEND == "django.core.mail.backends.locmem.EmailBackend":
        _deliver(subject, message, recipients)
        return
    threading.Thread(target=_deliver, args=(subject, message, recipients), daemon=True).start()
