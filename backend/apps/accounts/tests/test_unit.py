"""Tests unitaires de l'application `accounts`.

On teste ici les briques une par une (gestionnaire d'utilisateurs, modèle,
sérialiseurs, envoi de l'email), sans passer par HTTP. Quand un de ces tests
casse, on sait tout de suite quelle fonction est en cause.
"""

from io import StringIO

from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.core.management import CommandError, call_command
from django.test import SimpleTestCase, TestCase, override_settings, tag
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import serializers

from apps.accounts.serializers import (
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    SignupSerializer,
    build_password_reset_payload,
    check_passwords_match,
)
from apps.accounts.views import send_password_reset_email
from apps.articles.models import Article
from weeb_api.tests.factories import VALID_PASSWORD, make_user

User = get_user_model()

NOUVEAU_MDP = "NouveauMotDePasse!2026"


@tag("unit")
class UserManagerTests(TestCase):
    """Création des comptes : un inscrit attend la validation, un admin est actif tout de suite."""

    def test_create_user_cree_un_compte_inactif_par_defaut(self):
        user = User.objects.create_user(email="ada@weeb.fr", password=VALID_PASSWORD)

        self.assertFalse(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_user_hache_le_mot_de_passe(self):
        user = User.objects.create_user(email="ada@weeb.fr", password=VALID_PASSWORD)

        self.assertNotEqual(user.password, VALID_PASSWORD)
        self.assertTrue(user.check_password(VALID_PASSWORD))

    def test_create_user_met_l_email_en_minuscules(self):
        user = User.objects.create_user(email="Ada.Lovelace@WEEB.FR", password=VALID_PASSWORD)

        self.assertEqual(user.email, "ada.lovelace@weeb.fr")

    def test_create_user_refuse_un_email_vide(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email="", password=VALID_PASSWORD)

    def test_create_superuser_donne_tous_les_droits(self):
        admin = User.objects.create_superuser(email="admin@weeb.fr", password=VALID_PASSWORD)

        self.assertTrue(admin.is_active)
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)

    def test_create_superuser_refuse_is_staff_false(self):
        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                email="admin@weeb.fr", password=VALID_PASSWORD, is_staff=False
            )

    def test_create_superuser_refuse_is_superuser_false(self):
        with self.assertRaises(ValueError):
            User.objects.create_superuser(
                email="admin@weeb.fr", password=VALID_PASSWORD, is_superuser=False
            )

    def test_recherche_par_email_sans_tenir_compte_de_la_casse(self):
        """C'est cette recherche qu'utilise la connexion : "ADA@weeb.fr" doit trouver le compte."""
        user = make_user(email="ada@weeb.fr")

        self.assertEqual(User.objects.get_by_natural_key("ADA@Weeb.FR"), user)


@tag("unit")
class UserModelTests(SimpleTestCase):
    """Affichage d'un utilisateur (admin, emails). Aucun accès à la base n'est nécessaire."""

    def test_str_affiche_l_email(self):
        self.assertEqual(str(User(email="ada@weeb.fr")), "ada@weeb.fr")

    def test_nom_complet_et_prenom(self):
        user = User(first_name="Ada", last_name="Lovelace")

        self.assertEqual(user.get_full_name(), "Ada Lovelace")
        self.assertEqual(user.get_short_name(), "Ada")

    def test_nom_complet_sans_espace_inutile(self):
        self.assertEqual(User(first_name="Ada", last_name="").get_full_name(), "Ada")


@tag("unit")
class CheckPasswordsMatchTests(SimpleTestCase):
    """Fonction partagée par l'inscription et la réinitialisation."""

    def test_aucune_erreur_si_identiques(self):
        check_passwords_match("abc", "abc", "password_confirm")

    def test_erreur_sur_le_champ_demande_si_differents(self):
        with self.assertRaises(serializers.ValidationError) as contexte:
            check_passwords_match("abc", "abd", "password_confirm")

        self.assertIn("password_confirm", contexte.exception.detail)


@tag("unit")
class SignupSerializerTests(TestCase):
    """Validation du formulaire d'inscription."""

    def donnees(self, **modifs):
        """Formulaire valide, dont on peut modifier un champ pour chaque cas."""
        data = {
            "first_name": "Ada",
            "last_name": "Lovelace",
            "email": "ada@weeb.fr",
            "password": VALID_PASSWORD,
            "password_confirm": VALID_PASSWORD,
        }
        data.update(modifs)
        return data

    def test_email_enregistre_en_minuscules(self):
        serializer = SignupSerializer(data=self.donnees(email="Ada@Weeb.FR"))

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.save().email, "ada@weeb.fr")

    def test_refuse_un_email_deja_pris_avec_une_autre_casse(self):
        make_user(email="ada@weeb.fr")
        serializer = SignupSerializer(data=self.donnees(email="ADA@weeb.fr"))

        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)

    def test_refuse_deux_mots_de_passe_differents(self):
        serializer = SignupSerializer(data=self.donnees(password_confirm="Autre!2026xyz"))

        self.assertFalse(serializer.is_valid())
        self.assertIn("password_confirm", serializer.errors)

    def test_refuse_les_mots_de_passe_faibles(self):
        """Trop court, trop courant ou uniquement numérique : les validateurs de Django refusent."""
        for faible in ["Ab1!", "password123", "1234567890123"]:
            with self.subTest(mot_de_passe=faible):
                serializer = SignupSerializer(
                    data=self.donnees(password=faible, password_confirm=faible)
                )

                self.assertFalse(serializer.is_valid())
                self.assertIn("password", serializer.errors)

    def test_tous_les_champs_sont_obligatoires(self):
        serializer = SignupSerializer(data={})

        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            set(serializer.errors),
            {"first_name", "last_name", "email", "password", "password_confirm"},
        )

    def test_le_mot_de_passe_n_est_jamais_renvoye(self):
        serializer = SignupSerializer(data=self.donnees())
        serializer.is_valid(raise_exception=True)
        serializer.save()

        self.assertNotIn("password", serializer.data)
        self.assertNotIn("password_confirm", serializer.data)


@tag("unit")
class PasswordResetRequestSerializerTests(TestCase):
    """Recherche du compte à partir de l'email saisi sur « mot de passe oublié »."""

    def test_trouve_le_compte_sans_tenir_compte_de_la_casse(self):
        user = make_user(email="ada@weeb.fr")
        serializer = PasswordResetRequestSerializer(data={"email": "ADA@weeb.fr"})
        serializer.is_valid(raise_exception=True)

        self.assertEqual(serializer.get_user(), user)

    def test_renvoie_none_pour_un_email_inconnu(self):
        serializer = PasswordResetRequestSerializer(data={"email": "inconnu@weeb.fr"})
        serializer.is_valid(raise_exception=True)

        self.assertIsNone(serializer.get_user())


@tag("unit")
class PasswordResetConfirmSerializerTests(TestCase):
    """Validation du lien de réinitialisation (uid + token) et du nouveau mot de passe."""

    def setUp(self):
        self.user = make_user()
        self.payload = build_password_reset_payload(self.user)

    def serializer(self, **modifs):
        data = {
            **self.payload,
            "new_password": NOUVEAU_MDP,
            "new_password_confirm": NOUVEAU_MDP,
        }
        data.update(modifs)
        return PasswordResetConfirmSerializer(data=data)

    def test_lien_valide_change_le_mot_de_passe(self):
        serializer = self.serializer()

        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(NOUVEAU_MDP))

    def test_refuse_un_uid_illisible(self):
        serializer = self.serializer(uid="pas-un-uid")

        self.assertFalse(serializer.is_valid())
        self.assertIn("uid", serializer.errors)

    def test_refuse_un_uid_de_compte_inexistant(self):
        serializer = self.serializer(uid=urlsafe_base64_encode(force_bytes(99999)))

        self.assertFalse(serializer.is_valid())
        self.assertIn("uid", serializer.errors)

    def test_refuse_un_token_falsifie(self):
        serializer = self.serializer(token="token-falsifie")

        self.assertFalse(serializer.is_valid())
        self.assertIn("token", serializer.errors)

    def test_refuse_une_confirmation_differente(self):
        serializer = self.serializer(new_password_confirm="AutreMotDePasse!2026")

        self.assertFalse(serializer.is_valid())
        self.assertIn("new_password_confirm", serializer.errors)

    def test_refuse_un_mot_de_passe_faible(self):
        serializer = self.serializer(new_password="1234", new_password_confirm="1234")

        self.assertFalse(serializer.is_valid())
        self.assertIn("new_password", serializer.errors)

    def test_le_lien_ne_sert_qu_une_fois(self):
        """Le token dépend du mot de passe : une fois celui-ci changé, le même lien est refusé."""
        premier = self.serializer()
        premier.is_valid(raise_exception=True)
        premier.save()

        rejoue = self.serializer(new_password="EncoreUnAutre!2026", new_password_confirm="EncoreUnAutre!2026")

        self.assertFalse(rejoue.is_valid())
        self.assertIn("token", rejoue.errors)

    def test_refuse_un_lien_expire(self):
        """On simule l'expiration en réglant la durée de validité en négatif, sans attendre."""
        with override_settings(PASSWORD_RESET_TIMEOUT=-1):
            serializer = self.serializer()

            self.assertFalse(serializer.is_valid())
            self.assertIn("token", serializer.errors)


@tag("unit")
class BuildPasswordResetPayloadTests(TestCase):
    """Contenu du lien envoyé par email."""

    def test_uid_designe_le_compte_et_token_valide(self):
        user = make_user()

        payload = build_password_reset_payload(user)

        self.assertEqual(force_str(urlsafe_base64_decode(payload["uid"])), str(user.pk))
        self.assertTrue(default_token_generator.check_token(user, payload["token"]))


@tag("unit")
class SendPasswordResetEmailTests(TestCase):
    """L'email de réinitialisation. Django remplace l'envoi réel par une boîte en mémoire (mail.outbox)."""

    def setUp(self):
        self.user = make_user()

    def test_envoie_un_seul_email_au_bon_destinataire(self):
        send_password_reset_email(self.user)

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["ada@weeb.fr"])
        self.assertEqual(mail.outbox[0].subject, "Réinitialisation de votre mot de passe Weeb")

    @override_settings(FRONTEND_URL="https://weeb.exemple.fr")
    def test_le_lien_pointe_vers_le_frontend_et_salue_par_le_prenom(self):
        send_password_reset_email(self.user)

        corps = mail.outbox[0].body
        self.assertIn("https://weeb.exemple.fr/reset-password?uid=", corps)
        self.assertIn("&token=", corps)
        self.assertIn("Bonjour Ada", corps)


@tag("unit")
class SeedE2ECommandTests(TestCase):
    """Commande qui prépare les données des tests Playwright (dossier e2e/)."""

    @override_settings(DEBUG=True)
    def test_relancer_la_commande_ne_cree_pas_de_doublon(self):
        call_command("seed_e2e", stdout=StringIO())
        call_command("seed_e2e", stdout=StringIO())

        self.assertEqual(User.objects.count(), 3)
        self.assertEqual(Article.objects.count(), 2)
        self.assertTrue(User.objects.get(email="e2e.auteur@weeb.fr").check_password(VALID_PASSWORD))
        self.assertFalse(User.objects.get(email="e2e.attente@weeb.fr").is_active)

    @override_settings(DEBUG=False)
    def test_refusee_hors_mode_debug(self):
        """Elle crée des comptes au mot de passe connu : jamais sur la base de production."""
        with self.assertRaises(CommandError):
            call_command("seed_e2e", stdout=StringIO())

        self.assertEqual(User.objects.count(), 0)
