"""Gestion des sessions JWT : cookie du token de rafraîchissement et révocation.

Le token d'accès (30 min) circule dans la réponse JSON et reste en mémoire
côté navigateur. Le token de rafraîchissement (7 jours), le plus précieux,
est rangé dans un cookie que le JavaScript ne peut pas lire.
"""

from django.conf import settings
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

REFRESH_COOKIE = "weeb_refresh"
REFRESH_COOKIE_PATH = "/api/auth/"


def set_refresh_cookie(response, refresh):
    """Place le token de rafraîchissement dans un cookie protégé.

    - HttpOnly : le JavaScript ne peut pas le lire, une faille XSS ne peut donc
      pas le voler ;
    - SameSite=Strict : le navigateur ne l'envoie jamais depuis un autre site,
      ce qui bloque les attaques CSRF ;
    - Secure (production) : jamais envoyé sur une connexion non chiffrée ;
    - Path=/api/auth/ : envoyé uniquement aux routes de session, pas à chaque
      appel de l'API.
    """
    response.set_cookie(
        REFRESH_COOKIE,
        str(refresh),
        max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
        path=REFRESH_COOKIE_PATH,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="Strict",
    )


def delete_refresh_cookie(response):
    """Efface le cookie de session du navigateur (déconnexion, session expirée)."""
    response.delete_cookie(REFRESH_COOKIE, path=REFRESH_COOKIE_PATH, samesite="Strict")


def revoke_all_sessions(user):
    """Déconnecte l'utilisateur de tous ses appareils.

    Chaque token de rafraîchissement délivré est mis sur liste noire : il ne
    permet plus d'obtenir de nouveaux tokens d'accès. Utilisé quand le mot de
    passe change (le compte a peut-être été volé) et quand un admin suspend le
    compte. Les tokens d'accès déjà émis expirent d'eux-mêmes en 30 minutes au
    plus, et sont de toute façon refusés pour un compte suspendu.
    """
    for token in OutstandingToken.objects.filter(user=user):
        BlacklistedToken.objects.get_or_create(token=token)
