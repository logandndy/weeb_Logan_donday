"""Tests d'intégration de la newsletter : inscription, email de bienvenue, désinscription."""

import re

from django.core import mail
from django.test import override_settings, tag
from rest_framework import status
from rest_framework.test import APITestCase

from apps.newsletter.models import Subscriber
from weeb_api.tests.factories import ThrottleResetMixin


@tag("integration")
class NewsletterTests(ThrottleResetMixin, APITestCase):
    """Le formulaire du pied de page enregistre vraiment l'adresse."""

    def inscrire(self, email):
        return self.client.post("/api/newsletter/", {"email": email}, format="json")

    def test_inscription_enregistree_en_minuscules(self):
        response = self.inscrire("Ada@Weeb.fr")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(Subscriber.objects.filter(email="ada@weeb.fr").exists())

    def test_meme_reponse_si_deja_inscrit_et_pas_de_doublon(self):
        """Une réponse différente révélerait qui est déjà inscrit."""
        premiere = self.inscrire("ada@weeb.fr")
        seconde = self.inscrire("ada@weeb.fr")

        self.assertEqual(premiere.data, seconde.data)
        self.assertEqual(Subscriber.objects.count(), 1)
        self.assertEqual(len(mail.outbox), 1)

    def test_adresse_invalide_refusee(self):
        response = self.inscrire("pas-un-email")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    @override_settings(FRONTEND_URL="https://weeb.exemple.fr")
    def test_parcours_complet_jusqu_a_la_desinscription(self):
        """Inscription -> lien lu dans l'email de bienvenue -> désinscription -> adresse effacée."""
        self.inscrire("ada@weeb.fr")
        token = re.search(r"desinscription\?token=([0-9a-f-]+)", mail.outbox[0].body).group(1)

        response = self.client.post("/api/newsletter/unsubscribe/", {"token": token}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Subscriber.objects.exists())

    def test_un_jeton_inconnu_ne_desinscrit_personne(self):
        self.inscrire("ada@weeb.fr")

        self.client.post(
            "/api/newsletter/unsubscribe/",
            {"token": "00000000-0000-0000-0000-000000000000"},
            format="json",
        )

        self.assertEqual(Subscriber.objects.count(), 1)

    def test_limite_de_10_inscriptions_par_heure(self):
        for numero in range(10):
            self.inscrire(f"lecteur{numero}@weeb.fr")

        self.assertEqual(self.inscrire("lecteur11@weeb.fr").status_code, status.HTTP_429_TOO_MANY_REQUESTS)
