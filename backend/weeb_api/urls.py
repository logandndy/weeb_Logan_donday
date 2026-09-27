"""Table de routage racine de l'API Weeb.

    /admin/          tableau de bord Django auto-généré
    /api/auth/...    inscription, connexion, profil, mot de passe oublié
    /api/articles/   CRUD des articles du blog
    /api/contact/    enregistrement des messages du formulaire de contact
    /api/health/     état de l'API, utilisé par le monitoring
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from .views import health

admin.site.site_header = "Administration Weeb"
admin.site.site_title = "Weeb"
admin.site.index_title = "Gestion du blog"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health, name="health"),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/", include("apps.articles.urls")),
    path("api/", include("apps.contact.urls")),
]

# En développement, Django sert lui-même les fichiers téléversés.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
