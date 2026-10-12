"""Sérialiseur du formulaire de contact."""

from rest_framework import serializers

from .models import ContactMessage


class ContactMessageSerializer(serializers.ModelSerializer):
    """Valide et enregistre un message envoyé depuis la page Contact."""

    class Meta:
        model = ContactMessage
        fields = ["id", "first_name", "last_name", "email", "message", "created_at"]
        read_only_fields = ["id", "created_at"]
        # Un message trop court est généralement du bruit ou du spam. DRF retire
        # les espaces autour du texte avant de mesurer sa longueur.
        extra_kwargs = {
            "message": {
                "min_length": 10,
                "error_messages": {"min_length": "Le message doit contenir au moins 10 caractères."},
            },
        }
