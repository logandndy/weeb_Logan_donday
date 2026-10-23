"""Tests unitaires de la route de santé, appelée directement (sans passer par les URLs)."""

import json
from unittest.mock import patch

from django.test import RequestFactory, TestCase, override_settings, tag

from weeb_api.mail import send_email
from weeb_api.views import health, ping


@tag("unit")
class HealthViewTests(TestCase):
    """La vue de santé est lue par Render, Docker et le smoke test du pipeline."""

    def appeler(self):
        response = health(RequestFactory().get("/api/health/"))
        return response.status_code, json.loads(response.content)

    def test_ok_quand_la_base_repond(self):
        # On retire RENDER_GIT_COMMIT s'il existe sur la machine, pour obtenir "dev".
        with patch.dict("os.environ") as env:
            env.pop("RENDER_GIT_COMMIT", None)
            code, data = self.appeler()

        self.assertEqual(code, 200)
        self.assertEqual(data, {"status": "ok", "database": "ok", "version": "dev"})

    def test_version_lue_depuis_render_git_commit(self):
        """C'est cette valeur que le smoke test compare au commit qui vient d'être déployé."""
        with patch.dict("os.environ", {"RENDER_GIT_COMMIT": "abc123"}):
            _, data = self.appeler()

        self.assertEqual(data["version"], "abc123")

    def test_503_si_la_base_ne_repond_pas(self):
        """Un 503 fait échouer la sonde et déclenche l'alerte de monitoring."""
        with patch("weeb_api.views.connection.cursor", side_effect=Exception("base injoignable")):
            code, data = self.appeler()

        self.assertEqual(code, 503)
        self.assertEqual(data["database"], "unreachable")


@tag("unit")
class PingViewTests(TestCase):
    """La route ping est appelée en continu : elle ne doit jamais toucher la base."""

    def test_ok_sans_interroger_la_base(self):
        # Si la vue ouvrait un curseur, le mock lèverait une erreur.
        with patch("django.db.connection.cursor", side_effect=AssertionError("base interrogée")):
            response = ping(RequestFactory().get("/api/ping/"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content)["status"], "ok")

    def test_version_lue_depuis_render_git_commit(self):
        with patch.dict("os.environ", {"RENDER_GIT_COMMIT": "abc123"}):
            response = ping(RequestFactory().get("/api/ping/"))

        self.assertEqual(json.loads(response.content)["version"], "abc123")


@tag("unit")
class SendEmailTests(TestCase):
    """Envoi des emails : en arrière-plan en production, immédiat pendant les tests."""

    @override_settings(EMAIL_BACKEND="anymail.backends.brevo.EmailBackend")
    def test_en_production_l_envoi_part_en_arriere_plan(self):
        with patch("weeb_api.mail.threading.Thread") as thread:
            send_email("Sujet", "Message", ["ada@weeb.fr"])

        thread.assert_called_once()
        thread.return_value.start.assert_called_once()

    def test_aucun_envoi_sans_destinataire(self):
        with patch("weeb_api.mail.send_mail") as envoi:
            send_email("Sujet", "Message", [])

        envoi.assert_not_called()
