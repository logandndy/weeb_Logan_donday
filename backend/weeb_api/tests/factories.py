"""Utilitaires partagés par les tests de toutes les applications.

Plutôt que de répéter dans chaque fichier la création d'un utilisateur ou
d'un article, les tests passent par ces petites fonctions. Si le modèle
change (nouveau champ obligatoire par exemple), on ne corrige qu'ici.
"""

from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework_simplejwt.tokens import RefreshToken

from apps.articles.models import Article

User = get_user_model()

# Mot de passe qui passe tous les validateurs de Django (longueur, courant, numérique).
VALID_PASSWORD = "MotDePasse!2026"


def make_user(email="ada@weeb.fr", active=True, staff=False, **kwargs):
    """Crée un utilisateur. Par défaut : validé (actif), non administrateur."""
    kwargs.setdefault("first_name", "Ada")
    kwargs.setdefault("last_name", "Lovelace")
    return User.objects.create_user(
        email=email,
        password=VALID_PASSWORD,
        is_active=active,
        is_staff=staff,
        **kwargs,
    )


def make_admin(email="admin@weeb.fr"):
    """Crée un administrateur (staff + superuser, actif)."""
    return User.objects.create_superuser(
        email=email, password=VALID_PASSWORD, first_name="Admin", last_name="Weeb"
    )


def make_article(author, title="Les tendances du web en 2026", content="x" * 60, published=True, **kwargs):
    """Crée un article valide (contenu de 60 caractères, au-dessus du minimum de 50)."""
    return Article.objects.create(
        author=author, title=title, content=content, is_published=published, **kwargs
    )


def auth_client(client, user):
    """Authentifie le client de test avec un VRAI token JWT.

    On évite `force_authenticate`, qui contourne toute la vérification du
    token : avec lui, un compte désactivé serait quand même accepté. Avec un
    vrai token, la requête passe par le même chemin qu'en production.
    """
    token = RefreshToken.for_user(user).access_token
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
    return client


class ThrottleResetMixin:
    """Remet à zéro les compteurs de limitation de débit avant chaque test.

    Les compteurs (5 connexions/min, 10 inscriptions/h...) sont stockés dans
    le cache, partagé entre les tests. Sans ce nettoyage, un test pourrait
    recevoir un 429 à cause des requêtes faites par les tests précédents.
    """

    def setUp(self):
        super().setUp()
        cache.clear()
