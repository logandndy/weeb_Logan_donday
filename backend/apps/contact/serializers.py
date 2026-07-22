"""Sérialiseur du formulaire de contact."""

from rest_framework import serializers

from .models import ContactMessage


class ContactMessageSerializer(serializers.ModelSerializer):
    """Valide et enregistre un message envoyé depuis la page Contact."""

    class Meta:
        model = ContactMessage
        fields = ["id", "first_name", "last_name", "email", "message", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_message(self, value):
        """Refuse les messages trop courts, généralement du bruit ou du spam."""
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Le message doit contenir au moins 10 caractères.")
        return value.strip()
