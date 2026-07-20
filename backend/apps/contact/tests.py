"""Tests de l'endpoint du formulaire de contact."""

from rest_framework import status
from rest_framework.test import APITestCase

from .models import ContactMessage


class ContactMessageTests(APITestCase):
    """Le formulaire doit rester ouvert aux visiteurs non authentifiés."""

    url = "/api/contact/"

    def test_enregistre_un_message_valide(self):
        response = self.client.post(
            self.url,
            {
                "first_name": "Logan",
                "last_name": "Donday",
                "email": "logan@weeb.fr",
                "message": "Bravo pour le blog, les articles sont très clairs.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ContactMessage.objects.count(), 1)

    def test_refuse_un_message_trop_court(self):
        response = self.client.post(
            self.url,
            {
                "first_name": "Logan",
                "last_name": "Donday",
                "email": "logan@weeb.fr",
                "message": "court",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(ContactMessage.objects.count(), 0)

    def test_refuse_un_email_invalide(self):
        response = self.client.post(
            self.url,
            {
                "first_name": "Logan",
                "last_name": "Donday",
                "email": "pas-un-email",
                "message": "Bravo pour le blog, les articles sont très clairs.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
