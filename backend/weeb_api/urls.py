"""Table de routage racine de l'API Weeb.

    /admin/          tableau de bord Django auto-généré
    /api/auth/...    inscription, connexion, profil, mot de passe oublié
    /api/articles/   CRUD des articles du blog
    /api/contact/    enregistrement des messages du formulaire de contact
    /api/newsletter/ inscription et désinscription à la newsletter
    /api/ping/       l'API tourne (sans base), sondes fréquentes
    /api/health/     l'API et sa base répondent, smoke test et sonde horaire
    /api/debug-sentry/  erreur volontaire pour tester Sentry (admins)
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from .views import health, ping, sentry_debug

admin.site.site_header = "Administration Weeb"
admin.site.site_title = "Weeb"
admin.site.index_title = "Gestion du blog"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/ping/", ping, name="ping"),
    path("api/health/", health, name="health"),
    path("api/debug-sentry/", sentry_debug, name="sentry-debug"),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/", include("apps.articles.urls")),
    path("api/", include("apps.contact.urls")),
    path("api/newsletter/", include("apps.newsletter.urls")),
]

# En développement, Django sert lui-même les fichiers téléversés.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
