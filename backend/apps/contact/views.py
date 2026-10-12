"""Vue d'enregistrement des messages du formulaire de contact."""

from rest_framework import generics, permissions
from rest_framework.throttling import ScopedRateThrottle

from .models import ContactMessage
from .serializers import ContactMessageSerializer


class ContactMessageCreateView(generics.CreateAPIView):
    """POST /api/contact/ — enregistre un message envoyé par un visiteur.

    L'endpoint est ouvert : le formulaire de contact doit rester accessible aux
    visiteurs non authentifiés.
    """

    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [permissions.AllowAny]
    # Ouvert à tous, donc limité pour éviter le spam.
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "contact"
