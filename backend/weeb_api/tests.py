from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse


class HealthCheckTests(TestCase):
    def test_health_returns_ok_without_authentication(self):
        response = self.client.get(reverse("health"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok", "database": "ok", "version": "dev"})


class SentryDebugTests(TestCase):
    def test_refuse_visitors(self):
        response = self.client.get(reverse("sentry-debug"))

        self.assertIn(response.status_code, (401, 403))

    def test_refuse_non_admin_users(self):
        user = get_user_model().objects.create_user(email="membre@weeb.dev", password="Mdp-Solide-2026")
        self.client.force_login(user)

        response = self.client.get(reverse("sentry-debug"))

        self.assertEqual(response.status_code, 403)

    def test_raises_error_for_admins(self):
        admin = get_user_model().objects.create_superuser(email="admin@weeb.dev", password="Mdp-Solide-2026")
        self.client.force_login(admin)

        with self.assertRaisesMessage(RuntimeError, "Test Sentry backend"):
            self.client.get(reverse("sentry-debug"))
