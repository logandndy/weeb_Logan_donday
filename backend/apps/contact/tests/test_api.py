"""Tests de l'endpoint du formulaire de contact."""

from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APITestCase

from apps.contact.models import ContactMessage

MESSAGE_VALIDE = {
    "first_name": "Logan",
    "last_name": "Donday",
    "email": "logan@weeb.fr",
    "message": "Bravo pour le blog, les articles sont très clairs.",
}


class ContactMessageTests(APITestCase):
    """Le formulaire doit rester ouvert aux visiteurs non authentifiés."""

    url = "/api/contact/"

    def setUp(self):
        cache.clear()  # remet à zéro les compteurs de throttling

    def test_enregistre_un_message_valide(self):
        response = self.client.post(self.url, MESSAGE_VALIDE, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ContactMessage.objects.count(), 1)

    def test_refuse_un_message_trop_court(self):
        response = self.client.post(self.url, {**MESSAGE_VALIDE, "message": "court"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ContactMessage.objects.count(), 0)

    def test_refuse_un_email_invalide(self):
        response = self.client.post(self.url, {**MESSAGE_VALIDE, "email": "pas-un-email"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bloque_au_dela_de_10_messages_par_heure(self):
        for _ in range(10):
            self.client.post(self.url, MESSAGE_VALIDE, format="json")

        response = self.client.post(self.url, MESSAGE_VALIDE, format="json")

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
