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
        fields = [
            "id",
            "title",
            "slug",
            "excerpt",
            "cover_image",
            "author",
            "created_at",
        ]


class ArticleDetailSerializer(serializers.ModelSerializer):
    """Version complète, utilisée en lecture détaillée, création et mise à jour."""

    author = ArticleAuthorSerializer(read_only=True)

    class Meta:
        model = Article
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

    def validate_title(self, value):
        """Vérifie que le titre est suffisamment explicite."""
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Le titre doit contenir au moins 5 caractères.")
        return value.strip()

    def validate_content(self, value):
        """Vérifie que l'article n'est pas quasiment vide."""
        if len(value.strip()) < 50:
            raise serializers.ValidationError("Le contenu doit contenir au moins 50 caractères.")
        return value.strip()

    def create(self, validated_data):
        """Rattache automatiquement l'article à l'utilisateur qui le crée."""
        validated_data["author"] = self.context["request"].user
        return super().create(validated_data)
