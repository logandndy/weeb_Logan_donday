from django.apps import AppConfig


class AccountsConfig(AppConfig):
    """Configuration de l'application de gestion des comptes utilisateurs."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.accounts"
    label = "accounts"
    verbose_name = "Comptes utilisateurs"
