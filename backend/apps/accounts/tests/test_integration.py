"""Tests d'intégration des endpoints d'authentification.

Ici on passe par de vraies requêtes HTTP (client de test de DRF) et une vraie
base de données de test : on vérifie que vue, sérialiseur, modèle, JWT et
limitation de débit fonctionnent ensemble, comme pour le frontend.
"""

import re

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import tag
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.serializers import build_password_reset_payload
from weeb_api.tests.factories import VALID_PASSWORD, ThrottleResetMixin, auth_client, make_user

User = get_user_model()

NOUVEAU_MDP = "NouveauMotDePasse!2026"


@tag("integration")
class SignupTests(ThrottleResetMixin, APITestCase):
    """POST /api/auth/signup/ : création d'un compte en attente de validation."""

    url = "/api/auth/signup/"

    def inscription(self, **modifs):
        data = {
            "first_name": "Ada",
            "last_name": "Lovelace",
            "email": "ada@weeb.fr",
            "password": VALID_PASSWORD,
            "password_confirm": VALID_PASSWORD,
        }
        data.update(modifs)
        return self.client.post(self.url, data, format="json")

    def test_signup_cree_un_compte_en_attente_de_validation(self):
        response = self.inscription()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email="ada@weeb.fr")
        self.assertFalse(user.is_active, "Le compte doit être validé par un administrateur.")

    def test_signup_repond_avec_le_message_et_sans_mot_de_passe(self):
        response = self.inscription()

        self.assertEqual(
            response.data["detail"],
            "Votre compte a bien été créé. Il doit être validé par un "
            "administrateur avant que vous puissiez vous connecter.",
        )
        self.assertNotIn("password", response.data)
        self.assertNotIn("password_confirm", response.data)

    def test_signup_refuse_un_email_deja_utilise(self):
        make_user(email="ada@weeb.fr")

        response = self.inscription(email="ADA@weeb.fr", last_name="L")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signup_refuse_deux_mots_de_passe_differents(self):
        response = self.inscription(password_confirm="AutreMotDePasse!2026")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


@tag("integration")
class LoginTests(ThrottleResetMixin, APITestCase):
    """POST /api/auth/login/ et GET /api/auth/me/."""

    def setUp(self):
        super().setUp()
        # Compte inscrit mais pas encore validé par un administrateur.
        self.user = make_user(email="ada@weeb.fr", active=False)

    def connexion(self, email, password=VALID_PASSWORD):
        return self.client.post(
            "/api/auth/login/", {"email": email, "password": password}, format="json"
        )

    def activer(self):
        self.user.is_active = True
        self.user.save()

    def test_login_refuse_un_compte_non_valide(self):
        response = self.connexion(self.user.email)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_retourne_les_tokens_et_le_profil(self):
        self.activer()

        response = self.connexion(self.user.email)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], self.user.email)

    def test_login_renvoie_le_profil_complet_attendu_par_le_frontend(self):
        self.activer()

        response = self.connexion(self.user.email)

        self.assertEqual(
            set(response.data["user"]),
            {"id", "email", "first_name", "last_name", "full_name", "is_active", "is_staff", "date_joined"},
        )

    def test_login_avec_email_en_majuscules(self):
        """Correction de bug : l'inscription enregistre l'email en minuscules,
        la connexion doit donc accepter la même adresse tapée avec des majuscules."""
        self.activer()

        response = self.connexion("Ada@WEEB.fr")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_login_refuse_un_mauvais_mot_de_passe(self):
        self.activer()

        response = self.connexion(self.user.email, "MauvaisMotDePasse!1")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_login_refuse_un_email_inconnu(self):
        response = self.connexion("inconnu@weeb.fr")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_exige_un_token(self):
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_retourne_le_profil_connecte(self):
        self.activer()
        auth_client(self.client, self.user)

        response = self.client.get("/api/auth/me/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["full_name"], "Ada Lovelace")

    def test_me_refuse_un_compte_desactive_apres_la_connexion(self):
        """Un admin suspend le compte : le token déjà délivré ne doit plus rien ouvrir."""
        self.activer()
        auth_client(self.client, self.user)
        self.user.is_active = False
        self.user.save()

        response = self.client.get("/api/auth/me/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


@tag("integration")
class TokenTests(ThrottleResetMixin, APITestCase):
    """Renouvellement (/refresh/) et vérification (/verify/) des tokens JWT."""

    def setUp(self):
        super().setUp()
        make_user(email="ada@weeb.fr")
        response = self.client.post(
            "/api/auth/login/", {"email": "ada@weeb.fr", "password": VALID_PASSWORD}, format="json"
        )
        self.tokens = response.data

    def test_refresh_donne_un_nouveau_couple_de_tokens(self):
        """ROTATE_REFRESH_TOKENS : chaque renouvellement fournit aussi un nouveau refresh."""
        response = self.client.post(
            "/api/auth/refresh/", {"refresh": self.tokens["refresh"]}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertNotEqual(response.data["refresh"], self.tokens["refresh"])

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        self.assertEqual(self.client.get("/api/auth/me/").status_code, status.HTTP_200_OK)

    def test_refresh_refuse_un_token_invalide(self):
        response = self.client.post("/api/auth/refresh/", {"refresh": "invalide"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_verify_accepte_un_token_valide_et_refuse_un_faux(self):
        valide = self.client.post("/api/auth/verify/", {"token": self.tokens["access"]}, format="json")
        faux = self.client.post("/api/auth/verify/", {"token": "faux"}, format="json")

        self.assertEqual(valide.status_code, status.HTTP_200_OK)
        self.assertEqual(faux.status_code, status.HTTP_401_UNAUTHORIZED)


@tag("integration")
class PasswordResetTests(ThrottleResetMixin, APITestCase):
    """Parcours de réinitialisation du mot de passe."""

    def setUp(self):
        super().setUp()
        self.user = make_user(email="ada@weeb.fr")

    def confirmer(self, uid, token, password=NOUVEAU_MDP):
        return self.client.post(
            "/api/auth/password-reset/confirm/",
            {"uid": uid, "token": token, "new_password": password, "new_password_confirm": password},
            format="json",
        )

    def connexion(self, password):
        return self.client.post(
            "/api/auth/login/", {"email": "ada@weeb.fr", "password": password}, format="json"
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

        response = self.confirmer(payload["uid"], payload["token"])

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(NOUVEAU_MDP))

    def test_confirmation_refuse_un_token_invalide(self):
        payload = build_password_reset_payload(self.user)

        response = self.confirmer(payload["uid"], "token-invalide")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_parcours_complet_depuis_le_lien_recu_par_email(self):
        """Demande -> lien lu dans l'email -> nouveau mot de passe -> connexion -> lien périmé."""
        self.client.post("/api/auth/password-reset/", {"email": "ada@weeb.fr"}, format="json")
        uid, token = re.search(r"uid=([^&\s]+)&token=(\S+)", mail.outbox[0].body).groups()

        self.assertEqual(self.confirmer(uid, token).status_code, status.HTTP_200_OK)
        self.assertEqual(self.connexion(NOUVEAU_MDP).status_code, status.HTTP_200_OK)
        self.assertEqual(self.connexion(VALID_PASSWORD).status_code, status.HTTP_401_UNAUTHORIZED)

        rejoue = self.confirmer(uid, token, "EncoreUnAutre!2026")
        self.assertEqual(rejoue.status_code, status.HTTP_400_BAD_REQUEST)


@tag("integration")
class PasswordResetEmailTests(ThrottleResetMixin, APITestCase):
    """La demande de réinitialisation envoie bien le lien par email."""

    def setUp(self):
        super().setUp()
        self.user = make_user(email="ada@weeb.fr")

    def test_demande_envoie_un_email_avec_le_lien(self):
        self.client.post("/api/auth/password-reset/", {"email": self.user.email}, format="json")

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [self.user.email])
        self.assertIn("/reset-password?uid=", mail.outbox[0].body)

    def test_aucun_email_pour_une_adresse_inconnue(self):
        self.client.post("/api/auth/password-reset/", {"email": "inconnu@weeb.fr"}, format="json")

        self.assertEqual(len(mail.outbox), 0)


@tag("integration")
class ThrottlingTests(ThrottleResetMixin, APITestCase):
    """Limitation du nombre de requêtes sur les routes publiques (réponse 429 au-delà)."""

    def test_connexion_bloquee_apres_5_essais_par_minute(self):
        credentials = {"email": "ada@weeb.fr", "password": "MauvaisMotDePasse"}
        for _ in range(5):
            response = self.client.post("/api/auth/login/", credentials, format="json")
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        response = self.client.post("/api/auth/login/", credentials, format="json")

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_reinitialisation_bloquee_apres_5_demandes_par_heure(self):
        for _ in range(5):
            self.client.post("/api/auth/password-reset/", {"email": "ada@weeb.fr"}, format="json")

        response = self.client.post(
            "/api/auth/password-reset/", {"email": "ada@weeb.fr"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_inscription_bloquee_apres_10_par_heure(self):
        for i in range(10):
            self.client.post("/api/auth/signup/", {"email": f"spam{i}@weeb.fr"}, format="json")

        response = self.client.post("/api/auth/signup/", {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_chaque_route_a_son_propre_compteur(self):
        """Être bloqué sur la connexion ne doit pas empêcher de demander un nouveau mot de passe."""
        credentials = {"email": "ada@weeb.fr", "password": "MauvaisMotDePasse"}
        for _ in range(6):
            self.client.post("/api/auth/login/", credentials, format="json")

        response = self.client.post(
            "/api/auth/password-reset/", {"email": "ada@weeb.fr"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
