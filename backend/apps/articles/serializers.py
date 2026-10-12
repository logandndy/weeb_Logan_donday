"""Sérialiseurs de l'application `articles`."""

from rest_framework import serializers

from .models import Article


class ArticleAuthorSerializer(serializers.Serializer):
    """Représentation réduite de l'auteur, imbriquée dans la réponse d'un article."""

    id = serializers.IntegerField(read_only=True)
    full_name = serializers.CharField(source="get_full_name", read_only=True)


class ArticleListSerializer(serializers.ModelSerializer):
    """Version allégée utilisée pour la liste des articles (page Blog).

    Le contenu complet est volontairement omis pour ne pas alourdir la réponse.
    """

    author = ArticleAuthorSerializer(read_only=True)

    class Meta:
        model = Article
        fields = ["id", "title", "slug", "excerpt", "cover_image", "author", "created_at"]


class ArticleDetailSerializer(ArticleListSerializer):
    """Version complète, utilisée en lecture détaillée, création et mise à jour.

    Elle hérite de la version liste (même auteur imbriqué) et ajoute le contenu,
    le statut de publication et la date de modification.
    """

    class Meta(ArticleListSerializer.Meta):
        fields = [
            "id",
            "title",
            "slug",
            "excerpt",
            "content",
            "cover_image",
            "author",
            "is_published",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "author", "created_at", "updated_at"]
        # DRF retire déjà les espaces autour du texte (trim_whitespace) : la
        # longueur minimale est donc vérifiée sur le texte réel. Elle évite les
        # titres peu explicites et les articles quasiment vides.
        extra_kwargs = {
            "title": {
                "min_length": 5,
                "error_messages": {"min_length": "Le titre doit contenir au moins 5 caractères."},
            },
            "content": {
                "min_length": 50,
                "error_messages": {"min_length": "Le contenu doit contenir au moins 50 caractères."},
            },
        }
