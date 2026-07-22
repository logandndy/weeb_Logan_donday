"""Sérialiseurs de l'application `accounts`.

Ils assurent la validation des données entrantes (inscription, connexion,
réinitialisation de mot de passe) et le formatage des données sortantes.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Représentation publique d'un utilisateur, renvoyée par `/api/auth/me/`."""

    full_name = serializers.CharField(source="get_full_name", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "is_active",
            "is_staff",
            "date_joined",
        ]
        read_only_fields = fields


class SignupSerializer(serializers.ModelSerializer):
    """Valide et crée un compte à partir du formulaire d'inscription.

    Le compte est créé avec `is_active=False` : il devra être validé par un
    administrateur avant que l'utilisateur puisse se connecter.
    """

    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email", "password", "password_confirm"]

    def validate_email(self, value):
        """Vérifie que l'email n'est pas déjà utilisé, sans tenir compte de la casse."""
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un compte existe déjà avec cette adresse email.")
        return value.lower()

    def validate(self, attrs):
        """Vérifie que les deux mots de passe saisis sont identiques."""
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Les deux mots de passe ne correspondent pas."}
            )
        return attrs

    def create(self, validated_data):
        """Crée l'utilisateur en retirant le champ de confirmation, qui n'est pas persisté."""
        validated_data.pop("password_confirm")
        return User.objects.create_user(**validated_data)


class LoginSerializer(TokenObtainPairSerializer):
    """Délivre une paire de tokens JWT et y joint le profil de l'utilisateur.

    `TokenObtainPairSerializer` refuse déjà les comptes `is_active=False` ; on
    surcharge uniquement la réponse pour éviter au frontend un appel
    supplémentaire à `/api/auth/me/` juste après la connexion.
    """

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class PasswordResetRequestSerializer(serializers.Serializer):
    """Reçoit l'email pour lequel une réinitialisation de mot de passe est demandée."""

    email = serializers.EmailField()

    def get_user(self):
        """Retourne l'utilisateur correspondant à l'email, ou `None` s'il n'existe pas.

        On ne lève volontairement pas d'erreur quand l'email est inconnu : cela
        permettrait à un attaquant de savoir quels comptes existent.
        """
        return User.objects.filter(email__iexact=self.validated_data["email"]).first()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Valide le lien de réinitialisation et applique le nouveau mot de passe."""

    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])
    new_password_confirm = serializers.CharField()

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password_confirm"]:
            raise serializers.ValidationError(
                {"new_password_confirm": "Les deux mots de passe ne correspondent pas."}
            )

        try:
            user_id = force_str(urlsafe_base64_decode(attrs["uid"]))
            user = User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            raise serializers.ValidationError({"uid": "Lien de réinitialisation invalide."})

        if not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError(
                {"token": "Lien de réinitialisation invalide ou expiré."}
            )

        attrs["user"] = user
        return attrs

    def save(self):
        """Enregistre le nouveau mot de passe de l'utilisateur ciblé par le lien."""
        user = self.validated_data["user"]
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user


def build_password_reset_payload(user):
    """Construit l'identifiant encodé et le token à insérer dans le lien de réinitialisation."""
    return {
        "uid": urlsafe_base64_encode(force_bytes(user.pk)),
        "token": default_token_generator.make_token(user),
    }
