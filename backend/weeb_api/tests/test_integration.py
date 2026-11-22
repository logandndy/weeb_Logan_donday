"""Tests d'intégration des routes transverses : santé de l'API et route de test Sentry."""

from unittest.mock import patch

from django.test import TestCase, tag
from django.urls import reverse
from rest_framework.test import APIClient

from weeb_api.tests.factories import auth_client, make_admin, make_user


@tag("integration")
class HealthCheckTests(TestCase):
    """GET /api/health/ doit répondre sans authentification."""

    def test_health_repond_ok_sans_authentification(self):
        with patch.dict("os.environ") as env:
            env.pop("RENDER_GIT_COMMIT", None)
            response = self.client.get(reverse("health"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok", "database": "ok", "version": "dev"})

    def test_ping_repond_ok_sans_authentification(self):
        response = self.client.get(reverse("ping"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")


@tag("integration")
class SentryDebugTests(TestCase):
    """GET /api/debug-sentry/ : erreur volontaire, réservée aux administrateurs."""

    def test_refuse_les_visiteurs(self):
        response = self.client.get(reverse("sentry-debug"))

        self.assertEqual(response.status_code, 403)

    def test_refuse_un_utilisateur_valide_non_admin(self):
        # Compte ACTIF : un compte inactif serait traité comme un visiteur
        # et le test passerait sans vérifier la règle « admin seulement ».
        self.client.force_login(make_user(email="membre@weeb.fr"))

        response = self.client.get(reverse("sentry-debug"))

        self.assertEqual(response.status_code, 403)

    def test_refuse_un_utilisateur_valide_non_admin_avec_un_token(self):
        client = auth_client(APIClient(), make_user(email="membre@weeb.fr"))

        self.assertEqual(client.get(reverse("sentry-debug")).status_code, 403)

    def test_leve_l_erreur_pour_un_admin(self):
        self.client.force_login(make_admin())

        # L'erreur est aussi écrite dans les journaux (LOGGING) : visible sur Render.
        with self.assertLogs("django.request", level="ERROR"):
            with self.assertRaisesMessage(RuntimeError, "Test Sentry backend"):
                self.client.get(reverse("sentry-debug"))
