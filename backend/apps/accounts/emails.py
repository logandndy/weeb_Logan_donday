"""Emails envoyés autour du cycle de vie d'un compte.

Tous les emails du compte sont ici, pour les retrouver et les tester au même
endroit :

- mot de passe oublié : le lien de réinitialisation ;
- nouvelle inscription : les administrateurs sont prévenus qu'un compte attend ;
- compte validé : l'utilisateur apprend qu'il peut se connecter.

Sans les deux derniers, l'inscription était un cul-de-sac : personne ne savait
qu'un compte attendait, et l'utilisateur ne savait pas quand réessayer.
"""

import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail

from .serializers import build_password_reset_payload

logger = logging.getLogger(__name__)
User = get_user_model()


def _send(subject, message, recipients):
    """Envoie un email sans jamais faire échouer la requête en cours.

    Une panne du service d'email ne doit pas empêcher une inscription ou une
    validation : l'erreur est journalisée (et remontée par Sentry en production).
    """
    if not recipients:
        return
    try:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, recipients)
    except Exception:
        logger.exception("Échec de l'envoi de l'email « %s »", subject)


def send_password_reset_email(user):
    """Envoie à l'utilisateur le lien de réinitialisation vers la page du frontend."""
    payload = build_password_reset_payload(user)
    reset_url = (
        f"{settings.FRONTEND_URL}/reset-password"
        f"?uid={payload['uid']}&token={payload['token']}"
    )
    _send(
        "Réinitialisation de votre mot de passe Weeb",
        f"Bonjour {user.get_short_name()},\n\n"
        "Vous avez demandé la réinitialisation de votre mot de passe. "
        f"Cliquez sur le lien suivant pour en choisir un nouveau :\n\n{reset_url}\n\n"
        "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
        [user.email],
    )


def notify_admins_new_account(user):
    """Prévient les administrateurs qu'un nouveau compte attend leur validation."""
    admins = User.objects.filter(is_staff=True, is_active=True).values_list("email", flat=True)
    _send(
        "Weeb : un nouveau compte attend votre validation",
        f"{user.get_full_name()} ({user.email}) vient de créer un compte.\n\n"
        "Pour le valider, ouvrez l'administration, sélectionnez le compte puis "
        "l'action « Valider les comptes sélectionnés ».",
        list(admins),
    )


def send_account_validated_email(user):
    """Annonce à l'utilisateur que son compte est validé et qu'il peut se connecter."""
    _send(
        "Votre compte Weeb est validé",
        f"Bonjour {user.get_short_name()},\n\n"
        "Un administrateur vient de valider votre compte. Vous pouvez maintenant "
        f"vous connecter et publier vos articles :\n\n{settings.FRONTEND_URL}/login",
        [user.email],
    )
