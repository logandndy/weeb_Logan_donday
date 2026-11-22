"""Sérialiseurs de la newsletter."""

from rest_framework import serializers


class SubscribeSerializer(serializers.Serializer):
    """Adresse saisie dans le formulaire du pied de page."""

    email = serializers.EmailField()


class UnsubscribeSerializer(serializers.Serializer):
    """Jeton lu dans le lien de désinscription reçu par email."""

    token = serializers.UUIDField()
