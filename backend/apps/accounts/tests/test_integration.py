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
from apps.accounts.sessions import REFRESH_COOKIE
from apps.articles.models import Article
from weeb_api.tests.factories import (
    VALID_PASSWORD,
    ThrottleResetMixin,
    auth_client,
    make_admin,
    make_article,
    make_user,
)

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
            "Inscription enregistrée. Votre compte doit être validé par un "
            "administrateur avant que vous puissiez vous connecter. Si cette adresse "
            "avait déjà un compte, un email vous l'indique.",
        )
        self.assertNotIn("password", response.data)
        self.assertNotIn("password_confirm", response.data)

    def test_signup_ne_renvoie_ni_identifiant_ni_donnees(self):
        response = self.inscription()

        self.assertEqual(set(response.data), {"detail"})

    def test_email_deja_utilise_meme_reponse_qu_une_vraie_inscription(self):
        """Sinon, on pourrait tester des adresses pour savoir qui a un compte."""
        nouvelle = self.inscription(email="bob@weeb.fr")
        make_user(email="ada@weeb.fr")

        existante = self.inscription(email="ADA@weeb.fr", last_name="L")

        self.assertEqual(existante.status_code, nouvelle.status_code)
        self.assertEqual(existante.data, nouvelle.data)

    def test_email_deja_utilise_ne_cree_rien_et_previent_le_titulaire(self):
        titulaire = make_user(email="ada@weeb.fr")

        self.inscription(email="ADA@weeb.fr", password=NOUVEAU_MDP, password_confirm=NOUVEAU_MDP)

        self.assertEqual(User.objects.filter(email__iexact="ada@weeb.fr").count(), 1)
        titulaire.refresh_from_db()
        self.assertTrue(titulaire.check_password(VALID_PASSWORD), "Le mot de passe ne doit pas changer.")
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["ada@weeb.fr"])
        self.assertIn("vous en avez déjà un", mail.outbox[0].body)

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

    def test_login_retourne_le_token_d_acces_et_le_profil(self):
        self.activer()

        response = self.connexion(self.user.email)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertEqual(response.data["user"]["email"], self.user.email)

    def test_le_refresh_part_dans_un_cookie_protege_et_jamais_dans_le_json(self):
        """Un token lisible par le JavaScript pourrait être volé par une faille XSS."""
        self.activer()

        response = self.connexion(self.user.email)

        self.assertNotIn("refresh", response.data)
        cookie = response.cookies[REFRESH_COOKIE]
        self.assertTrue(cookie["httponly"])
        self.assertEqual(cookie["samesite"], "Strict")
        self.assertEqual(cookie["path"], "/api/auth/")

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
    """Renouvellement des tokens JWT (/refresh/)."""

    def setUp(self):
        super().setUp()
        self.user = make_user(email="ada@weeb.fr")
        # Le client de test garde les cookies, comme un navigateur.
        self.client.post(
            "/api/auth/login/", {"email": "ada@weeb.fr", "password": VALID_PASSWORD}, format="json"
        )
        self.refresh = self.client.cookies[REFRESH_COOKIE].value

    def test_refresh_donne_un_token_d_acces_et_renouvelle_le_cookie(self):
        """ROTATE_REFRESH_TOKENS : chaque renouvellement fournit aussi un nouveau refresh."""
        response = self.client.post("/api/auth/refresh/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("refresh", response.data)
        self.assertNotEqual(response.cookies[REFRESH_COOKIE].value, self.refresh)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        self.assertEqual(self.client.get("/api/auth/me/").status_code, status.HTTP_200_OK)

    def test_refresh_sans_cookie_renvoie_401(self):
        self.client.cookies.clear()

        response = self.client.post("/api/auth/refresh/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data["detail"], "Votre session a expiré. Reconnectez-vous.")

    def test_refresh_refuse_un_token_invalide_et_efface_le_cookie(self):
        self.client.cookies[REFRESH_COOKIE] = "invalide"

        response = self.client.post("/api/auth/refresh/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.cookies[REFRESH_COOKIE].value, "")

    def test_refresh_d_un_compte_supprime_renvoie_401_et_non_500(self):
        """La suppression du compte efface aussi sa liste noire : le token doit quand même être refusé."""
        self.user.delete()

        response = self.client.post("/api/auth/refresh/")

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


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

    def test_aucun_email_pour_un_compte_pas_encore_valide(self):
        make_user(email="attente@weeb.fr", active=False)

        response = self.client.post(
            "/api/auth/password-reset/", {"email": "attente@weeb.fr"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
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


@tag("integration")
class ValidationDesComptesTests(ThrottleResetMixin, APITestCase):
    """Inscription et validation par l'admin : chaque étape prévient la bonne personne."""

    def setUp(self):
        super().setUp()
        self.admin = make_admin()

    def test_l_inscription_previent_les_admins(self):
        self.client.post(
            "/api/auth/signup/",
            {
                "first_name": "Bob",
                "last_name": "Martin",
                "email": "bob@weeb.fr",
                "password": VALID_PASSWORD,
                "password_confirm": VALID_PASSWORD,
            },
            format="json",
        )

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [self.admin.email])

    def test_l_action_valider_previent_seulement_les_comptes_en_attente(self):
        en_attente = make_user("attente@weeb.fr", active=False)
        deja_actif = make_user("actif@weeb.fr")
        self.client.force_login(self.admin)

        self.client.post(
            "/admin/accounts/user/",
            {"action": "valider_comptes", "_selected_action": [en_attente.pk, deja_actif.pk]},
        )

        en_attente.refresh_from_db()
        self.assertTrue(en_attente.is_active)
        self.assertEqual([m.to for m in mail.outbox], [["attente@weeb.fr"]])


@tag("integration")
class SessionsTests(ThrottleResetMixin, APITestCase):
    """Un token de rafraîchissement révoqué ne doit plus jamais donner accès au compte."""

    def setUp(self):
        super().setUp()
        self.user = make_user("ada@weeb.fr")
        self.client.post(
            "/api/auth/login/", {"email": "ada@weeb.fr", "password": VALID_PASSWORD}, format="json"
        )
        self.refresh = self.client.cookies[REFRESH_COOKIE].value

    def rafraichir(self, refresh):
        """Rejoue un token précis, comme le ferait quelqu'un qui l'aurait copié."""
        self.client.cookies[REFRESH_COOKIE] = refresh
        return self.client.post("/api/auth/refresh/")

    def test_la_deconnexion_revoque_le_token_et_efface_le_cookie(self):
        response = self.client.post("/api/auth/logout/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(response.cookies[REFRESH_COOKIE].value, "")
        self.assertEqual(self.rafraichir(self.refresh).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_la_deconnexion_reussit_meme_sans_session(self):
        self.client.cookies.clear()

        self.assertEqual(self.client.post("/api/auth/logout/").status_code, status.HTTP_204_NO_CONTENT)

    def test_un_token_deja_utilise_ne_resert_pas(self):
        """Rotation : chaque renouvellement donne un nouveau token et grille l'ancien."""
        self.assertEqual(self.rafraichir(self.refresh).status_code, status.HTTP_200_OK)
        self.assertEqual(self.rafraichir(self.refresh).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_reinitialiser_le_mot_de_passe_deconnecte_partout(self):
        payload = build_password_reset_payload(self.user)
        self.client.post(
            "/api/auth/password-reset/confirm/",
            {**payload, "new_password": NOUVEAU_MDP, "new_password_confirm": NOUVEAU_MDP},
            format="json",
        )

        self.assertEqual(self.rafraichir(self.refresh).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_suspendre_un_compte_coupe_ses_sessions(self):
        self.client.force_login(make_admin())
        self.client.post(
            "/admin/accounts/user/",
            {"action": "suspendre_comptes", "_selected_action": [self.user.pk]},
        )

        self.assertEqual(self.rafraichir(self.refresh).status_code, status.HTTP_401_UNAUTHORIZED)


@tag("integration")
class MonEspaceTests(ThrottleResetMixin, APITestCase):
    """Page Mon espace : profil, changement de mot de passe, suppression du compte."""

    def setUp(self):
        super().setUp()
        self.user = make_user("ada@weeb.fr")
        auth_client(self.client, self.user)

    def test_modifier_son_prenom_et_son_nom(self):
        response = self.client.patch("/api/auth/me/", {"first_name": "Augusta", "last_name": "King"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["full_name"], "Augusta King")

    def test_l_email_et_les_droits_ne_sont_pas_modifiables(self):
        """Un utilisateur ne doit pas pouvoir se donner les droits d'administrateur."""
        self.client.patch(
            "/api/auth/me/", {"email": "pirate@weeb.fr", "is_staff": True, "is_active": True}, format="json"
        )

        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "ada@weeb.fr")
        self.assertFalse(self.user.is_staff)

    def test_suppression_refusee_sans_le_bon_mot_de_passe(self):
        response = self.client.delete("/api/auth/me/", {"password": "mauvais"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(get_user_model().objects.filter(pk=self.user.pk).exists())

    def test_suppression_bloquee_apres_5_essais_par_heure(self):
        """Elle vérifie un mot de passe : sans limite, on pourrait le deviner par essais."""
        for _ in range(5):
            self.client.delete("/api/auth/me/", {"password": "mauvais"}, format="json")

        response = self.client.delete("/api/auth/me/", {"password": VALID_PASSWORD}, format="json")

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        self.assertEqual(self.client.get("/api/auth/me/").status_code, status.HTTP_200_OK)

    def test_supprimer_son_compte_efface_aussi_ses_articles(self):
        make_article(self.user)

        response = self.client.delete("/api/auth/me/", {"password": VALID_PASSWORD}, format="json")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(get_user_model().objects.filter(pk=self.user.pk).exists())
        self.assertFalse(Article.objects.exists())
        self.assertEqual(response.cookies[REFRESH_COOKIE].value, "")

    def changer(self, ancien, nouveau=NOUVEAU_MDP, confirmation=None):
        return self.client.post(
            "/api/auth/password-change/",
            {"old_password": ancien, "new_password": nouveau, "new_password_confirm": confirmation or nouveau},
            format="json",
        )

    def test_changement_refuse_avec_un_mauvais_mot_de_passe_actuel(self):
        response = self.changer("mauvais")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("old_password", response.data)

    def test_changement_refuse_un_mot_de_passe_faible(self):
        response = self.changer(VALID_PASSWORD, "12345678")

        self.assertIn("new_password", response.data)

    def test_changement_reussi_coupe_les_anciennes_sessions_et_en_ouvre_une(self):
        self.client.post(
            "/api/auth/login/", {"email": "ada@weeb.fr", "password": VALID_PASSWORD}, format="json"
        )
        ancien_refresh = self.client.cookies[REFRESH_COOKIE].value

        response = self.changer(VALID_PASSWORD)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        nouveau_refresh = response.cookies[REFRESH_COOKIE].value
        self.assertNotEqual(nouveau_refresh, ancien_refresh)
        self.client.cookies[REFRESH_COOKIE] = ancien_refresh
        rejoue = self.client.post("/api/auth/refresh/")
        self.assertEqual(rejoue.status_code, status.HTTP_401_UNAUTHORIZED)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(NOUVEAU_MDP))

    def test_mon_espace_exige_d_etre_connecte(self):
        self.client.credentials()

        self.assertEqual(self.client.get("/api/auth/me/").status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.changer(VALID_PASSWORD).status_code, status.HTTP_401_UNAUTHORIZED)
