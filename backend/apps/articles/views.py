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
        """Retourne les articles publiés, auxquels s'ajoutent les brouillons de l'utilisateur.

        Un visiteur non authentifié ne voit que les articles publiés. Un
        utilisateur connecté voit en plus ses propres brouillons, afin de
        pouvoir les relire et les modifier.
        """
        queryset = Article.objects.select_related("author")
        user = self.request.user

        if user.is_authenticated:
            if user.is_staff:
                return queryset
            return queryset.filter(Q(is_published=True) | Q(author=user))

        return queryset.filter(is_published=True)
