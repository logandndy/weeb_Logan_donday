"""Inscription et désinscription à la newsletter."""

from django.conf import settings
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from weeb_api.mail import send_email

from .models import Subscriber
from .serializers import SubscribeSerializer, UnsubscribeSerializer


def send_welcome_email(subscriber):
    """Confirme l'inscription et donne le lien de désinscription, valable à tout moment."""
    unsubscribe_url = f"{settings.FRONTEND_URL}/newsletter/desinscription?token={subscriber.unsubscribe_token}"
    send_email(
        "Bienvenue dans la newsletter Weeb",
        "Merci pour votre inscription ! Vous recevrez nos prochains articles par email.\n\n"
        f"Pour vous désinscrire à tout moment :\n{unsubscribe_url}",
        [subscriber.email],
    )


class SubscribeView(APIView):
    """POST /api/newsletter/ — inscrit une adresse à la newsletter."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "newsletter"

    def post(self, request):
        """Inscrit l'adresse, et répond la même chose si elle l'était déjà.

        Une réponse différente révélerait quelles adresses sont inscrites.
        """
        serializer = SubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        subscriber, created = Subscriber.objects.get_or_create(
            email=serializer.validated_data["email"].lower()
        )
        if created:
            send_welcome_email(subscriber)

        return Response({"detail": "Merci ! Vous recevrez nos prochains articles par email."})


class UnsubscribeView(APIView):
    """POST /api/newsletter/unsubscribe/ — désinscrit l'adresse liée au jeton."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """Supprime l'inscription : l'adresse n'est plus conservée du tout."""
        serializer = UnsubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        Subscriber.objects.filter(unsubscribe_token=serializer.validated_data["token"]).delete()
        return Response({"detail": "Vous êtes désinscrit. Votre adresse a été supprimée."})
