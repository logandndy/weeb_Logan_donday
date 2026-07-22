"""Tests des endpoints d'authentification."""

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .serializers import build_password_reset_payload

User = get_user_model()

VALID_PASSWORD = "MotDePasse!2026"


class SignupTests(APITestCase):
    """Vérifie l'inscription et la mise en attente de validation."""

    url = "/api/auth/signup/"

    def test_signup_cree_un_compte_en_attente_de_validation(self):
        response = self.client.post(
            self.url,
            {
                "first_name": "Ada",
                "last_name": "Lovelace",
                "email": "ada@weeb.fr",
                "password": VALID_PASSWORD,
                "password_confirm": VALID_PASSWORD,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email="ada@weeb.fr")
        self.assertFalse(user.is_active, "Le compte doit être validé par un administrateur.")

    def test_signup_refuse_un_email_deja_utilise(self):
        User.objects.create_user(
            email="ada@weeb.fr", password=VALID_PASSWORD, first_name="Ada", last_name="Lovelace"
        )

        response = self.client.post(
            self.url,
            {
                "first_name": "Ada",
                "last_name": "L",
                "email": "ADA@weeb.fr",
                "password": VALID_PASSWORD,
                "password_confirm": VALID_PASSWORD,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signup_refuse_deux_mots_de_passe_differents(self):
        response = self.client.post(
            self.url,
            {
                "first_name": "Ada",
                "last_name": "Lovelace",
                "email": "ada@weeb.fr",
                "password": VALID_PASSWORD,
                "password_confirm": "AutreMotDePasse!2026",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginTests(APITestCase):
    """Vérifie la connexion et l'accès au profil."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="ada@weeb.fr", password=VALID_PASSWORD, first_name="Ada", last_name="Lovelace"
        )

    def test_login_refuse_un_compte_non_valide(self):
        response = self.client.post(
            "/api/auth/login/",
            {"email": self.user.email, "password": VALID_PASSWORD},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_retourne_les_tokens_et_le_profil(self):
        self.user.is_active = True
        self.user.save()

        response = self.client.post(
            "/api/auth/login/",
            {"email": self.user.email, "password": VALID_PASSWORD},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], self.user.email)

    def test_me_exige_un_token(self):
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_retourne_le_profil_connecte(self):
        self.user.is_active = True
        self.user.save()
        self.client.force_authenticate(self.user)

        response = self.client.get("/api/auth/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["full_name"], "Ada Lovelace")


class PasswordResetTests(APITestCase):
    """Vérifie le parcours de réinitialisation du mot de passe."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="ada@weeb.fr",
            password=VALID_PASSWORD,
            first_name="Ada",
            last_name="Lovelace",
            is_active=True,
        )

    def test_demande_repond_pareil_pour_un_email_inconnu(self):
        """La réponse ne doit pas permettre de deviner quels comptes existent."""
        connu = self.client.post(
            "/api/auth/password-reset/", {"email": self.user.email}, format="json"
        )
        inconnu = self.client.post(
            "/api/auth/password-reset/", {"email": "inconnu@weeb.fr"}, format="json"
        )

        self.assertEqual(connu.status_code, status.HTTP_200_OK)
        self.assertEqual(inconnu.status_code, status.HTTP_200_OK)
        self.assertEqual(connu.data, inconnu.data)

    def test_confirmation_change_le_mot_de_passe(self):
        payload = build_password_reset_payload(self.user)
        nouveau = "NouveauMotDePasse!2026"

        response = self.client.post(
            "/api/auth/password-reset/confirm/",
            {
                "uid": payload["uid"],
                "token": payload["token"],
                "new_password": nouveau,
                "new_password_confirm": nouveau,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(nouveau))

    def test_confirmation_refuse_un_token_invalide(self):
        payload = build_password_reset_payload(self.user)

        response = self.client.post(
            "/api/auth/password-reset/confirm/",
            {
                "uid": payload["uid"],
                "token": "token-invalide",
                "new_password": "NouveauMotDePasse!2026",
                "new_password_confirm": "NouveauMotDePasse!2026",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
