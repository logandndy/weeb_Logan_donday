"""Gestion des erreurs de l'API."""

from django.http import Http404
from rest_framework.exceptions import NotFound
from rest_framework.views import exception_handler


def french_exception_handler(exc, context):
    """Gestionnaire d'erreurs de DRF, avec un 404 en français.

    Django produit « No Article matches the given query. », un message anglais
    que le frontend afficherait tel quel. Toutes les autres erreurs sont déjà
    traduites par DRF.
    """
    if isinstance(exc, Http404):
        exc = NotFound("Contenu introuvable.")
    return exception_handler(exc, context)
