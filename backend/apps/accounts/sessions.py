"""Gestion des sessions JWT : révocation des tokens de rafraîchissement."""

from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken


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
