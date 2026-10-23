"""Vues d'authentification : inscription, connexion, session, profil, mot de passe oublié."""

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from rest_framework import generics, permissions, status
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .emails import (
    notify_admins_new_account,
    send_account_exists_email,
    send_password_reset_email,
)
from .serializers import (
    LoginSerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    SignupSerializer,
    UserSerializer,
)
from .sessions import (
    REFRESH_COOKIE,
    delete_refresh_cookie,
    revoke_all_sessions,
    set_refresh_cookie,
)


class SignupView(generics.CreateAPIView):
    """POST /api/auth/signup/ — crée un compte en attente de validation."""

    serializer_class = SignupSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "signup"

    def create(self, request, *args, **kwargs):
        """Crée le compte, ou prévient le titulaire si l'adresse a déjà un compte.

        La réponse est la même dans les deux cas : un message, sans identifiant.
        Sinon, n'importe qui pourrait tester des adresses pour savoir qui est
        inscrit (énumération des comptes). Le vrai titulaire, lui, est prévenu
        par email. Le compte créé est inactif : le message le dit.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        existing_user = serializer.get_existing_user()
        if existing_user is None:
            notify_admins_new_account(serializer.save())
        else:
            # Hachage pour rien, mais pas inutile : une vraie création hache le
            # mot de passe (opération volontairement lente). Sans lui, une
            # réponse plus rapide trahirait une adresse déjà inscrite.
            make_password(serializer.validated_data["password"])
            send_account_exists_email(existing_user)

        return Response(
            {
                "detail": "Inscription enregistrée. Votre compte doit être validé par un "
                "administrateur avant que vous puissiez vous connecter. Si cette adresse "
                "avait déjà un compte, un email vous l'indique."
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ — ouvre une session.

    La réponse contient le token d'accès et le profil. Le token de
    rafraîchissement part dans un cookie HttpOnly (voir sessions.py).
    """

    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request, *args, **kwargs):
        """Vérifie les identifiants (parent), puis déplace le refresh dans le cookie."""
        response = super().post(request, *args, **kwargs)
        set_refresh_cookie(response, response.data.pop("refresh"))
        return response


class RefreshView(APIView):
    """POST /api/auth/refresh/ — nouveau token d'accès, à partir du cookie de session.

    Le cookie est renouvelé à chaque appel (rotation) et l'ancien token est mis
    sur liste noire : un token volé puis rejoué ne sert qu'une fois.
    """

    permission_classes = [permissions.AllowAny]
    # Aucun token d'accès n'est attendu ici : il est justement expiré.
    authentication_classes = []

    def post(self, request):
        """Renvoie un token d'accès neuf, ou 401 et efface le cookie si la session est finie."""
        serializer = TokenRefreshSerializer(data={"refresh": request.COOKIES.get(REFRESH_COOKIE, "")})
        try:
            is_valid = serializer.is_valid()
        except (TokenError, AuthenticationFailed, get_user_model().DoesNotExist):
            # Token expiré ou révoqué, compte suspendu ou supprimé.
            is_valid = False

        if not is_valid:
            response = Response(
                {"detail": "Votre session a expiré. Reconnectez-vous."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            delete_refresh_cookie(response)
            return response

        response = Response({"access": serializer.validated_data["access"]})
        set_refresh_cookie(response, serializer.validated_data["refresh"])
        return response


class LogoutView(APIView):
    """POST /api/auth/logout/ — ferme la session de ce navigateur.

    Le token du cookie est mis sur liste noire côté serveur, puis le cookie
    est effacé. Même sans cookie valide, la réponse est un succès : le but
    (ne plus être connecté) est atteint.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        """Révoque le token du cookie s'il est encore valable, puis efface le cookie."""
        token = request.COOKIES.get(REFRESH_COOKIE)
        if token:
            try:
                RefreshToken(token).blacklist()
            except TokenError:
                pass  # déjà expiré ou révoqué
        response = Response(status=status.HTTP_204_NO_CONTENT)
        delete_refresh_cookie(response)
        return response


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
        response = Response(status=status.HTTP_204_NO_CONTENT)
        delete_refresh_cookie(response)
        return response


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
        response = Response(
            {
                "detail": "Mot de passe modifié. Vos autres appareils ont été déconnectés.",
                "access": str(refresh.access_token),
            }
        )
        set_refresh_cookie(response, refresh)
        return response


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
