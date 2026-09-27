"""Configuration de l'admin Django pour les articles."""

from django.contrib import admin

from .models import Article


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    """Permet à l'administrateur de relire, publier ou dépublier les articles."""

    list_display = ["title", "author", "is_published", "created_at"]
    list_filter = ["is_published", "created_at", "author"]
    search_fields = ["title", "excerpt", "content", "author__email"]
    prepopulated_fields = {"slug": ["title"]}
    readonly_fields = ["created_at", "updated_at"]
    autocomplete_fields = ["author"]
    date_hierarchy = "created_at"

    actions = ["publier", "depublier"]

    @admin.action(description="Publier les articles sélectionnés")
    def publier(self, request, queryset):
        """Rend visibles les articles sélectionnés."""
        updated = queryset.update(is_published=True)
        self.message_user(request, f"{updated} article(s) publié(s).")

    @admin.action(description="Dépublier les articles sélectionnés")
    def depublier(self, request, queryset):
        """Masque les articles sélectionnés du blog public."""
        updated = queryset.update(is_published=False)
        self.message_user(request, f"{updated} article(s) dépublié(s).")
