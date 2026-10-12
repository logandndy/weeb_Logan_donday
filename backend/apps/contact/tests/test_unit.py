"""Tests unitaires de l'application `contact` : modèle et sérialiseur, sans HTTP."""

from django.test import SimpleTestCase, TestCase, tag

from apps.contact.models import ContactMessage
from apps.contact.serializers import ContactMessageSerializer

MESSAGE_VALIDE = {
    "first_name": "Logan",
    "last_name": "Donday",
    "email": "logan@weeb.fr",
    "message": "Bravo pour le blog, les articles sont très clairs.",
}


@tag("unit")
class ContactMessageModelTests(TestCase):
    """Affichage dans l'admin et suivi du traitement."""

    def test_str_affiche_le_nom_et_l_email(self):
        message = ContactMessage(**MESSAGE_VALIDE)

        self.assertEqual(str(message), "Logan Donday — logan@weeb.fr")

    def test_un_nouveau_message_n_est_pas_encore_traite(self):
        message = ContactMessage.objects.create(**MESSAGE_VALIDE)

        self.assertFalse(message.is_handled)


@tag("unit")
class ContactMessageSerializerTests(SimpleTestCase):
    """Règles de validation du formulaire de contact."""

    def test_message_de_9_caracteres_refuse(self):
        serializer = ContactMessageSerializer(data={**MESSAGE_VALIDE, "message": "x" * 9})

        self.assertFalse(serializer.is_valid())
        self.assertEqual(
            serializer.errors["message"], ["Le message doit contenir au moins 10 caractères."]
        )

    def test_message_de_10_caracteres_accepte(self):
        serializer = ContactMessageSerializer(data={**MESSAGE_VALIDE, "message": "x" * 10})

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_email_invalide_refuse(self):
        serializer = ContactMessageSerializer(data={**MESSAGE_VALIDE, "email": "pas-un-email"})

        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)

    def test_le_suivi_interne_n_est_pas_expose(self):
        """is_handled sert à l'administrateur : il n'a pas à être renvoyé au visiteur."""
        data = ContactMessageSerializer(ContactMessage(**MESSAGE_VALIDE)).data

        self.assertNotIn("is_handled", data)
