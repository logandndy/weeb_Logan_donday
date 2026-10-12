from django.apps import AppConfig


class ContactConfig(AppConfig):
    """Configuration de l'application de gestion des messages de contact."""

    name = "apps.contact"
    label = "contact"
    verbose_name = "Messages de contact"
