"""Vues CRUD des articles du blog."""

from django.db.models import Q
from rest_framework import permissions, viewsets

from .models import Article
from .permissions import IsAuthorOrReadOnly
from .serializers import ArticleDetailSerializer, ArticleListSerializer


class ArticleViewSet(viewsets.ModelViewSet):
    """CRUD complet sur les articles.

    - `GET /api/articles/` et `GET /api/articles/<slug>/` sont publics ;
    - `POST`, `PUT`, `PATCH` et `DELETE` exigent un compte authentifié et validé ;
    - seul l'auteur d'un article (ou un administrateur) peut le modifier ou le
      supprimer, via la permission `IsAuthorOrReadOnly`.
    """

    lookup_field = "slug"
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]

    def get_serializer_class(self):
        """Utilise le sérialiseur allégé pour la liste, complet pour le reste."""
        if self.action == "list":
            return ArticleListSerializer
        return ArticleDetailSerializer

    def get_queryset(self):
        """Retourne les articles visibles selon l'action et l'utilisateur.

        - La liste publique (page Blog) ne montre que les articles publiés,
          pour tout le monde : un brouillon n'a rien à faire dans le blog.
        - La liste `?mine=true` (page Mon espace) montre tous les articles de
          l'utilisateur connecté, brouillons compris.
        - Pour un article précis, l'auteur voit aussi ses brouillons, afin de
          pouvoir les relire et les modifier. Un administrateur voit tout.
        """
        # select_related : l'auteur est chargé dans la même requête SQL que
        # l'article, au lieu d'une requête par article de la liste.
        queryset = Article.objects.select_related("author")
        user = self.request.user

        if self.action == "list":
            if self.request.query_params.get("mine") == "true" and user.is_authenticated:
                return queryset.filter(author=user)
            return queryset.filter(is_published=True)

        if user.is_staff:
            return queryset
        if user.is_authenticated:
            return queryset.filter(Q(is_published=True) | Q(author=user))
        return queryset.filter(is_published=True)

    def perform_create(self, serializer):
        """Rattache l'article à l'utilisateur connecté, jamais à un auteur envoyé par le client."""
        serializer.save(author=self.request.user)
