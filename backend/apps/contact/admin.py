"""Configuration de l'admin Django pour les messages de contact."""

from django.contrib import admin

from .models import ContactMessage


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    """Consultation des messages reçus et suivi de leur traitement."""

    list_display = ["first_name", "last_name", "email", "is_handled", "created_at"]
    list_filter = ["is_handled", "created_at"]
    search_fields = ["first_name", "last_name", "email", "message"]
    readonly_fields = ["first_name", "last_name", "email", "message", "created_at"]
    date_hierarchy = "created_at"

    actions = ["marquer_traite"]

    @admin.action(description="Marquer comme traité")
    def marquer_traite(self, request, queryset):
        """Marque les messages sélectionnés comme traités."""
        updated = queryset.update(is_handled=True)
        self.message_user(request, f"{updated} message(s) marqué(s) comme traité(s).")

    def has_add_permission(self, request):
        """Interdit la création manuelle : les messages viennent du formulaire public."""
        return False
