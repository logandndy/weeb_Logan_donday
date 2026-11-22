"""Configuration de l'admin Django pour la newsletter."""

from django.contrib import admin

from .models import Subscriber


@admin.register(Subscriber)
class SubscriberAdmin(admin.ModelAdmin):
    """Liste des inscrits, en lecture seule : on s'inscrit uniquement depuis le site."""

    list_display = ["email", "created_at"]
    search_fields = ["email"]
    readonly_fields = ["email", "created_at"]
    date_hierarchy = "created_at"

    def has_add_permission(self, request):
        """Interdit l'ajout manuel : une inscription doit venir de la personne elle-même."""
        return False
