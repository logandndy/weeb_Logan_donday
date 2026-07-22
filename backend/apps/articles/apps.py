from django.apps import AppConfig


class ArticlesConfig(AppConfig):
    """Configuration de l'application de gestion des articles du blog."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.articles"
    label = "articles"
    verbose_name = "Articles du blog"
