"""Vues transverses de l'API (hors applications métier)."""

import os

from django.db import connection
from django.http import JsonResponse


def health(request):
    """Indique si l'API et sa base de données répondent.

    Utilisée par la plateforme d'hébergement et par le monitoring : un code
    200 signifie « tout va bien », un code 503 déclenche une alerte.
    La version (commit Git déployé, fourni par Render) permet au pipeline
    de vérifier que c'est bien la nouvelle version qui est en ligne.
    """
    version = os.environ.get("RENDER_GIT_COMMIT", "dev")
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except Exception:
        return JsonResponse({"status": "error", "database": "unreachable", "version": version}, status=503)
    return JsonResponse({"status": "ok", "database": "ok", "version": version})
