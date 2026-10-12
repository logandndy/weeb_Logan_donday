from django.apps import AppConfig


class ArticlesConfig(AppConfig):
    """Configuration de l'application de gestion des articles du blog."""

    name = "apps.articles"
    label = "articles"
    verbose_name = "Articles du blog"
