"""Vues d'authentification : inscription, connexion, profil, mot de passe oublié."""

from django.conf import settings
from django.core.mail import send_mail
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    SignupSerializer,
    UserSerializer,
    build_password_reset_payload,
)


class SignupView(generics.CreateAPIView):
    """POST /api/auth/signup/ — crée un compte en attente de validation."""

    serializer_class = SignupSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        response.data["detail"] = (
            "Votre compte a bien été créé. Il doit être validé par un "
            "administrateur avant que vous puissiez vous connecter."
        )
        return response


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ — retourne une paire de tokens JWT et le profil."""

    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]


class CurrentUserView(generics.RetrieveAPIView):
    """GET /api/auth/me/ — retourne le profil de l'utilisateur connecté."""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class PasswordResetRequestView(APIView):
    """POST /api/auth/password-reset/ — envoie un lien de réinitialisation par email."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.get_user()
        if user is not None:
            payload = build_password_reset_payload(user)
            reset_url = (
                f"{settings.FRONTEND_URL}/reset-password"
                f"?uid={payload['uid']}&token={payload['token']}"
            )
            send_mail(
                subject="Réinitialisation de votre mot de passe Weeb",
                message=(
                    f"Bonjour {user.get_short_name()},\n\n"
                    "Vous avez demandé la réinitialisation de votre mot de passe. "
                    f"Cliquez sur le lien suivant pour en choisir un nouveau :\n\n{reset_url}\n\n"
                    "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )

        # Réponse identique que l'email existe ou non, pour ne pas révéler
        # quels comptes sont enregistrés.
        return Response(
            {
                "detail": "Si un compte existe avec cette adresse, "
                "un email de réinitialisation vient d'être envoyé."
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    """POST /api/auth/password-reset/confirm/ — applique le nouveau mot de passe."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {"detail": "Votre mot de passe a bien été réinitialisé."},
            status=status.HTTP_200_OK,
        )
