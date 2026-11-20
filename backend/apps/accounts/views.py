"""Vues d'authentification : inscription, connexion, profil, mot de passe oublié."""

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .emails import notify_admins_new_account, send_password_reset_email
from .serializers import (
    LoginSerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    SignupSerializer,
    UserSerializer,
)
from .sessions import revoke_all_sessions


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


class CurrentUserView(generics.RetrieveUpdateDestroyAPIView):
    """Profil de l'utilisateur connecté (page Mon espace).

    - GET    /api/auth/me/ : lire son profil ;
    - PATCH  /api/auth/me/ : modifier son prénom et son nom ;
    - DELETE /api/auth/me/ : supprimer son compte (droit à l'effacement du RGPD).
    """

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_object(self):
        """Renvoie l'utilisateur du token : pas d'id dans l'URL, donc pas d'accès aux autres profils."""
        return self.request.user

    def destroy(self, request, *args, **kwargs):
        """Supprime le compte et ses articles, après confirmation du mot de passe.

        Le mot de passe est redemandé : un token volé ne doit pas suffire à
        effacer un compte.
        """
        user = request.user
        if not user.check_password(request.data.get("password", "")):
            return Response({"password": ["Mot de passe incorrect."]}, status=status.HTTP_400_BAD_REQUEST)
        revoke_all_sessions(user)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PasswordChangeView(APIView):
    """POST /api/auth/password-change/ — change le mot de passe d'un utilisateur connecté."""

    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_change"

    def post(self, request):
        """Change le mot de passe, puis ouvre une session neuve pour cet appareil.

        Toutes les sessions viennent d'être coupées : sans nouveaux tokens,
        l'utilisateur serait déconnecté de l'appareil qu'il est en train d'utiliser.
        """
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        refresh = RefreshToken.for_user(serializer.save())
        return Response(
            {
                "detail": "Mot de passe modifié. Vos autres appareils ont été déconnectés.",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            }
        )


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
