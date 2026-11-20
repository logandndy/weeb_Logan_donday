"""Tests unitaires du modèle des inscrits à la newsletter."""

from django.test import TestCase, tag

from apps.newsletter.models import Subscriber


@tag("unit")
class SubscriberModelTests(TestCase):
    """Chaque inscrit reçoit un jeton de désinscription secret et unique."""

    def test_chaque_inscrit_a_son_propre_jeton(self):
        ada = Subscriber.objects.create(email="ada@weeb.fr")
        bob = Subscriber.objects.create(email="bob@weeb.fr")

        self.assertNotEqual(ada.unsubscribe_token, bob.unsubscribe_token)

    def test_str_affiche_l_email(self):
        self.assertEqual(str(Subscriber(email="ada@weeb.fr")), "ada@weeb.fr")
