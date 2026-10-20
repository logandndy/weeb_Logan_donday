"""Vues d'authentification : inscription, connexion, profil, mot de passe oublié."""

from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .emails import notify_admins_new_account, send_password_reset_email
from .serializers import (
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    SignupSerializer,
    UserSerializer,
)


class SignupView(generics.CreateAPIView):
    """POST /api/auth/signup/ — crée un compte en attente de validation."""

    serializer_class = SignupSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "signup"

    def perform_create(self, serializer):
        """Crée le compte, puis prévient les administrateurs qu'il attend leur validation."""
        notify_admins_new_account(serializer.save())

    def create(self, request, *args, **kwargs):
        """Crée le compte, puis ajoute un message que le frontend affiche tel quel.

        Le compte étant inactif, on prévient l'utilisateur qu'il ne pourra se
        connecter qu'après validation par un administrateur.
        """
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
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"


class CurrentUserView(generics.RetrieveAPIView):
    """GET /api/auth/me/ — retourne le profil de l'utilisateur connecté."""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        """Renvoie l'utilisateur du token : pas d'id dans l'URL, donc pas d'accès aux autres profils."""
        return self.request.user


class PasswordResetRequestView(APIView):
    """POST /api/auth/password-reset/ — envoie un lien de réinitialisation par email."""

    permission_classes = [permissions.AllowAny]
    # Limite le nombre d'emails qu'on peut faire envoyer à une adresse.
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset"

    def post(self, request):
        """Envoie l'email si le compte existe, puis répond toujours la même chose."""
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.get_user()
        if user is not None:
            send_password_reset_email(user)

        # Réponse identique que l'email existe ou non, pour ne pas révéler
        # quels comptes sont enregistrés.
        return Response(
            {
                "detail": "Si un compte existe avec cette adresse, "
                "un email de réinitialisation vient d'être envoyé."
            }
        )


class PasswordResetConfirmView(APIView):
    """POST /api/auth/password-reset/confirm/ — applique le nouveau mot de passe."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        """Valide le lien et le nouveau mot de passe, puis l'enregistre."""
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Votre mot de passe a bien été réinitialisé."})
