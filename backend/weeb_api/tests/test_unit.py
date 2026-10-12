"""Tests unitaires de la route de santé, appelée directement (sans passer par les URLs)."""

import json
from unittest.mock import patch

from django.test import RequestFactory, TestCase, tag

from weeb_api.views import health


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
