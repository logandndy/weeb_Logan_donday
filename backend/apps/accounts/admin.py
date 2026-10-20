"""Configuration de l'admin Django pour les utilisateurs.

C'est depuis cette interface que l'administrateur valide les comptes en attente
(passage de `is_active` à `True`).
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .emails import send_account_validated_email
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin des utilisateurs, adapté à un modèle identifié par email."""

    ordering = ["-date_joined"]
    list_display = ["email", "first_name", "last_name", "is_active", "is_staff", "date_joined"]
    list_filter = ["is_active", "is_staff", "is_superuser", "date_joined"]
    search_fields = ["email", "first_name", "last_name"]
    readonly_fields = ["date_joined", "last_login"]

    fieldsets = [
        (None, {"fields": ["email", "password"]}),
        ("Identité", {"fields": ["first_name", "last_name"]}),
        (
            "Permissions",
            {
                "fields": ["is_active", "is_staff", "is_superuser", "groups", "user_permissions"],
                "description": (
                    "Cochez « compte validé » pour autoriser l'utilisateur à se "
                    "connecter et à publier des articles."
                ),
            },
        ),
        ("Dates", {"fields": ["last_login", "date_joined"]}),
    ]

    add_fieldsets = [
        (
            None,
            {
                "classes": ["wide"],
                "fields": ["email", "first_name", "last_name", "password1", "password2", "is_active"],
            },
        ),
    ]

    actions = ["valider_comptes", "suspendre_comptes"]

    @admin.action(description="Valider les comptes sélectionnés")
    def valider_comptes(self, request, queryset):
        """Active les comptes sélectionnés et prévient chaque personne par email."""
        # Seuls les comptes encore en attente reçoivent l'email : revalider un
        # compte déjà actif ne doit pas renvoyer de message.
        en_attente = list(queryset.filter(is_active=False))
        queryset.update(is_active=True)
        for user in en_attente:
            send_account_validated_email(user)
        self.message_user(request, f"{len(en_attente)} compte(s) validé(s) et prévenu(s) par email.")

    def save_model(self, request, obj, form, change):
        """Prévient aussi l'utilisateur quand son compte est validé depuis sa fiche."""
        super().save_model(request, obj, form, change)
        if change and "is_active" in form.changed_data and obj.is_active:
            send_account_validated_email(obj)

    @admin.action(description="Suspendre les comptes sélectionnés")
    def suspendre_comptes(self, request, queryset):
        """Désactive en masse les comptes sélectionnés."""
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} compte(s) suspendu(s).")
