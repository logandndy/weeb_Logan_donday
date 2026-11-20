"""Gestion des sessions JWT : cookie du token de rafraîchissement et révocation.

Le token d'accès (30 min) circule dans la réponse JSON et reste en mémoire
côté navigateur. Le token de rafraîchissement (7 jours), le plus précieux,
est rangé dans un cookie que le JavaScript ne peut pas lire.
"""

from django.conf import settings
from django.core.cache import cache
from rest_framework_simplejwt.exceptions import TokenBackendError
from rest_framework_simplejwt.state import token_backend
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from rest_framework_simplejwt.tokens import RefreshToken

REFRESH_COOKIE = "weeb_refresh"
REFRESH_COOKIE_PATH = "/api/auth/"

# Durée pendant laquelle une rotation dont la réponse s'est perdue peut être
# rattrapée (voir renew_after_lost_rotation).
ROTATION_GRACE_SECONDS = 30


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


def _jti(raw_token):
    """Identifiant d'un token de rafraîchissement authentique, ou `None`."""
    try:
        payload = token_backend.decode(str(raw_token), verify=True)
    except TokenBackendError:
        return None
    return payload.get("jti") if payload.get("token_type") == "refresh" else None


def remember_rotation(old_token, new_token):
    """Note pendant 30 secondes quel token en a remplacé un autre."""
    old_jti, new_jti = _jti(old_token), _jti(new_token)
    if old_jti and new_jti:
        cache.set(f"rotation:{old_jti}", new_jti, timeout=ROTATION_GRACE_SECONDS)


def renew_after_lost_rotation(raw_token):
    """Rattrape une rotation dont la réponse n'est jamais arrivée au navigateur.

    La rotation grille l'ancien cookie dès que le serveur répond. Si le
    navigateur abandonne la requête entre-temps (page rechargée pendant le
    réveil du serveur, réseau coupé), il ne reçoit jamais le nouveau cookie
    et présente l'ancien : l'utilisateur serait déconnecté sans raison.

    L'ancien token est donc accepté une seule fois, dans les 30 secondes, si
    son successeur n'a jamais servi ni été révoqué. Après une déconnexion,
    une révocation ou un usage du successeur, il reste refusé. Le successeur
    perdu est grillé à son tour : une seule session continue.

    Retourne un nouveau token de rafraîchissement, ou `None`.
    """
    old_jti = _jti(raw_token)
    successor_jti = cache.get(f"rotation:{old_jti}") if old_jti else None
    if successor_jti is None:
        return None
    cache.delete(f"rotation:{old_jti}")

    successor = (
        OutstandingToken.objects.select_related("user")
        .filter(jti=successor_jti, blacklistedtoken__isnull=True)
        .first()
    )
    if successor is None or successor.user is None or not successor.user.is_active:
        return None
    BlacklistedToken.objects.get_or_create(token=successor)
    return RefreshToken.for_user(successor.user)


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
