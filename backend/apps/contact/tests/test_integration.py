"""Tests d'intégration de l'endpoint du formulaire de contact (POST /api/contact/)."""

from django.test import tag
from rest_framework import status
from rest_framework.test import APITestCase

from apps.contact.models import ContactMessage
from weeb_api.tests.factories import ThrottleResetMixin

MESSAGE_VALIDE = {
    "first_name": "Logan",
    "last_name": "Donday",
    "email": "logan@weeb.fr",
    "message": "Bravo pour le blog, les articles sont très clairs.",
}


@tag("integration")
class ContactMessageTests(ThrottleResetMixin, APITestCase):
    """Le formulaire reste ouvert aux visiteurs non authentifiés, mais limité contre le spam."""

    url = "/api/contact/"

    def test_enregistre_un_message_valide(self):
        response = self.client.post(self.url, MESSAGE_VALIDE, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ContactMessage.objects.count(), 1)

    def test_la_reponse_ne_contient_pas_le_suivi_interne(self):
        response = self.client.post(self.url, MESSAGE_VALIDE, format="json")

        self.assertNotIn("is_handled", response.data)

    def test_refuse_un_message_trop_court(self):
        response = self.client.post(self.url, {**MESSAGE_VALIDE, "message": "court"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ContactMessage.objects.count(), 0)

    def test_refuse_un_email_invalide(self):
        response = self.client.post(self.url, {**MESSAGE_VALIDE, "email": "pas-un-email"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_impossible_de_lire_les_messages(self):
        """Les messages contiennent des données personnelles : seule l'admin Django les affiche."""
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_bloque_au_dela_de_10_messages_par_heure(self):
        for _ in range(10):
            self.client.post(self.url, MESSAGE_VALIDE, format="json")

        response = self.client.post(self.url, MESSAGE_VALIDE, format="json")

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
