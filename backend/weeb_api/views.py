"""Vues transverses de l'API (hors applications métier)."""

import os

from django.db import connection
from django.http import JsonResponse
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework_simplejwt.authentication import JWTAuthentication


def ping(request):
    """Indique que l'API tourne, sans interroger la base de données.

    Appelée très souvent (health check Render, sonde UptimeRobot). Elle ne
    touche pas la base : Neon peut ainsi se mettre en veille quand personne
    n'utilise le site, ce qui préserve le quota gratuit d'heures de calcul.
    """
    return JsonResponse({"status": "ok", "version": os.environ.get("RENDER_GIT_COMMIT", "dev")})


def health(request):
    """Indique si l'API et sa base de données répondent.

    Utilisée par le smoke test du pipeline et par une sonde de monitoring
    espacée (une fois par heure) : un code 200 signifie « tout va bien »,
    un code 503 déclenche une alerte. Elle réveille la base à chaque appel,
    c'est pourquoi les sondes fréquentes utilisent `ping` à la place.
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


@api_view(["GET"])
@authentication_classes([SessionAuthentication, JWTAuthentication])
@permission_classes([IsAdminUser])
def sentry_debug(request):
    """Lève volontairement une erreur pour vérifier que Sentry la reçoit.

    Réservée aux administrateurs : la session de l'admin Django suffit, on peut
    donc l'ouvrir directement dans le navigateur après s'être connecté à /admin/.
    """
    raise RuntimeError("Test Sentry backend : erreur déclenchée volontairement par un administrateur")
